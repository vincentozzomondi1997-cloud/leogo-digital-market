/* LEOGO PROVIDER ADMIN SAFE BRIDGE
   Keeps the main Admin Control Center untouched.
   Provider actions are exposed only when the underlying Admin module exists. */
(function(){
  'use strict';
  if(window.__leogoProviderAdminSafe)return;
  window.__leogoProviderAdminSafe=true;

  const getSb=()=>window.sb||null;
  const getList=(name)=>Array.isArray(window[name])?window[name]:[];
  const esc0=v=>typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  window.sellerRecommend=async function(id,on){
    const sb=getSb(); if(!sb)return alert('Admin connection is not ready.');
    const q=await sb.from('sellers').update({recommended:!!on,updated_at:new Date().toISOString()}).eq('id',id);
    if(q.error)return alert(q.error.message);
    if(typeof window.loadSellers==='function')await window.loadSellers();
  };

  window.serviceDecision=async function(id,status){
    const sb=getSb(); if(!sb)return alert('Admin connection is not ready.');
    const service=getList('services').find(x=>x.id===id); if(!service)return;
    const approved=status==='approved';
    const q=await sb.from('services').update({approved}).eq('id',id);
    if(q.error)return alert(q.error.message);
    if(service.provider_id){
      await sb.from('profiles').update({status:approved?'active':'rejected',updated_at:new Date().toISOString()}).eq('id',service.provider_id);
    }
    if(typeof window.closeModal==='function')window.closeModal();
    if(typeof window.loadServices==='function')await window.loadServices();
  };

  window.serviceRecommend=async function(id,on){
    const sb=getSb(); if(!sb)return alert('Admin connection is not ready.');
    const q=await sb.from('services').update({recommended:!!on}).eq('id',id);
    if(q.error)return alert(q.error.message);
    if(typeof window.closeModal==='function')window.closeModal();
    if(typeof window.loadServices==='function')await window.loadServices();
  };

  window.vehicleDecision=async function(id,status){
    const sb=getSb(); if(!sb)return alert('Admin connection is not ready.');
    const vehicle=getList('vehicles').find(x=>x.id===id); if(!vehicle)return;
    const approved=status==='approved';
    const q=await sb.from('vehicles').update({approval_status:status}).eq('id',id);
    if(q.error)return alert(q.error.message);
    if(vehicle.owner_id){
      await sb.from('profiles').update({status:approved?'active':'rejected',updated_at:new Date().toISOString()}).eq('id',vehicle.owner_id);
    }
    if(typeof window.closeModal==='function')window.closeModal();
    if(typeof window.loadTransport==='function')await window.loadTransport();
  };

  window.vehicleRecommend=async function(id,on){
    const sb=getSb(); if(!sb)return alert('Admin connection is not ready.');
    const q=await sb.from('vehicles').update({recommended:!!on}).eq('id',id);
    if(q.error)return alert(q.error.message);
    if(typeof window.closeModal==='function')window.closeModal();
    if(typeof window.loadTransport==='function')await window.loadTransport();
  };

  window.reviewSeller=window.reviewSeller||function(){
    alert('Seller review panel is available through Seller Management.');
  };
  window.reviewService=window.reviewService||function(){
    alert('Service review panel is available through Service Providers.');
  };
  window.reviewVehicle=window.reviewVehicle||function(){
    alert('Vehicle review panel is available through Transport & Vehicles.');
  };
})();
