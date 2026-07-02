const fs = require('fs');
const path = require('path');

// Local files for Volatile Storage when running locally
const TARGETS_FILE = process.env.TARGETS_FILE || path.join(process.cwd(), 'public/targets.json');
const TELEMETRY_FILE = process.env.TELEMETRY_FILE || path.join(process.cwd(), 'public/telemetry.json');

async function scrapeHackerNews(topic) {
  try {
    // Using the open, unauthenticated Algolia API for Hacker News
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(topic)}&tags=story&hitsPerPage=15`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'VortexDaemon/1.0.0 (Node.js)' }
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    let totalScore = 0;
    let totalComments = 0;
    const keywords = {};

    data.hits.forEach(post => {
      totalScore += post.points || 0;
      totalComments += post.num_comments || 0;
      
      const words = (post.title || '').toLowerCase().replace(/[^a-z0-9 ]/g, '').split(' ');
      words.forEach(w => {
        if (w.length > 4) keywords[w] = (keywords[w] || 0) + (post.points || 1);
      });
    });

    const topKeywords = Object.entries(keywords)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(k => k[0]);

    // Apply baseline modifiers so the nodes have some minimum mass if the topic is very niche
    const finalVolume = Math.max(10, totalScore);
    const finalVelocity = Math.max(2, totalComments * 2);

    return {
      assetKey: `hn/${topic}`,
      volume: finalVolume, // "Size of the orbit" (Mass/Upvotes)
      velocity: finalVelocity, // "Speed of the orbit" (Comments mean active engagement)
      resonance: topKeywords.length ? topKeywords : [topic], // The active standing wave (topics)
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error scraping HN for ${topic}:`, error.message);
    return null;
  }
}

async function run() {
  console.log('Igniting Heat Source (Hacker News Array)...');
  
  // Default targets if targets.json does not exist yet
  let targets = { subreddits: ['nextjs', 'react', 'gamedev', 'ai'] };
  if (fs.existsSync(TARGETS_FILE)) {
    targets = JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf8'));
  }

  const telemetry = {
    lastUpdated: new Date().toISOString(),
    nodes: []
  };

  // We loop through the 'subreddits' array, but treat them as generic topics
  for (const topic of targets.subreddits) {
    console.log(`Scraping Target Vector: ${topic}`);
    const data = await scrapeHackerNews(topic);
    if (data) telemetry.nodes.push(data);
    await new Promise(resolve => setTimeout(resolve, 500)); // Be nice to the API
  }

  fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(telemetry, null, 2));
  console.log(`[OK] Live Telemetry written to ${TELEMETRY_FILE}`);
}

run();
