import React, { useState, useRef, useEffect } from 'react';
import {
  Wand2,
  Quote,
  Send,
  Sparkles,
  Bot,
  User,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { Currency } from '../types';
import { Language } from '../i18n/translations';

interface AiAdvisorProps {
  adviceText: string;
  onGenerateAdvice: () => void;
  isLoading: boolean;
  userContext?: {
    totalBalance?: number;
    totalIncome?: number;
    totalExpense?: number;
    currency?: Currency;
    accountsCount?: number;
  };
  currentLanguage?: Language;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const SUCCESS_QUOTES: Record<Language, Array<{ quote: string; author: string; title: string }>> = {
  uk: [
    {
      quote: 'Не заощаджуйте те, що залишилося після витрат, а витрачайте те, що залишилося після заощаджень.',
      author: 'Воррен Баффетт',
      title: 'Легендарний інвестор, холдинг Berkshire Hathaway',
    },
    {
      quote: 'Багатство — це активи, які заробляють, поки ви спите.',
      author: 'Наваль Равікант',
      title: 'Підприємець і філософ Кремнієвої долини',
    },
    {
      quote: 'Бідні та середній клас працюють за гроші. Багаті змушують гроші працювати на себе.',
      author: 'Роберт Кійосакі',
      title: 'Автор бестселера «Багатий тато, бідний тато»',
    },
    {
      quote: 'Перші $100 000 — це пекельно важко, але ви зобов’язані їх зробити. Далі працює капітал.',
      author: 'Чарлі Мангер',
      title: 'Віце-голова Berkshire Hathaway',
    },
    {
      quote: 'Ваш час обмежений, не витрачайте його, живучи чужим життям. Майте сміливість іти за своїм серцем і інтуїцією.',
      author: 'Стів Джобс',
      title: 'Засновник Apple',
    },
    {
      quote: 'Перешкоди — це те, що ви бачите, коли відводите погляд від своєї фінансової мети.',
      author: 'Ілон Маск',
      title: 'Засновник Tesla & SpaceX',
    },
    {
      quote: 'Якщо ви не отримуєте досвід від своїх помилок, ви ніколи не навчитеся ухвалювати ефективні рішення.',
      author: 'Рей Даліо',
      title: 'Засновник найбільшого хедж-фонду Bridgewater Associates',
    },
    {
      quote: 'Формальна освіта допоможе вам вижити. Самоосвіта приведе вас до колосального багатства.',
      author: 'Джим Рон',
      title: 'Всесвітньо відомий бізнес-тренер',
    },
    {
      quote: 'Заробляти гроші — це мистецтво, працювати — це мистецтво, а хороший бізнес — це найкраще мистецтво з усіх.',
      author: 'Енді Воргол',
      title: 'Художник та культовий підприємець',
    },
  ],
  en: [
    {
      quote: 'Do not save what is left after spending, but spend what is left after saving.',
      author: 'Warren Buffett',
      title: 'Legendary Investor, Berkshire Hathaway',
    },
    {
      quote: 'Wealth is assets that earn for you while you sleep.',
      author: 'Naval Ravikant',
      title: 'Silicon Valley Entrepreneur & Philosopher',
    },
    {
      quote: 'The poor and the middle class work for money. The rich have money work for them.',
      author: 'Robert Kiyosaki',
      title: 'Author of "Rich Dad Poor Dad"',
    },
    {
      quote: 'The first $100,000 is a bitch, but you gotta do it. After that, the capital does the work.',
      author: 'Charlie Munger',
      title: 'Vice Chairman of Berkshire Hathaway',
    },
    {
      quote: "Your time is limited, so don't waste it living someone else's life.",
      author: 'Steve Jobs',
      title: 'Founder of Apple',
    },
    {
      quote: 'Obstacles are those frightful things you see when you take your eyes off your goal.',
      author: 'Elon Musk',
      title: 'Founder of Tesla & SpaceX',
    },
    {
      quote: "If you don't embrace making mistakes, you'll never learn how to make effective decisions.",
      author: 'Ray Dalio',
      title: 'Founder of Bridgewater Associates',
    },
    {
      quote: 'Formal education will make you a living; self-education will make you a fortune.',
      author: 'Jim Rohn',
      title: 'Renowned Author and Motivational Speaker',
    },
    {
      quote: 'Making money is art and working is art and good business is the best art.',
      author: 'Andy Warhol',
      title: 'Artist & Entrepreneur',
    },
  ],
  ru: [
    {
      quote: 'Не сберегайте то, что осталось после трат, а тратьте то, что осталось после сбережений.',
      author: 'Уоррен Баффетт',
      title: 'Легендарный инвестор, инвест-холдинг Berkshire Hathaway',
    },
    {
      quote: 'Богатство — это активы, которые зарабатывают, пока вы спите.',
      author: 'Наваль Равикант',
      title: 'Предприниматель и философ Кремниевой долины',
    },
    {
      quote: 'Бедные и средний класс работают за деньги. Богатые заставляют деньги работать на себя.',
      author: 'Роберт Кийосаки',
      title: 'Автор бестселлера «Богатый папа, бедный папа»',
    },
    {
      quote: 'Первые $100 000 — это адски трудно, но вы просто обязаны их сделать. Дальше работает капитал.',
      author: 'Чарли Мангер',
      title: 'Вице-председатель Berkshire Hathaway',
    },
    {
      quote: 'Ваше время ограничено, не тратьте его, живя чужой жизнью. Имейте храбрость следовать своему сердцу и интуиции.',
      author: 'Стив Джобс',
      title: 'Основатель Apple',
    },
    {
      quote: 'Препятствия — это то, что вы видите, когда отводите взгляд от своей финансовой цели.',
      author: 'Илон Маск',
      title: 'Основатель Tesla & SpaceX',
    },
    {
      quote: 'Если вы не кайфуете от того, что делаете ошибки, вы никогда не научитесь принимать эффективные решения.',
      author: 'Рэй Далио',
      title: 'Основатель крупнейшего хедж-фонда Bridgewater Associates',
    },
    {
      quote: 'Формальное образование поможет вам выжить. Самообразование приведет вас к колоссальному богатству.',
      author: 'Джим Рон',
      title: 'Всемирно известный бизнес-тренер и оратор',
    },
    {
      quote: 'Зарабатывать деньги — это искусство, работать — это искусство, а хороший бизнес — это лучшее искусство из всех.',
      author: 'Энди Уорхол',
      title: 'Художник и культовый предприниматель',
    },
  ],
};

const WELCOME_MESSAGES: Record<Language, string> = {
  uk: `Вітаю! Я ваш особистий ІІ Фінансовий Менеджер та консультант з високого доходу.\n\nМоя мета — допомогти вам підвищити заробіток, сформувати особистий капітал та ефективно керувати бюджетом. Напишіть мені будь-яке запитання або оберіть готову тему нижче!`,
  en: `Hello! I am your personal AI Financial Manager and high-income consultant.\n\nMy goal is to help you boost your earnings, build personal wealth, and manage your budget efficiently. Ask me any question or choose a topic below!`,
  ru: `Здравствуйте! Я ваш личный ИИ Финансовый Менеджер и консультант по высокому доходу.\n\nМоя цель — помочь вам повысить заработок, сформировать личный капитал и эффективно управлять бюджетом. Напишите мне любой вопрос или выберите готовую тему ниже!`,
};

const QUICK_PROMPTS: Record<Language, Array<{ label: string; prompt: string }>> = {
  uk: [
    { label: '🚀 Як збільшити дохід на +50%?', prompt: 'Як мені збільшити свій щомісячний дохід на 50% у найближчі місяці?' },
    { label: '💡 Куди інвестувати перші $1000?', prompt: 'У мене є перші вільні $1000. У які активи чи навички їх інвестувати?' },
    { label: '🛡️ Стратегія закриття боргів', prompt: 'Склади ефективний покроковий план закриття кредитних карток та боргів.' },
    { label: '📈 Як створити пасивний дохід?', prompt: 'Розкажи про дієві інструменти створення пасивного доходу з нуля.' },
  ],
  en: [
    { label: '🚀 How to boost income by +50%?', prompt: 'How can I increase my monthly income by 50% in the coming months?' },
    { label: '💡 Where to invest first $1000?', prompt: 'I have my first spare $1000. Which assets or skills should I invest in?' },
    { label: '🛡️ Debt payoff strategy', prompt: 'Create an effective step-by-step plan to pay off credit cards and debts.' },
    { label: '📈 How to build passive income?', prompt: 'Tell me about proven tools to build passive income from scratch.' },
  ],
  ru: [
    { label: '🚀 Как увеличить доход на +50%?', prompt: 'Как мне увеличить свой ежемесячный доход на 50% в ближайшие месяцы?' },
    { label: '💡 Куда инвестировать первые $1000?', prompt: 'У меня есть первые свободные $1000. В какие активы или навыки их инвестировать?' },
    { label: '🛡️ Стратегия закрытия долгов', prompt: 'Составь эффективный пошаговый план закрытия кредитных карт и долгов.' },
    { label: '📈 Как создать пассивный доход?', prompt: 'Расскажи о работающих инструментах создания пассивного дохода с нуля.' },
  ],
};

export const AiAdvisor: React.FC<AiAdvisorProps> = ({
  adviceText,
  onGenerateAdvice,
  isLoading,
  userContext,
  currentLanguage = 'uk',
}) => {
  // Quote Carousel State
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isCopiedQuote, setIsCopiedQuote] = useState(false);

  // Quotes list for current language
  const quotesList = SUCCESS_QUOTES[currentLanguage] || SUCCESS_QUOTES.uk;
  const currentQuote = quotesList[quoteIndex % quotesList.length] || quotesList[0];

  // Chat State initialized with language welcome message
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome_1',
      sender: 'ai',
      text: WELCOME_MESSAGES[currentLanguage] || WELCOME_MESSAGES.uk,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  // Update welcome message if language changes and only default welcome msg is present
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome_1') {
        return [
          {
            id: 'welcome_1',
            sender: 'ai',
            text: WELCOME_MESSAGES[currentLanguage] || WELCOME_MESSAGES.uk,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return prev;
    });
  }, [currentLanguage]);

  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % quotesList.length);
  };

  const handleCopyQuote = () => {
    const text = `«${currentQuote.quote}» — ${currentQuote.author}`;
    navigator.clipboard.writeText(text);
    setIsCopiedQuote(true);
    setTimeout(() => setIsCopiedQuote(false), 2000);
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend || inputMessage).trim();
    if (!content || isSending) return;

    const userMsg: ChatMessage = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage('');
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ sender: m.sender, text: m.text })),
          userFinancialContext: { ...userContext, language: currentLanguage },
          language: currentLanguage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: ChatMessage = {
          id: 'ai_' + Date.now(),
          sender: 'ai',
          text: data.reply || (currentLanguage === 'uk' ? 'Фокусуйтеся на створенні цінності та збільшенні вашого ключового доходу!' : currentLanguage === 'en' ? 'Focus on creating value and scaling your primary income!' : 'Фокусируйтесь на создании ценности и увеличении вашего ключевого дохода!'),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      } else {
        throw new Error('Chat API error');
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: 'ai_err_' + Date.now(),
        sender: 'ai',
        text: currentLanguage === 'uk'
          ? 'Для досягнення фінансового успіху важливо діяти системно. Повторіть запит через декілька секунд!'
          : currentLanguage === 'en'
          ? 'Systematic action is key to financial success. Please try again in a few seconds!'
          : 'Для достижения финансового успеха важно действовать системно. Повторите запрос через пару секунд!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPromptsList = QUICK_PROMPTS[currentLanguage] || QUICK_PROMPTS.uk;

  const uiTexts = {
    wisdomHeader: currentLanguage === 'uk' ? 'Мудрість мільйонерів & Успіх' : currentLanguage === 'en' ? 'Millionaire Wisdom & Success' : 'Мудрость миллионеров & Успешный Успех',
    copyQuote: currentLanguage === 'uk' ? 'Скопіювати цитату' : currentLanguage === 'en' ? 'Copy quote' : 'Скопировать цитату',
    anotherQuote: currentLanguage === 'uk' ? 'Інша цитата' : currentLanguage === 'en' ? 'Another quote' : 'Другая цитата',
    expressTitle: currentLanguage === 'uk' ? 'Експрес-Аналіз Фінансів' : currentLanguage === 'en' ? 'Express Financial Analysis' : 'Экспресс-Анализ Финансов',
    runAnalysis: currentLanguage === 'uk' ? 'Запустити ІІ-Аналіз' : currentLanguage === 'en' ? 'Run AI Analysis' : 'Запустить ИИ-Анализ',
    analyzing: currentLanguage === 'uk' ? 'Аналіз...' : currentLanguage === 'en' ? 'Analyzing...' : 'Анализ...',
    managerTitle: currentLanguage === 'uk' ? 'Особистий Фінансовий Менеджер' : currentLanguage === 'en' ? 'Personal Financial Manager' : 'Личный Финансовый Менеджер',
    managerSub: currentLanguage === 'uk' ? 'Консультант із зростання доходу та багатства' : currentLanguage === 'en' ? 'High-income & wealth consultant' : 'Консультант по росту дохода и богатству',
    managerThinking: currentLanguage === 'uk' ? 'Менеджер формулює рекомендації...' : currentLanguage === 'en' ? 'Manager is crafting advice...' : 'Менеджер формулирует рекомендации...',
    inputPlaceholder: currentLanguage === 'uk' ? 'Задайте запитання щодо доходів, інвестицій чи бюджету...' : currentLanguage === 'en' ? 'Ask a question about income, investments, or budget...' : 'Задайте вопрос по доходам, инвестициям или бюджету...',
  };

  return (
    <div className="space-y-4">
      {/* 1. SUCCESS QUOTES BANNER */}
      <div
        className="rounded-3xl p-5 space-y-3 relative overflow-hidden transition-all shadow-sm"
        style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(16, 185, 129, 0.08))',
          border: '1px solid rgba(245, 158, 11, 0.25)',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
              <Quote className="w-4 h-4" />
            </span>
            <span className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
              {uiTexts.wisdomHeader}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleCopyQuote}
              className="p-1.5 rounded-xl surface-soft hover:surface text-xs font-bold transition txt-sub"
              title={uiTexts.copyQuote}
            >
              {isCopiedQuote ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleNextQuote}
              className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold hover:bg-amber-500/30 active:scale-95 transition flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{uiTexts.anotherQuote}</span>
            </button>
          </div>
        </div>

        <div className="space-y-1.5 pt-1">
          <p className="font-display font-semibold text-sm leading-relaxed italic txt-main">
            «{currentQuote.quote}»
          </p>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-amber-500">— {currentQuote.author}</span>
            <span className="txt-sub text-[11px]">({currentQuote.title})</span>
          </div>
        </div>
      </div>

      {/* 2. EXPRESS AI FINANCIAL ADVICE BLOCK */}
      <div
        className="rounded-3xl p-5 space-y-3"
        style={{
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--accent) 12%, transparent), color-mix(in srgb, var(--accent-2) 6%, transparent))',
          border: '1px solid color-mix(in srgb, var(--accent) 22%, transparent)',
        }}
      >
        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 text-white shadow-xs"
              style={{ background: 'var(--accent)' }}
            >
              <Wand2 className="w-4 h-4" />
            </span>
            <div>
              <h2 className="font-display font-bold text-sm truncate" style={{ color: 'var(--accent)' }}>
                {uiTexts.expressTitle}
              </h2>
            </div>
          </div>
          <button
            onClick={onGenerateAdvice}
            disabled={isLoading}
            className="text-xs text-white px-3.5 py-1.5 rounded-xl font-bold active:scale-95 transition shrink-0 flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isLoading ? uiTexts.analyzing : uiTexts.runAnalysis}</span>
          </button>
        </div>

        <div className="text-xs leading-relaxed font-medium whitespace-pre-line txt-main surface-soft rounded-2xl p-3.5">
          {adviceText}
        </div>
      </div>

      {/* 3. INTERACTIVE CHAT WITH PERSONAL FINANCIAL MANAGER */}
      <div className="surface border border-hair rounded-3xl p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-hair">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-sm flex items-center gap-1.5">
                <span>{uiTexts.managerTitle}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </h3>
              <p className="text-[11px] txt-sub font-medium">{uiTexts.managerSub}</p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full surface-soft text-purple-500 border border-purple-500/20">
            AI Gemini Pro
          </span>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {quickPromptsList.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(item.prompt)}
              disabled={isSending}
              className="text-[11px] font-bold px-3 py-1.5 rounded-xl surface-soft hover:surface border border-hair active:scale-95 transition whitespace-nowrap txt-sub hover:text-blue-500 shrink-0"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Messages Scroll Area */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto no-scrollbar pr-1 pt-1">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none font-medium'
                    : 'surface-soft txt-main border border-hair rounded-bl-none font-medium'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[9px] mt-1 text-right font-num opacity-70 ${
                    msg.sender === 'user' ? 'text-white' : 'txt-sub'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isSending && (
            <div className="flex gap-2.5 justify-start items-center">
              <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="surface-soft rounded-2xl px-3.5 py-2 text-xs txt-sub border border-hair italic flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                <span>{uiTexts.managerThinking}</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-2 border-t border-hair"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={uiTexts.inputPlaceholder}
            className="flex-1 surface-soft rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500/30 transition font-medium"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className="w-9 h-9 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white flex items-center justify-center transition active:scale-95 shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};


