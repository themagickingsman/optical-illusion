async function run() {
  try {
      const res = await fetch('https://receive-smss.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const html = await res.text();
      console.log(html.substring(0, 500));
      console.log("Cloudflare?", html.includes('Cloudflare'));
      const matches = html.match(/\+\d{1,3}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{4}/g) || [];
      console.log("Matches:", matches);
  } catch (e) {
      console.log(e);
  }
}
run();
