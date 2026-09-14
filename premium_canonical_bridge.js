/* LEOGO PREMIUM CANONICAL PAGE BRIDGE
   Keeps premium.html as the single customer Premium destination while reusing
   the existing membership, catalogue, profile-view, acceptance and owner flows.
   No Premium database records are created, changed or deleted by this bridge.
*/
(function(){
  'use strict';
  if(window.__leogoPremiumCanonicalBridge)return;
  window.__leogoPremiumCanonicalBridge=true;

  function load(src,key){
    const filename=src.split('?')[0];
    if(document.querySelector('script[data-leogo-canonical="'+key+'"],script[src^="'+filename+'?"],script[src="'+filename+'"]'))return;
    const s=document.createElement('script');
    s.src=src;
    s.dataset.leogoCanonical=key;
    s.async=true;
    document.body.appendChild(s);
  }

  function showPremiumArea(){
    const app=document.getElementById('app');
    const area=document.getElementById('premiumArea');
    if(app)app.style.display='none';
    if(area)area.style.display='block';
    return !!area;
  }

  function openDiscover(){
    if(!showPremiumArea())return;
    const run=()=>window.LEOGOPremiumCatalogue?.discover?.();
    if(window.LEOGOPremiumCatalogue?.discover){run();return;}
    load('premium_profiles_catalogue.js?v=20260914-4','catalogue');
    setTimeout(run,250);setTimeout(run,900);setTimeout(run,1800);
  }

  function openMembership(){
    load('premium_payment_bridge.js?v=20260914-2','payment');
    const run=()=>window.LEOGOPremiumPaymentBridge?.open?.();
    if(window.LEOGOPremiumPaymentBridge?.open){run();return;}
    setTimeout(run,250);setTimeout(run,900);setTimeout(run,1800);
  }

  function openListing(){
    if(typeof window.showListing==='function'){window.showListing();return;}
    const listing=document.getElementById('listing');
    if(listing){listing.style.display='block';listing.scrollIntoView({behavior:'smooth'});}
  }

  // Override only the old navigation helpers. Existing forms and data logic stay intact.
  window.goCustomerPremium=openDiscover;
  window.goPremiumMembership=openMembership;
  window.goPremiumListing=openListing;

  // Keep the canonical page's Discover and Membership buttons on this page.
  document.addEventListener('click',function(e){
    const b=e.target?.closest?.('button');
    if(!b)return;
    const t=(b.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    if(t==='discover'){
      e.preventDefault();e.stopImmediatePropagation();openDiscover();return;
    }
    if(t==='membership'){
      e.preventDefault();e.stopImmediatePropagation();openMembership();return;
    }
  },true);

  load('premium_profiles_catalogue.js?v=20260914-4','catalogue');
  load('premium_payment_bridge.js?v=20260914-2','payment');
})();
