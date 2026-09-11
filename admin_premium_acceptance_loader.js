(function(){
  'use strict';
  var loaded=false;
  function load(){
    if(loaded)return;
    var page=document.getElementById('page-premium');
    if(!page)return;
    loaded=true;
    var s=document.createElement('script');
    s.src='premium_acceptance_admin.js';
    s.onload=function(){
      if(typeof window.initPremiumAcceptanceAdmin==='function')window.initPremiumAcceptanceAdmin();
    };
    s.onerror=function(){console.error('LEOGO: Could not load Premium acceptance approval panel.');};
    document.head.appendChild(s);
  }
  function watch(){
    load();
    var nav=document.querySelectorAll('[data-page="premium"]');
    nav.forEach(function(b){b.addEventListener('click',function(){setTimeout(load,0);});});
    if(window.MutationObserver){new MutationObserver(load).observe(document.body,{childList:true,subtree:true});}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();
})();
