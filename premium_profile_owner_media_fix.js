/* LEOGO PREMIUM PROFILE OWNER MEDIA FIX — SAFE FRONTEND BRIDGE */
(function(){
  'use strict';
  if(window.__leogoPremiumOwnerMediaFix)return;
  window.__leogoPremiumOwnerMediaFix=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const MEDIA=URL+'/functions/v1/premium-profile-media';
  const sb=window.supabase.createClient(URL,KEY);
  const ADMIN_EMAIL='leogodigitalmarket@gmail.com';
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  function status(input,msg,ok){
    if(!input)return;
    let box=input.parentElement.querySelector('[data-media-fix-status]');
    if(!box){box=document.createElement('div');box.dataset.mediaFixStatus='1';box.style.cssText='margin-top:6px;font-size:12px;font-weight:700';input.parentElement.appendChild(box)}
    box.style.color=ok?'#166534':'#991b1b';
    box.textContent=msg||'';
  }

  async function getSession(){
    const s=await sb.auth.getSession();
    const u=s.data?.session?.user;
    if(!u)throw new Error('Please log in again.');
    if(String(u.email||'').trim().toLowerCase()===ADMIN_EMAIL)throw new Error('This is the LEOGO Admin account. It can only be used in the Admin Control Center.');
    return s.data.session;
  }

  async function upload(slot,input,button){
    const file=input?.files?.[0];
    if(!file){status(input,'Choose an image first.');input?.focus();return;}
    if(file.size>5*1024*1024){status(input,'Image must be 5MB or smaller.');return;}
    const allowed=['image/jpeg','image/png','image/webp','image/jfif'];
    if(!allowed.includes(file.type)){status(input,'Only JPG, JFIF, PNG or WEBP images are allowed.');return;}
    if(button)button.disabled=true;
    status(input,'Uploading…',true);
    try{
      const session=await getSession();
      const form=new FormData();
      form.append('kind','gallery');
      form.append('slot',String(slot));
      form.append('file',file,file.name||('gallery-'+slot+'.jpg'));
      const r=await fetch(MEDIA,{method:'POST',headers:{Authorization:'Bearer '+session.access_token,apikey:KEY},body:form});
      const data=await r.json().catch(()=>({}));
      if(!r.ok||data.error)throw new Error(data.error||'The image could not be uploaded.');
      status(input,'Uploaded successfully. Waiting for Admin approval.',true);
      input.value='';
      setTimeout(()=>location.reload(),600);
    }catch(e){status(input,e.message||'Upload failed.');}
    finally{if(button)button.disabled=false;}
  }

  function bind(){
    document.querySelectorAll('[data-gallery-upload]').forEach(button=>{
      if(button.dataset.mediaFixBound==='1')return;
      button.dataset.mediaFixBound='1';
      button.type='button';
      button.addEventListener('click',function(e){
        e.preventDefault();
        e.stopImmediatePropagation();
        const slot=Number(this.dataset.galleryUpload);
        const input=$('galleryFile'+slot);
        upload(slot,input,this);
      },true);
    });
  }

  const observer=new MutationObserver(bind);
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);
  else setTimeout(bind,0);
})();
