/* LEOGO PREMIUM HUB — one consistent entry point for all customer Premium functions. */
(function(){
  'use strict';
  if(window.__leogoPremiumHubInstalled)return;
  window.__leogoPremiumHubInstalled=true;

  const isPremiumPage=/\/premium\.html(?:$|#|\?)/i.test(location.pathname+location.search+location.hash);
  const PREMIUM='premium.html';

  function openPremium(section){
    const hash=section?'#'+encodeURIComponent(section):'';
    if(isPremiumPage){
      if(section==='discover'){
        const run=()=>window.LEOGOPremiumCatalogue?.discover?.();
        if(window.LEOGOPremiumCatalogue?.discover){run();return;}
        setTimeout(run,400);setTimeout(run,1200);return;
      }
      if(section==='listing'){
        const b=[...document.querySelectorAll('button')].find(x=>/i want to be listed/i.test(x.textContent||''));
        if(b){b.click();return;}
      }
      return;
    }
    location.href=PREMIUM+hash;
  }

  window.LEOGOPremiumHub={open:openPremium,discover:()=>openPremium('discover'),listing:()=>openPremium('listing'),membership:()=>openPremium('membership'),owner:()=>location.href='premium_profile_owner_dashboard.html'};

  function shouldIntercept(el){
    const text=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!text)return null;
    if(/i want to be listed|be listed|get listed/i.test(text))return 'listing';
    if(/discover profiles|browse premium profiles|premium profiles/i.test(text))return 'discover';
    if(/^premium 18\+$/i.test(text)||/^premium$/i.test(text))return 'home';
    return null;
  }

  function bind(){
    document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
      if(el.dataset.leogoPremiumHub==='1')return;
      const section=shouldIntercept(el); if(!section)return;
      /* Do not hijack the buttons inside the dedicated Premium page; those already call the correct functions. */
      if(isPremiumPage)return;
      el.dataset.leogoPremiumHub='1';
      el.addEventListener('click',function(e){
        e.preventDefault();e.stopImmediatePropagation();openPremium(section==='home'?null:section);
      },true);
    });
  }

  function boot(){
    bind();
    if(isPremiumPage && location.hash==='#discover'){
      const run=()=>window.LEOGOPremiumCatalogue?.discover?.();
      setTimeout(run,250);setTimeout(run,900);setTimeout(run,1800);
    }
    /* Small delayed passes handle customer dashboard/category buttons created after login without an observer loop. */
    setTimeout(bind,500);setTimeout(bind,1500);setTimeout(bind,3000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
