/* LEOGO PREMIUM CUSTOMER — single accepted-connection box on customer dashboard. */
(function(){
  'use strict';
  if(window.__leogoPremiumCustomerConnectionStatus)return;
  window.__leogoPremiumCustomerConnectionStatus=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co',KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX',sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id);
  const normalizePhone=v=>{let p=String(v||'').replace(/[^0-9+]/g,'');if(/^0/.test(p))p='+254'+p.slice(1);return p};
  function styles(){if($('leogoPremiumConnectionStyles'))return;const s=document.createElement('style');s.id='leogoPremiumConnectionStyles';s.textContent='#leogoPremiumConnections{margin:18px 0}.lpc-box{border:1px solid #dbe4ef;border-radius:16px;padding:16px;background:#fff;box-shadow:0 5px 18px rgba(7,21,47,.06)}.lpc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.lpc-status{display:inline-flex;padding:5px 9px;border-radius:999px;background:#dcfce7;color:#166534;font-size:11px;font-weight:900}.lpc-contact{margin-top:12px;padding:14px;border-radius:12px;background:#ecfdf3;color:#166534}.lpc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.lpc-btn{border:0;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer;text-decoration:none;display:inline-block}.lpc-call{background:#07152f;color:#fff}.lpc-wa{background:#16a34a;color:#fff}.lpc-pending{background:#fff7ed;color:#9a3412}.lpc-declined{background:#fef2f2;color:#991b1b}';document.head.appendChild(s)}
  async function session(){return (await sb.auth.getSession()).data?.session||null}
  async function getRequests(uid){const [i,b]=await Promise.all([sb.from('premium_profile_interests').select('id,premium_profile_id,status,created_at').eq('customer_id',uid).order('created_at',{ascending:false}).limit(30),sb.from('premium_profile_bookings').select('id,premium_profile_id,status,created_at').eq('customer_id',uid).order('created_at',{ascending:false}).limit(30)]);return {interests:i,bookings:b}}
  async function load(){
    const host=$('leogoPremiumConnections'),s=await session();if(!host||!s)return;
    const {interests,bookings}=await getRequests(s.user.id);
    if(interests.error&&bookings.error){host.innerHTML='<div class="lpc-box"><b>💎 Premium Connections</b><div class="muted" style="margin-top:6px">Connection status is temporarily unavailable.</div></div>';return}
    const rows=[...(interests.data||[]).map(x=>({...x,type:'interest'})),...(bookings.data||[]).map(x=>({...x,type:'booking'}))].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
    const accepted=rows.find(r=>r.status==='accepted'),pending=rows.find(r=>r.status==='pending'),declined=rows.find(r=>r.status==='declined');let body='';
    if(accepted){
      const q=await sb.rpc('get_premium_customer_accepted_contact',{p_request_id:accepted.id,p_type:accepted.type});const x=!q.error?(q.data?.[0]||q.data):null;const phone=normalizePhone(x?.owner_phone);
      body='<div class="lpc-contact"><div class="lpc-status">✓ REQUEST ACCEPTED</div><div style="font-size:13px;margin-top:8px">Your '+(accepted.type==='booking'?'booking':'interest')+' request has been accepted by the Premium Profile owner.</div>'+(x?.owner_username?'<div style="font-size:17px;font-weight:900;margin-top:9px">'+esc(x.owner_username)+'</div>':'')+(x?.owner_phone?'<div style="font-size:19px;font-weight:900;margin-top:5px">📞 '+esc(x.owner_phone)+'</div>':'<div style="font-size:13px;margin-top:8px">Contact number is not available yet.</div>')+(x?.owner_location?'<div style="font-size:12px;margin-top:3px">📍 '+esc(x.owner_location)+'</div>':'')+(phone?'<div class="lpc-actions"><a class="lpc-btn lpc-call" href="tel:'+esc(phone)+'">📞 CALL</a><a class="lpc-btn lpc-wa" target="_blank" rel="noopener" href="https://wa.me/'+esc(phone.replace(/^\+/,''))+'">💬 WHATSAPP</a></div>':'')+'</div>';
    }else if(pending){body='<div class="lpc-contact lpc-pending">Your Premium '+(pending.type==='booking'?'booking':'interest')+' request is <b>PENDING</b>. Contact details will appear here after the owner accepts.</div>';
    }else if(declined){body='<div class="lpc-contact lpc-declined">Your latest Premium request was <b>DECLINED</b>.</div>';
    }else{body='<div class="muted" style="margin-top:8px">Your Premium interests and booking requests will appear here after you make a request.</div>'}
    host.innerHTML='<div class="lpc-box"><div class="lpc-head"><div><h3 style="margin:0">💎 Premium Connections</h3><div class="muted" style="font-size:12px;margin-top:3px">Your latest Premium connection status and released contact.</div></div><button id="lpcRefresh" class="btn light" type="button">REFRESH</button></div>'+body+'</div>';$('lpcRefresh')?.addEventListener('click',load);
  }
  function inject(){styles();const dash=document.querySelector('.dash.active')||document.querySelector('.dash');if(!dash)return;if(!$('leogoPremiumConnections')){const host=document.createElement('div');host.id='leogoPremiumConnections';const anchor=dash.querySelector('.dash-head')||dash.firstElementChild;if(anchor)anchor.insertAdjacentElement('afterend',host);else dash.prepend(host)}load()}
  const obs=new MutationObserver(()=>{if(document.querySelector('.dash.active'))setTimeout(inject,150)});
  function start(){obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});inject();setInterval(()=>{if(document.querySelector('.dash.active'))load()},30000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
