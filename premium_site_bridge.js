/* LEOGO PREMIUM SITE BRIDGE
   Customer Premium entry points must use the EXISTING working Premium section
   from premium_section.js. The previous bridge incorrectly routed customers
   into the retired/incomplete premium.html flow. */
(function(){
  if(window.__leogoPremiumSiteBridgeV3)return;
  window.__leogoPremiumSiteBridgeV3=true;

  function openWorkingPremium(){
    const open=window.LEOGOPremiumSection?.open;
    if(typeof open==='function'){open();return;}
    const button=document.getElementById('leogoPremiumOpen');
    if(button){button.click();return;}
    setTimeout(()=>{
      const retry=window.LEOGOPremiumSection?.open;
      if(typeof retry==='function')retry();
      else document.getElementById('leogoPremiumOpen')?.click();
    },300);
  }

  function route(e){
    // This bridge is only a storefront fallback. Never interfere with the
    // controls inside the existing Premium section/modal itself.
    if(location.pathname.toLowerCase().endsWith('/premium.html')||location.pathname.toLowerCase().endsWith('premium.html'))return;
    const el=e.target?.closest?.('button,a,[role="button"]');
    if(!el||el.closest('#leogoPremiumSection,#leogoPremiumModal'))return;
    const text=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!/(premium\s*(18\+|profile)|i want to be listed|enter premium)/i.test(text))return;
    if(el.dataset.leogoPremiumBridge==='1')return;
    el.dataset.leogoPremiumBridge='1';
    e.preventDefault();
    e.stopImmediatePropagation();
    openWorkingPremium();
  }

  document.addEventListener('click',route,true);
})();