const fs = require('fs');
const path = require('path');

// Local files for Volatile Storage when running locally
const TARGETS_FILE = process.env.TARGETS_FILE || path.join(process.cwd(), 'public/targets.json');
const TELEMETRY_FILE = process.env.TELEMETRY_FILE || path.join(process.cwd(), 'public/telemetry.json');

async function scrapeReddit(subreddit) {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=15`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'VortexDaemon/1.0.0 (Node.js)' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    let totalScore = 0;
    let totalComments = 0;
    const keywords = {};

    data.data.children.forEach(post => {
      const p = post.data;
      totalScore += p.score;
      totalComments += p.num_comments;
      
      const words = p.title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
      words.forEach(w => {
        if (w.length > 4) keywords[w] = (keywords[w] || 0) + p.score;
      });
    });

    const topKeywords = Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(k => k[0]);

    return {
      assetKey: `r/${subreddit}`,
      volume: totalScore, // "Size of the orbit" (Mass/Upvotes)
      velocity: totalComments * 2, // "Speed of the orbit" (Comments mean active engagement)
      resonance: topKeywords, // The active standing wave (topics)
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error scraping ${subreddit}:`, error.message);
    console.log(`[MOCK] Generating simulated thermodynamic data for ${subreddit}...`);
    // Fallback to mock data for UI prototyping since Reddit blocks unauthenticated scrapers
    return {
      assetKey: `r/${subreddit}`,
      volume: Math.floor(Math.random() * 5000) + 500, // Simulated Mass/Upvotes
      velocity: Math.floor(Math.random() * 500) + 10, // Simulated Speed/Comments
      resonance: [`mock_topic_1`, `mock_topic_2`, `mock_topic_3`],
      timestamp: new Date().toISOString()
    };
  }
}

async function run() {
  console.log('Igniting Heat Source...');
  
  // Default targets if targets.json does not exist yet
  let targets = { subreddits: ['nextjs', 'reactjs', 'gamedev', 'webdev'] };
  if (fs.existsSync(TARGETS_FILE)) {
    targets = JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf8'));
  } else {
    fs.writeFileSync(TARGETS_FILE, JSON.stringify(targets, null, 2));
  }

  const telemetry = {
    lastUpdated: new Date().toISOString(),
    nodes: []
  };

  for (const sub of targets.subreddits) {
    console.log(`Scraping Target: r/${sub}`);
    const data = await scrapeReddit(sub);
    if (data) telemetry.nodes.push(data);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
  }

  fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(telemetry, null, 2));
  console.log(`[OK] Telemetry written to ${TELEMETRY_FILE}`);
}

run();
