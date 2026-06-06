const { chromium } = require('playwright');

(async () => {
  console.log('Starting pragmatic validation of the Demo Harness (v3)...');
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    
    // 1. Open the Remote Control
    console.log('Opening Remote Control (http://localhost:3001/demo-remote)...');
    const remoteContext = await browser.newContext();
    const remotePage = await remoteContext.newPage();
    const remoteRes = await remotePage.goto('http://localhost:3001/demo-remote', { waitUntil: 'networkidle' });
    if (remoteRes.status() === 404) throw new Error('Remote returned 404');

    // 2. Open the Main Screen
    console.log('Opening Main Screen (http://localhost:3001/demo-cockpit)...');
    const mainContext = await browser.newContext();
    const mainPage = await mainContext.newPage();
    const mainRes = await mainPage.goto('http://localhost:3001/demo-cockpit', { waitUntil: 'networkidle' });
    if (mainRes.status() === 404) throw new Error('Main Screen returned 404');

    // Verify Remote renders
    const title = await remotePage.title();
    console.log(`Remote loaded successfully. Title: ${title}`);
    
    // 3. Test Broadcast Channel from Remote -> Main
    console.log('Testing cross-tab PhantomConductor bridge via [Toggle QR]...');
    
    // Find the toggle button on Remote
    const toggleBtn = remotePage.locator('button', { hasText: 'Toggle QR Overlay' });
    if (await toggleBtn.isVisible()) {
      console.log('QR Button found on remote. Clicking...');
      await toggleBtn.click();
      
      // Verify QR Overlay appears on Main Screen
      console.log('Waiting for QR overlay to appear on Main Screen...');
      await mainPage.waitForTimeout(500); // give react time
      const qrTitle = mainPage.locator('h2', { hasText: 'Scan to Follow Along' });
      const isQrVisible = await qrTitle.isVisible();
      if (isQrVisible) {
        console.log('✅ PASS: Cross-tab BroadcastChannel and PhantomConductor successfully spawned the QR overlay.');
      } else {
        console.error('❌ FAIL: QR Overlay did not appear on Main Screen.');
        process.exit(1);
      }
    } else {
      console.error('❌ FAIL: Could not find Toggle QR button. Validation failed.');
      process.exit(1);
    }

    console.log('Pragmatic validation completed.');
  } catch (err) {
    console.error('❌ Validation crashed:', err.message);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
    process.exit(0);
  }
})();
