/* LEOGO - TRANSPORTER / VEHICLE OWNER ACCOUNT MANAGEMENT
   Isolated from the existing vehicle table, admin navigation and dispatch code. */
(function(){
  function esc(v){return String(v??'').replace(/[&<>\"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]});}
  function sb(){return window.__leogoAdminSB||null;}
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

  async function loadAccounts(){
    var client=sb();
    var panel=ensurePanel();
    if(!panel)return;
    var area=document.getElementById('leogoTransporterAccountsArea');
    if(!client){area.innerHTML='<div class="empty">Admin session is loading. Please wait a moment and refresh.</div>';return;}
    area.innerHTML='<div class="empty">Loading transporter accounts…</div>';

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
    var client=sb();
    if(!client){alert('Admin session is not ready. Please refresh the Admin page.');return;}
    if(!confirm('Confirm this transporter account change?'))return;
    var q=await client.from('profiles').update({status:status,updated_at:new Date().toISOString()}).eq('id',id).eq('role','vehicle_owner');
    if(q.error){alert('Account update failed: '+q.error.message);return;}
    await loadAccounts();
  };

  window.leogoViewTransporterAccount=async function(id){
    var client=sb();
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
