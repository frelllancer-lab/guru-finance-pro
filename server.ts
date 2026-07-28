import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to get Gemini client
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Exchange rates API proxy
app.get('/api/exchange-rates', async (req, res) => {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (response.ok) {
      const data = await response.json();
      res.json({ success: true, rates: data.rates });
    } else {
      res.json({ success: false, rateUAH: 41.5 });
    }
  } catch (err) {
    res.json({ success: false, rateUAH: 41.5 });
  }
});

// AI Financial Advisor Endpoint
app.post('/api/ai/advice', async (req, res) => {
  try {
    const { period, currency, income, expense, debt, accountsCount, language = 'uk' } = req.body;
    const lang = language === 'en' ? 'en' : language === 'ru' ? 'ru' : 'uk';

    const defaultAdvice = {
      uk: '1. Формуйте подушку безпеки на 3-6 місяців.\n2. У першу чергу гасіть борги з найвищою процентною ставкою.\n3. Стежте за співвідношенням обов’язкових платежів до загальних доходів (не більше 30%).',
      en: '1. Build an emergency cushion for 3-6 months.\n2. Pay off highest-interest card debt first.\n3. Keep essential obligations under 30% of total income.',
      ru: '1. Формируйте подушку безопасности на 3-6 месяцев.\n2. В первую очередь гасите долги с наивысшей процентной ставкой.\n3. Следите за соотношением обязательных платежей к общим доходам (не более 30%).',
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not configured in server environment.',
        advice: defaultAdvice[lang],
      });
    }

    const langName = lang === 'uk' ? 'українською мовою' : lang === 'en' ? 'English' : 'русском языке';

    const promptText = `Ты - высококвалифицированный персональный финансовый консультант в приложении "Финансы PRO".
Проанализируй финансовое состояние пользователя за период "${period || 'месяц'}":
- Валюта: ${currency || 'UAH'}
- Общие доходы: ${income || 0}
- Общие расходы: ${expense || 0}
- Совокупный долг по картам: ${debt || 0}
- Количество счетов/карт: ${accountsCount || 0}

ВАЖНО: Дай 3 понятных, коротких и практичных финансовых совета НА ${langName.toUpperCase()}. Будь вежливым, профессиональным и вдохновляющим.
Оформи ответ в виде 3 нумерованных пунктов с конкретными рекомендациями.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
    });

    const adviceText = response.text || defaultAdvice[lang];
    res.json({ success: true, advice: adviceText.trim() });
  } catch (error: any) {
    console.error('Error in /api/ai/advice:', error);
    const lang = (req.body?.language === 'en' ? 'en' : req.body?.language === 'ru' ? 'ru' : 'uk') as 'uk' | 'en' | 'ru';
    const fallbackAdvice = {
      uk: '1. Контролюйте регулярні передплати та дрібні витрати.\n2. Відкладайте не менше 10% від кожного доходу.\n3. Вносьте обов’язкові платежі за картками заздалегідь.',
      en: '1. Monitor regular subscriptions and minor expenses.\n2. Set aside at least 10% of every income stream.\n3. Make mandatory credit card payments ahead of time.',
      ru: '1. Контролируйте регулярные подписки и мелкие расходы.\n2. Откладывайте не менее 10% от каждого дохода.\n3. Вносите обязательные платежи по картам заранее.',
    };
    res.status(500).json({
      error: error?.message || 'Failed to generate financial advice',
      advice: fallbackAdvice[lang],
    });
  }
});

// AI Personal Financial Manager Chat Endpoint
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, userFinancialContext } = req.body;
    const reqLang = req.body.language || userFinancialContext?.language || 'uk';
    const lang = reqLang === 'en' ? 'en' : reqLang === 'ru' ? 'ru' : 'uk';

    const defaultReplies = {
      uk: 'Вітаю! Я ваш особистий фінансовий менеджер з досягнення максимального доходу та багатства. Головний принцип багатих: завжди інвестуйте спочатку в свої навички та створення активів!',
      en: 'Hello! I am your personal financial manager for achieving high income and wealth. The golden rule of the rich: always invest in your skills and asset building first!',
      ru: 'Приветствую! Я твой личный финансовый менеджер по достижению максимального дохода и богатства. Главный принцип богатых: всегда инвестируй сначала в свои навыки и создание активов!',
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json({
        success: true,
        reply: defaultReplies[lang],
      });
    }

    const contextSummary = userFinancialContext
      ? `Контекст пользователя: Валюта: ${userFinancialContext.currency || 'UAH'}, Баланс: ${userFinancialContext.totalBalance || 0}, Доходы: ${userFinancialContext.income || 0}, Расходы: ${userFinancialContext.expense || 0}, Карт/счетов: ${userFinancialContext.accountsCount || 0}.`
      : '';

    const langInstructions = {
      uk: 'КРИТИЧНО ВАЖЛИВО: Відповідай ВИКЛЮЧНО УКРАЇНСЬКОЮ МОВОЮ!',
      en: 'CRITICAL INSTRUCTION: Respond EXCLUSIVELY IN ENGLISH!',
      ru: 'КРИТИЧЕСКИ ВАЖНО: Отвечай ИСКЛЮЧИТЕЛЬНО НА РУССКОМ ЯЗЫКЕ!',
    };

    const systemPrompt = `Ты — лучший в мире персональный финансовый менеджер, ментор по высокому доходу, финансовой свободе и "Успешному Успеху".
Твоя цель — давать четкие, конкретные, высокомотивирующие и практичные рекомендации по:
1. Масштабированию доходов (фриланс, бизнесы, повышение чека, финансовое мышление, карьерный рост).
2. Оптимизации бюджета и избавлению от долгов.
3. Грамотному инвестированию, созданию пассивного дохода и накоплению капитала.
${contextSummary}

${langInstructions[lang]}
Отвечай энергично, профессионально, вежливо, с легким оттенком уверенности успешного долларового миллионера. Используй списки и абзацы для структурирования ответов.`;

    // Construct conversation history for Gemini
    const formattedHistory = (messages || []).map((msg: { sender: string; text: string }) => {
      return `${msg.sender === 'user' ? 'User' : 'Financial Manager'}: ${msg.text}`;
    }).join('\n\n');

    const promptText = `${systemPrompt}\n\nИстория диалога:\n${formattedHistory}\n\nДай аргументированный и вдохновляющий ответ Финансового Менеджера.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
    });

    const reply = response.text || defaultReplies[lang];
    res.json({ success: true, reply: reply.trim() });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    const reqLang = req.body?.language || req.body?.userFinancialContext?.language || 'uk';
    const lang = reqLang === 'en' ? 'en' : reqLang === 'ru' ? 'ru' : 'uk';
    const errorReplies = {
      uk: 'Чудове запитання! Пам’ятайте, що шлях до високого доходу лежить через масштабування цінності, яку ви даєте ринку.',
      en: 'Great question! Remember that the path to high income comes from scaling the value you bring to the market.',
      ru: 'Отличный вопрос! Помни, что путь к высокому доходу лежит через масштабирование ценности, которую ты даешь рынку.',
    };
    res.status(500).json({
      error: error?.message || 'Chat error',
      reply: errorReplies[lang],
    });
  }
});

// AI Single Receipt Scanner Endpoint
app.post('/api/ai/scan-receipt', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
    }

    const { base64Image, mimeType } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: 'base64Image parameter is required' });
    }

    const promptText = `Проанализируй данное изображение кассового чека или квитанции.
Извлеки следующую информацию:
1. type: "expense" (расход) или "income" (доход)
2. amount: итоговая сумма числом (например 150.50)
3. currency: валюта ("UAH" или "USD")
4. category: подбери наиболее подходящий ID категории из списка [food, transport, shopping, home, fun, health, services, cash, other]
5. note: краткое название заведения, магазина или предмета покупки
6. date: дата и время операции в формате ISO (например "2026-07-28T14:30:00.000Z"), если года нет - используй текущий 2026 год.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { text: promptText },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType || 'image/jpeg',
            },
          },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            category: { type: Type.STRING },
            note: { type: Type.STRING },
            date: { type: Type.STRING },
          },
          required: ['type', 'amount', 'currency', 'category', 'note'],
        },
      },
    });

    const jsonText = response.text || '{}';
    const parsedData = JSON.parse(jsonText);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error scanning receipt:', error);
    res.status(500).json({ error: error?.message || 'Failed to scan receipt' });
  }
});

// AI Multi-Bank Screenshots Scanner Endpoint
app.post('/api/ai/scan-multibank', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
    }

    const { images } = req.body; // Array of { data: base64, mimeType: string }
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'images array is required' });
    }

    const imageParts = images.map((img: { data: string; mimeType?: string }) => ({
      inlineData: {
        data: img.data,
        mimeType: img.mimeType || 'image/jpeg',
      },
    }));

    const promptText = `Проанализируй предоставленные скриншоты из банковских приложений (Monobank, Приват24, ПУМБ, Sense Bank, Револют и т.д.).
Найди информацию о доступных картах/счетах и списках операций:
1. accounts: список обнаруженных счетов/карт:
   - bank: название банка (например "Monobank", "ПриватБанк")
   - name: название карты или счета (например "Черная карта", "Кредитка")
   - ownBalance: собственные средства числом (положительное)
   - debt: сумма задолженности числом (если есть кредитный лимит/долг)
   - minPayment: обязательный ежемесячный платеж (если виден)
   - currency: "UAH" или "USD"
2. transactions: список недавних транзакций:
   - type: "expense" или "income"
   - amount: сумма числом
   - currency: "UAH" или "USD"
    - category: одна из [food, transport, shopping, home, fun, health, services, cash, salary, freelance, gift, invest, other]
   - note: описание транзакции
   - date: ISO строка даты/времени (например "2026-07-28T12:00:00.000Z")`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ text: promptText }, ...imageParts],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            accounts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bank: { type: Type.STRING },
                  name: { type: Type.STRING },
                  ownBalance: { type: Type.NUMBER },
                  debt: { type: Type.NUMBER },
                  minPayment: { type: Type.NUMBER },
                  currency: { type: Type.STRING },
                },
              },
            },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  currency: { type: Type.STRING },
                  category: { type: Type.STRING },
                  note: { type: Type.STRING },
                  date: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const jsonText = response.text || '{"accounts":[],"transactions":[]}';
    const parsedData = JSON.parse(jsonText);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error scanning multibank screenshots:', error);
    res.status(500).json({ error: error?.message || 'Failed to scan screenshots' });
  }
});

// AI PDF Bank Statement Scanner Endpoint
app.post('/api/ai/scan-pdf', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY environment variable is missing.' });
    }

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text parameter is required' });
    }

    const promptText = `Проанализируй следующий текст банковской выписки в формате PDF.
Извлеки информацию о счете и списки операций:
1. accounts: список обнаруженных счетов/карт (bank, name, ownBalance, debt, minPayment, currency)
2. transactions: список проведённых транзакций (type: "expense" или "income", amount, currency: "UAH" или "USD", category из [food, transport, shopping, home, fun, health, services, cash, salary, freelance, gift, invest, other], note, date в ISO формате).

Текст выписки:
${text.substring(0, 10000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            accounts: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  bank: { type: Type.STRING },
                  name: { type: Type.STRING },
                  ownBalance: { type: Type.NUMBER },
                  debt: { type: Type.NUMBER },
                  minPayment: { type: Type.NUMBER },
                  currency: { type: Type.STRING },
                },
              },
            },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  currency: { type: Type.STRING },
                  category: { type: Type.STRING },
                  note: { type: Type.STRING },
                  date: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const jsonText = response.text || '{"accounts":[],"transactions":[]}';
    const parsedData = JSON.parse(jsonText);
    res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error scanning PDF statement:', error);
    res.status(500).json({ error: error?.message || 'Failed to scan PDF statement' });
  }
});

// Monobank Personal API Sync Endpoint
app.post('/api/bank/monobank/sync', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Токен Monobank API не предоставлен' });
    }

    const response = await fetch('https://api.monobank.ua/personal/client-info', {
      headers: { 'X-Token': token.trim() },
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({
        error: 'Не удалось авторизоваться в Monobank API. Проверьте правильность токена.',
        details: errText,
      });
    }

    const clientInfo = await response.json();
    const parsedAccounts = (clientInfo.accounts || []).map((acc: any) => {
      const currencyCodeMap: Record<number, string> = { 980: 'UAH', 840: 'USD', 978: 'EUR' };
      const currency = currencyCodeMap[acc.currencyCode] || 'UAH';
      const balanceUAH = (acc.balance || 0) / 100;
      const creditLimitUAH = (acc.creditLimit || 0) / 100;

      let ownBalance = 0;
      let debt = 0;

      if (creditLimitUAH > 0) {
        if (balanceUAH >= creditLimitUAH) {
          ownBalance = balanceUAH - creditLimitUAH;
          debt = 0;
        } else {
          ownBalance = 0;
          debt = creditLimitUAH - balanceUAH;
        }
      } else {
        ownBalance = balanceUAH >= 0 ? balanceUAH : 0;
        debt = balanceUAH < 0 ? Math.abs(balanceUAH) : 0;
      }

      const cardPan = acc.maskedPan && acc.maskedPan[0] ? ` (*${acc.maskedPan[0].slice(-4)})` : '';
      const typeLabel =
        acc.type === 'black'
          ? 'Черная'
          : acc.type === 'white'
          ? 'Белая'
          : acc.type === 'eSupport'
          ? 'еПоддержка'
          : acc.type || 'Карта';

      return {
        id: 'mono_' + acc.id,
        bank: 'Monobank',
        name: `${typeLabel}${cardPan}`,
        ownBalance: Math.round(ownBalance * 100) / 100,
        debt: Math.round(debt * 100) / 100,
        minPayment: debt > 0 ? Math.round(debt * 0.05 * 100) / 100 : 0,
        currency,
      };
    });

    res.json({
      success: true,
      clientName: clientInfo.name,
      accounts: parsedAccounts,
    });
  } catch (error: any) {
    console.error('Monobank sync error:', error);
    res.status(500).json({ error: error?.message || 'Ошибка подключения к Monobank API' });
  }
});

// Apple Wallet CSV Import Endpoint
app.post('/api/sync/apple-wallet-csv', async (req, res) => {
  try {
    const { csvText } = req.body;
    if (!csvText) {
      return res.status(400).json({ error: 'Текст CSV отсутствует' });
    }

    const ai = getGeminiClient();
    if (!ai) {
      const lines = csvText.split('\n').filter((l: string) => l.trim().length > 0);
      const transactions = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c: string) => c.replace(/"/g, '').trim());
        if (cols.length >= 3) {
          const amount = parseFloat(cols[cols.length - 1] || cols[cols.length - 2]);
          if (!isNaN(amount)) {
            transactions.push({
              type: amount < 0 ? 'expense' : 'income',
              amount: Math.abs(amount),
              currency: 'USD',
              category: 'shopping',
              note: cols[1] || cols[0] || 'Apple Card / Wallet',
              date: new Date().toISOString(),
            });
          }
        }
      }
      return res.json({ success: true, transactions });
    }

    const promptText = `Проанализируй выписку Apple Wallet / Apple Card в формате CSV или TXT.
Извлеки список всех финансовых операций:
- type: "expense" или "income"
- amount: числовой объем
- currency: "USD", "EUR" или "UAH"
- category: из [food, transport, shopping, home, fun, health, services, cash, salary, freelance, gift, invest, other]
- note: название торговца или описание
- date: дата в ISO формате

Выписка:
${csvText.substring(0, 15000)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  currency: { type: Type.STRING },
                  category: { type: Type.STRING },
                  note: { type: Type.STRING },
                  date: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    });

    const jsonText = response.text || '{"transactions":[]}';
    const parsedData = JSON.parse(jsonText);
    res.json({ success: true, transactions: parsedData.transactions || [] });
  } catch (error: any) {
    console.error('Apple Wallet CSV sync error:', error);
    res.status(500).json({ error: error?.message || 'Ошибка обработки CSV Apple Wallet' });
  }
});

// Apple Wallet iOS Shortcut Webhook Endpoint
app.post('/api/sync/apple-wallet-shortcut', (req, res) => {
  try {
    const { amount, merchant, type, category, currency } = req.body;
    const tx = {
      type: type || 'expense',
      amount: parseFloat(amount) || 0,
      currency: currency || 'UAH',
      category: category || 'shopping',
      note: merchant || 'Apple Pay / Wallet Shortcut',
      date: new Date().toISOString(),
    };
    res.json({ success: true, transaction: tx, message: 'Транзакция из Apple Wallet принята' });
  } catch (err: any) {
    res.status(400).json({ error: 'Неверный формат данных Apple Wallet Shortcut' });
  }
});

// Vite or Static files middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
