/* LEOGO ADMIN VEHICLE DOCUMENTS FIX - isolated override only.
   Reads both vehicle.documents and vehicle.owner_documents and creates signed links one file at a time. */
(function(){
  if(window.__leogoVehicleDocsFixInstalled)return;
  window.__leogoVehicleDocsFixInstalled=true;
  const bucket='business-documents';
  const escD=v=>typeof esc==='function'?esc(v):String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const pillD=(v,k='')=>typeof pill==='function'?pill(v,k):'<span class="pill '+k+'">'+escD(v)+'</span>';
  const moneyD=v=>typeof money==='function'?money(v):'KSh '+Number(v||0).toLocaleString();
  const docsD=v=>Array.isArray(v)?v:[];

  async function signOne(path){
    if(!path)return null;
    const q=await sb.storage.from(bucket).createSignedUrl(path,900);
    return q.error?null:q.data?.signedUrl||null;
  }

  async function prepareDocs(list){
    const out=[];
    for(const d of docsD(list)){
      if(!d)continue;
      const path=typeof d==='string'?d:d.path;
      if(!path)continue;
      const url=await signOne(path);
      out.push({doc:typeof d==='string'?{name:path,label:'Document',path}:d,url});
    }
    return out;
  }

  function documentRows(items){
    if(!items.length)return '<div class="muted">No readable document links were generated.</div>';
    return items.map(x=>{
      const d=x.doc||{};
      const label=d.label||d.document_type||d.name||'Document';
      const name=d.name||d.path||'';
      const action=x.url?'<a class="button light" target="_blank" rel="noopener" href="'+escD(x.url)+'">VIEW / DOWNLOAD</a>':'<span class="pill red">LINK ERROR</span>';
      return '<div class="setting-row"><div><b>'+escD(label)+'</b><div class="muted">'+escD(name)+'</div></div>'+action+'</div>';
    }).join('');
  }

  async function reviewVehicleDocuments(id){
    const x=(window.vehicles||[]).find(v=>v.id===id);
    if(!x)return;
    const p=await sb.from('profiles').select('full_name,phone,email,location,status,role').eq('id',x.owner_id).maybeSingle();
    const sa=await sb.from('settlement_accounts').select('*').eq('user_id',x.owner_id).maybeSingle();

    const vehicleDocs=docsD(x.documents);
    const ownerDocs=docsD(x.owner_documents);
    const combined=[];
    const seen=new Set();
    for(const d of [...vehicleDocs,...ownerDocs]){
      const key=(d?.path||d?.name||JSON.stringify(d));
      if(seen.has(key))continue;
      seen.add(key);combined.push(d);
    }
    const signed=await prepareDocs(combined);
    const vehicleSigned=await prepareDocs(vehicleDocs);
    const ownerSigned=await prepareDocs(ownerDocs);

    document.getElementById('modalTitle').textContent='Transporter / Vehicle Owner Review';
    document.getElementById('modalBody').innerHTML=
      '<div class="detail">'+
      '<div><b>Owner</b>'+escD(p.data?.full_name||'')+'</div>'+ 
      '<div><b>Phone</b>'+escD(p.data?.phone||'')+'</div>'+ 
      '<div><b>Email</b>'+escD(p.data?.email||'')+'</div>'+ 
      '<div><b>Location</b>'+escD(p.data?.location||'')+'</div>'+ 
      '<div><b>Account Role</b>'+escD(p.data?.role||'vehicle_owner')+'</div>'+ 
      '<div><b>Account Status</b>'+pillD(p.data?.status||'pending',String(p.data?.status||'').toLowerCase()==='active'?'green':'')+'</div>'+ 
      '<div><b>Vehicle Type / Mode</b>'+escD(x.vehicle_type||'')+'</div>'+ 
      '<div><b>Registration</b>'+escD(x.registration||'')+'</div>'+ 
      '<div><b>Capacity</b>'+escD(x.capacity_kg||'')+' kg</div>'+ 
      '<div><b>Vehicle Approval</b>'+pillD(x.approval_status||'pending',String(x.approval_status||'').toLowerCase()==='approved'?'green':String(x.approval_status||'').toLowerCase()==='rejected'?'red':'')+'</div>'+ 
      '</div>'+ 
      '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">All Submitted Documents</h3><div class="muted">'+escD(signed.length)+' document(s) found. Open each document to verify it before approving the transporter or vehicle.</div>'+documentRows(signed)+'</div>'+ 
      '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Vehicle Documents</h3><div class="muted">Documents saved specifically against this vehicle.</div>'+documentRows(vehicleSigned)+'</div>'+ 
      '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Owner / Driver Documents</h3><div class="muted">Documents submitted for the transporter/vehicle owner.</div>'+documentRows(ownerSigned)+'</div>'+ 
      '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Settlement Account</h3>'+ (sa.data ? '<div class="detail"><div><b>Status</b>'+escD(sa.data.status||'Pending')+'</div><div><b>Preferred Method</b>'+escD(sa.data.preferred_method||'Not specified')+'</div><div><b>M-Pesa Name</b>'+escD(sa.data.mpesa_name||'')+'</div><div><b>M-Pesa Number</b>'+escD(sa.data.mpesa_number||'')+'</div><div><b>Bank Name</b>'+escD(sa.data.bank_name||'')+'</div><div><b>Account Name</b>'+escD(sa.data.bank_account_name||'')+'</div><div><b>Account Number</b>'+escD(sa.data.bank_account_number||'')+'</div></div>' : '<div class="notice">No settlement account submitted.</div>')+'</div>'+ 
      '<div class="actions" style="margin-top:14px">'+
      '<button class="approve" onclick="vehicleDecision(\''+escD(x.id)+'\',\'approved\')">APPROVE VEHICLE</button>'+ 
      '<button class="danger" onclick="vehicleDecision(\''+escD(x.id)+'\',\'rejected\')">REJECT VEHICLE</button>'+ 
      '<button class="'+(x.recommended?'danger':'approve')+'" onclick="vehicleRecommend(\''+escD(x.id)+'\','+(!x.recommended)+')">'+(x.recommended?'REMOVE RECOMMENDATION':'RECOMMEND')+'</button>'+ 
      '</div>';
    document.getElementById('modal').classList.remove('hidden');
  }

  window.reviewVehicle=reviewVehicleDocuments;
})();
