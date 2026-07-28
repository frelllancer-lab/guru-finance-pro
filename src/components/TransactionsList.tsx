import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Gamepad2,
  HeartPulse,
  Smartphone,
  MoreHorizontal,
  Banknote,
  Laptop,
  Gift,
  TrendingUp,
  PlusCircle,
  Trash2,
  Dog,
  Baby,
  Dumbbell,
  BookOpen,
  Plane,
  Wrench,
  Briefcase,
  GraduationCap,
  Shirt,
  Coffee,
  Fuel,
  Wallet,
} from 'lucide-react';
import { Transaction, Category, Currency } from '../types';
import { convertAmount, formatCurrency } from '../utils/currency';
import { Language, translations } from '../i18n/translations';

interface TransactionsListProps {
  transactions: Transaction[];
  categories: Category[];
  currency: Currency;
  exchangeRate: number;
  onDeleteTransaction: (id: number) => void;
  onClearAllData: () => void;
  currentLanguage?: Language;
}

// Icon rendering helper
export const renderCategoryIcon = (iconName: string, className = 'w-4 h-4') => {
  switch (iconName) {
    case 'Utensils':
    case 'fa-utensils':
      return <Utensils className={className} />;
    case 'Car':
    case 'fa-car':
      return <Car className={className} />;
    case 'ShoppingBag':
    case 'fa-bag-shopping':
      return <ShoppingBag className={className} />;
    case 'Home':
    case 'fa-house':
      return <Home className={className} />;
    case 'Gamepad2':
    case 'fa-gamepad':
      return <Gamepad2 className={className} />;
    case 'HeartPulse':
    case 'fa-heart-pulse':
      return <HeartPulse className={className} />;
    case 'Smartphone':
    case 'fa-mobile-screen':
      return <Smartphone className={className} />;
    case 'Banknote':
    case 'fa-money-bill-wave':
      return <Banknote className={className} />;
    case 'Laptop':
    case 'fa-laptop-code':
      return <Laptop className={className} />;
    case 'Gift':
    case 'fa-gift':
      return <Gift className={className} />;
    case 'TrendingUp':
    case 'fa-chart-line':
      return <TrendingUp className={className} />;
    case 'Dog':
    case 'fa-paw':
      return <Dog className={className} />;
    case 'Baby':
    case 'fa-baby':
      return <Baby className={className} />;
    case 'Dumbbell':
    case 'fa-dumbbell':
      return <Dumbbell className={className} />;
    case 'BookOpen':
    case 'fa-book':
      return <BookOpen className={className} />;
    case 'Plane':
    case 'fa-plane':
      return <Plane className={className} />;
    case 'Wrench':
    case 'fa-wrench':
      return <Wrench className={className} />;
    case 'Briefcase':
    case 'fa-briefcase':
      return <Briefcase className={className} />;
    case 'GraduationCap':
    case 'fa-graduation-cap':
      return <GraduationCap className={className} />;
    case 'Shirt':
    case 'fa-shirt':
      return <Shirt className={className} />;
    case 'Coffee':
      return <Coffee className={className} />;
    case 'Fuel':
      return <Fuel className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    default:
      return <MoreHorizontal className={className} />;
  }
};

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  categories,
  currency,
  exchangeRate,
  onDeleteTransaction,
  onClearAllData,
  currentLanguage = 'uk',
}) => {
  const t = translations[currentLanguage] || translations.uk;
  const localeMap = { uk: 'uk-UA', en: 'en-US', ru: 'ru-RU' };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h2 className="font-display font-bold text-base tracking-tight">{t.transactionJournal}</h2>
        {transactions.length > 0 && (
          <button
            onClick={onClearAllData}
            className="text-xs font-medium hover:underline transition"
            style={{ color: 'var(--red)' }}
          >
            {t.clearAll}
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
        {transactions.length === 0 ? (
          <div className="text-center py-8 txt-sub text-xs font-semibold surface rounded-2xl">
            {t.noTransactions}
          </div>
        ) : (
          transactions.map((tItem) => {
            const catObj = categories.find((c) => c.id === tItem.category) || {
              name: 'Інше',
              icon: 'MoreHorizontal',
              color: 'bg-slate-500',
            };
            const isExpense = tItem.type === 'expense';
            const date = new Date(tItem.date);
            const isValidDate = !isNaN(date.getTime());
            const dateStr = isValidDate
              ? date.toLocaleDateString(localeMap[currentLanguage] || 'uk-UA', { day: '2-digit', month: '2-digit' })
              : t.periodDay;
            const timeStr = isValidDate
              ? date.toLocaleTimeString(localeMap[currentLanguage] || 'uk-UA', { hour: '2-digit', minute: '2-digit' })
              : '';

            const origCurr = tItem.currency || 'UAH';
            const convertedAmount = convertAmount(tItem.amount, origCurr, currency, exchangeRate);

            return (
              <div
                key={tItem.id}
                className="surface p-3.5 rounded-2xl flex justify-between items-center gap-2 hover:brightness-105 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl ${catObj.color || 'bg-slate-500'} text-white flex items-center justify-center text-sm font-bold shadow-sm shrink-0`}
                  >
                    {renderCategoryIcon(catObj.icon, 'w-5 h-5')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm tracking-tight truncate">
                      {tItem.note || catObj.name}
                    </p>
                    <p className="text-[11px] txt-sub font-semibold truncate">
                      {catObj.name} • {dateStr} {timeStr ? `(${timeStr})` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="font-black text-sm font-num"
                    style={{ color: isExpense ? 'var(--text)' : 'var(--green)' }}
                  >
                    {isExpense ? '-' : '+'}
                    {formatCurrency(convertedAmount, currency, 2)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(currentLanguage === 'ru' ? 'Удалить эту операцию?' : currentLanguage === 'en' ? 'Delete this transaction?' : 'Видалити цю операцію?')) {
                        onDeleteTransaction(tItem.id);
                      }
                    }}
                    className="txt-sub hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

