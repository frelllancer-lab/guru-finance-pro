import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Camera, Plus, Brain, RefreshCw, ArrowLeft, Zap } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  subscribeToUserData,
  saveUserDataToFirestore,
  checkUserDocExists,
} from './lib/firebase';
import { Language, getSystemLanguage, translations } from './i18n/translations';
import {
  Currency,
  Period,
  Transaction,
  BankAccount,
  CustomCategories,
  UserProfile,
  Category,
  TransactionType,
} from './types';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  INITIAL_CUSTOM_CATEGORIES,
} from './data/categories';
import { convertAmount, formatCurrency } from './utils/currency';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PeriodFilter } from './components/PeriodFilter';
import { BalanceCard } from './components/BalanceCard';
import { AiActions } from './components/AiActions';
import { AccountsList } from './components/AccountsList';
import { AiAdvisor } from './components/AiAdvisor';
import { ExpenseChart } from './components/ExpenseChart';
import { TransactionsList } from './components/TransactionsList';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AddAccountModal } from './components/AddAccountModal';
import { BankSyncModal } from './components/BankSyncModal';
import { AddCategoryModal } from './components/AddCategoryModal';
import { AccountDetailModal } from './components/AccountDetailModal';
import { AuthModal } from './components/AuthModal';
import { AiLoader } from './components/AiLoader';
import { CategoryLimits } from './components/CategoryLimits';
import { IncomeDetailsModal } from './components/IncomeDetailsModal';
import { ExpenseDetailsModal } from './components/ExpenseDetailsModal';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@6.1.200/build/pdf.worker.min.mjs`;

const INITIAL_ACCOUNTS: BankAccount[] = [];

const INITIAL_TRANSACTIONS: Transaction[] = [];

export default function App() {
  // Application State
  const [activeCurrency, setActiveCurrency] = useState<Currency>(() => {
    return (localStorage.getItem('ios_finance_currency') as Currency) || 'UAH';
  });

  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    return parseFloat(localStorage.getItem('ios_finance_rate') || '41.5');
  });

  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');

  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('ios_finance_theme') === 'dark';
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('ios_finance_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('ios_finance_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  const [customCategories, setCustomCategories] = useState<CustomCategories>(() => {
    const saved = localStorage.getItem('ios_finance_custom_categories');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOM_CATEGORIES;
  });

  const [categoryLimits, setCategoryLimits] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('ios_finance_category_limits');
    return saved
      ? JSON.parse(saved)
      : { food: 5000, transport: 1500, shopping: 3000, home: 8000, fun: 2000 };
  });

  // Language state initialized with system language default or saved preference
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('ios_finance_language');
    if (saved === 'uk' || saved === 'en' || saved === 'ru') {
      return saved;
    }
    return getSystemLanguage();
  });

  useEffect(() => {
    localStorage.setItem('ios_finance_language', currentLanguage);
  }, [currentLanguage]);

  const t = translations[currentLanguage] || translations.uk;

  const [userProfile, setUserProfile] = useState<UserProfile>({
    isLoggedIn: false,
    isCloudSynced: false,
  });

  const [aiAdviceText, setAiAdviceText] = useState<string>(
    'Нажмите «Анализ» для получения персонализированных ИИ-рекомендаций по вашим картам, доходам и расходам.'
  );
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState<boolean>(false);

  // Modals & Navigation
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isAccountDetailOpen, setIsAccountDetailOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isIncomeDetailsOpen, setIsIncomeDetailsOpen] = useState(false);
  const [isExpenseDetailsOpen, setIsExpenseDetailsOpen] = useState(false);

  // AI Loader
  const [aiLoader, setAiLoader] = useState<{ isOpen: boolean; title: string; subtitle: string }>({
    isOpen: false,
    title: '',
    subtitle: '',
  });

  // File Input Refs
  const universalFileRef = useRef<HTMLInputElement>(null);
  const receiptFileRef = useRef<HTMLInputElement>(null);
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const multiBankFileRef = useRef<HTMLInputElement>(null);

  // Theme effect
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('ios_finance_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('ios_finance_theme', 'light');
    }
  }, [isDark]);

  // Persist State
  useEffect(() => {
    localStorage.setItem('ios_finance_currency', activeCurrency);
  }, [activeCurrency]);

  useEffect(() => {
    localStorage.setItem('ios_finance_rate', exchangeRate.toString());
  }, [exchangeRate]);

  useEffect(() => {
    localStorage.setItem('ios_finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('ios_finance_accounts', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem('ios_finance_custom_categories', JSON.stringify(customCategories));
  }, [customCategories]);

  useEffect(() => {
    localStorage.setItem('ios_finance_category_limits', JSON.stringify(categoryLimits));
  }, [categoryLimits]);

  // Firebase Auth Listener & Real-time Cloud Syncing
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUserProfile({
          isLoggedIn: true,
          isCloudSynced: true,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Пользователь',
          email: firebaseUser.email || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          phoneNumber: firebaseUser.phoneNumber || undefined,
        });

        // Check if user already has cloud data
        const userExists = await checkUserDocExists(firebaseUser.uid);
        if (!userExists) {
          // Sync current local state to cloud on first login
          await saveUserDataToFirestore(firebaseUser.uid, {
            accounts: bankAccounts,
            transactions: transactions,
            categoryLimits: categoryLimits as any,
          });
        }

        // Subscribe to real-time changes from Firestore
        unsubscribeFirestore = subscribeToUserData(firebaseUser.uid, (cloudData) => {
          if (cloudData.accounts && cloudData.accounts.length > 0) {
            setBankAccounts(cloudData.accounts);
          }
          if (cloudData.transactions && cloudData.transactions.length > 0) {
            setTransactions(cloudData.transactions);
          }
          if (cloudData.categoryLimits && Object.keys(cloudData.categoryLimits).length > 0) {
            setCategoryLimits(cloudData.categoryLimits as any);
          }
        });
      } else {
        setUserProfile({
          isLoggedIn: false,
          isCloudSynced: false,
        });
        if (unsubscribeFirestore) {
          unsubscribeFirestore();
          unsubscribeFirestore = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  // Sync mutations to Firestore if user is authenticated
  useEffect(() => {
    if (auth.currentUser?.uid) {
      saveUserDataToFirestore(auth.currentUser.uid, {
        accounts: bankAccounts,
        transactions: transactions,
        categoryLimits: categoryLimits as any,
      });
    }
  }, [bankAccounts, transactions, categoryLimits]);

  // Fetch online exchange rate on start
  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch('/api/exchange-rates');
        if (res.ok) {
          const data = await res.json();
          if (data.rates && data.rates.UAH) {
            setExchangeRate(parseFloat(data.rates.UAH.toFixed(2)));
          }
        }
      } catch (e) {
        // Fallback to default
      }
    }
    fetchRate();
  }, []);

  // Merge default & custom categories
  const allCategories = useMemo(() => {
    return {
      expense: [...DEFAULT_EXPENSE_CATEGORIES, ...(customCategories.expense || [])],
      income: [...DEFAULT_INCOME_CATEGORIES, ...(customCategories.income || [])],
      all: [
        ...DEFAULT_EXPENSE_CATEGORIES,
        ...(customCategories.expense || []),
        ...DEFAULT_INCOME_CATEGORIES,
        ...(customCategories.income || []),
      ],
    };
  }, [customCategories]);

  // Filter transactions by selected period
  const filteredTransactions = useMemo(() => {
    if (selectedPeriod === 'all') return transactions;
    const now = new Date();
    return transactions.filter((t) => {
      const d = new Date(t.date);
      if (isNaN(d.getTime())) return true;
      if (selectedPeriod === 'day') return d.toDateString() === now.toDateString();
      if (selectedPeriod === 'week') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= oneWeekAgo && d <= now;
      }
      if (selectedPeriod === 'month')
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (selectedPeriod === 'year') return d.getFullYear() === now.getFullYear();
      return true;
    });
  }, [transactions, selectedPeriod]);

  // Balance calculations
  const { totalIncome, totalExpense, aggregatedBalance } = useMemo(() => {
    let inc = 0;
    let exp = 0;

    filteredTransactions.forEach((t) => {
      const converted = convertAmount(t.amount, t.currency || 'UAH', activeCurrency, exchangeRate);
      if (t.type === 'income') inc += converted;
      if (t.type === 'expense') exp += converted;
    });

    let bankOwn = 0;
    let bankDebt = 0;

    bankAccounts.forEach((a) => {
      bankOwn += convertAmount(a.ownBalance || 0, a.currency || 'UAH', activeCurrency, exchangeRate);
      bankDebt += convertAmount(a.debt || 0, a.currency || 'UAH', activeCurrency, exchangeRate);
    });

    const balance = inc + bankOwn - (exp + bankDebt);

    return {
      totalIncome: inc,
      totalExpense: exp,
      aggregatedBalance: balance,
    };
  }, [filteredTransactions, bankAccounts, activeCurrency, exchangeRate]);

  // Period label text
  const periodText = useMemo(() => {
    switch (selectedPeriod) {
      case 'day':
        return 'За сегодня';
      case 'week':
        return 'За 7 дней';
      case 'month':
        return 'За текущий месяц';
      case 'year':
        return 'За текущий год';
      default:
        return 'За весь период';
    }
  }, [selectedPeriod]);

  // AI Financial Advice Generator
  const generateAIFinancialAdvice = async () => {
    setIsGeneratingAdvice(true);
    setAiLoader({
      isOpen: true,
      title: t.aiAdviceAnalyzing,
      subtitle: t.aiAdviceSubtitle,
    });

    try {
      const response = await fetch('/api/ai/advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period: selectedPeriod,
          currency: activeCurrency,
          income: totalIncome,
          expense: totalExpense,
          debt: bankAccounts.reduce(
            (sum, a) =>
              sum + convertAmount(a.debt || 0, a.currency || 'UAH', activeCurrency, exchangeRate),
            0
          ),
          accountsCount: bankAccounts.length,
          language: currentLanguage,
        }),
      });

      const data = await response.json();
      if (data.advice) {
        setAiAdviceText(data.advice);
      } else {
        setAiAdviceText(
          currentLanguage === 'uk'
            ? 'Вносьте обов’язкові платежі вчасно та формуйте резервний капітал.'
            : currentLanguage === 'en'
            ? 'Make mandatory payments on time and build an emergency fund.'
            : 'Вносите обязательные платежи вовремя и формируйте резервный капитал.'
        );
      }
    } catch (e) {
      setAiAdviceText(
        currentLanguage === 'uk'
          ? '1. Зменшуйте дрібні регулярні витрати.\n2. Вносьте мінімальні платежі за кредитками вчасно.\n3. Відкладайте не менше 10% від доходу.'
          : currentLanguage === 'en'
          ? '1. Cut small recurring expenses.\n2. Make minimum credit card payments on time.\n3. Save at least 10% of your income.'
          : '1. Снижайте мелкие регулярные расходы.\n2. Вносите минимальные платежи по кредиткам вовремя.\n3. Откладывайте не менее 10% от зарплаты.'
      );
    } finally {
      setIsGeneratingAdvice(false);
      setAiLoader({ isOpen: false, title: '', subtitle: '' });
    }
  };

  // Helper file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res.split(',')[1]);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  };

  // Universal Upload Handler (PDF statements, bank screenshots, receipts)
  const handleUniversalUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = event.target.files;
    if (!rawFiles || rawFiles.length === 0) return;
    const files: File[] = Array.from(rawFiles);

    const pdfFiles = files.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );
    const imageFiles = files.filter(
      (f) =>
        f.type.startsWith('image/') ||
        (!f.type.includes('pdf') && !f.name.toLowerCase().endsWith('.pdf'))
    );

    setAiLoader({
      isOpen: true,
      title: 'ИИ распознает файлы...',
      subtitle: 'Извлекаем счета, балансы, долги и историю операций',
    });

    try {
      const newAccountsList: BankAccount[] = [];
      const newTxsList: Transaction[] = [];

      // 1. Process PDF files
      for (const pdfFile of pdfFiles) {
        try {
          let fullText = '';
          try {
            const arrayBuffer = await pdfFile.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const content = await page.getTextContent();
              fullText += content.items.map((it: any) => it.str).join(' ') + '\n';
            }
          } catch (pdfErr) {
            console.warn('pdfjs extraction failed, will try base64:', pdfErr);
          }

          let base64Pdf = '';
          try {
            const arrBuf = await pdfFile.arrayBuffer();
            const bytes = new Uint8Array(arrBuf);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            base64Pdf = btoa(binary);
          } catch (e) {
            console.warn('base64 conversion failed:', e);
          }

          const res = await fetch('/api/ai/scan-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: fullText, base64Pdf }),
          });

          const result = await res.json();
          if (result.success && result.data) {
            const { accounts, transactions: scannedTxs } = result.data;
            if (Array.isArray(accounts)) {
              accounts.forEach((a: any) => {
                newAccountsList.push({
                  id: 'acc_' + Date.now() + Math.random().toString(36).substring(2, 6),
                  bank: a.bank || 'Банк',
                  name: a.name || 'Счет',
                  ownBalance: a.ownBalance || 0,
                  debt: a.debt || 0,
                  minPayment: a.minPayment || 0,
                  currency: (a.currency as Currency) || activeCurrency,
                });
              });
            }
            if (Array.isArray(scannedTxs)) {
              scannedTxs.forEach((t: any, index: number) => {
                newTxsList.push({
                  id: Date.now() + index + Math.floor(Math.random() * 1000),
                  type: (t.type as TransactionType) || 'expense',
                  amount: t.amount || 0,
                  currency: (t.currency as Currency) || activeCurrency,
                  category: t.category || 'other',
                  note: t.note || 'Из PDF выписки',
                  date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
                });
              });
            }
          }
        } catch (err) {
          console.error('PDF error:', err);
        }
      }

      // 2. Process Image files (process each image safely)
      for (const imgFile of imageFiles) {
        try {
          const base64Data = await fileToBase64(imgFile);
          const res = await fetch('/api/ai/scan-multibank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: [{ data: base64Data, mimeType: imgFile.type || 'image/jpeg' }] }),
          });

          const result = await res.json();
          if (result.success && result.data) {
            const { accounts, transactions: scannedTxs } = result.data;
            if (Array.isArray(accounts)) {
              accounts.forEach((a: any) => {
                newAccountsList.push({
                  id: 'acc_' + Date.now() + Math.random().toString(36).substring(2, 6),
                  bank: a.bank || 'Банк',
                  name: a.name || 'Карта',
                  ownBalance: a.ownBalance || 0,
                  debt: a.debt || 0,
                  minPayment: a.minPayment || 0,
                  currency: (a.currency as Currency) || activeCurrency,
                });
              });
            }
            if (Array.isArray(scannedTxs)) {
              scannedTxs.forEach((t: any, index: number) => {
                newTxsList.push({
                  id: Date.now() + index + Math.floor(Math.random() * 1000),
                  type: (t.type as TransactionType) || 'expense',
                  amount: t.amount || 0,
                  currency: (t.currency as Currency) || activeCurrency,
                  category: t.category || 'other',
                  note: t.note || 'Из скриншота/чека',
                  date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
                });
              });
            }
          }
        } catch (err) {
          console.error('Image upload error for file:', imgFile.name, err);
        }
      }

      if (newAccountsList.length > 0) {
        setBankAccounts((prev) => [...newAccountsList, ...prev]);
      }
      if (newTxsList.length > 0) {
        setTransactions((prev) => [...newTxsList, ...prev]);
      }

      if (newAccountsList.length === 0 && newTxsList.length === 0) {
        alert(
          currentLanguage === 'en'
            ? 'Could not automatically extract financial data from the file(s). Opening manual entry form.'
            : currentLanguage === 'ru'
            ? 'Не удалось автоматически извлечь финансовые данные из файла. Открываем форму ручного ввода.'
            : 'Не вдалося автоматично вилучити фінансові дані з файлу. Відкриваємо форму ручного введення.'
        );
        setIsAddTxOpen(true);
      }
    } catch (e) {
      alert(
        currentLanguage === 'en'
          ? 'Error processing files. Opening manual entry form.'
          : currentLanguage === 'ru'
          ? 'Ошибка при обработке файлов. Открываем форму ручного ввода.'
          : 'Помилка під час обробки файлів. Відкриваємо форму ручного введення.'
      );
      setIsAddTxOpen(true);
    } finally {
      setAiLoader({ isOpen: false, title: '', subtitle: '' });
      event.target.value = '';
    }
  };

  // Scan Single Receipt
  const handleReceiptScanUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAiLoader({
      isOpen: true,
      title: 'ИИ сканирует чек...',
      subtitle: 'Извлекаем дату, сумму, магазин и категорию',
    });

    try {
      const base64Image = await fileToBase64(file);
      const res = await fetch('/api/ai/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Image, mimeType: file.type }),
      });

      const result = await res.json();
      if (result.success && result.data && (result.data.amount > 0 || result.data.note)) {
        const item = result.data;
        const newTx: Transaction = {
          id: Date.now(),
          type: (item.type as TransactionType) || 'expense',
          amount: item.amount || 0,
          currency: (item.currency as Currency) || activeCurrency,
          category: item.category || 'other',
          note: item.note || 'Сканированный чек',
          date: item.date ? new Date(item.date).toISOString() : new Date().toISOString(),
        };

        setTransactions((prev) => [newTx, ...prev]);
      } else {
        alert(
          currentLanguage === 'en'
            ? 'Could not scan the receipt. Opening manual entry form.'
            : currentLanguage === 'ru'
            ? 'Не удалось распознать чек. Открываем форму ручного ввода.'
            : 'Не вдалося розпізнати чек. Відкриваємо форму ручного введення.'
        );
        setIsAddTxOpen(true);
      }
    } catch (err) {
      alert(
        currentLanguage === 'en'
          ? 'Error scanning receipt. Opening manual entry form.'
          : currentLanguage === 'ru'
          ? 'Ошибка при сканировании чека. Открываем форму ручного ввода.'
          : 'Помилка під час сканування чека. Відкриваємо форму ручного введення.'
      );
      setIsAddTxOpen(true);
    } finally {
      setAiLoader({ isOpen: false, title: '', subtitle: '' });
      event.target.value = '';
    }
  };

  // Scan Bank Screenshots
  const handleMultiBankUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawFiles = event.target.files;
    if (!rawFiles || rawFiles.length === 0) return;
    const files: File[] = Array.from(rawFiles);

    setAiLoader({
      isOpen: true,
      title: 'ИИ обрабатывает скриншоты...',
      subtitle: 'Ищем карты, балансы, долги и историю операций',
    });

    try {
      const newAccountsList: BankAccount[] = [];
      const newTxsList: Transaction[] = [];

      for (const f of files) {
        try {
          const base64Data = await fileToBase64(f);
          const res = await fetch('/api/ai/scan-multibank', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images: [{ data: base64Data, mimeType: f.type || 'image/jpeg' }] }),
          });

          const result = await res.json();
          if (result.success && result.data) {
            const { accounts, transactions: scannedTxs } = result.data;
            if (Array.isArray(accounts)) {
              accounts.forEach((a: any) => {
                newAccountsList.push({
                  id: 'acc_' + Date.now() + Math.random().toString(36).substring(2, 6),
                  bank: a.bank || 'Банк',
                  name: a.name || 'Карта',
                  ownBalance: a.ownBalance || 0,
                  debt: a.debt || 0,
                  minPayment: a.minPayment || 0,
                  currency: (a.currency as Currency) || activeCurrency,
                });
              });
            }
            if (Array.isArray(scannedTxs)) {
              scannedTxs.forEach((t: any, index: number) => {
                newTxsList.push({
                  id: Date.now() + index + Math.floor(Math.random() * 1000),
                  type: (t.type as TransactionType) || 'expense',
                  amount: t.amount || 0,
                  currency: (t.currency as Currency) || activeCurrency,
                  category: t.category || 'other',
                  note: t.note || 'Из скриншота',
                  date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
                });
              });
            }
          }
        } catch (err) {
          console.error('Error scanning screenshot:', err);
        }
      }

      if (newAccountsList.length > 0) {
        setBankAccounts((prev) => [...newAccountsList, ...prev]);
      }
      if (newTxsList.length > 0) {
        setTransactions((prev) => [...newTxsList, ...prev]);
      }

      if (newAccountsList.length === 0 && newTxsList.length === 0) {
        alert(
          currentLanguage === 'en'
            ? 'Could not recognize bank data from screenshot(s). Opening manual entry form.'
            : currentLanguage === 'ru'
            ? 'Не удалось распознать данные со скриншотов. Открываем форму ручного ввода.'
            : 'Не вдалося розпізнати дані зі скріншотів. Відкриваємо форму ручного введення.'
        );
        setIsAddTxOpen(true);
      }
    } catch (e) {
      alert(
        currentLanguage === 'en'
          ? 'Error processing screenshots. Opening manual entry form.'
          : currentLanguage === 'ru'
          ? 'Ошибка при обработке скриншотов. Открываем форму ручного ввода.'
          : 'Помилка під час обробки скріншотів. Відкриваємо форму ручного введення.'
      );
      setIsAddTxOpen(true);
    } finally {
      setAiLoader({ isOpen: false, title: '', subtitle: '' });
      event.target.value = '';
    }
  };

  // Scan PDF Statement
  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAiLoader({
      isOpen: true,
      title: 'Читаем PDF выписку...',
      subtitle: 'Извлекаем текст страниц и анализируем структуру',
    });

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((it: any) => it.str).join(' ') + '\n';
      }

      const res = await fetch('/api/ai/scan-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText }),
      });

      const result = await res.json();
      let extracted = false;
      if (result.success && result.data) {
        const { accounts, transactions: scannedTxs } = result.data;

        if (Array.isArray(accounts) && accounts.length > 0) {
          extracted = true;
          const newAccounts: BankAccount[] = accounts.map((a: any) => ({
            id: 'acc_' + Date.now() + Math.random().toString(36).substring(2, 6),
            bank: a.bank || 'Банк',
            name: a.name || 'Карта',
            ownBalance: a.ownBalance || 0,
            debt: a.debt || 0,
            minPayment: a.minPayment || 0,
            currency: (a.currency as Currency) || activeCurrency,
          }));
          setBankAccounts((prev) => [...newAccounts, ...prev]);
        }

        if (Array.isArray(scannedTxs) && scannedTxs.length > 0) {
          extracted = true;
          const newTxs: Transaction[] = scannedTxs.map((t: any, index: number) => ({
            id: Date.now() + index,
            type: (t.type as TransactionType) || 'expense',
            amount: t.amount || 0,
            currency: (t.currency as Currency) || activeCurrency,
            category: t.category || 'other',
            note: t.note || 'Из PDF выписки',
            date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
          }));
          setTransactions((prev) => [...newTxs, ...prev]);
        }
      }

      if (!extracted) {
        alert(
          currentLanguage === 'en'
            ? 'Could not extract data from PDF. Opening manual entry form.'
            : currentLanguage === 'ru'
            ? 'Не удалось разобрать PDF выписку. Открываем форму ручного ввода.'
            : 'Не вдалося розібрати PDF виписку. Відкриваємо форму ручного введення.'
        );
        setIsAddTxOpen(true);
      }
    } catch (e) {
      alert(
        currentLanguage === 'en'
          ? 'Error reading PDF document. Opening manual entry form.'
          : currentLanguage === 'ru'
          ? 'Ошибка при чтении PDF документа. Открываем форму ручного ввода.'
          : 'Помилка під час читання PDF документа. Відкриваємо форму ручного введення.'
      );
      setIsAddTxOpen(true);
    } finally {
      setAiLoader({ isOpen: false, title: '', subtitle: '' });
      event.target.value = '';
    }
  };

  // Actions
  const handleAddTransaction = (newTxData: {
    type: TransactionType;
    amount: number;
    currency: Currency;
    category: string;
    note: string;
    date: string;
  }) => {
    const newTx: Transaction = {
      id: Date.now(),
      ...newTxData,
    };
    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleDeleteTransaction = (id: number) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSaveAccount = (accData: Omit<BankAccount, 'id'>) => {
    const newAccount: BankAccount = {
      id: 'acc_' + Date.now(),
      ...accData,
    };
    setBankAccounts((prev) => [...prev, newAccount]);
  };

  const handleImportAccounts = (importedAccounts: BankAccount[]) => {
    setBankAccounts((prev) => {
      const existingMap = new Map<string, BankAccount>(prev.map((a) => [a.id, a]));
      const newAccs: BankAccount[] = [];

      importedAccounts.forEach((acc) => {
        const existing = existingMap.get(acc.id);
        if (existing) {
          existingMap.set(acc.id, {
            id: existing.id,
            bank: existing.bank,
            name: existing.name,
            currency: existing.currency,
            ownBalance: acc.ownBalance,
            debt: acc.debt,
            minPayment: acc.minPayment,
          });
        } else {
          newAccs.push(acc);
        }
      });

      return [...newAccs, ...Array.from(existingMap.values())];
    });
  };

  const handleImportTransactions = (importedTxs: Transaction[]) => {
    setTransactions((prev) => [...importedTxs, ...prev]);
  };

  const handleDeleteAccount = (id: string) => {
    setBankAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAddCategory = (catType: TransactionType, newCat: Category) => {
    setCustomCategories((prev) => ({
      ...prev,
      [catType]: [...(prev[catType] || []), newCat],
    }));
  };

  const handleSetCategoryLimit = (categoryId: string, limit: number) => {
    setCategoryLimits((prev) => ({
      ...prev,
      [categoryId]: limit,
    }));
  };

  const handleClearAllData = () => {
    if (confirm('Вы уверены, что хотите полностью очистить историю операций и счета?')) {
      setTransactions([]);
      setBankAccounts([]);
    }
  };

  return (
    <div className="font-sans min-h-screen pb-24 lg:pb-10">
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={universalFileRef}
        accept="image/*,application/pdf,.pdf"
        multiple
        className="hidden"
        onChange={handleUniversalUpload}
      />
      <input
        type="file"
        ref={receiptFileRef}
        accept="image/*"
        className="hidden"
        onChange={handleReceiptScanUpload}
      />
      <input
        type="file"
        ref={multiBankFileRef}
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleMultiBankUpload}
      />
      <input
        type="file"
        ref={pdfFileRef}
        accept="application/pdf"
        className="hidden"
        onChange={handlePdfUpload}
      />

      {/* Header */}
      <Header
        activeCurrency={activeCurrency}
        onCurrencyChange={setActiveCurrency}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        userProfile={userProfile}
        onOpenAuth={() => setIsAuthOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

      {/* Main Layout Container with Sidebar */}
      <div className="flex-1 min-w-0 lg:flex lg:gap-2 max-w-7xl mx-auto">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeCurrency={activeCurrency}
          onCurrencyChange={setActiveCurrency}
          isDark={isDark}
          onToggleTheme={() => setIsDark(!isDark)}
          userProfile={userProfile}
          onOpenAuth={() => setIsAuthOpen(true)}
          totalBalance={aggregatedBalance}
          accountsCount={bankAccounts.length}
          onOpenAddTx={() => setIsAddTxOpen(true)}
          onOpenAddAccount={() => setIsAddAccountOpen(true)}
          onTriggerScan={() => universalFileRef.current?.click()}
          onGenerateAiAdvice={generateAIFinancialAdvice}
          currentLanguage={currentLanguage}
          onLanguageChange={setCurrentLanguage}
        />

        {/* Main View Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 w-full pt-4 min-w-0 pb-16">
          {/* Top Banner when viewing a specific section tab */}
          {activeTab !== 'all' && (
            <div className="surface rounded-2xl p-4 mb-5 flex flex-wrap items-center justify-between gap-3 border border-hair shadow-xs">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => setActiveTab('all')}
                  className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl surface-soft hover:surface active:scale-95 transition text-blue-500 shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{t.allSectionsBtn}</span>
                </button>
                <div>
                  <h1 className="font-display font-black text-lg leading-tight">
                    {activeTab === 'sectionBalance' && t.sectionBalanceTitle}
                    {activeTab === 'sectionAccounts' && t.sectionAccountsTitle}
                    {activeTab === 'sectionLimits' && t.sectionLimitsTitle}
                    {activeTab === 'sectionAI' && t.sectionAITitle}
                    {activeTab === 'sectionChart' && t.sectionChartTitle}
                    {activeTab === 'sectionTransactions' && t.sectionTransactionsTitle}
                  </h1>
                  <p className="text-[11px] txt-sub font-medium">
                    {t.sectionSubtitle}
                  </p>
                </div>
              </div>

              {/* Header Context Action Buttons */}
              <div className="flex items-center gap-2">
                {activeTab === 'sectionBalance' && (
                  <button
                    onClick={() => setIsAddTxOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.addRecord}</span>
                  </button>
                )}
                {activeTab === 'sectionAccounts' && (
                  <button
                    onClick={() => setIsAddAccountOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{t.addAccountOrCard}</span>
                  </button>
                )}
                {activeTab === 'sectionLimits' && (
                  <button
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.newCategory}</span>
                  </button>
                )}
                {activeTab === 'sectionAI' && (
                  <button
                    onClick={() => generateAIFinancialAdvice()}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition"
                  >
                    <Brain className="w-4 h-4" />
                    <span>{t.runAiAnalysisBtn}</span>
                  </button>
                )}
                {activeTab === 'sectionTransactions' && (
                  <button
                    onClick={() => setIsAddTxOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 active:scale-95 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.newTransactionBtn}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 1: ALL SECTIONS (DASHBOARD) */}
          {activeTab === 'all' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
              {/* LEFT COLUMN */}
              <div className="lg:col-span-7 space-y-4 min-w-0">
                <PeriodFilter selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} currentLanguage={currentLanguage} />

                <div id="sectionBalance" className="scroll-mt-20">
                  <BalanceCard
                    totalBalance={aggregatedBalance}
                    totalIncome={totalIncome}
                    totalExpense={totalExpense}
                    currency={activeCurrency}
                    currentLanguage={currentLanguage}
                    onIncomeClick={() => setIsIncomeDetailsOpen(true)}
                    onExpenseClick={() => setIsExpenseDetailsOpen(true)}
                  />
                </div>

                <AiActions onUploadFiles={() => universalFileRef.current?.click()} onAddManual={() => setIsAddTxOpen(true)} />

                <div id="sectionAccounts" className="scroll-mt-20">
                  <AccountsList
                    accounts={bankAccounts}
                    currency={activeCurrency}
                    exchangeRate={exchangeRate}
                    onOpenAddModal={() => setIsAddAccountOpen(true)}
                    onOpenDetailModal={(acc) => {
                      setSelectedAccount(acc);
                      setIsAccountDetailOpen(true);
                    }}
                    onDeleteAccount={handleDeleteAccount}
                    currentLanguage={currentLanguage}
                  />
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-5 space-y-4 min-w-0">
                <div id="sectionAI" className="scroll-mt-20">
                  <AiAdvisor
                    adviceText={aiAdviceText}
                    onGenerateAdvice={generateAIFinancialAdvice}
                    isLoading={isGeneratingAdvice}
                    userContext={{
                      totalBalance: aggregatedBalance,
                      totalIncome,
                      totalExpense,
                      currency: activeCurrency,
                      accountsCount: bankAccounts.length,
                    }}
                    currentLanguage={currentLanguage}
                  />
                </div>

                {/* Exchange Rate Card */}
                <div className="surface rounded-2xl px-4 py-3 flex justify-between items-center text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--green)' }}></span>
                    <span className="txt-sub font-medium truncate">{t.usdRate}:</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/exchange-rates');
                          if (res.ok) {
                            const data = await res.json();
                            if (data.rates?.UAH) setExchangeRate(parseFloat(data.rates.UAH.toFixed(2)));
                          }
                        } catch (e) {}
                      }}
                      className="text-[11px] font-bold flex items-center gap-1 hover:underline"
                      style={{ color: 'var(--accent)' }}
                    >
                      <RefreshCw className="w-3 h-3" /> {t.refreshRate}
                    </button>
                    <div className="flex items-center gap-1 font-extrabold">
                      <input
                        type="number"
                        step="0.1"
                        value={exchangeRate}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (val > 0) setExchangeRate(val);
                        }}
                        className="w-16 text-right surface-soft rounded-xl px-2 py-1 outline-none font-num"
                      />
                      <span>₴</span>
                    </div>
                  </div>
                </div>

                <div id="sectionLimits" className="scroll-mt-20">
                  <CategoryLimits
                    categories={allCategories.expense}
                    transactions={transactions}
                    currency={activeCurrency}
                    exchangeRate={exchangeRate}
                    categoryLimits={categoryLimits}
                    onSetCategoryLimit={handleSetCategoryLimit}
                    currentLanguage={currentLanguage}
                  />
                </div>

                <div id="sectionChart" className="scroll-mt-20">
                  <ExpenseChart
                    transactions={filteredTransactions}
                    categories={allCategories.all}
                    currency={activeCurrency}
                    exchangeRate={exchangeRate}
                    periodText={periodText}
                    isDark={isDark}
                  />
                </div>

                <div id="sectionTransactions" className="scroll-mt-20">
                  <TransactionsList
                    transactions={filteredTransactions}
                    categories={allCategories.all}
                    currency={activeCurrency}
                    exchangeRate={exchangeRate}
                    onDeleteTransaction={handleDeleteTransaction}
                    onClearAllData={handleClearAllData}
                    currentLanguage={currentLanguage}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BALANCE & ANALYTICS */}
          {activeTab === 'sectionBalance' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <PeriodFilter selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} currentLanguage={currentLanguage} />
              <BalanceCard
                totalBalance={aggregatedBalance}
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                currency={activeCurrency}
                currentLanguage={currentLanguage}
                onIncomeClick={() => setIsIncomeDetailsOpen(true)}
                onExpenseClick={() => setIsExpenseDetailsOpen(true)}
              />
              <div className="surface rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-extrabold text-sm">{t.addRecord}</h3>
                  <button
                    onClick={() => setIsAddTxOpen(true)}
                    className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> {t.addRecord}
                  </button>
                </div>
              </div>
              <TransactionsList
                transactions={filteredTransactions}
                categories={allCategories.all}
                currency={activeCurrency}
                exchangeRate={exchangeRate}
                onDeleteTransaction={handleDeleteTransaction}
                onClearAllData={handleClearAllData}
                currentLanguage={currentLanguage}
              />
            </div>
          )}

          {/* TAB 3: ACCOUNTS & CARDS */}
          {activeTab === 'sectionAccounts' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <AccountsList
                accounts={bankAccounts}
                currency={activeCurrency}
                exchangeRate={exchangeRate}
                onOpenAddModal={() => setIsAddAccountOpen(true)}
                onOpenDetailModal={(acc) => {
                  setSelectedAccount(acc);
                  setIsAccountDetailOpen(true);
                }}
                onDeleteAccount={handleDeleteAccount}
                currentLanguage={currentLanguage}
              />
            </div>
          )}

          {/* TAB 4: LIMITS */}
          {activeTab === 'sectionLimits' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <PeriodFilter selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} currentLanguage={currentLanguage} />
              <CategoryLimits
                categories={allCategories.expense}
                transactions={transactions}
                currency={activeCurrency}
                exchangeRate={exchangeRate}
                categoryLimits={categoryLimits}
                onSetCategoryLimit={handleSetCategoryLimit}
                currentLanguage={currentLanguage}
              />
            </div>
          )}

          {/* TAB 5: AI ADVISOR */}
          {activeTab === 'sectionAI' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <AiAdvisor
                adviceText={aiAdviceText}
                onGenerateAdvice={generateAIFinancialAdvice}
                isLoading={isGeneratingAdvice}
                userContext={{
                  totalBalance: aggregatedBalance,
                  totalIncome,
                  totalExpense,
                  currency: activeCurrency,
                  accountsCount: bankAccounts.length,
                }}
                currentLanguage={currentLanguage}
              />
              <AiActions onUploadFiles={() => universalFileRef.current?.click()} />
            </div>
          )}

          {/* TAB 6: CHART */}
          {activeTab === 'sectionChart' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <PeriodFilter selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} currentLanguage={currentLanguage} />
              <ExpenseChart
                transactions={filteredTransactions}
                categories={allCategories.all}
                currency={activeCurrency}
                exchangeRate={exchangeRate}
                periodText={periodText}
                isDark={isDark}
              />
            </div>
          )}

          {/* TAB 7: TRANSACTIONS */}
          {activeTab === 'sectionTransactions' && (
            <div className="max-w-4xl mx-auto space-y-5">
              <PeriodFilter selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} currentLanguage={currentLanguage} />
              <TransactionsList
                transactions={filteredTransactions}
                categories={allCategories.all}
                currency={activeCurrency}
                exchangeRate={exchangeRate}
                onDeleteTransaction={handleDeleteTransaction}
                onClearAllData={handleClearAllData}
                currentLanguage={currentLanguage}
              />
            </div>
          )}
        </main>
      </div>

      {/* Floating Action Mobile Bottom Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t border-hair px-8 pt-2.5 safe-bottom-nav flex justify-between items-center max-w-md mx-auto z-30 lg:hidden"
        style={{ background: 'color-mix(in srgb, var(--card) 88%, transparent)' }}
      >
        <button
          onClick={() => universalFileRef.current?.click()}
          className="flex flex-col items-center active:scale-95 transition"
          style={{ color: 'var(--accent)' }}
        >
          <Camera className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">Сканер</span>
        </button>

        <button
          onClick={() => setIsAddTxOpen(true)}
          className="w-14 h-14 text-white rounded-full flex items-center justify-center active:scale-90 transition transform -translate-y-3 btn-primary shadow-xl"
        >
          <Plus className="w-7 h-7" />
        </button>

        <button
          onClick={generateAIFinancialAdvice}
          className="flex flex-col items-center active:scale-95 transition"
          style={{ color: 'var(--accent-2)' }}
        >
          <Brain className="w-6 h-6" />
          <span className="text-[10px] font-bold mt-1">Советы</span>
        </button>
      </div>

      {/* MODALS */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onAddTransaction={handleAddTransaction}
        categoriesExpense={allCategories.expense}
        categoriesIncome={allCategories.income}
        activeCurrency={activeCurrency}
        onOpenAddCategory={() => setIsAddCategoryOpen(true)}
        onScanReceipt={() => universalFileRef.current?.click()}
      />

      <BankSyncModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onSaveManualAccount={handleSaveAccount}
        onImportAccounts={handleImportAccounts}
        onImportTransactions={handleImportTransactions}
        activeCurrency={activeCurrency}
      />

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        onAddCategory={handleAddCategory}
        currentType="expense"
      />

      <AccountDetailModal
        isOpen={isAccountDetailOpen}
        onClose={() => {
          setIsAccountDetailOpen(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        currency={activeCurrency}
        exchangeRate={exchangeRate}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        userProfile={userProfile}
        currentLanguage={currentLanguage}
      />

      <IncomeDetailsModal
        isOpen={isIncomeDetailsOpen}
        onClose={() => setIsIncomeDetailsOpen(false)}
        transactions={transactions}
        accounts={bankAccounts}
        categories={allCategories.all}
        currency={activeCurrency}
        exchangeRate={exchangeRate}
        selectedPeriod={selectedPeriod}
        currentLanguage={currentLanguage}
        onDeleteTransaction={handleDeleteTransaction}
        onAddIncomeClick={() => setIsAddTxOpen(true)}
      />

      <ExpenseDetailsModal
        isOpen={isExpenseDetailsOpen}
        onClose={() => setIsExpenseDetailsOpen(false)}
        transactions={transactions}
        accounts={bankAccounts}
        categories={allCategories.all}
        currency={activeCurrency}
        exchangeRate={exchangeRate}
        selectedPeriod={selectedPeriod}
        currentLanguage={currentLanguage}
        onDeleteTransaction={handleDeleteTransaction}
        onAddExpenseClick={() => setIsAddTxOpen(true)}
      />

      <AiLoader isOpen={aiLoader.isOpen} title={aiLoader.title} subtitle={aiLoader.subtitle} />
    </div>
  );
}
