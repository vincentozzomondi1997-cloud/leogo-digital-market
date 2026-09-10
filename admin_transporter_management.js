/* LEOGO - TRANSPORTER / VEHICLE OWNER ACCOUNT MANAGEMENT
   Isolated from the existing vehicle table, admin navigation and dispatch code. */
(function(){
  var transportClient=null;
  function esc(v){return String(v??'').replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});}
  async function sb(){
    if(window.__leogoAdminSB)return window.__leogoAdminSB;
    if(transportClient)return transportClient;
    if(!window.supabase||!window.supabase.createClient)return null;
    transportClient=window.supabase.createClient('https://twpiloiiigdghwcdjbnj.supabase.co','sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX');
    var session=await transportClient.auth.getSession();
    if(!session.data||!session.data.session)return null;
    return transportClient;
  }
  function pill(v,k){return '<span class="pill '+(k||'')+'">'+esc(v)+'</span>';}

  function ensurePanel(){
    var page=document.getElementById('page-transport');
    if(!page)return null;
    var panel=document.getElementById('leogoTransporterAccountsPanel');
    if(panel)return panel;
    panel=document.createElement('div');
    panel.id='leogoTransporterAccountsPanel';
    panel.className='card';
    panel.innerHTML='<div class="toolbar"><div><h2 style="margin:0">🚛 Transporter / Vehicle Owner Accounts</h2><div class="muted">Review transporter accounts, their vehicles and submitted documents.</div></div><button class="light" id="leogoTransporterAccountsRefresh">↻ REFRESH</button></div><div id="leogoTransporterAccountsArea"><div class="empty">Loading transporter accounts…</div></div>';
    page.insertBefore(panel,page.firstElementChild);
    document.getElementById('leogoTransporterAccountsRefresh').onclick=loadAccounts;
    return panel;
  }

  function statusClass(s){
    s=String(s||'').toLowerCase();
    return s==='active'?'green':(s==='rejected'?'red':'');
  }

  async function refreshAdminName(client){
    try{
      var session=await client.auth.getSession();
      var uid=session.data&&session.data.session&&session.data.session.user&&session.data.session.user.id;
      if(!uid)return;
      var q=await client.from('profiles').select('full_name,role').eq('id',uid).maybeSingle();
      if(q.data&&document.getElementById('adminName')){
        document.getElementById('adminName').textContent='LEOGO DIGITAL MARKET · admin';
      }
    }catch(e){console.warn('Could not refresh admin name',e);}
  }

  async function loadAccounts(){
    var panel=ensurePanel();
    if(!panel)return;
    var area=document.getElementById('leogoTransporterAccountsArea');
    area.innerHTML='<div class="empty">Loading transporter accounts…</div>';
    var client=await sb();
    if(!client){area.innerHTML='<div class="empty">Admin session is loading. Please sign in and refresh this section.</div>';return;}
    await refreshAdminName(client);

    var owners=await client.from('profiles').select('id,full_name,phone,email,location,role,status,created_at').eq('role','vehicle_owner').order('created_at',{ascending:false});
    if(owners.error){area.innerHTML='<div class="msg error">Could not load transporter accounts: '+esc(owners.error.message)+'</div>';return;}
    if(!owners.data||!owners.data.length){area.innerHTML='<div class="empty">No transporter / vehicle-owner accounts found.</div>';return;}

    var ids=owners.data.map(function(x){return x.id;});
    var vr=await client.from('vehicles').select('id,owner_id,vehicle_type,registration,capacity_kg,approval_status,available,documents,owner_documents,recommended').in('owner_id',ids).order('created_at',{ascending:false});
    if(vr.error){area.innerHTML='<div class="msg error">Could not load transporter vehicles: '+esc(vr.error.message)+'</div>';return;}

    var byOwner={};
    (vr.data||[]).forEach(function(v){(byOwner[v.owner_id]||(byOwner[v.owner_id]=[])).push(v);});

    area.innerHTML=owners.data.map(function(o){
      var list=byOwner[o.id]||[];
      var s=String(o.status||'pending').toLowerCase();
      return '<div style="border:1px solid #e5e7eb;border-radius:16px;padding:15px;margin:12px 0">'+
        '<div class="toolbar"><div><h3 style="margin:0">'+esc(o.full_name||'Unnamed transporter')+'</h3><div class="muted">Transporter / Vehicle Owner Account</div></div>'+pill(o.status||'pending',statusClass(o.status))+'</div>'+
        '<div class="detail"><div><b>PHONE</b>'+esc(o.phone||'')+'</div><div><b>EMAIL</b>'+esc(o.email||'')+'</div><div><b>LOCATION</b>'+esc(o.location||'')+'</div><div><b>VEHICLES</b>'+esc(list.length)+'</div></div>'+ 
        '<div class="actions" style="margin-top:12px">'+
        '<button class="orange" onclick="window.leogoViewTransporterAccount(\''+esc(o.id)+'\')">VIEW ACCOUNT & DOCUMENTS</button>'+ 
        (s==='pending'?'<button class="approve" onclick="window.leogoTransporterAccountStatus(\''+esc(o.id)+'\',\'active\')">APPROVE ACCOUNT</button><button class="danger" onclick="window.leogoTransporterAccountStatus(\''+esc(o.id)+'\',\'rejected\')">REJECT ACCOUNT</button>':'')+
        (s==='active'?'<button class="danger" onclick="window.leogoTransporterAccountStatus(\''+esc(o.id)+'\',\'suspended\')">SUSPEND ACCOUNT</button>':'')+
        (s==='suspended'?'<button class="approve" onclick="window.leogoTransporterAccountStatus(\''+esc(o.id)+'\',\'active\')">RESTORE ACCOUNT</button>':'')+
        '</div></div>';
    }).join('');
  }

  window.leogoTransporterAccountStatus=async function(id,status){
    var client=await sb();
    if(!client){alert('Admin session is not ready. Please refresh the Admin page.');return;}
    if(!confirm('Confirm this transporter account change?'))return;
    var q=await client.from('profiles').update({status:status,updated_at:new Date().toISOString()}).eq('id',id).eq('role','vehicle_owner');
    if(q.error){alert('Account update failed: '+q.error.message);return;}
    await loadAccounts();
  };

  window.leogoViewTransporterAccount=async function(id){
    var client=await sb();
    if(!client){alert('Admin session is not ready. Please refresh the Admin page.');return;}
    var r=await client.from('profiles').select('id,full_name,phone,email,location,role,status,created_at').eq('id',id).eq('role','vehicle_owner').maybeSingle();
    var v=await client.from('vehicles').select('id,owner_id,vehicle_type,registration,capacity_kg,approval_status,available,documents,owner_documents,recommended').eq('owner_id',id).order('created_at',{ascending:false});
    if(r.error||!r.data){alert(r.error?.message||'Transporter account could not be loaded.');return;}
    if(v.error){alert('Vehicles could not be loaded: '+v.error.message);return;}
    var o=r.data, list=v.data||[];
    var html='<div class="detail"><div><b>FULL NAME</b>'+esc(o.full_name)+'</div><div><b>PHONE</b>'+esc(o.phone)+'</div><div><b>EMAIL</b>'+esc(o.email)+'</div><div><b>LOCATION</b>'+esc(o.location)+'</div><div><b>ACCOUNT STATUS</b>'+esc(o.status)+'</div><div><b>VEHICLES</b>'+esc(list.length)+'</div></div>';
    if(!list.length)html+='<div class="notice" style="margin-top:14px">No vehicle records are attached to this account.</div>';
    list.forEach(function(x,i){
      html+='<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Vehicle '+(i+1)+'</h3><div class="detail"><div><b>TYPE</b>'+esc(x.vehicle_type)+'</div><div><b>REGISTRATION</b>'+esc(x.registration)+'</div><div><b>CAPACITY</b>'+esc(x.capacity_kg||'')+' kg</div><div><b>APPROVAL</b>'+esc(x.approval_status)+'</div><div><b>AVAILABLE</b>'+esc(x.available?'Yes':'No')+'</div></div><div class="notice" style="margin-top:10px">Vehicle documents and transporter/owner documents are kept separate in the submitted record. Use the document review in the existing vehicle review control for secure document links.</div></div>';
    });
    document.getElementById('modalTitle').textContent='Transporter / Vehicle Owner Account';
    document.getElementById('modalBody').innerHTML=html;
    document.getElementById('modal').classList.remove('hidden');
  };

  function start(){
    var n=document.getElementById('adminName');
    if(n)n.textContent='LEOGO DIGITAL MARKET · admin';
    ensurePanel();
    var p=document.getElementById('page-transport');
    if(p&&p.classList.contains('active'))loadAccounts();
  }
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('[data-page="transport"]'):null;
    if(b){setTimeout(start,100);setTimeout(loadAccounts,700);}
  },true);
  setTimeout(start,500);
  setTimeout(start,1500);
})();

/* LEOGO TRANSPORT ASSIGNMENT PANEL FIX - isolated override.
   Uses the already-authenticated admin client and does not replace the existing
   vehicle/account management or customer transport workflow. */
(function(){
  var client=window.__leogoAdminSB;
  if(!client)return;
  var esc2=function(v){return String(v??'').replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});};
  var money2=function(v){return 'KSh '+Number(v||0).toLocaleString('en-KE',{minimumFractionDigits:0,maximumFractionDigits:2});};
  var busy=new Set(['assigned','accepted','in progress','picked up','on the way','out for delivery','processing','started']);

  async function loadAssignmentPanel(){
    var page=document.getElementById('page-transport');
    var panel=document.getElementById('leogoTransportDispatchPanel');
    if(!page||!panel)return;
    var area=document.getElementById('leogoTransportDispatchPanelArea');
    if(!area)return;
    area.innerHTML='<div class="empty">Loading transport bookings…</div>';
    try{
      var rq=await client.from('transport_requests').select('id,customer_id,driver_id,vehicle_id,pickup_location,destination,status,price,created_at').order('created_at',{ascending:false}).limit(100);
      if(rq.error){area.innerHTML='<div class="notice error">Could not load transport bookings: '+esc2(rq.error.message)+'</div>';return;}
      var vq=await client.from('vehicles').select('id,owner_id,vehicle_type,registration,capacity_kg,approval_status,available').eq('approval_status','approved').eq('available',true).order('created_at',{ascending:false});
      if(vq.error){area.innerHTML='<div class="notice error">Could not load available vehicles: '+esc2(vq.error.message)+'</div>';return;}
      var reqs=rq.data||[],vehicles=vq.data||[];
      if(!reqs.length){area.innerHTML='<div class="empty">No transport bookings or RFQs yet.</div>';return;}
      var customerIds=[...new Set(reqs.map(function(x){return x.customer_id;}).filter(Boolean))];
      var ownerIds=[...new Set(vehicles.map(function(x){return x.owner_id;}).concat(reqs.map(function(x){return x.driver_id;}).filter(Boolean)))];
      var cm={},pm={};
      if(customerIds.length){var cq=await client.from('profiles').select('id,full_name,phone,location').in('id',customerIds);if(cq.error){area.innerHTML='<div class="notice error">Could not load customer details: '+esc2(cq.error.message)+'</div>';return;} (cq.data||[]).forEach(function(x){cm[x.id]=x;});}
      if(ownerIds.length){var oq=await client.from('profiles').select('id,full_name,phone,location,status').in('id',ownerIds);if(oq.error){area.innerHTML='<div class="notice error">Could not load transporter details: '+esc2(oq.error.message)+'</div>';return;} (oq.data||[]).forEach(function(x){pm[x.id]=x;});}
      var active=reqs.filter(function(x){return busy.has(String(x.status||'').toLowerCase())&&x.driver_id;}).map(function(x){return x.vehicle_id;}).filter(Boolean);
      area.innerHTML=reqs.map(function(req){
        var cust=cm[req.customer_id]||{}, cur=pm[req.driver_id], curVehicle=vehicles.find(function(v){return v.id===req.vehicle_id;});
        var free=vehicles.filter(function(v){return !active.includes(v.id)||v.id===req.vehicle_id;});
        var options=free.map(function(v){var p=pm[v.owner_id]||{};return '<option value="'+esc2(v.id)+'" '+(v.id===req.vehicle_id?'selected':'')+'>'+esc2(p.full_name||v.owner_id)+' · '+esc2(v.vehicle_type||'Vehicle')+' · '+esc2(v.registration||'')+'</option>';}).join('');
        return '<div style="border:1px solid #e5e7eb;border-radius:15px;padding:14px;margin-bottom:12px">'+
          '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><b>#'+esc2(String(req.id).slice(0,8))+'</b> <span class="pill blue">TRANSPORT</span><div class="muted">'+esc2(new Date(req.created_at).toLocaleString('en-KE'))+'</div></div><span class="pill '+(String(req.status||'').toLowerCase()==='assigned'?'green':'')+'">'+esc2(req.status||'Requested')+'</span></div>'+
          '<div class="detail"><div><b>CUSTOMER</b>'+esc2(cust.full_name||req.customer_id||'')+'<br>'+esc2(cust.phone||'')+'</div><div><b>ROUTE</b>'+esc2(req.pickup_location||'')+' → '+esc2(req.destination||'')+'</div><div><b>PRICE</b>'+money2(req.price)+'</div><div><b>CURRENT ASSIGNMENT</b>'+esc2(cur?.full_name||'Unassigned')+(curVehicle?' · '+esc2(curVehicle.registration||curVehicle.vehicle_type):'')+'</div></div>'+
          (options?'<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-top:12px"><div><label>Assign Driver / Vehicle</label><select id="transportAssignFix_'+esc2(req.id)+'">'+options+'</select></div><button class="orange" onclick="window.__leogoAssignTransportFix(\''+esc2(req.id)+'\',this)">'+(req.driver_id?'REASSIGN':'ASSIGN')+'</button></div>':'<div class="notice" style="margin-top:12px">No approved and available vehicle is currently available for assignment.</div>')+
        '</div>';
      }).join('');
    }catch(e){area.innerHTML='<div class="notice error">Transport assignment panel error: '+esc2(e.message||e)+'</div>';}
  }

  window.__leogoAssignTransportFix=async function(requestId,btn){
    var sel=document.getElementById('transportAssignFix_'+requestId),vehicleId=sel&&sel.value;
    if(!vehicleId)return;
    if(btn){btn.disabled=true;btn.textContent='Saving…';}
    var v=await client.from('vehicles').select('owner_id').eq('id',vehicleId).maybeSingle();
    if(v.error||!v.data?.owner_id){alert(v.error?.message||'Could not identify the vehicle owner.');if(btn){btn.disabled=false;btn.textContent='ASSIGN';}return;}
    var q=await client.from('transport_requests').update({driver_id:v.data.owner_id,vehicle_id:vehicleId,status:'Assigned',updated_at:new Date().toISOString()}).eq('id',requestId);
    if(q.error){alert('Assignment failed: '+q.error.message);if(btn){btn.disabled=false;btn.textContent='ASSIGN';}return;}
    await loadAssignmentPanel();
  };

  function hook(){
    var page=document.getElementById('page-transport');
    if(page&&page.classList.contains('active'))loadAssignmentPanel();
  }
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest?e.target.closest('[data-page="transport"]'):null;
    if(b){setTimeout(loadAssignmentPanel,900);}
  },true);
  setTimeout(hook,1200);
})();