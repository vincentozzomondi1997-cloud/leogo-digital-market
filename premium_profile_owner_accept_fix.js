/* LEOGO PREMIUM OWNER ACCEPT FIX
   The interests table does not have accepted_at, while bookings do.
   Capture ACCEPT clicks before the legacy handler so both flows use the correct columns. */
(function(){
  'use strict';
  if(window.__leogoOwnerAcceptFixInstalled)return;
  window.__leogoOwnerAcceptFixInstalled=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const msg=(id,t,ok)=>{const el=document.getElementById(id);if(el)el.innerHTML=t?'<div class="notice '+(ok?'success':'error')+'" style="margin-top:10px">'+esc(t)+'</div>':''};
  async function refresh(){
    if(typeof window.__leogoOwnerRefresh==='function')return window.__leogoOwnerRefresh();
    document.getElementById('refresh')?.click();
  }
  async function accept(type,id,button){
    button.disabled=true;
    const table=type==='booking'?'premium_profile_bookings':'premium_profile_interests';
    const update={status:'accepted',responded_at:new Date().toISOString()};
    if(type==='booking')update.accepted_at=new Date().toISOString();
    try{
      const s=await sb.auth.getSession();
      if(!s.data?.session)throw new Error('Please log in again.');
      const profileQ=await sb.from('premium_profiles').select('id').eq('user_id',s.data.session.user.id).eq('approved',true).maybeSingle();
      if(profileQ.error)throw profileQ.error;
      if(!profileQ.data?.id)throw new Error('Approved Premium Profile not found.');
      const q=await sb.from(table).update(update).eq('id',id).eq('premium_profile_id',profileQ.data.id);
      if(q.error){
        if(/free acceptance|additional acceptance|used its free/i.test(q.error.message)){
          const slots=prompt('Your free acceptance has been used. How many additional acceptances do you want to unlock? Enter 1 or more.');
          if(!slots)return;
          const n=Math.max(1,parseInt(slots,10)||1);
          const ref=prompt('Enter the M-Pesa payment reference for KSh '+n+' × the current additional-acceptance price:');
          if(!ref)return;
          const p=await sb.rpc('submit_premium_profile_owner_acceptance_payment',{p_acceptance_slots:n,p_reference:ref.trim()});
          if(p.error)throw p.error;
          alert('Payment reference submitted. Admin must approve it before the additional acceptance can be issued.');
          return;
        }
        throw q.error;
      }
      alert(type==='booking'?'Booking accepted successfully.':'Interest accepted successfully.');
      await refresh();
    }catch(e){alert(e.message||'Unable to accept request.');}
    finally{button.disabled=false;}
  }
  document.addEventListener('click',function(e){
    const b=e.target.closest('[data-action="accept"]');
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    accept(b.dataset.type,b.dataset.id,b);
  },true);
})();
