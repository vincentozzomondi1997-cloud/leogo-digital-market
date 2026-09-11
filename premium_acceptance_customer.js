/* LEOGO PREMIUM ACCEPTANCE — isolated customer-side addon.
   Does not replace existing Premium discovery code; it augments the discovery modal.
*/
(function(){
  'use strict';
  if(window.__leogoPremiumAcceptanceInstalled)return;
  window.__leogoPremiumAcceptanceInstalled=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>'KSh '+Number(v||0).toLocaleString();
  const notice=(t,ok)=>'<div class="notice '+(ok?'success':'error')+'">'+esc(t)+'</div>';

  async function status(){
    const q=await sb.rpc('premium_profile_acceptance_status');
    if(q.error)throw q.error;
    return q.data?.[0]||q.data||{};
  }

  async function request(profileId,type){
    const s=(await sb.auth.getSession()).data?.session;
    if(!s){alert('Please log in again.');return;}
    let message=prompt(type==='booking'?'Optional message for this booking:':'Optional message to express your interest:')||'';
    const table=type==='booking'?'premium_profile_bookings':'premium_profile_interests';
    const payload=type==='booking'
      ?{premium_profile_id:profileId,customer_id:s.user.id,requested_date:new Date().toISOString().slice(0,10),requested_time:null,message:message.trim()||null}
      :{premium_profile_id:profileId,customer_id:s.user.id,message:message.trim()||null};
    if(type==='booking'){
      const tm=prompt('Requested time (for example 7:00 PM):');
      payload.requested_time=tm&&tm.trim()?tm.trim():null;
    }
    const q=await sb.from(table).insert(payload);
    if(q.error){alert(q.error.message);return;}
    alert('Request submitted successfully. You can make up to 5 Premium Profile requests today.');
    await renderStatus();
  }

  async function submitUnlock(){
    const s=await status();
    const available=Math.max(0,Math.min(4,Number(s.paid_acceptances_available||0)));
    const purchased=Math.max(0,Number(s.paid_acceptances_purchased||0));
    const used=Math.max(0,Number(s.paid_acceptances_used||0));
    const remaining=Math.max(0,4-Math.max(Number(s.accepted_today||0)-1,0)-Math.max(purchased-used,0));
    const max=remaining;
    if(max<1){alert('There are no additional acceptance slots available today.');return;}
    const price=Number(s.additional_acceptance_price||0);
    const slots=Number(prompt('How many additional acceptances do you want to unlock today? Enter 1 to '+max+':','1'));
    if(!Number.isInteger(slots)||slots<1||slots>max){alert('Please choose a whole number from 1 to '+max+'.');return;}
    const total=price*slots;
    if(!confirm('Unlock '+slots+' additional acceptance'+(slots>1?'s':'')+' for '+money(total)+'?'))return;
    const ref=prompt('Enter the M-Pesa transaction reference after payment of '+money(total)+':');
    if(!ref||!ref.trim())return;
    const q=await sb.rpc('submit_premium_profile_acceptance_payment',{p_acceptance_slots:slots,p_reference:ref.trim()});
    if(q.error){alert(q.error.message);return;}
    alert('Payment reference submitted. LEOGO Admin must confirm it before the additional acceptance slots become available.');
    await renderStatus();
  }

  async function renderStatus(){
    const host=document.getElementById('leogoPremiumAcceptanceStatus');
    if(!host)return;
    try{
      const s=await status();
      const req=Number(s.requests_today||0), accepted=Number(s.accepted_today||0), purchased=Number(s.paid_acceptances_purchased||0),used=Number(s.paid_acceptances_used||0),available=Number(s.paid_acceptances_available||0),price=Number(s.additional_acceptance_price||0);
      const free=accepted===0;
      const pending=!!s.acceptance_payment_pending;
      host.innerHTML='<div class="panel" style="margin:0;background:#f8fafc"><b>Today\'s Premium access</b><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-top:10px"><div>Requests<br><strong>'+req+'/5</strong></div><div>Acceptances<br><strong>'+accepted+'/5</strong></div><div>Paid slots available<br><strong>'+available+'</strong></div></div>'+(free?notice('Your first acceptance today is FREE.',true):'')+(pending?notice('Your additional acceptance payment is awaiting Admin confirmation.'): '')+'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px">'+(accepted>0&&accepted<5?'<button id="lpUnlockBtn" class="btn orange">🔓 UNLOCK MORE ACCEPTANCES · '+money(price)+' EACH</button>':'')+'</div><div class="muted" style="margin-top:8px;font-size:12px">One acceptance is free each day. You may unlock up to 4 additional acceptances at the Admin-set price per acceptance.</div></div>';
      document.getElementById('lpUnlockBtn')?.addEventListener('click',submitUnlock);
    }catch(e){host.innerHTML=notice(e.message||'Could not load Premium acceptance status.');}
  }

  async function decorateModal(){
    const m=document.getElementById('leogoPremiumDiscoveryModal');
    if(!m||m.dataset.acceptanceAddon==='1')return;
    m.dataset.acceptanceAddon='1';
    const grid=m.querySelector('#lpdGrid');
    if(grid){
      grid.querySelectorAll('.lpConnectBtn').forEach(btn=>{
        btn.textContent='EXPRESS INTEREST';
        btn.onclick=()=>request(btn.getAttribute('data-id'),'interest');
      });
    }
    const card=m.querySelector('.modal-card');
    if(card){
      const host=document.createElement('div');host.id='leogoPremiumAcceptanceStatus';host.style.marginTop='14px';
      card.insertBefore(host,card.lastElementChild);
      await renderStatus();
      const extra=document.createElement('div');extra.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-top:10px';
      extra.innerHTML='<button id="lpBookingInfo" class="btn light">📅 REQUEST BOOKING</button>';
      host.appendChild(extra);
      extra.querySelector('button').onclick=()=>alert('To request a booking, first choose a profile and use EXPRESS INTEREST. Booking controls will be expanded with availability selection in the next testing step.');
    }
  }
  const observer=new MutationObserver(decorateModal);
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorateModal);else decorateModal();
})();
