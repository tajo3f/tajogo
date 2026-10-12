import { allowMethods, readJson, setNoStore } from '../_http.js';
import { requireSeller } from '../_auth.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

const clean = (v, n=240) => String(v ?? '').trim().slice(0,n);
const LEAD_STATUS = new Set(['novo','contatado','respondeu','negociacao','proposta','fechado','perdido']);
const SALE_STATUS = new Set(['pending','paid','cancelled']);
const money = v => Math.max(0, Math.round(Number(v || 0) * 100));

async function sellerSnapshot(auth) {
  const sid = auth.seller.id;
  const [leads, sales] = await Promise.all([
    supabaseRest(`tap_seller_leads?seller_id=eq.${sid}&select=*&order=created_at.desc&limit=200`),
    supabaseRest(`tap_sales?seller_id=eq.${sid}&select=*&order=sold_at.desc&limit=200`)
  ]);
  const paid = sales.filter(x=>x.status==='paid');
  return {
    seller: auth.seller,
    metrics: {
      leads: leads.length,
      won: leads.filter(x=>x.status==='fechado').length,
      sales: sales.length,
      revenue_cents: paid.reduce((a,x)=>a+Number(x.amount_cents||0),0),
      commission_cents: paid.reduce((a,x)=>a+Number(x.commission_cents||0),0)
    }, leads, sales
  };
}

export default async function handler(req,res){
  setNoStore(res);
  if(!allowMethods(req,res,['GET','POST','PATCH','DELETE'])) return;
  try {
    const auth = await requireSeller(req,res); if(!auth) return;
    if(req.method==='GET') return res.status(200).json({ok:true,...await sellerSnapshot(auth)});
    const body = await readJson(req);
    const kind = clean(body.kind,32);
    if(req.method==='POST' && kind==='lead'){
      const business_name=clean(body.business_name,160); if(!business_name) return res.status(400).json({ok:false,error:'BUSINESS_REQUIRED',message:'Informe o nome do negócio.'});
      const payload={seller_id:auth.seller.id,business_name,contact_name:clean(body.contact_name,120)||null,phone:clean(body.phone,40)||null,instagram:clean(body.instagram,120)||null,city:clean(body.city,120)||null,niche:clean(body.niche,100)||null,status:LEAD_STATUS.has(body.status)?body.status:'novo',notes:clean(body.notes,1500)||null,next_contact_at:body.next_contact_at||null};
      const rows=await supabaseRest('tap_seller_leads',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
      return res.status(201).json({ok:true,lead:rows?.[0]});
    }
    if(req.method==='PATCH' && kind==='lead'){
      const id=clean(body.id,80); const patch={updated_at:new Date().toISOString()};
      if(LEAD_STATUS.has(body.status)) patch.status=body.status;
      if(body.notes!==undefined) patch.notes=clean(body.notes,1500)||null;
      if(body.next_contact_at!==undefined) patch.next_contact_at=body.next_contact_at||null;
      const rows=await supabaseRest(`tap_seller_leads?id=eq.${encodeURIComponent(id)}&seller_id=eq.${auth.seller.id}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(patch)});
      if(!rows?.length) return res.status(404).json({ok:false,error:'LEAD_NOT_FOUND',message:'Lead não encontrado.'});
      return res.status(200).json({ok:true,lead:rows[0]});
    }
    if(req.method==='DELETE' && kind==='lead'){
      const id=clean(body.id,80); await supabaseRest(`tap_seller_leads?id=eq.${encodeURIComponent(id)}&seller_id=eq.${auth.seller.id}`,{method:'DELETE'});
      return res.status(200).json({ok:true});
    }
    if(req.method==='POST' && kind==='sale'){
      const customer_name=clean(body.customer_name,160); const amount_cents=money(body.amount);
      if(!customer_name||amount_cents<=0) return res.status(400).json({ok:false,error:'SALE_INVALID',message:'Informe cliente e valor da venda.'});
      const rate=Number(auth.seller.commission_rate||0); const commission_cents=Math.round(amount_cents*rate/100);
      const payload={seller_id:auth.seller.id,customer_name,amount_cents,commission_rate:rate,commission_cents,status:'pending',notes:clean(body.notes,1000)||null};
      const rows=await supabaseRest('tap_sales',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
      return res.status(201).json({ok:true,sale:rows?.[0]});
    }
    return res.status(400).json({ok:false,error:'ACTION_INVALID',message:'Ação comercial inválida.'});
  } catch(error){ console.error('[seller/hub]',{code:publicErrorCode(error),status:error?.status}); return res.status(503).json({ok:false,error:publicErrorCode(error),message:'Não foi possível processar a área comercial.'}); }
}
