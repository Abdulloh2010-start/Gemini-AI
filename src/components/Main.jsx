import { useState, useEffect, useRef } from 'react'
import { assets } from '../assets/assets'

export default function Main({ isLoadingChat, messages, onSend, onBotReply, onToggleMobileSidebar, user, onOpenProfileModal }) {
  const [input, setInput] = useState('')
  const [botTyping, setBotTyping] = useState(false)
  const [displayedMessages, setDisplayedMessages] = useState([])
  const bottomRef = useRef(null)
  const currentChatIdRef = useRef(null)
  useEffect(() => {
    setDisplayedMessages(messages)
  }, [messages])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayedMessages, botTyping, isLoadingChat])
  const getUserDisplayName = () => {
    if (user?.displayName) return user.displayName.split(' ')[0]
    if (user?.email) return user.email.split('@')[0]
    return 'Пользователь'
  }
  const handleSend = async () => {
    if (!input.trim() || botTyping) return
    if (!user) return alert('Пожалуйста, войдите, чтобы начать чат.')
    const userMessageText = input
    setInput('')
    setBotTyping(true)
    setDisplayedMessages(prev => [...prev, { sender: 'user', text: userMessageText }])
    const newChatId = await onSend(userMessageText)
    currentChatIdRef.current = newChatId
    if (!newChatId) {
      setBotTyping(false)
      setDisplayedMessages(prev => [...prev, { sender: 'bot', text: 'Произошла ошибка при создании/отправке чата.' }])
      return
    }
    setDisplayedMessages(prev => [...prev, { sender: 'bot', text: '...' }])
    try {
      const res = await fetch(import.meta.env.VITE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: userMessageText }] }] })
      })
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const data = await res.json()
      const botText = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Извините, не могу ответить сейчас.'
      typeBotResponse(botText, newChatId)
    } catch (err) {
      console.error('Ошибка при запросе к API:', err)
      typeBotResponse('Произошла ошибка при получении ответа от AI.', newChatId)
    }
  }
  const typeBotResponse = (text, chatIdForReply) => {
    let currentPrintedText = ''
    let index = 0
    const interval = setInterval(() => {
      currentPrintedText += text[index]
      index++
      setDisplayedMessages(prev => {
        const newArr = [...prev]
        if (newArr.length > 0 && newArr[newArr.length - 1].sender === 'bot') {
          newArr[newArr.length - 1].text = currentPrintedText
        } else {
          newArr.push({ sender: 'bot', text: currentPrintedText })
        }
        return newArr
      })
      if (index >= text.length) {
        clearInterval(interval)
        setBotTyping(false)
        onBotReply(chatIdForReply, text)
      }
    }, 15)
  }
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!botTyping && !isLoadingChat) handleSend()
    }
  }
  return (
    <div className="flex-1 flex flex-col h-screen bg-white">
      <div className="w-full px-5 pt-5 pb-2 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={assets.menu_icon} alt="Menu" className="w-6 cursor-pointer sm:hidden" onClick={onToggleMobileSidebar} />
          <p className="text-xl font-medium text-[#202123]">Gemini</p>
        </div>
        {user && (
          <div className="flex items-center gap-2 cursor-pointer" onClick={onOpenProfileModal}>
            {user.photoURL ? (
              <img src={user.photoURL} alt="User Avatar" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">{user.email ? user.email[0].toUpperCase() : 'U'}</div>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 pb-20">
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {displayedMessages.length === 0 && !isLoadingChat && (
            <h1 className="text-2xl sm:text-3xl text-center mt-60 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 font-semibold">Здравствуйте, {getUserDisplayName()}!</h1>
          )}
          {displayedMessages.map((msg, i) => {
            const isUser = msg.sender === 'user'
            return (
              <div key={i} className={`max-w-[80%] px-4 py-3 text-sm sm:text-base whitespace-pre-wrap ${isUser ? 'self-end bg-blue-500 text-white' : 'self-start bg-gray-100 text-gray-900'} rounded-2xl ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}>
                {msg.text}
              </div>
            )
          })}
          {isLoadingChat && displayedMessages.length === 0 && (
            <div className="text-center text-gray-400 text-sm animate-pulse">Загрузка чата...</div>
          )}
          {botTyping && displayedMessages.length > 0 && displayedMessages[displayedMessages.length - 1].sender === 'bot' && displayedMessages[displayedMessages.length - 1].text === '...' && (
            <div className="text-center text-gray-400 text-sm animate-pulse">Бот печатает...</div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="sticky bottom-0 bg-white z-10 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 bg-[#f0f4f9] rounded-full px-4 py-2 shadow-md">
            <textarea rows={1} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="Спросить Gemini..." className="flex-1 resize-none bg-transparent outline-none text-sm sm:text-base text-[#202123] max-h-[150px] overflow-y-auto"></textarea>
            <button onClick={handleSend} disabled={botTyping || isLoadingChat || input.trim() === ''} className={`w-9 h-9 flex items-center justify-center rounded-full transition ${botTyping || isLoadingChat || input.trim() === '' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}`}>
              <img src={assets.send_icon} alt="send" className="w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
};