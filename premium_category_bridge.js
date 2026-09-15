/* LEOGO PREMIUM CATEGORY BRIDGE
   The storefront Premium 18+ category is a gateway to the EXISTING working
   Premium section in premium_section.js. It must never open the retired
   premium.html implementation. */
(function(){
  'use strict';
  if(window.__leogoPremiumCategoryBridgeInstalled)return;
  window.__leogoPremiumCategoryBridgeInstalled=true;

  function openPremium(){
    const open=window.LEOGOPremiumSection?.open;
    if(typeof open==='function'){open();return;}
    document.getElementById('leogoPremiumOpen')?.click();
  }

  window.loadPremiumCategory=openPremium;

  function isPremiumCategory(el){
    if(!el)return false;
    var text=(el.textContent||'').replace(/\s+/g,' ').trim();
    return /LEOGO\s+Premium\s+18\+/i.test(text) || /^Premium\s+18\+$/i.test(text);
  }

  document.addEventListener('click',function(e){
    var el=e.target&&e.target.closest?e.target.closest('.cat'):null;
    if(!el||!isPremiumCategory(el))return;
    e.preventDefault();
    e.stopImmediatePropagation();
    openPremium();
  },true);
})();