(function(){
  'use strict';
  var loaded=false,applicationLoaded=false,fullRegistrationLoaded=false,customerVerificationLoaded=false;
  function sb(){return window.supabase.createClient('https://twpiloiiigdghwcdjbnj.supabase.co','sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX');}
  function loadAcceptance(){
    if(loaded)return;
    var page=document.getElementById('page-premium');
    if(!page)return;
    loaded=true;
    var s=document.createElement('script');
    s.src='premium_acceptance_admin.js';
    s.onload=function(){if(typeof window.initPremiumAcceptanceAdmin==='function')window.initPremiumAcceptanceAdmin();};
    s.onerror=function(){console.error('LEOGO: Could not load Premium acceptance approval panel.');};
    document.head.appendChild(s);
  }
  function loadApplications(){
    if(applicationLoaded)return;
    var page=document.getElementById('page-premium');
    if(!page)return;
    applicationLoaded=true;
    var s=document.createElement('script');
    s.src='admin_premium_profile_application_review.js';
    s.onload=function(){if(typeof window.initPremiumProfileApplicationReview==='function')window.initPremiumProfileApplicationReview();};
    s.onerror=function(){console.error('LEOGO: Could not load Premium Profile application approval panel.');};
    document.head.appendChild(s);
  }
  function loadFullRegistration(){
    if(fullRegistrationLoaded)return;
    var page=document.getElementById('page-premium');
    if(!page)return;
    fullRegistrationLoaded=true;
    var s=document.createElement('script');
    s.src='admin_premium_profile_full_registration.js';
    s.onload=function(){if(typeof window.initPremiumProfileFullRegistration==='function')window.initPremiumProfileFullRegistration();};
    s.onerror=function(){console.error('LEOGO: Could not load Premium Profile full registration and document panel.');};
    document.head.appendChild(s);
  }
  function loadCustomerVerification(){
    if(customerVerificationLoaded)return;
    var page=document.getElementById('page-premium');
    if(!page)return;
    customerVerificationLoaded=true;
    var s=document.createElement('script');
    s.src='admin_premium_customer_verification.js';
    s.onload=function(){if(typeof window.initPremiumCustomerVerification==='function')window.initPremiumCustomerVerification();};
    s.onerror=function(){console.error('LEOGO: Could not load Premium Customer verification panel.');};
    document.head.appendChild(s);
  }
  function loadAll(){loadAcceptance();loadApplications();loadFullRegistration();loadCustomerVerification();}
  function watch(){
    loadAll();
    var nav=document.querySelectorAll('[data-page="premium"]');
    nav.forEach(function(b){b.addEventListener('click',function(){setTimeout(loadAll,0);});});
    if(window.MutationObserver)new MutationObserver(loadAll).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();
})();
