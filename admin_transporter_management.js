/* LEOGO ADMIN TRANSPORTER ACCOUNT REVIEW - isolated module.
   IMPORTANT: this module intentionally reuses the existing admin Supabase client
   so it cannot create a second auth context or interfere with the working admin
   transport/vehicle module. */
(function(){
  if(window.__leogoTransporterManagementInstalled)return;
  window.__leogoTransporterManagementInstalled=true;

  const client = window.sb || window.supabaseClient || window._supabase || null;
  if(!client){
    console.warn('LEOGO transporter management: existing admin Supabase client was not found. Existing transport module left untouched.');
    return;
  }
  const sb = client;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const pill=(v,k='')=>'<span class="pill '+k+'">'+esc(v)+'</span>';

  async function signedDocs(value){
    const docs=[];
    const walk=v=>{
      if(v==null)return;
      if(typeof v==='string'){
        const s=v.trim();
        if(/^https?:\/\//i.test(s))docs.push({label:'Document',url:s});
        else if(s)docs.push({label:'Document',name:s,path:s});
        return;
      }
      if(Array.isArray(v)){v.forEach(walk);return;}
      if(typeof v==='object'){
        if(v.path)docs.push(v);
        else Object.entries(v).forEach(([k,x])=>{
          if(typeof x==='string'&&/^https?:\/\//i.test(x.trim()))docs.push({label:k,url:x.trim()});
          else if(x&&typeof x==='object')walk(x);
        });
      }
    };
    walk(value);
    const out=[];
    for(const d of docs){
      if(d.url){out.push({doc:d,url:d.url});continue;}
      if(!d.path)continue;
      const q=await sb.storage.from('business-documents').createSignedUrl(d.path,900);
      if(!q.error&&q.data?.signedUrl)out.push({doc:d,url:q.data.signedUrl});
    }
    return out;
  }

  function docsHtml(title,list,empty){
    return '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">'+esc(title)+'</h3>'+(!list.length?'<div class="muted">'+esc(empty)+'</div>':list.map((d,i)=>'<div class="setting-row"><div><b>'+esc(d.doc?.label||d.doc?.name||('Document '+(i+1)))+'</b><div class="muted">'+esc(d.doc?.name||d.doc?.path||'')+'</div></div><a class="button light" target="_blank" rel="noopener" href="'+esc(d.url)+'">VIEW DOCUMENT</a></div>').join(''))+'</div>';
  }

  async function loadTransporters(){
    const page=document.getElementById('page-transport');
    if(!page)return;
    let panel=document.getElementById('leogoTransporterAccountsPanel');
    if(!panel){
      panel=document.createElement('div');
      panel.id='leogoTransporterAccountsPanel';
      panel.className='card';
      panel.innerHTML='<div class="toolbar"><div><h2 style="margin:0">🚛 Transporter Account Management</h2><div class="muted">Review vehicle owners and their submitted documents before approving the transporter account.</div></div><button class="light" id="leogoTransporterAccountsRefresh">↻ REFRESH</button></div><div id="leogoTransporterAccountsArea" style="margin-top:12px"><div class="empty">Loading…</div></div>';
      page.insertBefore(panel,page.firstElementChild);
      document.getElementById('leogoTransporterAccountsRefresh').onclick=loadTransporters;
    }
    const area=document.getElementById('leogoTransporterAccountsArea');
    area.innerHTML='<div class="empty">Loading transporter accounts…</div>';

    const p=await sb.from('profiles').select('id,full_name,phone,email,location,role,status,created_at,updated_at').eq('role','vehicle_owner').order('created_at',{ascending:false});
    if(p.error){area.innerHTML='<div class="notice error">Could not load transporter accounts: '+esc(p.error.message)+'</div>';return;}
    const owners=p.data||[];
    if(!owners.length){area.innerHTML='<div class="empty">No transporter/vehicle-owner accounts found.</div>';return;}

    const ids=owners.map(x=>x.id);
    const v=await sb.from('vehicles').select('id,owner_id,vehicle_type,registration,capacity_kg,approval_status,available,created_at,documents,owner_documents,recommended').in('owner_id',ids).order('created_at',{ascending:false});
    if(v.error){area.innerHTML='<div class="notice error">Could not load transporter vehicles: '+esc(v.error.message)+'</div>';return;}

    const vehicles=v.data||[],byOwner=new Map();
    vehicles.forEach(x=>{if(!byOwner.has(x.owner_id))byOwner.set(x.owner_id,[]);byOwner.get(x.owner_id).push(x);});

    area.innerHTML=owners.map(o=>{
      const vs=byOwner.get(o.id)||[];
      const st=String(o.status||'pending').toLowerCase();
      const statusClass=st==='active'?'green':st==='rejected'?'red':'';
      return '<div style="border:1px solid #e5e7eb;border-radius:16px;padding:15px;margin-bottom:14px">'+
        '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><h3 style="margin:0">'+esc(o.full_name||'Unnamed transporter')+'</h3><div class="muted">Transporter account · '+esc(new Date(o.created_at).toLocaleString('en-KE'))+'</div></div>'+pill(o.status||'pending',statusClass)+'</div>'+\
        '<div class="detail"><div><b>PHONE</b>'+esc(o.phone||'')+'</div><div><b>EMAIL</b>'+esc(o.email||'')+'</div><div><b>LOCATION</b>'+esc(o.location||'')+'</div><div><b>ACCOUNT ROLE</b>'+esc(o.role||'vehicle_owner')+'</div><div><b>VEHICLES SUBMITTED</b>'+esc(vs.length)+'</div><div><b>ACCOUNT ID</b>'+esc(o.id)+'</div></div>'+\
        '<div class="actions" style="margin-top:13px"><button class="orange" onclick="window.__leogoViewTransporter(\''+esc(o.id)+'\')">VIEW ACCOUNT & DOCUMENTS</button>'+
        (st==='pending'?'<button class="approve" onclick="window.__leogoTransporterStatus(\''+esc(o.id)+'\',\'active\')">APPROVE ACCOUNT</button><button class="danger" onclick="window.__leogoTransporterStatus(\''+esc(o.id)+'\',\'rejected\')">REJECT ACCOUNT</button>':'')+
        (st==='active'?'<button class="danger" onclick="window.__leogoTransporterStatus(\''+esc(o.id)+'\',\'suspended\')">SUSPEND ACCOUNT</button>':'')+
        (st==='suspended'?'<button class="approve" onclick="window.__leogoTransporterStatus(\''+esc(o.id)+'\',\'active\')">RESTORE ACCOUNT</button>':'')+
        '</div></div>';
    }).join('');
  }

  window.__leogoTransporterStatus=async function(id,status){
    const label=status==='active'?'approve':status==='rejected'?'reject':status==='suspended'?'suspend':'change';
    if(!confirm('Confirm '+label+' this transporter account?'))return;
    const q=await sb.from('profiles').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('role','vehicle_owner').select('id,status').maybeSingle();
    if(q.error){alert('Transporter account update failed: '+q.error.message);return;}
    if(!q.data){alert('No transporter account was updated. Refresh and try again.');return;}
    await loadTransporters();
  };

  window.__leogoViewTransporter=async function(id){
    const [p,v]=await Promise.all([
      sb.from('profiles').select('id,full_name,phone,email,location,role,status,created_at,updated_at').eq('id',id).eq('role','vehicle_owner').maybeSingle(),
      sb.from('vehicles').select('id,owner_id,vehicle_type,registration,capacity_kg,approval_status,available,created_at,documents,owner_documents,recommended').eq('owner_id',id).order('created_at',{ascending:false})
    ]);
    if(p.error||!p.data){alert(p.error?.message||'Transporter account could not be loaded.');return;}
    if(v.error){alert('Transporter vehicles could not be loaded: '+v.error.message);return;}
    const o=p.data,vs=v.data||[];
    let html='<div class="notice"><b>Pre-approval review</b><br>Review the transporter identity, account details and all submitted vehicle/ownership documents before approving the account.</div>'+
      '<div class="detail"><div><b>FULL NAME</b>'+esc(o.full_name)+'</div><div><b>PHONE</b>'+esc(o.phone)+'</div><div><b>EMAIL</b>'+esc(o.email)+'</div><div><b>LOCATION</b>'+esc(o.location)+'</div><div><b>ACCOUNT STATUS</b>'+esc(o.status)+'</div><div><b>REGISTERED</b>'+esc(new Date(o.created_at).toLocaleString('en-KE'))+'</div></div>';
    if(!vs.length)html+='<div class="notice" style="margin-top:14px">This transporter account has no vehicle records attached yet.</div>';
    for(let i=0;i<vs.length;i++){
      const x=vs[i],vd=await signedDocs(x.documents),od=await signedDocs(x.owner_documents);
      html+='<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Vehicle '+(i+1)+'</h3><div class="detail"><div><b>TYPE</b>'+esc(x.vehicle_type)+'</div><div><b>REGISTRATION</b>'+esc(x.registration)+'</div><div><b>CAPACITY</b>'+esc(x.capacity_kg)+' kg</div><div><b>VEHICLE APPROVAL</b>'+esc(x.approval_status)+'</div><div><b>AVAILABLE</b>'+esc(x.available?'Yes':'No')+'</div><div><b>RECOMMENDED</b>'+esc(x.recommended?'Yes':'No')+'</div></div>'+docsHtml('Vehicle Documents',vd,'No vehicle-specific documents submitted for this vehicle.')+docsHtml('Transporter / Owner Documents',od,'No transporter/owner documents submitted.')+'</div>';
    }
    const modal=document.getElementById('modal');
    if(!modal){alert('Admin review window is unavailable.');return;}
    document.getElementById('modalTitle').textContent='Transporter Account Review';
    document.getElementById('modalBody').innerHTML=html;
    modal.classList.remove('hidden');
  };

  const originalGo=window.go;
  if(typeof originalGo==='function'){
    window.go=function(page){
      const r=originalGo.apply(this,arguments);
      if(page==='transport')setTimeout(loadTransporters,0);
      return r;
    };
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{if(document.getElementById('page-transport')?.classList.contains('active'))loadTransporters();},0));
  }else if(document.getElementById('page-transport')?.classList.contains('active')){
    setTimeout(loadTransporters,0);
  }
})();
