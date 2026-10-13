import { allowMethods, readJson, setNoStore } from '../_http.js';
import { requireSeller } from '../_auth.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

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
  const rows=await supabaseRest(`tap_plates?code=eq.${encodeURIComponent(code)}&seller_id=eq.${encodeURIComponent(sid)}&select=id,code,name,batch_id,production_status,status,setup_status,configuration_locked&limit=1`);
  return rows?.[0]||null;
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
      const customer_name=clean(body.customer_name,160),amount_cents=money(body.amount),plateCode=clean(body.plate_code,32).toUpperCase();
      if(!customer_name||amount_cents<=0||!plateCode)return res.status(400).json({ok:false,error:'SALE_INVALID',message:'Informe plaquinha, cliente e valor da venda.'});
      const plate=await sellerPlate(auth.seller.id,plateCode); if(!plate)return res.status(404).json({ok:false,error:'PLATE_NOT_ASSIGNED',message:'Essa plaquinha não pertence a nenhum dos seus lotes.'});
      if(plate.production_status!=='in_stock')return res.status(409).json({ok:false,error:'PLATE_NOT_IN_STOCK',message:'A plaquinha precisa estar em estoque antes de registrar a venda.'});
      const rate=Number(auth.seller.commission_rate||0),commission_cents=Math.round(amount_cents*rate/100),now=new Date().toISOString();
      const payload={seller_id:auth.seller.id,plate_id:plate.id,customer_name,amount_cents,commission_rate:rate,commission_cents,status:'pending',notes:clean(body.notes,1000)||null};
      const rows=await supabaseRest('tap_sales',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
      await supabaseRest(`tap_plates?id=eq.${encodeURIComponent(plate.id)}&seller_id=eq.${encodeURIComponent(auth.seller.id)}&production_status=eq.in_stock`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({production_status:'sold',production_status_updated_at:now,sold_at:now,updated_at:now})});
      return res.status(201).json({ok:true,sale:rows?.[0]});
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
