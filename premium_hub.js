/* LEOGO PREMIUM HUB — one consistent entry point for the EXISTING working customer Premium section. */
(function(){
  'use strict';
  if(window.__leogoPremiumHubInstalled)return;
  window.__leogoPremiumHubInstalled=true;

  function openPremium(section){
    // IMPORTANT: use the Premium system already implemented in premium_section.js.
    // Do not route customers to the retired/incomplete premium.html page.
    const open=window.LEOGOPremiumSection?.open;
    if(typeof open==='function'){
      open();
      return;
    }
    // premium_section.js is loaded before this hub on index.html. This fallback
    // is only for a race during page startup; it never opens the legacy page.
    const button=document.getElementById('leogoPremiumOpen');
    if(button){button.click();return;}
    setTimeout(()=>{
      const retry=window.LEOGOPremiumSection?.open;
      if(typeof retry==='function')retry();
      else document.getElementById('leogoPremiumOpen')?.click();
    },300);
  }

  window.LEOGOPremiumHub={open:openPremium,discover:()=>openPremium('discover'),listing:()=>openPremium('listing'),membership:()=>openPremium('membership'),owner:()=>location.href='premium_profile_owner_dashboard.html'};

  function shouldIntercept(el){
    const text=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!text)return null;
    if(/i want to be listed|be listed|get listed/i.test(text))return 'listing';
    if(/discover profiles|browse premium profiles|premium profiles/i.test(text))return 'discover';
    if(/^premium 18\+$/i.test(text)||/^premium$/i.test(text)||/enter premium/i.test(text))return 'home';
    return null;
  }

  function bind(){
    document.querySelectorAll('button,a,[role="button"]').forEach(el=>{
      if(el.dataset.leogoPremiumHub==='1')return;
      const section=shouldIntercept(el); if(!section)return;
      // Never hijack controls inside the already-working Premium modal/section.
      if(el.closest('#leogoPremiumSection,#leogoPremiumModal'))return;
      el.dataset.leogoPremiumHub='1';
      el.addEventListener('click',function(e){
        e.preventDefault();e.stopImmediatePropagation();
        if(section==='listing' && typeof window.LEOGOPremiumSection?.open==='function'){
          window.LEOGOPremiumSection.open();
          setTimeout(()=>document.getElementById('leogoPremiumOpen')?.click(),50);
          return;
        }
        openPremium(section);
      },true);
    });
  }

  function boot(){
    bind();
    setTimeout(bind,500);setTimeout(bind,1500);setTimeout(bind,3000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();