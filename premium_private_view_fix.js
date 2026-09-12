/* LEOGO PREMIUM ADMIN BRIDGE
   Lazy-load Premium admin modules only when the Premium page is opened.
   The base Premium list calls loadPremium(), which rebuilds #premiumArea.
   Therefore the review/document modules must be initialized AFTER that render,
   otherwise their cards are immediately removed by loadPremium(). */
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
    s.src=src+'?v=20260912';
    s.dataset.leogoPremiumAdmin=src;
    s.onload=function(){s.dataset.loaded='1';if(typeof ready==='function')ready();};
    s.onerror=function(){console.error('LEOGO: Could not load '+src);};
    document.head.appendChild(s);
  }

  function initModules(){
    /* Build the existing Premium controls first. The request queue is inserted LAST
       so it can safely take the first position without interfering with other cards. */
    if(typeof window.initPremiumProfileApplicationReview==='function')window.initPremiumProfileApplicationReview();
    if(typeof window.initPremiumProfileFullRegistration==='function')window.initPremiumProfileFullRegistration();
    if(typeof window.initPremiumAcceptanceAdmin==='function')window.initPremiumAcceptanceAdmin();
    if(typeof window.initPremiumCustomerVerification==='function')window.initPremiumCustomerVerification();
    if(typeof window.initPremiumCustomerRequests==='function')window.initPremiumCustomerRequests();
    if(typeof window.compactPremiumGallery==='function')setTimeout(window.compactPremiumGallery,100);
  }

  function boot(){
    var page=document.getElementById('page-premium');
    if(!page || !page.classList.contains('active'))return;

    var pending=6;
    function ready(){
      pending--;
      if(pending>0)return;
      /* loadPremium() rebuilds premiumArea. Re-render the base Premium list first,
         then place all Premium admin modules back into the area. */
      var render=window.loadPremium;
      if(typeof render==='function'){
        Promise.resolve(render()).finally(function(){setTimeout(initModules,50);});
      }else{
        setTimeout(initModules,50);
      }
    }

    load('admin_premium_customer_requests.js',ready);
    load('premium_acceptance_admin.js',ready);
    load('admin_premium_profile_application_review.js',ready);
    load('admin_premium_profile_full_registration.js',ready);
    load('admin_premium_customer_verification.js',ready);
    load('admin_premium_gallery_compact.js',ready);
  }

  function scheduleBoot(){setTimeout(boot,80);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',scheduleBoot);
  else scheduleBoot();

  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('[data-page="premium"]'):null;
    if(b)scheduleBoot();
  },true);
})();
