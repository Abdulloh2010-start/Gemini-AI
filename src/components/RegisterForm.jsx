import { useState } from 'react'

export default function RegisterForm({ onRegister, onSwitchToLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await onRegister(email, password)
    } catch (err) {
      setError(err.message)
    }
  }
  return (
    <form onSubmit={handleSubmit} className="p-8 bg-white rounded-xl shadow-2xl w-[80%] mx-auto md:w-full max-w-md transform transition-all duration-300 ease-out scale-100 opacity-100">
      <h2 className="text-2xl md:text-3xl font-extrabold mb-8 text-center text-gray-900">Создать аккаунт</h2>
      {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-100 p-2 rounded-md">{error}</p>}
      <div className="mb-5">
        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="reg-email">Email</label>
        <input type="email" id="reg-email" className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="reg-password">Пароль</label>
        <input type="password" id="reg-password" className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-800 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors duration-200" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <div className="flex flex-col gap-4">
        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-200 shadow-md transform hover:scale-105">Зарегистрироваться</button>
        <button type="button" onClick={onSwitchToLogin} className="text-center font-semibold text-green-600 hover:text-green-800 text-sm transition-colors duration-200">Уже есть аккаунт? Войти</button>
      </div>
    </form>
  )
};