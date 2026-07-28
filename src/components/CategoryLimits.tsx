import React, { useState } from 'react';
import { Target, Edit2, AlertTriangle, CheckCircle2, Sliders, X } from 'lucide-react';
import { Category, Transaction, Currency } from '../types';
import { convertAmount, formatCurrency } from '../utils/currency';
import { renderCategoryIcon } from './TransactionsList';
import { Language, translations } from '../i18n/translations';

interface CategoryLimitsProps {
  categories: Category[];
  transactions: Transaction[];
  currency: Currency;
  exchangeRate: number;
  categoryLimits: Record<string, number>;
  onSetCategoryLimit: (categoryId: string, limit: number) => void;
  currentLanguage?: Language;
}

export const CategoryLimits: React.FC<CategoryLimitsProps> = ({
  categories,
  transactions,
  currency,
  exchangeRate,
  categoryLimits,
  onSetCategoryLimit,
  currentLanguage = 'uk',
}) => {
  const t = translations[currentLanguage] || translations.uk;
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [limitInputValue, setLimitInputValue] = useState<string>('');

  // Calculate current month expense for each category
  const currentMonthExpenses = React.useMemo(() => {
    const now = new Date();
    const map: Record<string, number> = {};

    transactions.forEach((tItem) => {
      if (tItem.type !== 'expense') return;
      const d = new Date(tItem.date);
      if (isNaN(d.getTime())) return;
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        const converted = convertAmount(tItem.amount, tItem.currency || 'UAH', currency, exchangeRate);
        map[tItem.category] = (map[tItem.category] || 0) + converted;
      }
    });

    return map;
  }, [transactions, currency, exchangeRate]);

  // Overall budget stats
  const { totalLimit, totalSpent } = React.useMemo(() => {
    let limitSum = 0;
    let spentSum = 0;

    categories.forEach((cat) => {
      const catLimit = categoryLimits[cat.id] || 0;
      const catSpent = currentMonthExpenses[cat.id] || 0;
      if (catLimit > 0) {
        limitSum += catLimit;
        spentSum += catSpent;
      }
    });

    return { totalLimit: limitSum, totalSpent: spentSum };
  }, [categories, categoryLimits, currentMonthExpenses]);

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat);
    setLimitInputValue((categoryLimits[cat.id] || 0).toString());
  };

  const handleSaveLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const val = parseFloat(limitInputValue);
    onSetCategoryLimit(editingCategory.id, isNaN(val) || val < 0 ? 0 : val);
    setEditingCategory(null);
  };

  return (
    <div className="surface rounded-4xl p-5 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs"
            style={{
              background: 'color-mix(in srgb, var(--accent) 16%, transparent)',
              color: 'var(--accent)',
            }}
          >
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display font-bold text-base tracking-tight">{t.categoryLimitsTitle}</h2>
            <p className="text-[10px] txt-sub font-medium">{t.budgetLimit}</p>
          </div>
        </div>

        {totalLimit > 0 && (
          <div className="text-right">
            <p className="text-[10px] uppercase font-bold txt-sub">{t.budgetLimit} / {t.spent}</p>
            <p className="text-xs font-black font-num">
              <span style={{ color: totalSpent > totalLimit ? 'var(--red)' : 'var(--green)' }}>
                {formatCurrency(totalSpent, currency)}
              </span>
              <span className="txt-sub"> / {formatCurrency(totalLimit, currency)}</span>
            </p>
          </div>
        )}
      </div>

      {/* Category List with Progress Bars */}
      <div className="space-y-3">
        {categories.map((cat) => {
          const limit = categoryLimits[cat.id] || 0;
          const spent = currentMonthExpenses[cat.id] || 0;
          const percent = limit > 0 ? Math.min(Math.round((spent / limit) * 100), 100) : 0;
          const isExceeded = limit > 0 && spent > limit;
          const isWarning = limit > 0 && spent >= limit * 0.8 && spent <= limit;

          let barColor = 'var(--green)';
          if (isExceeded) barColor = 'var(--red)';
          else if (isWarning) barColor = 'var(--orange)';

          return (
            <div
              key={cat.id}
              className="p-3 surface-soft rounded-2xl space-y-2 hover:brightness-105 transition"
            >
              <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl ${
                      cat.color || 'bg-slate-500'
                    } text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm`}
                  >
                    {renderCategoryIcon(cat.icon, 'w-4 h-4')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs truncate">{cat.name}</p>
                    <p className="text-[10px] txt-sub font-semibold font-num">
                      {formatCurrency(spent, currency, 0)}
                      {limit > 0 ? ` / ${formatCurrency(limit, currency, 0)}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {limit > 0 && (
                    <span
                      className="text-[10px] font-black px-2 py-0.5 rounded-full font-num"
                      style={{
                        background: `color-mix(in srgb, ${barColor} 18%, transparent)`,
                        color: barColor,
                      }}
                    >
                      {isExceeded ? t.exceeded : `${percent}%`}
                    </span>
                  )}

                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 surface rounded-xl txt-sub hover:text-current active:scale-95 transition"
                    title={t.setLimit}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              {limit > 0 && (
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ background: 'var(--border-soft)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: barColor,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Limit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="surface w-full max-w-sm rounded-4xl p-6 space-y-4 modal-enter">
            <div className="flex justify-between items-center border-b pb-3 border-hair">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-7 h-7 rounded-xl ${
                    editingCategory.color || 'bg-slate-500'
                  } text-white flex items-center justify-center text-xs font-bold shrink-0`}
                >
                  {renderCategoryIcon(editingCategory.icon, 'w-4 h-4')}
                </div>
                <h3 className="font-display font-bold text-sm truncate">
                  {t.budgetLimit}: {editingCategory.name}
                </h3>
              </div>
              <button onClick={() => setEditingCategory(null)} className="txt-sub font-bold text-sm">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLimit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider txt-sub mb-1">
                  {t.budgetLimit} ({currency})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="100"
                    placeholder="0"
                    value={limitInputValue}
                    onChange={(e) => setLimitInputValue(e.target.value)}
                    className="w-full surface-soft rounded-2xl p-3 text-lg font-black font-num outline-none text-center"
                    autoFocus
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold txt-sub text-xs">
                    {currency === 'UAH' ? '₴' : '$'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 py-3 surface-soft font-bold rounded-2xl text-xs active:scale-98 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-white font-bold rounded-2xl text-xs active:scale-98 transition btn-primary"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

