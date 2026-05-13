import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Israeli Government Open Data API - Vehicle Registry
const GOV_API_BASE = 'https://data.gov.il/api/3/action/datastore_search';

// Resource IDs from data.gov.il
const RESOURCE_IDS = {
  // רכב פרטי ומסחרי - Private and commercial vehicles
  private: '053cea08-09bc-40ec-8f7a-156f0677aff3',
};

export interface VehicleData {
  plate_number: string;
  manufacturer?: string;
  model?: string;
  year?: number;
  color?: string;
  engine_volume?: number;
  fuel_type?: string;
  seats?: number;
  ownership?: string;
  last_ownership_date?: string;
  license_valid_date?: string;
  next_test_date?: string;
  raw?: Record<string, unknown>;
}

function mapVehicleData(record: Record<string, unknown>): VehicleData {
  return {
    plate_number: String(record['mispar_rechev'] ?? record['misparlochit'] ?? ''),
    manufacturer: String(record['tozeret_nm'] ?? record['degem_nm'] ?? ''),
    model: String(record['kinuy_mishari'] ?? record['degem_manoa'] ?? ''),
    year: record['shnat_yitzur'] ? parseInt(String(record['shnat_yitzur'])) : undefined,
    color: String(record['tzeva_rechev'] ?? ''),
    engine_volume: record['nefah_manoa'] ? parseInt(String(record['nefah_manoa'])) : undefined,
    fuel_type: String(record['sug_delek_nm'] ?? ''),
    seats: record['mispar_moshavim'] ? parseInt(String(record['mispar_moshavim'])) : undefined,
    ownership: String(record['baalut'] ?? ''),
    last_ownership_date: String(record['mivchan_acharon_dt'] ?? ''),
    license_valid_date: String(record['tokef_dt'] ?? ''),
    next_test_date: String(record['mivchan_acharon_dt'] ?? ''),
    raw: record,
  };
}

export async function GET(req: NextRequest) {
  const plateNumber = req.nextUrl.searchParams.get('plate');

  if (!plateNumber) {
    return NextResponse.json({ error: 'plate parameter is required' }, { status: 400 });
  }

  // Clean plate number - remove dashes and spaces
  const cleanPlate = plateNumber.replace(/[-\s]/g, '').trim();

  if (cleanPlate.length < 5 || cleanPlate.length > 8) {
    return NextResponse.json({ error: 'Invalid plate number format' }, { status: 400 });
  }

  try {
    // Check Supabase cache first
    const supabase = createClient();
    const { data: cached } = await supabase
      .from('vehicle_lookups')
      .select('*')
      .eq('plate_number', cleanPlate)
      .gte('fetched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // 7 days cache
      .single();

    if (cached) {
      return NextResponse.json({
        source: 'cache',
        vehicle: cached.data as VehicleData,
      });
    }

    // Query government API
    const url = new URL(GOV_API_BASE);
    url.searchParams.set('resource_id', RESOURCE_IDS.private);
    url.searchParams.set('filters', JSON.stringify({ mispar_rechev: cleanPlate }));
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: { 'User-Agent': 'CarCost-App/1.0' },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Gov API responded with ${response.status}`);
    }

    const json = await response.json();

    if (!json.success) {
      throw new Error('Gov API returned error');
    }

    const records: Record<string, unknown>[] = json.result?.records ?? [];

    if (records.length === 0) {
      return NextResponse.json({ error: 'Vehicle not found', plate: cleanPlate }, { status: 404 });
    }

    const vehicleData = mapVehicleData(records[0]);

    // Cache in Supabase
    await supabase.from('vehicle_lookups').upsert({
      plate_number: cleanPlate,
      data: vehicleData,
      fetched_at: new Date().toISOString(),
    });

    return NextResponse.json({
      source: 'api',
      vehicle: vehicleData,
    });
  } catch (error) {
    console.error('Vehicle lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vehicle data', details: String(error) },
      { status: 500 }
    );
  }
}
