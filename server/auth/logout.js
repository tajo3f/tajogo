import { allowMethods, setNoStore } from '../_http.js';
import { clearSessionCookies } from '../_auth.js';

export default async function handler(req, res) {
  setNoStore(res);
  if (!allowMethods(req, res, ['POST'])) return;
  clearSessionCookies(res);
  return res.status(200).json({ ok: true });
}
