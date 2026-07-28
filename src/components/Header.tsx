import React from 'react';
import { User, Moon, Sun, Cloud, Sparkles, Menu, Globe } from 'lucide-react';
import { Currency, UserProfile } from '../types';
import { Language, translations } from '../i18n/translations';

interface HeaderProps {
  activeCurrency: Currency;
  onCurrencyChange: (curr: Currency) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  userProfile: UserProfile;
  onOpenAuth: () => void;
  onToggleSidebar?: () => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeCurrency,
  onCurrencyChange,
  isDark,
  onToggleTheme,
  userProfile,
  onOpenAuth,
  onToggleSidebar,
  currentLanguage,
  onLanguageChange,
}) => {
  const t = translations[currentLanguage] || translations.uk;

  const currentDateStr = React.useMemo(() => {
    const now = new Date();
    const localeMap = { uk: 'uk-UA', en: 'en-US', ru: 'ru-RU' };
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString(localeMap[currentLanguage] || 'uk-UA', options);
    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  }, [currentLanguage]);

  return (
    <header className="px-4 sm:px-6 pt-4 pb-3 flex justify-between items-center sticky top-0 z-20 backdrop-blur-xl border-b border-hair" style={{ background: 'color-mix(in srgb, var(--bg) 82%, transparent)' }}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest txt-sub">
            {currentDateStr}
          </p>
          {userProfile.isLoggedIn && (
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-1" style={{ background: 'color-mix(in srgb, var(--green) 18%, transparent)', color: 'var(--green)' }}>
              <Cloud className="w-2.5 h-2.5" /> {t.inCloud}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <h1 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight truncate">
            {userProfile.displayName || 'GURUfinance'}
          </h1>
          <span className="pro-chip text-[10px] font-black px-1.5 py-0.5 rounded-md tracking-wide flex items-center gap-0.5 shadow-sm">
            <Sparkles className="w-2.5 h-2.5" /> PRO
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Language Switcher */}
        <div className="surface p-1 rounded-2xl flex items-center text-xs font-bold gap-0.5">
          <button
            onClick={() => onLanguageChange('uk')}
            className={`px-2 py-1 rounded-xl transition-all ${currentLanguage === 'uk' ? 'chip-active font-extrabold' : 'txt-sub hover:text-current'}`}
            title="Українська мова"
          >
            UA
          </button>
          <button
            onClick={() => onLanguageChange('en')}
            className={`px-2 py-1 rounded-xl transition-all ${currentLanguage === 'en' ? 'chip-active font-extrabold' : 'txt-sub hover:text-current'}`}
            title="English language"
          >
            EN
          </button>
          <button
            onClick={() => onLanguageChange('ru')}
            className={`px-2 py-1 rounded-xl transition-all ${currentLanguage === 'ru' ? 'chip-active font-extrabold' : 'txt-sub hover:text-current'}`}
            title="Русский язык"
          >
            RU
          </button>
        </div>

        {/* Hamburger Menu Button for mobile/tablet */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="w-9 h-9 rounded-2xl surface flex items-center justify-center active:scale-95 transition lg:hidden"
            title={t.navigationMenu}
          >
            <Menu className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          </button>
        )}

        {/* Profile button */}
        <button
          onClick={onOpenAuth}
          className="w-9 h-9 rounded-2xl surface flex items-center justify-center relative active:scale-95 transition overflow-hidden"
          title={t.accountSync}
        >
          {userProfile.photoURL ? (
            <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          )}
          {userProfile.isLoggedIn && (
            <span className="w-2 h-2 rounded-full absolute top-1 right-1" style={{ background: 'var(--green)' }}></span>
          )}
        </button>

        {/* Currency Switcher */}
        <div className="surface p-1 rounded-2xl flex items-center">
          <button
            onClick={() => onCurrencyChange('UAH')}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${activeCurrency === 'UAH' ? 'chip-active' : 'txt-sub'}`}
          >
            ₴
          </button>
          <button
            onClick={() => onCurrencyChange('USD')}
            className={`px-2.5 py-1 text-xs font-bold rounded-xl transition-all ${activeCurrency === 'USD' ? 'chip-active' : 'txt-sub'}`}
          >
            $
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 rounded-2xl surface flex items-center justify-center active:scale-95 transition"
          title={t.toggleTheme}
        >
          {isDark ? (
            <Sun className="w-4 h-4" style={{ color: 'var(--gold)' }} />
          ) : (
            <Moon className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          )}
        </button>
      </div>
    </header>
  );
};

