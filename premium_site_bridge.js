/* LEOGO PREMIUM SITE BRIDGE
   Customer Premium entry points route to the canonical existing Premium page.
   Premium backend, membership, payment, profile, acceptance and chat workflows
   are not modified by this bridge.
*/
(function(){
  if(window.__leogoPremiumSiteBridgeV5)return;
  window.__leogoPremiumSiteBridgeV5=true;

  function openCanonicalPremium(){
    window.location.href='premium.html';
  }

  // Customer-site Premium gateways only.
  window.openPremium=openCanonicalPremium;
  window.loadPremiumCategory=openCanonicalPremium;

  function route(e){
    if(location.pathname.toLowerCase().endsWith('/premium.html')||location.pathname.toLowerCase().endsWith('premium.html'))return;
    const el=e.target?.closest?.('button,a,[role="button"]');
    if(!el)return;
    // Do not interfere with controls inside the old modal itself. The modal is
    // left untouched; storefront Premium entry buttons route to premium.html.
    if(el.closest('#leogoPremiumModal'))return;
    const text=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!/(premium\s*(18\+|profile)|i want to be listed|enter premium)/i.test(text))return;
    if(el.dataset.leogoPremiumBridge==='1')return;
    el.dataset.leogoPremiumBridge='1';
    e.preventDefault();
    e.stopImmediatePropagation();
    openCanonicalPremium();
  }

  document.addEventListener('click',route,true);
})();