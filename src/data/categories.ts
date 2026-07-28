import { Category, CustomCategories } from '../types';

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  { id: 'food', name: 'Еда и продукты', icon: 'Utensils', color: 'bg-amber-500' },
  { id: 'transport', name: 'Транспорт и такси', icon: 'Car', color: 'bg-blue-500' },
  { id: 'shopping', name: 'Покупки и одежда', icon: 'ShoppingBag', color: 'bg-purple-500' },
  { id: 'home', name: 'Жилье и ЖКХ', icon: 'Home', color: 'bg-indigo-500' },
  { id: 'fun', name: 'Развлечения и отдых', icon: 'Gamepad2', color: 'bg-pink-500' },
  { id: 'health', name: 'Здоровье и аптеки', icon: 'HeartPulse', color: 'bg-rose-500' },
  { id: 'services', name: 'Связь и интернет', icon: 'Smartphone', color: 'bg-teal-500' },
  { id: 'cash', name: 'Наличные', icon: 'Wallet', color: 'bg-yellow-500' },
  { id: 'other', name: 'Другое', icon: 'MoreHorizontal', color: 'bg-slate-500' },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Зарплата', icon: 'Banknote', color: 'bg-emerald-500' },
  { id: 'freelance', name: 'Фриланс / Проекты', icon: 'Laptop', color: 'bg-teal-500' },
  { id: 'gift', name: 'Подарки', icon: 'Gift', color: 'bg-amber-500' },
  { id: 'invest', name: 'Инвестиции и проценты', icon: 'TrendingUp', color: 'bg-blue-600' },
  { id: 'cash', name: 'Наличные', icon: 'Wallet', color: 'bg-yellow-500' },
  { id: 'other', name: 'Другой доход', icon: 'PlusCircle', color: 'bg-slate-500' },
];

export const INITIAL_CUSTOM_CATEGORIES: CustomCategories = {
  expense: [],
  income: [],
};

export const AVAILABLE_ICONS = [
  { name: 'Dog', label: 'Питомцы' },
  { name: 'Baby', label: 'Дети' },
  { name: 'Dumbbell', label: 'Спорт' },
  { name: 'BookOpen', label: 'Обучение' },
  { name: 'Plane', label: 'Путешествия' },
  { name: 'Wrench', label: 'Ремонт' },
  { name: 'Briefcase', label: 'Бизнес' },
  { name: 'GraduationCap', label: 'Курсы' },
  { name: 'Shirt', label: 'Одежда' },
  { name: 'Coffee', label: 'Кафе' },
  { name: 'Fuel', label: 'Топливо' },
  { name: 'Gift', label: 'Подарок' },
  { name: 'Wallet', label: 'Кошелек' },
];

export const AVAILABLE_COLORS = [
  'bg-red-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-yellow-500',
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-blue-500',
  'bg-indigo-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-rose-500',
  'bg-slate-500',
];
