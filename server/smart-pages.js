import { allowMethods, apiError, readJson, setNoStore } from './_http.js';
import { requireUser, resolveRole } from './_auth.js';
import { canEditSmartPage, pageAnalytics, smartPagePatch, smartUrl, slugify, uniqueSlug } from './_smart.js';
import { assertWifiEncryptionReady, getWifiProfileBySmartPage, normalizeWifiConfig, upsertWifiProfile } from './_wifi.js';
import { publicErrorCode, supabaseRest } from './_supabase.js';

function clean(v,n=240){return String(v??'').trim().slice(0,n)}

async function rolePages(role){
  if(role.role==='admin') return await supabaseRest('tap_smart_pages?select=*&order=updated_at.desc&limit=500');
  if(role.role==='client'){
    const ids=(role.memberships||[]).map(m=>m.client_id).filter(Boolean);
    if(!ids.length)return [];
    return await supabaseRest(`tap_smart_pages?client_id=in.(${ids.join(',')})&select=*&order=updated_at.desc&limit=300`);
  }
  if(role.role==='seller'){
    const sid=role.seller?.id; if(!sid)return [];
    const own=await supabaseRest(`tap_smart_pages?created_by_seller_id=eq.${encodeURIComponent(sid)}&select=*&order=updated_at.desc&limit=300`).catch(()=>[]);
    const plates=await supabaseRest(`tap_plates?seller_id=eq.${encodeURIComponent(sid)}&select=id&limit=1000`).catch(()=>[]);
    const plateIds=(plates||[]).map(p=>p.id).filter(Boolean);
    const assigned=plateIds.length?await supabaseRest(`tap_smart_pages?plate_id=in.(${plateIds.join(',')})&select=*&order=updated_at.desc&limit=300`).catch(()=>[]):[];
    const map=new Map(); [...(own||[]),...(assigned||[])].forEach(p=>map.set(p.id,p)); return [...map.values()];
  }
  return [];
}

function legacyWifi(p){
  const name=String(p?.wifi_name||'').trim();
  const password=String(p?.wifi_password||'');
  if(!name)return null;
  return {mode:'hybrid',ssid:name,security:password?'WPA':'nopass',password,hidden:false,publicEnabled:true,directQrEnabled:true,label:'Wi-Fi do estabelecimento',payload:''};
}

function mapPage(req,p,analytics,wifi){
  const wf=wifi||legacyWifi(p);
  return {
    id:p.id,clientId:p.client_id,plateId:p.plate_id,createdBySellerId:p.created_by_seller_id,slug:p.slug,publicUrl:smartUrl(req,p.slug),
    businessName:p.business_name,subtitle:p.subtitle||'',bio:p.bio||'',logoUrl:p.logo_url||'',coverUrl:p.cover_url||'',
    primaryColor:p.primary_color||'#45E600',backgroundColor:p.background_color||'#0B0D0E',textColor:p.text_color||'#F4F7F2',buttonStyle:p.button_style||'rounded',
    whatsapp:p.whatsapp||'',phone:p.phone||'',publicEmail:p.public_email||'',instagram:p.instagram||'',tiktok:p.tiktok||'',websiteUrl:p.website_url||'',mapsUrl:p.maps_url||'',googleReviewUrl:p.google_review_url||'',
    pixKey:p.pix_key||'',address:p.address||'',openingHours:p.opening_hours||'',services:Array.isArray(p.services)?p.services:[],customLinks:Array.isArray(p.custom_links)?p.custom_links:[],
    wifiMode:wf?.mode||'off',wifiSsid:wf?.ssid||'',wifiSecurity:wf?.security||'WPA',wifiPassword:wf?.password||'',wifiHidden:Boolean(wf?.hidden),wifiPublicEnabled:Boolean(wf?.publicEnabled),wifiDirectQrEnabled:Boolean(wf?.directQrEnabled),wifiLabel:wf?.label||'Wi-Fi do estabelecimento',wifiPayload:wf?.payload||'',
    sellerEditAllowed:Boolean(p.seller_edit_allowed),isPublished:Boolean(p.is_published),createdAt:p.created_at,updatedAt:p.updated_at,analytics:analytics||{views30d:0,clicks30d:0,actions:{}}
  };
}

async function mapPages(req,pages,analytics){
  return Promise.all((pages||[]).map(async p=>{
    let wifi=null;
    try{wifi=await getWifiProfileBySmartPage(p.id);}catch(error){
      if(error?.code==='WIFI_ENCRYPTION_KEY_MISSING'||error?.code==='WIFI_DECRYPT_FAILED') throw error;
    }
    return mapPage(req,p,analytics?.get(p.id),wifi);
  }));
}

function wifiRequested(body){
  return ['wifiMode','wifiSsid','wifiSecurity','wifiPassword','wifiHidden','wifiPublicEnabled','wifiDirectQrEnabled','wifiLabel','wifi_name','wifi_password'].some(k=>body[k]!==undefined);
}

export default async function handler(req,res){
  setNoStore(res); if(!allowMethods(req,res,['GET','POST','PATCH']))return;
  try{
    const user=await requireUser(req,res); if(!user)return;
    const role=await resolveRole(user.id);
    if(!['admin','seller','client'].includes(role.role)) return apiError(res,403,'ACCESS_REQUIRED','Sua conta ainda não possui acesso a Smart Pages.');

    if(req.method==='GET'){
      const pages=await rolePages(role); const analytics=await pageAnalytics((pages||[]).map(p=>p.id));
      return res.status(200).json({ok:true,pages:await mapPages(req,pages,analytics)});
    }

    const body=readJson(req);
    if(req.method==='POST'){
      if(!['admin','seller'].includes(role.role)) return apiError(res,403,'CREATE_FORBIDDEN','A Smart Page é criada pela TAJO ou pelo vendedor responsável.');
      const plateCode=clean(body.plateCode,32).toUpperCase();
      const clientId=clean(body.clientId,80);
      let plate=null;
      if(plateCode){
        const filter=role.role==='seller'?`&seller_id=eq.${encodeURIComponent(role.seller.id)}`:'';
        const rows=await supabaseRest(`tap_plates?code=eq.${encodeURIComponent(plateCode)}${filter}&select=id,client_id,seller_id&limit=1`); plate=rows?.[0]||null;
        if(!plate)return apiError(res,404,'PLATE_NOT_FOUND','Plaquinha não encontrada na sua operação.');
      }
      const cid=plate?.client_id||clientId;
      if(!cid)return apiError(res,400,'CLIENT_REQUIRED','Vincule um cliente antes de criar a Smart Page.');
      if(plate?.id){
        const existing=await supabaseRest(`tap_smart_pages?plate_id=eq.${encodeURIComponent(plate.id)}&select=*&limit=1`);
        if(existing?.[0]){
          const wifi=await getWifiProfileBySmartPage(existing[0].id).catch(()=>null);
          return res.status(200).json({ok:true,page:mapPage(req,existing[0],null,wifi),existing:true});
        }
      }
      const businessName=clean(body.businessName,120)||'Minha empresa';
      const slug=await uniqueSlug(body.slug||businessName);
      const payload={client_id:cid,plate_id:plate?.id||null,created_by_seller_id:role.role==='seller'?role.seller.id:null,slug,business_name:businessName,subtitle:'Sua empresa mais perto do cliente',bio:'Encontre nossos principais canais, localização e informações em um só lugar.',seller_edit_allowed:true,is_published:true,wifi_name:null,wifi_password:null};
      const rows=await supabaseRest('tap_smart_pages?select=*',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify(payload)});
      let wifi=null;
      if(wifiRequested(body) && plate?.id){
        wifi=await upsertWifiProfile({plateId:plate.id,smartPageId:rows?.[0]?.id,userId:user.id,config:body});
      }
      return res.status(201).json({ok:true,page:mapPage(req,rows?.[0],null,wifi)});
    }

    const id=clean(body.id,80); if(!id)return apiError(res,400,'PAGE_REQUIRED','Smart Page inválida.');
    const rows=await supabaseRest(`tap_smart_pages?id=eq.${encodeURIComponent(id)}&select=*&limit=1`); const page=rows?.[0];
    if(!page)return apiError(res,404,'PAGE_NOT_FOUND','Smart Page não encontrada.');
    if(!(await canEditSmartPage(role,page)))return apiError(res,403,'PAGE_FORBIDDEN','Você não pode editar esta Smart Page.');
    if(wifiRequested(body)){ const preflight=normalizeWifiConfig(body); if(preflight.mode!=='off') assertWifiEncryptionReady(); }
    const patch=smartPagePatch(body);
    if(body.slug!==undefined){
      const requested=slugify(body.slug);
      if(requested!==page.slug){
        const taken=await supabaseRest(`tap_smart_pages?slug=eq.${encodeURIComponent(requested)}&id=neq.${encodeURIComponent(page.id)}&select=id&limit=1`);
        if(taken?.[0])return apiError(res,409,'SLUG_TAKEN','Este endereço já está sendo usado. Escolha outro.');
        patch.slug=requested;
      }
    }
    // V7: nunca persiste nova senha Wi-Fi nas colunas legadas em texto puro.
    patch.wifi_name=null; patch.wifi_password=null;
    const updated=await supabaseRest(`tap_smart_pages?id=eq.${encodeURIComponent(page.id)}&select=*`,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(patch)});
    let wifi=await getWifiProfileBySmartPage(page.id).catch(()=>null);
    if(wifiRequested(body)){
      if(!page.plate_id && normalizeWifiConfig(body).mode!=='off') return apiError(res,409,'WIFI_PLATE_REQUIRED','Vincule a Smart Page a uma plaquinha antes de ativar o Wi-Fi Connect.');
      wifi=await upsertWifiProfile({plateId:page.plate_id,smartPageId:page.id,userId:user.id,config:body});
    }
    await supabaseRest('tap_audit_logs',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({actor_user_id:user.id,action:'smart_page.update.v7',entity_type:'smart_page',entity_id:page.id,metadata:{role:role.role,wifi_mode:wifi?.mode||'off'}})}).catch(()=>null);
    return res.status(200).json({ok:true,page:mapPage(req,updated?.[0]||{...page,...patch},null,wifi)});
  }catch(error){
    console.error('[smart-pages:v7]',{code:publicErrorCode(error),status:error?.status,detail:error?.detail||error?.message});
    if(error?.code==='WIFI_SSID_INVALID') return apiError(res,400,'WIFI_SSID_INVALID','Informe o nome da rede Wi-Fi.');
    if(error?.code==='WIFI_PASSWORD_INVALID') return apiError(res,400,'WIFI_PASSWORD_INVALID','Use uma senha compatível com o tipo de segurança escolhido. Para WPA/WPA2/WPA3, use 8 a 63 caracteres.');
    if(error?.code==='WIFI_ENCRYPTION_KEY_MISSING') return apiError(res,503,'WIFI_ENCRYPTION_KEY_MISSING','Configure TAJO_WIFI_ENCRYPTION_KEY na Vercel para usar o Wi-Fi Connect.');
    if(error?.code==='WIFI_DECRYPT_FAILED') return apiError(res,503,'WIFI_DECRYPT_FAILED','Não foi possível abrir a configuração Wi-Fi. Verifique a chave de criptografia do projeto.');
    return res.status(503).json({ok:false,error:publicErrorCode(error),message:'Não foi possível processar a Smart Page.'});
  }
}
