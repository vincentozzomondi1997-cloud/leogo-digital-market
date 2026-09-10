/* LEOGO TRANSPORTER DASHBOARD - isolated transport-owner features. */
(function(){
  if(window.__leogoTransportDashboardInstalled)return;
  window.__leogoTransportDashboardInstalled=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sbx=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const types=['Motorcycle','Passenger Tuk Tuk','Luggage Tuk Tuk','Pickup','Canter','Lorry','Trailer','Other'];
  const money=v=>'KSh '+Number(v||0).toLocaleString('en-KE',{minimumFractionDigits:2,maximumFractionDigits:2});
  let uid=null,vehicles=[];

  function status(v){const s=String(v||'pending');const cls=s.toLowerCase().replace(/\s+/g,'-');return '<span class="pill '+esc(cls)+'">'+esc(s)+'</span>';}
  function ensureStyle(){if(document.getElementById('leogoTransportDashStyle'))return;const st=document.createElement('style');st.id='leogoTransportDashStyle';st.textContent='.td-panel{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:18px;margin-bottom:18px}.td-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}.td-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:14px}.td-card{border:1px solid #e5e7eb;border-radius:13px;padding:14px;background:#fafbfc}.td-card h3{margin:0 0 7px;color:#07152f}.td-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.td-table{width:100%;border-collapse:collapse;min-width:760px}.td-table th,.td-table td{text-align:left;padding:10px;border-bottom:1px solid #eef0f4;font-size:13px}.td-table th{background:#f9fafb;color:#667085}.td-empty{text-align:center;padding:24px;color:#667085}.td-modal{position:fixed;inset:0;background:#07152f88;display:flex;align-items:center;justify-content:center;padding:18px;z-index:9999}.td-modal-card{width:min(620px,100%);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;padding:20px}.td-field{margin-top:12px}.td-field label{display:block;font-weight:800;font-size:13px;margin-bottom:6px}.td-field input,.td-field select{width:100%;padding:11px;border:1px solid #d7dce4;border-radius:9px;font:inherit}.td-msg{margin-top:12px;padding:10px;border-radius:9px}.td-error{background:#fef2f2;color:#991b1b}.td-success{background:#ecfdf3;color:#166534}@media(max-width:750px){.td-grid{grid-template-columns:1fr}}';document.head.appendChild(st);}

  function inject(){
    if(document.getElementById('leogoTransportDashboard'))return document.getElementById('leogoTransportDashboard');
    const cards=document.querySelector('.cards');if(!cards)return null;
    const p=document.createElement('section');p.id='leogoTransportDashboard';p.className='td-panel';
    p.innerHTML='<div class="td-head"><div><h2 style="margin:0;color:#07152f">🚚 Transport & Delivery</h2><div class="muted" style="margin-top:5px">Manage your vehicles and see transport bookings assigned to you.</div></div><div class="td-actions"><button class="btn orange" id="tdAddVehicle">＋ ADD VEHICLE</button><button class="btn secondary" id="tdRefresh">↻ REFRESH</button></div></div><div class="td-grid" id="tdVehicleGrid"><div class="td-empty">Loading vehicles…</div></div><div style="margin-top:20px"><h3 style="color:#07152f">Assigned Transport Bookings</h3><div class="table-wrap"><table class="td-table"><thead><tr><th>Date</th><th>Vehicle</th><th>Pickup</th><th>Destination</th><th>Status</th><th>Amount</th></tr></thead><tbody id="tdBookingRows"><tr><td colspan="6" class="td-empty">Loading…</td></tr></tbody></table></div></div>';
    cards.insertAdjacentElement('afterend',p);
    document.getElementById('tdAddVehicle').onclick=openAddVehicle;
    document.getElementById('tdRefresh').onclick=load;
    return p;
  }

  function renderVehicles(){
    const grid=document.getElementById('tdVehicleGrid');if(!grid)return;
    if(!vehicles.length){grid.innerHTML='<div class="td-empty">No vehicles registered yet. Add your first vehicle.</div>';return;}
    grid.innerHTML=vehicles.map(v=>'<div class="td-card"><h3>'+esc(v.vehicle_type)+'</h3><div class="muted">Registration: '+esc(v.registration||'Not provided')+'</div><div class="muted" style="margin-top:4px">Capacity: '+esc(v.capacity_kg??'—')+' kg</div><div style="margin-top:9px">'+status(v.approval_status)+' '+(v.available?'<span class="pill paid">Available</span>':'<span class="pill">Unavailable</span>')+'</div><div class="td-actions"><button class="btn secondary" data-toggle="'+esc(v.id)+'">'+(v.available?'SET UNAVAILABLE':'SET AVAILABLE')+'</button></div></div>').join('');
    grid.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=()=>toggleAvailability(b.dataset.toggle));
  }

  async function toggleAvailability(id){
    const v=vehicles.find(x=>x.id===id);if(!v)return;
    const q=await sbx.from('vehicles').update({available:!v.available}).eq('id',id).eq('owner_id',uid);
    if(q.error){alert(q.error.message);return;}await load();
  }

  async function loadBookings(){
    const body=document.getElementById('tdBookingRows');if(!body)return;
    const q=await sbx.from('transport_requests').select('id,vehicle_id,pickup_location,destination,status,price,created_at').eq('driver_id',uid).order('created_at',{ascending:false}).limit(100);
    if(q.error){body.innerHTML='<tr><td colspan="6" class="td-empty">Unable to load assigned transport bookings.</td></tr>';return;}
    const byId=Object.fromEntries(vehicles.map(v=>[v.id,v]));
    const rows=q.data||[];
    body.innerHTML=rows.length?rows.map(x=>'<tr><td>'+esc(new Date(x.created_at).toLocaleString('en-KE'))+'</td><td>'+esc(byId[x.vehicle_id]?.vehicle_type||'Vehicle')+'<br><span class="muted">'+esc(byId[x.vehicle_id]?.registration||'')+'</span></td><td>'+esc(x.pickup_location||'—')+'</td><td>'+esc(x.destination||'—')+'</td><td>'+status(x.status)+'</td><td>'+money(x.price)+'</td></tr>').join(''):'<tr><td colspan="6" class="td-empty">No transport bookings have been assigned to you yet.</td></tr>';
  }

  function openAddVehicle(){
    document.getElementById('tdVehicleModal')?.remove();
    const m=document.createElement('div');m.id='tdVehicleModal';m.className='td-modal';
    m.innerHTML='<div class="td-modal-card"><div class="td-head"><div><h2 style="margin:0;color:#07152f">Add Another Vehicle</h2><div class="muted" style="margin-top:4px">The new vehicle will be submitted as Pending for Admin review.</div></div><button class="btn secondary" id="tdClose">✕</button></div><div class="td-field"><label>Vehicle Type</label><select id="tdType">'+types.map(t=>'<option>'+esc(t)+'</option>').join('')+'</select><input id="tdOther" placeholder="Specify vehicle type" style="display:none;margin-top:8px"></div><div class="td-field"><label>Vehicle Registration</label><input id="tdReg" placeholder="e.g. KMEU750X"></div><div class="td-field"><label>Capacity (kg)</label><input id="tdCap" type="number" min="0" placeholder="e.g. 2"></div><div id="tdMsg"></div><div class="td-actions" style="justify-content:flex-end"><button class="btn secondary" id="tdCancel">CANCEL</button><button class="btn orange" id="tdSave">SUBMIT VEHICLE</button></div></div>';
    document.body.appendChild(m);
    const type=document.getElementById('tdType');type.onchange=()=>document.getElementById('tdOther').style.display=type.value==='Other'?'block':'none';
    document.getElementById('tdClose').onclick=()=>m.remove();document.getElementById('tdCancel').onclick=()=>m.remove();
    document.getElementById('tdSave').onclick=async()=>{
      const t=type.value==='Other'?document.getElementById('tdOther').value.trim():type.value;
      const reg=document.getElementById('tdReg').value.trim()||null;const capRaw=document.getElementById('tdCap').value;const cap=capRaw?Number(capRaw):null;const msg=document.getElementById('tdMsg');
      if(!t){msg.className='td-msg td-error';msg.textContent='Please specify the vehicle type.';return;}if(cap!==null&&(!Number.isFinite(cap)||cap<0)){msg.className='td-msg td-error';msg.textContent='Please enter a valid capacity.';return;}
      if(reg){const existing=await sbx.from('vehicles').select('id').eq('owner_id',uid).eq('registration',reg).maybeSingle();if(existing.data){msg.className='td-msg td-error';msg.textContent='You already have a vehicle with this registration.';return;}}
      const b=document.getElementById('tdSave');b.disabled=true;b.textContent='SUBMITTING…';
      const q=await sbx.from('vehicles').insert({owner_id:uid,vehicle_type:t,registration:reg,capacity_kg:cap,approval_status:'pending',available:true,documents:[]}).select('id').maybeSingle();
      if(q.error){b.disabled=false;b.textContent='SUBMIT VEHICLE';msg.className='td-msg td-error';msg.textContent=q.error.message;return;}
      msg.className='td-msg td-success';msg.textContent='Vehicle submitted for Admin review.';b.textContent='SUBMITTED';setTimeout(()=>{m.remove();load();},700);
    };
  }

  async function load(){
    const p=inject();if(!p)return;
    ensureStyle();
    const s=await sbx.auth.getSession();if(!s.data?.session){location.href='seller_register.html';return;}uid=s.data.session.user.id;
    const q=await sbx.from('vehicles').select('id,vehicle_type,registration,capacity_kg,approval_status,available,created_at').eq('owner_id',uid).order('created_at',{ascending:false});
    if(q.error){document.getElementById('tdVehicleGrid').innerHTML='<div class="td-empty">Unable to load your vehicles.</div>';return;}
    vehicles=q.data||[];renderVehicles();await loadBookings();
  }

  async function start(){
    const s=await sbx.auth.getSession();
    if(!s.data?.session)return;
    const {data:profile}=await sbx.from('profiles').select('role').eq('id',s.data.session.user.id).maybeSingle();
    const role=String(profile?.role||'').toLowerCase();
    if(!['vehicle_owner','driver','rider'].includes(role))return;
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
  }

  start();
})();