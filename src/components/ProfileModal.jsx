import { assets } from '../assets/assets'

export default function ProfileModal({ user, onClose, onSignOut, onChangeAccount }) {
  const getUserFullName = () => {
    if (user?.displayName) {
      return user.displayName
    }
    return user?.email || 'Пользователь'
  }
  const handleModalClick = (e) => {
    e.stopPropagation()
  }
  return (
    <div className="p-8 bg-white rounded-xl shadow-2xl w-[300px] text-center relative" onClick={handleModalClick}>
      <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl font-light cursor-pointer">&times;</button>
      <h2 className="text-2xl font-bold mb-6 text-gray-900">Профиль</h2>
      <div className="mb-6 flex flex-col items-center">
        {user.photoURL ? (
          <img src={user.photoURL} alt="User Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-blue-200 shadow-md" />
        ) : (
          <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-semibold border-4 border-blue-200 shadow-md">
            {user.email ? user.email[0].toUpperCase() : 'U'}
          </div>
        )}
        <p className="text-xl font-semibold text-gray-800 mt-4">{getUserFullName()}</p>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>
      <div className="flex flex-col gap-3">
        <button onClick={onSignOut} className="flex items-center justify-center px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-md font-medium cursor-pointer"><img src={assets.logout_icon} alt="Logout" className="w-5 h-5 mr-2 filter brightness-0 invert" />Выйти</button>
        <button onClick={onChangeAccount} className="flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 shadow-md font-medium cursor-pointer">Сменить аккаунт</button>
      </div>
    </div>
  )
};