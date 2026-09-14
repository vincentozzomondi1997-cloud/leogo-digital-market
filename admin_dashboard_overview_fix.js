/* LEOGO Admin Dashboard Overview Repair
   Uses the protected admin_dashboard_overview RPC so the overview can read
   platform totals even when normal table RLS hides administrative rows.
   Additive only: does not rebuild or replace any other admin module.
*/
(function(){
  'use strict';
  if(window.__leogoAdminDashboardOverviewFix)return;
  window.__leogoAdminDashboardOverviewFix=true;

  const SUPABASE_URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const SUPABASE_KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const pill=(v,kind='')=>'<span class="pill '+kind+'">'+esc(v)+'</span>';

  function set(id,value){const e=document.getElementById(id);if(e)e.textContent=value??'—'}

  function renderOperations(d){
    const host=document.getElementById('attention');
    if(!host)return;
    host.innerHTML=
      '<div class="setting-row"><div><b>Products awaiting approval</b><div class="muted">Seller catalogue items waiting for admin review.</div></div>'+pill(d.pending_products||0,(d.pending_products?'':'green'))+'</div>'+
      '<div class="setting-row"><div><b>Seller applications pending</b><div class="muted">Seller accounts requiring review.</div></div>'+pill(d.pending_sellers||0,(d.pending_sellers?'':'green'))+'</div>'+
      '<div class="setting-row"><div><b>Open customer orders</b><div class="muted">Orders that are not delivered, cancelled or completed.</div></div>'+pill(d.open_orders||0,(d.open_orders?'blue':'green'))+'</div>'+
      '<div class="setting-row"><div><b>Pending Premium payments</b><div class="muted">Membership payments waiting for admin approval.</div></div>'+pill(d.pending_premium_payments||0,(d.pending_premium_payments?'':'green'))+'</div>'+
      '<div class="setting-row"><div><b>Pending Premium applications</b><div class="muted">Premium profile applications waiting for review.</div></div>'+pill(d.pending_premium_applications||0,(d.pending_premium_applications?'':'green'))+'</div>';
  }

  function renderSnapshot(d){
    const dashboard=document.getElementById('page-dashboard');
    if(!dashboard)return;
    let box=document.getElementById('adminOverviewSnapshot');
    if(!box){
      box=document.createElement('div');
      box.id='adminOverviewSnapshot';
      box.className='card';
      const grid=dashboard.querySelector('.grid2');
      if(grid)grid.insertAdjacentElement('afterend',box);else dashboard.appendChild(box);
    }
    box.innerHTML='<div class="toolbar"><div><h2 style="margin:0">Operations Snapshot</h2><div class="muted">Live totals from the LEOGO platform.</div></div><span class="pill green">LIVE</span></div>'+
      '<div class="cards" style="margin-top:12px;margin-bottom:0;grid-template-columns:repeat(3,minmax(0,1fr))">'+
      '<div class="stat"><span class="muted">Service Jobs</span><b>'+esc(d.service_jobs||0)+'</b></div>'+
      '<div class="stat"><span class="muted">Transport Requests</span><b>'+esc(d.transport_requests||0)+'</b></div>'+
      '<div class="stat"><span class="muted">Pending Transport Quotes</span><b>'+esc(d.pending_transport_quotes||0)+'</b></div>'+
      '</div>';
  }

  async function fixedLoadDashboard(){
    const msg=document.getElementById('dashMsg');
    if(msg)msg.textContent='Loading live platform data…';
    ['sProducts','sSellers','sOrders','sCustomers','sPremium'].forEach(id=>set(id,'…'));
    try{
      const {data,error}=await sb.rpc('admin_dashboard_overview');
      if(error)throw error;
      const d=data||{};
      set('sProducts',d.products);
      set('sSellers',d.sellers);
      set('sOrders',d.orders);
      set('sCustomers',d.customers);
      set('sPremium',d.premium);
      renderOperations(d);
      renderSnapshot(d);
      if(msg)msg.textContent='Overview data updated successfully.';
    }catch(e){
      if(msg)msg.textContent='Unable to load overview data: '+(e.message||'Unknown error');
      const host=document.getElementById('attention');
      if(host)host.innerHTML='<div class="msg error">Dashboard data could not be loaded. '+esc(e.message||'Please try REFRESH.')+'</div>';
    }
  }

  window.loadDashboard=fixedLoadDashboard;
  window.refreshAll=fixedLoadDashboard;

  // The original admin page calls go('dashboard') after authentication.
  // Keep that flow untouched and simply refresh the repaired overview when it appears.
  function refreshIfDashboardVisible(){
    const p=document.getElementById('page-dashboard');
    if(p&&p.classList.contains('active'))fixedLoadDashboard();
  }
  window.addEventListener('load',refreshIfDashboardVisible);
})();
