'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useVehicleLookup } from '@/lib/useVehicleLookup';

const FUEL_TYPE_LABELS: Record<string, string> = {
  'בנזין': 'Petrol ⛽',
  'דיזל': 'Diesel 🛢️',
  'חשמל': 'Electric ⚡',
  'היברידי': 'Hybrid 🔋',
  'גז': 'LPG 💨',
};

function formatFuelType(fuel: string | undefined) {
  if (!fuel) return '';
  return FUEL_TYPE_LABELS[fuel] ?? fuel;
}

export default function NewCarPage() {
  const router = useRouter();
  const { vehicle, loading: lookupLoading, error: lookupError, lookup, reset } = useVehicleLookup();

  const [form, setForm] = useState({
    name: '',
    plate_number: '',
    year: '',
    insurance_date: '',
    test_date: '',
  });
  const [plateInput, setPlateInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lookupDone, setLookupDone] = useState(false);
  const plateRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handlePlateLookup() {
    if (!plateInput.trim()) return;
    setLookupDone(false);
    await lookup(plateInput);
    setLookupDone(true);
  }

  function applyVehicleData() {
    if (!vehicle) return;
    const suggestedName = [vehicle.manufacturer, vehicle.model]
      .filter(Boolean).join(' ') || '';

    setForm(prev => ({
      ...prev,
      name: prev.name || suggestedName,
      plate_number: vehicle.plate_number || prev.plate_number,
      year: vehicle.year ? String(vehicle.year) : prev.year,
      test_date: vehicle.next_test_date
        ? vehicle.next_test_date.split('T')[0]
        : prev.test_date,
    }));
  }

  function handlePlateInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPlateInput(e.target.value);
    if (lookupDone) {
      reset();
      setLookupDone(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Car name is required');
      return;
    }
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    const { data: car, error: carError } = await supabase
      .from('cars')
      .insert({
        user_id: user.id,
        name: form.name.trim(),
        plate_number: form.plate_number.trim() || null,
        year: form.year ? parseInt(form.year) : null,
      })
      .select()
      .single();

    if (carError) {
      setError(carError.message);
      setLoading(false);
      return;
    }

    if (form.insurance_date || form.test_date) {
      await supabase.from('reminders').insert({
        car_id: car.id,
        insurance_date: form.insurance_date || null,
        test_date: form.test_date || null,
      });
    }

    router.push(`/cars/${car.id}`);
    router.refresh();
  }

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 35 }, (_, i) => currentYear - i);

  return (
    <div className="max-w-lg mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard"
          className="w-9 h-9 rounded-xl bg-bg-surface border border-border flex items-center justify-center hover:border-accent/40 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-text-muted">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary">Add a Car</h1>
          <p className="text-text-muted text-sm">Track a new vehicle</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Plate Lookup Section */}
        <div className="bg-bg-surface border border-border rounded-2xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🔍</span>
            <h2 className="font-display font-semibold text-text-primary text-sm">Lookup by Plate Number</h2>
          </div>
          <p className="text-text-muted text-xs mb-3">
            Enter your Israeli plate number to auto-fill vehicle details from the government registry.
          </p>

          <div className="flex gap-2">
            <input
              ref={plateRef}
              type="text"
              value={plateInput}
              onChange={handlePlateInputChange}
              onKeyDown={e => e.key === 'Enter' && handlePlateLookup()}
              placeholder="e.g. 12-345-67"
              maxLength={10}
              style={{ fontFamily: 'monospace', letterSpacing: '0.1em', textAlign: 'center' }}
              className="flex-1 bg-bg-elevated border border-border rounded-xl px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/60"
              dir="ltr"
            />
            <button
              type="button"
              onClick={handlePlateLookup}
              disabled={lookupLoading || !plateInput.trim()}
              className="px-4 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm shadow-accent-glow whitespace-nowrap"
            >
              {lookupLoading ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Searching…
                </span>
              ) : 'Search'}
            </button>
          </div>

          {/* Lookup Error */}
          {lookupError && lookupDone && (
            <div className="mt-3 text-danger text-xs bg-danger/10 border border-danger/20 rounded-xl p-3 flex items-center gap-2">
              <span>❌</span>
              <span>{lookupError === 'Vehicle not found'
                ? 'No vehicle found with this plate number. Please fill in details manually.'
                : lookupError}</span>
            </div>
          )}

          {/* Vehicle Result Card */}
          {vehicle && lookupDone && (
            <div className="mt-3 bg-success/5 border border-success/20 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-success text-sm">✅</span>
                  <span className="text-success text-xs font-semibold">Vehicle Found</span>
                </div>
                <span style={{ fontFamily: 'monospace' }} className="text-xs bg-bg-elevated border border-border rounded-lg px-2 py-0.5 text-text-muted">
                  {vehicle.plate_number}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mb-3">
                {vehicle.manufacturer && <InfoRow label="Make" value={vehicle.manufacturer} />}
                {vehicle.model && <InfoRow label="Model" value={vehicle.model} />}
                {vehicle.year && <InfoRow label="Year" value={String(vehicle.year)} />}
                {vehicle.color && <InfoRow label="Color" value={vehicle.color} />}
                {vehicle.fuel_type && <InfoRow label="Fuel" value={formatFuelType(vehicle.fuel_type)} />}
                {vehicle.engine_volume && <InfoRow label="Engine" value={`${vehicle.engine_volume}cc`} />}
                {vehicle.next_test_date && <InfoRow label="Last Test" value={vehicle.next_test_date.split('T')[0]} />}
              </div>

              <button
                type="button"
                onClick={applyVehicleData}
                className="w-full py-2 px-3 bg-success/10 hover:bg-success/20 border border-success/20 text-success text-xs font-semibold rounded-lg transition-all"
              >
                ✨ Auto-fill Form with This Vehicle
              </button>
            </div>
          )}
        </div>

        {/* Car Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Vehicle Info" icon="🚗">
            <FormField label="Car Name *">
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Toyota Corolla"
                required
              />
            </FormField>

            <FormField label="License Plate">
              <input
                name="plate_number"
                type="text"
                value={form.plate_number}
                onChange={handleChange}
                placeholder="e.g. 12-345-67"
                dir="ltr"
                style={{ fontFamily: 'monospace', letterSpacing: '0.1em', textAlign: 'center' }}
              />
            </FormField>

            <FormField label="Year">
              <select name="year" value={form.year} onChange={handleChange}>
                <option value="">Select year</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </FormField>
          </Section>

          <Section title="Reminders" icon="⏰">
            <p className="text-text-muted text-xs mb-3">
              Set expiry dates to get countdown reminders on your dashboard.
            </p>
            <FormField label="Insurance Expiry Date">
              <input
                name="insurance_date"
                type="date"
                value={form.insurance_date}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Vehicle Test (טסט) Date">
              <input
                name="test_date"
                type="date"
                value={form.test_date}
                onChange={handleChange}
              />
            </FormField>
          </Section>

          {error && (
            <div className="text-danger text-sm bg-danger/10 border border-danger/20 rounded-xl p-3">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="flex-1 py-3 px-4 bg-bg-surface border border-border hover:border-accent/40 text-text-muted hover:text-text-primary font-medium rounded-xl transition-all text-sm text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm shadow-accent-glow"
            >
              {loading ? 'Saving…' : 'Add Car'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-text-muted">{label}: </span>
      <span className="text-text-primary font-medium">{value}</span>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-bg-surface border border-border rounded-2xl p-4 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">{icon}</span>
        <h2 className="font-display font-semibold text-text-primary text-sm">{title}</h2>
      </div>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-text-muted mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {children}
    </div>
  );
}
