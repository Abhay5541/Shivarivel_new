import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = 'C:\\Users\\prasa\\.gemini\\antigravity-ide\\brain\\7715afdc-60f7-4308-873d-4a70a03ffb0d';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browserBin = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;
const tempUserData = 'C:\\Users\\prasa\\AppData\\Local\\Temp\\chrome-phase12-' + Date.now();

console.log('Using browser binary:', browserBin);

const browserProcess = spawn(
  browserBin,
  [
    '--headless=new',
    '--remote-debugging-port=9233',
    `--user-data-dir=${tempUserData}`,
    '--no-first-run',
    '--disable-gpu',
    '--disable-background-networking',
    '--disable-extensions',
    'http://127.0.0.1:5173/login',
  ],
  { stdio: 'ignore', detached: false }
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForCdp(port = 9233, retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // retry
    }
    await sleep(400);
  }
  throw new Error(`CDP port ${port} failed to open`);
}

async function main() {
  try {
    await waitForCdp(9233);

    const targetsRes = await fetch('http://127.0.0.1:9233/json/list');
    const targets = await targetsRes.json();
    const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

    let msgId = 1;
    const callbacks = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && callbacks.has(data.id)) {
        const { resolve, reject } = callbacks.get(data.id);
        callbacks.delete(data.id);
        if (data.error) reject(data.error);
        else resolve(data.result);
      }
    };

    await new Promise((resolve) => (ws.onopen = resolve));

    function send(method, params = {}) {
      const id = msgId++;
      return new Promise((resolve, reject) => {
        callbacks.set(id, { resolve, reject });
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    async function setViewport(width, height, isMobile = false) {
      await send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: isMobile,
      });
      await send('Emulation.setVisibleSize', { width, height });
    }

    async function evaluate(expression) {
      const res = await send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.value;
    }

    async function takeScreenshot(filename) {
      const { data } = await send('Page.captureScreenshot', { format: 'png' });
      const filePath = path.join(OUTPUT_DIR, filename);
      fs.writeFileSync(filePath, Buffer.from(data, 'base64'));
      console.log(`Saved screenshot: ${filename} (${Math.round((data.length * 0.75) / 1024)} KB)`);
      return filePath;
    }

    async function navigateClient(route) {
      await evaluate(`
        (() => {
          window.history.pushState({}, '', '${route}');
          window.dispatchEvent(new PopStateEvent('popstate'));
        })()
      `);
      await sleep(1500);
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('DOM.enable');

    console.log('Navigating to login page...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5173/login' });
    await sleep(2000);

    // 0. Authenticate as Owner / Admin
    await setViewport(1280, 900, false);
    await sleep(400);
    console.log('Authenticating as Owner / Admin...');
    await evaluate(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const ownerBtn = buttons.find(b => b.textContent.includes('Owner / Admin'));
      if (ownerBtn) ownerBtn.click();
    `);
    await sleep(2000);

    // ==========================================
    // DESKTOP AUDIT (1280x900)
    // ==========================================
    console.log('Capturing Desktop Phase 12 Final QA screenshots...');
    await setViewport(1280, 900, false);

    // 1. Dashboard
    console.log('1. Dashboard (/dashboard)...');
    await navigateClient('/dashboard');
    await sleep(1000);
    await takeScreenshot('phase12_01_desktop_dashboard.png');

    // 2. Customer
    console.log('2. Customer Detail (/customers/cust-01)...');
    await navigateClient('/customers/cust-01');
    await sleep(1000);
    await takeScreenshot('phase12_02_desktop_customer.png');

    // 3. Estimate
    console.log('3. Estimate Proposal (/estimates/est-01)...');
    await navigateClient('/estimates/est-01');
    await sleep(1000);
    await takeScreenshot('phase12_03_desktop_estimate.png');

    // 4. Project
    console.log('4. Project Command Center (/projects/proj-01)...');
    await navigateClient('/projects/proj-01');
    await sleep(1000);
    await takeScreenshot('phase12_04_desktop_project.png');

    // 5. Purchase
    console.log('5. Purchase Record (/purchases/po-01)...');
    await navigateClient('/purchases/po-01');
    await sleep(1000);
    await takeScreenshot('phase12_05_desktop_purchase.png');

    // 6. Attendance
    console.log('6. Workforce Attendance (/attendance)...');
    await navigateClient('/attendance');
    await sleep(1000);
    await takeScreenshot('phase12_06_desktop_attendance.png');

    // 7. Finance
    console.log('7. Financial Summary (/financial-summary)...');
    await navigateClient('/financial-summary');
    await sleep(1000);
    await takeScreenshot('phase12_07_desktop_finance.png');

    // 8. Reports
    console.log('8. Weekly Report (/reports/weekly)...');
    await navigateClient('/reports/weekly');
    await sleep(1000);
    await takeScreenshot('phase12_08_desktop_reports.png');

    // 9. Settings
    console.log('9. Settings Overview (/settings)...');
    await navigateClient('/settings');
    await sleep(1000);
    await takeScreenshot('phase12_09_desktop_settings.png');

    // 10. Not-found state (404)
    console.log('10. Not Found 404 Route (/unknown-nonexistent-route)...');
    await navigateClient('/unknown-nonexistent-route');
    await sleep(1000);
    await takeScreenshot('phase12_10_desktop_not_found.png');

    // 11. Empty state
    console.log('11. Empty State (/projects?search=NonexistentQuery)...');
    await navigateClient('/projects');
    await sleep(500);
    await evaluate(`
      const searchInput = document.querySelector('input[placeholder*="Search"]');
      if (searchInput) {
        searchInput.value = 'NonexistentProjectXYZ';
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `);
    await sleep(1000);
    await takeScreenshot('phase12_11_desktop_empty_state.png');

    // 12. Validation error
    console.log('12. Validation error (/expenses/new submit empty)...');
    await navigateClient('/expenses/new');
    await sleep(800);
    await evaluate(`
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    `);
    await sleep(800);
    await takeScreenshot('phase12_12_desktop_validation_error.png');

    // 13. Print preview
    console.log('13. Print preview for weekly report...');
    await navigateClient('/reports/weekly');
    await sleep(800);
    await send('Emulation.setEmulatedMedia', { media: 'print' });
    await sleep(800);
    await takeScreenshot('phase12_13_print_preview.png');
    await send('Emulation.setEmulatedMedia', { media: '' });

    // ==========================================
    // MOBILE AUDIT (390x844 & 360x800)
    // ==========================================
    console.log('Capturing Mobile Phase 12 Final QA screenshots...');

    // 14. Mobile Dashboard (390px)
    await setViewport(390, 844, true);
    await navigateClient('/dashboard');
    await sleep(1000);
    await takeScreenshot('phase12_14_mobile_dashboard_390px.png');

    // 15. Mobile Attendance Muster (360px)
    await setViewport(360, 800, true);
    await navigateClient('/attendance');
    await sleep(1000);
    await takeScreenshot('phase12_15_mobile_attendance_360px.png');

    // 16. Mobile Quick Add Modal (390px)
    await setViewport(390, 844, true);
    await navigateClient('/dashboard');
    await sleep(600);
    await evaluate(`
      const fab = document.querySelector('button[aria-label="Open Quick Add Menu"]');
      if (fab) fab.click();
    `);
    await sleep(800);
    await takeScreenshot('phase12_16_mobile_quick_add_390px.png');

    console.log('All Phase 12 screenshots captured successfully!');
  } catch (err) {
    console.error('Fatal audit error:', err);
  } finally {
    try {
      browserProcess.kill('SIGTERM');
    } catch {}
    try {
      fs.rmSync(tempUserData, { recursive: true, force: true });
    } catch {}
    process.exit(0);
  }
}

main();
