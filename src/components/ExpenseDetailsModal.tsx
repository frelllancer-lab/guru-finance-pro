import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowUpRight,
  Calendar,
  CreditCard,
  Plus,
  Search,
  Trash2,
  Wallet,
  Clock,
  TrendingDown,
} from 'lucide-react';
import { Transaction, BankAccount, Category, Currency, Period } from '../types';
import { convertAmount, formatCurrency } from '../utils/currency';
import { Language } from '../i18n/translations';
import { renderCategoryIcon } from './TransactionsList';

interface ExpenseDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accounts: BankAccount[];
  categories: Category[];
  currency: Currency;
  exchangeRate: number;
  selectedPeriod: Period;
  currentLanguage?: Language;
  onDeleteTransaction: (id: number) => void;
  onAddExpenseClick: () => void;
}

const MODAL_TEXTS: Record<Language, {
  title: string;
  subtitle: string;
  totalExpense: string;
  totalDebits: string;
  avgDebit: string;
  filterAllAccounts: string;
  searchPlaceholder: string;
  noExpenses: string;
  addExpenseBtn: string;
  account: string;
  category: string;
  dateAndTime: string;
  deleteConfirm: string;
}> = {
  uk: {
    title: 'Усі списання та витрати за рахунками',
    subtitle: 'Детальний журнал витрат і платіжних операцій',
    totalExpense: 'Загальні витрати',
    totalDebits: 'Кількість списань',
    avgDebit: 'Середній чек',
    filterAllAccounts: 'Усі рахунки та карти',
    searchPlaceholder: 'Пошук за приміткою, категорією або сумою...',
    noExpenses: 'За даний період немає списань з рахунків',
    addExpenseBtn: 'Додати нове списання',
    account: 'Рахунок',
    category: 'Категорія',
    dateAndTime: 'Дата і час',
    deleteConfirm: 'Видалити цю запись про витрату?',
  },
  en: {
    title: 'All Account Expenses & Debits',
    subtitle: 'Detailed journal of debits and card payments',
    totalExpense: 'Total Expenses',
    totalDebits: 'Debit Count',
    avgDebit: 'Average Spend',
    filterAllAccounts: 'All Accounts & Cards',
    searchPlaceholder: 'Search by note, category or amount...',
    noExpenses: 'No debit transactions found for this period',
    addExpenseBtn: 'Add New Expense',
    account: 'Account',
    category: 'Category',
    dateAndTime: 'Date & Time',
    deleteConfirm: 'Delete this expense entry?',
  },
  ru: {
    title: 'Все списания и расходы по счетам',
    subtitle: 'Детальный журнал расходов и платежных операций',
    totalExpense: 'Совокупные расходы',
    totalDebits: 'Количество списаний',
    avgDebit: 'Средний чек',
    filterAllAccounts: 'Все счета и карты',
    searchPlaceholder: 'Поиск по примечанию, категории или сумме...',
    noExpenses: 'За выбранный период нет списаний со счетов',
    addExpenseBtn: 'Добавить новое списание',
    account: 'Счет',
    category: 'Категория',
    dateAndTime: 'Дата и время',
    deleteConfirm: 'Удалить эту запись о расходе?',
  },
};

export const ExpenseDetailsModal: React.FC<ExpenseDetailsModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accounts,
  categories,
  currency,
  exchangeRate,
  selectedPeriod,
  currentLanguage = 'uk',
  onDeleteTransaction,
  onAddExpenseClick,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const t = MODAL_TEXTS[currentLanguage] || MODAL_TEXTS.uk;
  const localeMap = { uk: 'uk-UA', en: 'en-US', ru: 'ru-RU' };

  // Filter only expense transactions
  const expenseTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.type !== 'expense') return false;

      // Filter by account if selected
      if (selectedAccountId !== 'all') {
        const txAccount = (tx as any).accountId;
        if (txAccount && txAccount !== selectedAccountId) {
          return false;
        }
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const catObj = categories.find((c) => c.id === tx.category);
        const catName = catObj?.name.toLowerCase() || '';
        const note = (tx.note || '').toLowerCase();
        const amountStr = tx.amount.toString();
        if (!catName.includes(q) && !note.includes(q) && !amountStr.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedAccountId, searchQuery, categories]);

  // Calculate totals
  const totalExpenseSum = useMemo(() => {
    return expenseTransactions.reduce((acc, tx) => {
      return acc + convertAmount(tx.amount, tx.currency, currency, exchangeRate);
    }, 0);
  }, [expenseTransactions, currency, exchangeRate]);

  const avgExpense = expenseTransactions.length > 0 ? totalExpenseSum / expenseTransactions.length : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="surface w-full sm:max-w-2xl rounded-t-4xl sm:rounded-4xl p-5 sm:p-6 space-y-5 modal-enter max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 border-hair shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--red) 16%, transparent)',
                color: 'var(--red)',
              }}
            >
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display font-black text-lg sm:text-xl leading-tight">
                {t.title}
              </h3>
              <p className="text-xs txt-sub font-medium">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full surface-soft flex items-center justify-center txt-sub font-bold hover:bg-red-500/10 hover:text-red-500 active:scale-95 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Banner */}
        <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-3xl surface-soft shrink-0">
          <div className="text-center p-2 rounded-2xl surface border border-hair">
            <span className="text-[10px] font-bold uppercase tracking-wider txt-sub block mb-0.5">
              {t.totalExpense}
            </span>
            <span className="text-base sm:text-lg font-black font-num text-red-500">
              -{formatCurrency(totalExpenseSum, currency)}
            </span>
          </div>

          <div className="text-center p-2 rounded-2xl surface border border-hair">
            <span className="text-[10px] font-bold uppercase tracking-wider txt-sub block mb-0.5">
              {t.totalDebits}
            </span>
            <span className="text-base sm:text-lg font-black font-num txt-main">
              {expenseTransactions.length}
            </span>
          </div>

          <div className="text-center p-2 rounded-2xl surface border border-hair">
            <span className="text-[10px] font-bold uppercase tracking-wider txt-sub block mb-0.5">
              {t.avgDebit}
            </span>
            <span className="text-base sm:text-lg font-black font-num text-red-500">
              {formatCurrency(avgExpense, currency)}
            </span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
          {/* Account selector */}
          <div className="relative flex-1">
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full surface-soft text-xs font-bold rounded-2xl px-3.5 py-2.5 pr-8 appearance-none outline-none border border-hair cursor-pointer"
            >
              <option value="all">{t.filterAllAccounts}</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bank} — {acc.name} ({formatCurrency(acc.ownBalance, acc.currency || 'UAH')})
                </option>
              ))}
            </select>
            <CreditCard className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 txt-sub pointer-events-none" />
          </div>

          {/* Search bar */}
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full surface-soft text-xs font-medium rounded-2xl pl-9 pr-3.5 py-2.5 outline-none border border-hair"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 txt-sub pointer-events-none" />
          </div>

          {/* Add Expense Button */}
          <button
            onClick={() => {
              onClose();
              onAddExpenseClick();
            }}
            className="px-4 py-2.5 bg-red-500 text-white text-xs font-extrabold rounded-2xl shadow-sm flex items-center justify-center gap-1.5 active:scale-95 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addExpenseBtn}</span>
          </button>
        </div>

        {/* Expense Transactions List */}
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 pr-1 min-h-[220px]">
          {expenseTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-xs txt-sub surface-soft rounded-3xl p-6">
              <TrendingDown className="w-10 h-10 mb-3 opacity-40 text-red-500" />
              <p className="font-bold text-sm txt-main mb-1">{t.noExpenses}</p>
              <p className="text-[11px] max-w-xs">{t.subtitle}</p>
            </div>
          ) : (
            expenseTransactions.map((tx) => {
              const catObj = categories.find((c) => c.id === tx.category) || {
                name: 'Витрати',
                icon: 'ShoppingBag',
                color: '#EF4444',
              };

              const txAccount = accounts.find((a) => a.id === (tx as any).accountId);
              const txDate = new Date(tx.date);

              const formattedDate = txDate.toLocaleDateString(localeMap[currentLanguage] || 'uk-UA', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              const formattedTime = txDate.toLocaleTimeString(localeMap[currentLanguage] || 'uk-UA', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const convertedVal = convertAmount(tx.amount, tx.currency, currency, exchangeRate);

              return (
                <div
                  key={tx.id}
                  className="surface-soft p-3.5 rounded-2xl flex items-center justify-between gap-3 border border-hair hover:border-red-500/30 transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold shadow-xs"
                      style={{
                        background: 'color-mix(in srgb, #EF4444 18%, transparent)',
                        color: '#EF4444',
                      }}
                    >
                      {renderCategoryIcon(catObj.icon, 'w-5 h-5')}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-xs sm:text-sm txt-main truncate">
                          {tx.note || catObj.name}
                        </span>
                        {txAccount && (
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-md surface text-red-500 border border-red-500/20 shrink-0">
                            {txAccount.bank} ({txAccount.name})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] txt-sub font-medium mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formattedDate}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-red-500 font-bold">
                          <Clock className="w-3 h-3" />
                          {formattedTime}
                        </span>
                        <span>•</span>
                        <span className="capitalize">{catObj.name}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="font-black text-sm sm:text-base font-num text-red-500 block">
                        -{formatCurrency(convertedVal, currency)}
                      </span>
                      {tx.currency !== currency && (
                        <span className="text-[10px] txt-sub font-semibold block">
                          ({formatCurrency(tx.amount, tx.currency)})
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(t.deleteConfirm)) {
                          onDeleteTransaction(tx.id);
                        }
                      }}
                      className="p-2 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-500 transition opacity-60 group-hover:opacity-100"
                      title="Удалить"
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
    </div>
  );
};
