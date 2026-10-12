import { publicErrorCode, supabaseAuth, supabaseRest } from './_supabase.js';

export default async function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  try {
    await Promise.all([
      supabaseRest('tap_plates?select=id&limit=1', { method: 'GET' }),
      supabaseAuth('settings', { method: 'GET' })
    ]);
    return res.status(200).json({ ok: true, service: 'tajo-tap-backend', database: 'connected', auth: 'connected', runtime: process.version });
  } catch (error) {
    console.error('[TAJO TAP health] failed', { errorCode: error?.code, status: error?.status, detail: error?.detail });
    return res.status(503).json({ ok: false, service: 'tajo-tap-backend', error: publicErrorCode(error), runtime: process.version });
  }
}
