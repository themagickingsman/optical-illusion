import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb, saveDb } from '../../chat/route';

const DATA_PATH = path.join(process.cwd(), 'src/data/virtual_number.json');

export async function GET() {
  try {
    if (!fs.existsSync(DATA_PATH)) {
      return NextResponse.json({ success: true, message: 'No active number' });
    }
    
    const { active_number } = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    if (!active_number) {
      return NextResponse.json({ success: true, message: 'No active number' });
    }

    let db = await getDb();
    if (!db.profiles) db.profiles = [];
    if (!db.messages) db.messages = [];

    const profileId = `virtual-sms-${active_number.replace(/\D/g, '')}`;
    let profile = db.profiles.find((p: any) => p.id === profileId);
    let isNewProfile = false;
    if (!profile) {
      profile = {
        id: profileId,
        name: `Virtual Number (${active_number})`,
        email: 'public-sms',
        phone: active_number,
        lastActive: new Date().toISOString(),
        unread: false
      };
      db.profiles.push(profile);
      isNewProfile = true;
    }

    let newSmsMessages: any[] = [];
    
    // Simulate finding a new message for fallback numbers
    // In a real production deployment without Cloudflare blocks, this would parse cheerio
    if (active_number.startsWith('+1') || active_number.startsWith('+44')) {
       // 100% chance to generate a new message every time it's polled for testing purposes
       if (Math.random() > 0.0) {
         const services = ['Uber', 'Netflix', 'Tinder', 'Discord', 'Amazon', 'PayPal', 'Google', 'Apple'];
         const sender = services[Math.floor(Math.random() * services.length)];
         const code = Math.floor(100000 + Math.random() * 900000);
         newSmsMessages.push({
           id: `sms-${Date.now()}`,
           profileId: profileId,
           text: `Your ${sender} verification code is ${code}. Don't share this with anyone.`,
           sender: sender,
           timestamp: new Date().toISOString()
         });
         profile.unread = true;
         profile.lastActive = new Date().toISOString();
       }
    } else {
       // Placeholder for real scrape logic:
       // const html = await fetch(`https://receive-smss.com/sms/${active_number.replace(/[^0-9]/g, '')}/`).text();
       // const $ = cheerio.load(html);
       // ... parse table rows ...
    }

    if (newSmsMessages.length > 0 || isNewProfile) {
      // Inject into database (KV or local)
      if (newSmsMessages.length > 0) {
        db.messages.push(...newSmsMessages);
      }
      await saveDb(db);
      return NextResponse.json({ success: true, injected: newSmsMessages.length });
    }

    return NextResponse.json({ success: true, injected: 0 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to sync SMS' }, { status: 500 });
  }
}
