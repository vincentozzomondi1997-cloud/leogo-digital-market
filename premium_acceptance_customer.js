/* LEOGO PREMIUM ACCEPTANCE — isolated customer-side addon. */
(function(){
  'use strict';
  if(window.__leogoPremiumAcceptanceInstalled)return;
  window.__leogoPremiumAcceptanceInstalled=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co',KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX',sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])),money=v=>'KSh '+Number(v||0).toLocaleString(),notice=(t,ok)=>'<div class="notice '+(ok?'success':'error')+'">'+esc(t)+'</div>';
  async function status(){const q=await sb.rpc('premium_profile_acceptance_status');if(q.error)throw q.error;return q.data?.[0]||q.data||{}}
  function loadChatModule(){
    if(window.LEOGOPremiumChat?.open)return true;
    if(!document.querySelector('script[data-leogo-premium-chat]')){
      const s=document.createElement('script');s.src='premium_profile_chat.js?v=20260912b';s.dataset.leogoPremiumChat='1';s.async=true;document.head.appendChild(s);
    }
    return false;
  }
  async function openChat(id,type){
    if(typeof window.LEOGOPremiumChat?.open==='function'){await window.LEOGOPremiumChat.open(id,type);return}
    loadChatModule();
    let tries=0;const wait=setInterval(async()=>{tries++;if(typeof window.LEOGOPremiumChat?.open==='function'){clearInterval(wait);await window.LEOGOPremiumChat.open(id,type)}else if(tries>=30){clearInterval(wait);alert('Premium conversation service is still loading. Please try again.')}},100);
  }
  async function request(profileId,type){
    const s=(await sb.auth.getSession()).data?.session;
    if(!s){alert('Please log in to request a Premium Profile connection.');return}
    loadChatModule();
    if(type==='booking'){
      const date=prompt('Requested date (YYYY-MM-DD):',new Date().toISOString().slice(0,10));
      if(!date||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date.trim()))return;
      const time=prompt('Requested time (for example 7:00 PM):');if(!time||!time.trim())return;
      const msg=prompt('Optional booking message:')||'';
      const q=await sb.from('premium_profile_bookings').insert({premium_profile_id:profileId,customer_id:s.user.id,requested_date:date.trim(),requested_time:time.trim(),message:msg.trim()||null}).select('id').single();
      if(q.error){alert(q.error.message);return}
      alert('Booking request submitted successfully. You can now have a short private conversation before the owner accepts.');
      await renderStatus();await openChat(q.data.id,'booking');return;
    }
    const existing=await sb.from('premium_profile_interests').select('id,status').eq('premium_profile_id',profileId).eq('customer_id',s.user.id).in('status',['pending','accepted']).order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(existing.error){alert(existing.error.message);return}
    if(existing.data?.id){
      alert(existing.data.status==='accepted'?'You already have an accepted connection with this Premium Profile. Opening your existing conversation.':'You have already expressed interest in this Premium Profile. Opening your existing conversation.');
      await renderStatus();await openChat(existing.data.id,'interest');return;
    }
    const msg=prompt('Optional message to express your interest:')||'';
    const q=await sb.from('premium_profile_interests').insert({premium_profile_id:profileId,customer_id:s.user.id,message:msg.trim()||null}).select('id').single();
    if(q.error){alert(q.error.message);return}
    alert('Interest submitted successfully. You can now have a short private conversation before the owner accepts.');
    await renderStatus();await openChat(q.data.id,'interest');
  }
  window.LEOGOPremiumAcceptance={request,status};
  async function submitUnlock(){const s=await status(),accepted=Number(s.accepted_today||0),price=Number(s.additional_acceptance_price||0);const max=Math.max(0,4-Math.max(accepted-1,0));if(max<1){alert('There are no additional acceptance slots available today.');return}const slots=Number(prompt('How many additional acceptances do you want to unlock? Enter 1 to '+max,'1'));if(!Number.isInteger(slots)||slots<1||slots>max)return;const total=price*slots;if(!confirm('Unlock '+slots+' additional acceptance'+(slots>1?'s':'')+' for '+money(total)+'?'))return;const ref=prompt('Enter the M-Pesa transaction reference after payment of '+money(total)+':');if(!ref||!ref.trim())return;const q=await sb.rpc('submit_premium_profile_acceptance_payment',{p_acceptance_slots:slots,p_reference:ref.trim()});if(q.error){alert(q.error.message);return}alert('Payment reference submitted. Admin must confirm it before the additional acceptance slots become available.');await renderStatus()}
  async function renderStatus(){const host=document.getElementById('leogoPremiumAcceptanceStatus');if(!host)return;try{const s=await status(),req=Number(s.requests_today||0),accepted=Number(s.accepted_today||0),available=Number(s.paid_acceptances_available||0),price=Number(s.additional_acceptance_price||0),pending=!!s.acceptance_payment_pending;host.innerHTML='<div class="panel" style="margin:0;background:#f8fafc"><b>Today\'s Premium access</b><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px"><div>Requests<br><strong>'+req+'/5</strong></div><div>Acceptances<br><strong>'+accepted+'/5</strong></div><div>Paid slots<br><strong>'+available+'</strong></div></div>'+(accepted===0?notice('Your first acceptance today is FREE.',true):'')+(pending?notice('Additional acceptance payment awaiting Admin confirmation.'): '')+(accepted>0&&accepted<5?'<button id="lpUnlockBtn" class="btn orange" style="margin-top:12px">🔓 UNLOCK MORE · '+money(price)+' EACH</button>':'')+'</div>';document.getElementById('lpUnlockBtn')?.addEventListener('click',submitUnlock)}catch(e){host.innerHTML=notice(e.message||'Could not load Premium acceptance status.')}}
  function decorateModal(){const m=document.getElementById('leogoPremiumDiscoveryModal');if(!m||m.dataset.acceptanceAddon==='1')return;m.dataset.acceptanceAddon='1';const card=m.querySelector('.modal-card');if(!card)return;const host=document.createElement('div');host.id='leogoPremiumAcceptanceStatus';host.style.marginTop='14px';card.insertBefore(host,card.lastElementChild);renderStatus()}
  const observer=new MutationObserver(decorateModal);observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',decorateModal);else decorateModal();
})();