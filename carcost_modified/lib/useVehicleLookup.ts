import { useState, useCallback } from 'react';

export interface VehicleInfo {
  plate_number: string;
  manufacturer?: string;
  model?: string;
  year?: number;
  color?: string;
  engine_volume?: number;
  fuel_type?: string;
  seats?: number;
  ownership?: string;
  next_test_date?: string;
  license_valid_date?: string;
}

export function useVehicleLookup() {
  const [vehicle, setVehicle] = useState<VehicleInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (plate: string) => {
    const clean = plate.replace(/[-\s]/g, '');
    if (clean.length < 5) return;

    setLoading(true);
    setError(null);
    setVehicle(null);

    try {
      const res = await fetch(`/api/vehicle-lookup?plate=${encodeURIComponent(clean)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Vehicle not found');
        return;
      }

      setVehicle(data.vehicle as VehicleInfo);
    } catch {
      setError('Failed to connect to vehicle registry');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setVehicle(null);
    setError(null);
  }, []);

  return { vehicle, loading, error, lookup, reset };
}
