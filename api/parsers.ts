interface ParsedAccount {
  bank: string;
  name: string;
  ownBalance: number;
  debt: number;
  minPayment: number;
  currency: string;
}

interface ParsedTransaction {
  type: 'expense' | 'income';
  amount: number;
  currency: string;
  category: string;
  note: string;
  date: string;
}

interface ParseResult {
  accounts: ParsedAccount[];
  transactions: ParsedTransaction[];
  bank: string | null;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  food: ['атб', 'сільпо', 'фора', 'екомаркет', 'нова пошта', 'маркет', 'супермаркет', 'магазин', 'продукт', 'їжа', 'молоко', 'хліб', 'овоч', 'фрукт', 'кафе', 'ресторан', 'фастфуд', 'макдональдс', 'kfc', 'STARBUCKS', 'coffee', 'pizza', 'puzata', 'хата', 'суші', 'bar', 'піцерія'],
  transport: ['укрзалізниця', 'метро', 'автобус', 'таксі', 'bolt', 'uber', 'бензин', 'АЗС', 'окко', 'wog', 'parallel', 'парковка', 'parking', 'uber', 'bolt', 'uber'],
  shopping: ['allo', 'фокстрот', 'comfy', 'rome', 'citrus', 'златі', 'ek.ua', 'prom.ua', 'rozetka', 'wildberries', 'ozon', 'amazon', 'aliexpress', 'закуп'],
  home: ['квартплата', 'жек', 'комунальні', 'водоканал', 'енергія', 'газ', '电信', 'інтернет', 'k-y-v', 'kyivstar', 'vodafone', 'lifecell', 'оше'],
  fun: ['кіно', 'театр', 'концерт', 'стадіон', 'спорт', 'фітнес', 'gym', 'басейн', 'квест', 'netflix', 'spotify', 'мюзикл', 'шопінг'],
  health: ['аптека', 'лікарня', 'клініка', 'лікар', 'стоматолог', 'optic', 'health', 'pharmacy', 'мед', 'аналіз', 'здоров'],
  services: ['пошта', 'нова пошта', 'meest', 'ukrposhta', 'сервіс', 'ремонт', 'перукар', ' salon', 'хімчистка', 'pronto', 'clean'],
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
  const isNeg = cleaned.includes('-') || s.includes('−');
  cleaned = cleaned.replace(/[-−]/g, '');
  if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/\.(?=\d{3})/g, '').replace(',', '.');
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : (isNeg ? -num : num);
}

function parseDate(s: string): string {
  const m = s.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})/);
  if (!m) {
    const m2 = s.match(/(\d{1,2})\s+(янв|фев|мар|апр|мая|июн|июл|авг|сен|окт|ноя|дек|січ|лют|бер|кві|трав|чер|лип|сер|вер|жов|лист|груд)/i);
    if (m2) {
      const months: Record<string, string> = {
        'янв': '01', 'фев': '02', 'мар': '03', 'апр': '04', 'мая': '05', 'июн': '06', 'июл': '07', 'авг': '08', 'сен': '09', 'окт': '10', 'ноя': '11', 'дек': '12',
        'січ': '01', 'лют': '02', 'бер': '03', 'кві': '04', 'трав': '05', 'чер': '06', 'лип': '07', 'сер': '08', 'вер': '09', 'жов': '10', 'лист': '11', 'груд': '12',
      };
      const month = months[m2[1].toLowerCase()] || '01';
      const day = m2[1].length <= 2 ? m2[1].padStart(2, '0') : '01';
      return `2026-${month}-${day}`;
    }
    return new Date().toISOString().slice(0, 10);
  }
  let year = m[3];
  if (year.length === 2) year = '20' + year;
  return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

function parseMonobank(text: string): ParseResult | null {
  if (!/mono|monobank|мнобанк|black\s*\(\*|white\s*\(\*|е?підтримк/i.test(text)) return null;

  const accounts: ParsedAccount[] = [];
  const transactions: ParsedTransaction[] = [];

  const balMatch = text.match(/(?:баланс|залишок|останній)[\s:]*(?:UAH|₴|грн)?\s*([\d\s,.\-]+)/i);
  if (balMatch) {
    const bal = parseUAHAmount(balMatch[1]);
    accounts.push({
      bank: 'Monobank',
      name: 'Monobank',
      ownBalance: bal >= 0 ? bal : 0,
      debt: bal < 0 ? Math.abs(bal) : 0,
      minPayment: bal < 0 ? Math.round(Math.abs(bal) * 0.05 * 100) / 100 : 0,
      currency: 'UAH',
    });
  } else {
    accounts.push({ bank: 'Monobank', name: 'Monobank', ownBalance: 0, debt: 0, minPayment: 0, currency: 'UAH' });
  }

  const txPattern = /(\d{1,2}[.\-/]\d{1,2}[.\-/]?\d{0,4})\s+([^\n]{2,60}?)\s+([+-])\s*([\d\s,.\-]+?)\s*(?:UAH|₴|грн|$)/gim;
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
    const simplePattern = /(\d{1,2})[.\-/](\d{1,2})\s+([^\n]{3,60}?)\s+([\d\s,.\-]+?)\s*(?:UAH|₴|грн)/gim;
    while ((match = simplePattern.exec(text)) !== null) {
      const date = `2026-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      const note = match[3].trim();
      const amount = Math.abs(parseUAHAmount(match[4]));
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

  return { accounts, transactions, bank: 'Monobank' };
}

function parsePrivatBank(text: string): ParseResult | null {
  if (!/приват|privat|приватбанк|privatbank|4149|5168/i.test(text)) return null;

  const accounts: ParsedAccount[] = [];
  const transactions: ParsedTransaction[] = [];

  const balMatch = text.match(/(?:баланс|залишок)[\s:]*(?:грн|UAH|₴)?\s*([\d\s,.\-]+)/i);
  if (balMatch) {
    const bal = parseUAHAmount(balMatch[1]);
    accounts.push({ bank: 'PrivatBank', name: 'ПриватБанк', ownBalance: bal >= 0 ? bal : 0, debt: bal < 0 ? Math.abs(bal) : 0, minPayment: bal < 0 ? Math.round(Math.abs(bal) * 0.05 * 100) / 100 : 0, currency: 'UAH' });
  } else {
    accounts.push({ bank: 'PrivatBank', name: 'ПриватБанк', ownBalance: 0, debt: 0, minPayment: 0, currency: 'UAH' });
  }

  const txPattern = /(\d{1,2}[.\-/]\d{1,2}[.\-/]?\d{0,4})\s+([^\n]{2,60}?)\s+([+-])?\s*([\d\s,.\-]+?)\s*(?:грн|UAH|₴|$)/gim;
  let match;
  while ((match = txPattern.exec(text)) !== null) {
    const date = parseDate(match[1]);
    const note = match[2].trim();
    const sign = match[3] || '';
    const amount = Math.abs(parseUAHAmount(match[4]));
    if (amount <= 0 || amount > 10000000) continue;
    const isIncome = sign === '+' || /надходж|зарплат|переказ|кешбек|повернення|поповнення/i.test(note);
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
    const simplePattern = /(\d{1,2}[.\-/]\d{1,2})\s+([^\n]{3,60}?)\s+([\d\s,.\-]+?)\s*(?:грн|UAH)/gim;
    while ((match = simplePattern.exec(text)) !== null) {
      const date = `2026-${match[1].slice(3, 5) || '01'}-${match[1].slice(0, 2).padStart(2, '0')}`;
      const note = match[2].trim();
      const amount = Math.abs(parseUAHAmount(match[3]));
      if (amount <= 0) continue;
      transactions.push({
        type: /надходж|зарплат|переказ|\+/i.test(note) ? 'income' : 'expense',
        amount,
        currency: 'UAH',
        category: guessCategory(note),
        note,
        date,
      });
    }
  }

  return { accounts, transactions, bank: 'PrivatBank' };
}

function parseABank(text: string): ParseResult | null {
  if (!/а-?банк|a-?bank|абанк/i.test(text)) return null;

  const accounts: ParsedAccount[] = [];
  const transactions: ParsedTransaction[] = [];

  const balMatch = text.match(/(?:баланс|залишок)[\s:]*(?:грн|UAH|₴)?\s*([\d\s,.\-]+)/i);
  if (balMatch) {
    const bal = parseUAHAmount(balMatch[1]);
    accounts.push({ bank: 'А-Банк', name: 'А-Банк', ownBalance: bal >= 0 ? bal : 0, debt: bal < 0 ? Math.abs(bal) : 0, minPayment: bal < 0 ? Math.round(Math.abs(bal) * 0.05 * 100) / 100 : 0, currency: 'UAH' });
  } else {
    accounts.push({ bank: 'А-Банк', name: 'А-Банк', ownBalance: 0, debt: 0, minPayment: 0, currency: 'UAH' });
  }

  const txPattern = /(\d{1,2}[.\-/]\d{1,2}[.\-/]?\d{0,4})\s+([^\n]{2,60}?)\s+([+-])?\s*([\d\s,.\-]+?)\s*(?:грн|UAH|₴|$)/gim;
  let match;
  while ((match = txPattern.exec(text)) !== null) {
    const date = parseDate(match[1]);
    const note = match[2].trim();
    const sign = match[3] || '';
    const amount = Math.abs(parseUAHAmount(match[4]));
    if (amount <= 0 || amount > 10000000) continue;
    const isIncome = sign === '+' || /надходж|зарплат|переказ|кешбек|повернення|поповнення/i.test(note);
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
    const simplePattern = /(\d{1,2}[.\-/]\d{1,2})\s+([^\n]{3,60}?)\s+([\d\s,.\-]+?)\s*(?:грн|UAH)/gim;
    while ((match = simplePattern.exec(text)) !== null) {
      const date = `2026-${match[1].slice(3, 5) || '01'}-${match[1].slice(0, 2).padStart(2, '0')}`;
      const note = match[2].trim();
      const amount = Math.abs(parseUAHAmount(match[3]));
      if (amount <= 0) continue;
      transactions.push({
        type: /надходж|зарплат|переказ|\+/i.test(note) ? 'income' : 'expense',
        amount,
        currency: 'UAH',
        category: guessCategory(note),
        note,
        date,
      });
    }
  }

  return { accounts, transactions, bank: 'А-Банк' };
}

function parseGeneric(text: string): ParseResult | null {
  const transactions: ParsedTransaction[] = [];

  const txPattern = /(\d{1,2}[.\-/]\d{1,2}[.\-/]?\d{0,4})\s+([^\n]{2,80}?)\s+([+-])?\s*([\d\s,.\-]+?)\s*(?:грн|UAH|₴|usd|\$|eur|€|$)/gim;
  let match;
  let currency = 'UAH';
  if (/\$\s|usd/i.test(text)) currency = 'USD';
  if (/€\s|eur/i.test(text)) currency = 'EUR';

  while ((match = txPattern.exec(text)) !== null) {
    const date = parseDate(match[1]);
    const note = match[2].trim();
    const sign = match[3] || '';
    const amount = Math.abs(parseUAHAmount(match[4]));
    if (amount <= 0 || amount > 10000000) continue;
    const isIncome = sign === '+' || /надходж|зарплат|переказ|кешбек|повернення|поповнення|salary|credit|deposit/i.test(note);
    transactions.push({
      type: isIncome ? 'income' : 'expense',
      amount,
      currency,
      category: isIncome ? 'salary' : guessCategory(note),
      note,
      date,
    });
  }

  if (transactions.length === 0) return null;

  return {
    accounts: [{ bank: 'Банк', name: 'Выписка', ownBalance: 0, debt: 0, minPayment: 0, currency }],
    transactions,
    bank: null,
  };
}

export function parseBankStatement(text: string): ParseResult {
  if (!text || text.trim().length < 20) {
    return { accounts: [], transactions: [], bank: null };
  }

  const parsers = [parseMonobank, parsePrivatBank, parseABank, parseGeneric];
  for (const parser of parsers) {
    const result = parser(text);
    if (result && result.transactions.length > 0) {
      return result;
    }
  }

  return { accounts: [], transactions: [], bank: null };
}
