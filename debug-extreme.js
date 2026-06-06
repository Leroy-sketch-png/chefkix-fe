const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    console.log('Booting debug browser...');
    browser = await chromium.launch({ headless: true });
    
    console.log('Loading Remote at /demo-remote...');
    const remoteContext = await browser.newContext();
    const remotePage = await remoteContext.newPage();
    await remotePage.goto('http://localhost:3000/demo-remote', { waitUntil: 'networkidle', timeout: 15000 });
    await remotePage.screenshot({ path: 'C:\\Users\\YOGA\\.gemini\\antigravity\\brain\\8eb1e671-b94c-45bf-b8a4-5f52b9fc1ac4\\remote-debug.png', fullPage: true });
    
    console.log('Loading Cockpit at /demo-cockpit...');
    const mainContext = await browser.newContext();
    const mainPage = await mainContext.newPage();
    await mainPage.goto('http://localhost:3000/demo-cockpit', { waitUntil: 'networkidle', timeout: 15000 });
    await mainPage.screenshot({ path: 'C:\\Users\\YOGA\\.gemini\\antigravity\\brain\\8eb1e671-b94c-45bf-b8a4-5f52b9fc1ac4\\cockpit-debug.png', fullPage: true });

    console.log('Debug screenshots taken successfully.');
  } catch (err) {
    console.error('DEBUG ERROR:', err.message);
  } finally {
    if (browser) await browser.close();
    process.exit(0);
  }
})();
