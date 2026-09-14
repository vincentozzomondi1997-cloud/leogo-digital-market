(function(){
  'use strict';
  if(window.__LEOGO_OWNER_BOOT_FIX__) return;
  window.__LEOGO_OWNER_BOOT_FIX__=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const message=(id,t,ok)=>{const e=$(id);if(e)e.innerHTML=t?'<div class="notice '+(ok?'success':'error')+'" style="margin-top:10px">'+esc(t)+'</div>':''};
  let user=null, profile=null;

  async function loadProfile(){
    const q=await sb.from('premium_profiles').select('*').eq('user_id',user.id).eq('approved',true).maybeSingle();
    if(q.error) throw q.error;
    profile=q.data||null;
    if(!profile){ window.location.href='premium_profile_dashboard.html'; return false; }
    $('profileStatus').innerHTML='<div class="notice success"><b>APPROVED</b> · '+esc(profile.username||'Premium Profile')+' · '+esc(profile.location||'')+'</div>';
    $('account').textContent=(profile.username||user.email)+' • '+(user.email||'');
    return true;
  }

  async function loadAcceptance(){
    if(!profile)return;
    const q=await sb.rpc('premium_profile_owner_acceptance_status');
    if(q.error){ $('acceptanceBox').innerHTML='<div class="notice error">'+esc(q.error.message)+'</div>'; return; }
    const a=q.data?.[0]; if(!a)return;
    const price=Number(a.additional_acceptance_price||0), paid=Number(a.paid_acceptances_available||0), accepted=Number(a.accepted_today||0), free=accepted===0;
    $('sAccepted').textContent=accepted;
    $('acceptanceBox').innerHTML='<b>Today:</b> '+accepted+' accepted · <b>Free acceptance:</b> '+(free?'AVAILABLE':'USED')+' · <b>Paid available:</b> '+paid+'<br><span class="muted">Additional acceptance price: KSh '+price.toLocaleString()+' each. '+(a.acceptance_payment_pending?'A payment is awaiting Admin approval.':'')+'</span>';
    $('acceptancePayBox').classList.toggle('hidden',free);
    $('ownerSlots').value=1;
  }

  function renderRequests(type,rows){
    const area=$(type==='interest'?'interestArea':'bookingArea');
    if(!rows.length){area.innerHTML='<div class="notice" style="margin-top:12px">No '+(type==='interest'?'interest requests':'booking requests')+' yet.</div>';return;}
    area.innerHTML='<table class="table"><thead><tr><th>'+ (type==='interest'?'Date':'Requested') +'</th><th>Customer</th><th>Message</th><th>Status</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+esc(type==='interest'?new Date(r.created_at).toLocaleString():(r.requested_date||'—')+' '+(r.requested_time||''))+'</td><td>'+esc(r.customer_id)+'</td><td>'+esc(r.message||'—')+'</td><td><span class="pill '+(r.status==='accepted'?'green':'')+'">'+esc(r.status)+'</span></td></tr>').join('')+'</tbody></table>';
  }

  async function loadRequests(){
    if(!profile)return;
    const [i,b]=await Promise.all([
      sb.from('premium_profile_interests').select('*').eq('premium_profile_id',profile.id).order('created_at',{ascending:false}),
      sb.from('premium_profile_bookings').select('*').eq('premium_profile_id',profile.id).order('created_at',{ascending:false})
    ]);
    if(i.error) message('interestArea',i.error.message); else renderRequests('interest',i.data||[]);
    if(b.error) message('bookingArea',b.error.message); else renderRequests('booking',b.data||[]);
    $('sInterest').textContent=(i.data||[]).filter(x=>x.status==='pending').length;
    $('sBooking').textContent=(b.data||[]).filter(x=>x.status==='pending').length;
    await loadAcceptance();
  }

  function initAvailability(){
    const box=$('availabilityBox'); if(!box)return;
    box.innerHTML='<b>Availability</b><div style="margin-top:8px"><select id="availabilitySelect" style="padding:10px;border:1px solid #d0d5dd;border-radius:8px"><option value="">Select availability</option><option value="Available Now">Available Now</option><option value="Busy">Busy</option><option value="Away">Away</option><option value="Not Available">Not Available</option><option value="Available today">Available today</option><option value="Available this week">Available this week</option><option value="By appointment">By appointment</option></select> <button id="ownerAvailabilitySave" class="btn orange">SAVE AVAILABILITY</button></div><div id="availabilityMsg"></div>';
    if(profile.availability)$('availabilitySelect').value=profile.availability;
    $('sAvail').textContent=profile.availability||'—';
    $('ownerAvailabilitySave').onclick=async()=>{
      const value=($('availabilitySelect').value||'').trim();
      if(!value){message('availabilityMsg','Select your availability.');return;}
      const q=await sb.rpc('premium_profile_owner_set_availability',{p_availability:value});
      if(q.error){message('availabilityMsg',q.error.message);return;}
      profile.availability=value;$('sAvail').textContent=value;message('availabilityMsg','Availability updated and now visible on your public profile.',true);
    };
  }

  async function finishLogin(){
    $('auth').classList.add('hidden'); $('dash').classList.remove('hidden');
    try{
      const ok=await loadProfile();
      if(ok){ await loadRequests(); initAvailability(); }
    }catch(e){ $('profileStatus').innerHTML='<div class="notice error">'+esc(e.message)+'</div>'; }
  }

  $('loginBtn').onclick=async function(){
    const btn=this; btn.disabled=true; btn.textContent='LOGGING IN…';
    message('authMsg','');
    try{
      const email=$('email').value.trim(), password=$('password').value;
      if(!email||!password) throw new Error('Enter your email and password.');
      const q=await sb.auth.signInWithPassword({email,password});
      if(q.error) throw q.error;
      user=q.data.user;
      await finishLogin();
    }catch(e){ message('authMsg',e.message||'Login failed.'); }
    finally{btn.disabled=false;btn.textContent='LOG IN';}
  };

  $('password')?.addEventListener('keydown',e=>{if(e.key==='Enter')$('loginBtn').click();});
  $('logout')?.addEventListener('click',async()=>{await sb.auth.signOut();location.reload();});
  $('refresh')?.addEventListener('click',async()=>{try{const ok=await loadProfile();if(ok){await loadRequests();initAvailability();}}catch(e){alert(e.message);}});
  $('refreshInterest')?.addEventListener('click',loadRequests);
  $('refreshBooking')?.addEventListener('click',loadRequests);
  $('ownerPayBtn')?.addEventListener('click',async function(){
    const n=Math.max(1,parseInt($('ownerSlots').value,10)||1),ref=$('ownerPaymentRef').value.trim();
    if(!ref){message('ownerPayMsg','Enter the M-Pesa payment reference.');return;}
    this.disabled=true;
    const q=await sb.rpc('submit_premium_profile_owner_acceptance_payment',{p_acceptance_slots:n,p_reference:ref});
    if(q.error)message('ownerPayMsg',q.error.message);else{message('ownerPayMsg','Payment submitted for Admin approval.',true);$('ownerPaymentRef').value='';await loadAcceptance();}
    this.disabled=false;
  });

  async function boot(){
    try{
      const r=await sb.auth.getSession();
      if(r.data?.session){user=r.data.session.user;await finishLogin();}
    }catch(e){message('authMsg',e.message||'Unable to start the Premium Owner page.');}
  }
  boot();
})();
