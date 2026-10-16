import { allowMethods, readJson, setNoStore } from '../_http.js';
import { requireSeller } from '../_auth.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';
import { httpsUrl, normalizeEmail, smartUrl, uniqueSlug, validEmail } from '../_smart.js';
import { changePlateDestination, DESTINATION_LABELS, DESTINATION_TYPES, normalizeDestination } from '../_destination.js';

const clean=(v,n=240)=>String(v??'').trim().slice(0,n);
const LEAD_STATUS=new Set(['novo','contatado','respondeu','negociacao','proposta','fechado','perdido']);
const money=v=>Math.max(0,Math.round(Number(v||0)*100));

async function sellerLots(sid){
  const lots=await supabaseRest(`tap_plate_batches?seller_id=eq.${encodeURIComponent(sid)}&select=*&order=created_at.desc&limit=100`).catch(()=>[]);
  if(!lots?.length)return [];
  const ids=lots.map(x=>x.id).join(',');
  const plates=await supabaseRest(`tap_plates?batch_id=in.(${ids})&seller_id=eq.${encodeURIComponent(sid)}&select=id,code,name,batch_id,batch_position,status,setup_status,configuration_locked,production_status,production_status_updated_at,sold_at,delivered_at,configured_at,created_at&order=batch_position.asc`).catch(()=>[]);
  const plateIds=(plates||[]).map(p=>p.id).filter(Boolean);
  const pins=plateIds.length?await supabaseRest(`tap_plate_activation_codes?plate_id=in.(${plateIds.join(',')})&select=plate_id,admin_pin,consumed_at,locked_until`).catch(()=>[]):[];
  const pinMap=new Map((pins||[]).map(x=>[x.plate_id,x]));
  const byBatch=new Map();
  for(const p of plates||[]){
    if(!byBatch.has(p.batch_id))byBatch.set(p.batch_id,[]);
    const pin=pinMap.get(p.id)||{};
    byBatch.get(p.batch_id).push({id:p.id,code:p.code,name:p.name,position:p.batch_position,technicalStatus:p.status,setupStatus:p.setup_status,configurationLocked:Boolean(p.configuration_locked),productionStatus:p.production_status||'generated',productionStatusUpdatedAt:p.production_status_updated_at||null,soldAt:p.sold_at||null,deliveredAt:p.delivered_at||null,configuredAt:p.configured_at||null,activationPin:pin.admin_pin||null,pinConsumedAt:pin.consumed_at||null,pinLockedUntil:pin.locked_until||null});
  }
  return lots.map(l=>({
    id:l.id,code:l.batch_code,label:l.label,quantity:l.quantity,productionStatus:l.production_status||'generated',createdAt:l.created_at,assignedAt:l.assigned_at||null,model:l.model||'Padrão TAJO TAP',widthCm:Number(l.width_cm||10),heightCm:Number(l.height_cm||8),supplier:l.supplier||'',plates:byBatch.get(l.id)||[]
  }));
}

async function sellerSnapshot(auth){
  const sid=auth.seller.id;
  const [leads,sales,lots]=await Promise.all([
    supabaseRest(`tap_seller_leads?seller_id=eq.${sid}&select=*&order=created_at.desc&limit=300`),
    supabaseRest(`tap_sales?seller_id=eq.${sid}&select=*&order=sold_at.desc&limit=300`),
    sellerLots(sid)
  ]);
  const paid=(sales||[]).filter(x=>x.status==='paid');
  const allPlates=lots.flatMap(l=>l.plates||[]);
  const now=Date.now(), staleCut=now-3*86400000;
  return {
    seller:auth.seller,
    metrics:{
      leads:(leads||[]).length,
      won:(leads||[]).filter(x=>x.status==='fechado').length,
      stale_leads:(leads||[]).filter(x=>!['fechado','perdido'].includes(x.status)&&new Date(x.updated_at||x.created_at).getTime()<staleCut).length,
      sales:(sales||[]).length,
      pending_sales:(sales||[]).filter(x=>x.status==='pending').length,
      revenue_cents:paid.reduce((a,x)=>a+Number(x.amount_cents||0),0),
      commission_cents:paid.reduce((a,x)=>a+Number(x.commission_cents||0),0),
      lots:lots.length,
      inventory:allPlates.filter(p=>p.productionStatus==='in_stock').length,
      sold:allPlates.filter(p=>p.productionStatus==='sold').length,
      delivered:allPlates.filter(p=>p.productionStatus==='delivered').length,
      activated:allPlates.filter(p=>p.productionStatus==='activated').length
    },
    leads:leads||[],sales:sales||[],lots
  };
}

async function sellerPlate(sid,code){
  const rows=await supabaseRest(`tap_plates?code=eq.${encodeURIComponent(code)}&seller_id=eq.${encodeURIComponent(sid)}&select=id,code,name,batch_id,client_id,current_destination_id,production_status,status,setup_status,configuration_locked&limit=1`);
  return rows?.[0]||null;
}


async function findOrCreateClient({customerName,email,userId}){
  const existing=await supabaseRest(`tap_clients?email=eq.${encodeURIComponent(email)}&select=id,name,email&limit=1`).catch(()=>[]);
  if(existing?.[0]) return existing[0];
  const rows=await supabaseRest('tap_clients?select=id,name,email',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({name:customerName,email,status:'active',created_by:userId})});
  return rows?.[0]||null;
}

async function ensureInvite({clientId,plateId,sellerId,email}){
  const normalized=normalizeEmail(email);
  const found=await supabaseRest(`tap_client_access_invites?plate_id=eq.${encodeURIComponent(plateId)}&status=eq.pending&select=id,status&limit=1`).catch(()=>[]);
  if(found?.[0]){
    await supabaseRest(`tap_client_access_invites?id=eq.${encodeURIComponent(found[0].id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({client_id:clientId,seller_id:sellerId,email:normalized,status:'pending',claimed_at:null,claimed_by:null})}).catch(()=>null);
    return found[0].id;
  }
  const rows=await supabaseRest('tap_client_access_invites?select=id',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({client_id:clientId,plate_id:plateId,seller_id:sellerId,email:normalized,status:'pending'})});
  return rows?.[0]?.id||null;
}

async function ensureSmartPage(req,{clientId,plate,sellerId,businessName}){
  const found=await supabaseRest(`tap_smart_pages?plate_id=eq.${encodeURIComponent(plate.id)}&select=*&limit=1`).catch(()=>[]);
  if(found?.[0]) return found[0];
  const slug=await uniqueSlug(businessName);
  const rows=await supabaseRest('tap_smart_pages?select=*',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({client_id:clientId,plate_id:plate.id,created_by_seller_id:sellerId,slug,business_name:businessName,subtitle:'Sua empresa mais perto do cliente',bio:'Encontre nossos principais canais, localização e informações em um só lugar.',seller_edit_allowed:true,is_published:true})});
  return rows?.[0]||null;
}

async function setPlateDestination({plate,userId,type,url,label}){
  const out=await changePlateDestination({plate,actorUserId:userId,type,url,label});
  return out.id;
}

export default async function handler(req,res){
  setNoStore(res); if(!allowMethods(req,res,['GET','POST','PATCH','DELETE']))return;
  try{
    const auth=await requireSeller(req,res); if(!auth)return;
    if(req.method==='GET')return res.status(200).json({ok:true,...await sellerSnapshot(auth)});
    const body=await readJson(req); const kind=clean(body.kind,32);

    if(req.method==='POST'&&kind==='lead'){
      const business_name=clean(body.business_name,160); if(!business_name)return res.status(400).json({ok:false,error:'BUSINESS_REQUIRED',message:'Informe o nome do negócio.'});
      const payload={seller_id:auth.seller.id,business_name,contact_name:clean(body.contact_name,120)||null,phone:clean(body.phone,40)||null,instagram:clean(body.instagram,120)||null,city:clean(body.city,120)||null,niche:clean(body.niche,100)||null,status:LEAD_STATUS.has(body.status)?body.status:'novo',notes:clean(body.notes,1500)||null,next_contact_at:body.next_contact_at||null};
      const rows=await supabaseRest('tap_seller_leads',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)}); return res.status(201).json({ok:true,lead:rows?.[0]});
    }

    if(req.method==='PATCH'&&kind==='lead'){
      const id=clean(body.id,80),patch={updated_at:new Date().toISOString()}; if(LEAD_STATUS.has(body.status))patch.status=body.status; if(body.notes!==undefined)patch.notes=clean(body.notes,1500)||null; if(body.next_contact_at!==undefined)patch.next_contact_at=body.next_contact_at||null;
      const rows=await supabaseRest(`tap_seller_leads?id=eq.${encodeURIComponent(id)}&seller_id=eq.${auth.seller.id}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(patch)}); if(!rows?.length)return res.status(404).json({ok:false,error:'LEAD_NOT_FOUND',message:'Lead não encontrado.'}); return res.status(200).json({ok:true,lead:rows[0]});
    }

    if(req.method==='DELETE'&&kind==='lead'){
      const id=clean(body.id,80); await supabaseRest(`tap_seller_leads?id=eq.${encodeURIComponent(id)}&seller_id=eq.${auth.seller.id}`,{method:'DELETE'}); return res.status(200).json({ok:true});
    }

    if(req.method==='POST'&&kind==='sale'){
      const customer_name=clean(body.customer_name,160),customer_email=validEmail(body.customer_email),amount_cents=money(body.amount),plateCode=clean(body.plate_code,32).toUpperCase();
      if(!customer_name||!customer_email||amount_cents<=0||!plateCode)return res.status(400).json({ok:false,error:'SALE_INVALID',message:'Informe plaquinha, cliente, e-mail válido e valor da venda.'});
      const plate=await sellerPlate(auth.seller.id,plateCode); if(!plate)return res.status(404).json({ok:false,error:'PLATE_NOT_ASSIGNED',message:'Essa plaquinha não pertence a nenhum dos seus lotes.'});
      if(plate.production_status!=='in_stock')return res.status(409).json({ok:false,error:'PLATE_NOT_IN_STOCK',message:'A plaquinha precisa estar em estoque antes de registrar a venda.'});
      const client=await findOrCreateClient({customerName:customer_name,email:customer_email,userId:auth.user.id});
      if(!client?.id)throw new Error('CLIENT_CREATE_FAILED');
      const smartPage=await ensureSmartPage(req,{clientId:client.id,plate,sellerId:auth.seller.id,businessName:customer_name});
      if(!smartPage?.id)throw new Error('SMART_PAGE_CREATE_FAILED');
      const smartPageUrl=smartUrl(req,smartPage.slug);
      await ensureInvite({clientId:client.id,plateId:plate.id,sellerId:auth.seller.id,email:customer_email});
      const rate=Number(auth.seller.commission_rate||0),commission_cents=Math.round(amount_cents*rate/100),now=new Date().toISOString();
      const payload={seller_id:auth.seller.id,client_id:client.id,plate_id:plate.id,customer_name,customer_email,amount_cents,commission_rate:rate,commission_cents,status:'pending',notes:clean(body.notes,1000)||null};
      const rows=await supabaseRest('tap_sales',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
      await setPlateDestination({plate,userId:auth.user.id,type:'smart',url:smartPageUrl,label:'TAJO Smart Page'});
      await supabaseRest(`tap_plates?id=eq.${encodeURIComponent(plate.id)}&seller_id=eq.${encodeURIComponent(auth.seller.id)}&production_status=eq.in_stock`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({client_id:client.id,production_status:'sold',production_status_updated_at:now,sold_at:now,updated_at:now})});
      return res.status(201).json({ok:true,sale:rows?.[0],client:{id:client.id,email:customer_email},smartPage:{id:smartPage.id,slug:smartPage.slug,url:smartPageUrl}});
    }

    if(req.method==='PATCH'&&kind==='destination'){
      const code=clean(body.code,32).toUpperCase(),plate=await sellerPlate(auth.seller.id,code); if(!plate)return res.status(404).json({ok:false,error:'PLATE_NOT_ASSIGNED',message:'Plaquinha não encontrada nos seus lotes.'});
      const type=clean(body.type,30).toLowerCase();
      if(!DESTINATION_TYPES.has(type))return res.status(400).json({ok:false,error:'DESTINATION_TYPE_INVALID',message:'Escolha um tipo de destino válido.'});
      let url;
      try{url=normalizeDestination(type,body.value??body.url??body.destination,body.message);}catch(error){
        const messages={DESTINATION_INSTAGRAM_INVALID:'Informe um @ ou perfil válido do Instagram.',DESTINATION_WHATSAPP_INVALID:'Informe um WhatsApp válido com DDD.',DESTINATION_MAP_INVALID:'Informe um endereço ou link de localização válido.',DESTINATION_URL_INVALID:'Informe um endereço HTTPS válido.'};
        return res.status(400).json({ok:false,error:error.code||'DESTINATION_INVALID',message:messages[error.code]||'Destino inválido.'});
      }
      await setPlateDestination({plate,userId:auth.user.id,type,url,label:DESTINATION_LABELS[type]||'Destino'});
      return res.status(200).json({ok:true,code,type,url});
    }

    if(req.method==='PATCH'&&kind==='plate-delivered'){
      const code=clean(body.code,32).toUpperCase(),plate=await sellerPlate(auth.seller.id,code); if(!plate)return res.status(404).json({ok:false,error:'PLATE_NOT_ASSIGNED',message:'Plaquinha não encontrada nos seus lotes.'});
      if(plate.production_status!=='sold')return res.status(409).json({ok:false,error:'PLATE_NOT_SOLD',message:'Registre a venda antes de marcar como entregue.'});
      const now=new Date().toISOString();
      await supabaseRest(`tap_plates?id=eq.${encodeURIComponent(plate.id)}&seller_id=eq.${encodeURIComponent(auth.seller.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({production_status:'delivered',production_status_updated_at:now,delivered_at:now,updated_at:now})});
      return res.status(200).json({ok:true});
    }

    return res.status(400).json({ok:false,error:'ACTION_INVALID',message:'Ação comercial inválida.'});
  }catch(error){console.error('[seller/hub]',{code:publicErrorCode(error),status:error?.status,detail:error?.detail});return res.status(503).json({ok:false,error:publicErrorCode(error),message:'Não foi possível processar a área comercial.'});}
}
