/* LEOGO PREMIUM PROFILE — ADMIN FULL REGISTRATION VIEW
   Isolated admin-only addon. It reads the existing application record and payment
   record so Admin can review every registration field and document before or
   after approval. It does not modify application/profile/payment data. */
(function(){
  'use strict';
  if(window.__leogoPremiumFullRegistration)return;
  window.__leogoPremiumFullRegistration=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>'KSh '+Number(v||0).toLocaleString();

  async function signed(path){
    if(!path)return null;
    const q=await sb.storage.from('premium-private').createSignedUrl(path,300);
    if(q.error)throw q.error;
    return q.data?.signedUrl||null;
  }

  function publicUrl(path){
    return path?sb.storage.from('premium-profile-public').getPublicUrl(path).data.publicUrl:'';
  }

  async function viewRegistration(app,pay){
    try{
      const [idUrl,passportUrl]=await Promise.all([
        signed(app.id_picture_path),
        signed(app.passport_photo_path)
      ]);
      const profileUrl=publicUrl(app.profile_picture_path);
      const m=$('modal'),t=$('modalTitle'),b=$('modalBody');
      if(!m||!t||!b){alert('Admin details window is unavailable.');return;}

      let docs='';
      if(idUrl)docs+='<div><b>ID / Identity Document</b><br><img src="'+esc(idUrl)+'" style="width:100%;max-height:500px;object-fit:contain;border:1px solid #e5e7eb;border-radius:12px;margin-top:8px;background:#f8fafc"></div>';
      if(passportUrl)docs+='<div><b>Passport / Real Profile Photo</b><br><img src="'+esc(passportUrl)+'" style="width:100%;max-height:500px;object-fit:contain;border:1px solid #e5e7eb;border-radius:12px;margin-top:8px;background:#f8fafc"></div>';
      if(profileUrl)docs+='<div><b>Public Profile Picture</b><br><img src="'+esc(profileUrl)+'" style="width:100%;max-height:500px;object-fit:contain;border:1px solid #e5e7eb;border-radius:12px;margin-top:8px;background:#f8fafc"></div>';

      t.textContent='FULL PREMIUM PROFILE REGISTRATION';
      b.innerHTML='<div class="notice"><b>Admin-only information.</b><br>This view contains the complete registration information submitted by the Premium Profile owner, including identity information and private documents. It is available before and after approval.</div>'+
        '<div class="detail">'+
        '<div><b>Official Name</b>'+esc(app.official_name)+'</div>'+ 
        '<div><b>Username</b>'+esc(app.username)+'</div>'+ 
        '<div><b>Contact</b>'+esc(app.contact)+'</div>'+ 
        '<div><b>ID Number</b>'+esc(app.id_number)+'</div>'+ 
        '<div><b>Age</b>'+esc(app.age)+'</div>'+ 
        '<div><b>Sex</b>'+esc(app.sex)+'</div>'+ 
        '<div><b>Location</b>'+esc(app.location)+'</div>'+ 
        '<div><b>Sexual Orientation</b>'+esc(app.orientation)+'</div>'+ 
        '<div><b>Application Status</b>'+esc(app.status)+'</div>'+ 
        '<div><b>Submitted</b>'+esc(app.submitted_at?new Date(app.submitted_at).toLocaleString():'—')+'</div>'+ 
        '<div><b>Reviewed</b>'+esc(app.reviewed_at?new Date(app.reviewed_at).toLocaleString():'—')+'</div>'+ 
        '<div><b>Rejection Reason</b>'+esc(app.rejection_reason||'—')+'</div>'+ 
        '<div><b>Payment Amount</b>'+money(pay?.amount)+'</div>'+ 
        '<div><b>Payment Reference</b>'+esc(pay?.reference||'—')+'</div>'+ 
        '<div><b>Payment Status</b>'+esc(pay?.status||'Not submitted')+'</div>'+ 
        '<div><b>Payment Submitted</b>'+esc(pay?.created_at?new Date(pay.created_at).toLocaleString():'—')+'</div>'+ 
        '</div>'+ 
        '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Private Registration Description</h3><div>'+esc(app.description||'No description provided')+'</div></div>'+ 
        '<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Registration Documents & Photos</h3><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px">'+(docs||'<div class="muted">No registration images available.</div>')+'</div></div>';
      m.classList.remove('hidden');
    }catch(e){alert('Could not open registration documents: '+e.message)}
  }

  async function loadFullRegistrations(){
    const host=$('premiumFullRegistrationArea');
    if(!host)return;
    host.innerHTML='<div class="muted">Loading complete Premium Profile registrations…</div>';

    const appsQ=await sb.from('premium_profile_applications').select('*').order('updated_at',{ascending:false});
    if(appsQ.error){host.innerHTML='<div class="msg error">'+esc(appsQ.error.message)+'</div>';return;}
    const apps=appsQ.data||[];
    if(!apps.length){host.innerHTML='<div class="empty">No Premium Profile registration records found.</div>';return;}

    const ids=apps.map(a=>a.id);
    const payQ=await sb.from('premium_profile_payments').select('*').in('application_id',ids).order('created_at',{ascending:false});
    const payMap={};
    (payQ.data||[]).forEach(p=>{if(!payMap[p.application_id])payMap[p.application_id]=p});

    host.innerHTML='<div class="notice"><b>Complete registration records</b><br>Admin can open any record to view all submitted information and private registration documents. This remains available even after the profile is approved.</div>'+ 
      '<div class="table-wrap"><table class="table" style="min-width:1450px"><thead><tr><th>Username</th><th>Official Name</th><th>Contact</th><th>Identity</th><th>Profile</th><th>Location</th><th>Orientation</th><th>Status</th><th>Payment</th><th>Action</th></tr></thead><tbody>'+ 
      apps.map(a=>{const p=payMap[a.id];return '<tr>'+ 
        '<td><b>'+esc(a.username)+'</b><br>Age '+esc(a.age)+' · '+esc(a.sex)+'</td>'+ 
        '<td>'+esc(a.official_name)+'</td>'+ 
        '<td>'+esc(a.contact)+'</td>'+ 
        '<td><b>ID:</b> '+esc(a.id_number)+'<br><span class="muted">ID document stored privately</span></td>'+ 
        '<td><span class="pill green">'+(a.profile_picture_path?'PHOTO SAVED':'NO PHOTO')+'</span><br><span class="muted">Passport: '+(a.passport_photo_path?'saved':'missing')+'</span></td>'+ 
        '<td>'+esc(a.location)+'</td>'+ 
        '<td>'+esc(a.orientation)+'</td>'+ 
        '<td><span class="pill '+(a.status==='approved'?'green':a.status==='rejected'?'red':'')+'">'+esc(a.status||'draft')+'</span>'+(a.rejection_reason?'<br><span class="muted">'+esc(a.rejection_reason)+'</span>':'')+'</td>'+ 
        '<td>'+money(p?.amount)+'<br>'+esc(p?.reference||'—')+'<br><span class="pill '+(p?.status==='paid'?'green':'')+'">'+esc(p?.status||'Not submitted')+'</span></td>'+ 
        '<td><button class="blue" data-full-registration="'+esc(a.id)+'">VIEW FULL REGISTRATION</button></td>'+ 
      '</tr>'}).join('')+'</tbody></table></div>';

    const appMap={};apps.forEach(a=>appMap[a.id]=a);
    document.querySelectorAll('[data-full-registration]').forEach(btn=>{
      btn.onclick=()=>viewRegistration(appMap[btn.dataset.fullRegistration],payMap[btn.dataset.fullRegistration]);
    });
  }

  window.initPremiumProfileFullRegistration=function(){
    const area=$('premiumArea');
    if(!area)return;
    if($('premiumFullRegistrationCard')){loadFullRegistrations();return;}
    const card=document.createElement('div');
    card.id='premiumFullRegistrationCard';
    card.className='card';
    card.innerHTML='<div class="toolbar"><div><h2 style="margin:0">Premium Profile — Full Registration & Documents</h2><div class="muted">Admin-only access to every registration field and document, available before and after approval.</div></div><button class="light" id="refreshPremiumFullRegistration">↻ REFRESH</button></div><div id="premiumFullRegistrationArea" style="margin-top:12px"></div>';
    area.appendChild(card);
    $('refreshPremiumFullRegistration').onclick=loadFullRegistrations;
    loadFullRegistrations();
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(window.initPremiumProfileFullRegistration,0));
  else setTimeout(window.initPremiumProfileFullRegistration,0);
})();
