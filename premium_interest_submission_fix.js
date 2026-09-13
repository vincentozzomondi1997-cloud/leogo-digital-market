/* LEOGO PREMIUM — secure customer interest submission through RPC. */
(function(){
  'use strict';
  if(window.__leogoPremiumInterestFix)return;
  window.__leogoPremiumInterestFix=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  async function submit(profileId){
    const s=(await sb.auth.getSession()).data?.session;
    if(!s){alert('Please log in to request a Premium Profile connection.');return null;}
    const existing=await sb.from('premium_profile_interests').select('id,status').eq('premium_profile_id',profileId).eq('customer_id',s.user.id).in('status',['pending','accepted']).order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(existing.error){alert(existing.error.message);return null;}
    if(existing.data?.id){
      alert(existing.data.status==='accepted'?'You already have an accepted connection with this Premium Profile.':'You have already expressed interest in this Premium Profile.');
      return existing.data;
    }
    const msg=prompt('Optional message to express your interest:')||'';
    const q=await sb.rpc('send_premium_profile_interest',{p_profile_id:profileId,p_message:msg.trim()||null});
    if(q.error){alert(q.error.message);return null;}
    const row=q.data?.[0]||q.data;
    alert('Interest submitted successfully. You can now have a short private conversation before the owner accepts.');
    return row;
  }
  function getId(button){
    let el=button;
    for(let i=0;i<5&&el;i++,el=el.parentElement){
      const d=el.dataset||{};
      for(const k of ['id','profileId','premiumProfileId'])if(d[k]&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(d[k]))return d[k];
    }
    const source=(button.getAttribute('onclick')||'')+' '+(button.outerHTML||'');
    const m=source.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
    return m?.[0]||null;
  }
  document.addEventListener('click',async function(e){
    const b=e.target.closest('button');
    if(!b||!/express\s+interest/i.test((b.textContent||'').trim()))return;
    const id=getId(b);
    if(!id)return;
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    b.disabled=true;
    try{
      const row=await submit(id);
      if(row){b.textContent='INTEREST SENT';b.classList.remove('orange');b.classList.add('light');}
    }finally{b.disabled=false;}
  },true);
})();
