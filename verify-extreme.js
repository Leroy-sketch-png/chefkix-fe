const { chromium } = require('playwright');
const path = require('path');

(async () => {
  let browser;
  try {
    console.log('Booting extreme validation headless browser...');
    browser = await chromium.launch({ headless: true });
    
    console.log('Loading Remote at /demo-remote...');
    const remoteContext = await browser.newContext();
    const remotePage = await remoteContext.newPage();
    const remoteRes = await remotePage.goto('http://localhost:3000/demo-remote', { waitUntil: 'networkidle', timeout: 60000 });
    
    console.log('Loading Cockpit at /demo-cockpit...');
    const mainContext = await browser.newContext();
    const mainPage = await mainContext.newPage();
    const mainRes = await mainPage.goto('http://localhost:3000/demo-cockpit', { waitUntil: 'networkidle', timeout: 60000 });

    if (remoteRes.status() !== 200 || mainRes.status() !== 200) {
      throw new Error(`Invalid status codes: Remote=${remoteRes.status()}, Cockpit=${mainRes.status()}`);
    }

    console.log('Cross-tab communication initiation...');
    const toggleBtn = remotePage.locator('button', { hasText: 'Toggle QR Overlay' });
    await toggleBtn.waitFor({ state: 'visible', timeout: 10000 });
    await toggleBtn.click();
    
    console.log('Waiting for PhantomConductor to catch the broadcast and inject UI...');
    await mainPage.waitForTimeout(2000); // 2 seconds to ensure React state propagates
    
    // Capture the absolute visual proof
    const screenshotPath = 'C:\\Users\\YOGA\\.gemini\\antigravity\\brain\\8eb1e671-b94c-45bf-b8a4-5f52b9fc1ac4\\proof.png';
    await mainPage.screenshot({ path: screenshotPath, fullPage: true });
    console.log('Screenshot physically saved at: ' + screenshotPath);

  } catch (err) {
    console.error('FATAL VALIDATION ERROR:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    process.exit(0);
  }
})();
