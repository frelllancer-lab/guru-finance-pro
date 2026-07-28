import React from 'react';
import {
  Wallet,
  CreditCard,
  Sliders,
  Sparkles,
  PieChart,
  Clock,
  User,
  Moon,
  Sun,
  X,
  Coins,
  Plus,
  Zap,
  UploadCloud,
  ChevronRight,
  LayoutDashboard,
} from 'lucide-react';
import { Currency, UserProfile } from '../types';
import { formatCurrency } from '../utils/currency';
import { Language, translations } from '../i18n/translations';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  activeCurrency: Currency;
  onCurrencyChange: (curr: Currency) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  userProfile: UserProfile;
  onOpenAuth: () => void;
  totalBalance?: number;
  accountsCount?: number;
  onOpenAddTx?: () => void;
  onOpenAddAccount?: () => void;
  onTriggerScan?: () => void;
  onGenerateAiAdvice?: () => void;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  activeCurrency,
  onCurrencyChange,
  isDark,
  onToggleTheme,
  userProfile,
  onOpenAuth,
  totalBalance = 0,
  accountsCount = 0,
  onOpenAddTx,
  onOpenAddAccount,
  onTriggerScan,
  currentLanguage,
  onLanguageChange,
}) => {
  const t = translations[currentLanguage] || translations.uk;

  const navItems = [
    { id: 'all', label: t.tabAll, icon: LayoutDashboard, color: 'var(--accent)' },
    { id: 'sectionBalance', label: t.tabBalance, icon: Wallet, color: 'var(--accent)' },
    { id: 'sectionAccounts', label: t.tabAccounts, icon: CreditCard, color: 'var(--accent-2)', badge: accountsCount ? `${accountsCount}` : undefined },
    { id: 'sectionLimits', label: t.tabLimits, icon: Sliders, color: 'var(--orange)' },
    { id: 'sectionAI', label: t.tabAI, icon: Sparkles, color: 'var(--green)' },
    { id: 'sectionChart', label: t.tabChart, icon: PieChart, color: 'var(--red)' },
    { id: 'sectionTransactions', label: t.tabTransactions, icon: Clock, color: 'var(--gold)' },
  ];

  const handleSelect = (id: string) => {
    onSelectTab(id);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:sticky top-0 left-0 bottom-0 z-50 lg:z-10 w-72 h-[100dvh] surface border-r border-hair p-5 flex flex-col justify-between transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } overflow-y-auto no-scrollbar shrink-0`}
      >
        <div className="space-y-5">
          {/* Header in Sidebar */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-extrabold text-xl tracking-tight">
                {userProfile.displayName || 'GURUfinance'}
              </h2>
              <p className="text-[10px] txt-sub font-bold uppercase tracking-wider mt-0.5">
                {t.sectionSubtitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-xl surface-soft txt-sub hover:text-current transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Switcher in Sidebar */}
          <div className="surface-soft p-1.5 rounded-2xl flex items-center justify-between text-xs font-bold gap-1">
            <span className="text-[11px] txt-sub font-bold pl-1">{t.language}:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onLanguageChange('uk')}
                className={`px-2 py-1 rounded-xl transition ${currentLanguage === 'uk' ? 'surface shadow-xs text-blue-500 font-black' : 'txt-sub'}`}
              >
                UA
              </button>
              <button
                onClick={() => onLanguageChange('en')}
                className={`px-2 py-1 rounded-xl transition ${currentLanguage === 'en' ? 'surface shadow-xs text-blue-500 font-black' : 'txt-sub'}`}
              >
                EN
              </button>
              <button
                onClick={() => onLanguageChange('ru')}
                className={`px-2 py-1 rounded-xl transition ${currentLanguage === 'ru' ? 'surface shadow-xs text-blue-500 font-black' : 'txt-sub'}`}
              >
                RU
              </button>
            </div>
          </div>

          {/* Quick Balance Summary Widget */}
          <div className="surface-soft rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider txt-sub">
              <span>{t.netBalance}</span>
              <span className="font-num font-extrabold text-blue-500">{accountsCount}</span>
            </div>
            <div className="font-display font-black text-xl font-num tracking-tight">
              {formatCurrency(totalBalance, activeCurrency)}
            </div>
          </div>

          {/* Quick Actions inside Menu */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider txt-sub px-1">
              {t.quickActions}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {onOpenAddTx && (
                <button
                  onClick={() => {
                    onOpenAddTx();
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="py-2.5 px-3 surface rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs hover:border-blue-500/40 active:scale-95 transition text-blue-500"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addRecord}</span>
                </button>
              )}
              {onOpenAddAccount && (
                <button
                  onClick={() => {
                    onOpenAddAccount();
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className="py-2.5 px-3 surface rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs hover:border-emerald-500/40 active:scale-95 transition text-emerald-500"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{t.addAccount}</span>
                </button>
              )}
            </div>
            {onTriggerScan && (
              <button
                onClick={() => {
                  onTriggerScan();
                  if (window.innerWidth < 1024) onClose();
                }}
                className="w-full py-2.5 px-3 surface rounded-xl flex items-center justify-between font-bold text-xs hover:border-purple-500/40 active:scale-95 transition"
              >
                <div className="flex items-center gap-2">
                  <UploadCloud className="w-3.5 h-3.5 text-purple-500" />
                  <span>{t.scanReceipt}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 txt-sub" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider txt-sub px-1">
              {t.sectionsMenu}
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition active:scale-98 text-left ${
                      isActive
                        ? 'surface shadow-sm text-blue-500 font-extrabold ring-1 ring-blue-500/20'
                        : 'txt-sub hover:surface-soft'
                    }`}
                    style={
                      isActive
                        ? {
                            background: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                            color: 'var(--accent)',
                          }
                        : {}
                    }
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className="w-4 h-4 shrink-0 transition"
                        style={{ color: isActive ? 'var(--accent)' : item.color }}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full surface-soft font-num">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-hair pt-4 space-y-2 mt-6">
          {/* User Account Link */}
          <button
            onClick={() => {
              onOpenAuth();
              onClose();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold surface-soft hover:surface transition active:scale-98"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <User className="w-4 h-4 shrink-0 text-blue-500" />
              <span className="truncate">
                {userProfile.isLoggedIn ? userProfile.displayName || 'Аккаунт' : t.notLoggedIn}
              </span>
            </div>
            {userProfile.isLoggedIn && (
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--green)' }} />
            )}
          </button>

          {/* Theme & Currency Controls */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={onToggleTheme}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl surface-soft text-xs font-bold active:scale-95 transition"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                  <span>Dark</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-1 surface-soft p-1 rounded-xl">
              <Coins className="w-3.5 h-3.5 ml-1" style={{ color: 'var(--green)' }} />
              <button
                onClick={() => onCurrencyChange('UAH')}
                className={`px-2 py-0.5 text-xs font-black rounded-lg transition ${
                  activeCurrency === 'UAH' ? 'chip-active shadow-xs' : 'txt-sub'
                }`}
              >
                ₴
              </button>
              <button
                onClick={() => onCurrencyChange('USD')}
                className={`px-2 py-0.5 text-xs font-black rounded-lg transition ${
                  activeCurrency === 'USD' ? 'chip-active shadow-xs' : 'txt-sub'
                }`}
              >
                $
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};


