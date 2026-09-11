(function(){
  'use strict';
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  function sb(){return window.__leogoAdminSB||(window.__leogoAdminSB=window.supabase.createClient(URL,KEY));}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m];});}
  function money(v){return 'KSh '+Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  function date(v){return v?new Date(v).toLocaleString():'—';}
  function pill(t,c){return '<span class="pill '+(c||'')+'">'+esc(t)+'</span>';}
  function area(){return document.getElementById('premiumArea');}
  async function signed(path){if(!path)return null;const q=await sb().storage.from('premium-private').createSignedUrl(path,300);if(q.error)throw q.error;return q.data.signedUrl;}
  window.openPremiumPrivate=async function(path,label){try{const u=await signed(path);if(!u){alert('Private file is unavailable.');return;}window.open(u,'_blank','noopener');}catch(e){alert((label||'Private file')+' could not be opened: '+e.message);}};
  window.reviewPremiumIdentity=async function(id,decision){
    let reason=null;
    if(decision==='rejected'){reason=prompt('Enter the reason for rejecting this Premium identity submission:');if(!reason||!reason.trim()){alert('A rejection reason is required.');return;}}
    if(!confirm(decision==='approved'?'Approve this identity and activate the linked Premium membership?':'Reject this identity submission and return the reason to the customer?'))return;
    const q=await sb().rpc('admin_review_premium_identity',{p_identity_id:id,p_decision:decision,p_rejection_reason:reason});
    if(q.error){alert('Identity review failed: '+q.error.message);return;}
    alert(decision==='approved'?'Identity approved and Premium activated.':'Identity rejected. The customer can see the rejection reason and update the submission.');
    await loadIdentityReviews();
    if(typeof window.loadPremium==='function')await window.loadPremium();
  };
  window.recordPremiumRefund=async function(membershipId,amount){
    const ref=prompt('Enter the M-Pesa refund transaction reference after sending the 50% refund:');
    if(!ref||!ref.trim())return;
    const reason=prompt('Refund reason (optional):')||'50% refund after unsuccessful Premium account update';
    if(!confirm('Record the 50% refund of '+amount+' for this membership?'))return;
    const q=await sb().rpc('admin_record_premium_refund',{p_membership_id:membershipId,p_refund_reference:ref.trim(),p_reason:reason.trim()});
    if(q.error){alert('Refund record failed: '+q.error.message);return;}
    alert('50% refund recorded successfully.');
    await loadIdentityReviews();
  };
  async function loadIdentityReviews(){
    const a=area();if(!a)return;
    let host=document.getElementById('premiumIdentityReviewArea');
    if(!host){host=document.createElement('div');host.id='premiumIdentityReviewArea';a.appendChild(host);}
    host.innerHTML='<div class="card"><div class="empty">Loading Premium identity reviews…</div></div>';
    const db=sb();
    const q=await db.from('premium_identity_submissions').select('*').order('submitted_at',{ascending:false}).limit(200);
    if(q.error){host.innerHTML='<div class="card"><div class="msg error">Could not load Premium identity reviews: '+esc(q.error.message)+'</div></div>';return;}
    const rows=q.data||[];
    const ids=Array.from(new Set(rows.map(x=>x.user_id).filter(Boolean)));const users={};
    if(ids.length){const u=await db.from('profiles').select('id,full_name,username,email,phone').in('id',ids);if(!u.error)(u.data||[]).forEach(x=>users[x.id]=x);}
    const pending=rows.filter(x=>x.status==='pending').length;
    let h='<div class="card"><div class="toolbar"><div><h3 style="margin:0">Premium Identity Review</h3><div class="muted">Private identity details are visible here only to authorized Admin staff. Pending: <b>'+pending+'</b></div></div><button class="light" onclick="loadPremiumIdentityReviews()">↻ REFRESH</button></div>';
    h+='<div class="table-wrap"><table class="table" style="min-width:1250px"><thead><tr><th>Customer</th><th>Name as per ID</th><th>Phone</th><th>ID type / number</th><th>LEOGO username</th><th>Documents</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    if(!rows.length)h+='<tr><td colspan="8"><div class="empty">No Premium identity submissions have been received.</div></td></tr>';
    rows.forEach(function(r){
      const u=users[r.user_id]||{};const pendingRow=r.status==='pending';
      h+='<tr><td><b>'+esc(u.full_name||u.username||'Customer')+'</b><br><span class="muted">'+esc(u.email||'')+'</span></td><td><b>'+esc(r.full_name_as_id)+'</b></td><td>'+esc(r.phone_number)+'</td><td>'+esc(r.id_type)+'<br><b>'+esc(r.id_number)+'</b></td><td>'+esc(r.leogo_username)+'</td><td><div class="actions">'+(r.id_document_path?'<button class="light" onclick="openPremiumPrivate('+JSON.stringify(r.id_document_path)+',\'ID document\')">VIEW ID</button>':'<span class="muted">No ID file</span>')+'<button class="light" onclick="openPremiumPrivate('+JSON.stringify(r.profile_photo_path)+',\'Profile photo\')">VIEW PROFILE</button></div></td><td>'+pill(r.status,r.status==='approved'?'green':r.status==='rejected'?'red':'')+(r.rejection_reason?'<div class="msg error" style="margin-top:6px">'+esc(r.rejection_reason)+'</div>':'')+'</td><td>'+(pendingRow?'<div class="actions"><button class="approve" onclick="reviewPremiumIdentity(\''+r.id+'\',\'approved\')">APPROVE & ACTIVATE</button><button class="danger" onclick="reviewPremiumIdentity(\''+r.id+'\',\'rejected\')">REJECT</button></div>':(r.status==='rejected'?'<button class="orange" onclick="recordPremiumRefund(\''+r.membership_id+'\',\'50% of membership payment\')">RECORD 50% REFUND</button>':'<span class="muted">Reviewed</span>'))+'</td></tr>';
    });
    h+='</tbody></table></div></div>';
    host.innerHTML=h;
  }
  window.loadPremiumIdentityReviews=loadIdentityReviews;
  function install(){const page=document.getElementById('page-premium');if(!page||page.__identityReviewObserver)return;page.__identityReviewObserver=true;const o=new MutationObserver(function(){if(page.classList.contains('active'))loadIdentityReviews();});o.observe(page,{attributes:true,attributeFilter:['class']});if(page.classList.contains('active'))loadIdentityReviews();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
