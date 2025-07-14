import { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { auth, googleProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from '../Firebase';

export default function AuthForm({ onAuthSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      await signInWithPopup(auth, googleProvider);
      onAuthSuccess();
    } catch (error) {
      console.error('Ошибка входа через Google:', error);
      setAuthError(getErrorMessage(error.code));
    }
  };

const handleEmailLogin = async (email, password) => {
  setAuthError("");
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    if (!userCredential.user.emailVerified) {
      await signOut(auth);
      return setAuthError("Пожалуйста, подтвердите вашу почту перед входом.");
    }
    onAuthSuccess();
  } catch (error) {
    console.error("Ошибка входа по Email/Password:", error);
    setAuthError(getErrorMessage(error.code));
  }
};

  const handleEmailRegister = async (email, password) => {
    setAuthError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      await signOut(auth);
    } catch (error) {
      console.error("Ошибка регистрации по Email/Password:", error);
      setAuthError(getErrorMessage(error.code));
    }
  };

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/invalid-email': return 'Неверный формат Email.';
      case 'auth/user-disabled': return 'Ваш аккаунт отключен.';
      case 'auth/user-not-found': return 'Пользователь не найден.';
      case 'auth/wrong-password': return 'Неверный пароль.';
      case 'auth/email-already-in-use': return 'Email уже используется.';
      case 'auth/weak-password': return 'Пароль слишком слабый (минимум 6 символов).';
      default: return 'Ошибка аутентификации.';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {authError && <p className="text-red-500 text-sm text-center bg-red-100 p-2 rounded-md mb-4">{authError}</p>}
      {verificationSent ? (
        <div className="bg-green-100 text-green-700 p-4 rounded-md text-center">
          <p className="text-md">На ваш email отправлено письмо для подтверждения. Пожалуйста, проверьте почту и подтвердите аккаунт перед входом.</p>
        </div>
      ) : isRegistering ? (
        <RegisterForm onRegister={handleEmailRegister} onSwitchToLogin={() => setIsRegistering(false)} />
      ) : (
        <LoginForm onLogin={handleEmailLogin} onSwitchToRegister={() => setIsRegistering(true)} />
      )}
      <div className="mt-8 text-center">
        <p className="text-gray-600 text-lg mb-4 font-light">или</p>
        <button onClick={handleGoogleSignIn} className="flex items-center gap-[30px] cursor-pointer justify-center bg-white border border-gray-300 rounded-lg shadow-md px-6 py-3 text-base font-medium text-gray-800 hover:bg-gray-100 w-full transition-all duration-200 transform hover:scale-105">
          <i className="fa-brands fa-google"></i>Войти через Google
        </button>
      </div>
    </div>
  );
}