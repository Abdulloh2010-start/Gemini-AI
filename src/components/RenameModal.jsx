import{ useState, useEffect, forwardRef } from 'react'

const RenameModal = forwardRef(({ chatId, initialTitle, onClose, onRename }, ref) => {
  const [title, setTitle] = useState(initialTitle)
  useEffect(() => {
    setTitle(initialTitle)
  }, [initialTitle])
  const handleSave = () => {
    if (title.trim() !== '') {
      onRename(chatId, title)
    } else {
      alert('Название чата не может быть пустым!')
    }
  }
  const handleModalClick = (e) => {
    e.stopPropagation()
  }
  return (
    <div ref={ref} className="relative right-[200px] bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full transform transition-all duration-300 ease-out scale-100 opacity-100" onClick={handleModalClick}>
      <h2 className="text-2xl font-bold mb-5 text-center text-gray-800">Переименовать чат</h2>
      <input className="w-full border border-gray-300 px-4 py-3 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Введите новое название чата" autoFocus onKeyPress={(e) => { if (e.key === 'Enter') { handleSave() } }} />
      <div className="flex justify-end gap-3">
        <button className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium cursor-pointer" onClick={onClose}>Отмена</button>
        <button className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium shadow-md cursor-pointer" onClick={handleSave}>Сохранить</button>
      </div>
    </div>
  )
});

export default RenameModal;