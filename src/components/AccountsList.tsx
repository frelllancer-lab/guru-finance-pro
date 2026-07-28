import React from 'react';
import { CreditCard, Plus, AlertCircle, Trash2 } from 'lucide-react';
import { BankAccount, Currency } from '../types';
import { convertAmount, formatCurrency } from '../utils/currency';
import { Language, translations } from '../i18n/translations';

interface AccountsListProps {
  accounts: BankAccount[];
  currency: Currency;
  exchangeRate: number;
  onOpenAddModal: () => void;
  onOpenDetailModal: (account: BankAccount) => void;
  onDeleteAccount: (id: string) => void;
  currentLanguage?: Language;
}

const bankColors = ['#3D6BFF', '#00B37E', '#8B5CF6', '#FF9F1C', '#F4384B', '#5856D6', '#FF2D55'];

export const AccountsList: React.FC<AccountsListProps> = ({
  accounts,
  currency,
  exchangeRate,
  onOpenAddModal,
  onOpenDetailModal,
  onDeleteAccount,
  currentLanguage = 'uk',
}) => {
  const t = translations[currentLanguage] || translations.uk;

  // Calculate total mandatory minimum monthly payment across all debts
  const totalMinPayment = React.useMemo(() => {
    return accounts.reduce((sum, acc) => {
      const accCurr = acc.currency || 'UAH';
      const debtConverted = convertAmount(acc.debt || 0, accCurr, currency, exchangeRate);
      const minPay = acc.minPayment
        ? convertAmount(acc.minPayment, accCurr, currency, exchangeRate)
        : debtConverted * 0.05;
      return sum + minPay;
    }, 0);
  }, [accounts, currency, exchangeRate]);

  // Group accounts by bank
  const groupedAccounts = React.useMemo(() => {
    const map: Record<string, BankAccount[]> = {};
    accounts.forEach((acc) => {
      const bankName = acc.bank || 'Другий банк';
      if (!map[bankName]) map[bankName] = [];
      map[bankName].push(acc);
    });
    return map;
  }, [accounts]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h2 className="font-display font-bold text-base tracking-tight">{t.myAccountsAndCards}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddModal}
            className="text-xs font-bold px-2.5 py-1.5 rounded-xl surface-soft hover:brightness-105 active:scale-95 transition flex items-center gap-1 text-blue-500"
          >
            <Plus className="w-3.5 h-3.5" /> {t.connectBankApi}
          </button>
        </div>
      </div>

      {/* Mandatory minimum payment alert banner */}
      <div
        className="rounded-2xl p-3.5 flex justify-between items-center"
        style={{
          background: 'color-mix(in srgb, var(--red) 10%, transparent)',
          border: '1px solid color-mix(in srgb, var(--red) 25%, transparent)',
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0"
            style={{
              background: 'color-mix(in srgb, var(--red) 20%, transparent)',
              color: 'var(--red)',
            }}
          >
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: 'var(--red)' }}>
              {t.minPayment}
            </p>
            <p className="text-[10px] txt-sub font-medium truncate">
              {t.totalDebt}
            </p>
          </div>
        </div>
        <span className="font-black text-sm font-num shrink-0" style={{ color: 'var(--red)' }}>
          {formatCurrency(totalMinPayment, currency)}
        </span>
      </div>

      {accounts.length === 0 ? (
        <div className="surface rounded-2xl p-6 text-center text-xs txt-sub">
          {t.noTransactions}
        </div>
      ) : (
        <div className="space-y-3">
          {Object.keys(groupedAccounts).map((bankName, bankIndex) => {
            const cards = groupedAccounts[bankName];
            const bankColor = bankColors[bankIndex % bankColors.length];

            let bankTotalOwn = 0;
            let bankTotalDebt = 0;

            cards.forEach((c) => {
              const cCurr = c.currency || 'UAH';
              bankTotalOwn += convertAmount(c.ownBalance || 0, cCurr, currency, exchangeRate);
              bankTotalDebt += convertAmount(c.debt || 0, cCurr, currency, exchangeRate);
            });

            return (
              <div key={bankName} className="surface rounded-2xl overflow-hidden transition-colors duration-200">
                <div className="p-3.5 surface-soft border-b border-hair flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: bankColor }}></div>
                    <span className="font-black text-sm tracking-tight truncate">{bankName}</span>
                    <span className="text-[10px] surface px-2 py-0.5 rounded-full font-bold shrink-0">
                      {cards.length}
                    </span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black font-num" style={{ color: 'var(--green)' }}>
                      +{formatCurrency(bankTotalOwn, currency)}
                    </span>
                    {bankTotalDebt > 0 && (
                      <span className="text-xs font-black font-num ml-2" style={{ color: 'var(--red)' }}>
                        (-{formatCurrency(bankTotalDebt, currency)})
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2 space-y-1.5">
                  {cards.map((acc) => {
                    const accCurr = acc.currency || 'UAH';
                    const convertedOwn = convertAmount(acc.ownBalance || 0, accCurr, currency, exchangeRate);
                    const convertedDebt = convertAmount(acc.debt || 0, accCurr, currency, exchangeRate);

                    return (
                      <div
                        key={acc.id}
                        onClick={() => onOpenDetailModal(acc)}
                        className="p-2.5 rounded-xl surface-soft cursor-pointer flex justify-between items-center transition gap-2 hover:brightness-105"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <CreditCard className="w-4 h-4 shrink-0" style={{ color: 'var(--accent)' }} />
                          <span className="font-bold text-xs truncate">{acc.name}</span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right font-num">
                            <span className="text-xs font-black" style={{ color: 'var(--green)' }}>
                              +{formatCurrency(convertedOwn, currency)}
                            </span>
                            {convertedDebt > 0 && (
                              <span className="text-xs font-black ml-1.5" style={{ color: 'var(--red)' }}>
                                -{formatCurrency(convertedDebt, currency)}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteAccount(acc.id);
                            }}
                            className="txt-sub hover:text-red-500 p-1 transition"
                            title="Delete card"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

