import React from 'react';
import { X, Camera, Plus } from 'lucide-react';
import { TransactionType, Category, Currency } from '../types';
import { renderCategoryIcon } from './TransactionsList';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (data: {
    type: TransactionType;
    amount: number;
    currency: Currency;
    category: string;
    note: string;
    date: string;
  }) => void;
  categoriesExpense: Category[];
  categoriesIncome: Category[];
  activeCurrency: Currency;
  onOpenAddCategory: () => void;
  onScanReceipt: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  categoriesExpense,
  categoriesIncome,
  activeCurrency,
  onOpenAddCategory,
  onScanReceipt,
}) => {
  const [type, setType] = React.useState<TransactionType>('expense');
  const [amount, setAmount] = React.useState<string>('');
  const [category, setCategory] = React.useState<string>('food');
  const [note, setNote] = React.useState<string>('');
  const [datetime, setDatetime] = React.useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDatetime(now.toISOString().slice(0, 16));
    }
  }, [isOpen]);

  const currentCategories = type === 'expense' ? categoriesExpense : categoriesIncome;

  React.useEffect(() => {
    if (currentCategories.length > 0 && !currentCategories.some((c) => c.id === category)) {
      setCategory(currentCategories[0].id);
    }
  }, [type, currentCategories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    const isoDate = datetime ? new Date(datetime).toISOString() : new Date().toISOString();

    onAddTransaction({
      type,
      amount: numAmount,
      currency: activeCurrency,
      category,
      note: note.trim(),
      date: isoDate,
    });

    setAmount('');
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center">
      <div className="surface w-full sm:max-w-md rounded-t-4xl sm:rounded-4xl p-6 space-y-5 modal-enter max-h-[92dvh] overflow-y-auto no-scrollbar">
          <div className="flex justify-between items-center border-b pb-3 border-hair">
            <div className="flex items-center gap-2 min-w-0">
              <div>
                <h3 className="text-lg font-display font-bold">Новая запись</h3>
                <p className="text-[11px] font-bold txt-sub">Ввод вручную — без чека и выписки</p>
              </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onScanReceipt();
              }}
              className="text-xs px-3 py-1 rounded-full font-bold active:scale-95 transition flex items-center gap-1 shrink-0"
              style={{
                background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
                color: 'var(--accent)',
              }}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Сканировать</span>
            </button>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full surface-soft flex items-center justify-center txt-sub font-bold active:scale-95 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Segment: Expense / Income */}
          <div className="grid grid-cols-2 gap-2 p-1 surface-soft rounded-2xl text-center font-bold text-sm">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-2.5 rounded-xl transition ${
                type === 'expense' ? 'surface shadow-sm' : 'txt-sub'
              }`}
              style={{ color: type === 'expense' ? 'var(--red)' : undefined }}
            >
              Расход
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-2.5 rounded-xl transition ${
                type === 'income' ? 'surface shadow-sm' : 'txt-sub'
              }`}
              style={{ color: type === 'income' ? 'var(--green)' : undefined }}
            >
              Доход
            </button>
          </div>

          {/* Amount input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider txt-sub">Сумма</label>
              <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                Валюта: {activeCurrency} ({activeCurrency === 'UAH' ? '₴' : '$'})
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full text-3xl font-black font-num surface-soft rounded-2xl p-4 pr-12 text-center outline-none"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black txt-sub text-xl">
                {activeCurrency === 'UAH' ? '₴' : '$'}
              </span>
            </div>
          </div>

          {/* Date and time */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider txt-sub mb-1">
              Дата и время
            </label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              required
              className="w-full surface-soft rounded-2xl p-3 text-xs font-bold outline-none"
            />
          </div>

          {/* Categories grid */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[11px] font-bold uppercase tracking-wider txt-sub">Категория</label>
              <button
                type="button"
                onClick={onOpenAddCategory}
                className="text-xs font-bold flex items-center gap-0.5"
                style={{ color: 'var(--accent)' }}
              >
                <Plus className="w-3 h-3" /> Новая
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 text-center max-h-40 overflow-y-auto no-scrollbar p-1">
              {currentCategories.map((cat) => {
                const isSelected = cat.id === category;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center p-2 rounded-2xl transition ${
                      isSelected ? '' : 'opacity-70 hover:opacity-100'
                    }`}
                    style={
                      isSelected
                        ? {
                            background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                            border: '1px solid color-mix(in srgb, var(--accent) 40%, transparent)',
                          }
                        : undefined
                    }
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl ${cat.color} text-white flex items-center justify-center text-sm shadow-sm mb-1`}
                    >
                      {renderCategoryIcon(cat.icon, 'w-5 h-5')}
                    </div>
                    <span className="text-[11px] font-bold truncate w-full">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider txt-sub mb-1">
              Заметка / Магазин
            </label>
            <input
              type="text"
              placeholder="Например: Продукты в Сильпо"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full surface-soft rounded-2xl p-3 text-sm font-semibold outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 text-white font-bold rounded-2xl active:scale-98 transition text-base btn-primary"
          >
            Сохранить
          </button>
        </form>
      </div>
    </div>
  );
};
