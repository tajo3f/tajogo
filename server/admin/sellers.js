import { allowMethods, readJson, setNoStore } from '../_http.js';
import { requireAdmin } from '../_auth.js';
import { publicErrorCode, supabaseAuthAdmin, supabaseRest } from '../_supabase.js';
const clean=(v,n=180)=>String(v??'').trim().slice(0,n);
async function findUser(email){
  const target=clean(email,240).toLowerCase();
  for(let page=1;page<=10;page++){
    const data=await supabaseAuthAdmin(`users?page=${page}&per_page=100`);
    const users=data?.users||[]; const hit=users.find(u=>String(u.email||'').toLowerCase()===target); if(hit)return hit;
    if(users.length<100)break;
  }
  return null;
}
export default async function handler(req,res){
  setNoStore(res); if(!allowMethods(req,res,['GET','POST','PATCH']))return;
  try{
    const auth=await requireAdmin(req,res); if(!auth)return;
    if(req.method==='GET'){
      const sellers=await supabaseRest('tap_sellers?select=*&order=created_at.desc');
      const sales=await supabaseRest('tap_sales?select=seller_id,amount_cents,commission_cents,status');
      const leads=await supabaseRest('tap_seller_leads?select=seller_id,status');
      const enriched=(sellers||[]).map(s=>{const ss=(sales||[]).filter(x=>x.seller_id===s.id);const ll=(leads||[]).filter(x=>x.seller_id===s.id);return {...s,metrics:{sales:ss.length,paid_sales:ss.filter(x=>x.status==='paid').length,revenue_cents:ss.filter(x=>x.status==='paid').reduce((a,x)=>a+Number(x.amount_cents||0),0),commission_cents:ss.filter(x=>x.status==='paid').reduce((a,x)=>a+Number(x.commission_cents||0),0),leads:ll.length,won:ll.filter(x=>x.status==='fechado').length}}});
      return res.status(200).json({ok:true,sellers:enriched,sales:(sales||[])});
    }
    const body=await readJson(req);
    if(req.method==='POST'){
      const email=clean(body.email,240).toLowerCase(),full_name=clean(body.full_name,160); if(!email||!full_name)return res.status(400).json({ok:false,error:'FIELDS_REQUIRED',message:'Informe nome e e-mail.'});
      const user=await findUser(email); if(!user)return res.status(404).json({ok:false,error:'AUTH_USER_NOT_FOUND',message:'Crie primeiro a conta do vendedor no Supabase Auth.'});
      const rate=Math.min(100,Math.max(0,Number(body.commission_rate??30)));
      const rows=await supabaseRest('tap_sellers?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify({user_id:user.id,full_name,phone:clean(body.phone,40)||null,commission_rate:rate,active:true})});
      return res.status(201).json({ok:true,seller:rows?.[0]});
    }
    if(body.kind==='sale-status'){
      const saleId=clean(body.sale_id,80); const status=['paid','cancelled','pending'].includes(body.status)?body.status:'pending';
      const rows=await supabaseRest(`tap_sales?id=eq.${encodeURIComponent(saleId)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({status,updated_at:new Date().toISOString()})});
      if(!rows?.length)return res.status(404).json({ok:false,error:'SALE_NOT_FOUND',message:'Venda não encontrada.'});
      return res.status(200).json({ok:true,sale:rows[0]});
    }
    const id=clean(body.id,80); const patch={updated_at:new Date().toISOString()};
    if(body.active!==undefined)patch.active=Boolean(body.active); if(body.commission_rate!==undefined)patch.commission_rate=Math.min(100,Math.max(0,Number(body.commission_rate))); if(body.full_name!==undefined)patch.full_name=clean(body.full_name,160);
    const rows=await supabaseRest(`tap_sellers?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(patch)});
    return res.status(200).json({ok:true,seller:rows?.[0]});
  }catch(error){console.error('[admin/sellers]',{code:publicErrorCode(error),status:error?.status,detail:error?.detail});return res.status(503).json({ok:false,error:publicErrorCode(error),message:'Não foi possível gerenciar vendedores.'});}
}
