import React, { useState } from 'react';
import {
  X,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  User as UserIcon,
} from 'lucide-react';
import { UserProfile } from '../types';
import {
  loginWithGoogle,
  loginWithApple,
  loginWithEmail,
  setupRecaptcha,
  sendPhoneCode,
  logoutUser,
} from '../lib/firebase';
import { ConfirmationResult } from 'firebase/auth';
import { Language } from '../i18n/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  currentLanguage?: Language;
}

const AUTH_TEXTS: Record<Language, {
  title: string;
  subtitle: string;
  loggedTitle: string;
  loggedSubtitle: string;
  cloudSync: string;
  logout: string;
  tabFast: string;
  tabEmail: string;
  tabPhone: string;
  loginGoogle: string;
  loginApple: string;
  emailLabel: string;
  passwordLabel: string;
  hasAccount: string;
  noAccount: string;
  registerBtn: string;
  loginBtn: string;
  phoneLabel: string;
  phoneHint: string;
  sendSmsBtn: string;
  smsCodeLabel: string;
  confirmSmsBtn: string;
  resendSms: string;
  socialNote: string;
}> = {
  uk: {
    title: 'Хмарний Акаунт',
    subtitle: 'Синхронізація фінансів на всіх пристроях',
    loggedTitle: 'Користувач GURUfinance',
    loggedSubtitle: 'Хмарний профіль активний',
    cloudSync: 'Дані автоматично зберігаються в хмарі',
    logout: 'Вийти з акаунта',
    tabFast: 'Соцмережі',
    tabEmail: 'Email',
    tabPhone: 'Телефон',
    loginGoogle: 'Увійти через Google',
    loginApple: 'Увійти через Apple ID',
    emailLabel: 'Електронна пошта (Email)',
    passwordLabel: 'Пароль',
    hasAccount: 'Вже є акаунт? Увійти',
    noAccount: 'Створити новий акаунт',
    registerBtn: 'Зареєструватися',
    loginBtn: 'Увійти в акаунт',
    phoneLabel: 'Номер мобільного телефону',
    phoneHint: 'Вкажіть номер у міжнародному форматі для отримання SMS',
    sendSmsBtn: 'Отримати код в SMS',
    smsCodeLabel: 'Код із SMS повідомлення',
    confirmSmsBtn: 'Підтвердити та увійти',
    resendSms: 'Надіслати код повторно',
    socialNote: 'Якщо Google/Apple не працюють — скористайтеся вкладкою Email для швидкої реєстрації.',
  },
  en: {
    title: 'Cloud Account',
    subtitle: 'Sync your finances across all devices',
    loggedTitle: 'GURUfinance User',
    loggedSubtitle: 'Cloud profile is active',
    cloudSync: 'Data is automatically backed up in the cloud',
    logout: 'Log Out',
    tabFast: 'Social',
    tabEmail: 'Email',
    tabPhone: 'Phone',
    loginGoogle: 'Sign in with Google',
    loginApple: 'Sign in with Apple ID',
    emailLabel: 'Email Address',
    passwordLabel: 'Password',
    hasAccount: 'Already have an account? Sign In',
    noAccount: 'Create a new account',
    registerBtn: 'Register',
    loginBtn: 'Sign In',
    phoneLabel: 'Mobile Phone Number',
    phoneHint: 'Enter phone in international format to receive SMS',
    sendSmsBtn: 'Get SMS Code',
    smsCodeLabel: 'SMS Code',
    confirmSmsBtn: 'Confirm & Sign In',
    resendSms: 'Resend code',
    socialNote: 'If Google/Apple don\'t work, use the Email tab for quick registration.',
  },
  ru: {
    title: 'Облачный Аккаунт',
    subtitle: 'Синхронизация финансов на всех устройствах',
    loggedTitle: 'Пользователь GURUfinance',
    loggedSubtitle: 'Облачный профиль активен',
    cloudSync: 'Данные автоматически сохраняются в облаке',
    logout: 'Выйти из аккаунта',
    tabFast: 'Соцсети',
    tabEmail: 'Email',
    tabPhone: 'Телефон',
    loginGoogle: 'Войти через Google',
    loginApple: 'Войти через Apple ID',
    emailLabel: 'Электронная почта (Email)',
    passwordLabel: 'Пароль',
    hasAccount: 'Уже есть аккаунт? Войти',
    noAccount: 'Создать новый аккаунт',
    registerBtn: 'Зарегистрироваться',
    loginBtn: 'Войти в аккаунт',
    phoneLabel: 'Номер мобильного телефона',
    phoneHint: 'Укажите номер в международном формате для получения SMS',
    sendSmsBtn: 'Получить код в SMS',
    smsCodeLabel: 'Код из SMS сообщения',
    confirmSmsBtn: 'Подтвердить и войти',
    resendSms: 'Отправить код заново',
    socialNote: 'Если Google/Apple не работают — используйте вкладку Email для быстрой регистрации.',
  },
};

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  currentLanguage = 'uk',
}) => {
  const t = AUTH_TEXTS[currentLanguage] || AUTH_TEXTS.uk;

  const [authMethod, setAuthMethod] = useState<'social' | 'email' | 'phone'>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Phone form state
  const [phoneNumber, setPhoneNumber] = useState('+380');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Status & Error state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      console.error('Google Auth Error:', err);
      if (err?.code === 'auth/popup-blocked') {
        setError(
          currentLanguage === 'uk'
            ? 'Спливаюче вікно заблоковано браузером. Дозвольте спливаючі вікна або скористайтеся Email.'
            : currentLanguage === 'en'
            ? 'Popup was blocked by your browser. Please allow popups or use Email.'
            : 'Всплывающее окно заблокировано браузером. Разрешите всплывающие окна или используйте Email.'
        );
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError(
          currentLanguage === 'uk'
            ? 'Цей домен ще не додано до авторизованих у Firebase. Скористайтеся Email.'
            : currentLanguage === 'en'
            ? 'Domain not authorized in Firebase Console. Please use Email.'
            : 'Этот домен не авторизован в Firebase. Используйте Email.'
        );
      } else {
        setError(
          currentLanguage === 'uk'
            ? 'Не вдалося увійти через Google. Спробуйте ще раз або використайте Email.'
            : currentLanguage === 'en'
            ? 'Failed to sign in with Google. Try again or use Email.'
            : 'Не удалось войти через Google. Попробуйте еще раз или используйте Email.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithApple();
      onClose();
    } catch (err: any) {
      console.error('Apple Auth Error:', err);
      const code = err?.code || '';
      if (code === 'auth/operation-not-allowed') {
        setError(
          currentLanguage === 'uk'
            ? 'Вхід через Apple не увімкнено в консолі Firebase. Будь ласка, скористайтеся Google, Email або Телефоном.'
            : currentLanguage === 'en'
            ? 'Apple Sign-In is not enabled in Firebase Console. Please use Google, Email, or Phone.'
            : 'Вход через Apple не включен в консоли Firebase. Пожалуйста, используйте Google, Email или Телефон.'
        );
      } else if (code === 'auth/popup-blocked') {
        setError(
          currentLanguage === 'uk'
            ? 'Спливаюче вікно Apple заблоковано браузером. Дозвольте спливаючі вікна або використайте Email/Телефон.'
            : currentLanguage === 'en'
            ? 'Apple popup was blocked by browser. Please allow popups or use Email/Phone.'
            : 'Всплывающее окно Apple заблокировано браузером. Разрешите всплывающие окна или используйте Email/Телефон.'
        );
      } else if (code === 'auth/unauthorized-domain') {
        setError(
          currentLanguage === 'uk'
            ? 'Домен розробки не додано до авторизованих у Firebase. Скористайтеся Email або Телефоном.'
            : currentLanguage === 'en'
            ? 'Development domain not authorized in Firebase Console. Please use Email or Phone.'
            : 'Домен разработки не добавлен в разрешенные домены Firebase. Воспользуйтесь Email или Телефоном.'
        );
      } else if (code === 'auth/popup-closed-by-user') {
        setError(
          currentLanguage === 'uk'
            ? 'Вікно входу Apple було закрито.'
            : currentLanguage === 'en'
            ? 'Apple sign-in window was closed.'
            : 'Окно входа Apple было закрыто.'
        );
      } else {
        setError(
          currentLanguage === 'uk'
            ? 'Не вдалося увійти через Apple (потрібне налаштування Apple Services ID в Firebase). Скористайтеся Google, Email або Телефоном.'
            : currentLanguage === 'en'
            ? 'Failed to sign in with Apple (requires Apple Services ID setup in Firebase). Please use Google, Email, or Phone.'
            : 'Не удалось войти через Apple (требуется настройка Apple Services ID в Firebase). Воспользуйтесь Google, Email или Телефоном.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await loginWithEmail(email.trim(), password.trim(), isRegistering);
      onClose();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        setError(
          currentLanguage === 'uk' ? 'Невірний пароль.' : currentLanguage === 'en' ? 'Wrong password.' : 'Неверный пароль.'
        );
      } else if (err.code === 'auth/email-already-in-use') {
        setError(
          currentLanguage === 'uk'
            ? 'Користувач із таким email вже існує. Спробуйте увійти.'
            : currentLanguage === 'en'
            ? 'Email already in use. Try logging in.'
            : 'Пользователь с таким email уже существует. Попробуйте войти.'
        );
      } else if (err.code === 'auth/weak-password') {
        setError(
          currentLanguage === 'uk'
            ? 'Пароль занадто короткий (мінімум 6 символів).'
            : currentLanguage === 'en'
            ? 'Password is too short (min 6 chars).'
            : 'Пароль слишком короткий (минимум 6 символов).'
        );
      } else {
        setError(
          currentLanguage === 'uk'
            ? 'Помилка авторизації. Перевірте правильність введених даних.'
            : currentLanguage === 'en'
            ? 'Authentication error. Please check your credentials.'
            : 'Ошибка авторизации. Проверьте правильность введенных данных.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      setError(
        currentLanguage === 'uk'
          ? 'Введіть коректний номер телефону в міжнародному форматі'
          : currentLanguage === 'en'
          ? 'Enter valid phone number in international format'
          : 'Введите корректный номер телефона в международном формате'
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const verifier = setupRecaptcha('recaptcha-container');
      const confirmation = await sendPhoneCode(phoneNumber.trim(), verifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      console.error(err);
      setError(
        currentLanguage === 'uk'
          ? 'Не вдалося надіслати SMS. Перевірте формат номера (+380...)'
          : currentLanguage === 'en'
          ? 'Failed to send SMS. Check phone format (+380...)'
          : 'Не удалось отправить SMS. Проверьте формат номера (+380...)'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySmsCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim() || !confirmationResult) return;
    setLoading(true);
    setError(null);
    try {
      await confirmationResult.confirm(verificationCode.trim());
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(
        currentLanguage === 'uk'
          ? 'Невірний код із SMS. Спробуйте ще раз.'
          : currentLanguage === 'en'
          ? 'Invalid SMS code. Try again.'
          : 'Неверный код из SMS. Попробуйте еще раз.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutUser();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="surface w-full sm:max-w-md rounded-t-4xl sm:rounded-4xl p-6 space-y-5 modal-enter max-h-[92dvh] overflow-y-auto no-scrollbar border border-hair shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3.5 border-hair">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-base leading-tight">
                {t.title}
              </h3>
              <p className="text-[11px] txt-sub font-medium">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl surface-soft hover:surface txt-sub transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden recaptcha container */}
        <div id="recaptcha-container"></div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-bold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* LOGGED IN USER STATE */}
        {userProfile.isLoggedIn ? (
          <div className="space-y-4">
            <div
              className="p-5 rounded-3xl text-center space-y-3 relative overflow-hidden"
              style={{
                background: 'color-mix(in srgb, var(--green) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--green) 30%, transparent)',
              }}
            >
              <div className="w-16 h-16 rounded-full mx-auto overflow-hidden bg-emerald-500/20 flex items-center justify-center ring-4 ring-emerald-500/30">
                {userProfile.photoURL ? (
                  <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-8 h-8 text-emerald-500" />
                )}
              </div>

              <div>
                <h4 className="font-display font-extrabold text-sm txt-main">
                  {userProfile.displayName || t.loggedTitle}
                </h4>
                <p className="text-xs txt-sub font-medium mt-0.5">
                  {userProfile.email || userProfile.phoneNumber || t.loggedSubtitle}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t.cloudSync}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loading}
              className="w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 surface-soft hover:bg-red-500/10 text-red-500 transition active:scale-98"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        ) : (
          /* LOGGED OUT STATE: LOGIN OPTIONS */
          <div className="space-y-4">
            {/* Tab selection */}
            <div className="grid grid-cols-3 gap-1 surface-soft p-1 rounded-2xl text-xs font-bold">
              <button
                onClick={() => {
                  setAuthMethod('social');
                  setError(null);
                }}
                className={`py-2 rounded-xl transition ${
                  authMethod === 'social' ? 'surface shadow-xs text-blue-500 font-extrabold' : 'txt-sub'
                }`}
              >
                {t.tabFast}
              </button>
              <button
                onClick={() => {
                  setAuthMethod('email');
                  setError(null);
                }}
                className={`py-2 rounded-xl transition ${
                  authMethod === 'email' ? 'surface shadow-xs text-blue-500 font-extrabold' : 'txt-sub'
                }`}
              >
                {t.tabEmail}
              </button>
              <button
                onClick={() => {
                  setAuthMethod('phone');
                  setError(null);
                }}
                className={`py-2 rounded-xl transition ${
                  authMethod === 'phone' ? 'surface shadow-xs text-blue-500 font-extrabold' : 'txt-sub'
                }`}
              >
                {t.tabPhone}
              </button>
            </div>

            {/* METHOD 1: SOCIAL (GOOGLE / APPLE) */}
            {authMethod === 'social' && (
              <div className="space-y-3 pt-1">
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[11px] font-bold text-center leading-relaxed">
                  {t.socialNote}
                </div>
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="oauth-btn w-full py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-3 surface border border-hair active:scale-98 transition shadow-xs"
                >
                  <svg width="20" height="20" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z" />
                    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.9 6.5 29.2 4.5 24 4.5c-7.5 0-14 4.2-17.7 10.2z" />
                    <path fill="#4CAF50" d="M24 43.5c5.1 0 9.7-1.9 13.2-5.1l-6.1-5.2c-2 1.5-4.5 2.3-7.1 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.9 39.1 16.4 43.5 24 43.5z" />
                    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.1 5.2C40.5 36 43.5 30.5 43.5 24c0-1.2-.1-2.3-.3-3.5z" />
                  </svg>
                  <span>{t.loginGoogle}</span>
                </button>

                <button
                  onClick={handleAppleLogin}
                  disabled={loading}
                  className="oauth-btn w-full py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-3 transition active:scale-98 shadow-xs"
                  style={{ background: 'var(--text)', color: 'var(--bg)' }}
                >
                  <svg width="18" height="18" viewBox="0 0 384 512" fill="currentColor">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141 0 184.8 0 273.5c0 26.2 4.8 53.3 14.4 81.2 12.8 37 59 127.6 107.2 126.1 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-83 102.6-120.1-65.2-30.7-57.7-90-57.7-91.9zM255.7 89.5c26.9-32 24.5-61.2 23.7-71.5-23.8 1.4-51.4 16.4-67.1 34.9-17.4 19.8-27.6 44.4-25.4 71.9 25.9 2 49.5-11.3 68.8-35.3z" />
                  </svg>
                  <span>{t.loginApple}</span>
                </button>
              </div>
            )}

            {/* METHOD 2: EMAIL & PASSWORD */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider txt-sub mb-1">
                    {t.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 txt-sub" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full surface-soft rounded-2xl pl-10 pr-3 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider txt-sub mb-1">
                    {t.passwordLabel}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 txt-sub" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full surface-soft rounded-2xl pl-10 pr-3 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/30 transition"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="text-blue-500 font-bold hover:underline"
                  >
                    {isRegistering ? t.hasAccount : t.noAccount}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-blue-500 text-white font-extrabold rounded-2xl text-xs active:scale-95 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isRegistering ? t.registerBtn : t.loginBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* METHOD 3: PHONE NUMBER (SMS) */}
            {authMethod === 'phone' && (
              <div className="space-y-3 pt-1">
                {!confirmationResult ? (
                  <form onSubmit={handleSendSms} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider txt-sub mb-1">
                        {t.phoneLabel}
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 txt-sub" />
                        <input
                          type="tel"
                          placeholder="+380991234567"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          required
                          className="w-full surface-soft rounded-2xl pl-10 pr-3 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/30 transition font-num"
                        />
                      </div>
                      <p className="text-[10px] txt-sub mt-1">
                        {t.phoneHint}
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-emerald-500 text-white font-extrabold rounded-2xl text-xs active:scale-95 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <span>{t.sendSmsBtn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifySmsCode} className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider txt-sub mb-1">
                        {t.smsCodeLabel}
                      </label>
                      <input
                        type="text"
                        placeholder="123456"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        required
                        maxLength={6}
                        className="w-full surface-soft rounded-2xl px-4 py-3 text-center text-base tracking-widest font-extrabold outline-none focus:ring-2 focus:ring-emerald-500/30 transition font-num"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-emerald-500 text-white font-extrabold rounded-2xl text-xs active:scale-95 transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <span>{t.confirmSmsBtn}</span>
                      <ShieldCheck className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setConfirmationResult(null)}
                      className="w-full text-center text-[11px] font-bold txt-sub hover:text-current pt-1"
                    >
                      {t.resendSms}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

