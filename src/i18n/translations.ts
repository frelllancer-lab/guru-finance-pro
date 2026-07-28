export type Language = 'uk' | 'en' | 'ru';

export function getSystemLanguage(): Language {
  if (typeof window === 'undefined') return 'uk';
  const navLang = (navigator.language || (navigator as any).userLanguage || '').toLowerCase();
  if (navLang.startsWith('uk') || navLang.startsWith('ua')) {
    return 'uk';
  }
  if (navLang.startsWith('en')) {
    return 'en';
  }
  if (navLang.startsWith('ru')) {
    return 'ru';
  }
  return 'uk';
}

export const translations = {
  uk: {
    // Header
    inCloud: 'В облаці',
    navigationMenu: 'Меню навігації',
    accountSync: 'Акаунт та синхронізація',
    toggleTheme: 'Переключити тему',
    language: 'Мова',

    // Nav / Tabs
    sectionsMenu: 'Розділи меню',
    tabAll: 'Головний огляд',
    tabBalance: 'Баланс',
    tabAccounts: 'Рахунки та картки',
    tabLimits: 'Ліміти витрат',
    tabAI: 'ШІ-Радник',
    tabChart: 'Аналітика витрат',
    tabTransactions: 'Журнал операцій',
    scanReceipt: 'Сканувати чек',
    addTransaction: 'Додати запис',
    addAccount: 'Додати рахунок',
    quickActions: 'Швидкі дії',
    cloudProfile: 'Хмарний профіль',
    notLoggedIn: 'Увійти в акаунт',
    allSectionsBtn: 'Усі розділи',

    // Section Titles
    sectionBalanceTitle: 'Розділ: Баланс та аналітика',
    sectionAccountsTitle: 'Розділ: Рахунки та банківські картки',
    sectionLimitsTitle: 'Розділ: Ліміти витрат',
    sectionAITitle: 'Розділ: Розумний ШІ-Радник',
    sectionChartTitle: 'Розділ: Графік та структура витрат',
    sectionTransactionsTitle: 'Розділ: Журнал операцій',
    sectionSubtitle: 'Повний огляд та управління інформацією',

    // Buttons in banner
    addRecord: '+ Додати запис',
    addAccountOrCard: '+ Додати рахунок / картку',
    newCategory: '+ Нова категорія',
    runAiAnalysisBtn: 'Запустити ШІ Аналіз',
    newTransactionBtn: '+ Нова транзакція',

    // Periods
    periodDay: 'Сьогодні',
    periodWeek: 'Тиждень',
    periodMonth: 'Місяць',
    periodYear: 'Рік',
    periodAll: 'Весь час',

    // Balance Card
    netBalance: 'Чистий баланс',
    totalIncome: 'Доходи',
    totalExpense: 'Витрати',

    // Exchange Rate
    usdRate: 'Курс долара ($1):',
    refreshRate: 'Оновити',

    // Accounts
    myAccountsAndCards: 'Мої рахунки та картки',
    ownFunds: 'Власні кошти',
    totalDebt: 'Заборгованість',
    minPayment: 'Мін. платіж',
    addCardOrAccount: '+ Додати рахунок',
    connectBankApi: 'Підключити банк',

    // Category Limits
    categoryLimitsTitle: 'Ліміти за категоріями',
    budgetLimit: 'Ліміт',
    spent: 'Витрачено',
    left: 'Залишилось',
    exceeded: 'Перевищено',
    setLimit: 'Встановити ліміт',

    // AI Advisor
    aiAdvisorTitle: 'ШІ-Радник',
    expressAnalysis: 'Експрес-Аналіз Фінансів',
    startAiAnalysis: 'Запустити ШІ-Аналіз',
    analyzing: 'Аналіз...',
    quotesTitle: 'Мудрість мільйонерів & Успішний Успіх',
    anotherQuote: 'Друга цитата',
    personalManager: 'Особистий Фінансовий Менеджер',
    managerSubtitle: 'Консультант зі зростання доходу та багатства',
    chatPlaceholder: 'Задайте питання щодо доходів, інвестицій чи бюджету...',
    managerThinking: 'Менеджер формулює рекомендації...',

    // Expense Chart
    structureOfExpenses: 'Структура витрат',
    totalPeriodSpent: 'Усього витрачено за період',
    noDataForChart: 'Немає операцій за вибраний період',

    // Transactions List
    transactionJournal: 'Журнал операцій',
    searchPlaceholder: 'Пошук за описом чи категорією...',
    allTypes: 'Усі типи',
    incomeOnly: 'Доходи',
    expenseOnly: 'Витрати',
    clearAll: 'Очистити все',
    noTransactions: 'Немає записів за вибраний період',

    // Auth Modal
    cloudAccount: 'Хмарний Акаунт',
    syncAcrossDevices: 'Синхронізація фінансів на всіх пристроях',
    quickAuth: 'Швидкий',
    emailAuth: 'Email',
    phoneAuth: 'Телефон',
    loginWithGoogle: 'Увійти через Google',
    loginWithApple: 'Увійти через Apple ID',
    logout: 'Вийти з акаунта',
    loggedCloudInfo: 'Дані автоматично зберігаються в хмарі',
    userProfileActive: 'Облачний профіль активний',
  },

  en: {
    // Header
    inCloud: 'In Cloud',
    navigationMenu: 'Navigation Menu',
    accountSync: 'Account & Sync',
    toggleTheme: 'Switch theme',
    language: 'Language',

    // Nav / Tabs
    sectionsMenu: 'Menu Sections',
    tabAll: 'Main Dashboard',
    tabBalance: 'Balance',
    tabAccounts: 'Accounts & Cards',
    tabLimits: 'Spending Limits',
    tabAI: 'AI Advisor',
    tabChart: 'Analytics Chart',
    tabTransactions: 'Transactions History',
    scanReceipt: 'Scan Receipt',
    addTransaction: 'Add Transaction',
    addAccount: 'Add Account',
    quickActions: 'Quick Actions',
    cloudProfile: 'Cloud Profile',
    notLoggedIn: 'Log in',
    allSectionsBtn: 'All Sections',

    // Section Titles
    sectionBalanceTitle: 'Section: Balance & Analytics',
    sectionAccountsTitle: 'Section: Accounts & Bank Cards',
    sectionLimitsTitle: 'Section: Spending Limits',
    sectionAITitle: 'Section: Smart AI Advisor',
    sectionChartTitle: 'Section: Expense Structure & Chart',
    sectionTransactionsTitle: 'Section: Transaction Journal',
    sectionSubtitle: 'Full overview and financial management',

    // Buttons in banner
    addRecord: '+ Add Record',
    addAccountOrCard: '+ Add Account / Card',
    newCategory: '+ New Category',
    runAiAnalysisBtn: 'Run AI Analysis',
    newTransactionBtn: '+ New Transaction',

    // Periods
    periodDay: 'Today',
    periodWeek: 'Week',
    periodMonth: 'Month',
    periodYear: 'Year',
    periodAll: 'All time',

    // Balance Card
    netBalance: 'Net Balance',
    totalIncome: 'Income',
    totalExpense: 'Expenses',

    // Exchange Rate
    usdRate: 'USD Rate ($1):',
    refreshRate: 'Refresh',

    // Accounts
    myAccountsAndCards: 'My Accounts & Cards',
    ownFunds: 'Own Funds',
    totalDebt: 'Total Debt',
    minPayment: 'Min payment',
    addCardOrAccount: '+ Add Account',
    connectBankApi: 'Connect Bank API',

    // Category Limits
    categoryLimitsTitle: 'Category Limits',
    budgetLimit: 'Limit',
    spent: 'Spent',
    left: 'Left',
    exceeded: 'Exceeded',
    setLimit: 'Set limit',

    // AI Advisor
    aiAdvisorTitle: 'AI Advisor',
    expressAnalysis: 'Express Financial Analysis',
    startAiAnalysis: 'Run AI Analysis',
    analyzing: 'Analyzing...',
    quotesTitle: 'Millionaire Wisdom & Success Mindset',
    anotherQuote: 'Next Quote',
    personalManager: 'Personal Financial Manager',
    managerSubtitle: 'Income Growth & Wealth Consultant',
    chatPlaceholder: 'Ask a question about income, investments, or budget...',
    managerThinking: 'Manager is crafting advice...',

    // Expense Chart
    structureOfExpenses: 'Expense Structure',
    totalPeriodSpent: 'Total spent in period',
    noDataForChart: 'No transactions for selected period',

    // Transactions List
    transactionJournal: 'Transaction History',
    searchPlaceholder: 'Search description or category...',
    allTypes: 'All types',
    incomeOnly: 'Income',
    expenseOnly: 'Expenses',
    clearAll: 'Clear all',
    noTransactions: 'No records for selected period',

    // Auth Modal
    cloudAccount: 'Cloud Account',
    syncAcrossDevices: 'Sync finances across all devices',
    quickAuth: 'Quick',
    emailAuth: 'Email',
    phoneAuth: 'Phone',
    loginWithGoogle: 'Sign in with Google',
    loginWithApple: 'Sign in with Apple ID',
    logout: 'Log out',
    loggedCloudInfo: 'Data automatically saved to cloud',
    userProfileActive: 'Cloud profile is active',
  },

  ru: {
    // Header
    inCloud: 'В облаке',
    navigationMenu: 'Меню навигации',
    accountSync: 'Аккаунт и синхронизация',
    toggleTheme: 'Переключить тему',
    language: 'Язык',

    // Nav / Tabs
    sectionsMenu: 'Разделы меню',
    tabAll: 'Главный обзор',
    tabBalance: 'Баланс',
    tabAccounts: 'Счета и карты',
    tabLimits: 'Лимиты расходов',
    tabAI: 'ИИ-Советник',
    tabChart: 'График расходов',
    tabTransactions: 'Журнал операций',
    scanReceipt: 'Сканировать чек',
    addTransaction: 'Добавить запись',
    addAccount: 'Добавить счет',
    quickActions: 'Быстрые действия',
    cloudProfile: 'Облачный профиль',
    notLoggedIn: 'Войти в аккаунт',
    allSectionsBtn: 'Все разделы',

    // Section Titles
    sectionBalanceTitle: 'Раздел: Баланс и аналитика',
    sectionAccountsTitle: 'Раздел: Счета и банковские карты',
    sectionLimitsTitle: 'Раздел: Лимиты расходов',
    sectionAITitle: 'Раздел: Умный ИИ-Советник',
    sectionChartTitle: 'Раздел: График и структура расходов',
    sectionTransactionsTitle: 'Раздел: Журнал операций',
    sectionSubtitle: 'Полный обзор и управление информацией',

    // Buttons in banner
    addRecord: '+ Добавить запись',
    addAccountOrCard: '+ Добавить счет / карту',
    newCategory: '+ Новая категория',
    runAiAnalysisBtn: 'Запустить ИИ Анализ',
    newTransactionBtn: '+ Новая транзакция',

    // Periods
    periodDay: 'Сегодня',
    periodWeek: 'Неделя',
    periodMonth: 'Месяц',
    periodYear: 'Год',
    periodAll: 'Все время',

    // Balance Card
    netBalance: 'Чистый баланс',
    totalIncome: 'Доходы',
    totalExpense: 'Расходы',

    // Exchange Rate
    usdRate: 'Курс доллара ($1):',
    refreshRate: 'Обновить',

    // Accounts
    myAccountsAndCards: 'Мои счета и карты',
    ownFunds: 'Собственные средства',
    totalDebt: 'Задолженность',
    minPayment: 'Мин. платеж',
    addCardOrAccount: '+ Добавить счет',
    connectBankApi: 'Подключить банк',

    // Category Limits
    categoryLimitsTitle: 'Лимиты расходов',
    budgetLimit: 'Лимит',
    spent: 'Израсходовано',
    left: 'Осталось',
    exceeded: 'Превышен',
    setLimit: 'Установить лимит',

    // AI Advisor
    aiAdvisorTitle: 'ИИ-Советник',
    expressAnalysis: 'Экспресс-Анализ Финансов',
    startAiAnalysis: 'Запустить ИИ-Анализ',
    analyzing: 'Анализ...',
    quotesTitle: 'Мудрость миллионеров & Успешный Успіх',
    anotherQuote: 'Другая цитата',
    personalManager: 'Личный Финансовый Менеджер',
    managerSubtitle: 'Консультант по росту дохода и богатству',
    chatPlaceholder: 'Задайте вопрос по доходам, инвестициям или бюджету...',
    managerThinking: 'Менеджер формулирует рекомендации...',

    // Expense Chart
    structureOfExpenses: 'Структура расходов',
    totalPeriodSpent: 'Всего израсходовано за период',
    noDataForChart: 'Нет операций за выбранный период',

    // Transactions List
    transactionJournal: 'Журнал операций',
    searchPlaceholder: 'Поиск по описанию или категории...',
    allTypes: 'Все типы',
    incomeOnly: 'Доходы',
    expenseOnly: 'Расходы',
    clearAll: 'Очистить все',
    noTransactions: 'Нет записей за выбранный период',

    // Auth Modal
    cloudAccount: 'Облачный Аккаунт',
    syncAcrossDevices: 'Синхронизация финансов на всех устройствах',
    quickAuth: 'Быстрый',
    emailAuth: 'Email',
    phoneAuth: 'Телефон',
    loginWithGoogle: 'Войти через Google',
    loginWithApple: 'Войти через Apple ID',
    logout: 'Выйти из аккаунта',
    loggedCloudInfo: 'Данные автоматически сохраняются в облаке',
    userProfileActive: 'Облачный профиль активен',
  },
};
