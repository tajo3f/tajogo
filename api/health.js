import { publicErrorCode, supabaseRest } from './_supabase.js';

export default async function handler(_req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  try {
    await supabaseRest('plates?select=id&limit=1', {
      method: 'GET',
      headers: { Prefer: 'count=none' }
    });

    return res.status(200).json({
      ok: true,
      service: 'tajo-tap-redirect',
      supabase: 'connected'
    });
  } catch (error) {
    console.error('[TAJO TAP health] failed', {
      errorCode: error?.code,
      status: error?.status,
      detail: error?.detail
    });

    return res.status(503).json({
      ok: false,
      service: 'tajo-tap-redirect',
      supabase: 'disconnected',
      error: publicErrorCode(error)
    });
  }
}
