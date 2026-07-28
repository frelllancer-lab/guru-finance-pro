import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: Boolean(process.env.GEMINI_API_KEY) });
});

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

app.post('/api/ai/advice', async (req, res) => {
  try {
    const { period, currency, income, expense, debt, accountsCount, language = 'uk' } = req.body;
    const lang = language === 'en' ? 'en' : language === 'ru' ? 'ru' : 'uk';
    const defaultAdvice: Record<string, string> = {
      uk: '1. Формуйте подушку безпеки на 3-6 місяців.\n2. У першу чергу гасіть борги з найвищою процентною ставкою.\n3. Стежте за співвідношенням обов\'язкових платежів до загальних доходів (не більше 30%).',
      en: '1. Build an emergency cushion for 3-6 months.\n2. Pay off highest-interest card debt first.\n3. Keep essential obligations under 30% of total income.',
      ru: '1. Формируйте подушку безопасности на 3-6 месяцев.\n2. В первую очередь гасите долги с наивысшей процентной ставкой.\n3. Следите за соотношением обязательных платежей к общим доходам (не более 30%).',
    };
    const ai = getGeminiClient();
    if (!ai) return res.status(400).json({ error: 'GEMINI_API_KEY missing', advice: defaultAdvice[lang] });
    const langName = lang === 'uk' ? 'українською мовою' : lang === 'en' ? 'English' : 'русском языке';
    const promptText = 'Ты - финансовый консультант в приложении "Финансы PRO". Период: ' + (period || 'месяц') + ', Валюта: ' + (currency || 'UAH') + ', Доходы: ' + (income || 0) + ', Расходы: ' + (expense || 0) + ', Долг: ' + (debt || 0) + ', Счетов: ' + (accountsCount || 0) + '. Дай 3 коротких практических финансовых совета НА ' + langName.toUpperCase() + '. Оформи как 3 нумерованных пункта.';
    const response = await ai.models.generateContent({ model: 'gemini-3.1-flash-lite', contents: promptText });
    res.json({ success: true, advice: (response.text || defaultAdvice[lang]).trim() });
  } catch (error: any) {
    const lang = (req.body?.language === 'en' ? 'en' : req.body?.language === 'ru' ? 'ru' : 'uk') as 'uk' | 'en' | 'ru';
    const fb: Record<string, string> = { uk: '1. Відкладайте 10%.\n2. Гасіть борги.\n3. Контролюйте витрати.', en: '1. Save 10%.\n2. Pay off debt.\n3. Track expenses.', ru: '1. Откладывайте 10%.\n2. Гасите долги.\n3. Контролируйте расходы.' };
    res.status(500).json({ error: error?.message, advice: fb[lang] });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, userFinancialContext } = req.body;
    const reqLang = req.body.language || userFinancialContext?.language || 'uk';
    const lang = reqLang === 'en' ? 'en' : reqLang === 'ru' ? 'ru' : 'uk';
    const def: Record<string, string> = { uk: 'Вітаю! Я ваш фінансовий менеджер.', en: 'Hello! I am your financial manager.', ru: 'Привет! Я твой финансовый менеджер.' };
    const ai = getGeminiClient();
    if (!ai) return res.json({ success: true, reply: def[lang] });
    const ctx = userFinancialContext ? 'Баланс: ' + (userFinancialContext.totalBalance || 0) + ', Доходы: ' + (userFinancialContext.income || 0) + ', Расходы: ' + (userFinancialContext.expense || 0) + '.' : '';
    const li: Record<string, string> = { uk: 'Відповідай УКРАЇНСЬКОЮ!', en: 'Respond in ENGLISH!', ru: 'Отвечай на РУССКОМ!' };
    const hist = (messages || []).map((m: any) => (m.sender === 'user' ? 'User' : 'Manager') + ': ' + m.text).join('\n\n');
    const prompt = 'Ты финансовый менеджер. ' + ctx + ' ' + li[lang] + ' История:\n' + hist + '\nОтвет:';
    const response = await ai.models.generateContent({ model: 'gemini-3.1-flash-lite', contents: prompt });
    res.json({ success: true, reply: (response.text || def[lang]).trim() });
  } catch (error: any) {
    res.status(500).json({ error: error?.message, reply: 'Ошибка' });
  }
});

app.post('/api/ai/scan-receipt', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return res.status(400).json({ error: 'GEMINI_API_KEY missing' });
    const { base64Image, mimeType } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'base64Image required' });
    const promptText = 'Проанализируй кассовый чек или квитанцию. Извлеки: type ("expense" или "income"), amount (число), currency ("UAH" или "USD"), category из [food, transport, shopping, home, fun, health, services, cash, other], note (название заведения/магазина), date (ISO формат, год 2026).';
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: { parts: [{ text: promptText }, { inlineData: { data: base64Image, mimeType: mimeType || 'image/jpeg' } }] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, amount: { type: Type.NUMBER }, currency: { type: Type.STRING }, category: { type: Type.STRING }, note: { type: Type.STRING }, date: { type: Type.STRING } }, required: ['type', 'amount', 'currency', 'category', 'note'] },
      },
    });
    res.json({ success: true, data: JSON.parse(response.text || '{}') });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Scan failed' });
  }
});

app.post('/api/ai/scan-multibank', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return res.status(400).json({ error: 'GEMINI_API_KEY missing' });
    const { images } = req.body;
    if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ error: 'images required' });
    const imageParts = images.map((img: any) => ({ inlineData: { data: img.data, mimeType: img.mimeType || 'image/jpeg' } }));
    const promptText = 'Проанализируй скриншоты банков. Найди accounts (bank, name, ownBalance, debt, minPayment, currency) и transactions (type, amount, currency, category из [food, transport, shopping, home, fun, health, services, cash, salary, freelance, gift, invest, other], note, date в ISO).';
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: { parts: [{ text: promptText }, ...imageParts] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.OBJECT, properties: { accounts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { bank: { type: Type.STRING }, name: { type: Type.STRING }, ownBalance: { type: Type.NUMBER }, debt: { type: Type.NUMBER }, minPayment: { type: Type.NUMBER }, currency: { type: Type.STRING } } } }, transactions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, amount: { type: Type.NUMBER }, currency: { type: Type.STRING }, category: { type: Type.STRING }, note: { type: Type.STRING }, date: { type: Type.STRING } } } } } },
      },
    });
    res.json({ success: true, data: JSON.parse(response.text || '{"accounts":[],"transactions":[]}') });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Scan failed' });
  }
});

app.post('/api/ai/scan-pdf', async (req, res) => {
  try {
    const ai = getGeminiClient();
    if (!ai) return res.status(400).json({ error: 'GEMINI_API_KEY missing' });
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'text required' });
    const promptText = 'Проанализируй текст банковской выписки. Извлеки accounts (bank, name, ownBalance, debt, minPayment, currency) и transactions (type, amount, currency, category из [food, transport, shopping, home, fun, health, services, cash, salary, freelance, gift, invest, other], note, date в ISO). Текст выписки:\n' + text.substring(0, 10000);
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: { type: Type.OBJECT, properties: { accounts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { bank: { type: Type.STRING }, name: { type: Type.STRING }, ownBalance: { type: Type.NUMBER }, debt: { type: Type.NUMBER }, minPayment: { type: Type.NUMBER }, currency: { type: Type.STRING } } } }, transactions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, amount: { type: Type.NUMBER }, currency: { type: Type.STRING }, category: { type: Type.STRING }, note: { type: Type.STRING }, date: { type: Type.STRING } } } } } },
      },
    });
    res.json({ success: true, data: JSON.parse(response.text || '{"accounts":[],"transactions":[]}') });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'PDF scan failed' });
  }
});

app.post('/api/bank/monobank/sync', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    const response = await fetch('https://api.monobank.ua/personal/client-info', { headers: { 'X-Token': token.trim() } });
    if (!response.ok) return res.status(response.status).json({ error: 'Auth failed' });
    const clientInfo = await response.json();
    const parsed = (clientInfo.accounts || []).map((acc: any) => {
      const cm: Record<number, string> = { 980: 'UAH', 840: 'USD', 978: 'EUR' };
      const cur = cm[acc.currencyCode] || 'UAH';
      const bal = (acc.balance || 0) / 100;
      const cl = (acc.creditLimit || 0) / 100;
      let own = bal >= 0 ? bal : 0;
      let debt = bal < 0 ? Math.abs(bal) : 0;
      if (cl > 0) { own = bal >= cl ? bal - cl : 0; debt = bal >= cl ? 0 : cl - bal; }
      const pan = acc.maskedPan && acc.maskedPan[0] ? ' (*' + acc.maskedPan[0].slice(-4) + ')' : '';
      const tl = acc.type === 'black' ? 'Черная' : acc.type === 'white' ? 'Белая' : acc.type === 'eSupport' ? 'еПоддержка' : acc.type || 'Карта';
      return { id: 'mono_' + acc.id, bank: 'Monobank', name: tl + pan, ownBalance: Math.round(own * 100) / 100, debt: Math.round(debt * 100) / 100, minPayment: debt > 0 ? Math.round(debt * 0.05 * 100) / 100 : 0, currency: cur };
    });
    res.json({ success: true, clientName: clientInfo.name, accounts: parsed });
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});

app.post('/api/sync/apple-wallet-csv', async (req, res) => {
  try {
    const { csvText } = req.body;
    if (!csvText) return res.status(400).json({ error: 'CSV required' });
    const ai = getGeminiClient();
    if (!ai) {
      const lines = csvText.split('\n').filter((l: string) => l.trim());
      const txs = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map((c: string) => c.replace(/"/g, '').trim());
        if (cols.length >= 3) {
          const a = parseFloat(cols[cols.length - 1] || cols[cols.length - 2]);
          if (!isNaN(a)) txs.push({ type: a < 0 ? 'expense' : 'income', amount: Math.abs(a), currency: 'USD', category: 'shopping', note: cols[1] || 'Apple Card', date: new Date().toISOString() });
        }
      }
      return res.json({ success: true, transactions: txs });
    }
    const promptText = 'Проанализируй Apple Wallet CSV. Извлеки transactions (type, amount, currency, category из [food, transport, shopping, home, fun, health, services, cash, salary, freelance, gift, invest, other], note, date). Выписка:\n' + csvText.substring(0, 15000);
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: promptText,
      config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { transactions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, amount: { type: Type.NUMBER }, currency: { type: Type.STRING }, category: { type: Type.STRING }, note: { type: Type.STRING }, date: { type: Type.STRING } } } } } } },
    });
    const d = JSON.parse(response.text || '{"transactions":[]}');
    res.json({ success: true, transactions: d.transactions || [] });
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});

app.post('/api/sync/apple-wallet-shortcut', (req, res) => {
  try {
    const { amount, merchant, type, category, currency } = req.body;
    res.json({ success: true, transaction: { type: type || 'expense', amount: parseFloat(amount) || 0, currency: currency || 'UAH', category: category || 'shopping', note: merchant || 'Apple Pay', date: new Date().toISOString() }, message: 'Accepted' });
  } catch (err: any) {
    res.status(400).json({ error: 'Invalid data' });
  }
});

export default app;
