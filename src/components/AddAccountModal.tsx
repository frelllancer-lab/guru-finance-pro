import React from 'react';
import { X } from 'lucide-react';
import { BankAccount, Currency } from '../types';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveAccount: (account: Omit<BankAccount, 'id'>) => void;
  activeCurrency: Currency;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onSaveAccount,
  activeCurrency,
}) => {
  const [bank, setBank] = React.useState('');
  const [name, setName] = React.useState('');
  const [ownBalance, setOwnBalance] = React.useState('0');
  const [debt, setDebt] = React.useState('0');
  const [minPayment, setMinPayment] = React.useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bank.trim() || !name.trim()) return;

    const own = parseFloat(ownBalance) || 0;
    const debtVal = parseFloat(debt) || 0;
    let minPayVal = parseFloat(minPayment);

    if (isNaN(minPayVal) && debtVal > 0) {
      minPayVal = debtVal * 0.05;
    }

    onSaveAccount({
      bank: bank.trim(),
      name: name.trim(),
      ownBalance: own,
      debt: debtVal,
      minPayment: minPayVal || 0,
      currency: activeCurrency,
    });

    setBank('');
    setName('');
    setOwnBalance('0');
    setDebt('0');
    setMinPayment('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center">
      <div className="surface w-full sm:max-w-sm rounded-t-4xl sm:rounded-4xl p-6 space-y-4 modal-enter max-h-[92dvh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center border-b pb-3 border-hair">
          <h3 className="font-display font-bold text-base">Добавить счет / карту</h3>
          <button onClick={onClose} className="txt-sub font-bold text-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider txt-sub mb-1">
              Название банка / группы
            </label>
            <input
              type="text"
              placeholder="Например: Monobank"
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              required
              className="w-full surface-soft rounded-2xl p-3 text-sm font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider txt-sub mb-1">
              Название карты
            </label>
            <input
              type="text"
              placeholder="Например: Черная карта"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full surface-soft rounded-2xl p-3 text-sm font-semibold outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--green)' }}>
                Свой баланс
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={ownBalance}
                onChange={(e) => setOwnBalance(e.target.value)}
                className="w-full surface-soft rounded-2xl p-3 text-sm font-black outline-none font-num"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--red)' }}>
                Задолженность (-)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0"
                value={debt}
                onChange={(e) => setDebt(e.target.value)}
                className="w-full surface-soft rounded-2xl p-3 text-sm font-black outline-none font-num"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider txt-sub mb-1">
              Минимальный платёж в месяц
            </label>
            <input
              type="number"
              step="0.01"
              placeholder="Автоматически (5%)"
              value={minPayment}
              onChange={(e) => setMinPayment(e.target.value)}
              className="w-full surface-soft rounded-2xl p-3 text-sm font-semibold outline-none font-num"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 text-white font-bold rounded-2xl text-sm active:scale-98 transition btn-primary"
          >
            Сохранить счет
          </button>
        </form>
      </div>
    </div>
  );
};
