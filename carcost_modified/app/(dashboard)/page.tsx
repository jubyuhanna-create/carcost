'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Car, Expense, Reminder } from '@/types';
import {
  formatCurrency,
  getMonthlyTotal,
  getYearlyTotal,
  daysUntil,
  getReminderStatus,
  getReminderColor,
  getCurrentMonth,
} from '@/lib/utils';

interface CarData {
  car: Car;
  expenses: Expense[];
  reminder?: Reminder;
}

export default function DashboardPage() {
  const [carData, setCarData] = useState<CarData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMonthly, setTotalMonthly] = useState(0);
  const [totalYearly, setTotalYearly] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: cars }, { data: expenses }, { data: reminders }] = await Promise.all([
      supabase.from('cars').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('expenses').select('*').eq('user_id', user.id),
      supabase.from('reminders').select('*'),
    ]);

    const data: CarData[] = (cars || []).map(car => {
      const carExpenses = (expenses || []).filter(e => e.car_id === car.id);
      const reminder = (reminders || []).find(r => r.car_id === car.id);
      return { car, expenses: carExpenses, reminder };
    });

    const allExpenses = expenses || [];
    setTotalMonthly(allExpenses.reduce((s, e) => {
      const d = new Date(e.date);
      const n = new Date();
      return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear()
        ? s + e.amount : s;
    }, 0));
    setTotalYearly(allExpenses.reduce((s, e) => {
      return new Date(e.date).getFullYear() === new Date().getFullYear() ? s + e.amount : s;
    }, 0));

    setCarData(data);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-muted text-sm">{getCurrentMonth()}</p>
        </div>
        <Link
          href="/cars/new"
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl transition-all shadow-accent-glow"
        >
          <span>+</span>
          <span>Add Car</span>
        </Link>
      </div>

      {/* Summary Cards */}
      {carData.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            label="This Month"
            value={formatCurrency(totalMonthly)}
            icon="📅"
            color="text-accent"
          />
          <SummaryCard
            label="This Year"
            value={formatCurrency(totalYearly)}
            icon="📊"
            color="text-blue-400"
          />
        </div>
      )}

      {/* Cars List */}
      {carData.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {carData.map(({ car, expenses, reminder }, i) => (
            <CarCard
              key={car.id}
              car={car}
              expenses={expenses}
              reminder={reminder}
              delay={i * 50}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-xs text-text-muted font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`font-display text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function CarCard({
  car,
  expenses,
  reminder,
  delay,
}: {
  car: Car;
  expenses: Expense[];
  reminder?: Reminder;
  delay: number;
}) {
  const monthly = getMonthlyTotal(expenses);
  const yearly = getYearlyTotal(expenses);
  const insuranceDays = daysUntil(reminder?.insurance_date ?? null);
  const testDays = daysUntil(reminder?.test_date ?? null);
  const recent = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <Link
      href={`/cars/${car.id}`}
      className="block bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-card hover:border-accent/40 transition-all duration-200 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-4">
        {/* Car Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-xl">
              🚗
            </div>
            <div>
              <h3 className="font-display font-semibold text-text-primary">{car.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {car.plate_number && (
                  <span className="text-xs text-text-muted bg-bg-elevated px-2 py-0.5 rounded-md font-mono">
                    {car.plate_number}
                  </span>
                )}
                {car.year && (
                  <span className="text-xs text-text-muted">{car.year}</span>
                )}
              </div>
            </div>
          </div>
          <ChevronRight />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <StatPill label="This month" value={formatCurrency(monthly)} />
          <StatPill label="This year" value={formatCurrency(yearly)} />
        </div>

        {/* Reminders */}
        {(insuranceDays !== null || testDays !== null) && (
          <div className="flex flex-wrap gap-2 mb-3">
            {insuranceDays !== null && (
              <ReminderBadge
                label="Insurance"
                days={insuranceDays}
              />
            )}
            {testDays !== null && (
              <ReminderBadge
                label="Test"
                days={testDays}
              />
            )}
          </div>
        )}

        {/* Recent Expenses */}
        {recent.length > 0 && (
          <div className="border-t border-border/60 pt-3 space-y-2">
            {recent.map(exp => (
              <div key={exp.id} className="flex items-center justify-between text-sm">
                <span className="text-text-muted">
                  <CategoryDot category={exp.category} />
                  {exp.category.charAt(0).toUpperCase() + exp.category.slice(1)}
                </span>
                <span className="text-text-primary font-medium">{formatCurrency(exp.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-bg-elevated rounded-xl px-3 py-2">
      <p className="text-xs text-text-muted mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-text-primary">{value}</p>
    </div>
  );
}

function ReminderBadge({ label, days }: { label: string; days: number }) {
  const status = getReminderStatus(days);
  const colorClass = getReminderColor(status);

  const text = days < 0
    ? `${label} expired ${Math.abs(days)}d ago`
    : days === 0
    ? `${label} expires today!`
    : `${label} in ${days}d`;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${colorClass}`}>
      <span>⏰</span>
      {text}
    </span>
  );
}

function CategoryDot({ category }: { category: string }) {
  const colors: Record<string, string> = {
    fuel: 'bg-blue-500',
    maintenance: 'bg-purple-500',
    repairs: 'bg-orange-500',
    other: 'bg-slate-500',
  };
  return (
    <span className={`inline-block w-1.5 h-1.5 rounded-full ${colors[category] ?? 'bg-slate-500'} mr-1.5 mb-0.5`} />
  );
}

function ChevronRight() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-text-faint flex-shrink-0">
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16 animate-fade-in">
      <div className="text-5xl mb-4">🚗</div>
      <h2 className="font-display text-lg font-semibold text-text-primary mb-2">No cars yet</h2>
      <p className="text-text-muted text-sm mb-6">Add your first car to start tracking expenses</p>
      <Link
        href="/cars/new"
        className="inline-flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all shadow-accent-glow"
      >
        + Add Your First Car
      </Link>
    </div>
  );
}
