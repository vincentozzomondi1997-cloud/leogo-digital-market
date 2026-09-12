(function(){
  'use strict';
  var ADMIN_EMAIL='leogodigitalmarket@gmail.com';
  var loaded=false,applicationLoaded=false,authListenerInstalled=false;
  function sb(){return window.__leogoAdminSB||(window.__leogoAdminSB=window.supabase.createClient('https://twpiloiiigdghwcdjbnj.supabase.co','sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX'));}
  async function isAdminSession(){
    try{
      var r=await sb().auth.getSession();
      var u=r.data&&r.data.session&&r.data.session.user;
      return !!u&&String(u.email||'').toLowerCase()===ADMIN_EMAIL;
    }catch(e){return false;}
  }
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
  async function loadAllIfAdmin(){
    if(!(await isAdminSession()))return;
    loadAcceptance();
    loadApplications();
  }
  function watch(){
    loadAllIfAdmin();
    document.querySelectorAll('[data-page="premium"]').forEach(function(b){
      b.addEventListener('click',function(){setTimeout(loadAllIfAdmin,0);});
    });
    if(!authListenerInstalled&&window.supabase&&window.supabase.createClient){
      authListenerInstalled=true;
      sb().auth.onAuthStateChange(function(event,session){
        if(session&&String(session.user&&session.user.email||'').toLowerCase()===ADMIN_EMAIL)setTimeout(loadAllIfAdmin,0);
      });
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();
})();
