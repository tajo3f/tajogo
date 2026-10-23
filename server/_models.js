export function mapPlate(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    client: row.client_name || 'Não vinculado',
    clientId: row.client_id || null,
    status: row.status,
    destinationType: row.destination_type || null,
    destinationLabel: row.destination_label || 'Aguardando configuração',
    destination: row.destination_url || '',
    scansToday: Number(row.scans_today || 0),
    scansMonth: Number(row.scans_month || 0),
    scansTotal: Number(row.scans_total || 0),
    qr: Number(row.qr_scans || 0),
    nfc: Number(row.nfc_scans || 0),
    createdAt: row.created_at || null,
    activatedAt: row.activated_at || null,
    ownerUserId: row.owner_user_id || null,
    setupStatus: row.setup_status || (row.status === 'active' ? 'completed' : 'pending'),
    configurationLocked: Boolean(row.configuration_locked),
    configuredAt: row.configured_at || null,
    claimedAt: row.claimed_at || null,
    operatorId: row.operator_id || null,
    assetKind: row.asset_kind || 'smart_plate'
  };
}

export function mapClient(row) {
  if (!row) return null;
  const cityState = [row.city, row.state].filter(Boolean).join(' — ');
  return {
    id: row.id,
    name: row.name,
    contact: row.contact_name || '',
    phone: row.phone || '',
    email: row.email || '',
    city: cityState,
    state: row.state || '',
    plates: Number(row.plates_count || 0),
    scans: Number(row.scans_total || 0),
    status: row.status || 'active',
    operatorId: row.operator_id || null
  };
}
