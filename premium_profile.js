/* LEOGO PREMIUM PROFILE - isolated member profile manager. */
(function(){
  if(window.__leogoPremiumProfileInstalled)return;
  window.__leogoPremiumProfileInstalled=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);

  const esc=v=>String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));

  function addProfileButton(){
    const modal=document.getElementById('leogoPremiumModal');
    if(!modal||modal.dataset.profileButton==='1')return;
    if(!/Private Premium Area|Access confirmed/i.test(modal.textContent||''))return;
    const area=Array.from(modal.querySelectorAll('.panel')).find(x=>/Private Premium Area/i.test(x.textContent||''));
    if(!area)return;
    modal.dataset.profileButton='1';
    const wrap=document.createElement('div');
    wrap.style.cssText='display:flex;justify-content:flex-end;margin-top:14px';
    wrap.innerHTML='<button class="btn orange" type="button" id="leogoPremiumProfileBtn">👤 MY PREMIUM PROFILE</button>';
    area.appendChild(wrap);
    wrap.querySelector('button').onclick=openProfile;
  }

  async function openProfile(){
    const session=(await sb.auth.getSession()).data?.session;
    if(!session){alert('Please log in again to manage your Premium profile.');return;}
    const q=await sb.from('premium_profiles').select('id,username,location,orientation,availability,fee,verified,approved').eq('user_id',session.user.id).maybeSingle();
    if(q.error){alert('Unable to load your Premium profile right now.');return;}
    showEditor(q.data||{});
  }

  function showEditor(p){
    document.getElementById('leogoPremiumProfileModal')?.remove();
    const m=document.createElement('div');m.id='leogoPremiumProfileModal';m.className='modal';
    m.innerHTML='<div class="modal-card" style="width:min(620px,100%)"><div class="modal-head"><div><div style="font-size:11px;font-weight:900;color:#ff7a00">LEOGO PREMIUM • PRIVATE PROFILE</div><h2 style="margin:3px 0">My Premium Profile</h2></div><button class="close" id="lppClose">✕</button></div>'+
      '<div class="notice">Your profile remains private while pending. It can only appear in Premium discovery after LEOGO approval. Verification is controlled by LEOGO staff and cannot be self-assigned.</div>'+
      '<div class="field"><label>Display name / username *</label><input id="lppUsername" maxlength="60" value="'+esc(p.username)+'" placeholder="Name you want members to see"></div>'+ 
      '<div class="field"><label>Location</label><input id="lppLocation" maxlength="120" value="'+esc(p.location)+'" placeholder="e.g. Siaya Town"></div>'+ 
      '<div class="field"><label>Orientation</label><input id="lppOrientation" maxlength="80" value="'+esc(p.orientation)+'" placeholder="Optional"></div>'+ 
      '<div class="field"><label>Availability</label><input id="lppAvailability" maxlength="120" value="'+esc(p.availability)+'" placeholder="Optional availability information"></div>'+ 
      '<div class="field"><label>Listing / connection fee (KSh)</label><input id="lppFee" type="number" min="0" step="1" value="'+(p.fee??'')+'" placeholder="Optional"></div>'+ 
      '<div id="lppStatus"></div>'+ 
      '<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:15px"><div style="font-size:12px;color:#667085">Verification: <b>'+(p.verified?'Verified':'Pending')+'</b></div><button class="btn orange" id="lppSave">SAVE PROFILE</button></div></div>';
    document.body.appendChild(m);
    document.getElementById('lppClose').onclick=()=>m.remove();
    m.onclick=e=>{if(e.target===m)m.remove();};
    document.getElementById('lppSave').onclick=saveProfile;
  }

  async function saveProfile(){
    const session=(await sb.auth.getSession()).data?.session;
    if(!session){return;}
    const username=document.getElementById('lppUsername')?.value.trim();
    const location=document.getElementById('lppLocation')?.value.trim()||null;
    const orientation=document.getElementById('lppOrientation')?.value.trim()||null;
    const availability=document.getElementById('lppAvailability')?.value.trim()||null;
    const rawFee=document.getElementById('lppFee')?.value;
    const fee=rawFee===''?null:Number(rawFee);
    const status=document.getElementById('lppStatus');
    const btn=document.getElementById('lppSave');
    if(!username){status.innerHTML='<div class="notice error">Please enter a display name.</div>';return;}
    if(fee!==null&&(!Number.isFinite(fee)||fee<0)){status.innerHTML='<div class="notice error">Please enter a valid fee.</div>';return;}
    btn.disabled=true;btn.textContent='SAVING…';
    const q=await sb.from('premium_profiles').upsert({user_id:session.user.id,username,location,orientation,availability,fee},{onConflict:'user_id'});
    if(q.error){btn.disabled=false;btn.textContent='SAVE PROFILE';status.innerHTML='<div class="notice error">'+esc(q.error.message)+'</div>';return;}
    status.innerHTML='<div class="notice success"><b>Saved.</b> Your profile is pending LEOGO approval before it can appear in Premium discovery.</div>';
    btn.disabled=false;btn.textContent='SAVE PROFILE';
  }

  const observer=new MutationObserver(addProfileButton);
  function start(){observer.observe(document.body,{childList:true,subtree:true});addProfileButton();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
