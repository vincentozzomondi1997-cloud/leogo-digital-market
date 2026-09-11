/* LEOGO CUSTOMER NAVIGATION BRIDGE
   Connects marketplace category cards and customer dashboard menu items to the
   existing service/category functions without rewriting the storefront. */
(function(){
  if(window.__leogoCustomerNavigationInstalled)return;
  window.__leogoCustomerNavigationInstalled=true;

  function text(el){return String(el?.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();}
  function isPremium(t){return /premium/.test(t) || /18\+/.test(t);}
  function isServices(t){return /\bservices?\b/.test(t) || /service providers?/.test(t);}
  function isTransport(t){return /\btransport\b/.test(t) || /transport requests?/.test(t);}

  function openPremiumSafe(){
    if(typeof window.openPremium==='function'){window.openPremium();return true;}
    const premium=document.querySelector('[data-page*="premium"],#premiumMenu,#premium18');
    if(premium){premium.click();return true;}
    return false;
  }

  function openDashboardMenu(labelRegex){
    const buttons=Array.from(document.querySelectorAll('#sideNav button, .side button'));
    const b=buttons.find(x=>labelRegex.test(text(x)));
    if(b){b.click();return true;}
    return false;
  }

  function goService(){
    if(openDashboardMenu(/services?|service providers?/))return true;
    const target=Array.from(document.querySelectorAll('h1,h2,h3,h4,.section-head,.panel'))
      .find(x=>/services near you|service providers?|get services/i.test(text(x)));
    if(target){target.scrollIntoView({behavior:'smooth',block:'start'});return true;}
    if(typeof window.filterCategory==='function'){window.filterCategory('Services');return true;}
    return false;
  }

  function goTransport(){
    if(openDashboardMenu(/transport requests?|transport/))return true;
    if(typeof window.openTransportRequests==='function'){window.openTransportRequests();return true;}
    const target=Array.from(document.querySelectorAll('h1,h2,h3,h4,.section-head,.panel'))
      .find(x=>/transport price review|my transport requests|transport/i.test(text(x)));
    if(target){target.scrollIntoView({behavior:'smooth',block:'start');return true;}
    if(typeof window.filterCategory==='function'){window.filterCategory('Transport');return true;}
    return false;
  }

  function goProductCategory(name){
    if(typeof window.filterCategory==='function'){window.filterCategory(name);return true;}
    if(typeof window.loadAllProducts==='function'){window.loadAllProducts();return true;}
    return false;
  }

  function routeLabel(label, source){
    const t=String(label||'').replace(/\s+/g,' ').trim().toLowerCase();
    if(!t)return false;
    if(isPremium(t)){return openPremiumSafe();}
    if(isServices(t)){return goService();}
    if(isTransport(t)){return goTransport();}
    if(/food/.test(t))return goProductCategory('Food & Drinks');
    if(/grocer/.test(t))return goProductCategory('Groceries');
    if(/dry goods/.test(t))return goProductCategory('Dry Goods');
    if(/marketplace/.test(t))return goProductCategory('Marketplace');
    return false;
  }

  document.addEventListener('click',function(e){
    const el=e.target?.closest?.('.cat, #categories button, #categories a, #sideNav button, .side button');
    if(!el)return;
    const label=text(el);
    if(!label)return;
    const handled=routeLabel(label,el);
    if(handled){
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },true);

  // Some customer-dashboard menus are injected after login. Observe them so
  // Premium/Services/Transport remain connected without changing the dashboard renderer.
  const observer=new MutationObserver(function(){
    document.querySelectorAll('#sideNav button, .side button').forEach(function(b){
      const t=text(b);
      if(isPremium(t)||isServices(t)||isTransport(t)||/food|grocer|dry goods|marketplace/.test(t)){
        b.dataset.leogoNavConnected='1';
      }
    });
  });
  function start(){
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
