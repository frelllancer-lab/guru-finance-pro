import React from 'react';
import { ArrowDownRight, ArrowUpRight, Eye } from 'lucide-react';
import { Currency } from '../types';
import { formatCurrency } from '../utils/currency';
import { Language, translations } from '../i18n/translations';

interface BalanceCardProps {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  currency: Currency;
  currentLanguage?: Language;
  onIncomeClick?: () => void;
  onExpenseClick?: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  totalBalance,
  totalIncome,
  totalExpense,
  currency,
  currentLanguage = 'uk',
  onIncomeClick,
  onExpenseClick,
}) => {
  const t = translations[currentLanguage] || translations.uk;

  return (
    <div className="relative surface rounded-4xl p-6 sm:p-7 space-y-5 overflow-hidden">
      <div className="halo"></div>

      <div className="relative text-center">
        <span className="text-[11px] font-bold uppercase tracking-[.2em] txt-sub">
          {t.netBalance}
        </span>
        <div className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight mt-1 font-num">
          {formatCurrency(totalBalance, currency)}
        </div>
      </div>

      <div className="relative grid grid-cols-2 gap-3 pt-4 border-t border-hair">
        <div
          onClick={onIncomeClick}
          className={`flex items-center justify-between gap-2 surface-soft p-3 rounded-2xl min-w-0 transition ${
            onIncomeClick ? 'cursor-pointer hover:border-emerald-500/40 border border-transparent hover:bg-emerald-500/5 active:scale-98' : ''
          }`}
          title="Нажмите для просмотра всех зачислений по счетам"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--green) 16%, transparent)',
                color: 'var(--green)',
              }}
            >
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold txt-sub flex items-center gap-1">
                <span>{t.totalIncome}</span>
              </p>
              <p className="text-sm font-black font-num truncate" style={{ color: 'var(--green)' }}>
                +{formatCurrency(totalIncome, currency)}
              </p>
            </div>
          </div>
          {onIncomeClick && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md surface-soft text-emerald-600 border border-emerald-500/30 shrink-0 hidden sm:inline-block">
              Детали
            </span>
          )}
        </div>

        <div
          onClick={onExpenseClick}
          className={`flex items-center justify-between gap-2 surface-soft p-3 rounded-2xl min-w-0 transition ${
            onExpenseClick ? 'cursor-pointer hover:border-red-500/40 border border-transparent hover:bg-red-500/5 active:scale-98' : ''
          }`}
          title="Нажмите для просмотра всех списаний по счетам"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--red) 16%, transparent)',
                color: 'var(--red)',
              }}
            >
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold txt-sub flex items-center gap-1">
                <span>{t.totalExpense}</span>
              </p>
              <p className="text-sm font-black font-num truncate" style={{ color: 'var(--red)' }}>
                -{formatCurrency(totalExpense, currency)}
              </p>
            </div>
          </div>
          {onExpenseClick && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md surface-soft text-red-500 border border-red-500/30 shrink-0 hidden sm:inline-block">
              Детали
            </span>
          )}
        </div>
      </div>
    </div>
  );
};


