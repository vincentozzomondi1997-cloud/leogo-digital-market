/* LEOGO PREMIUM OWNER ACCEPTANCE BRIDGE — additive safety layer.
   The Owner Dashboard's ACCEPT button must use the server-side acceptance RPC.
   This prevents the legacy direct table update from charging/consuming a slot incorrectly. */
(function(){
  'use strict';
  if(window.__LEOGO_OWNER_ACCEPTANCE_BRIDGE__)return;
  window.__LEOGO_OWNER_ACCEPTANCE_BRIDGE__=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);

  async function refresh(){
    const b=document.getElementById('refresh');
    if(b) b.click();
  }

  async function accept(type,id,button){
    if(button)button.disabled=true;
    try{
      const session=(await sb.auth.getSession()).data.session;
      if(!session)throw new Error('Please log in again.');

      const q=await sb.rpc('premium_profile_owner_respond',{
        p_request_id:id,
        p_type:type,
        p_decision:'accepted'
      });
      if(q.error)throw q.error;

      alert(type==='booking'?'Booking accepted successfully.':'Interest accepted successfully.');
      await refresh();
    }catch(e){
      const text=e?.message||'Unable to accept this request.';
      if(/free Premium Profile acceptance has been used|additional acceptance/i.test(text)){
        const slots=prompt('Your free acceptance has been used. How many additional acceptances do you want to unlock? Enter 1 or more.','1');
        if(!slots)return;
        const n=Number.parseInt(slots,10);
        if(!Number.isInteger(n)||n<1)return;
        const ref=prompt('Enter the M-Pesa payment reference after paying for '+n+' additional acceptance'+(n>1?'s':'')+'.');
        if(!ref||!ref.trim())return;
        const p=await sb.rpc('submit_premium_profile_owner_acceptance_payment',{p_acceptance_slots:n,p_reference:ref.trim()});
        if(p.error){alert(p.error.message);return;}
        alert('Payment reference submitted. Admin must approve it before the additional acceptance slots become available.');
        await refresh();
        return;
      }
      alert(text);
    }finally{
      if(button)button.disabled=false;
    }
  }

  document.addEventListener('click',function(e){
    const b=e.target.closest('[data-action="accept"]');
    if(!b)return;
    e.preventDefault();
    e.stopImmediatePropagation();
    accept(b.dataset.type,b.dataset.id,b);
  },true);
})();
