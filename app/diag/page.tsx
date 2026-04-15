'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function DiagnosticPage() {
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    async function run() {
      const res: any = {};
      
      // 1. Check products columns meticulously
      try {
        const { data, error } = await supabase.from('products').select('*').limit(1);
        if (error) res.products_error = error.message;
        else {
           res.products_columns = Object.keys(data?.[0] || {});
           res.products_sample = data?.[0] || 'No data';
        }
      } catch (e: any) { res.products_catch = e.message; }

      // 2. Check inventory columns
      try {
        const { data, error } = await supabase.from('inventory').select('*').limit(1);
        if (error) res.inventory_error = error.message;
        else res.inventory_columns = Object.keys(data?.[0] || {});
      } catch (e: any) { res.inventory_catch = e.message; }

      setResults(res);
    }
    run();
  }, []);

  return (
    <div style={{ padding: '40px', background: '#f8fafc', color: '#000' }}>
      <h1>Meticulous DB Audit</h1>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
}
