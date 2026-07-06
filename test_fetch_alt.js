async function run() {
  const sites = ['https://receive-sms.cc/', 'https://anonymsms.com/', 'https://smstome.com/'];
  for (let s of sites) {
      try {
          console.log("Fetching", s);
          const res = await fetch(s, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/115.0',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5'
            }
          });
          const html = await res.text();
          console.log("Status:", res.status);
          console.log("Cloudflare?", html.includes('Cloudflare') || html.includes('Just a moment'));
          const matches = html.match(/\+\d{1,3}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{4}/g) || [];
          console.log("Matches:", [...new Set(matches)].slice(0, 5));
      } catch (e) {
          console.log(e.message);
      }
  }
}
run();
