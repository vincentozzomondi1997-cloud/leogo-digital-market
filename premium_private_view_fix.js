/* LEOGO PREMIUM ADMIN BRIDGE
   Lazy-load Premium admin modules only when the Premium page is opened.
   This keeps the existing Admin shell and working modules untouched. */
(function(){
  'use strict';
  if(window.__leogoPremiumAdminBridgeInstalled)return;
  window.__leogoPremiumAdminBridgeInstalled=true;

  function load(src, ready){
    var selector='script[data-leogo-premium-admin="'+src+'"]';
    var existing=document.querySelector(selector);
    if(existing){
      if(existing.dataset.loaded==='1' && typeof ready==='function')ready();
      else if(typeof ready==='function')existing.addEventListener('load',ready,{once:true});
      return;
    }
    var s=document.createElement('script');
    s.src=src;
    s.dataset.leogoPremiumAdmin=src;
    s.onload=function(){s.dataset.loaded='1';if(typeof ready==='function')ready();};
    s.onerror=function(){console.error('LEOGO: Could not load '+src);};
    document.head.appendChild(s);
  }

  function boot(){
    var page=document.getElementById('page-premium');
    if(!page || !page.classList.contains('active'))return;
    if(window.__leogoPremiumAdminBooted)return;
    window.__leogoPremiumAdminBooted=true;

    load('premium_acceptance_admin.js',function(){
      if(typeof window.initPremiumAcceptanceAdmin==='function')window.initPremiumAcceptanceAdmin();
    });
    load('admin_premium_profile_application_review.js',function(){
      if(typeof window.initPremiumProfileApplicationReview==='function')window.initPremiumProfileApplicationReview();
    });
    load('admin_premium_profile_full_registration.js',function(){
      if(typeof window.initPremiumProfileFullRegistration==='function')window.initPremiumProfileFullRegistration();
    });
  }

  function scheduleBoot(){setTimeout(boot,50);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleBoot);
  else scheduleBoot();

  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('[data-page="premium"]'):null;
    if(b)scheduleBoot();
  },true);
})();
