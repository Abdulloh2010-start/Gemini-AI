import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Main from "./Main";
import MobileSidebar from "./MobileSidebar";
import AuthForm from "./AuthForm";
import ProfileModal from "./ProfileModal";
import RenameModal from "./RenameModal";
import { db, auth, signOut } from "../Firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  collection,
  addDoc,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  doc,
  query,
  where
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function Render() {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [isLoadingChatsList, setIsLoadingChatsList] = useState(true);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [currentModalChatId, setCurrentModalChatId] = useState(null);
  const [initialRenameTitle, setInitialRenameTitle] = useState("");

  const [user, setUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileModalPosition, setProfileModalPosition] = useState({ top: 0, right: 0 });
  const [isChangingAccount, setIsChangingAccount] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsChangingAccount(false);
      if (!currentUser) {
        setChats([]);
        setActiveChatId(null);
        setActiveMessages([]);
      }
      setIsLoadingChatsList(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileModal && !event.target.closest(".profile-modal-container")) {
        setShowProfileModal(false);
      }
    };
    if (showProfileModal) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileModal]);

  useEffect(() => {
    if (!user) {
      setChats([]);
      return;
    }
    setIsLoadingChatsList(true);
    const q = query(collection(db, "chats"), where("userId", "==", user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const loadedChats = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      loadedChats.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setChats(loadedChats);
      if (activeChatId && !loadedChats.some(chat => chat.id === activeChatId)) {
        setActiveChatId(null);
        setActiveMessages([]);
      }
      setIsLoadingChatsList(false);
    }, (error) => {
      console.error("Ошибка загрузки списка чатов:", error);
      setIsLoadingChatsList(false);
    });
    return () => unsub();
  }, [user, activeChatId]);

  const loadMessages = async (chatId) => {
    if (chatId === activeChatId) {
      setShowMobileSidebar(false);
      return;
    }
    setIsLoadingChat(true);
    setShowMobileSidebar(false);
    try {
      const chatRef = doc(db, "chats", chatId);
      const docSnap = await getDoc(chatRef);
      if (docSnap.exists() && docSnap.data().userId === user?.uid) {
        setActiveMessages(docSnap.data().messages || []);
        setActiveChatId(chatId);
      } else {
        setActiveChatId(null);
        setActiveMessages([]);
      }
    } catch (error) {
      console.error("Ошибка загрузки сообщений:", error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const createChat = async (firstMsg) => {
    if (!user) return null;
    setIsLoadingChat(true);
    try {
      const docRef = await addDoc(collection(db, "chats"), {
        title: firstMsg.substring(0, 20) + "...",
        messages: [{ sender: "user", text: firstMsg }],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        userId: user.uid
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

  const updateChat = async (chatId, updatedMessages) => {
    if (!user || !chatId) return;
    try {
      const chatRef = doc(db, "chats", chatId);
      const docSnap = await getDoc(chatRef);
      if (docSnap.exists() && docSnap.data().userId === user?.uid) {
        await setDoc(chatRef, { messages: updatedMessages, updatedAt: Date.now() }, { merge: true });
      }
    } catch (error) {
      console.error("Ошибка обновления чата:", error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (!user || !chatId) return;
    setIsLoadingChat(true);
    try {
      const chatRef = doc(db, "chats", chatId);
      const docSnap = await getDoc(chatRef);
      if (docSnap.exists() && docSnap.data().userId === user?.uid) {
        await deleteDoc(chatRef);
        if (chatId === activeChatId) {
          setActiveChatId(null);
          setActiveMessages([]);
        }
      }
    } catch (error) {
      console.error("Ошибка удаления чата:", error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleRenameChat = async (chatId, newTitle) => {
    if (!user || !chatId) return;
    setIsLoadingChat(true);
    try {
      const chatRef = doc(db, "chats", chatId);
      const docSnap = await getDoc(chatRef);
      if (docSnap.exists() && docSnap.data().userId === user?.uid) {
        await setDoc(chatRef, { title: newTitle, updatedAt: Date.now() }, { merge: true });
      }
      setShowRenameModal(false);
    } catch (error) {
      console.error("Ошибка переименования чата:", error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSendMessage = async (msg) => {
    if (!user) return null;
    let currentChatId = activeChatId;
    if (!currentChatId) {
      currentChatId = await createChat(msg);
      if (!currentChatId) return null;
    } else {
      const updated = [...activeMessages, { sender: "user", text: msg }];
      await updateChat(currentChatId, updated);
    }
    return currentChatId;
  };

  const handleBotReply = async (chatId, msgText) => {
    if (!user || !chatId) return;
    try {
      const chatRef = doc(db, "chats", chatId);
      const docSnap = await getDoc(chatRef);
      if (docSnap.exists() && docSnap.data().userId === user?.uid) {
        const currentMessages = docSnap.data().messages || [];
        const updatedMessages = [...currentMessages, { sender: "bot", text: msgText }];
        await setDoc(chatRef, { messages: updatedMessages, updatedAt: Date.now() }, { merge: true });
      }
    } catch (error) {
      console.error("Ошибка при сохранении ответа бота:", error);
    }
  };

  const openRenameModal = (chatId) => {
    const chatToRename = chats.find(chat => chat.id === chatId);
    if (chatToRename && chatToRename.userId === user?.uid) {
      setInitialRenameTitle(chatToRename.title);
      setCurrentModalChatId(chatId);
      setShowRenameModal(true);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowProfileModal(false);
    } catch (error) {
      console.error("Ошибка выхода:", error);
      alert("Не удалось выйти. Попробуйте снова.");
    }
  };

  const handleChangeAccount = async () => {
    try {
      setIsChangingAccount(true);
      await signOut(auth); 
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider); 
    } catch (error) {
      console.error("Ошибка при смене аккаунта:", error);
      setIsChangingAccount(false);
    }
  };

  const handleOpenProfileModal = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setProfileModalPosition({
      top: rect.bottom + 10,
      right: window.innerWidth - rect.right
    });
    setShowProfileModal(true);
  };

  if (!user && !isChangingAccount) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f0f4f9]">
        <AuthForm onAuthSuccess={() => {}} />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {isLoadingChatsList && (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[1000]">
          <svg className="animate-spin h-10 w-10 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="ml-4 text-lg text-blue-600">Загрузка...</p>
        </div>
      )}

      {showProfileModal && (
        <div className="absolute z-[100] profile-modal-container" style={{ top: profileModalPosition.top, right: profileModalPosition.right }}>
          <ProfileModal user={user} onClose={() => setShowProfileModal(false)} onSignOut={handleSignOut} onChangeAccount={handleChangeAccount} />
        </div>
      )}

      <Sidebar chats={chats} activeChatId={activeChatId} onSelectChat={loadMessages} onNewChat={() => { setActiveChatId(null); setActiveMessages([]); }} onRenameChat={openRenameModal} onDeleteChat={handleDeleteChat} pinned={sidebarPinned} onTogglePinned={setSidebarPinned} user={user} />

      <Main isLoadingChat={isLoadingChat} messages={activeMessages} onSend={handleSendMessage} onBotReply={handleBotReply} onToggleMobileSidebar={() => setShowMobileSidebar(!showMobileSidebar)} user={user} onOpenProfileModal={handleOpenProfileModal} />

      {showMobileSidebar && (
        <MobileSidebar onClose={() => setShowMobileSidebar(false)} onSelectChat={loadMessages} onNewChat={() => { setActiveChatId(null); setActiveMessages([]); setShowMobileSidebar(false); }} onRenameChat={openRenameModal} onDeleteChat={handleDeleteChat} chats={chats} activeChatId={activeChatId} user={user} onOpenProfileModal={() => { setShowProfileModal(true); setShowMobileSidebar(false); }} />
      )}

      {showRenameModal && (
            <RenameModal chatId={currentModalChatId} initialTitle={initialRenameTitle} onClose={() => setShowRenameModal(false)} onRename={handleRenameChat} />
      )}
    </div>
  )
};