// Vercel API Proxy per Google Apps Script
// Gestisce le chiamate a Google Apps Script evitando problemi CORS

import type { VercelRequest, VercelResponse } from '@vercel/node';

const APPS_SCRIPT_URL = process.env.VITE_APPS_SCRIPT_URL;

if (!APPS_SCRIPT_URL) {
  throw new Error('Missing VITE_APPS_SCRIPT_URL environment variable');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Aggiungi header CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Gestisci preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action } = req.query;
    const url = `${APPS_SCRIPT_URL}?action=${action}`;

    const response = await fetch(url, {
      method: req.method as string,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`Apps Script error: ${response.statusText}`);
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error: any) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
