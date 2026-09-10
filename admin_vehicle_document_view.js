/* LEOGO ADMIN - separated transporter/vehicle document review. */
(function(){
  const bucket='business-documents';
  const escD=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const pillD=(v,k='')=>typeof pill==='function'?pill(v,k):'<span class="pill '+k+'">'+escD(v)+'</span>';
  async function signed(docs){
    const list=Array.isArray(docs)?docs:[]; const out=[];
    for(const d of list){
      const path=typeof d==='string'?d:d?.path; if(!path)continue;
      const q=await sb.storage.from(bucket).createSignedUrl(path,900);
      if(!q.error&&q.data?.signedUrl)out.push({doc:typeof d==='string'?{name:path,path}:d,url:q.data.signedUrl});
    }
    return out;
  }
  function docRows(list,empty){
    if(!list.length)return '<div class="muted">'+escD(empty)+'</div>';
    return list.map(d=>'<div class="setting-row"><div><b>'+escD(d.doc?.label||d.doc?.name||'Document')+'</b><div class="muted">'+escD(d.doc?.name||'')+'</div></div><a class="button light" target="_blank" rel="noopener" href="'+escD(d.url)+'">VIEW DOCUMENT</a></div>').join('');
  }
  window.reviewVehicle=async function(id){
    const x=(window.vehicles||[]).find(v=>v.id===id); if(!x)return;
    const [p,sa,vehicleDocs,ownerDocs]=await Promise.all([
      sb.from('profiles').select('full_name,phone,email,location,status,role').eq('id',x.owner_id).maybeSingle(),
      sb.from('settlement_accounts').select('*').eq('user_id',x.owner_id).maybeSingle(),
      signed(x.documents),
      signed(x.owner_documents)
    ]);
    document.getElementById('modalTitle').textContent='Transport & Delivery Provider Review';
    const legacyNote=!vehicleDocs.length&&ownerDocs.length?' <div class="notice" style="margin-top:10px">This transporter was submitted under the earlier document format. The available documents are stored as transporter/owner documents, so they have not been assigned to a particular vehicle automatically.</div>':'';
    const settlement=sa.data?'<div class="detail"><div><b>Status</b>'+escD(sa.data.status||'Pending')+'</div><div><b>Preferred Method</b>'+escD(sa.data.preferred_method||'Not specified')+'</div><div><b>M-Pesa Name</b>'+escD(sa.data.mpesa_name||'')+'</div><div><b>M-Pesa Number</b>'+escD(sa.data.mpesa_number||'')+'</div><div><b>Paybill / Till</b>'+escD(sa.data.mpesa_paybill_till||'')+'</div><div><b>Airtel Money Name</b>'+escD(sa.data.airtel_name||'')+'</div><div><b>Airtel Money Number</b>'+escD(sa.data.airtel_number||'')+'</div><div><b>Bank Name</b>'+escD(sa.data.bank_name||'')+'</div><div><b>Account Name</b>'+escD(sa.data.bank_account_name||'')+'</div><div><b>Account Number</b>'+escD(sa.data.bank_account_number||'')+'</div></div>':'<div class="notice">No settlement account submitted.</div>';
    document.getElementById('modalBody').innerHTML=
      '<div class="detail"><div><b>Owner</b>'+escD(p.data?.full_name)+'</div><div><b>Phone</b>'+escD(p.data?.phone)+'</div><div><b>Email</b>'+escD(p.data?.email)+'</div><div><b>Location</b>'+escD(p.data?.location)+'</div><div><b>Vehicle Type / Mode</b>'+escD(x.vehicle_type)+'</div><div><b>Registration</b>'+escD(x.registration)+'</div><div><b>Capacity</b>'+escD(x.capacity_kg||'')+' kg</div><div><b>Approval</b>'+pillD(x.approval_status,x.approval_status==='approved'?'green':x.approval_status==='rejected'?'red':'')+'</div><div><b>Recommended</b>'+pillD(x.recommended?'Yes':'No',x.recommended?'green':'')+'</div></div>'+
      '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Vehicle Documents</h3>'+docRows(vehicleDocs,'No vehicle-specific documents submitted for this vehicle.')+'</div>'+
      '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Transporter / Owner Documents</h3>'+docRows(ownerDocs,'No transporter/owner documents submitted.')+legacyNote+'</div>'+
      '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Settlement Account</h3>'+settlement+'</div>'+
      '<div class="actions"><button class="approve" onclick="vehicleDecision(\''+x.id+'\',\'approved\')">APPROVE</button><button class="danger" onclick="vehicleDecision(\''+x.id+'\',\'rejected\')">REJECT</button><button class="'+(x.recommended?'danger':'approve')+'" onclick="vehicleRecommend(\''+x.id+'\','+(!x.recommended)+')">'+(x.recommended?'REMOVE RECOMMENDATION':'RECOMMEND')+'</button></div>';
    document.getElementById('modal').classList.remove('hidden');
  };
})();
