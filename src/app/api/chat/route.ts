import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';

const dbPath = path.join(process.cwd(), 'src', 'data', 'chat_db.json');

async function getDb() {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/chat_db`, {
        headers: {
          Authorization: `Bearer ${kvToken}`,
        },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.result) {
        return typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      }
    } catch (e) {
      console.error('KV getDb failed:', e);
    }
    return { profiles: [], messages: [], ndaLinks: [] };
  }

  // Local fallback
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return { profiles: [], messages: [], ndaLinks: [] };
  }
}

async function saveDb(data: any) {
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (kvUrl && kvToken) {
    try {
      await fetch(`${kvUrl}/set/chat_db`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${kvToken}`,
        },
        body: JSON.stringify(data)
      });
      return;
    } catch (e) {
      console.error('KV saveDb failed:', e);
    }
  }

  // Local fallback
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET() {
  const db = await getDb();
  return NextResponse.json({ 
    profiles: db.profiles || [], 
    messages: db.messages || [],
    ndaLinks: db.ndaLinks || [],
    emailTemplate: db.emailTemplate || "",
    emailSubject: db.emailSubject || ""
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = await getDb();
    
    if (!db.ndaLinks) db.ndaLinks = [];
    if (!db.profiles) db.profiles = [];
    if (!db.messages) db.messages = [];

    // --- Legacy CMS Action Support ---
    if (body.action === 'save_template') {
      db.emailTemplate = body.template;
      db.emailSubject = body.subject;
    }
    else if (body.action === 'update_email') {
      const p = db.profiles.find((x: any) => x.id === body.profileId);
      if (p) p.email = body.email;
    }
    else if (body.action === 'admin_reply') {
      const { profileId, text } = body;
      db.messages.push({
        id: Date.now().toString(),
        profileId,
        sender: 'admin',
        text,
        timestamp: new Date().toISOString()
      });
      // Update lastActive
      const p = db.profiles.find((x: any) => x.id === profileId);
      if (p) {
        p.lastActive = new Date().toISOString();
        
        // Send email via Gmail Nodemailer if available
        if (p.email && process.env.GMAIL_EMAIL && process.env.GMAIL_APP_PASSWORD) {
          try {
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.GMAIL_EMAIL,
                pass: process.env.GMAIL_APP_PASSWORD
              }
            });
            
            const template = db.emailTemplate || "Hi there,\n\n{{message}}\n\nThanks,\nOptical Illusions";
            const emailBody = template.replace('{{message}}', text);
            
            await transporter.sendMail({
              from: `"Optical Illusions" <${process.env.GMAIL_EMAIL}>`,
              to: p.email,
              subject: db.emailSubject || 'New message from Optical Illusions',
              text: emailBody
            });
          } catch (emailErr) {
            console.error("Failed to send email:", emailErr);
          }
        }
      }
    }
    else if (body.action === 'delete_message') {
      db.messages = db.messages.filter((m: any) => m.id !== body.messageId);
    }
    else if (body.action === 'delete_profile') {
      db.profiles = db.profiles.filter((p: any) => p.id !== body.profileId);
      db.messages = db.messages.filter((m: any) => m.profileId !== body.profileId);
      db.ndaLinks = db.ndaLinks.filter((n: any) => n.sessionId !== body.profileId);
    }
    
    // --- Frontend App Action Support ---
    else if (body.type === 'message') {
      db.messages.push(body.payload);
      
      const profile = db.profiles.find((p: any) => p.id === body.payload.profileId);
      if (profile) {
        profile.lastActive = new Date().toISOString();
      }
    } 
    else if (body.type === 'profile') {
      const existing = db.profiles.find((p: any) => p.id === body.payload.id);
      if (!existing) {
        db.profiles.push(body.payload);
      }
    } 
    else if (body.type === 'delete_message') {
      db.messages = db.messages.filter((m: any) => m.id !== body.payload.id);
    }
    else if (body.type === 'nda') {
      db.ndaLinks.push(body.payload);
    }
    
    await saveDb(db);
    return NextResponse.json({ success: true, db });
  } catch (error) {
    console.error('Failed to post chat:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
