import crypto from 'node:crypto';
import { allowMethods, apiError, readJson, setNoStore, text } from '../_http.js';
import { requireAdmin } from '../_auth.js';
import { publicErrorCode, supabaseAuthAdmin, supabaseRest } from '../_supabase.js';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const BATCH_STAGES = new Set(['generated','sent_to_print','produced','in_stock','cancelled']);
const PLATE_STAGES = ['generated','sent_to_print','produced','in_stock','sold','delivered','activated'];

function randomPlateCode(){ let value='TT-'; for(let i=0;i<6;i+=1)value+=CHARS[crypto.randomInt(0,CHARS.length)]; return value; }
function activationPin(){ return String(crypto.randomInt(100000,1000000)); }
function hashPin(pin){ return crypto.createHash('sha256').update(pin,'utf8').digest('hex'); }
function batchCode(){ const now=new Date(); const stamp=[now.getUTCFullYear(),String(now.getUTCMonth()+1).padStart(2,'0'),String(now.getUTCDate()).padStart(2,'0')].join(''); let suffix=''; for(let i=0;i<4;i+=1)suffix+=CHARS[crypto.randomInt(0,CHARS.length)]; return `LOT-${stamp}-${suffix}`; }
function cents(v){ const n=Number(String(v??'').replace(',','.')); return Number.isFinite(n)&&n>=0?Math.round(n*100):0; }
function ntext(v,n=180){ return String(v??'').trim().slice(0,n); }

async function findAuthUserByEmail(email){
  const target=ntext(email,320).toLowerCase(); if(!target)return null;
  for(let page=1;page<=10;page+=1){
    const data=await supabaseAuthAdmin(`users?page=${page}&per_page=100`);
    const users=data?.users||[]; const hit=users.find(u=>String(u.email||'').toLowerCase()===target); if(hit)return hit;
    if(users.length<100)break;
  }
  return null;
}

async function resolveSellerByEmail(email){
  const clean=ntext(email,320).toLowerCase(); if(!clean)return null;
  const user=await findAuthUserByEmail(clean); if(!user)return null;
  const rows=await supabaseRest(`tap_sellers?user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&select=id,user_id,full_name,phone,commission_rate,active&limit=1`);
  if(!rows?.[0])return null;
  return {...rows[0],email:clean};
}

async function generateUniqueCodes(quantity){
  const codes=new Set(); while(codes.size<quantity)codes.add(randomPlateCode());
  const current=[...codes]; const rows=await supabaseRest(`tap_plates?code=in.(${current.join(',')})&select=code`).catch(()=>[]);
  const collisions=new Set((rows||[]).map(r=>r.code)); if(!collisions.size)return current;
  for(const code of collisions)codes.delete(code); while(codes.size<quantity)codes.add(randomPlateCode()); return [...codes];
}

function summarizeStages(plates){
  const summary=Object.fromEntries(PLATE_STAGES.map(s=>[s,0]));
  for(const p of plates||[]){ if(summary[p.production_status]!==undefined)summary[p.production_status]+=1; }
  return summary;
}

async function listBatches(){
  const batches=await supabaseRest('tap_plate_batches?select=*&order=created_at.desc&limit=100');
  if(!batches?.length)return [];
  const ids=batches.map(b=>b.id).join(',');
  const plates=await supabaseRest(`tap_plates?batch_id=in.(${ids})&select=id,code,name,status,setup_status,configuration_locked,batch_id,batch_position,created_at,seller_id,production_status,production_status_updated_at,sent_to_print_at,produced_at,in_stock_at,sold_at,delivered_at&order=batch_position.asc`);
  const plateIds=(plates||[]).map(p=>p.id).filter(Boolean);
  const activationRows=plateIds.length?await supabaseRest(`tap_plate_activation_codes?plate_id=in.(${plateIds.join(',')})&select=plate_id,admin_pin,consumed_at,locked_until`).catch(()=>[]):[];
  const sellerIds=[...new Set((batches||[]).map(b=>b.seller_id).filter(Boolean))];
  const sellers=sellerIds.length?await supabaseRest(`tap_sellers?id=in.(${sellerIds.join(',')})&select=id,full_name,user_id,phone,commission_rate,active`).catch(()=>[]):[];
  const sellerMap=new Map((sellers||[]).map(s=>[s.id,s]));
  const activationByPlate=new Map((activationRows||[]).map(r=>[r.plate_id,r]));
  const byBatch=new Map();
  for(const plate of plates||[]){
    if(!byBatch.has(plate.batch_id))byBatch.set(plate.batch_id,[]);
    byBatch.get(plate.batch_id).push({
      id:plate.id,code:plate.code,name:plate.name,status:plate.status,setupStatus:plate.setup_status,configurationLocked:Boolean(plate.configuration_locked),position:plate.batch_position,createdAt:plate.created_at,
      sellerId:plate.seller_id||null,productionStatus:plate.production_status||'generated',productionStatusUpdatedAt:plate.production_status_updated_at||null,
      sentToPrintAt:plate.sent_to_print_at||null,producedAt:plate.produced_at||null,inStockAt:plate.in_stock_at||null,soldAt:plate.sold_at||null,deliveredAt:plate.delivered_at||null,
      activationCode:activationByPlate.get(plate.id)?.admin_pin||null,pinConsumedAt:activationByPlate.get(plate.id)?.consumed_at||null,pinLockedUntil:activationByPlate.get(plate.id)?.locked_until||null
    });
  }
  return batches.map(batch=>{
    const batchPlates=byBatch.get(batch.id)||[]; const seller=sellerMap.get(batch.seller_id)||null;
    return {
      id:batch.id,code:batch.batch_code,label:batch.label,quantity:batch.quantity,status:batch.status,productionStatus:batch.production_status||'generated',createdAt:batch.created_at,updatedAt:batch.updated_at,
      sellerId:batch.seller_id||null,assignedEmail:batch.assigned_email||null,assignedAt:batch.assigned_at||null,seller:seller?{id:seller.id,name:seller.full_name,active:seller.active,commissionRate:seller.commission_rate,email:batch.assigned_email||null}:null,
      model:batch.model||'Padrão TAJO TAP',widthCm:Number(batch.width_cm||10),heightCm:Number(batch.height_cm||8),unitCostCents:Number(batch.unit_cost_cents||0),supplier:batch.supplier||'',printFileName:batch.print_file_name||`${batch.batch_code}-IMPRESSAO.html`,notes:batch.production_notes||'',
      stageSummary:summarizeStages(batchPlates),plates:batchPlates
    };
  });
}

function legacyBatchStatus(stage){ if(stage==='sent_to_print')return 'sent_to_print'; if(stage==='produced'||stage==='in_stock')return 'completed'; if(stage==='cancelled')return 'cancelled'; return 'ready'; }

async function updateBatchStage(batchId,stage,auth){
  if(!BATCH_STAGES.has(stage)) throw Object.assign(new Error('STAGE_INVALID'),{code:'STAGE_INVALID',status:400});
  const now=new Date().toISOString();
  const batchRows=await supabaseRest(`tap_plate_batches?id=eq.${encodeURIComponent(batchId)}&select=id,production_status&limit=1`);
  if(!batchRows?.[0]) throw Object.assign(new Error('BATCH_NOT_FOUND'),{code:'BATCH_NOT_FOUND',status:404});
  const batch=await supabaseRest(`tap_plate_batches?id=eq.${encodeURIComponent(batchId)}`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify({production_status:stage,status:legacyBatchStatus(stage),updated_at:now})});
  if(stage!=='cancelled'){
    const allowedBefore={sent_to_print:['generated'],produced:['generated','sent_to_print'],in_stock:['generated','sent_to_print','produced']}[stage]||[];
    if(allowedBefore.length){
      const patch={production_status:stage,production_status_updated_at:now};
      if(stage==='sent_to_print')patch.sent_to_print_at=now;
      if(stage==='produced')patch.produced_at=now;
      if(stage==='in_stock')patch.in_stock_at=now;
      await supabaseRest(`tap_plates?batch_id=eq.${encodeURIComponent(batchId)}&production_status=in.(${allowedBefore.join(',')})`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(patch)});
    }
  }
  await supabaseRest('tap_audit_logs',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({actor_user_id:auth.user.id,action:'plate.batch.stage',entity_type:'plate_batch',entity_id:batchId,metadata:{stage}})}).catch(()=>null);
  return batch?.[0]||null;
}

export default async function handler(req,res){
  setNoStore(res); if(!allowMethods(req,res,['GET','POST','PATCH']))return;
  try{
    const auth=await requireAdmin(req,res); if(!auth)return;
    if(req.method==='GET') return res.status(200).json({ok:true,batches:await listBatches()});
    const body=readJson(req);

    if(req.method==='PATCH'){
      const id=ntext(body?.id,80); if(!id)return apiError(res,400,'BATCH_ID_REQUIRED','Informe o lote.');
      if(body?.kind==='stage'){
        await updateBatchStage(id,ntext(body?.stage,32),auth);
        const updated=(await listBatches()).find(b=>b.id===id)||null;
        return res.status(200).json({ok:true,batch:updated});
      }
      if(body?.kind==='plate-stage'){
        const plateCode=ntext(body?.code,32).toUpperCase(), stage=ntext(body?.stage,32);
        if(!PLATE_STAGES.includes(stage)) return apiError(res,400,'PLATE_STAGE_INVALID','Etapa da unidade inválida.');
        const plateRows=await supabaseRest(`tap_plates?batch_id=eq.${encodeURIComponent(id)}&code=eq.${encodeURIComponent(plateCode)}&select=id,production_status&limit=1`);
        if(!plateRows?.[0]) return apiError(res,404,'PLATE_NOT_IN_BATCH','Plaquinha não encontrada neste lote.');
        const now=new Date().toISOString(), patch={production_status:stage,production_status_updated_at:now,updated_at:now};
        if(stage==='sent_to_print')patch.sent_to_print_at=now;
        if(stage==='produced')patch.produced_at=now;
        if(stage==='in_stock')patch.in_stock_at=now;
        if(stage==='sold')patch.sold_at=now;
        if(stage==='delivered')patch.delivered_at=now;
        await supabaseRest(`tap_plates?id=eq.${encodeURIComponent(plateRows[0].id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(patch)});
        await supabaseRest('tap_audit_logs',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({actor_user_id:auth.user.id,action:'plate.production.stage',entity_type:'plate',entity_id:plateRows[0].id,metadata:{batch_id:id,code:plateCode,stage}})}).catch(()=>null);
        const updated=(await listBatches()).find(b=>b.id===id)||null;
        return res.status(200).json({ok:true,batch:updated});
      }
      if(body?.kind==='assign-seller'){
        const advanced=await supabaseRest(`tap_plates?batch_id=eq.${encodeURIComponent(id)}&production_status=in.(sold,delivered,activated)&select=id&limit=1`).catch(()=>[]);
        if(advanced?.length) return apiError(res,409,'BATCH_TRANSFER_LOCKED','Este lote já possui unidades vendidas, entregues ou ativadas. Transfira apenas lotes sem histórico comercial.');
        const sellerEmail=ntext(body?.sellerEmail,320).toLowerCase();
        const seller=sellerEmail?await resolveSellerByEmail(sellerEmail):null;
        if(sellerEmail&&!seller)return apiError(res,404,'SELLER_NOT_FOUND','Nenhum vendedor ativo foi encontrado com esse e-mail.');
        const now=new Date().toISOString();
        await supabaseRest(`tap_plate_batches?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({seller_id:seller?.id||null,assigned_email:seller?.email||null,assigned_at:seller?now:null,assigned_by:seller?auth.user.id:null,updated_at:now})});
        await supabaseRest(`tap_plates?batch_id=eq.${encodeURIComponent(id)}&production_status=in.(generated,sent_to_print,produced,in_stock)`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({seller_id:seller?.id||null,updated_at:now})});
        const updated=(await listBatches()).find(b=>b.id===id)||null;
        return res.status(200).json({ok:true,batch:updated});
      }
      return apiError(res,400,'ACTION_INVALID','Ação de lote inválida.');
    }

    const quantity=Math.trunc(Number(body?.quantity)); const label=text(body?.label,120)||'Lote de produção TAJO TAP';
    if(!Number.isInteger(quantity)||quantity<1||quantity>100)return apiError(res,400,'BATCH_QUANTITY_INVALID','Escolha uma quantidade entre 1 e 100 plaquinhas por lote.');
    if(label.length<2)return apiError(res,400,'BATCH_LABEL_INVALID','Informe um nome para identificar o lote.');

    const sellerEmail=ntext(body?.sellerEmail,320).toLowerCase();
    const seller=sellerEmail?await resolveSellerByEmail(sellerEmail):null;
    if(sellerEmail&&!seller)return apiError(res,404,'SELLER_NOT_FOUND','Crie/vincule o vendedor primeiro e use o mesmo e-mail do login.');
    const model=ntext(body?.model,80)||'Padrão TAJO TAP';
    const widthCm=Math.max(1,Math.min(100,Number(body?.widthCm||10)));
    const heightCm=Math.max(1,Math.min(100,Number(body?.heightCm||8)));
    const supplier=ntext(body?.supplier,160)||null;
    const unitCostCents=cents(body?.unitCost);
    const notes=ntext(body?.notes,1000)||null;

    const code=batchCode(); const now=new Date().toISOString();
    const batchRows=await supabaseRest('tap_plate_batches?select=*',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({
      batch_code:code,label,quantity,status:'ready',production_status:'generated',created_by:auth.user.id,
      seller_id:seller?.id||null,assigned_email:seller?.email||null,assigned_at:seller?now:null,assigned_by:seller?auth.user.id:null,
      model,width_cm:widthCm,height_cm:heightCm,unit_cost_cents:unitCostCents,supplier,print_file_name:`${code}-IMPRESSAO.html`,production_notes:notes
    })});
    const batch=batchRows?.[0]; if(!batch?.id)throw Object.assign(new Error('BATCH_CREATE_FAILED'),{code:'BATCH_CREATE_FAILED'});

    const plateCodes=await generateUniqueCodes(quantity); const pins=plateCodes.map(()=>activationPin());
    const platePayload=plateCodes.map((plateCode,index)=>({code:plateCode,name:`${label} #${String(index+1).padStart(3,'0')}`,status:'unconfigured',created_by:auth.user.id,batch_id:batch.id,batch_position:index+1,seller_id:seller?.id||null,production_status:'generated',production_status_updated_at:now}));
    let createdPlates=[];
    try{
      createdPlates=await supabaseRest('tap_plates?select=id,code,name,batch_id,batch_position,status,setup_status,configuration_locked,created_at,seller_id,production_status',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(platePayload)});
      const byCode=new Map((createdPlates||[]).map(p=>[p.code,p]));
      const activationRows=plateCodes.map((plateCode,index)=>({plate_id:byCode.get(plateCode)?.id,code_hash:hashPin(pins[index]),admin_pin: pins[index],created_by:auth.user.id}));
      if(activationRows.some(r=>!r.plate_id))throw Object.assign(new Error('BATCH_PLATE_MISMATCH'),{code:'BATCH_PLATE_MISMATCH'});
      await supabaseRest('tap_plate_activation_codes',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify(activationRows)});
    }catch(error){
      await supabaseRest(`tap_plates?batch_id=eq.${encodeURIComponent(batch.id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}}).catch(()=>null);
      await supabaseRest(`tap_plate_batches?id=eq.${encodeURIComponent(batch.id)}`,{method:'DELETE',headers:{Prefer:'return=minimal'}}).catch(()=>null);
      throw error;
    }

    await supabaseRest('tap_audit_logs',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({actor_user_id:auth.user.id,action:'plate.batch.create.v5',entity_type:'plate_batch',entity_id:batch.id,metadata:{batch_code:code,quantity,label,seller_id:seller?.id||null,seller_email:seller?.email||null,model,width_cm:widthCm,height_cm:heightCm,unit_cost_cents:unitCostCents,supplier}})}).catch(()=>null);

    const byCode=new Map((createdPlates||[]).map(p=>[p.code,p]));
    const items=plateCodes.map((plateCode,index)=>({id:byCode.get(plateCode)?.id,code:plateCode,name:byCode.get(plateCode)?.name||`${label} #${String(index+1).padStart(3,'0')}`,position:index+1,activationCode:pins[index],productionStatus:'generated'}));
    return res.status(201).json({ok:true,batch:{id:batch.id,code,label,quantity,status:'ready',productionStatus:'generated',createdAt:batch.created_at,seller:seller?{id:seller.id,name:seller.full_name,email:seller.email}:null,model,widthCm,heightCm,unitCostCents,supplier:supplier||'',printFileName:`${code}-IMPRESSAO.html`,items},warning:'O vendedor recebe somente este lote. Ele não possui permissão para criar novas plaquinhas.'});
  }catch(error){
    const code=publicErrorCode(error); console.error('[admin/batches]',{code,status:error?.status,detail:error?.detail});
    if(['SUPABASE_BAD_REQUEST','SUPABASE_RESOURCE'].includes(code))return apiError(res,503,'V5_DB_UPDATE_REQUIRED','A Central de Produção V5 precisa da migration 007_v5_distribution_and_operations.sql no Supabase.');
    return apiError(res,error?.status||503,code,'Não foi possível concluir a operação de lotes.');
  }
}
