(function(){
  'use strict';
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  let currentUser=null,currentApplication=null,currentPricing=null;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const msg=(id,text,ok=false)=>$(id).innerHTML=text?'<div class="notice '+(ok?'success':'error')+'">'+esc(text)+'</div>':'';

  function setAuthMode(mode){
    $('loginBox').classList.toggle('hidden',mode!=='login');$('signupBox').classList.toggle('hidden',mode!=='signup');
    $('tabLogin').classList.toggle('active',mode==='login');$('tabSignup').classList.toggle('active',mode==='signup');
  }
  $('tabLogin').onclick=()=>setAuthMode('login');$('tabSignup').onclick=()=>setAuthMode('signup');

  async function ensureProfile(user,username,phone){
    const q=await sb.from('profiles').upsert({id:user.id,username:username||null,phone:phone||null,email:user.email||null},{onConflict:'id'});
    if(q.error)console.warn('Could not update profile record:',q.error.message);
  }

  $('signupBtn').onclick=async function(){
    const email=$('signupEmail').value.trim(),password=$('signupPassword').value,username=$('signupUsername').value.trim(),phone=$('signupPhone').value.trim();
    if(!email||!password||password.length<6){msg('authMsg','Enter a valid email and a password of at least 6 characters.');return;}
    if(!username||!phone){msg('authMsg','Username and phone are required.');return;}
    const b=this;b.disabled=true;b.textContent='CREATING…';
    const q=await sb.auth.signUp({email,password});
    if(q.error){b.disabled=false;b.textContent='CREATE ACCOUNT';msg('authMsg',q.error.message);return;}
    if(q.data.user)await ensureProfile(q.data.user,username,phone);
    if(q.data.session){msg('authMsg','Account created successfully. Your Premium Profile dashboard is ready.',true);await showDashboard(q.data.user);}
    else {msg('authMsg','Account created. Please confirm your email if LEOGO requires email confirmation, then log in here.',true);setAuthMode('login');}
    b.disabled=false;b.textContent='CREATE ACCOUNT';
  };

  $('loginBtn').onclick=async function(){
    const email=$('loginEmail').value.trim(),password=$('loginPassword').value,b=this;b.disabled=true;b.textContent='LOGGING IN…';
    const q=await sb.auth.signInWithPassword({email,password});
    if(q.error){b.disabled=false;b.textContent='LOG IN';msg('authMsg',q.error.message);return;}
    await ensureProfile(q.data.user,null,null);await showDashboard(q.data.user);b.disabled=false;b.textContent='LOG IN';
  };

  $('logoutBtn').onclick=async()=>{await sb.auth.signOut();location.reload();};

  async function showDashboard(user){
    currentUser=user;$('authCard').classList.add('hidden');$('dashboard').classList.remove('hidden');
    const p=await sb.from('profiles').select('username,phone,email').eq('id',user.id).maybeSingle();
    $('accountLine').textContent=(p.data?.username||user.email||'Account')+' • '+(p.data?.email||user.email||'');
    await loadPricing();await loadApplication();
  }

  async function loadPricing(){
    const q=await sb.rpc('get_premium_profile_pricing');
    if(q.error||!q.data?.length){currentPricing=null;$('pricingBox').textContent='Current Premium Profile listing price is unavailable. Please contact LEOGO Admin.';return;}
    currentPricing=q.data[0];$('pricingBox').innerHTML='<b>Current listing price: KSh '+Number(currentPricing.price).toLocaleString()+' per '+Number(currentPricing.duration_days)+' days.</b><br><span class="muted">The price can be changed by LEOGO Admin.</span>';
  }

  async function loadApplication(){
    const q=await sb.from('premium_profile_applications').select('*').eq('user_id',currentUser.id).order('updated_at',{ascending:false}).limit(1).maybeSingle();
    if(q.error){msg('dashMsg','Could not load your application: '+q.error.message);return;}
    currentApplication=q.data||null;
    if(!currentApplication){$('applicationStatus').textContent='NOT STARTED';$('reviewBox').textContent='Complete the application and save it before submitting for review.';return;}
    fill(currentApplication);renderStatus(currentApplication);
    const pay=await sb.from('premium_profile_payments').select('amount,reference,status,created_at').eq('application_id',currentApplication.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
    if(pay.data){$('paymentRef').value=pay.data.reference||'';$('paymentMsg').innerHTML='<div class="notice '+(pay.data.status==='paid'?'success':'')+'">Payment: <b>'+esc(pay.data.status)+'</b> · '+esc(pay.data.reference)+'</div>';}
  }

  function fill(a){
    ['officialName','username','contact','idNumber','age','location','description'].forEach(k=>{if($(k))$(k).value=a[kMap(k)]??'';});
    $('sex').value=a.sex||'';$('orientation').value=a.orientation||'';
  }
  function kMap(k){return {officialName:'official_name',username:'username',contact:'contact',idNumber:'id_number',age:'age',location:'location',description:'description'}[k]||k;}
  function renderStatus(a){
    const s=String(a.status||'draft').toUpperCase();$('applicationStatus').textContent=s;
    if(a.status==='rejected'){$('reviewBox').innerHTML='<b>Application rejected.</b><br>'+esc(a.rejection_reason||'No reason was provided.')+'<br><br>You may update your application and submit it again.';}
    else if(a.status==='pending')$('reviewBox').innerHTML='<b>Under Admin review.</b><br>Your application is pending verification. It is not listed publicly yet.';
    else if(a.status==='approved')$('reviewBox').innerHTML='<b>Approved.</b><br>Your Premium Profile is approved and eligible for Premium Market listing.';
    else $('reviewBox').textContent='Draft saved. Submit it after all required information and photos are ready.';
  }

  async function upload(file,bucket,path){
    if(!file)return null;
    if(file.size>5*1024*1024)throw new Error('Each image must be 5MB or smaller.');
    const q=await sb.storage.from(bucket).upload(path,file,{upsert:true,contentType:file.type});
    if(q.error)throw q.error;return path;
  }

  async function saveApplication(submit){
    if(!currentUser)return;
    const age=Number($('age').value),sex=$('sex').value,orientation=$('orientation').value;
    if(!age||age<18){msg('saveMsg','The profile member must be 18 or older.');return;}
    const existing=currentApplication||{};
    const base=currentUser.id+'/'+Date.now();
    const pf=$('profilePicture').files[0],passport=$('passportPhoto').files[0],idpic=$('idPicture').files[0];
    const btn=$('saveBtn');btn.disabled=true;btn.textContent='UPLOADING…';
    try{
      const profilePath=pf?await upload(pf,'premium-profile-public',base+'-profile.'+(pf.name.split('.').pop()||'jpg')):existing.profile_picture_path;
      const passportPath=passport?await upload(passport,'premium-private',currentUser.id+'/'+base.split('/')[1]+'-passport.'+(passport.name.split('.').pop()||'jpg')):existing.passport_photo_path;
      const idPath=idpic?await upload(idpic,'premium-private',currentUser.id+'/'+base.split('/')[1]+'-id.'+(idpic.name.split('.').pop()||'jpg')):existing.id_picture_path;
      const q=await sb.rpc('save_premium_profile_application',{p_official_name:$('officialName').value.trim(),p_username:$('username').value.trim(),p_contact:$('contact').value.trim(),p_id_number:$('idNumber').value.trim(),p_passport_photo_path:passportPath,p_profile_picture_path:profilePath,p_id_picture_path:idPath,p_age:age,p_sex:sex,p_location:$('location').value.trim(),p_orientation:orientation,p_description:$('description').value.trim()});
      if(q.error)throw q.error;currentApplication=q.data;renderStatus(currentApplication);
      msg('saveMsg','Application saved successfully.',true);
      if(submit){const s=await sb.rpc('submit_premium_profile_application',{p_application_id:currentApplication.id});if(s.error)throw s.error;currentApplication=s.data;renderStatus(currentApplication);msg('saveMsg','Application submitted to LEOGO Admin for review.',true);}
      await loadApplication();
    }catch(e){msg('saveMsg',e.message||String(e));}
    btn.disabled=false;btn.textContent='SAVE APPLICATION';
  }
  $('saveBtn').onclick=()=>saveApplication(false);

  $('paymentBtn').onclick=async function(){
    if(!currentApplication){msg('paymentMsg','Save your profile application first.');return;}
    const ref=$('paymentRef').value.trim();if(!ref){msg('paymentMsg','Enter the M-Pesa payment reference.');return;}
    this.disabled=true;this.textContent='SUBMITTING…';
    const q=await sb.rpc('submit_premium_profile_payment',{p_application_id:currentApplication.id,p_reference:ref});
    if(q.error){msg('paymentMsg',q.error.message);}else{msg('paymentMsg','Payment reference submitted to LEOGO Admin for confirmation.',true);}
    this.disabled=false;this.textContent='SUBMIT PAYMENT REFERENCE';
  };

  sb.auth.getSession().then(async r=>{if(r.data?.session)await showDashboard(r.data.session.user);});
})();
