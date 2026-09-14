/* LEOGO PREMIUM PROFILES LINK BRIDGE
   Connects Premium Profile entry points to the existing Premium discovery system.
   Does not replace premium_discovery.js or the owner dashboard. */
(function(){
  if(window.__leogoPremiumProfilesLinkBridge)return;
  window.__leogoPremiumProfilesLinkBridge=true;

  function goPremium(){
    if(typeof window.openPremium==='function'){ window.openPremium(); return; }
    location.href='premium.html';
  }

  function browse(){
    if(typeof window.LEOGOPremiumDiscovery?.open==='function'){ window.LEOGOPremiumDiscovery.open(); return; }
    const btn=document.getElementById('leogoPremiumDiscoverBtn');
    if(btn){btn.click();return;}
    goPremium();
  }

  function enhance(){
    const nodes=[...document.querySelectorAll('button,a,[role="button"]')];
    nodes.forEach(el=>{
      if(el.dataset.leogoPremiumLink==='1')return;
      const text=(el.textContent||'').trim();
      if(!/premium\s*(profile|profiles)|discover\s*profiles|browse\s*premium/i.test(text))return;
      if(/owner dashboard|my premium profile|be listed|i want to be listed/i.test(text))return;
      el.dataset.leogoPremiumLink='1';
      el.addEventListener('click',function(e){
        e.preventDefault();e.stopImmediatePropagation();browse();
      },true);
    });
  }

  function start(){enhance();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  setTimeout(enhance,500);setTimeout(enhance,1500);setTimeout(enhance,3000);
})();
