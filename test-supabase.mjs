/**
 * Shivarivel App - Full Supabase Backend Test (Authenticated)
 * Run with: node test-supabase.mjs
 *
 * FINDINGS so far:
 *  - company_id in DB = d12766cc-a856-40bf-b653-092627916d61
 *  - Anon key can READ (RLS allows select for anon)
 *  - INSERT requires auth session (RLS blocks anon inserts)
 *  - So: we must login first, then test all mutations
 */

const SUPABASE_URL = 'https://qjziigkwuppdzkhpzhoa.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqemlpZ2t3dXBwZHpraHB6aG9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgzMzI4NjYsImV4cCI6MjEwMzkwODg2Nn0.1o7NS11WO8kQfpxNM3XxyxZdwIBwfoZnkbGIZ9_Ekl0';

const REAL_COMPANY_ID = 'd12766cc-a856-40bf-b653-092627916d61';

// ─── Colors ───────────────────────────────────────────────────
const green  = (s) => `\x1b[32m${s}\x1b[0m`;
const red    = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;
const dim    = (s) => `\x1b[2m${s}\x1b[0m`;
const cyan   = (s) => `\x1b[36m${s}\x1b[0m`;

let passCount = 0; let failCount = 0; let warnCount = 0;
const results = [];

const pass = (t, d='') => { passCount++; console.log(green(`  ✅ PASS  ${t}${d ? dim(' — '+d) : ''}`)); results.push({test:t,status:'PASS',detail:d}); };
const fail = (t, d='') => { failCount++; console.log(red(`  ❌ FAIL  ${t}${d ? ' — '+d : ''}`));         results.push({test:t,status:'FAIL',detail:d}); };
const warn = (t, d='') => { warnCount++; console.log(yellow(`  ⚠️  WARN  ${t}${d ? dim(' — '+d) : ''}`)); results.push({test:t,status:'WARN',detail:d}); };
const info = (s) => console.log(cyan(`  ℹ  ${s}`));

// ─── Auth + HTTP helpers ───────────────────────────────────────
let authToken = null;

function headers(extra = {}) {
  const h = {
    apikey: SUPABASE_KEY,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...extra,
  };
  if (authToken) h.Authorization = `Bearer ${authToken}`;
  else h.Authorization = `Bearer ${SUPABASE_KEY}`;
  return h;
}

async function req(method, path, body = null) {
  const url = path.startsWith('http') ? path : `${SUPABASE_URL}/rest/v1/${path}`;
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  try {
    const r = await fetch(url, opts);
    let data = null;
    try { data = await r.json(); } catch {}
    return { ok: r.ok, status: r.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null, err: e.message };
  }
}

async function login(email, password) {
  const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const d = await r.json();
  if (r.ok && d.access_token) {
    authToken = d.access_token;
    return { ok: true, user: d.user };
  }
  return { ok: false, error: d.error_description || d.msg || JSON.stringify(d) };
}

async function insert(label, table, payload) {
  const r = await req('POST', table, payload);
  if (!r.ok) { fail(label, `HTTP ${r.status} — ${JSON.stringify(r.data)}`); return null; }
  const rec = Array.isArray(r.data) ? r.data[0] : r.data;
  pass(label, `ID: ${rec?.id?.slice(0,8)}...`);
  return rec;
}

async function read(label, path) {
  const r = await req('GET', path);
  if (!r.ok) { fail(label, `HTTP ${r.status}`); return null; }
  const count = Array.isArray(r.data) ? r.data.length : 1;
  pass(label, `${count} record(s)`);
  return r.data;
}

async function update(label, table, id, payload) {
  const r = await req('PATCH', `${table}?id=eq.${id}`, payload);
  if (!r.ok) { fail(label, `HTTP ${r.status} — ${JSON.stringify(r.data)}`); return false; }
  pass(label); return true;
}

async function del(label, path) {
  const r = await req('DELETE', path);
  if (!r.ok) { warn(label, `HTTP ${r.status}`); return false; }
  pass(label); return true;
}

async function rpc(label, fnName, body) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${fnName}`;
  const opts = { method: 'POST', headers: headers(), body: JSON.stringify(body) };
  const r = await fetch(url, opts);
  let data = null; try { data = await r.json(); } catch {}
  if (r.ok) { pass(label, `HTTP ${r.status}`); return { ok: true, data }; }
  warn(label, `HTTP ${r.status} — ${JSON.stringify(data)}`);
  return { ok: false, data };
}

// ─────────────────────────────────────────────────────────────
async function runTests() {
  console.log(bold('\n╔══════════════════════════════════════════════════╗'));
  console.log(bold('║   SHIVARIVEL APP — SUPABASE FULL BACKEND TEST   ║'));
  console.log(bold('╚══════════════════════════════════════════════════╝\n'));
  console.log(dim(`  Supabase: ${SUPABASE_URL}`));
  console.log(dim(`  Company:  ${REAL_COMPANY_ID}`));
  console.log(dim(`  Time:     ${new Date().toLocaleString('en-IN')}\n`));

  // ── 1. CONNECTIVITY ──────────────────────────────────────
  console.log(bold('\n━━━ 1. CONNECTIVITY ━━━'));
  const ping = await req('GET', 'customers?limit=1');
  if (ping.status === 0) { fail('Supabase reachable', 'Network error'); return; }
  pass('Supabase reachable', `HTTP ${ping.status}`);

  // ── 2. AUTHENTICATION ────────────────────────────────────
  console.log(bold('\n━━━ 2. AUTHENTICATION ━━━'));
  info('Trying to login... (provide credentials via LOGIN_EMAIL / LOGIN_PASSWORD env vars)');

  const email    = process.env.LOGIN_EMAIL    || 'owner@shivarivel.com';
  const password = process.env.LOGIN_PASSWORD || '';

  let isLoggedIn = false;
  if (password) {
    const loginResult = await login(email, password);
    if (loginResult.ok) {
      pass('Login with credentials', `User: ${loginResult.user?.email}`);
      isLoggedIn = true;
    } else {
      fail('Login with credentials', loginResult.error);
      warn('Auth required for inserts', 'Running read-only tests only. Set LOGIN_EMAIL + LOGIN_PASSWORD env vars to enable full tests.');
    }
  } else {
    warn('Login skipped', 'No password provided. Set LOGIN_EMAIL and LOGIN_PASSWORD env vars.');
    warn('Insert tests will run without auth', 'RLS may block writes — expected');
    info('Example: LOGIN_EMAIL=owner@shivarivel.com LOGIN_PASSWORD=yourpassword node test-supabase.mjs');
  }

  // ── 3. READ EXISTING DATA ─────────────────────────────────
  console.log(bold('\n━━━ 3. READ EXISTING DATA ━━━'));
  const existingCustomers = await read('READ customers',   'customers?order=created_at.desc&limit=10');
  const existingProjects  = await read('READ projects',    'projects?order=created_at.desc&limit=10');
  const existingEmployees = await read('READ employees',   'employees?order=created_at.desc&limit=10');
  const existingWages     = await read('READ daily_wages', 'daily_wages?order=wage_date.desc&limit=10');
  const existingPurchases = await read('READ purchases',   'purchases?order=purchase_date.desc&limit=10');
  const existingSuppliers = await read('READ suppliers',   'suppliers?order=created_at.desc&limit=10');
  const existingMaterials = await read('READ materials',   'materials?order=created_at.desc&limit=10');

  console.log(bold('\n━━━ 4. DATABASE VIEWS ━━━'));
  await read('VIEW v_purchase_balance',  'v_purchase_balance?limit=5');
  await read('VIEW v_supplier_balance',  'v_supplier_balance?limit=5');

  // Summarise existing data
  const eC = existingCustomers?.length || 0;
  const eP = existingProjects?.length  || 0;
  const eE = existingEmployees?.length || 0;
  const eW = existingWages?.length     || 0;
  const ePu = existingPurchases?.length|| 0;
  console.log(cyan(`\n  Existing data: ${eC} customers, ${eP} projects, ${eE} employees, ${eW} wages, ${ePu} purchases`));

  // ── 5. CREATE TEST DATA (requires auth) ─────────────────
  console.log(bold('\n━━━ 5. CREATE DEMO TEST DATA ━━━'));

  const now = new Date().toISOString().split('T')[0];
  const tag = Date.now().toString().slice(-5);

  let custId = null, projId = null, empId = null, supId = null, matId = null, purId = null;

  // Customer
  const cust = await insert(`CREATE customer "DEMO CLIENT ${tag}"`, 'customers', {
    name: `DEMO CLIENT ${tag}`,
    phone: '9876543210',
    address: '123 Demo Street, Nagercoil',
    status: 'active',
    company_id: REAL_COMPANY_ID,
  });
  custId = cust?.id;

  // Project linked to customer
  const proj = await insert(`CREATE project "DEMO PROJECT ${tag}"`, 'projects', {
    name: `DEMO PROJECT ${tag}`,
    site_address: 'Demo Site, TVM',
    customer_id: custId || null,
    status: 'Active',
    project_code: `DPR-${tag}`,
    company_id: REAL_COMPANY_ID,
    start_date: now,
  });
  projId = proj?.id;

  // Verify customer join on project
  if (projId && custId) {
    const joinR = await req('GET', `projects?id=eq.${projId}&select=*,customer:customers!customer_id(id,name)`);
    if (joinR.ok && joinR.data?.[0]?.customer?.name) {
      pass('Project→Customer JOIN works', `Shows: ${joinR.data[0].customer.name}`);
    } else {
      fail('Project→Customer JOIN', `customer field: ${JSON.stringify(joinR.data?.[0]?.customer)}`);
    }
  }

  // Employee / Labourer
  const emp = await insert(`CREATE employee "DEMO WORKER ${tag}"`, 'employees', {
    name: `DEMO WORKER ${tag}`,
    employee_code: `DWK-${tag}`,
    phone: '8765432109',
    worker_type: 'Labour',
    status: 'active',
    daily_wage: 650,
    company_id: REAL_COMPANY_ID,
  });
  empId = emp?.id;

  // Supplier
  const sup = await insert(`CREATE supplier "DEMO SUPPLIER ${tag}"`, 'suppliers', {
    name: `DEMO SUPPLIER ${tag}`,
    contact_person: 'Demo Contact',
    phone: '7654321098',
    status: 'active',
    company_id: REAL_COMPANY_ID,
  });
  supId = sup?.id;

  // Material
  const mat = await insert(`CREATE material "Demo Cement ${tag}"`, 'materials', {
    name: `Demo Cement ${tag}`,
    category: 'Building Materials',
    unit: 'Bags',
    standard_rate: 450,
    status: 'active',
    company_id: REAL_COMPANY_ID,
  });
  matId = mat?.id;

  // ── 6. WAGES ─────────────────────────────────────────────
  console.log(bold('\n━━━ 6. WAGES — RPC + Direct Insert ━━━'));
  if (empId && projId) {
    // Try RPC first
    const wageRpc = await rpc(
      'CREATE wage via record_attendance RPC',
      'record_attendance',
      {
        p_employee_id: empId,
        p_status: 'Present',
        p_attendance_date: now,
        p_project_id: projId,
        p_overtime_hours: 0,
        p_overtime_amount: 0,
        p_daily_wage_rate: 650,
        p_notes: 'Demo wage test',
        p_auto_generate_wage: true,
      }
    );

    if (!wageRpc.ok) {
      // Fallback: direct insert
      await insert('CREATE wage via direct insert (fallback)', 'daily_wages', {
        employee_id: empId,
        project_id: projId,
        wage_date: now,
        wage_number: `WG-DMO-${tag}`,
        payable_units: 1.0,
        rate: 650,
        base_wage: 650,
        amount: 650,
        amount_payable: 650,
        amount_paid: 0,
        overtime_hours: 0,
        overtime_amount: 0,
        status: 'Confirmed',
        notes: 'Demo wage entry',
        company_id: REAL_COMPANY_ID,
      });
    }

    // Verify wages for project
    const wR = await req('GET', `daily_wages?project_id=eq.${projId}&select=*,employee:employees(name)`);
    if (wR.ok && Array.isArray(wR.data) && wR.data.length > 0) {
      pass('READ wages filtered by project_id', `${wR.data.length} entry — Worker: ${wR.data[0].employee?.name}, ₹${wR.data[0].amount}`);
    } else {
      fail('READ wages filtered by project_id', 'No wages found for project');
    }
  }

  // ── 7. PURCHASE WITH ITEMS ──────────────────────────────
  console.log(bold('\n━━━ 7. PURCHASE — Create + Items ━━━'));
  if (supId && projId) {
    const pur = await insert(`CREATE purchase for project`, 'purchases', {
      supplier_id: supId,
      project_id: projId,
      purchase_number: `PUR-DMO-${tag}`,
      purchase_date: now,
      status: 'Confirmed',
      discount: 0,
      tax: 0,
      total_amount: 4500,
      company_id: REAL_COMPANY_ID,
    });
    purId = pur?.id;

    if (purId && matId) {
      await insert('CREATE purchase item (Cement x 10 bags)', 'purchase_items', {
        purchase_id: purId,
        material_id: matId,
        description: `Demo Cement ${tag}`,
        quantity: 10,
        unit: 'Bags',
        unit_price: 450,
        amount: 4500,
        company_id: REAL_COMPANY_ID,
      });

      // Verify purchase+items for project
      const pR = await req('GET', `purchases?project_id=eq.${projId}&select=*,supplier:suppliers!supplier_id(name),items:purchase_items!purchase_id(*,material:materials!material_id(name))`);
      if (pR.ok && pR.data?.length > 0) {
        const items = (pR.data[0].items || []).map(i => i.material?.name || i.description).join(', ');
        pass('READ purchases with items filtered by project_id', `Items shown: ${items}`);
      } else {
        fail('READ purchases filtered by project_id', 'No purchases returned');
      }
    }
  }

  // ── 8. UPDATE TESTS ──────────────────────────────────────
  console.log(bold('\n━━━ 8. UPDATE OPERATIONS ━━━'));
  if (custId) {
    await update('UPDATE customer → inactive', 'customers', custId, { status: 'inactive' });
    await update('UPDATE customer → active',   'customers', custId, { status: 'active' });
  }
  if (projId) {
    await update('UPDATE project → Completed', 'projects', projId, { status: 'Completed' });
    await update('UPDATE project → Active',    'projects', projId, { status: 'Active' });
  }

  // ── 9. FINAL READ VERIFICATION ───────────────────────────
  console.log(bold('\n━━━ 9. FINAL READ VERIFICATION ━━━'));
  if (projId) {
    const finalProj = await req('GET', `projects?id=eq.${projId}&select=*,customer:customers!customer_id(id,name,phone)`);
    if (finalProj.ok && finalProj.data?.[0]) {
      const p = finalProj.data[0];
      pass('FINAL project read', `Status: ${p.status}, Client: ${p.customer?.name || 'NOT LINKED'}`);
    }
  }

  // ── 10. CLEANUP TEST DATA ────────────────────────────────
  console.log(bold('\n━━━ 10. CLEANUP TEST DATA ━━━'));
  if (purId)  await del('DELETE purchase_items', `purchase_items?purchase_id=eq.${purId}`);
  if (purId)  await del('DELETE purchase',       `purchases?id=eq.${purId}`);
  if (projId) await del('DELETE wages',          `daily_wages?project_id=eq.${projId}`);
  if (projId) await del('DELETE project',        `projects?id=eq.${projId}`);
  if (custId) await del('DELETE customer',       `customers?id=eq.${custId}`);
  if (empId)  await del('DELETE employee',       `employees?id=eq.${empId}`);
  if (supId)  await del('DELETE supplier',       `suppliers?id=eq.${supId}`);
  if (matId)  await del('DELETE material',       `materials?id=eq.${matId}`);

  // ── SUMMARY ──────────────────────────────────────────────
  console.log(bold('\n╔══════════════════════════════════════════════════╗'));
  console.log(bold('║                  TEST SUMMARY                   ║'));
  console.log(bold('╚══════════════════════════════════════════════════╝'));
  console.log(green(`  ✅ PASSED : ${passCount}`));
  console.log(red(`  ❌ FAILED : ${failCount}`));
  console.log(yellow(`  ⚠️  WARNED : ${warnCount}\n`));

  if (failCount === 0) {
    console.log(green(bold('  🎉 ALL TESTS PASSED — Backend fully operational!\n')));
  } else {
    console.log(red(bold(`  🔴 ${failCount} FAILURE(S) found:\n`)));
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(red(`    ✗ ${r.test}`));
      if (r.detail) console.log(dim(`      ${r.detail}`));
    });
  }

  if (warnCount > 0) {
    console.log(yellow(bold('\n  ⚠ Warnings:\n')));
    results.filter(r => r.status === 'WARN').forEach(r => {
      console.log(yellow(`    ⚠ ${r.test}`));
      if (r.detail) console.log(dim(`      ${r.detail}`));
    });
  }

  console.log();
}

runTests().catch(e => { console.error(red(`\nFATAL: ${e.message}\n`)); process.exit(1); });
