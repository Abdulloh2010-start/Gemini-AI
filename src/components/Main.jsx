// Main.jsx
import { useState, useEffect, useRef } from "react";
import { assets } from "../assets/assets";

export default function Main({ isLoadingChat, messages, onSend, onBotReply, onToggleMobileSidebar }) {
  const [input, setInput] = useState("");
  const [botTyping, setBotTyping] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState([]); // Локальное состояние для отображения сообщений
  const bottomRef = useRef(null);
  const currentChatIdRef = useRef(null); // Для хранения активного chatId во время отправки

  // Синхронизация displayedMessages с пропсом messages
  useEffect(() => {
    setDisplayedMessages(messages);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || botTyping) return;

    const userMessageText = input;
    setInput("");
    setBotTyping(true);

    // Добавляем сообщение пользователя сразу в локальное состояние
    setDisplayedMessages(prev => [...prev, { sender: "user", text: userMessageText }]);

    // Отправляем сообщение в Render (для создания/обновления чата в Firebase)
    const newChatId = await onSend(userMessageText);
    currentChatIdRef.current = newChatId; // Сохраняем ID чата

    if (!newChatId) {
      setBotTyping(false);
      // Возможно, отобразить ошибку пользователю
      setDisplayedMessages(prev => [...prev, { sender: "bot", text: "Произошла ошибка при создании/отправке чата." }]);
      return;
    }

    // Добавляем placeholder для ответа бота в локальное состояние
    setDisplayedMessages(prev => [...prev, { sender: "bot", text: "..." }]); // Имитация начала ответа

    try {
      const res = await fetch(import.meta.env.VITE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: userMessageText }] }]
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Извините, не могу ответить сейчас.";

      // Запускаем анимацию "печати"
      typeBotResponse(botText, newChatId);

    } catch (err) {
      console.error("Ошибка при запросе к API:", err);
      typeBotResponse("Произошла ошибка при получении ответа от AI.", newChatId);
    }
  };

  const typeBotResponse = (text, chatIdForReply) => {
    let currentPrintedText = "";
    let index = 0;

    const interval = setInterval(() => {
      currentPrintedText += text[index];
      index++;

      // Обновляем последнее сообщение (бота) в локальном состоянии
      setDisplayedMessages(prev => {
        const newArr = [...prev];
        // Находим последнее сообщение (предполагаем, что оно от бота и его надо обновить)
        if (newArr.length > 0 && newArr[newArr.length - 1].sender === "bot") {
          newArr[newArr.length - 1].text = currentPrintedText;
        } else {
          // Если по какой-то причине нет последнего сообщения бота, добавляем новое
          newArr.push({ sender: "bot", text: currentPrintedText });
        }
        return newArr;
      });

      if (index >= text.length) {
        clearInterval(interval);
        setBotTyping(false);
        // Как только бот "допечатал", сохраняем полный ответ в Firebase
        // `onBotReply` в Render.jsx теперь обновит Firestore,
        // а `onSnapshot` вернет обновленные сообщения в пропс `messages`.
        // `useEffect` выше обновит `displayedMessages`.
        onBotReply(chatIdForReply, text);
      }
    }, 15); // Скорость печати
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!botTyping && !isLoadingChat) handleSend();
    }
  };

  // Прокрутка вниз при добавлении сообщений или изменении состояния печати бота
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayedMessages, botTyping, isLoadingChat]); // Зависит от локального состояния сообщений

  return (
    <div className="flex-1 flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="w-full px-5 pt-5 pb-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img
            src={assets.menu_icon}
            alt="Menu"
            className="w-6 cursor-pointer sm:hidden"
            onClick={onToggleMobileSidebar}
          />
          <p className="text-xl font-medium text-[#202123]">Gemini</p>
        </div>
        <button className="bg-[#e5eaf1] text-[#3c4043] text-sm px-3 py-1 rounded-md">
          2.0 Flash
        </button>
      </div>

      {/* Messages */}
      {/* Теперь отображаем displayedMessages из локального состояния */}
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-20"> {/* Добавил pb-20 для отступа от инпута */}
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {displayedMessages.length === 0 && !isLoadingChat && (
            <h1 className="text-2xl sm:text-3xl text-center mt-60 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 font-semibold">
              Здравствуйте, Abdulloh!
            </h1>
          )}

          {displayedMessages.map((msg, i) => {
            const isUser = msg.sender === "user";
            return (
              <div
                key={i}
                className={`max-w-[80%] px-4 py-3 text-sm sm:text-base whitespace-pre-wrap ${isUser ? "self-end bg-blue-500 text-white" : "self-start bg-gray-100 text-gray-900"} rounded-2xl ${isUser ? "rounded-tr-sm" : "rounded-tl-sm"}`}
              >
                {msg.text}
              </div>
            );
          })}

          {/* Лоадер для загрузки чата (или первого сообщения) */}
          {isLoadingChat && displayedMessages.length === 0 && (
            <div className="text-center text-gray-400 text-sm animate-pulse">Загрузка чата...</div>
          )}
          {/* Лоадер для печати бота */}
          {botTyping && displayedMessages.length > 0 && displayedMessages[displayedMessages.length - 1].sender === "bot" && displayedMessages[displayedMessages.length - 1].text === "..." && (
              <div className="text-center text-gray-400 text-sm animate-pulse">Бот печатает...</div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-white z-10 p-4"> {/* Добавил p-4 для отступов */}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 bg-[#f0f4f9] rounded-full px-4 py-2 shadow-md">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Спросить Gemini..."
              className="flex-1 resize-none bg-transparent outline-none text-sm sm:text-base text-[#202123] max-h-[150px] overflow-y-auto"
            ></textarea>
            <button
              onClick={handleSend}
              disabled={botTyping || isLoadingChat || input.trim() === ""} // Кнопка неактивна, если бот печатает, идет загрузка или ввод пустой
              className={`w-9 h-9 flex items-center justify-center rounded-full transition ${botTyping || isLoadingChat || input.trim() === "" ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"}`}
            >
              <img src={assets.send_icon} alt="send" className="w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}