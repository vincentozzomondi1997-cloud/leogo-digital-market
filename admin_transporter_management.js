/* LEOGO ADMIN TRANSPORTER ACCOUNT REVIEW - isolated module.
   Adds account-level approval/review for vehicle owners without replacing
   existing vehicle approval, transport assignment, authentication or other admin modules. */
(function(){
  if(window.__leogoTransporterManagementInstalled)return;
  window.__leogoTransporterManagementInstalled=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb2=window.supabase.createClient(URL,KEY);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const pill=(v,k='')=>'<span class="pill '+k+'">'+esc(v)+'</span>';

  function extractDocs(value,out=[]){
    if(value==null)return out;
    if(typeof value==='string'){
      const s=value.trim();
      if(/^https?:\/\//i.test(s))out.push({label:'Document',url:s});
      return out;
    }
    if(Array.isArray(value)){value.forEach((x,i)=>extractDocs(x,out));return out;}
    if(typeof value==='object'){
      Object.entries(value).forEach(([k,v])=>{
        if(typeof v==='string' && /^https?:\/\//i.test(v.trim()))out.push({label:k,url:v.trim()});
        else if(v && typeof v==='object')extractDocs(v,out);
      });
    }
    return out;
  }

  function docsHtml(title,value){
    const docs=extractDocs(value,[]);
    if(!docs.length){
      return '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">'+esc(title)+'</h3><div class="muted">No document links were found in the submitted record.</div></div>';
    }
    return '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">'+esc(title)+'</h3><div class="actions">'+docs.map((d,i)=>'<a href="'+esc(d.url)+'" target="_blank" rel="noopener" style="display:inline-block;background:#dbeafe;color:#1e40af;padding:10px 13px;border-radius:10px;font-weight:900;text-decoration:none">VIEW '+esc(d.label||('DOCUMENT '+(i+1)))+'</a>').join('')+'</div></div>';
  }

  async function sessionOk(){
    const q=await sb2.auth.getSession();
    return !!q.data?.session;
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
    if(!(await sessionOk())){area.innerHTML='<div class="empty">Admin login required.</div>';return;}
    area.innerHTML='<div class="empty">Loading transporter accounts…</div>';

    const p=await sb2.from('profiles').select('id,full_name,phone,email,location,role,status,created_at,updated_at').eq('role','vehicle_owner').order('created_at',{ascending:false});
    if(p.error){area.innerHTML='<div class="notice error">Could not load transporter accounts: '+esc(p.error.message)+'</div>';return;}
    const owners=p.data||[];
    if(!owners.length){area.innerHTML='<div class="empty">No transporter/vehicle-owner accounts found.</div>';return;}

    const ids=owners.map(x=>x.id);
    const v=await sb2.from('vehicles').select('id,owner_id,vehicle_type,registration,capacity_kg,approval_status,available,created_at,documents,owner_documents,recommended').in('owner_id',ids).order('created_at',{ascending:false});
    if(v.error){area.innerHTML='<div class="notice error">Could not load transporter vehicles: '+esc(v.error.message)+'</div>';return;}
    const vehicles=v.data||[];
    const byOwner=new Map();
    vehicles.forEach(x=>{if(!byOwner.has(x.owner_id))byOwner.set(x.owner_id,[]);byOwner.get(x.owner_id).push(x);});

    area.innerHTML=owners.map(o=>{
      const vs=byOwner.get(o.id)||[];
      const pending=String(o.status||'').toLowerCase()==='pending';
      const statusClass=String(o.status||'').toLowerCase()==='active'?'green':String(o.status||'').toLowerCase()==='rejected'?'red':'';
      return '<div style="border:1px solid #e5e7eb;border-radius:16px;padding:15px;margin-bottom:14px">'+
        '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><h3 style="margin:0">'+esc(o.full_name||'Unnamed transporter')+'</h3><div class="muted">Transporter account · '+esc(new Date(o.created_at).toLocaleString('en-KE'))+'</div></div>'+pill(o.status||'pending',statusClass)+'</div>'+
        '<div class="detail"><div><b>PHONE</b>'+esc(o.phone||'')+'</div><div><b>EMAIL</b>'+esc(o.email||'')+'</div><div><b>LOCATION</b>'+esc(o.location||'')+'</div><div><b>ACCOUNT ROLE</b>'+esc(String(o.role||'vehicle_owner'))+'</div><div><b>VEHICLES SUBMITTED</b>'+esc(vs.length)+'</div><div><b>ACCOUNT ID</b>'+esc(o.id)+'</div></div>'+
        '<div class="actions" style="margin-top:13px">'+
          '<button class="orange" onclick="window.__leogoViewTransporter(\''+esc(o.id)+'\')">VIEW ACCOUNT & DOCUMENTS</button>'+
          (pending?'<button class="approve" onclick="window.__leogoTransporterStatus(\''+esc(o.id)+'\',\'active\')">APPROVE ACCOUNT</button><button class="danger" onclick="window.__leogoTransporterStatus(\''+esc(o.id)+'\',\'rejected\')">REJECT ACCOUNT</button>':'')+
          (String(o.status||'').toLowerCase()==='active'?'<button class="danger" onclick="window.__leogoTransporterStatus(\''+esc(o.id)+'\',\'suspended\')">SUSPEND ACCOUNT</button>':'')+
          (String(o.status||'').toLowerCase()==='suspended'?'<button class="approve" onclick="window.__leogoTransporterStatus(\''+esc(o.id)+'\',\'active\')">RESTORE ACCOUNT</button>':'')+
        '</div></div>';
    }).join('');
  }

  window.__leogoTransporterStatus=async function(id,status){
    const label=status==='active'?'approve':status==='rejected'?'reject':status==='suspended'?'suspend':'change';
    if(!confirm('Confirm '+label+' this transporter account?'))return;
    const q=await sb2.from('profiles').update({status,updated_at:new Date().toISOString()}).eq('id',id).eq('role','vehicle_owner').select('id,status').maybeSingle();
    if(q.error){alert('Transporter account update failed: '+q.error.message);return;}
    if(!q.data){alert('No transporter account was updated. Refresh and try again.');return;}
    await loadTransporters();
  };

  window.__leogoViewTransporter=async function(id){
    const [p,v]=await Promise.all([
      sb2.from('profiles').select('id,full_name,phone,email,location,role,status,created_at,updated_at').eq('id',id).eq('role','vehicle_owner').maybeSingle(),
      sb2.from('vehicles').select('id,owner_id,vehicle_type,registration,capacity_kg,approval_status,available,created_at,documents,owner_documents,recommended').eq('owner_id',id).order('created_at',{ascending:false})
    ]);
    if(p.error||!p.data){alert(p.error?.message||'Transporter account could not be loaded.');return;}
    const o=p.data,vs=v.data||[];
    let html='<div class="notice"><b>Pre-approval review</b><br>Review the transporter identity, account details and all submitted vehicle/ownership documents before approving the account.</div>';
    html+='<div class="detail"><div><b>FULL NAME</b>'+esc(o.full_name)+'</div><div><b>PHONE</b>'+esc(o.phone)+'</div><div><b>EMAIL</b>'+esc(o.email)+'</div><div><b>LOCATION</b>'+esc(o.location)+'</div><div><b>ACCOUNT STATUS</b>'+esc(o.status)+'</div><div><b>REGISTERED</b>'+esc(new Date(o.created_at).toLocaleString('en-KE'))+'</div></div>';
    if(!vs.length)html+='<div class="notice" style="margin-top:14px">This transporter account has no vehicle records attached yet.</div>';
    vs.forEach((x,i)=>{
      html+='<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Vehicle '+(i+1)+'</h3><div class="detail"><div><b>TYPE</b>'+esc(x.vehicle_type)+'</div><div><b>REGISTRATION</b>'+esc(x.registration)+'</div><div><b>CAPACITY</b>'+esc(x.capacity_kg)+' kg</div><div><b>VEHICLE APPROVAL</b>'+esc(x.approval_status)+'</div><div><b>AVAILABLE</b>'+esc(x.available?'Yes':'No')+'</div><div><b>RECOMMENDED</b>'+esc(x.recommended?'Yes':'No')+'</div></div>';
      html+=docsHtml('Vehicle Documents',x.documents);
      html+=docsHtml('Owner Documents',x.owner_documents);
      html+='</div>';
    });
    const modal=document.getElementById('modal');
    if(!modal){alert('Admin review window is unavailable.');return;}
    document.getElementById('modalTitle').textContent='Transporter Account Review';
    document.getElementById('modalBody').innerHTML=html;
    modal.classList.remove('hidden');
  };

  const originalGo=window.go;
  if(typeof originalGo==='function'){
    window.go=function(page){const r=originalGo.apply(this,arguments);if(page==='transport')setTimeout(loadTransporters,0);return r;};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{setTimeout(()=>{if(document.getElementById('page-transport')?.classList.contains('active'))loadTransporters();},0)});
  else if(document.getElementById('page-transport')?.classList.contains('active'))setTimeout(loadTransporters,0);
})();
