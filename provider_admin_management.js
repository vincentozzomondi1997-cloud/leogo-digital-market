/* LEOGO PROVIDER ADMIN SAFE BRIDGE
   Keeps the main Admin Control Center untouched.
   Provider actions are exposed only when the underlying Admin module exists.
   Admin performance guard: reuse the main Admin Supabase client for optional addons. */
(function(){
  'use strict';

  /* The main admin.html creates the authenticated client as the global lexical `sb`.
     Expose that same client for optional addons instead of creating more GoTrueClient
     instances. Fall back safely only if the base Admin client is unavailable. */
  try{
    if(!window.__leogoAdminSB && typeof sb!=='undefined') window.__leogoAdminSB=sb;
  }catch(e){}

  if(window.__leogoAdminSupabaseFactoryGuard)return;
  window.__leogoAdminSupabaseFactoryGuard=true;

  /* Keep the original Supabase factory available, but return the authenticated Admin
     client for the project's optional Admin addons whenever possible. */
  const originalCreateClient=window.supabase?.createClient;
  if(originalCreateClient){
    const targetUrl='https://twpiloiiigdghwcdjbnj.supabase.co';
    const targetKey='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
    window.supabase.createClient=function(url,key,options){
      if(url===targetUrl && key===targetKey && !options && window.__leogoAdminSB){
        return window.__leogoAdminSB;
      }
      return originalCreateClient.apply(window.supabase,arguments);
    };
  }

  if(window.__leogoProviderAdminSafe)return;
  window.__leogoProviderAdminSafe=true;

  const getSb=()=>window.__leogoAdminSB||window.sb||null;
  const getList=(name)=>Array.isArray(window[name])?window[name]:[];
  const esc0=v=>typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  window.sellerRecommend=async function(id,on){
    const client=getSb(); if(!client)return alert('Admin connection is not ready.');
    const q=await client.from('sellers').update({recommended:!!on,updated_at:new Date().toISOString()}).eq('id',id);
    if(q.error)return alert(q.error.message);
    if(typeof window.loadSellers==='function')await window.loadSellers();
  };

  window.serviceDecision=async function(id,status){
    const client=getSb(); if(!client)return alert('Admin connection is not ready.');
    const service=getList('services').find(x=>x.id===id); if(!service)return;
    const approved=status==='approved';
    const q=await client.from('services').update({approved}).eq('id',id);
    if(q.error)return alert(q.error.message);
    if(service.provider_id){
      await client.from('profiles').update({status:approved?'active':'rejected',updated_at:new Date().toISOString()}).eq('id',service.provider_id);
    }
    if(typeof window.closeModal==='function')window.closeModal();
    if(typeof window.loadServices==='function')await window.loadServices();
  };

  window.serviceRecommend=async function(id,on){
    const client=getSb(); if(!client)return alert('Admin connection is not ready.');
    const q=await client.from('services').update({recommended:!!on}).eq('id',id);
    if(q.error)return alert(q.error.message);
    if(typeof window.closeModal==='function')window.closeModal();
    if(typeof window.loadServices==='function')await window.loadServices();
  };

  window.vehicleDecision=async function(id,status){
    const client=getSb(); if(!client)return alert('Admin connection is not ready.');
    const vehicle=getList('vehicles').find(x=>x.id===id); if(!vehicle)return;
    const approved=status==='approved';
    const q=await client.from('vehicles').update({approval_status:status}).eq('id',id);
    if(q.error)return alert(q.error.message);
    if(vehicle.owner_id){
      await client.from('profiles').update({status:approved?'active':'rejected',updated_at:new Date().toISOString()}).eq('id',vehicle.owner_id);
    }
    if(typeof window.closeModal==='function')window.closeModal();
    if(typeof window.loadTransport==='function')await window.loadTransport();
  };

  window.vehicleRecommend=async function(id,on){
    const client=getSb(); if(!client)return alert('Admin connection is not ready.');
    const q=await client.from('vehicles').update({recommended:!!on}).eq('id',id);
    if(q.error)return alert(q.error.message);
    if(typeof window.closeModal==='function')window.closeModal();
    if(typeof window.loadTransport==='function')await window.loadTransport();
  };

  window.reviewSeller=window.reviewSeller||function(){alert('Seller review panel is available through Seller Management.');};
  window.reviewService=window.reviewService||function(){alert('Service review panel is available through Service Providers.');};
  window.reviewVehicle=window.reviewVehicle||function(){alert('Vehicle review panel is available through Transport & Vehicles.');};
})();
