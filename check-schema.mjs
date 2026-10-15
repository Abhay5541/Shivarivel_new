// Quick diagnostic: check company UUID and table schema
const URL = process.env.VITE_SUPABASE_URL || 'https://uhetqkmskopooqsprfic.supabase.co';
const KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZXRxa21za29wb29xc3ByZmljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNzU2NjEsImV4cCI6MjEwNjk1MTY2MX0.8uuqg0x8EWpbQNtX4YMhWSaoOWyv6bv-S5DgsBWDpnI';
const h = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const check = async (label, path) => {
  const r = await fetch(`${URL}/rest/v1/${path}`, { headers: h });
  const d = await r.json();
  console.log(`${label} [${r.status}]:`, JSON.stringify(d).slice(0, 300));
};

(async () => {
  await check('companies', 'companies?limit=3');
  await check('profiles',  'profiles?limit=3');
  await check('v_supplier_balance', 'v_supplier_balance?limit=1');
  // Try insert without company_id to see if it auto-fills
  const testR = await fetch(`${URL}/rest/v1/customers`, {
    method: 'POST',
    headers: { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify({ name: 'SCHEMA_TEST', phone: '0000000000', status: 'active' })
  });
  const testD = await testR.json();
  console.log(`insert without company_id [${testR.status}]:`, JSON.stringify(testD).slice(0, 300));
  // If it created — delete it
  if (testR.status === 201 && testD?.[0]?.id) {
    const cid = testD[0].id;
    await fetch(`${URL}/rest/v1/customers?id=eq.${cid}`, { method: 'DELETE', headers: h });
    console.log(`CLEANUP: deleted SCHEMA_TEST customer ${cid}`);
    console.log(`COMPANY_ID from insert: ${testD[0].company_id}`);
  }
})();
