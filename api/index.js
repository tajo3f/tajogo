import authLogin from '../server/auth/login.js';
import authLogout from '../server/auth/logout.js';
import authMe from '../server/auth/me.js';
import adminClients from '../server/admin/clients.js';
import adminDestination from '../server/admin/destination.js';
import adminPlate from '../server/admin/plate.js';
import adminPlates from '../server/admin/plates.js';
import clientDestination from '../server/client/destination.js';
import clientPlates from '../server/client/plates.js';
import publicActivate from '../server/public/activate.js';
import publicActivationLogin from '../server/public/activation-login.js';
import publicPlate from '../server/public/plate.js';
import resolvePlate from '../server/resolve.js';
import health from '../server/health.js';
import sellerHub from '../server/seller/hub.js';
import sellerChat from '../server/seller/chat.js';
import adminSellers from '../server/admin/sellers.js';
import adminBatches from '../server/admin/batches.js';
import adminPlateBulk from '../server/admin/plate-bulk.js';

const ROUTES = new Map([
  ['auth/login', authLogin],
  ['auth/logout', authLogout],
  ['auth/me', authMe],
  ['admin/clients', adminClients],
  ['admin/destination', adminDestination],
  ['admin/plate', adminPlate],
  ['admin/plates', adminPlates],
  ['client/destination', clientDestination],
  ['client/plates', clientPlates],
  ['public/activate', publicActivate],
  ['public/activation-login', publicActivationLogin],
  ['public/plate', publicPlate],
  ['resolve', resolvePlate],
  ['health', health],
  ['seller/hub', sellerHub],
  ['seller/chat', sellerChat],
  ['admin/sellers', adminSellers],
  ['admin/batches', adminBatches],
  ['admin/plates/bulk-delete', adminPlateBulk]
]);

function routeName(value) {
  const raw = Array.isArray(value) ? value[0] : value;
  return String(raw || '').trim().replace(/^\/+|\/+$/g, '');
}

export default async function handler(req, res) {
  const route = routeName(req.query?.route);
  const target = ROUTES.get(route);

  if (!target) {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return res.status(404).json({
      ok: false,
      error: 'API_ROUTE_NOT_FOUND',
      message: 'Rota da API não encontrada.'
    });
  }

  return target(req, res);
}
