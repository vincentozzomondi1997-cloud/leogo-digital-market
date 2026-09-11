/* LEOGO ADMIN - Premium private document viewer fix. */
(function(){
  'use strict';
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  let running=false;
  async function openPrivate(path,label){
    if(!path){alert((label||'Private file')+' is unavailable.');return;}
    try{const q=await sb.storage.from('premium-private').createSignedUrl(path,300);if(q.error)throw q.error;if(!q.data?.signedUrl)throw new Error('No secure viewing link was returned.');window.open(q.data.signedUrl,'_blank','noopener,noreferrer');}
    catch(e){alert((label||'Private file')+' could not be opened: '+(e.message||'Unknown error'));}
  }
  async function repair(){
    if(running)return;const host=document.getElementById('premiumIdentityReviewArea');if(!host)return;
    const buttons=Array.from(host.querySelectorAll('button')).filter(b=>/^(VIEW ID|VIEW PROFILE|VIEW PASSPORT PHOTO)$/i.test((b.textContent||'').trim()));if(!buttons.length)return;
    running=true;try{
      const q=await sb.from('premium_identity_submissions').select('id,full_name_as_id,phone_number,id_document_path,profile_photo_path,passport_photo_path').order('submitted_at',{ascending:false}).limit(200);if(q.error)throw q.error;const rows=q.data||[];
      Array.from(host.querySelectorAll('tbody tr')).forEach(tr=>{const cells=tr.querySelectorAll('td');if(cells.length<7)return;const name=(cells[2]?.textContent||'').replace(/\s+/g,' ').trim();const phone=(cells[3]?.textContent||'').replace(/\s+/g,' ').trim();const r=rows.find(x=>String(x.full_name_as_id||'').trim()===name&&String(x.phone_number||'').trim()===phone);if(!r)return;Array.from(cells[6].querySelectorAll('button')).forEach(btn=>{const label=(btn.textContent||'').trim();let path=null,kind='Private file';if(label==='VIEW ID'){path=r.id_document_path;kind='ID document';}else if(label==='VIEW PROFILE'){path=r.profile_photo_path;kind='Profile photo';}else if(label==='VIEW PASSPORT PHOTO'){path=r.passport_photo_path;kind='Passport-style photo';}if(!path)return;btn.removeAttribute('onclick');btn.onclick=ev=>{ev.preventDefault();ev.stopPropagation();openPrivate(path,kind);};});});
    }catch(e){console.error('LEOGO Premium private viewer:',e);}finally{running=false;}
  }
  const observer=new MutationObserver(()=>repair());
  function start(){if(!document.body)return;observer.observe(document.body,{childList:true,subtree:true});repair();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
