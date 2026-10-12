import { allowMethods, readJson, setNoStore } from '../_http.js';
import { requireSellerOrAdmin } from '../_auth.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';
const clean=(v,n=1200)=>String(v??'').trim().slice(0,n);
export default async function handler(req,res){
  setNoStore(res); if(!allowMethods(req,res,['GET','POST'])) return;
  try{
    const auth=await requireSellerOrAdmin(req,res); if(!auth)return;
    if(req.method==='GET'){
      const after=clean(req.query?.after,80);
      const filter=after?`&created_at=gt.${encodeURIComponent(after)}`:'';
      const rows=await supabaseRest(`tap_seller_chat_messages?select=id,sender_user_id,sender_name,sender_role,body,created_at${filter}&order=created_at.asc&limit=120`);
      return res.status(200).json({ok:true,messages:rows||[],server_time:new Date().toISOString()});
    }
    const body=await readJson(req); const text=clean(body.body);
    if(!text) return res.status(400).json({ok:false,error:'MESSAGE_REQUIRED',message:'Digite uma mensagem.'});
    const payload={sender_user_id:auth.user.id,sender_seller_id:auth.role==='seller'?auth.seller.id:null,sender_name:auth.userName||auth.seller?.full_name||auth.user.email?.split('@')[0]||'TAJO',sender_role:auth.role,body:text};
    const rows=await supabaseRest('tap_seller_chat_messages',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
    return res.status(201).json({ok:true,message:rows?.[0]});
  }catch(error){console.error('[seller/chat]',{code:publicErrorCode(error),status:error?.status});return res.status(503).json({ok:false,error:publicErrorCode(error),message:'Não foi possível atualizar o chat.'});}
}
