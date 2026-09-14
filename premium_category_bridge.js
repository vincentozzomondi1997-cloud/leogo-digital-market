/* LEOGO PREMIUM CATEGORY BRIDGE
   The storefront Premium 18+ category is a single gateway to the dedicated
   Premium system. This intentionally replaces the legacy category handler.
*/
(function(){
  'use strict';
  if(window.__leogoPremiumCategoryBridgeInstalled)return;
  window.__leogoPremiumCategoryBridgeInstalled=true;

  function openPremium(){
    if(window.LEOGOPremiumHub && typeof window.LEOGOPremiumHub.open==='function'){
      window.LEOGOPremiumHub.open();
      return;
    }
    window.location.href='premium.html';
  }

  // Replace the legacy global handler so any existing inline onclick now
  // enters the real Premium hub instead of the old Premium catalogue.
  window.loadPremiumCategory=openPremium;

  function isPremiumCategory(el){
    if(!el) return false;
    var text=(el.textContent||'').replace(/\s+/g,' ').trim();
    return /LEOGO\s+Premium\s+18\+/i.test(text) || /^Premium\s+18\+$/i.test(text);
  }

  // Event delegation also catches category cards created after page load.
  // No MutationObserver or polling is used here.
  document.addEventListener('click',function(e){
    var el=e.target && e.target.closest ? e.target.closest('.cat') : null;
    if(!el || !isPremiumCategory(el))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openPremium();
  },true);
})();
