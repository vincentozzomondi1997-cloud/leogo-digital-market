/* LEOGO ADMIN STABILIZATION — lazy-load heavy optional modules only when their page is opened. */
(function(){
  'use strict';
  if(window.__leogoAdminLazyModulesInstalled)return;
  window.__leogoAdminLazyModulesInstalled=true;

  const modules={
    services:['provider_admin_management.js','admin_rfq.js'],
    transport:['admin_transporter_management.js','transport_quote_workflow.js'],
    delivery:['admin_dispatch.js'],
    premium:['premium_private_view_fix.js']
  };
  const loaded=new Set();

  function load(src){
    if(loaded.has(src)||document.querySelector('script[data-leogo-lazy="'+src+'"]')){loaded.add(src);return Promise.resolve();}
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src=src+'?lazy=1';
      s.async=false;
      s.dataset.leogoLazy=src;
      s.onload=()=>{loaded.add(src);resolve()};
      s.onerror=()=>{console.warn('[LEOGO] Optional module failed to load:',src);resolve()};
      document.head.appendChild(s);
    });
  }

  window.LEOGOAdminLazyLoad=async function(page){
    const list=modules[page]||[];
    for(const src of list)await load(src);
  };

  const originalGo=window.go;
  function patch(){
    if(typeof window.go!=='function'){setTimeout(patch,100);return;}
    if(window.__leogoAdminGoPatched)return;
    window.__leogoAdminGoPatched=true;
    const base=window.go;
    window.go=async function(page){
      const result=base.apply(this,arguments);
      try{await window.LEOGOAdminLazyLoad(page)}catch(e){console.warn('[LEOGO] lazy module error',e)}
      return result;
    };
  }
  patch();
})();
