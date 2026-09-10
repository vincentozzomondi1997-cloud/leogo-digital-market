/* LEOGO ADMIN DISPATCH - isolated admin assignment controls.
   Transport assignment is rendered INSIDE Transport Requests.
   Existing service/delivery assignment panels remain available. */
(function(){
  if(window.__leogoAdminDispatchInstalled)return;
  window.__leogoAdminDispatchInstalled=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const money=v=>'KSh '+Number(v||0).toLocaleString('en-KE',{minimumFractionDigits:0,maximumFractionDigits:2});
  const pill=(v,k='')=>'<span class="pill '+k+'">'+esc(v)+'</span>';
  const busyStatuses=new Set(['assigned','accepted','in progress','on the way','out for delivery','picked up','processing','started']);

  function card(title,subtitle,id){
    let p=document.getElementById(id); if(p)return p;
    p=document.createElement('div'); p.id=id; p.className='card';
    p.innerHTML='<div class="toolbar"><div><h2 style="margin:0">'+title+'</h2><div class="muted">'+subtitle+'</div></div><button class="light" id="'+id+'Refresh">↻ REFRESH</button></div><div id="'+id+'Area" style="margin-top:12px"><div class="empty">Loading…</div></div>';
    return p;
  }

  async function loadServiceDispatch(){
    const page=document.getElementById('page-services'); if(!page)return;
    const p=card('📌 Service Booking Assignment','Assign customer service bookings to an approved and available service provider.','leogoServiceDispatchPanel');
    if(!p.parentNode)page.appendChild(p);
    document.getElementById('leogoServiceDispatchRefresh').onclick=loadServiceDispatch;
    const area=document.getElementById('leogoServiceDispatchPanelArea'); area.innerHTML='<div class="empty">Loading service bookings…</div>';
    const j=await sb.from('service_jobs').select('id,customer_id,provider_id,service_id,location,landmark,price,status,request_type,created_at').order('created_at',{ascending:false}).limit(100);
    if(j.error){area.innerHTML='<div class="notice error">'+esc(j.error.message)+'</div>';return;}
    const jobs=(j.data||[]).filter(x=>String(x.request_type||'service_request')!=='quotation_request');
    if(!jobs.length){area.innerHTML='<div class="empty">No service bookings requiring assignment.</div>';return;}
    const serviceIds=[...new Set(jobs.map(x=>x.service_id).filter(Boolean))],customerIds=[...new Set(jobs.map(x=>x.customer_id).filter(Boolean))],providerIds=[...new Set(jobs.map(x=>x.provider_id).filter(Boolean))];
    const [s,pf,c]=await Promise.all([
      serviceIds.length?sb.from('services').select('id,name,category,provider_id,approved,available').in('id',serviceIds):Promise.resolve({data:[],error:null}),
      providerIds.length?sb.from('profiles').select('id,full_name,phone,location,status').in('id',providerIds):Promise.resolve({data:[],error:null}),
      customerIds.length?sb.from('profiles').select('id,full_name,phone,location').in('id',customerIds):Promise.resolve({data:[],error:null})
    ]);
    const sm=new Map((s.data||[]).map(x=>[x.id,x])),pm=new Map((pf.data||[]).map(x=>[x.id,x])),cm=new Map((c.data||[]).map(x=>[x.id,x]));
    const av=await sb.from('services').select('provider_id,name,category').eq('approved',true).eq('available',true); const rows=av.data||[];
    const allPids=[...new Set([...rows.map(x=>x.provider_id),...providerIds].filter(Boolean))];
    if(allPids.length){const pp=await sb.from('profiles').select('id,full_name,phone,location,status').in('id',allPids);(pp.data||[]).forEach(x=>pm.set(x.id,x));}
    area.innerHTML=jobs.map(job=>{
      const service=sm.get(job.service_id)||{},customer=cm.get(job.customer_id)||{},current=job.provider_id?pm.get(job.provider_id):null;
      const candidates=[...new Map(rows.filter(x=>x.provider_id&&((service.category&&x.category===service.category)||(service.name&&x.name===service.name))).map(x=>[x.provider_id,x])).values()];
      if(job.provider_id&&!candidates.some(x=>x.provider_id===job.provider_id))candidates.unshift({provider_id:job.provider_id,name:service.name||'Current provider',category:service.category||''});
      const opts=candidates.map(x=>{const p=pm.get(x.provider_id);return '<option value="'+esc(x.provider_id)+'" '+(x.provider_id===job.provider_id?'selected':'')+'>'+esc(p?.full_name||x.provider_id)+' · '+esc(p?.location||'')+'</option>'}).join('');
      return '<div style="border:1px solid #e5e7eb;border-radius:15px;padding:14px;margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><b>'+esc(service.name||'Service booking')+'</b> <span class="pill blue">BOOKING</span><div class="muted">#'+esc(String(job.id).slice(0,8))+' · '+esc(new Date(job.created_at).toLocaleString('en-KE'))+'</div></div>'+pill(job.status||'Requested')+'</div><div class="detail"><div><b>CUSTOMER</b>'+esc(customer.full_name||job.customer_id||'')+'<br>'+esc(customer.phone||'')+'</div><div><b>LOCATION</b>'+esc(job.location||'')+(job.landmark?' · '+esc(job.landmark):'')+'</div><div><b>SERVICE</b>'+esc(service.category||'')+' · '+money(job.price)+'</div><div><b>CURRENT PROVIDER</b>'+esc(current?.full_name||'Unassigned')+'</div></div>'+(candidates.length?'<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-top:12px"><div><label>Assign Service Provider</label><select id="svcAssign_'+esc(job.id)+'">'+opts+'</select></div><button class="orange" onclick="window.__leogoAssignService(\''+esc(job.id)+'\',this)">'+(job.provider_id?'REASSIGN':'ASSIGN')+'</button></div>':'<div class="notice" style="margin-top:12px">No approved and available provider currently offers this service/category.</div>')+'</div>';
    }).join('');
  }
  window.__leogoAssignService=async function(jobId,btn){const providerId=document.getElementById('svcAssign_'+jobId)?.value;if(!providerId)return;if(btn){btn.disabled=true;btn.textContent='Saving…';}const q=await sb.from('service_jobs').update({provider_id:providerId,status:'Assigned',updated_at:new Date().toISOString()}).eq('id',jobId);if(q.error){alert(q.error.message);if(btn){btn.disabled=false;btn.textContent='ASSIGN';}return;}await loadServiceDispatch();};

  async function loadTransportDispatch(){
    const page=document.getElementById('page-transport'); if(!page)return;
    const area=document.getElementById('transportArea'); if(!area)return;
    if(document.getElementById('leogoTransportAssignmentInline'))document.getElementById('leogoTransportAssignmentInline').remove();
    area.insertAdjacentHTML('afterend','<div id="leogoTransportAssignmentInline" class="card" style="margin-top:16px"><div class="toolbar"><div><h2 style="margin:0">🚚 Transport Booking Assignment</h2><div class="muted">Assign each customer request to an approved and available vehicle owner.</div></div><button class="light" id="leogoTransportInlineRefresh">↻ REFRESH</button></div><div id="leogoTransportInlineArea" style="margin-top:12px"><div class="empty">Loading…</div></div></div>');
    const inline=document.getElementById('leogoTransportInlineArea');
    if(!inline)return;
    document.getElementById('leogoTransportInlineRefresh').onclick=loadTransportDispatch;
    inline.innerHTML='<div class="empty">Loading transport requests and approved vehicles…</div>';
    const [rq,vq]=await Promise.all([
      sb.from('transport_requests').select('id,customer_id,driver_id,vehicle_id,pickup_location,destination,status,price,created_at,transport_service,other_service,point_a_location_link,point_a_lat,point_a_lng,point_b_location_link,point_b_lat,point_b_lng,contact_phone,id_number,timing_type,preferred_date,preferred_time,after_period_value,after_period_unit,urgency,passenger_count,cargo_quantity,cargo_description,description,status_note,status_updated_at,preferred_vehicle_category').order('created_at',{ascending:false}).limit(100),
      sb.from('vehicles').select('id,owner_id,vehicle_type,registration,capacity_kg,approval_status,available').eq('approval_status','approved').eq('available',true).order('created_at',{ascending:false})
    ]);
    if(rq.error){inline.innerHTML='<div class="notice error">Could not load transport requests: '+esc(rq.error.message)+'</div>';return;}
    if(vq.error){inline.innerHTML='<div class="notice error">Could not load approved vehicles: '+esc(vq.error.message)+'</div>';return;}
    const reqs=rq.data||[],vehicles=vq.data||[];
    if(!reqs.length){inline.innerHTML='<div class="empty">No transport requests found.</div>';return;}
    const customerIds=[...new Set(reqs.map(x=>x.customer_id).filter(Boolean))],ownerIds=[...new Set(vehicles.map(x=>x.owner_id).concat(reqs.map(x=>x.driver_id).filter(Boolean)))];
    const [cq,pq]=await Promise.all([
      customerIds.length?sb.from('profiles').select('id,full_name,phone,location').in('id',customerIds):Promise.resolve({data:[],error:null}),
      ownerIds.length?sb.from('profiles').select('id,full_name,phone,location,status').in('id',ownerIds):Promise.resolve({data:[],error:null})
    ]);
    const cm=new Map((cq.data||[]).map(x=>[x.id,x])),pm=new Map((pq.data||[]).map(x=>[x.id,x]));
    const active=reqs.filter(x=>busyStatuses.has(String(x.status||'').toLowerCase())&&x.driver_id).map(x=>x.vehicle_id).filter(Boolean);
    inline.innerHTML=reqs.map(req=>{
      const cust=cm.get(req.customer_id)||{},curDriver=pm.get(req.driver_id),curVehicle=vehicles.find(x=>x.id===req.vehicle_id);
      const freeVehicles=vehicles.filter(v=>!active.includes(v.id)||v.id===req.vehicle_id);
      const options=freeVehicles.map(v=>{const p=pm.get(v.owner_id);return '<option value="'+esc(v.id)+'" '+(v.id===req.vehicle_id?'selected':'')+'>'+esc(p?.full_name||v.owner_id)+' · '+esc(v.vehicle_type||'Vehicle')+' · '+esc(v.registration||'')+'</option>'}).join('');
      const mapLink=(label,url)=>url?'<a class="btn light" style="display:inline-block;margin-top:6px;text-decoration:none" href="'+esc(url)+'" target="_blank" rel="noopener">'+label+'</a>':'';
      return '<div style="border:1px solid #e5e7eb;border-radius:15px;padding:14px;margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><b>#'+esc(String(req.id).slice(0,8))+'</b> <span class="pill blue">TRANSPORT</span><div class="muted">'+esc(new Date(req.created_at).toLocaleString('en-KE'))+'</div></div>'+pill(req.status||'Requested',String(req.status||'').toLowerCase()==='assigned'?'green':'')+'</div><div class="detail"><div><b>CUSTOMER</b>'+esc(cust.full_name||req.customer_id||'')+'<br>'+esc(req.contact_phone||cust.phone||'')+'</div><div><b>SERVICE</b>'+esc(req.transport_service||'Transport')+(req.other_service?' — '+esc(req.other_service):'')+'<br>Preferred vehicle: '+esc(req.preferred_vehicle_category||'LEOGO chooses')+'</div><div><b>POINT A</b>'+esc(req.pickup_location||'')+'<br>'+mapLink('OPEN POINT A MAP',req.point_a_location_link)+'</div><div><b>POINT B</b>'+esc(req.destination||'')+'<br>'+mapLink('OPEN POINT B MAP',req.point_b_location_link)+'</div><div><b>WHEN / URGENCY</b>'+esc(req.timing_type||'Now')+(req.preferred_date?' · '+esc(req.preferred_date):'')+(req.preferred_time?' '+esc(String(req.preferred_time).slice(0,5)):'')+(req.after_period_value?' · After '+esc(req.after_period_value)+' '+esc(req.after_period_unit||''):'')+'<br>'+esc(req.urgency||'Normal')+'</div><div><b>PASSENGERS / CARGO</b>'+esc(req.passenger_count??'—')+' passengers · '+esc(req.cargo_quantity??'—')+' qty<br>'+esc(req.cargo_description||'')+'</div><div><b>DESCRIPTION</b>'+esc(req.description||req.notes||'No additional instructions')+'</div><div><b>ID NUMBER</b>'+esc(req.id_number||'Not provided')+'</div><div><b>CURRENT ASSIGNMENT</b>'+esc(curDriver?.full_name||'Unassigned')+(curVehicle?' · '+esc(curVehicle.registration||curVehicle.vehicle_type):'')+'</div><div><b>STATUS UPDATE</b>'+esc(req.status_note||'Awaiting admin assignment')+(req.status_updated_at?' · '+esc(new Date(req.status_updated_at).toLocaleString('en-KE')):'')+'</div></div>'+(options?'<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-top:12px"><div><label>Assign Approved Vehicle / Owner</label><select id="transportAssign_'+esc(req.id)+'">'+options+'</select></div><button class="orange" onclick="window.__leogoAssignTransport(\''+esc(req.id)+'\',this)">'+(req.driver_id?'REASSIGN':'ASSIGN VEHICLE')+'</button></div>':'<div class="notice" style="margin-top:12px">No approved and available vehicle is currently available for assignment.</div>')+'</div>';
    }).join('');
  }
  window.__leogoAssignTransport=async function(requestId,btn){
    const vehicleId=document.getElementById('transportAssign_'+requestId)?.value;if(!vehicleId)return;
    if(btn){btn.disabled=true;btn.textContent='Assigning…';}
    const v=await sb.from('vehicles').select('owner_id,vehicle_type,registration,approval_status,available').eq('id',vehicleId).maybeSingle();
    if(v.error||!v.data?.owner_id){alert(v.error?.message||'Could not identify the vehicle owner.');if(btn){btn.disabled=false;btn.textContent='ASSIGN VEHICLE';}return;}
    if(v.data.approval_status!=='approved'||!v.data.available){alert('This vehicle is no longer approved and available. Refresh the list.');if(btn){btn.disabled=false;btn.textContent='ASSIGN VEHICLE';}return;}
    const q=await sb.from('transport_requests').update({driver_id:v.data.owner_id,vehicle_id:vehicleId,status:'Assigned',updated_at:new Date().toISOString()}).eq('id',requestId);
    if(q.error){alert(q.error.message);if(btn){btn.disabled=false;btn.textContent='ASSIGN VEHICLE';}return;}
    await loadTransportDispatch();
    if(typeof window.loadTransport==='function')await window.loadTransport();
  };

  async function loadDeliveryDispatch(){
    const page=document.getElementById('page-delivery');if(!page)return;
    const p=card('📦 Delivery Assignment','Assign customer product orders to an approved and available delivery provider.','leogoDeliveryDispatchPanel');if(!p.parentNode)page.appendChild(p);
    document.getElementById('leogoDeliveryDispatchRefresh').onclick=loadDeliveryDispatch;
    const area=document.getElementById('leogoDeliveryDispatchPanelArea');area.innerHTML='<div class="empty">Loading deliveries…</div>';
    const [oq,vq]=await Promise.all([
      sb.from('orders').select('id,customer_id,receiver_name,receiver_phone,delivery_location,landmark,total_amount,payment_method,payment_status,status,assigned_rider_id,created_at').is('assigned_rider_id',null).not('status','in','(Delivered,Cancelled)').order('created_at',{ascending:false}).limit(100),
      sb.from('vehicles').select('id,owner_id,vehicle_type,registration,approval_status,available').eq('approval_status','approved').eq('available',true).order('created_at',{ascending:false})
    ]);
    if(oq.error){area.innerHTML='<div class="notice error">'+esc(oq.error.message)+'</div>';return;}if(vq.error){area.innerHTML='<div class="notice error">'+esc(vq.error.message)+'</div>';return;}
    const orders=oq.data||[],vehicles=vq.data||[];if(!orders.length){area.innerHTML='<div class="empty">No unassigned deliveries waiting.</div>';return;}
    const customerIds=[...new Set(orders.map(x=>x.customer_id).filter(Boolean))],ownerIds=[...new Set(vehicles.map(x=>x.owner_id).filter(Boolean))];
    const [cq,pq]=await Promise.all([customerIds.length?sb.from('profiles').select('id,full_name,phone,location').in('id',customerIds):Promise.resolve({data:[],error:null}),ownerIds.length?sb.from('profiles').select('id,full_name,phone,location,status').in('id',ownerIds):Promise.resolve({data:[],error:null})]);
    const cm=new Map((cq.data||[]).map(x=>[x.id,x])),pm=new Map((pq.data||[]).map(x=>[x.id,x]));
    const opts=vehicles.map(v=>'<option value="'+esc(v.owner_id)+'">'+esc(pm.get(v.owner_id)?.full_name||v.owner_id)+' · '+esc(v.vehicle_type||'Vehicle')+' · '+esc(v.registration||'')+'</option>').join('');
    area.innerHTML=orders.map(o=>{const c=cm.get(o.customer_id)||{};return '<div style="border:1px solid #e5e7eb;border-radius:15px;padding:14px;margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><b>Order #'+esc(String(o.id).slice(0,8))+'</b><div class="muted">'+esc(new Date(o.created_at).toLocaleString('en-KE'))+'</div></div>'+pill(o.status||'New')+'</div><div class="detail"><div><b>CUSTOMER</b>'+esc(o.receiver_name||c.full_name||'')+'<br>'+esc(o.receiver_phone||c.phone||'')+'</div><div><b>DELIVERY</b>'+esc(o.delivery_location||'')+(o.landmark?' · '+esc(o.landmark):'')+'</div><div><b>ORDER TOTAL</b>'+money(o.total_amount)+'<br>'+esc(o.payment_method||'')+' · '+esc(o.payment_status||'')+'</div><div><b>ASSIGNMENT</b>Awaiting delivery provider</div></div>'+(opts?'<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:end;margin-top:12px"><div><label>Assign Delivery Provider</label><select id="deliveryAssign_'+esc(o.id)+'">'+opts+'</select></div><button class="orange" onclick="window.__leogoAssignDelivery(\''+esc(o.id)+'\',this)">ASSIGN DELIVERY</button></div>':'<div class="notice" style="margin-top:12px">No approved and available delivery provider is currently available.</div>')+'</div>';}).join('');
  }
  window.__leogoAssignDelivery=async function(orderId,btn){const riderId=document.getElementById('deliveryAssign_'+orderId)?.value;if(!riderId)return;if(btn){btn.disabled=true;btn.textContent='Saving…';}const q=await sb.from('orders').update({assigned_rider_id:riderId,updated_at:new Date().toISOString()}).eq('id',orderId);if(q.error){alert(q.error.message);if(btn){btn.disabled=false;btn.textContent='ASSIGN DELIVERY';}return;}await loadDeliveryDispatch();};

  function installTransportHook(){
    if(typeof window.loadTransport!=='function'||window.__leogoTransportHooked)return;
    const original=window.loadTransport;window.__leogoTransportHooked=true;
    window.loadTransport=async function(){await original.apply(this,arguments);await loadTransportDispatch();};
    if(document.getElementById('page-transport')?.classList.contains('active'))window.loadTransport();
  }
  function boot(){
    installTransportHook();
    const s=document.getElementById('page-services'),t=document.getElementById('page-transport'),d=document.getElementById('page-delivery');
    if(s)loadServiceDispatch();if(d)loadDeliveryDispatch();
    if(t&&!window.__leogoTransportHooked)loadTransportDispatch();
  }
  const timer=setInterval(()=>{if(document.getElementById('page-services')||document.getElementById('page-transport')||document.getElementById('page-delivery'))boot();},800);
  setTimeout(()=>clearInterval(timer),20000);
})();