/* LEOGO PREMIUM IDENTITY - private identity submission and customer review status. */
(function(){
  if(window.__leogoPremiumIdentityInstalled)return;
  window.__leogoPremiumIdentityInstalled=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  let lastKey='';
  let busy=false;
  let rendering=false;

  async function session(){return (await sb.auth.getSession()).data?.session||null;}
  async function membership(){const s=await session();if(!s)return null;const q=await sb.from('premium_memberships').select('id,plan_code,plan_name,price,duration_days,status,created_at,expires_at,refund_status,refund_amount,refund_reason,refund_reference').eq('user_id',s.user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();return q.error?null:q.data;}
  async function paymentFor(mid){if(!mid)return null;const q=await sb.from('premium_payments').select('id,membership_id,reference,status,created_at').eq('membership_id',mid).order('created_at',{ascending:false}).limit(1).maybeSingle();return q.error?null:q.data;}
  async function identityFor(mid){if(!mid)return null;const q=await sb.rpc('get_my_premium_identity_status',{p_membership_id:mid});return q.error?null:(q.data||[])[0]||null;}
  async function getProfile(){const s=await session();if(!s)return {};const q=await sb.from('profiles').select('full_name,username,phone').eq('id',s.user.id).maybeSingle();return q.error?{}:(q.data||{});}
  function findArea(){const modal=document.getElementById('leogoPremiumModal');if(!modal)return null;return Array.from(modal.querySelectorAll('.panel')).find(x=>/Premium Membership/i.test(x.textContent||''))||modal;}
  function esc(v){return String(v??'').replace(/[&<>\'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}

  async function inject(){
    if(rendering||busy)return;
    const area=findArea();if(!area)return;
    rendering=true;
    let box=document.getElementById('leogoPremiumIdentityBox');
    if(!box){box=document.createElement('div');box.id='leogoPremiumIdentityBox';box.style.cssText='margin-top:14px';area.appendChild(box);}
    try{
      const m=await membership();if(!m){box.innerHTML='';return;}
      const p=await paymentFor(m.id);const i=await identityFor(m.id);
      const key=[m.id,m.status,p?.id||'',p?.status||'',i?.status||'',i?.updated_at||'',m.refund_status||''].join('|');
      if(key===lastKey)return;lastKey=key;
      if(m.status==='active'||i?.status==='approved'){box.innerHTML='<div class="notice success"><b>Your Premium identity has been approved.</b><br>Your submitted identification is held for LEOGO administrative verification only.</div>';return;}
      if(!p||p.status!=='pending'){box.innerHTML='';return;}
      if(i?.status==='pending'){box.innerHTML='<div class="panel" style="background:#f8fafc;border:1px solid #dbe3ef"><h4 style="margin:0 0 7px">Identity review in progress</h4><p class="muted" style="margin:0">Your identification details, private passport photo and payment reference have been sent to LEOGO Admin. Premium activates only after both payment and identity checks are approved.</p></div>';return;}
      if(i?.status==='rejected'){
        let extra='<div class="notice error"><b>Identity submission needs an update.</b><br>'+esc(i.rejection_reason||'LEOGO Admin requested an update before approval.')+'</div>';
        if(i.refund_status==='refunded')extra+='<div class="notice success"><b>50% refund recorded:</b> KSh '+Number(i.refund_amount||0).toLocaleString()+(i.refund_reference?' • Ref: '+esc(i.refund_reference):'')+'</div>';
        box.innerHTML=extra+formHtml();
        bindForm(m.id);
        return;
      }
      box.innerHTML=formHtml();
      bindForm(m.id);
    }finally{rendering=false;}
  }

  function formHtml(){return '<div class="panel" style="background:#fff;border:1px solid #dbe3ef"><h4 style="margin:0 0 6px">Premium identity verification</h4><p class="muted" style="margin:0 0 10px;font-size:13px">Before activation, LEOGO Admin must review your identity. Your age, sex, ID details and private passport photo are confidential and are not displayed in Premium discovery.</p><div class="field"><label>Age *</label><input id="lpiAge" type="number" min="18" max="120" inputmode="numeric" autocomplete="off" placeholder="Enter your age"></div><div class="field"><label>Sex *</label><select id="lpiSex"><option value="">Select</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option><option value="prefer not to say">Prefer not to say</option></select></div><div class="field"><label>Full name as it appears on your ID *</label><input id="lpiName" maxlength="120" autocomplete="name" placeholder="Name exactly as on ID"></div><div class="field"><label>Phone number *</label><input id="lpiPhone" maxlength="30" autocomplete="tel" placeholder="e.g. 0712 345 678"></div><div class="field"><label>Identification type *</label><select id="lpiIdType"><option value="National ID">National ID</option><option value="Passport">Passport</option><option value="Alien ID">Alien ID</option><option value="Other">Other</option></select></div><div class="field"><label>Identification number *</label><input id="lpiIdNumber" maxlength="60" autocomplete="off" placeholder="Enter ID / passport number"></div><div class="field"><label>Picture of ID / passport document <span class="muted">(optional but recommended)</span></label><input id="lpiIdFile" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"><div class="muted" style="font-size:12px;margin-top:4px">Private upload • maximum 5 MB • Admin only.</div></div><div class="field"><label>Real passport-style photo *</label><input id="lpiPassportFile" type="file" accept="image/jpeg,image/png,image/webp"><div class="muted" style="font-size:12px;margin-top:4px">A clear real photo of you, suitable for passport/identity verification. This file is private and is available only to authorized LEOGO Admin staff.</div></div><div class="field"><label>Premium profile picture *</label><input id="lpiProfileFile" type="file" accept="image/jpeg,image/png,image/webp"><div class="muted" style="font-size:12px;margin-top:4px">This is your Premium profile photo • maximum 5 MB.</div></div><div class="field"><label>LEOGO username *</label><input id="lpiUsername" maxlength="60" autocomplete="username" placeholder="Your LEOGO username"></div><div class="notice" style="font-size:12px">By submitting, you confirm that these details belong to you and authorize LEOGO to use them only for Premium identity/payment verification and account safety. Access to the identity records and the real passport photo is restricted to authorized LEOGO Admin staff.</div><div id="lpiMsg"></div><button class="btn orange" id="lpiSubmit" style="width:100%">SUBMIT IDENTITY FOR ADMIN REVIEW</button></div>';}

  async function prefill(){const p=await getProfile();const name=document.getElementById('lpiName'),phone=document.getElementById('lpiPhone'),username=document.getElementById('lpiUsername');if(name&&!name.value&&p.full_name)name.value=p.full_name;if(phone&&!phone.value&&p.phone)phone.value=p.phone;if(username&&!username.value&&p.username)username.value=p.username;}
  function bindForm(mid){const btn=document.getElementById('lpiSubmit');if(!btn)return;prefill();btn.onclick=()=>submitIdentity(mid);}

  async function upload(file,kind,mid){
    if(!file)return null;
    if(file.size>5*1024*1024)throw new Error((kind==='profile'?'Profile picture':kind==='passport-photo'?'Passport-style photo':'ID document')+' must be 5 MB or smaller.');
    const allowed=kind==='id-document'?['image/jpeg','image/png','image/webp','application/pdf']:['image/jpeg','image/png','image/webp'];
    if(!allowed.includes(file.type))throw new Error('Unsupported file type for '+kind+'.');
    const fd=new FormData();fd.append('membership_id',mid);fd.append('kind',kind);fd.append('file',file,file.name);
    const q=await sb.functions.invoke('premium-private-upload',{body:fd});
    if(q.error)throw new Error(q.error.message||'Private upload failed.');
    if(q.data?.error)throw new Error(q.data.error);
    if(!q.data?.path)throw new Error('Private upload did not return a file path.');
    return q.data.path;
  }

  async function submitIdentity(mid){
    if(busy)return;
    const s=await session();if(!s){alert('Please log in again.');return;}
    const age=Number(document.getElementById('lpiAge')?.value);
    const sex=document.getElementById('lpiSex')?.value.trim();
    const name=document.getElementById('lpiName')?.value.trim();
    const phone=document.getElementById('lpiPhone')?.value.trim();
    const type=document.getElementById('lpiIdType')?.value.trim();
    const number=document.getElementById('lpiIdNumber')?.value.trim();
    const username=document.getElementById('lpiUsername')?.value.trim();
    const idFile=document.getElementById('lpiIdFile')?.files?.[0]||null;
    const passportFile=document.getElementById('lpiPassportFile')?.files?.[0]||null;
    const profileFile=document.getElementById('lpiProfileFile')?.files?.[0]||null;
    const msg=document.getElementById('lpiMsg'),btn=document.getElementById('lpiSubmit');
    if(!Number.isInteger(age)||age<18||age>120){msg.innerHTML='<div class="notice error">Please enter a valid age of 18 or above.</div>';return;}
    if(!sex){msg.innerHTML='<div class="notice error">Please select your sex.</div>';return;}
    if(!name||!phone||!type||!number||!username){msg.innerHTML='<div class="notice error">Please complete all required identity fields.</div>';return;}
    if(!passportFile){msg.innerHTML='<div class="notice error">Please upload your real passport-style photo. It will be kept private and shown only to authorized LEOGO Admin staff.</div>';return;}
    if(!profileFile){msg.innerHTML='<div class="notice error">Please upload a Premium profile picture.</div>';return;}
    busy=true;btn.disabled=true;btn.textContent='UPLOADING & SUBMITTING…';
    try{
      msg.innerHTML='<div class="notice">Uploading your private verification files…</div>';
      const idPath=await upload(idFile,'id-document',mid);
      const passportPath=await upload(passportFile,'passport-photo',mid);
      const profilePath=await upload(profileFile,'profile',mid);
      msg.innerHTML='<div class="notice">Sending your identity details for Admin review…</div>';
      const q=await sb.rpc('submit_premium_identity',{p_membership_id:mid,p_full_name_as_id:name,p_phone_number:phone,p_id_type:type,p_id_number:number,p_id_document_path:idPath,p_profile_photo_path:profilePath,p_leogo_username:username,p_age:age,p_sex:sex,p_passport_photo_path:passportPath});
      if(q.error)throw q.error;
      lastKey='submitted';
      const currentBox=document.getElementById('leogoPremiumIdentityBox');
      if(currentBox)currentBox.innerHTML='<div class="notice success"><b>Identity submitted to LEOGO Admin.</b><br>Your age, sex, identity details, private passport photo and payment reference are now waiting for administrative review. The private passport photo is available only to authorized Admin staff.</div>';
    }catch(e){msg.innerHTML='<div class="notice error"><b>Submission failed.</b><br>'+esc(e.message||'Unable to submit identity right now.')+'</div>';}
    finally{busy=false;btn.disabled=false;btn.textContent='SUBMIT IDENTITY FOR ADMIN REVIEW';}
  }

  const observer=new MutationObserver(()=>{if(document.getElementById('leogoPremiumModal')&&!busy&&!rendering)inject();});
  function start(){observer.observe(document.body,{childList:true,subtree:true});inject();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
