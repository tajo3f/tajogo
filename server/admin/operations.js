import { allowMethods, setNoStore } from '../_http.js';
import { requireAdmin } from '../_auth.js';
import { publicErrorCode, supabaseRest } from '../_supabase.js';

function daysAgo(days){ return new Date(Date.now() - days * 86400000).toISOString(); }

export default async function handler(req,res){
  setNoStore(res);
  if(!allowMethods(req,res,['GET'])) return;
  try{
    const auth=await requireAdmin(req,res); if(!auth) return;
    const now=new Date().toISOString();
    const cutoff3=daysAgo(3), cutoff30=daysAgo(30);
    const [plates,sales,leads,pins,activity] = await Promise.all([
      supabaseRest('tap_plates?select=id,code,name,status,setup_status,production_status,activated_at,configured_at,client_id,seller_id&order=created_at.desc&limit=1000'),
      supabaseRest('tap_sales?select=id,status,seller_id,plate_id,customer_name,amount_cents,sold_at&order=sold_at.desc&limit=1000').catch(()=>[]),
      supabaseRest('tap_seller_leads?select=id,seller_id,business_name,status,updated_at,next_contact_at&order=updated_at.asc&limit=1000').catch(()=>[]),
      supabaseRest(`tap_plate_activation_codes?locked_until=gt.${encodeURIComponent(now)}&select=plate_id,locked_until,failed_attempts`).catch(()=>[]),
      supabaseRest('tap_plate_activity_v5?select=plate_id,last_scan_at,scans_30d').catch(()=>[])
    ]);

    const activityMap=new Map((activity||[]).map(x=>[x.plate_id,x]));
    const awaiting=(plates||[]).filter(p=>p.setup_status!=='completed' && p.status!=='active');
    const inventory=(plates||[]).filter(p=>p.production_status==='in_stock');
    const pendingSales=(sales||[]).filter(x=>x.status==='pending');
    const staleLeads=(leads||[]).filter(l=>![ 'fechado','perdido' ].includes(l.status) && String(l.updated_at||'') < cutoff3 && (!l.next_contact_at || String(l.next_contact_at) <= now));
    const dormant=(plates||[]).filter(p=>{
      if(p.status!=='active' && p.setup_status!=='completed') return false;
      const activated=p.configured_at||p.activated_at;
      const a=activityMap.get(p.id); return activated && activated < cutoff30 && Number(a?.scans_30d||0)===0;
    });
    const blockedPins=(pins||[]);

    const metrics={
      awaiting_activation:awaiting.length,
      pending_sales:pendingSales.length,
      stale_leads:staleLeads.length,
      inventory_units:inventory.length,
      locked_pins:blockedPins.length,
      no_scan_30d:dormant.length
    };
    const decisions=[
      {key:'awaiting_activation',count:metrics.awaiting_activation,severity:metrics.awaiting_activation?'attention':'ok',title:'Plaquinhas aguardando ativação',text:metrics.awaiting_activation?'Há unidades prontas, mas ainda sem configuração do cliente.':'Nenhuma ativação pendente.',route:'plaques'},
      {key:'pending_sales',count:metrics.pending_sales,severity:metrics.pending_sales?'attention':'ok',title:'Vendas aguardando aprovação',text:metrics.pending_sales?'Aprove pagamentos para liberar comissões corretamente.':'Nenhuma venda pendente de validação.',route:'sellers'},
      {key:'stale_leads',count:metrics.stale_leads,severity:metrics.stale_leads?'warning':'ok',title:'Leads sem contato há mais de 3 dias',text:metrics.stale_leads?'Há oportunidades comerciais que precisam de follow-up.':'Carteiras comerciais sem leads atrasados.',route:'sellers'},
      {key:'inventory_units',count:metrics.inventory_units,severity:metrics.inventory_units?'info':'warning',title:'Unidades físicas em estoque',text:metrics.inventory_units?'Estoque disponível para venda e distribuição.':'Nenhuma unidade marcada como em estoque.',route:'production'},
      {key:'locked_pins',count:metrics.locked_pins,severity:metrics.locked_pins?'critical':'ok',title:'PINs temporariamente bloqueados',text:metrics.locked_pins?'Revise tentativas incorretas antes de prestar suporte.':'Nenhum PIN bloqueado no momento.',route:'plaques'},
      {key:'no_scan_30d',count:metrics.no_scan_30d,severity:metrics.no_scan_30d?'warning':'ok',title:'Plaquinhas sem acesso há 30 dias',text:metrics.no_scan_30d?'Pode valer revisar posicionamento, comunicação ou destino com esses clientes.':'Todas as unidades antigas têm atividade recente.',route:'analytics'}
    ];

    return res.status(200).json({ok:true,metrics,decisions,details:{awaiting:awaiting.slice(0,20),pendingSales:pendingSales.slice(0,20),staleLeads:staleLeads.slice(0,20),dormant:dormant.slice(0,20),blockedPins:blockedPins.slice(0,20)}});
  }catch(error){
    console.error('[admin/operations]',{code:publicErrorCode(error),status:error?.status,detail:error?.detail});
    return res.status(503).json({ok:false,error:publicErrorCode(error),message:'Não foi possível montar o dashboard operacional.'});
  }
}
