export type Currency = 'UAH' | 'USD';

export type Period = 'day' | 'week' | 'month' | 'year' | 'all';

export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyLimit?: number;
}

export interface BankAccount {
  id: string;
  bank: string;
  name: string;
  ownBalance: number;
  debt: number;
  minPayment?: number;
  currency?: Currency;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  currency: Currency;
  category: string;
  note: string;
  date: string; // ISO string
}

export interface CustomCategories {
  expense: Category[];
  income: Category[];
}

export interface UserProfile {
  email?: string;
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  isLoggedIn: boolean;
  isCloudSynced: boolean;
}
