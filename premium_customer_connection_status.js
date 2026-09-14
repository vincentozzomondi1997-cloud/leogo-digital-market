/* LEOGO PREMIUM CUSTOMER — accepted connection status + owner contact. */
(function(){
  'use strict';
  if(window.__leogoPremiumCustomerConnectionStatus)return;
  window.__leogoPremiumCustomerConnectionStatus=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co',KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX',sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id);
  function ensureStyles(){if($('leogoPremiumConnectionStyles'))return;const s=document.createElement('style');s.id='leogoPremiumConnectionStyles';s.textContent='#leogoPremiumConnections{margin:18px 0}.lpc-row{border:1px solid #e5e7eb;border-radius:16px;padding:14px;margin-top:10px;background:#fff}.lpc-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.lpc-status{display:inline-flex;padding:5px 9px;border-radius:999px;background:#dcfce7;color:#166534;font-size:11px;font-weight:900}.lpc-contact{margin-top:10px;padding:12px;border-radius:12px;background:#ecfdf3;color:#166534}.lpc-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.lpc-btn{border:0;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer;text-decoration:none;display:inline-block}.lpc-call{background:#07152f;color:#fff}.lpc-wa{background:#16a34a;color:#fff}.lpc-chat{background:#eef3fb;color:#07152f}.lpc-pending{background:#fff7ed;color:#9a3412}.lpc-declined{background:#fef2f2;color:#991b1b}';document.head.appendChild(s)}
  function normalizePhone(v){let p=String(v||'').replace(/[^0-9+]/g,'');if(/^0/.test(p))p='+254'+p.slice(1);return p}
  async function getSession(){return (await sb.auth.getSession()).data?.session||null}
  async function load(){
    const s=await getSession(),host=$('leogoPremiumConnections');
    if(!s||!host)return;
    const [i,b]=await Promise.all([
      sb.from('premium_profile_interests').select('id,premium_profile_id,status,created_at').eq('customer_id',s.user.id).order('created_at',{ascending:false}).limit(20),
      sb.from('premium_profile_bookings').select('id,premium_profile_id,status,created_at').eq('customer_id',s.user.id).order('created_at',{ascending:false}).limit(20)
    ]);
    if(i.error&&b.error){host.innerHTML='<div class="notice error">Premium connection status is temporarily unavailable.</div>';return}
    const rows=[];(i.data||[]).forEach(x=>rows.push({...x,request_type:'interest'}));(b.data||[]).forEach(x=>rows.push({...x,request_type:'booking'}));rows.sort((a,z)=>new Date(z.created_at)-new Date(a.created_at));
    if(!rows.length){host.innerHTML='<div class="panel" style="margin:0"><b>Premium Connections</b><div class="muted" style="margin-top:6px">Your Premium interests and booking requests will appear here.</div></div>';return}
    const html=[];
    for(const r of rows.slice(0,10)){
      let contact=null,ownerName='',ownerLocation='';
      if(r.status==='accepted'){
        const q=await sb.rpc('get_premium_customer_accepted_contact',{p_request_id:r.id,p_type:r.request_type});
        if(!q.error){const x=q.data?.[0]||q.data;if(x){contact=x.owner_phone;ownerName=x.owner_username;ownerLocation=x.owner_location}}
      }
      const label=r.request_type==='booking'?'Booking request':'Interest request';
      const statusClass=r.status==='accepted'?'lpc-status':r.status==='declined'?'lpc-status lpc-declined':'lpc-status lpc-pending';
      const statusText=r.status==='accepted'?'✓ ACCEPTED':r.status==='declined'?'DECLINED':'PENDING';
      let actions='';
      if(r.status==='accepted'){
        const phone=normalizePhone(contact);
        actions='<div class="lpc-contact"><b>Premium Profile Owner Contact</b>'+(ownerName?'<div style="font-size:15px;font-weight:900;margin-top:4px">'+esc(ownerName)+'</div>':'')+'<div style="font-size:18px;font-weight:900;margin-top:5px">'+esc(contact||'Contact not available')+'</div>'+(ownerLocation?'<div style="font-size:12px;margin-top:3px">📍 '+esc(ownerLocation)+'</div>':'')+'<div class="lpc-actions">'+(phone?'<a class="lpc-btn lpc-call" href="tel:'+esc(phone)+'">📞 CALL</a><a class="lpc-btn lpc-wa" target="_blank" rel="noopener" href="https://wa.me/'+esc(phone.replace(/^\+/,''))+'">💬 WHATSAPP</a>':'')+'<button class="lpc-btn lpc-chat" type="button" data-chat-id="'+esc(r.id)+'" data-chat-type="'+esc(r.request_type)+'">OPEN CHAT</button></div></div>';
      } else if(r.status==='pending') actions='<div class="muted" style="margin-top:8px;font-size:13px">The owner has not accepted this request yet. Contact details will appear after acceptance.</div>';
      html.push('<div class="lpc-row"><div class="lpc-top"><div><b>'+esc(label)+'</b><div class="muted" style="font-size:12px;margin-top:3px">'+esc(new Date(r.created_at).toLocaleString('en-KE'))+'</div></div><span class="'+statusClass+'">'+statusText+'</span></div>'+actions+'</div>');
    }
    host.innerHTML='<div class="panel" style="margin:0"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><div><h3 style="margin:0">💎 Premium Connections</h3><div class="muted" style="font-size:12px;margin-top:3px">Accepted requests reveal the Premium Profile owner contact.</div></div><button id="lpcRefresh" class="btn light" type="button">REFRESH</button></div>'+html.join('')+'</div>';
    $('lpcRefresh')?.addEventListener('click',load);
    host.querySelectorAll('[data-chat-id]').forEach(btn=>btn.addEventListener('click',async()=>{if(window.LEOGOPremiumChat?.open){await window.LEOGOPremiumChat.open(btn.dataset.chatId,btn.dataset.chatType)}else{const s=document.createElement('script');s.src='premium_profile_chat.js?v=20260914-3';s.dataset.leogoPremiumChat='1';s.onload=()=>window.LEOGOPremiumChat?.open(btn.dataset.chatId,btn.dataset.chatType);document.head.appendChild(s)}}));
  }
  function inject(){ensureStyles();const dash=document.querySelector('.dash.active')||document.querySelector('.dash');if(!dash)return;if(!$('leogoPremiumConnections')){const host=document.createElement('div');host.id='leogoPremiumConnections';const anchor=dash.querySelector('.dash-head')||dash.firstElementChild;if(anchor)anchor.insertAdjacentElement('afterend',host);else dash.prepend(host)}load()}
  const obs=new MutationObserver(()=>{if(document.querySelector('.dash.active'))setTimeout(inject,100)});
  function start(){obs.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']);inject();setInterval(()=>{if(document.querySelector('.dash.active'))load()},30000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
