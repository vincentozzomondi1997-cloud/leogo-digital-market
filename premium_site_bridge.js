/* LEOGO PREMIUM SITE BRIDGE
   Routes Premium/Profile/List-yourself clicks to the dedicated premium.html page.
   Also provides a defensive handler for the Premium age/disclaimer confirmation
   so the Enter Premium button still works if an earlier inline script fails.
*/
(function(){
  if(window.__leogoPremiumSiteBridgeV2)return;
  window.__leogoPremiumSiteBridgeV2=true;

  const SUPABASE_URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const SUPABASE_KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const CONSENT_VERSION='premium-1.0';

  function route(e){
    if(location.pathname.toLowerCase().endsWith('/premium.html')||location.pathname.toLowerCase().endsWith('premium.html'))return;
    const el=e.target?.closest?.('button,a,[role="button"]');
    if(!el)return;
    const text=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!/(premium\s*(18\+|profile)|i want to be listed|enter premium)/i.test(text))return;
    if(el.dataset.leogoPremiumBridge==='1')return;
    el.dataset.leogoPremiumBridge='1';
    e.preventDefault();
    e.stopImmediatePropagation();
    location.href='premium.html';
  }

  async function enterPremium(e){
    const el=e.target?.closest?.('#continue');
    if(!el)return;
    e.preventDefault();
    e.stopImmediatePropagation();

    const age=document.getElementById('age');
    const disc=document.getElementById('disc');
    const msg=document.getElementById('msg');
    const safe=(v)=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
    const showMsg=(text,type='error')=>{
      if(!msg)return;
      msg.innerHTML='<div class="notice '+(type==='success'?'success':'error')+'">'+safe(text)+'</div>';
    };

    if(!age?.checked || !disc?.checked){
      showMsg('You must confirm both statements before entering LEOGO Premium.');
      return;
    }

    if(!window.supabase?.createClient){
      showMsg('Premium is still loading. Please refresh the page and try again.');
      return;
    }

    const button=el;
    const original=button.textContent;
    button.disabled=true;
    button.textContent='SAVING…';

    try{
      const sb=window.__leogoPremiumBridgeClient || window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
      window.__leogoPremiumBridgeClient=sb;
      const sessionResult=await sb.auth.getSession();
      const session=sessionResult?.data?.session;
      if(!session){
        showMsg('Please log in as a customer before entering Premium.');
        button.disabled=false;
        button.textContent=original;
        return;
      }

      const now=new Date().toISOString();
      const result=await sb.from('premium_members').upsert({
        user_id:session.user.id,
        age_confirmed:true,
        age_confirmed_at:now,
        relationship_disclaimer_accepted:true,
        disclaimer_accepted_at:now,
        consent_version:CONSENT_VERSION
      },{onConflict:'user_id'});

      if(result.error)throw result.error;

      const app=document.getElementById('app');
      const area=document.getElementById('premiumArea');
      if(app)app.style.display='none';
      if(area)area.style.display='block';
      area?.scrollIntoView?.({behavior:'smooth',block:'start'});
    }catch(err){
      console.error('LEOGO Premium confirmation error:',err);
      showMsg(err?.message || 'Unable to save your Premium confirmation. Please try again.');
      button.disabled=false;
      button.textContent=original;
    }
  }

  document.addEventListener('click',route,true);
  document.addEventListener('click',enterPremium,true);
})();
