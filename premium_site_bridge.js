/* LEOGO PREMIUM SITE BRIDGE
   Routes Premium/Profile/List-yourself clicks to the dedicated premium.html page.
   Additive only; does not modify existing Premium database functions.
*/
(function(){
  if(window.__leogoPremiumSiteBridgeV1)return;
  window.__leogoPremiumSiteBridgeV1=true;
  function route(e){
    if(location.pathname.toLowerCase().endsWith('/premium.html')||location.pathname.toLowerCase().endsWith('premium.html'))return;
    const el=e.target?.closest?.('button,a,[role="button"]');
    if(!el)return;
    const text=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!/(premium\s*(18\+|profile)|i want to be listed|enter premium)/i.test(text))return;
    if(el.dataset.leogoPremiumBridge==='1')return;
    el.dataset.leogoPremiumBridge='1';
    e.preventDefault();e.stopImmediatePropagation();
    location.href='premium.html';
  }
  document.addEventListener('click',route,true);
})();
