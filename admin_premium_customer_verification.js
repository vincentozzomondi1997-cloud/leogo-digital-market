/* LEOGO PREMIUM CUSTOMER VERIFICATION — ADMIN ONLY */
(function(){
  'use strict';
  if(window.__leogoPremiumCustomerVerification)return;
  window.__leogoPremiumCustomerVerification=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.__leogoAdminSB||window.supabase.createClient(URL,KEY);
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const date=v=>v?new Date(v).toLocaleString():'—';
  const money=v=>'KSh '+Number(v||0).toLocaleString();
  const msg=(t,ok)=>'<div class="msg '+(ok?'success':'error')+'">'+esc(t)+'</div>';

  async function signed(path){
    if(!path)return null;
    const q=await sb.storage.from('premium-private').createSignedUrl(path,300);
    if(q.error)return null;
    return q.data?.signedUrl||null;
  }

  async function load(){
    const host=$('premiumCustomerVerificationArea');
    if(!host)return;
    host.innerHTML='<div class="muted">Loading Premium Customer verification records…</div>';

    const members=await sb.from('premium_members').select('user_id,age_confirmed,age_confirmed_at,relationship_disclaimer_accepted,disclaimer_accepted_at,consent_version,created_at,updated_at').order('created_at',{ascending:false});
    if(members.error){host.innerHTML=msg(members.error.message);return;}
    const rows=members.data||[];
    if(!rows.length){host.innerHTML='<div class="empty">No Premium Customers have joined yet.</div>';return;}

    const ids=rows.map(x=>x.user_id);
    const [profiles,memberships,identities]=await Promise.all([
      sb.from('profiles').select('id,full_name,username,phone,email,location,role,status,avatar_url').in('id',ids),
      sb.from('premium_memberships').select('*').in('user_id',ids).order('created_at',{ascending:false}),
      sb.from('premium_identity_submissions').select('*').in('user_id',ids).order('submitted_at',{ascending:false})
    ]);
    if(profiles.error||memberships.error||identities.error){host.innerHTML=msg(profiles.error?.message||memberships.error?.message||identities.error?.message||'Could not load Premium Customer verification data.');return;}

    const pmap={};(profiles.data||[]).forEach(x=>pmap[x.id]=x);
    const mmap={};(memberships.data||[]).forEach(x=>{if(!mmap[x.user_id])mmap[x.user_id]=x;});
    const imap={};(identities.data||[]).forEach(x=>{if(!imap[x.user_id])imap[x.user_id]=x;});

    const pending=(identities.data||[]).filter(x=>x.status==='pending').length;
    const approved=(identities.data||[]).filter(x=>x.status==='approved').length;
    const rejected=(identities.data||[]).filter(x=>x.status==='rejected').length;

    let html='<div class="cards" style="margin-top:12px">';
    html+='<div class="stat"><span class="muted">Premium Customers</span><b>'+rows.length+'</b></div>';
    html+='<div class="stat"><span class="muted">Pending Verification</span><b>'+pending+'</b></div>';
    html+='<div class="stat"><span class="muted">Verified</span><b>'+approved+'</b></div>';
    html+='<div class="stat"><span class="muted">Rejected</span><b>'+rejected+'</b></div>';
    html+='</div>';
    html+='<div class="notice"><b>Premium Customer Verification</b><br>Use the existing Premium Customer identity submission and membership/payment records. Admin approval is recorded through the existing secure verification workflow. Do not approve a customer without reviewing the submitted identification details and documents.</div>';
    html+='<div class="table-wrap"><table class="table" style="min-width:1450px"><thead><tr><th>Customer</th><th>Premium Membership</th><th>Payment</th><th>Identity</th><th>Consent</th><th>Documents</th><th>Action</th></tr></thead><tbody>';

    for(const r of rows){
      const p=pmap[r.user_id]||{};
      const m=mmap[r.user_id]||{};
      const i=imap[r.user_id]||{};
      const ist=String(i.status||'not submitted');
      const mst=String(m.status||'not started');
      const pay=String(m.payment_status||'—');
      html+='<tr>';
      html+='<td><b>'+esc(p.username||'—')+'</b><br>'+esc(p.full_name||'—')+'<br><span class="muted">'+esc(p.phone||p.email||'—')+'</span><br><span class="muted">'+esc(p.location||'')+'</span></td>';
      html+='<td><b>'+esc(m.plan_name||'—')+'</b><br>Plan: '+esc(m.plan_code||'—')+'<br>Status: <span class="pill '+(mst==='active'?'green':mst==='rejected'?'red':'')+'">'+esc(mst)+'</span>'+(m.starts_at?'<br>Starts: '+esc(date(m.starts_at)):'')+(m.expires_at?'<br>Expires: '+esc(date(m.expires_at)):'')+'</td>';
      html+='<td>'+money(m.price)+'<br><b>'+esc(m.reference||'—')+'</b><br><span class="pill '+(pay==='paid'?'green':pay==='rejected'?'red':'')+'">'+esc(pay)+'</span></td>';
      if(i.id){
        html+='<td><b>'+esc(i.full_name_as_id||'—')+'</b><br>'+esc(i.id_type||'—')+': '+esc(i.id_number||'—')+'<br>Phone: '+esc(i.phone_number||'—')+'<br>Submitted: '+esc(date(i.submitted_at))+'<br><span class="pill '+(ist==='approved'?'green':ist==='rejected'?'red':'')+'">'+esc(ist)+'</span>'+(i.rejection_reason?'<br><span class="muted">'+esc(i.rejection_reason)+'</span>':'')+'</td>';
        html+='<td>Age confirmed: <b>'+esc(r.age_confirmed?'YES':'NO')+'</b><br>Disclaimer: <b>'+esc(r.relationship_disclaimer_accepted?'YES':'NO')+'</b><br><span class="muted">'+esc(r.consent_version||'—')+'</span></td>';
        html+='<td><button class="blue" data-view-identity="'+esc(i.id)+'">VIEW ID & PHOTO</button></td>';
        if(ist==='pending')html+='<td><div class="actions"><button class="approve" data-identity="'+esc(i.id)+'" data-decision="approved">VERIFY CUSTOMER</button><button class="danger" data-identity="'+esc(i.id)+'" data-decision="rejected">REJECT</button></div></td>';
        else if(ist==='approved')html+='<td><span class="pill green">VERIFIED</span></td>';
        else if(ist==='rejected')html+='<td><button class="light" data-identity="'+esc(i.id)+'" data-decision="approved">VERIFY AFTER REVIEW</button></td>';
        else html+='<td><span class="muted">No verification action</span></td>';
      }else{
        html+='<td><span class="pill">Not submitted</span></td>';
        html+='<td>Age confirmed: <b>'+esc(r.age_confirmed?'YES':'NO')+'</b><br>Disclaimer: <b>'+esc(r.relationship_disclaimer_accepted?'YES':'NO')+'</b></td>';
        html+='<td><span class="muted">No identity documents submitted</span></td><td><span class="muted">Waiting for customer submission</span></td>';
      }
      html+='</tr>';
    }
    html+='</tbody></table></div>';
    host.innerHTML=html;
  }

  async function viewIdentity(id){
    const q=await sb.from('premium_identity_submissions').select('*').eq('id',id).maybeSingle();
    if(q.error||!q.data){alert(q.error?.message||'Identity submission not found.');return;}
    const i=q.data;
    const [doc,photo,passport]=await Promise.all([signed(i.id_document_path),signed(i.profile_photo_path),signed(i.passport_photo_path)]);
    let html='<div class="detail">';
    html+='<div><b>Full Name as ID</b>'+esc(i.full_name_as_id||'—')+'</div>';
    html+='<div><b>Phone</b>'+esc(i.phone_number||'—')+'</div>';
    html+='<div><b>ID Type</b>'+esc(i.id_type||'—')+'</div>';
    html+='<div><b>ID Number</b>'+esc(i.id_number||'—')+'</div>';
    html+='<div><b>LEOGO Username</b>'+esc(i.leogo_username||'—')+'</div>';
    html+='<div><b>Age</b>'+esc(i.age||'—')+'</div>';
    html+='<div><b>Sex</b>'+esc(i.sex||'—')+'</div>';
    html+='<div><b>Status</b>'+esc(i.status||'—')+'</div>';
    html+='</div><div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:16px">';
    if(doc)html+='<div><b>ID Document</b><br><img src="'+esc(doc)+'" style="width:100%;max-height:500px;object-fit:contain;border:1px solid #e5e7eb;border-radius:12px;margin-top:8px;background:#f8fafc"></div>';
    if(photo)html+='<div><b>Profile Photo</b><br><img src="'+esc(photo)+'" style="width:100%;max-height:500px;object-fit:contain;border:1px solid #e5e7eb;border-radius:12px;margin-top:8px;background:#f8fafc"></div>';
    if(passport)html+='<div><b>Passport Photo</b><br><img src="'+esc(passport)+'" style="width:100%;max-height:500px;object-fit:contain;border:1px solid #e5e7eb;border-radius:12px;margin-top:8px;background:#f8fafc"></div>';
    html+='</div>';
    const m=$('modal'),t=$('modalTitle'),b=$('modalBody');
    if(m&&t&&b){t.textContent='Premium Customer Identity Verification';b.innerHTML=html||'<div class="empty">No documents available.</div>';m.classList.remove('hidden');}
  }

  async function review(id,decision){
    let reason='';
    if(decision==='rejected'){
      reason=prompt('Enter the rejection reason for this Premium Customer identity verification:')||'';
      if(!reason.trim())return;
    }
    const q=await sb.rpc('admin_review_premium_identity',{p_identity_id:id,p_decision:decision,p_rejection_reason:reason.trim()});
    if(q.error){alert(q.error.message);return;}
    await load();
  }

  document.addEventListener('click',function(e){
    const b=e.target.closest('[data-identity],[data-view-identity]');
    if(!b)return;
    if(b.dataset.viewIdentity){viewIdentity(b.dataset.viewIdentity);return;}
    if(b.dataset.identity){review(b.dataset.identity,b.dataset.decision);}
  });

  window.initPremiumCustomerVerification=function(){
    const area=$('premiumArea');
    if(!area)return;
    if($('premiumCustomerVerificationCard')){load();return;}
    const card=document.createElement('div');
    card.id='premiumCustomerVerificationCard';
    card.className='card';
    card.style.marginTop='16px';
    card.innerHTML='<div class="toolbar"><div><h2 style="margin:0">Premium Customer Verification</h2><div class="muted">Verify Premium Customers using their existing identity, membership and payment records.</div></div><button class="light" id="refreshPremiumCustomerVerification">↻ REFRESH</button></div><div id="premiumCustomerVerificationArea" style="margin-top:12px"></div>';
    area.appendChild(card);
    $('refreshPremiumCustomerVerification').onclick=load;
    load();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(window.initPremiumCustomerVerification,0));
  else setTimeout(window.initPremiumCustomerVerification,0);
})();
