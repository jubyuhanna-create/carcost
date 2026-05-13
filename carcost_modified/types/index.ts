export interface Car {
  id: string;
  user_id: string;
  name: string;
  plate_number: string | null;
  year: number | null;
  created_at: string;
}

export interface Expense {
  id: string;
  car_id: string;
  user_id: string;
  amount: number;
  category: 'fuel' | 'maintenance' | 'repairs' | 'other';
  date: string;
  notes: string | null;
  created_at: string;
}

export interface Reminder {
  id: string;
  car_id: string;
  insurance_date: string | null;
  test_date: string | null;
  updated_at: string;
}

export interface CarWithStats extends Car {
  monthlyTotal: number;
  yearlyTotal: number;
  reminder?: Reminder;
  recentExpenses?: Expense[];
}

export type ExpenseCategory = 'fuel' | 'maintenance' | 'repairs' | 'other';

export const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  fuel: 'Fuel',
  maintenance: 'Maintenance',
  repairs: 'Repairs',
  other: 'Other',
};

export const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  fuel: '#3b82f6',
  maintenance: '#a855f7',
  repairs: '#f97316',
  other: '#64748b',
};

export const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  fuel: '⛽',
  maintenance: '🔧',
  repairs: '🛠️',
  other: '📋',
};
