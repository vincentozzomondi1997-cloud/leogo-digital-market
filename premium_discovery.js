/* LEOGO PREMIUM DISCOVERY - private approved profile catalogue. */
(function(){
  if(window.__leogoPremiumDiscoveryInstalled)return;
  window.__leogoPremiumDiscoveryInstalled=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

  async function openDiscovery(){
    const session=(await sb.auth.getSession()).data?.session;
    if(!session){alert('Please log in again to view Premium profiles.');return;}
    const q=await sb.rpc('get_premium_profiles');
    if(q.error){alert(q.error.message||'Premium profiles are temporarily unavailable.');return;}
    showCatalogue(q.data||[]);
  }

  function showCatalogue(rows){
    document.getElementById('leogoPremiumDiscoveryModal')?.remove();
    const m=document.createElement('div');m.id='leogoPremiumDiscoveryModal';m.className='modal';
    const cards=rows.length?rows.map(p=>'<div class="panel" style="margin:0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><div><h3 style="margin:0 0 5px">'+esc(p.username)+'</h3><div class="muted" style="font-size:13px">📍 '+esc(p.location||'Location not specified')+'</div></div>'+(p.verified?'<span class="pill green">✓ VERIFIED</span>':'')+'</div>'+(p.orientation?'<div style="margin-top:10px;font-size:13px"><b>Orientation:</b> '+esc(p.orientation)+'</div>':'')+(p.availability?'<div style="margin-top:6px;font-size:13px"><b>Availability:</b> '+esc(p.availability)+'</div>':'')+(p.fee!==null&&p.fee!==undefined?'<div style="margin-top:10px;font-weight:900">KSh '+Number(p.fee).toLocaleString()+'</div>':'')+'<button class="btn orange lpConnectBtn" data-id="'+esc(p.id)+'" style="width:100%;margin-top:12px">REQUEST CONNECTION</button></div>').join(''):'<div class="empty">No approved Premium profiles are available yet. Check again later.</div>';
    m.innerHTML='<div class="modal-card" style="width:min(850px,100%)"><div class="modal-head"><div><div style="font-size:11px;font-weight:900;color:#ff7a00">LEOGO PREMIUM • PRIVATE DISCOVERY</div><h2 style="margin:3px 0">Find Premium Members</h2></div><button class="close" id="lpdClose">✕</button></div><div class="notice success">Only approved Premium profiles are shown here. Sensitive personal information is not displayed in this catalogue.</div><div id="lpdGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px">'+cards+'</div><div class="muted" style="font-size:12px;margin-top:15px">LEOGO only facilitates connection. Members decide whether to communicate or meet and remain responsible for their own safety and decisions.</div></div>';
    document.body.appendChild(m);
    document.getElementById('lpdClose').onclick=()=>m.remove();
    m.onclick=e=>{if(e.target===m)m.remove();};
    m.querySelectorAll('.lpConnectBtn').forEach(b=>b.onclick=()=>alert('Connection requests are the next Premium feature. Your profile remains protected until a connection is accepted.'));
  }

  function injectButton(){
    const modal=document.getElementById('leogoPremiumModal');
    if(!modal||modal.dataset.discoveryButton==='1'||!/Private Premium Area|Access confirmed/i.test(modal.textContent||''))return;
    const area=Array.from(modal.querySelectorAll('.panel')).find(x=>/Private Premium Area/i.test(x.textContent||''));
    if(!area)return;
    modal.dataset.discoveryButton='1';
    const wrap=document.createElement('div');wrap.style.cssText='display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:12px';
    wrap.innerHTML='<button class="btn primary" type="button" id="leogoPremiumDiscoverBtn">🔎 BROWSE PREMIUM PROFILES</button>';
    area.appendChild(wrap);
    wrap.querySelector('button').onclick=openDiscovery;
  }

  function loadPaymentModule(){
    if(document.querySelector('script[data-leogo-premium-payment]'))return;
    const s=document.createElement('script');s.src='premium_payment.js';s.dataset.leogoPremiumPayment='1';s.async=true;document.head.appendChild(s);
  }
  function loadAcceptanceModule(){
    if(document.querySelector('script[data-leogo-premium-acceptance]'))return;
    const s=document.createElement('script');s.src='premium_acceptance_customer.js';s.dataset.leogoPremiumAcceptance='1';s.async=true;document.head.appendChild(s);
  }

  const observer=new MutationObserver(injectButton);
  function start(){loadPaymentModule();loadAcceptanceModule();observer.observe(document.body,{childList:true,subtree:true});injectButton();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();