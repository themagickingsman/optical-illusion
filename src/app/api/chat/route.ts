import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import nodemailer from 'nodemailer';

const dbPath = path.join(process.cwd(), 'src', 'data', 'chat_db.json');

export const dynamic = 'force-dynamic';

export async function getDb() {
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

export async function saveDb(data: any) {
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const asAdmin = searchParams.get('asAdmin');

  const db = await getDb();
  
  // Return full DB for Admin views
  if (asAdmin === 'true') {
    return NextResponse.json({ 
      profiles: db.profiles || [], 
      messages: db.messages || [],
      ndaLinks: db.ndaLinks || [],
      emailTemplate: db.emailTemplate || "",
      emailSubject: db.emailSubject || "",
      welcomeMessage: db.welcomeMessage || "Welcome to the secure channel.",
      autoReplyMessage: db.autoReplyMessage || "Message Received\nCurrent response time: 1 hour",
      welcomeMessages: db.welcomeMessages || (db.welcomeMessage ? [db.welcomeMessage] : ["Welcome to the secure channel."]),
      autoReplyMessages: db.autoReplyMessages || (db.autoReplyMessage ? [db.autoReplyMessage] : ["Message Received\nCurrent response time: 1 hour"])
    });
  }

  // For public users, strictly filter by their active sessionId
  if (sessionId) {
    const filteredProfiles = (db.profiles || []).filter((p: any) => p.id === sessionId);
    const filteredMessages = (db.messages || []).filter((m: any) => m.profileId === sessionId);
    return NextResponse.json({ 
      profiles: filteredProfiles, 
      messages: filteredMessages,
      ndaLinks: [], // Don't expose NDA links to users
      welcomeMessage: db.welcomeMessage || "Welcome to the secure channel.",
      autoReplyMessage: db.autoReplyMessage || "Message Received\nCurrent response time: 1 hour",
      welcomeMessages: db.welcomeMessages || (db.welcomeMessage ? [db.welcomeMessage] : ["Welcome to the secure channel."]),
      autoReplyMessages: db.autoReplyMessages || (db.autoReplyMessage ? [db.autoReplyMessage] : ["Message Received\nCurrent response time: 1 hour"])
    });
  }

  // If no session ID provided and not admin, return empty
  return NextResponse.json({ profiles: [], messages: [] });
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
    else if (body.action === 'update_auto_messages') {
      db.welcomeMessage = body.welcomeMessage;
      db.autoReplyMessage = body.autoReplyMessage;
      if (body.welcomeMessages) db.welcomeMessages = body.welcomeMessages;
      if (body.autoReplyMessages) db.autoReplyMessages = body.autoReplyMessages;
    }
    else if (body.action === 'update_email') {
      const p = db.profiles.find((x: any) => x.id === body.profileId);
      if (p) p.email = body.email;
    }
    else if (body.action === 'update_name') {
      const p = db.profiles.find((x: any) => x.id === body.profileId);
      if (p) p.name = body.name;
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
    else if (body.action === 'mark_read') {
      const p = db.profiles.find((x: any) => x.id === body.profileId);
      if (p) p.unread = false;
    }
    
    // --- Frontend App Action Support ---
    let resolvedProfileId = null;

    if (body.type === 'message') {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      let profileId = body.payload.profileId;

      // Unify sessions: If a non-admin IP is known, override the frontend's random session ID with the existing persistent profile ID.
      if (ip !== 'unknown' && ip !== '::1' && ip !== '127.0.0.1') {
        const existingProfile = db.profiles.find((p: any) => p.ip === ip);
        if (existingProfile) {
          profileId = existingProfile.id;
          body.payload.profileId = profileId; // Force the message to attach to the old profile
        }
      }

      db.messages.push(body.payload);
      
      const profile = db.profiles.find((p: any) => p.id === profileId);
      if (profile) {
        profile.lastActive = new Date().toISOString();
        if (!profile.ip) profile.ip = ip;
        if (body.payload.sender === 'user') {
          profile.unread = true;
        }
      }
      resolvedProfileId = profileId;
    } 
    else if (body.type === 'profile') {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      let profileId = body.payload.id;

      if (ip !== 'unknown' && ip !== '::1' && ip !== '127.0.0.1') {
        const existingProfile = db.profiles.find((p: any) => p.ip === ip);
        if (existingProfile) {
          // A profile already exists for this IP. Ignore the new profile creation.
          return NextResponse.json({ success: true, activeProfileId: existingProfile.id });
        }
      }

      const existing = db.profiles.find((p: any) => p.id === profileId);
      if (!existing) {
        body.payload.ip = ip;
        db.profiles.push(body.payload);
      }
      resolvedProfileId = existing ? existing.id : profileId;
    } 
    else if (body.type === 'typing') {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      let profileId = body.payload.id;

      if (ip !== 'unknown' && ip !== '::1' && ip !== '127.0.0.1') {
        const existingProfile = db.profiles.find((p: any) => p.ip === ip);
        if (existingProfile) {
          profileId = existingProfile.id;
        }
      }

      const existing = db.profiles.find((p: any) => p.id === profileId);
      if (existing) {
        existing.lastTyping = new Date().toISOString();
      }
      resolvedProfileId = profileId;
    }
    else if (body.type === 'delete_message') {
      db.messages = db.messages.filter((m: any) => m.id !== body.payload.id);
    }
    else if (body.type === 'nda') {
      db.ndaLinks.push(body.payload);
    }
    
    await saveDb(db);
    return NextResponse.json({ success: true, activeProfileId: resolvedProfileId });
  } catch (error) {
    console.error('Failed to post chat:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
