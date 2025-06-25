import { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from '../Firebase'

export default function AuthForm({ onAuthSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false)
  const [authError, setAuthError] = useState('')
  const handleGoogleSignIn = async () => {
    setAuthError('')
    try {
      await signInWithPopup(auth, googleProvider)
      onAuthSuccess()
    } catch (error) {
      console.error('Ошибка входа через Google:', error)
      setAuthError(getErrorMessage(error.code))
    }
  }
  const handleEmailLogin = async (email, password) => {
    setAuthError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      onAuthSuccess()
    } catch (error) {
      console.error('Ошибка входа по Email/Password:', error)
      setAuthError(getErrorMessage(error.code))
    }
  }
  const handleEmailRegister = async (email, password) => {
    setAuthError('')
    try {
      await createUserWithEmailAndPassword(auth, email, password)
      onAuthSuccess()
    } catch (error) {
      console.error('Ошибка регистрации по Email/Password:', error)
      setAuthError(getErrorMessage(error.code))
    }
  }
  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/invalid-email': return 'Неверный формат Email.'
      case 'auth/user-disabled': return 'Ваш аккаунт отключен.'
      case 'auth/user-not-found': return 'Пользователь с таким Email не найден.'
      case 'auth/wrong-password': return 'Неверный пароль.'
      case 'auth/email-already-in-use': return 'Email уже используется.'
      case 'auth/weak-password': return 'Пароль должен быть не менее 6 символов.'
      default: return 'Произошла ошибка аутентификации. Попробуйте еще раз.'
    }
  }
  return (
    <div className="w-full max-w-md mx-auto">
      {isRegistering ? (
        <RegisterForm onRegister={handleEmailRegister} onSwitchToLogin={() => setIsRegistering(false)} />
      ) : (
        <LoginForm onLogin={handleEmailLogin} onSwitchToRegister={() => setIsRegistering(true)} />
      )}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-lg mb-4 font-light">или</p>
        <button onClick={handleGoogleSignIn} className="flex items-center gap-[30px] cursor-pointer justify-center bg-white border border-gray-300 rounded-lg shadow-md px-6 py-3 text-base font-medium text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 w-full transition-all duration-200 transform hover:scale-105"><i className="fa-brands fa-google"></i>Войти через Google</button>
      </div>
    </div>
  )
};