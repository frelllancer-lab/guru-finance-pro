import React from 'react';
import { X, CreditCard } from 'lucide-react';
import { BankAccount, Currency } from '../types';
import { convertAmount, formatCurrency } from '../utils/currency';

interface AccountDetailModalProps {
  account: BankAccount | null;
  isOpen: boolean;
  onClose: () => void;
  currency: Currency;
  exchangeRate: number;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  isOpen,
  onClose,
  currency,
  exchangeRate,
}) => {
  if (!isOpen || !account) return null;

  const accCurr = account.currency || 'UAH';
  const convertedOwn = convertAmount(account.ownBalance || 0, accCurr, currency, exchangeRate);
  const convertedDebt = convertAmount(account.debt || 0, accCurr, currency, exchangeRate);
  const minPay = account.minPayment
    ? convertAmount(account.minPayment, accCurr, currency, exchangeRate)
    : convertedDebt * 0.05;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="surface w-full max-w-sm rounded-4xl p-6 space-y-4 modal-enter">
        <div className="flex justify-between items-center border-b pb-3 border-hair">
          <div className="flex items-center gap-2 min-w-0">
            <CreditCard className="w-5 h-5 shrink-0" style={{ color: 'var(--accent)' }} />
            <h3 className="font-display font-black text-base truncate">{account.name}</h3>
          </div>
          <button onClick={onClose} className="txt-sub font-bold text-sm shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between p-3 surface-soft rounded-2xl">
            <span className="txt-sub font-bold">Банк / Группа:</span>
            <span className="font-black">{account.bank || 'Основной банк'}</span>
          </div>

          <div className="flex justify-between p-3 surface-soft rounded-2xl">
            <span className="txt-sub font-bold">Собственный баланс:</span>
            <span className="font-black font-num" style={{ color: 'var(--green)' }}>
              +{formatCurrency(convertedOwn, currency, 2)}
            </span>
          </div>

          <div className="flex justify-between p-3 surface-soft rounded-2xl">
            <span className="txt-sub font-bold">Задолженность:</span>
            <span className="font-black font-num" style={{ color: 'var(--red)' }}>
              -{formatCurrency(convertedDebt, currency, 2)}
            </span>
          </div>

          <div className="flex justify-between p-3 surface-soft rounded-2xl">
            <span className="txt-sub font-bold">Мин. платёж в месяц:</span>
            <span className="font-black font-num" style={{ color: 'var(--orange)' }}>
              {formatCurrency(minPay, currency, 2)}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 text-white font-bold rounded-2xl text-xs active:scale-98 transition btn-primary"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};
