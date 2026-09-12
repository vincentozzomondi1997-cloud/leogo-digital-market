/* LEOGO PREMIUM ADMIN BRIDGE
   This file is intentionally loaded by the existing admin.html shell.
   It restores Premium Profile application/payment review panels and the
   isolated full-registration document viewer without changing the existing
   Admin Control Center modules. */
(function(){
  'use strict';
  function load(src, ready){
    if(document.querySelector('script[data-leogo-premium-admin="'+src+'"]')){if(typeof ready==='function')ready();return;}
    var s=document.createElement('script');
    s.src=src;
    s.dataset.leogoPremiumAdmin=src;
    s.onload=function(){if(typeof ready==='function')ready();};
    s.onerror=function(){console.error('LEOGO: Could not load '+src);};
    document.head.appendChild(s);
  }
  function boot(){
    if(!document.getElementById('page-premium'))return;
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
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  if(window.MutationObserver)new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});
})();
