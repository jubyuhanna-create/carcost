'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  formatCurrency,
  formatDate,
  getMonthlyTotal,
  getYearlyTotal,
  daysUntil,
  getReminderStatus,
  getReminderColor,
} from '@/lib/utils';
import { Car, Expense, Reminder, CATEGORY_LABELS, CATEGORY_ICONS, ExpenseCategory } from '@/types';

const CATEGORIES: ExpenseCategory[] = ['fuel', 'maintenance', 'repairs', 'other'];

export default function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [car, setCar] = useState<Car | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditReminder, setShowEditReminder] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: carData }, { data: expData }, { data: remData }] = await Promise.all([
      supabase.from('cars').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('expenses').select('*').eq('car_id', id).order('date', { ascending: false }),
      supabase.from('reminders').select('*').eq('car_id', id).single(),
    ]);

    if (!carData) { router.push('/dashboard'); return; }
    setCar(carData);
    setExpenses(expData || []);
    setReminder(remData);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleDeleteCar() {
    if (!confirm('Delete this car and all its expenses? This cannot be undone.')) return;
    const supabase = createClient();
    await supabase.from('expenses').delete().eq('car_id', id);
    await supabase.from('reminders').delete().eq('car_id', id);
    await supabase.from('cars').delete().eq('id', id);
    router.push('/dashboard');
    router.refresh();
  }

  async function handleDeleteExpense(expenseId: string) {
    const supabase = createClient();
    await supabase.from('expenses').delete().eq('id', expenseId);
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
    setDeleteConfirm(null);
  }

  const filtered = filterCategory === 'all'
    ? expenses
    : expenses.filter(e => e.category === filterCategory);

  const monthly = getMonthlyTotal(expenses);
  const yearly = getYearlyTotal(expenses);
  const insuranceDays = daysUntil(reminder?.insurance_date ?? null);
  const testDays = daysUntil(reminder?.test_date ?? null);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!car) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="w-9 h-9 rounded-xl bg-bg-surface border border-border flex items-center justify-center hover:border-accent/40 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-text-muted">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold text-text-primary">{car.name}</h1>
            <div className="flex items-center gap-2">
              {car.plate_number && (
                <span className="text-xs text-text-muted font-mono bg-bg-elevated px-2 py-0.5 rounded-md">
                  {car.plate_number}
                </span>
              )}
              {car.year && <span className="text-xs text-text-muted">{car.year}</span>}
            </div>
          </div>
        </div>
        <button
          onClick={handleDeleteCar}
          className="text-xs text-danger/70 hover:text-danger transition-colors px-2 py-1 rounded-lg hover:bg-danger/10"
        >
          Delete Car
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="This Month" value={formatCurrency(monthly)} icon="📅" accent />
        <StatCard label="This Year" value={formatCurrency(yearly)} icon="📊" />
      </div>

      {/* Reminders */}
      <div className="bg-bg-surface border border-border rounded-2xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span>⏰</span>
            <h2 className="font-display font-semibold text-sm text-text-primary">Reminders</h2>
          </div>
          <button
            onClick={() => setShowEditReminder(true)}
            className="text-xs text-accent hover:text-accent-hover transition-colors font-medium"
          >
            Edit
          </button>
        </div>

        {(insuranceDays !== null || testDays !== null) ? (
          <div className="grid grid-cols-1 gap-2">
            {insuranceDays !== null && (
              <ReminderRow label="🛡️ Insurance" days={insuranceDays} date={reminder?.insurance_date ?? null} />
            )}
            {testDays !== null && (
              <ReminderRow label="🔍 Vehicle Test (טסט)" days={testDays} date={reminder?.test_date ?? null} />
            )}
          </div>
        ) : (
          <button
            onClick={() => setShowEditReminder(true)}
            className="w-full text-center text-sm text-text-muted py-3 border border-dashed border-border rounded-xl hover:border-accent/40 hover:text-accent transition-colors"
          >
            + Set insurance & test dates
          </button>
        )}
      </div>

      {/* Expenses */}
      <div className="bg-bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span>💳</span>
            <h2 className="font-display font-semibold text-sm text-text-primary">
              Expenses ({expenses.length})
            </h2>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-lg transition-all"
          >
            + Add
          </button>
        </div>

        {/* Category Filter */}
        {expenses.length > 0 && (
          <div className="flex gap-2 p-3 border-b border-border overflow-x-auto scrollbar-hide">
            <FilterChip
              label="All"
              active={filterCategory === 'all'}
              onClick={() => setFilterCategory('all')}
            />
            {CATEGORIES.map(cat => (
              <FilterChip
                key={cat}
                label={`${CATEGORY_ICONS[cat]} ${CATEGORY_LABELS[cat]}`}
                active={filterCategory === cat}
                onClick={() => setFilterCategory(cat)}
              />
            ))}
          </div>
        )}

        {/* Expense List */}
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-text-muted text-sm">
              {expenses.length === 0 ? 'No expenses yet. Add your first one!' : 'No expenses in this category.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map(expense => (
              <ExpenseRow
                key={expense.id}
                expense={expense}
                onDelete={() => setDeleteConfirm(expense.id)}
                confirmDelete={deleteConfirm === expense.id}
                onCancelDelete={() => setDeleteConfirm(null)}
                onConfirmDelete={() => handleDeleteExpense(expense.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <AddExpenseModal
          carId={id}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}

      {/* Edit Reminder Modal */}
      {showEditReminder && (
        <EditReminderModal
          carId={id}
          reminder={reminder}
          onClose={() => setShowEditReminder(false)}
          onSuccess={() => {
            setShowEditReminder(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, accent }: { label: string; value: string; icon: string; accent?: boolean }) {
  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-base">{icon}</span>
        <span className="text-xs text-text-muted uppercase tracking-wider font-medium">{label}</span>
      </div>
      <p className={`font-display text-xl font-bold ${accent ? 'text-accent' : 'text-blue-400'}`}>{value}</p>
    </div>
  );
}

function ReminderRow({ label, days, date }: { label: string; days: number; date: string | null }) {
  const status = getReminderStatus(days);
  const colorClass = getReminderColor(status);
  const text = days < 0
    ? `Expired ${Math.abs(days)} days ago`
    : days === 0
    ? 'Expires today!'
    : `In ${days} days`;

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-muted">{label}</span>
      <div className="flex items-center gap-2">
        {date && <span className="text-xs text-text-faint">{formatDate(date)}</span>}
        <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${colorClass}`}>
          {text}
        </span>
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
        active
          ? 'bg-accent text-white'
          : 'bg-bg-elevated text-text-muted hover:text-text-primary border border-border'
      }`}
    >
      {label}
    </button>
  );
}

const CATEGORY_COLOR_MAP: Record<string, string> = {
  fuel: 'text-blue-400 bg-blue-400/10',
  maintenance: 'text-purple-400 bg-purple-400/10',
  repairs: 'text-orange-400 bg-orange-400/10',
  other: 'text-slate-400 bg-slate-400/10',
};

function ExpenseRow({
  expense,
  onDelete,
  confirmDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  expense: Expense;
  onDelete: () => void;
  confirmDelete: boolean;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-bg-elevated/50 transition-colors">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${CATEGORY_COLOR_MAP[expense.category]}`}>
        {CATEGORY_ICONS[expense.category as ExpenseCategory]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary capitalize">{CATEGORY_LABELS[expense.category as ExpenseCategory]}</span>
          {expense.notes && (
            <span className="text-xs text-text-muted truncate">· {expense.notes}</span>
          )}
        </div>
        <p className="text-xs text-text-muted">{formatDate(expense.date)}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-semibold text-text-primary text-sm">{formatCurrency(expense.amount)}</span>
        {confirmDelete ? (
          <div className="flex gap-1">
            <button
              onClick={onConfirmDelete}
              className="text-xs text-danger bg-danger/10 px-2 py-1 rounded-lg hover:bg-danger/20 transition-colors"
            >
              Delete
            </button>
            <button
              onClick={onCancelDelete}
              className="text-xs text-text-muted px-2 py-1 rounded-lg hover:bg-bg-elevated transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={onDelete}
            className="text-text-faint hover:text-danger transition-colors p-1 rounded-lg hover:bg-danger/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function AddExpenseModal({ carId, onClose, onSuccess }: { carId: string; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    amount: '',
    category: 'fuel' as ExpenseCategory,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase.from('expenses').insert({
      car_id: carId,
      user_id: user.id,
      amount: parseFloat(form.amount),
      category: form.category,
      date: form.date,
      notes: form.notes.trim() || null,
    });

    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <Modal title="Add Expense" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Amount (₪) *</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
            placeholder="0.00"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Category</label>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm(p => ({ ...p, category: cat }))}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  form.category === cat
                    ? 'border-accent bg-accent/15 text-accent'
                    : 'border-border bg-bg-elevated text-text-muted hover:border-accent/40'
                }`}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Date</label>
          <input
            type="date"
            value={form.date}
            onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">Notes (Optional)</label>
          <input
            type="text"
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="e.g. Full tank, Shell station"
          />
        </div>

        {error && (
          <div className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl p-3">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-bg-elevated text-text-muted rounded-xl text-sm font-medium hover:text-text-primary transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-accent-glow"
          >
            {loading ? 'Saving…' : 'Add Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditReminderModal({
  carId,
  reminder,
  onClose,
  onSuccess,
}: {
  carId: string;
  reminder: Reminder | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    insurance_date: reminder?.insurance_date?.split('T')[0] ?? '',
    test_date: reminder?.test_date?.split('T')[0] ?? '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();

    if (reminder) {
      await supabase.from('reminders').update({
        insurance_date: form.insurance_date || null,
        test_date: form.test_date || null,
      }).eq('id', reminder.id);
    } else {
      await supabase.from('reminders').insert({
        car_id: carId,
        insurance_date: form.insurance_date || null,
        test_date: form.test_date || null,
      });
    }
    onSuccess();
  }

  return (
    <Modal title="Edit Reminders" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">🛡️ Insurance Expiry</label>
          <input
            type="date"
            value={form.insurance_date}
            onChange={e => setForm(p => ({ ...p, insurance_date: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">🔍 Vehicle Test (טסט)</label>
          <input
            type="date"
            value={form.test_date}
            onChange={e => setForm(p => ({ ...p, test_date: e.target.value }))}
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-3 bg-bg-elevated text-text-muted rounded-xl text-sm font-medium hover:text-text-primary transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all shadow-accent-glow"
          >
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-bg-surface border border-border rounded-2xl shadow-modal animate-slide-up">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-semibold text-text-primary">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-bg-elevated text-text-muted transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
