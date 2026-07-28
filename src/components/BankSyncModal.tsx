import React, { useState } from 'react';
import {
  X,
  CreditCard,
  Zap,
  Globe,
  Wallet,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  UploadCloud,
  FileText,
  Sparkles,
} from 'lucide-react';
import { BankAccount, Currency, Transaction } from '../types';

interface BankSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveManualAccount: (account: Omit<BankAccount, 'id'>) => void;
  onImportAccounts: (accounts: BankAccount[]) => void;
  onImportTransactions: (transactions: Transaction[]) => void;
  activeCurrency: Currency;
}

export const BankSyncModal: React.FC<BankSyncModalProps> = ({
  isOpen,
  onClose,
  onSaveManualAccount,
  onImportAccounts,
  onImportTransactions,
  activeCurrency,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'monobank' | 'apple_wallet' | 'open_banking'>('monobank');

  // Manual form state
  const [manualBank, setManualBank] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualOwnBalance, setManualOwnBalance] = useState('0');
  const [manualDebt, setManualDebt] = useState('0');

  // Monobank state
  const [monoToken, setMonoToken] = useState(() => localStorage.getItem('monobank_api_token') || '');
  const [monoLoading, setMonoLoading] = useState(false);
  const [monoStatus, setMonoStatus] = useState<string | null>(null);

  // Apple Wallet CSV state
  const [appleCsvLoading, setAppleCsvLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen) return null;

  // Webhook URL for Apple Shortcuts
  const webhookUrl = `${window.location.origin}/api/sync/apple-wallet-shortcut`;

  // Handle Manual Account Submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBank.trim() || !manualName.trim()) return;

    const own = parseFloat(manualOwnBalance) || 0;
    const debtVal = parseFloat(manualDebt) || 0;

    onSaveManualAccount({
      bank: manualBank.trim(),
      name: manualName.trim(),
      ownBalance: own,
      debt: debtVal,
      minPayment: debtVal > 0 ? debtVal * 0.05 : 0,
      currency: activeCurrency,
    });

    setManualBank('');
    setManualName('');
    setManualOwnBalance('0');
    setManualDebt('0');
    onClose();
  };

  // Handle Monobank Sync
  const handleMonobankSync = async () => {
    if (!monoToken.trim()) {
      alert('Пожалуйста, введите токен Monobank API');
      return;
    }

    setMonoLoading(true);
    setMonoStatus(null);

    try {
      localStorage.setItem('monobank_api_token', monoToken.trim());
      const res = await fetch('/api/bank/monobank/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: monoToken.trim() }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.accounts)) {
        onImportAccounts(data.accounts);
        setMonoStatus(`Успешно подключен! Пользователь: ${data.clientName || 'Monobank Client'}. Импортировано карт: ${data.accounts.length}`);
      } else {
        alert(data.error || 'Ошибка подключения к Monobank API. Проверьте токен.');
      }
    } catch (err: any) {
      alert('Ошибка при выполнении запроса к серверу.');
    } finally {
      setMonoLoading(false);
    }
  };

  // Handle Apple Wallet CSV Upload
  const handleAppleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAppleCsvLoading(true);
    try {
      const text = await file.text();
      const res = await fetch('/api/sync/apple-wallet-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csvText: text }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.transactions) && data.transactions.length > 0) {
        const formattedTxs: Transaction[] = data.transactions.map((t: any, i: number) => ({
          id: Date.now() + i,
          type: t.type || 'expense',
          amount: t.amount || 0,
          currency: t.currency || activeCurrency,
          category: t.category || 'shopping',
          note: t.note || 'Apple Wallet / Card',
          date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
        }));
        onImportTransactions(formattedTxs);
        alert(`Успешно импортировано ${formattedTxs.length} транзакций из Apple Wallet!`);
        onClose();
      } else {
        alert('Не удалось извлечь транзакции из файла CSV.');
      }
    } catch (err) {
      alert('Ошибка чтения файла выписки Apple Wallet.');
    } finally {
      setAppleCsvLoading(false);
      e.target.value = '';
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="surface w-full sm:max-w-md rounded-t-4xl sm:rounded-4xl p-5 sm:p-6 space-y-4 modal-enter max-h-[92dvh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 border-hair">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-xs"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                color: '#fff',
              }}
            >
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base tracking-tight">Подключение банков и карт</h3>
              <p className="text-[10px] txt-sub font-medium">Авто-синхронизация или ручной ввод</p>
            </div>
          </div>
          <button onClick={onClose} className="txt-sub font-bold text-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-4 gap-1 p-1 surface-soft rounded-2xl text-[11px] font-bold">
          <button
            onClick={() => setActiveTab('monobank')}
            className={`py-2 rounded-xl transition ${
              activeTab === 'monobank' ? 'surface shadow-sm text-blue-500' : 'txt-sub'
            }`}
          >
            Monobank
          </button>
          <button
            onClick={() => setActiveTab('apple_wallet')}
            className={`py-2 rounded-xl transition ${
              activeTab === 'apple_wallet' ? 'surface shadow-sm text-purple-500' : 'txt-sub'
            }`}
          >
            Apple Wallet
          </button>
          <button
            onClick={() => setActiveTab('open_banking')}
            className={`py-2 rounded-xl transition ${
              activeTab === 'open_banking' ? 'surface shadow-sm text-emerald-500' : 'txt-sub'
            }`}
          >
            Банки API
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`py-2 rounded-xl transition ${
              activeTab === 'manual' ? 'surface shadow-sm text-current' : 'txt-sub'
            }`}
          >
            Вручную
          </button>
        </div>

        {/* Tab 1: Monobank API */}
        {activeTab === 'monobank' && (
          <div className="space-y-4 py-1">
            <div className="p-3.5 surface-soft rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-900 dark:bg-white inline-block"></span>
                  Monobank Personal API
                </span>
                <a
                  href="https://api.monobank.ua/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] font-bold text-blue-500 flex items-center gap-0.5 hover:underline"
                >
                  Получить ключ <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-[11px] txt-sub leading-relaxed">
                Введите личный токен из кабинета <strong className="text-current">api.monobank.ua</strong>. Приложение автоматически подтянет все ваши карты, реальные балансы и кредитные лимиты.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider txt-sub">
                Ваш X-Token (Monobank API)
              </label>
              <input
                type="password"
                placeholder="Вставьте токен u..."
                value={monoToken}
                onChange={(e) => setMonoToken(e.target.value)}
                className="w-full surface-soft rounded-2xl p-3 text-sm font-num outline-none font-semibold border border-hair focus:border-blue-500"
              />
            </div>

            {monoStatus && (
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{monoStatus}</span>
              </div>
            )}

            <button
              onClick={handleMonobankSync}
              disabled={monoLoading}
              className="w-full py-3.5 text-white font-bold rounded-2xl text-sm active:scale-98 transition btn-primary flex items-center justify-center gap-2"
            >
              {monoLoading ? (
                <span>Подключение к Monobank...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Синхронизировать карты и баланс
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 2: Apple Wallet */}
        {activeTab === 'apple_wallet' && (
          <div className="space-y-4 py-1">
            <div className="p-3.5 surface-soft rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-xs">Интеграция с Apple Wallet & Apple Pay</span>
              </div>
              <p className="text-[11px] txt-sub leading-relaxed">
                Вы можете либо загрузить файл выписки Apple Card / Wallet (CSV/TXT), либо настроить авто-подтяг транзакций через приложение «Команды» (iOS Shortcuts).
              </p>
            </div>

            {/* Option A: CSV Upload */}
            <div className="p-3.5 surface rounded-2xl border border-hair space-y-2">
              <h4 className="font-bold text-xs">Способ 1: Импорт файла выписки (CSV / TXT)</h4>
              <p className="text-[10px] txt-sub">
                Экспортируйте выписку из Apple Wallet или Apple Card и загрузите файл сюда:
              </p>
              <label className="flex items-center justify-center gap-2 w-full p-3 surface-soft rounded-xl text-xs font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition">
                <UploadCloud className="w-4 h-4 text-purple-500" />
                <span>{appleCsvLoading ? 'ИИ считывает выписку...' : 'Выбрать файл CSV / TXT'}</span>
                <input
                  type="file"
                  accept=".csv,.txt,text/plain,text/csv"
                  className="hidden"
                  onChange={handleAppleCsvUpload}
                  disabled={appleCsvLoading}
                />
              </label>
            </div>

            {/* Option B: iOS Shortcut Webhook */}
            <div className="p-3.5 surface rounded-2xl border border-hair space-y-2">
              <h4 className="font-bold text-xs flex items-center gap-1.5">
                Способ 2: Авто-подтяг при оплате Apple Pay (iOS Shortcuts)
                <span className="pro-chip text-[9px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5" /> Авто
                </span>
              </h4>
              <p className="text-[10px] txt-sub">
                Создайте Автоматизацию в iOS Shortcuts при совершении покупки через Apple Pay. Добавьте отправку POST запроса на этот адрес:
              </p>

              <div className="flex items-center gap-1.5 p-2 surface-soft rounded-xl text-[10px] font-num font-bold min-w-0">
                <span className="truncate flex-1 txt-sub">{webhookUrl}</span>
                <button
                  onClick={handleCopyWebhook}
                  className="px-2 py-1 bg-purple-500 text-white rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1"
                >
                  {copySuccess ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copySuccess ? 'Скопировано' : 'Копировать'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Open Banking & PrivatBank */}
        {activeTab === 'open_banking' && (
          <div className="space-y-4 py-1">
            <div className="p-3.5 surface-soft rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-xs">Приват24 / Open Banking / Plaid</span>
              </div>
              <p className="text-[11px] txt-sub leading-relaxed">
                Приложение поддерживает прямое подсоединение API для Приват24, Nordigen (GoCardless) и европейских банков Open Banking.
              </p>
            </div>

            <div className="p-3.5 surface rounded-2xl border border-hair space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs">Приват24 Автоклиент / Бизнес API</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">Поддерживается</span>
              </div>
              <p className="text-[10px] txt-sub">
                Для автоматической подгрузки выписок из ПриватБанка также доступен загрузчик PDF выписок на главном экране.
              </p>
            </div>

            <div className="p-3.5 surface rounded-2xl border border-hair space-y-2">
              <span className="font-bold text-xs">GoCardless / Salt Edge Integration</span>
              <p className="text-[10px] txt-sub">
                Загружайте PDF/CSV файлы выписок любого банка мира — наш встроенный ИИ автоматически распознает счета, балансы и категорию каждой операции.
              </p>
            </div>
          </div>
        )}

        {/* Tab 4: Manual Account Entry */}
        {activeTab === 'manual' && (
          <form onSubmit={handleManualSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider txt-sub mb-1">
                Название банка / группы
              </label>
              <input
                type="text"
                placeholder="Например: PrivatBank, Revolut, Cash"
                value={manualBank}
                onChange={(e) => setManualBank(e.target.value)}
                required
                className="w-full surface-soft rounded-2xl p-3 text-sm font-semibold outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider txt-sub mb-1">
                Название карты или счета
              </label>
              <input
                type="text"
                placeholder="Например: Основная Gold"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
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
                  value={manualOwnBalance}
                  onChange={(e) => setManualOwnBalance(e.target.value)}
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
                  value={manualDebt}
                  onChange={(e) => setManualDebt(e.target.value)}
                  className="w-full surface-soft rounded-2xl p-3 text-sm font-black outline-none font-num"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 text-white font-bold rounded-2xl text-sm active:scale-98 transition btn-primary"
            >
              Сохранить счет вручную
            </button>
          </form>
        )}

        <div className="pt-2 border-t border-hair flex items-center justify-between text-[10px] txt-sub font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Все ключи и данные хранятся локально
          </span>
          <button onClick={onClose} className="font-bold hover:underline">
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
