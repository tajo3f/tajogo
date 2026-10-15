import { allowMethods, setNoStore } from '../_http.js';
import { digits, httpsUrl } from '../_smart.js';
import { supabaseRest } from '../_supabase.js';

function clean(v,n=120){return String(v??'').trim().slice(0,n)}
function safeSlug(v){return clean(v,64).toLowerCase().replace(/[^a-z0-9-]/g,'')}
function safeKey(v){return clean(v,64).toLowerCase().replace(/[^a-z0-9-]/g,'')}
function action(page,key){
  if(key==='whatsapp'&&digits(page.whatsapp)) return {url:`https://wa.me/${digits(page.whatsapp)}`,label:'WhatsApp'};
  if(key==='phone'&&digits(page.phone)) return {url:`tel:+${digits(page.phone)}`,label:'Ligar'};
  if(key==='email'&&page.public_email) return {url:`mailto:${encodeURIComponent(page.public_email)}`,label:'E-mail'};
  if(key==='instagram'&&page.instagram) return {url:`https://instagram.com/${encodeURIComponent(String(page.instagram).replace(/^@/,''))}`,label:'Instagram'};
  if(key==='tiktok'&&page.tiktok) return {url:`https://tiktok.com/@${encodeURIComponent(String(page.tiktok).replace(/^@/,''))}`,label:'TikTok'};
  if(key==='website'&&httpsUrl(page.website_url)) return {url:page.website_url,label:'Site oficial'};
  if(key==='maps'&&httpsUrl(page.maps_url)) return {url:page.maps_url,label:'Localização'};
  if(key==='google-review'&&httpsUrl(page.google_review_url)) return {url:page.google_review_url,label:'Avalie no Google'};
  const match=key.match(/^custom-(\d{1,2})$/);
  if(match&&Array.isArray(page.custom_links)){
    const item=page.custom_links[Number(match[1])];
    if(item?.url&&httpsUrl(item.url)) return {url:item.url,label:item.label||'Link'};
  }
  return null;
}

export default async function handler(req,res){
  setNoStore(res); if(!allowMethods(req,res,['GET']))return;
  const slug=safeSlug(req.query?.slug),key=safeKey(req.query?.key);
  if(!slug||!key)return res.status(404).end();
  const rows=await supabaseRest(`tap_smart_pages?slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&select=*&limit=1`).catch(()=>[]);
  const page=rows?.[0],dest=page?action(page,key):null;
  if(!page||!dest)return res.status(404).end();
  await supabaseRest('tap_smart_page_events',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({smart_page_id:page.id,event_type:'click',action_key:key,action_label:dest.label})}).catch(()=>null);
  res.setHeader('Cache-Control','no-store');
  return res.redirect(302,dest.url);
}
