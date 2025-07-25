import { useState, useEffect, useRef } from 'react';
import { assets } from '../assets/assets';

export default function Main({ isLoadingChat, messages, onSend, onBotReply, onToggleMobileSidebar, user, onOpenProfileModal }) {
  const [input, setInput] = useState('');
  const [imageBase64, setImageBase64] = useState(null);
  const [botTyping, setBotTyping] = useState(false);
  const [displayedMessages, setDisplayedMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const currentChatIdRef = useRef(null);

  useEffect(() => {
    setDisplayedMessages(messages);
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedMessages, botTyping, isLoadingChat]);

  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'Пользователь';
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const startRecording = async () => {
    try {
      setAudioBase64(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioBase64(reader.result);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Ошибка при доступе к микрофону:', error);
      alert('Не удалось получить доступ к микрофону. Убедитесь, что вы предоставили разрешение.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !imageBase64 && !audioBase64) || botTyping) return;
    if (!user) {
      console.error('Пожалуйста, войдите, чтобы начать чат.');
      return;
    }

    const userMessageText = input;
    const currentImageBase64 = imageBase64;
    const currentAudioBase64 = audioBase64;

    setInput('');
    setImageBase64(null);
    setAudioBase64(null);
    setBotTyping(true);

    setDisplayedMessages(prev => [
      ...prev,
      { sender: 'user', text: userMessageText, image: currentImageBase64, audio: currentAudioBase64 }
    ]);

    const newChatId = await onSend(userMessageText);
    currentChatIdRef.current = newChatId;

    const parts = [];
    if (userMessageText) parts.push({ text: userMessageText });
    if (currentImageBase64) {
      parts.push({
        inlineData: {
          mimeType: currentImageBase64.split(',')[0].split(':')[1].split(';')[0],
          data: currentImageBase64.split(',')[1],
        },
      });
    }
    if (currentAudioBase64) {
      parts.push({
        inlineData: {
          mimeType: currentAudioBase64.split(',')[0].split(':')[1].split(';')[0],
          data: currentAudioBase64.split(',')[1],
        },
      });
    }

    const requestBody = {
      contents: [
        { parts: parts },
      ],
    };

    setDisplayedMessages(prev => [...prev, { sender: 'bot', text: '...' }]);

    try {
      const apiKey = import.meta.env.VITE_API_KEY;
      const apiUrl = import.meta.env.VITE_API_URL;

      if (!apiKey || !apiUrl) {
        throw new Error('Отсутствуют VITE_API_KEY или VITE_API_URL');
      }

      const fullUrl = `${apiUrl}?key=${apiKey}`;
      const res = await fetch(fullUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!res.ok) {
        console.error('Response status:', res.status);
        const errBody = await res.text();
        console.error('Body:', errBody);
        throw new Error('Ошибка API: ' + res.status);
      }

      const data = await res.json();
      const botParts = data.candidates?.[0]?.content?.parts || [];
      const text = botParts.filter(p => p.text)?.map(p => p.text).join('\n');
      const botImagePart = botParts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('image/'));
      const botAudioPart = botParts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('audio/'));

      if (botImagePart || botAudioPart) {
        const imgSrc = botImagePart ? `data:${botImagePart.inlineData.mimeType};base64,${botImagePart.inlineData.data}` : null;
        const audioSrc = botAudioPart ? `data:${botAudioPart.inlineData.mimeType};base64,${botAudioPart.inlineData.data}` : null;
        
        setDisplayedMessages(prev => {
          const newArr = [...prev];
          if (newArr.length > 0 && newArr[newArr.length - 1].sender === 'bot') {
            newArr[newArr.length - 1] = { sender: 'bot', text: text || '', image: imgSrc, audio: audioSrc };
          } else {
            newArr.push({ sender: 'bot', text: text || '', image: imgSrc, audio: audioSrc });
          }
          return newArr;
        });
        setBotTyping(false);
        onBotReply(newChatId, text || '');
      } else {
        typeBotResponse(text || '... нет текста', newChatId);
      }
    } catch (err) {
      console.error('Ошибка при получении ответа:', err);
      setBotTyping(false);
      typeBotResponse('Произошла ошибка при получении ответа от AI.', newChatId);
    } finally {
    }
  };

  const typeBotResponse = (text, chatIdForReply) => {
    let currentPrintedText = '';
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        currentPrintedText += text[index];
        index++;
        setDisplayedMessages(prev => {
          const newArr = [...prev];
          if (newArr.length > 0 && newArr[newArr.length - 1].sender === 'bot' && newArr[newArr.length - 1].text === '...') {
            newArr[newArr.length - 1].text = currentPrintedText;
          } else if (newArr.length > 0 && newArr[newArr.length - 1].sender === 'bot') {
            newArr[newArr.length - 1].text = currentPrintedText;
          } else {
            newArr.push({ sender: 'bot', text: currentPrintedText });
          }
          return newArr;
        });
      } else {
        clearInterval(interval);
        setBotTyping(false);
        onBotReply(chatIdForReply, text);
      }
    }, 15);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!botTyping && !isLoadingChat && (input.trim() || imageBase64 || audioBase64)) {
        handleSend();
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-white">
      <div className="w-full px-5 pt-5 pb-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={assets.menu_icon} alt="Меню" className="w-6 cursor-pointer sm:hidden" onClick={onToggleMobileSidebar} />
          <p className="text-xl font-medium text-[#202123]">Gemini</p>
        </div>
        {user && (
          <div className="flex items-center gap-2 cursor-pointer" onClick={onOpenProfileModal}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="Аватар пользователя" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">{user.email ? user.email[0].toUpperCase() : 'U'}</div>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-20">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {displayedMessages.length === 0 && !isLoadingChat && (
            <h1 className="text-2xl sm:text-3xl text-center mt-60 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 font-semibold">
              Здравствуйте, {getUserDisplayName()}!
            </h1>
          )}
          {displayedMessages.map((msg, i) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={i} className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {isUser && (
                  <div className="w-[30px] h-[30px] flex-shrink-0 order-2">
                    <img src={user?.photoURL || assets.user_icon} alt="Пользователь" className="w-full h-full rounded-full object-cover" />
                  </div>
                )}
                {!isUser && ( 
                  <div className="w-[30px] h-[30px] flex-shrink-0">
                    <img src={assets.gemini_icon} alt="Gemini" className="w-full h-full rounded-full object-cover" />
                  </div>
                )}
                <div className={`px-4 py-3 text-sm sm:text-base whitespace-pre-wrap break-words rounded-2xl max-w-[80%] ${isUser ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-900 rounded-tl-sm'}`}>
                  {msg.text && <p>{msg.text}</p>}
                  {msg.image && <img src={msg.image} alt="Загруженное изображение" className="mt-2 rounded-xl max-w-xs" />}
                  {msg.audio && <audio controls src={msg.audio} className="mt-2 w-full"></audio>}
                </div>
              </div>
            );
          })}
          {isLoadingChat && displayedMessages.length === 0 && (
            <div className="text-center text-gray-400 text-sm animate-pulse">Загрузка чата...</div>
          )}
          {botTyping && displayedMessages.length > 0 && (
            <div className="text-center text-gray-400 text-sm animate-pulse">Бот печатает...</div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="sticky bottom-0 bg-white z-10 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col gap-2 bg-[#f0f4f9] rounded-2xl px-4 py-2 shadow-md">
            {(imageBase64 || audioBase64) && (
              <div className="flex items-center justify-between p-2 bg-gray-200 rounded-lg">
                {imageBase64 && (
                  <div className="flex items-center gap-2">
                    <img src={imageBase64} alt="Предпросмотр изображения" className="h-12 w-12 object-cover rounded-md" />
                    <span className="text-sm text-gray-600">Изображение</span>
                  </div>
                )}
                {audioBase64 && (
                  <div className="flex items-center gap-2">
                    <audio controls src={audioBase64} className="w-48"></audio>
                    <span className="text-sm text-gray-600">Голосовое</span>
                  </div>
                )}
                <button onClick={() => { setImageBase64(null); setAudioBase64(null); }} className="p-1 rounded-full hover:bg-gray-300">
                  <img src={assets.close_icon} alt="Удалить" className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-end gap-3">
              <button onClick={() => fileInputRef.current.click()} className="text-sm text-blue-500 p-2 rounded-full hover:bg-gray-200">
                <img src={assets.gallery_icon} alt="Галерея" className='w-[20px] h-[20px] cursor-pointer' />
              </button>
              <button onClick={isRecording ? stopRecording : startRecording} className={`w-9 h-9 flex cursor-pointer items-center justify-center rounded-full transition ${isRecording ? 'bg-red-500 animate-pulse' : 'hover:bg-gray-200'}`}>
                <img src={isRecording ? assets.mic_stop_icon : assets.mic_icon} alt="Голос" className="w-5" />
              </button>
              <textarea rows={1}value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="Спросить Gemini..." className="flex-1 resize-none bg-transparent outline-none text-sm sm:text-base text-[#202123] max-h-[150px] overflow-y-auto py-2"/>
              <input type="file" accept="image/*" onChange={handleImageUpload} ref={fileInputRef} className="hidden" />
              <button onClick={handleSend} disabled={botTyping || isLoadingChat || (!input.trim() && !imageBase64 && !audioBase64)} className={`w-9 h-9 flex items-center justify-center rounded-full transition ${botTyping || isLoadingChat || (!input.trim() && !imageBase64 && !audioBase64) ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}>
                <img src={assets.send_icon} alt="Отправить" className="w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
};