import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- Gemini client ---
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

// --- Groq (primary AI) ---
async function groqChat(prompt: string): Promise<string | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });
    if (!resp.ok) return null;
    const data = await resp.json() as any;
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}

async function groqChatJson(prompt: string): Promise<any | null> {
  const text = await groqChat(prompt);
  if (!text) return null;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch {
    return null;
  }
}

// --- Regex PDF parsers ---
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ['атб', 'сільпо', 'фора', 'екомаркет', 'маркет', 'супермаркет', 'магазин', 'продукт', 'їжа', 'молоко', 'хліб', 'овоч', 'фрукт', 'кафе', 'ресторан', 'фастфуд', 'макдональдс', 'kfc', 'starbucks', 'coffee', 'pizza', 'puzata', 'хата', 'суші', 'піцерія'],
  transport: ['укрзалізниця', 'метро', 'автобус', 'таксі', 'bolt', 'uber', 'бензин', 'азс', 'окко', 'wog', 'parallel', 'парковка', 'parking'],
  shopping: ['allo', 'фокстрот', 'comfy', 'rome', 'citrus', 'rozetka', 'wildberries', 'ozon', 'amazon', 'aliexpress', 'закуп'],
  home: ['квартплата', 'жек', 'комунальні', 'водоканал', 'енергія', 'газ', 'інтернет', 'kyivstar', 'vodafone', 'lifecell'],
  fun: ['кіно', 'театр', 'концерт', 'стадіон', 'спорт', 'фітнес', 'gym', 'басейн', 'квест', 'netflix', 'spotify', 'шопінг'],
  health: ['аптека', 'лікарня', 'клініка', 'лікар', 'стоматолог', 'health', 'pharmacy', 'мед', 'аналіз', 'здоров'],
  services: ['пошта', 'нова пошта', 'meest', 'ukrposhta', 'сервіс', 'ремонт', 'перукар', 'salon', 'хімчистка', 'clean'],
};

function guessCategory(note: string): string {
  const lower = note.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) return cat;
    }
  }
  return 'other';
}

function parseUAHAmount(s: string): number {
  let cleaned = s.replace(/[^\d,.\-]/g, '');
  const isNeg = cleaned.includes('-');
  cleaned = cleaned.replace(/-/g, '');
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\.(?=\d{3})/g, '').replace(',', '.');
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : (isNeg ? -num : num);
}

function parseDate(s: string): string {
  const m = s.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/]?(\d{2,4})?/);
  if (!m) return new Date().toISOString().slice(0, 10);
  let year = m[3] || '2026';
  if (year.length === 2) year = '20' + year;
  return year + '-' + m[2].padStart(2, '0') + '-' + m[1].padStart(2, '0');
}

function parseNovaPay(text: string): { accounts: any[], transactions: any[] } {
  const accounts: any[] = [];
  const transactions: any[] = [];

  const balMatch = text.match(/Залишок на кінець періоду:\s*([\d\s,.\-]+?)\s*UAH/i);
  const bal = balMatch ? parseUAHAmount(balMatch[1]) : 0;
  const cardMatch = text.match(/Картка:\s*(\S+)/);
  const nameMatch = text.match(/ПІБ:\s*(.+)/);
  accounts.push({
    bank: 'НоваПей',
    name: (nameMatch?.[1] || 'НоваПей') + ' ' + (cardMatch?.[1] || ''),
    ownBalance: bal >= 0 ? bal : 0,
    debt: bal < 0 ? Math.abs(bal) : 0,
    minPayment: bal < 0 ? Math.round(Math.abs(bal) * 0.05 * 100) / 100 : 0,
    currency: 'UAH',
  });

  const opsIdx = text.indexOf('Операції');
  const searchStart = opsIdx > 0 ? opsIdx : 0;
  const txText = text.substring(searchStart);

  const blocks = txText.split(/(?<!\d)(?=\d{1,2}\.\d{2}\.\d{4}\s*\n)/);
  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;

    const dateMatch = lines[0].match(/^(\d{1,2})\.(\d{2})\.(\d{4})$/);
    if (!dateMatch) continue;
    const date = `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;

    let amountLine = '';
    let noteParts: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const l = lines[i];
      if (/\d[\d\s,]*[.,]\d{2}\s*UAH/i.test(l)) {
        amountLine = l;
        break;
      }
      if (i === 1) {
        const timeCard = l.replace(/^\d{2}:\d{2}\s+/, '').replace(/\*?\d{4}\s*/, '').trim();
        if (timeCard) noteParts.push(timeCard);
      } else {
        if (!/^\d{10,}/.test(l) && !/^5175/.test(l) && !/^UA\d{27}/i.test(l)) {
          noteParts.push(l);
        }
      }
    }

    const amtMatch = amountLine.match(/([-+]?)\s*([\d\s]+[.,]\d{2})\s*UAH/);
    if (!amtMatch) continue;
    const sign = amtMatch[1] === '-' ? -1 : 1;
    const amount = Math.abs(parseUAHAmount(amtMatch[2]));
    if (amount <= 0 || amount > 10000000) continue;

    const note = noteParts.join(' ').replace(/\s+/g, ' ').trim() || 'Операція';
    const isTransfer = /переказ коштів/i.test(note);
    const isIncome = sign > 0 || /надходж|кешбек|повернення|поповнення/i.test(note);
    const isPayer = /Платник:/i.test(note);
    const isRecipient = /Отримувач:/i.test(note);

    let category: string;
    if (isTransfer || isPayer || isRecipient) {
      category = 'transfer';
    } else {
      category = isIncome ? 'salary' : guessCategory(note);
    }

    let finalType: 'income' | 'expense';
    if (isPayer) finalType = 'income';
    else if (isRecipient) finalType = 'expense';
    else finalType = isIncome ? 'income' : 'expense';

    transactions.push({
      type: finalType,
      amount,
      currency: 'UAH',
      category,
      note,
      date,
    });
  }

  return { accounts, transactions };
}

function parseBankStatement(text: string) {
  if (!text || text.trim().length < 20) return { accounts: [], transactions: [], bank: null };

  const isNovaPay = /новапей|novapay|ТзОВ «НоваПей»|38324133/i.test(text);
  const isMono = /mono|monobank|мнобанк|black\s*\(\*|white\s*\(\*|е?підтримк/i.test(text);
  const isPrivat = /приват|privat|приватбанк|privatbank|4149|5168/i.test(text);
  const isABank = /а-?банк|a-?bank|абанк/i.test(text);

  if (isNovaPay) {
    const result = parseNovaPay(text);
    if (result.transactions.length > 0) {
      return { ...result, bank: 'НоваПей' };
    }
  }

  const bank = isMono ? 'Monobank' : isPrivat ? 'PrivatBank' : isABank ? 'А-Банк' : null;

  const accounts: any[] = [];
  if (bank) {
    const balMatch = text.match(/(?:баланс|залишок|останній)[\s:]*(?:UAH|UAH|UAH|грн|\u20B4)?\s*([\d\s,.\-]+)/i) ||
                     text.match(/(?:баланс|залишок)[\s:]*(?:грн)?\s*([\d\s,.\-]+)/i);
    const bal = balMatch ? parseUAHAmount(balMatch[1]) : 0;
    accounts.push({
      bank: bank,
      name: bank,
      ownBalance: bal >= 0 ? bal : 0,
      debt: bal < 0 ? Math.abs(bal) : 0,
      minPayment: bal < 0 ? Math.round(Math.abs(bal) * 0.05 * 100) / 100 : 0,
      currency: 'UAH',
    });
  }

  const transactions: any[] = [];
  const txPattern = /(\d{1,2}[.\-/]\d{1,2}[.\-/]?\d{0,4})\s+([^\n]{2,60}?)\s+([+-])\s*([\d\s,.\-]+?)\s*(?:UAH|UAH|UAH|грн|\u20B4|$)/gim;
  let match;
  while ((match = txPattern.exec(text)) !== null) {
    const date = parseDate(match[1]);
    const note = match[2].trim();
    const sign = match[3];
    const amount = Math.abs(parseUAHAmount(match[4]));
    if (amount <= 0 || amount > 10000000) continue;
    const isIncome = sign === '+' || /зарплат|надходж|переказ|кешбек|повернення|поповнення/i.test(note);
    transactions.push({
      type: isIncome ? 'income' : 'expense',
      amount,
      currency: 'UAH',
      category: isIncome ? 'salary' : guessCategory(note),
      note,
      date,
    });
  }

  if (transactions.length === 0) {
    const simplePattern = /(\d{1,2})[.\-/](\d{1,2})[.\-/]?(\d{0,4})\s+([^\n]{3,60}?)\s+([\d\s,.\-]+?)\s*(?:UAH|UAH|грн|\u20B4)/gim;
    while ((match = simplePattern.exec(text)) !== null) {
      const year = match[3] ? (match[3].length === 2 ? '20' + match[3] : match[3]) : '2026';
      const date = year + '-' + match[2].padStart(2, '0') + '-' + match[1].padStart(2, '0');
      const note = match[4].trim();
      const amount = Math.abs(parseUAHAmount(match[5]));
      if (amount <= 0) continue;
      const isIncome = /зарплат|надходж|переказ|кешбек|повернення|поповнення|\+/i.test(note);
      transactions.push({
        type: isIncome ? 'income' : 'expense',
        amount,
        currency: 'UAH',
        category: isIncome ? 'salary' : guessCategory(note),
        note,
        date,
      });
    }
  }

  if (transactions.length === 0) {
    const genericPattern = /(\d{1,2}[.\-/]\d{1,2}[.\-/]?\d{0,4})\s+([^\n]{2,80}?)\s+([\d\s,.\-]+?)\s*(?:грн|UAH|\u20B4)/gim;
    while ((match = genericPattern.exec(text)) !== null) {
      const date = parseDate(match[1]);
      const note = match[2].trim();
      const amount = Math.abs(parseUAHAmount(match[3]));
      if (amount <= 0 || amount > 10000000) continue;
      const isIncome = /надходж|зарплат|переказ|кешбек|повернення|поповнення|\+/i.test(note);
      transactions.push({
        type: isIncome ? 'income' : 'expense',
        amount,
        currency: 'UAH',
        category: isIncome ? 'salary' : guessCategory(note),
        note,
        date,
      });
    }
  }

  if (accounts.length === 0 && transactions.length > 0) {
    accounts.push({ bank: 'Банк', name: 'Выписка', ownBalance: 0, debt: 0, minPayment: 0, currency: 'UAH' });
  }

  return { accounts, transactions, bank };
}

// --- API Routes ---
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasGroqKey: Boolean(process.env.GROQ_API_KEY),
  });
});

app.get('/api/exchange-rates', async (_req, res) => {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    if (response.ok) {
      const data = await response.json();
      res.json({ success: true, rates: data.rates });
    } else {
      res.json({ success: false, rateUAH: 41.5 });
    }
  } catch {
    res.json({ success: false, rateUAH: 41.5 });
  }
});

app.post('/api/ai/advice', async (req, res) => {
  try {
    const { period, currency, income, expense, debt, accountsCount, language = 'uk' } = req.body;
    const lang = language === 'en' ? 'en' : language === 'ru' ? 'ru' : 'uk';
    const defaultAdvice: Record<string, string> = {
      uk: '1. Формуйте подушку безпеки на 3-6 місяців.\n2. Гасіть борги з найвищою ставкою.\n3. Контролюйте витрати (не більше 30% доходів).',
      en: '1. Build an emergency cushion for 3-6 months.\n2. Pay off highest-interest debt first.\n3. Keep obligations under 30% of income.',
      ru: '1. Формируйте подушку безопасности на 3-6 месяцев.\n2. Гасите долги с наивысшей ставкой.\n3. Контролируйте расходы (не более 30% доходов).',
    };
    const langName = lang === 'uk' ? 'українською' : lang === 'en' ? 'English' : 'русском';
    const promptText = 'Ты финансовый консультант. Период: ' + (period || 'месяц') + ', Валюта: ' + (currency || 'UAH') + ', Доходы: ' + (income || 0) + ', Расходы: ' + (expense || 0) + ', Долг: ' + (debt || 0) + ', Счетов: ' + (accountsCount || 0) + '. Дай 3 совета на ' + langName + '. 3 нумерованных пункта.';
    const groqAdvice = await groqChat(promptText);
    if (groqAdvice) {
      res.json({ success: true, advice: groqAdvice.trim() });
    } else {
      const ai = getGeminiClient();
      if (ai) {
        const response = await ai.models.generateContent({ model: 'gemini-3.1-flash-lite', contents: promptText });
        res.json({ success: true, advice: (response.text || defaultAdvice[lang]).trim() });
      } else {
        res.json({ success: true, advice: defaultAdvice[lang] });
      }
    }
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
    const ctx = userFinancialContext ? 'Баланс: ' + (userFinancialContext.totalBalance || 0) + ', Доходы: ' + (userFinancialContext.income || 0) + ', Расходы: ' + (userFinancialContext.expense || 0) + '.' : '';
    const li: Record<string, string> = { uk: 'Відповідай УКРАЇНСЬКОЮ!', en: 'Respond in ENGLISH!', ru: 'Отвечай на РУССКОМ!' };
    const hist = (messages || []).map((m: any) => (m.sender === 'user' ? 'User' : 'Manager') + ': ' + m.text).join('\n\n');
    const prompt = 'Ты финансовый менеджер. ' + ctx + ' ' + li[lang] + ' История:\n' + hist + '\nОтвет:';
    const reply = await groqChat(prompt);
    if (reply) {
      res.json({ success: true, reply: reply.trim() });
    } else {
      const ai = getGeminiClient();
      if (ai) {
        const response = await ai.models.generateContent({ model: 'gemini-3.1-flash-lite', contents: prompt });
        res.json({ success: true, reply: (response.text || def[lang]).trim() });
      } else {
        res.json({ success: true, reply: def[lang] });
      }
    }
  } catch (error: any) {
    res.status(500).json({ error: error?.message, reply: 'Ошибка' });
  }
});

app.post('/api/ai/scan-receipt', async (req, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    if (!base64Image) return res.status(400).json({ error: 'base64Image required' });
    const ai = getGeminiClient();
    if (!ai) return res.status(500).json({ error: 'No AI available' });
    const promptText = 'Проанализируй кассовый чек. Извлеки JSON: {"type":"expense или income","amount":число,"currency":"UAH","category":"из food transport shopping home fun health services cash other","note":"название","date":"ISO"}. Только JSON.';
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
    const { images } = req.body;
    if (!Array.isArray(images) || images.length === 0) return res.status(400).json({ error: 'images required' });
    const promptText = 'Проанализируй скриншоты банков. Найди accounts и transactions в JSON.';
    const groqResult = await groqChatJson(promptText);
    if (groqResult && groqResult.transactions) {
      return res.json({ success: true, data: groqResult, source: 'groq' });
    }
    const ai = getGeminiClient();
    if (!ai) return res.status(500).json({ error: 'No AI available' });
    const imageParts = images.map((img: any) => ({ inlineData: { data: img.data, mimeType: img.mimeType || 'image/jpeg' } }));
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
    const { text, base64Pdf } = req.body;
    let extractedText = text || '';

    // If we got base64 PDF, extract text server-side using pdfjs-dist
    if (base64Pdf && (!extractedText || extractedText.trim().length < 20)) {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        const buf = Buffer.from(base64Pdf, 'base64');
        const data = new Uint8Array(buf);
        const pdf = await (pdfjsLib as any).getDocument({ data, useSystemFonts: true, isEvalSupported: false }).promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          extractedText += content.items.map((it: any) => it.str).join(' ') + '\n';
        }
        console.log('pdfjs-dist extracted', extractedText.length, 'chars');
      } catch (pdfErr) {
        console.error('pdfjs-dist extraction error:', pdfErr);
      }
    }

    // Step 1: Regex parsers
    if (extractedText && extractedText.trim().length > 20) {
      const regexResult = parseBankStatement(extractedText);
      if (regexResult.transactions.length > 0) {
        return res.json({
          success: true,
          data: { accounts: regexResult.accounts, transactions: regexResult.transactions },
          source: 'regex',
          bank: regexResult.bank,
        });
      }
    }

    // Step 2: Groq AI with extracted text
    if (extractedText && extractedText.trim().length > 20) {
      const promptText = 'Проанализируй текст банковской выписки. Извлеки JSON: {"accounts":[{"bank":"","name":"","ownBalance":0,"debt":0,"minPayment":0,"currency":"UAH"}],"transactions":[{"type":"expense или income","amount":0,"currency":"UAH","category":"из food transport shopping home fun health services cash salary freelance gift invest other","note":"","date":"ISO"}]} Текст:\n' + extractedText.substring(0, 8000);
      const groqResult = await groqChatJson(promptText);
      if (groqResult && (groqResult.transactions?.length > 0 || groqResult.accounts?.length > 0)) {
        return res.json({ success: true, data: groqResult, source: 'groq' });
      }
    }

    // Step 3: Gemini fallback with extracted text (not PDF)
    if (extractedText && extractedText.trim().length > 20) {
      const ai = getGeminiClient();
      if (ai) {
        try {
          const promptGemini = 'Проанализируй текст банковской выписки. Извлеки JSON: {"accounts":[{"bank":"","name":"","ownBalance":0,"debt":0,"minPayment":0,"currency":"UAH"}],"transactions":[{"type":"expense или income","amount":0,"currency":"UAH","category":"из food transport shopping home fun health services cash salary freelance gift invest other","note":"","date":"ISO"}]} Текст:\n' + extractedText.substring(0, 8000);
          const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: promptGemini,
            config: {
              responseMimeType: 'application/json',
              responseSchema: { type: Type.OBJECT, properties: { accounts: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { bank: { type: Type.STRING }, name: { type: Type.STRING }, ownBalance: { type: Type.NUMBER }, debt: { type: Type.NUMBER }, minPayment: { type: Type.NUMBER }, currency: { type: Type.STRING } } } }, transactions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, amount: { type: Type.NUMBER }, currency: { type: Type.STRING }, category: { type: Type.STRING }, note: { type: Type.STRING }, date: { type: Type.STRING } } } } } },
            },
          });
          const parsed = JSON.parse(response.text || '{"accounts":[],"transactions":[]}');
          if (parsed.transactions?.length > 0 || parsed.accounts?.length > 0) {
            return res.json({ success: true, data: parsed, source: 'gemini' });
          }
        } catch (e) {}
      }
    }

    res.json({ success: true, data: { accounts: [], transactions: [] }, source: 'empty', extractedTextLength: extractedText.length });
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
  } catch (error: any) {
    res.status(500).json({ error: error?.message });
  }
});

app.post('/api/sync/apple-wallet-shortcut', (req, res) => {
  try {
    const { amount, merchant, type, category, currency } = req.body;
    res.json({ success: true, transaction: { type: type || 'expense', amount: parseFloat(amount) || 0, currency: currency || 'UAH', category: category || 'shopping', note: merchant || 'Apple Pay', date: new Date().toISOString() }, message: 'Accepted' });
  } catch {
    res.status(400).json({ error: 'Invalid data' });
  }
});

export default app;
