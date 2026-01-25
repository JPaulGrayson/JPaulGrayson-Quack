/**
 * Quack Webhook Store
 * Register webhooks to receive push notifications when messages arrive
 */

import fs from 'fs';
import path from 'path';

const WEBHOOK_FILE = './data/webhooks.json';

interface Webhook {
  id: string;
  inbox: string;
  url: string;
  secret?: string;
  createdAt: string;
  lastTriggered?: string;
  failCount: number;
}

const webhooks: Map<string, Webhook> = new Map();

export function initWebhooks(): void {
  try {
    const dir = path.dirname(WEBHOOK_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (fs.existsSync(WEBHOOK_FILE)) {
      const data = JSON.parse(fs.readFileSync(WEBHOOK_FILE, 'utf-8'));
      for (const webhook of data) {
        webhooks.set(webhook.id, webhook);
      }
      console.log(`🔔 Loaded ${webhooks.size} webhooks`);
    }
  } catch (err) {
    console.error('Failed to load webhooks:', err);
  }
}

function persistWebhooks(): void {
  try {
    const data = Array.from(webhooks.values());
    fs.writeFileSync(WEBHOOK_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to persist webhooks:', err);
  }
}

function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === 'localhost' || 
        hostname === '127.0.0.1' || 
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('172.16.') ||
        hostname.startsWith('172.17.') ||
        hostname.startsWith('172.18.') ||
        hostname.startsWith('172.19.') ||
        hostname.startsWith('172.2') ||
        hostname.startsWith('172.30.') ||
        hostname.startsWith('172.31.') ||
        hostname.startsWith('169.254.') ||
        hostname.startsWith('100.64.') ||
        hostname.startsWith('fc') ||
        hostname.startsWith('fd') ||
        hostname.startsWith('fe80')) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function registerWebhook(inbox: string, url: string, secret?: string): Webhook {
  if (!isValidWebhookUrl(url)) {
    throw new Error('Invalid webhook URL: must be a public HTTPS URL');
  }
  
  const id = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const webhook: Webhook = {
    id,
    inbox: inbox.toLowerCase(),
    url,
    secret,
    createdAt: new Date().toISOString(),
    failCount: 0,
  };
  
  webhooks.set(id, webhook);
  persistWebhooks();
  
  console.log(`🔔 Webhook ${id} registered for /${inbox}`);
  return webhook;
}

export function removeWebhook(id: string): boolean {
  const deleted = webhooks.delete(id);
  if (deleted) {
    persistWebhooks();
    console.log(`🔕 Webhook ${id} removed`);
  }
  return deleted;
}

export function getWebhooksForInbox(inbox: string): Webhook[] {
  return Array.from(webhooks.values()).filter(
    w => w.inbox === inbox.toLowerCase() || w.inbox === '*'
  );
}

export function listWebhooks(): Webhook[] {
  return Array.from(webhooks.values());
}

export async function triggerWebhooks(inbox: string, message: any, eventType: 'message.received' | 'message.approved' = 'message.received'): Promise<void> {
  const hooks = getWebhooksForInbox(inbox);
  
  for (const hook of hooks) {
    try {
      const payload = {
        event: eventType,
        inbox,
        message: {
          id: message.id,
          from: message.from,
          task: message.task,
          timestamp: message.timestamp,
          status: message.status,
          hasFiles: message.files?.length > 0,
        },
      };
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (hook.secret) {
        headers['X-Quack-Secret'] = hook.secret;
      }
      
      const response = await fetch(hook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        hook.lastTriggered = new Date().toISOString();
        hook.failCount = 0;
        console.log(`🔔 Webhook ${hook.id} triggered successfully`);
      } else {
        hook.failCount++;
        console.log(`⚠️ Webhook ${hook.id} failed: ${response.status}`);
      }
      
      persistWebhooks();
    } catch (err) {
      hook.failCount++;
      console.error(`⚠️ Webhook ${hook.id} error:`, err);
      persistWebhooks();
    }
  }
}
