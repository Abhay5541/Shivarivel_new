import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = 'C:\\Users\\prasa\\.gemini\\antigravity-ide\\brain\\7715afdc-60f7-4308-873d-4a70a03ffb0d';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browserBin = fs.existsSync(EDGE_PATH) ? EDGE_PATH : CHROME_PATH;
const tempUserData = 'C:\\Users\\prasa\\AppData\\Local\\Temp\\chrome-phase13-' + Date.now();

console.log('Using browser binary:', browserBin);

const browserProcess = spawn(
  browserBin,
  [
    '--headless=new',
    '--remote-debugging-port=9234',
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

async function waitForCdp(port = 9234, retries = 30) {
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
    await waitForCdp(9234);

    const targetsRes = await fetch('http://127.0.0.1:9234/json/list');
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
    await setViewport(1440, 900, false);
    await sleep(400);
    console.log('Authenticating as Owner / Admin...');
    await evaluate(`
      const buttons = Array.from(document.querySelectorAll('button'));
      const ownerBtn = buttons.find(b => b.textContent.includes('Owner / Admin'));
      if (ownerBtn) ownerBtn.click();
    `);
    await sleep(2000);

    // ==========================================
    // 1. DESKTOP WIDE AUDIT (1440x900)
    // ==========================================
    console.log('Capturing Desktop 1440x900 screenshots...');
    await setViewport(1440, 900, false);

    console.log('1. Dashboard (1440x900)...');
    await navigateClient('/dashboard');
    await sleep(1000);
    await takeScreenshot('phase13_01_desktop_1440_dashboard.png');

    console.log('2. Project Command Center (1440x900)...');
    await navigateClient('/projects/prj-001');
    await sleep(1000);
    await takeScreenshot('phase13_02_desktop_1440_project.png');

    // ==========================================
    // 2. DESKTOP STANDARD AUDIT (1280x900)
    // ==========================================
    console.log('Capturing Desktop 1280x900 screenshots...');
    await setViewport(1280, 900, false);

    console.log('3. Financial Control Center (1280x900)...');
    await navigateClient('/financial-summary');
    await sleep(1000);
    await takeScreenshot('phase13_03_desktop_1280_finance.png');

    console.log('4. Purchases & Procurement (1280x900)...');
    await navigateClient('/purchases');
    await sleep(1000);
    await takeScreenshot('phase13_04_desktop_1280_purchases.png');

    console.log('5. Attendance Muster (1280x900)...');
    await navigateClient('/attendance');
    await sleep(1000);
    await takeScreenshot('phase13_05_desktop_1280_attendance.png');

    console.log('6. Customer 360 Detail (1280x900)...');
    await navigateClient('/customers/cust-01');
    await sleep(1000);
    await takeScreenshot('phase13_06_desktop_1280_customer.png');

    console.log('7. Architectural Estimate Presentation (1280x900)...');
    await navigateClient('/estimates/est-01');
    await sleep(1000);
    await takeScreenshot('phase13_07_desktop_1280_estimate.png');

    console.log('8. Executive Weekly Report (1280x900)...');
    await navigateClient('/reports/weekly');
    await sleep(1000);
    await takeScreenshot('phase13_08_desktop_1280_reports.png');

    console.log('9. Settings Overview (1280x900)...');
    await navigateClient('/settings');
    await sleep(1000);
    await takeScreenshot('phase13_09_desktop_1280_settings.png');

    console.log('10. Quick Add Action Modal Desktop (1280x900)...');
    await evaluate(`
      const qBtn = document.querySelector('[aria-label="Open Quick Add Menu (Hotkey: Q)"]');
      if (qBtn) qBtn.click();
    `);
    await sleep(800);
    await takeScreenshot('phase13_10_desktop_1280_quick_add.png');
    await evaluate(`
      const closeBtn = document.querySelector('[aria-label="Close Quick Add"]') || document.querySelector('[aria-label="Close modal"]');
      if (closeBtn) {
        closeBtn.click();
      } else {
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      }
    `);
    await sleep(600);

    // ==========================================
    // 3. TABLET AUDIT (768x1024)
    // ==========================================
    console.log('Capturing Tablet 768x1024 screenshots...');
    await setViewport(768, 1024, false);

    console.log('11. Tablet Dashboard (768x1024)...');
    await navigateClient('/dashboard');
    await sleep(1000);
    await takeScreenshot('phase13_11_tablet_768_dashboard.png');

    console.log('12. Tablet Project Command Center (768x1024)...');
    await navigateClient('/projects/prj-001');
    await sleep(1000);
    await takeScreenshot('phase13_12_tablet_768_project.png');

    // ==========================================
    // 4. MOBILE AUDIT (360x800, 390x844, 430x932)
    // ==========================================
    console.log('Capturing Mobile Field-Ready screenshots...');

    // Mobile Small 360px
    await setViewport(360, 800, true);
    console.log('13. Mobile 360px Fast Field Attendance...');
    await navigateClient('/attendance');
    await sleep(1000);
    await takeScreenshot('phase13_13_mobile_360_attendance.png');

    console.log('14. Mobile 360px Project Command Center...');
    await navigateClient('/projects/prj-001');
    await sleep(1000);
    await takeScreenshot('phase13_14_mobile_360_project.png');

    // Mobile Standard 390px
    await setViewport(390, 844, true);
    console.log('15. Mobile 390px Operations Dashboard...');
    await navigateClient('/dashboard');
    await sleep(1000);
    await takeScreenshot('phase13_15_mobile_390_dashboard.png');

    // Mobile Large 430px Financial Control Center
    await setViewport(430, 932, true);
    console.log('16. Mobile 430px Financial Control Center...');
    await navigateClient('/financial-summary');
    await sleep(1000);
    await takeScreenshot('phase13_17_mobile_430_finance.png');

    // Mobile Standard 390px Quick Add Bottom Sheet
    await setViewport(390, 844, true);
    console.log('17. Mobile 390px Quick Add Bottom Sheet...');
    await navigateClient('/dashboard');
    await sleep(1000);
    await evaluate(`
      const fab = document.querySelector('button[aria-label="Open Quick Add Menu"]');
      if (fab) fab.click();
    `);
    await sleep(800);
    await takeScreenshot('phase13_16_mobile_390_quick_add.png');

    console.log('All Phase 13 premium screenshots captured successfully!');
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
