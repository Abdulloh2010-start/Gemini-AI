import { useTheme } from '../useTheme'

export default function ThemeSettingsModal({ onClose, userLocation }) { 
  const { theme, setTheme } = useTheme()

  const handleClick = (value) => {
    setTheme(value)
  }

  return (
    <div className="fixed top-0 right-0 w-[280px] h-full bg-gray-200 z-[9999] p-6">
      <h2 className="text-lg font-semibold text-black mb-4">Настройки</h2>
      <h2 className='text-lg font-semibold text-black mb-1'>Темы:</h2>
      <div className="flex flex-col gap-3">
        <button onClick={() => handleClick('light')} className={`py-2 px-4 rounded cursor-pointer border ${theme === 'light' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Светлая</button>
        <button onClick={() => handleClick('dark')} className={`py-2 px-4 rounded cursor-pointer border ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Тёмная</button>
        <button onClick={() => handleClick('system')} className={`py-2 px-4 rounded cursor-pointer border ${theme === 'system' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>Системная</button>
      </div>
      {userLocation && (
        <div className="mt-6 pt-4 border-t border-gray-300">
          <h2 className="text-lg font-semibold text-black mb-2">Информация о пользователе:</h2>
          <p className="text-sm text-gray-700">Город: {userLocation.city}</p>
          <p className="text-sm text-gray-700">Страна: {userLocation.country}</p>
        </div>
      )}

      <button onClick={onClose} className="mt-6 text-sm text-gray-600 cursor-pointer hover:underline">Закрыть</button>
    </div>
  )
};