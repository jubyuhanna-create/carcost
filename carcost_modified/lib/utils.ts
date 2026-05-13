import { format, differenceInDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { Expense } from '@/types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'dd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  try {
    const target = parseISO(dateStr);
    return differenceInDays(target, new Date());
  } catch {
    return null;
  }
}

export function getReminderStatus(days: number | null): 'expired' | 'urgent' | 'soon' | 'ok' | null {
  if (days === null) return null;
  if (days < 0) return 'expired';
  if (days <= 14) return 'urgent';
  if (days <= 30) return 'soon';
  return 'ok';
}

export function getReminderColor(status: ReturnType<typeof getReminderStatus>): string {
  switch (status) {
    case 'expired': return 'text-danger bg-danger/10 border-danger/20';
    case 'urgent': return 'text-warning bg-warning/10 border-warning/20';
    case 'soon': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'ok': return 'text-success bg-success/10 border-success/20';
    default: return 'text-text-muted bg-bg-elevated border-border';
  }
}

export function getMonthlyTotal(expenses: Expense[]): number {
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);
  return expenses
    .filter(e => {
      const d = parseISO(e.date);
      return d >= start && d <= end;
    })
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getYearlyTotal(expenses: Expense[]): number {
  const year = new Date().getFullYear();
  return expenses
    .filter(e => new Date(e.date).getFullYear() === year)
    .reduce((sum, e) => sum + e.amount, 0);
}

export function getCurrentMonth(): string {
  return format(new Date(), 'MMMM yyyy');
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
