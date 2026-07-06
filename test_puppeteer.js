const puppeteer = require('puppeteer');
async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.goto('https://receive-smss.com/', { waitUntil: 'networkidle2' });
  const html = await page.content();
  console.log("Title:", await page.title());
  const matches = html.match(/\+\d{1,3}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{4}/g) || [];
  console.log("Matches:", [...new Set(matches)]);
  await browser.close();
}
run();
