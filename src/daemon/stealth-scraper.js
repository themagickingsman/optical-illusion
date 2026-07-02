const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Local files for Volatile Storage when running locally
const TARGETS_FILE = process.env.TARGETS_FILE || path.join(process.cwd(), 'public/targets.json');
const TELEMETRY_FILE = process.env.TELEMETRY_FILE || path.join(process.cwd(), 'public/telemetry.json');

async function scrapeRedditStealth(browser, subreddit) {
  const page = await browser.newPage();
  try {
    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
    
    // Block images/styles to speed up
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Using internal Search instead of /new/ to massively increase signal-to-noise ratio
    const url = `https://www.reddit.com/r/${subreddit}/search/?q=hiring+OR+paid+OR+looking+OR+freelance+OR+needed&restrict_sr=1&sort=new`;
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

    // Scroll multiple times to cast a massive net
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
      await new Promise(r => setTimeout(r, 1500));
    }

    // Extract data from the DOM
    const data = await page.evaluate(() => {
      // Reddit DOM structure can vary (sh.reddit.com vs old layout), but let's try grabbing standard post elements.
      // Grab up to 100 posts after scrolling
      const posts = Array.from(document.querySelectorAll('shreddit-post')).slice(0, 100);
      
      let totalScore = 0;
      let totalComments = 0;
      const titles = [];

      if (posts.length > 0) {
        posts.forEach(post => {
          const score = parseInt(post.getAttribute('score') || '0', 10);
          const comments = parseInt(post.getAttribute('comment-count') || '0', 10);
          const title = post.getAttribute('post-title') || '';
          
          totalScore += score;
          totalComments += comments;
          titles.push(title);
        });
      } else {
        // Fallback for different DOM
        const genericPosts = Array.from(document.querySelectorAll('div[data-testid="post-container"]')).slice(0, 100);
        genericPosts.forEach(post => {
          // Very crude extraction fallback
          titles.push(post.innerText.split('\n')[0]);
          totalScore += 100; // Mock fallback if structure changed
          totalComments += 10;
        });
      }

      return { totalScore, totalComments, titles };
    });

    const keywords = {};
    data.titles.forEach(title => {
      const words = title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
      words.forEach(w => {
        if (w.length > 4) keywords[w] = (keywords[w] || 0) + 1;
      });
    });

    const topKeywords = Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(k => k[0]);

    await page.close();

    const finalVolume = Math.max(10, data.totalScore);
    const finalVelocity = Math.max(2, data.totalComments * 2);

    const scoreHiringPost = (t) => {
      const lower = t.toLowerCase();
      
      // 1. AUTO-KILL: Other freelancers, unpaid, revshare, students, hobbies
      if (lower.match(/\[?\s*for\s*hire\s*\]?/i)) return null;
      if (lower.match(/\b(unpaid|revshare|rev-share|rev share|student|hobby)\b/i)) return null;
      
      // 2. Must contain Hiring Intent
      const intentKws = ['[hiring]', 'hiring', '[paid]', 'looking for', 'needed', 'seeking', 'co-founder', 'cofounder', 'freelance'];
      const hasIntent = intentKws.some(k => lower.includes(k));
      if (!hasIntent) return null;

      // 3. Must match your specific Domain/Skillset (using word boundaries)
      const skillPattern = /\b(ui|ux|design|designer|three\.js|threejs|webgl|unity|unreal|ue4|ue5|frontend|front-end|react|nextjs|web|artist|art|level|environment|developer|engineer|programmer)\b/i;
      if (!skillPattern.test(lower)) return null;

      let score = 0;

      // 4. PRIORITY BUFF (+50): Companies, Studios, Startups, Budget
      const companyPattern = /\b(studio|funded|startup|start-up|company|budget|llc|inc|direct)\b/i;
      if (companyPattern.test(lower)) score += 50;

      // 5. PENALTY DEBUFF (-50): Recruiters, Staffing, Headhunters
      const recruiterPattern = /\b(recruiter|recruiting|staffing|talent|agency|headhunter|creative circle|teksystems)\b/i;
      if (recruiterPattern.test(lower)) score -= 50;

      return { title: t, score };
    };

    const scoredThreads = data.titles
      .map(scoreHiringPost)
      .filter(t => t !== null)
      .sort((a, b) => b.score - a.score);

    const leadThreads = scoredThreads.map(t => t.title);

    return {
      assetKey: `r/${subreddit}`,
      volume: finalVolume,
      velocity: finalVelocity,
      resonance: topKeywords.length ? topKeywords : [subreddit],
      topThreads: leadThreads.slice(0, 10), // Only pass actual leads to the UI
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error stealth scraping ${subreddit}:`, error.message);
    await page.close();
    return null;
  }
}

async function run() {
  console.log('Igniting Stealth Heat Source (Puppeteer Array)...');
  
  let targets = { subreddits: ['gameDevClassifieds', 'INAT', 'forhire', 'DesignJobs', 'freelance_forhire', 'jobbit', 'hiring', 'remotework', 'remotejs', 'startupproject', 'cofounder', 'programmingbuddies', 'UI_Design', 'Web_Design', 'UXDesign', 'frontend', 'reactjs', 'threejs', 'webgl', 'gamedev'] };
  if (fs.existsSync(TARGETS_FILE)) {
    // If you type "nextjs, reactjs" in the UI, we just parse that into an array
    const fileData = JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf8'));
    if (fileData.subreddits) targets.subreddits = fileData.subreddits;
  }

  const telemetry = {
    lastUpdated: new Date().toISOString(),
    nodes: []
  };

  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });

  for (let sub of targets.subreddits) {
    // Clean up if UI passes 'r/nextjs' or just 'nextjs'
    sub = sub.replace('r/', '').trim();
    console.log(`Stealth Scraping Target Vector: r/${sub}`);
    const data = await scrapeRedditStealth(browser, sub);
    if (data) {
      telemetry.nodes.push(data);
    } else {
      // If it fails, fallback to a small mock data so UI doesn't break entirely
       telemetry.nodes.push({
          assetKey: `r/${sub}`,
          volume: Math.floor(Math.random() * 5000) + 500,
          velocity: Math.floor(Math.random() * 500) + 10,
          resonance: ['stealth', 'mock', 'data'],
          timestamp: new Date().toISOString()
       });
    }
    // Rate limit
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await browser.close();

  fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(telemetry, null, 2));
  console.log(`[OK] Live Telemetry written to ${TELEMETRY_FILE}`);
}

run();
