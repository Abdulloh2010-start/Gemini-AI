import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Main from "./Main";
import MobileSidebar from "./MobileSidebar";
import { db } from "../Firebase";
import {
  collection,
  addDoc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  doc,
} from "firebase/firestore";

export default function Render() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false); // Для загрузки сообщений активного чата
  const [isLoadingChatsList, setIsLoadingChatsList] = useState(true); // Для первоначальной загрузки списка чатов
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [currentModalChatId, setCurrentModalChatId] = useState(null);
  const [initialRenameTitle, setInitialRenameTitle] = useState("");


  // Загрузка чатов из Firebase
  useEffect(() => {
    setIsLoadingChatsList(true); // Начинаем загрузку списка чатов
    const unsub = onSnapshot(collection(db, "chats"), (snapshot) => {
      const loadedChats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      loadedChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setChats(loadedChats);

      if (activeChatId && !loadedChats.some(chat => chat.id === activeChatId)) {
        // Если активный чат был удален, сбрасываем его
        setActiveChatId(null);
        setActiveMessages([]);
      }
      setIsLoadingChatsList(false); // Заканчиваем загрузку списка чатов
    }, (error) => {
      console.error("Ошибка загрузки списка чатов:", error);
      setIsLoadingChatsList(false);
    });
    return () => unsub(); // Отписываемся при размонтировании компонента
  }, [activeChatId]); // Зависимость от activeChatId для сброса, если чат удален

  // Загрузка сообщений для выбранного чата
  const loadMessages = async (chatId) => {
    if (chatId === activeChatId) { // Если чат уже активен, ничего не делаем
      setShowMobileSidebar(false); // Все равно закрываем мобильный сайдбар
      return;
    }
    setIsLoadingChat(true); // Начало загрузки сообщений для нового чата
    setShowMobileSidebar(false); // Закрываем мобильный сайдбар при выборе чата
    try {
      const chatRef = doc(db, "chats", chatId);
      const docSnap = await getDoc(chatRef);
      if (docSnap.exists()) {
        setActiveMessages(docSnap.data().messages || []);
        setActiveChatId(chatId);
      } else {
        // Чат не найден, сбрасываем активный
        setActiveChatId(null);
        setActiveMessages([]);
      }
    } catch (error) {
      console.error("Ошибка загрузки сообщений:", error);
    } finally {
      setIsLoadingChat(false); // Конец загрузки сообщений
    }
  };

  // Создание нового чата
  const createChat = async (firstMsg) => {
    setIsLoadingChat(true); // Показываем лоадер при создании нового чата
    try {
      const docRef = await addDoc(collection(db, "chats"), {
        title: firstMsg.substring(0, 20) + "...", // Заголовок из первых 20 символов
        messages: [{ sender: "user", text: firstMsg }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      setActiveChatId(docRef.id);
      setActiveMessages([{ sender: "user", text: firstMsg }]);
      return docRef.id;
    } catch (error) {
      console.error("Ошибка создания чата:", error);
      return null;
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Обновление существующего чата
  const updateChat = async (chatId, updatedMessages) => {
    try {
      const chatRef = doc(db, "chats", chatId);
      await setDoc(chatRef, { messages: updatedMessages, updatedAt: Date.now() }, { merge: true });
      // setActiveMessages(updatedMessages); // Это теперь не нужно, onSnapshot обновит сам
    } catch (error) {
      console.error("Ошибка обновления чата:", error);
    }
  };

  // Удаление чата
  const handleDeleteChat = async (chatId) => {
    setIsLoadingChat(true); // Показываем лоадер при удалении
    try {
      await deleteDoc(doc(db, "chats", chatId));
      if (chatId === activeChatId) {
        setActiveChatId(null);
        setActiveMessages([]);
      }
      setShowDeleteConfirm(false); // Закрываем модалку после удаления
    } catch (error) {
      console.error("Ошибка удаления чата:", error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Переименование чата
  const handleRenameChat = async (chatId, newTitle) => {
    setIsLoadingChat(true); // Показываем лоадер при переименовании
    try {
      const chatRef = doc(db, "chats", chatId);
      await setDoc(chatRef, { title: newTitle, updatedAt: Date.now() }, { merge: true });
      setShowRenameModal(false); // Закрываем модалку после переименования
    } catch (error) {
      console.error("Ошибка переименования чата:", error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Отправка сообщения (пользователя)
  const handleSendMessage = async (msg) => {
    let currentChatId = activeChatId;
    if (!currentChatId) {
      // Если чат не активен, создаем новый
      currentChatId = await createChat(msg);
      if (!currentChatId) return null; // Ошибка создания чата
    } else {
      // Иначе добавляем сообщение к существующему чату
      const updated = [...activeMessages, { sender: "user", text: msg }];
      await updateChat(currentChatId, updated);
    }
    return currentChatId; // Возвращаем ID чата для дальнейшей работы с AI
  };

  // Обработка ответа бота
  const handleBotReply = async (chatId, msgText) => {
    // Получаем текущие сообщения, добавляем ответ бота и обновляем в Firebase
    const chatRef = doc(db, "chats", chatId);
    const docSnap = await getDoc(chatRef);
    if (docSnap.exists()) {
      const currentMessages = docSnap.data().messages || [];
      const updatedMessages = [...currentMessages, { sender: "bot", text: msgText }];
      await setDoc(chatRef, { messages: updatedMessages, updatedAt: Date.now() }, { merge: true });
    }
  };

  // Функции для управления модальными окнами
  const openRenameModal = (chatId) => {
    const chatToRename = chats.find(chat => chat.id === chatId);
    if (chatToRename) {
      setInitialRenameTitle(chatToRename.title);
      setCurrentModalChatId(chatId);
      setShowRenameModal(true);
    }
  };

  const openDeleteConfirm = (chatId) => {
    setCurrentModalChatId(chatId);
    setShowDeleteConfirm(true);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {isLoadingChatsList && ( // Лоадер для загрузки списка чатов
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1000]">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="ml-4 text-lg text-blue-600">Загрузка...</p>
        </div>
      )}

      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={loadMessages}
        onNewChat={() => {
          setActiveChatId(null);
          setActiveMessages([]);
          setShowMobileSidebar(false); // Закрываем мобильный сайдбар при создании нового чата
        }}
        onRenameChat={openRenameModal}
        onDeleteChat={openDeleteConfirm}
        pinned={sidebarPinned}
        onTogglePinned={setSidebarPinned}
      />

      <Main
        isLoadingChat={isLoadingChat} // Передаем состояние загрузки активного чата
        messages={activeMessages} // Передаем активные сообщения
        onSend={handleSendMessage} // Передаем функцию отправки сообщения
        onBotReply={handleBotReply} // Передаем функцию для ответа бота
        onToggleMobileSidebar={() => setShowMobileSidebar(!showMobileSidebar)}
      />

      {showMobileSidebar && (
        <MobileSidebar
          onClose={() => setShowMobileSidebar(false)}
          onSelectChat={loadMessages}
          onNewChat={() => {
            setActiveChatId(null);
            setActiveMessages([]);
            setShowMobileSidebar(false);
          }}
          chats={chats}
          activeChatId={activeChatId}
        />
      )}

      {/* Модальное окно переименования */}
      {showRenameModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <RenameModal
              chatId={currentModalChatId}
              initialTitle={initialRenameTitle}
              onClose={() => setShowRenameModal(false)}
              onRename={handleRenameChat}
            />
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
            <p className="mb-4 text-center">Удалить этот чат?</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Отмена
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => handleDeleteChat(currentModalChatId)}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Компонент модального окна переименования
function RenameModal({ chatId, initialTitle, onClose, onRename }) {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setTitle(initialTitle); // Обновляем заголовок при изменении initialTitle (например, при открытии для другого чата)
  }, [initialTitle]);

  const handleSave = () => {
    if (title.trim() !== "") {
      onRename(chatId, title);
    } else {
      alert("Название чата не может быть пустым!");
    }
  };

  return (
    <div>
      <p className="mb-2 text-lg font-semibold">Новое имя чата:</p>
      <input
        className="w-full border px-3 py-2 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Введите название"
        autoFocus // Автофокус на поле ввода
        onKeyPress={(e) => {
          if (e.key === "Enter") {
            handleSave();
          }
        }}
      />
      <div className="flex justify-end gap-2">
        <button
          className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          onClick={onClose}
        >
          Отмена
        </button>
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          onClick={handleSave}
        >
          Сохранить
        </button>
      </div>
    </div>
  );
}