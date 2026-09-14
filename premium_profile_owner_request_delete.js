/* LEOGO PREMIUM PROFILE OWNER — OLD REQUEST CLEANUP */
(function(){
  'use strict';
  if(window.__leogoOwnerRequestDelete)return;
  window.__leogoOwnerRequestDelete=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function decorate(areaId,type){
    const area=$(areaId); if(!area)return;
    area.querySelectorAll('tbody tr').forEach(tr=>{
      const action=tr.lastElementChild; if(!action||action.querySelector('[data-delete-request]'))return;
      const view=action.querySelector('[data-action="view"]');
      if(!view)return;
      const id=view.dataset.id;
      const status=(tr.querySelector('.pill')?.textContent||'').trim().toLowerCase();
      if(status==='pending')return;
      const b=document.createElement('button');
      b.type='button'; b.className='btn danger'; b.textContent='DELETE';
      b.dataset.deleteRequest='1'; b.dataset.type=type; b.dataset.id=id;
      b.style.marginLeft='5px';
      action.appendChild(b);
    });
  }
  async function remove(id,type,button){
    if(!confirm('Delete this old '+type+' request from your request history?\n\nThis permanently removes the request record. Pending requests cannot be deleted.'))return;
    button.disabled=true;
    const q=await sb.rpc('premium_profile_owner_delete_request',{p_request_id:id,p_type:type});
    if(q.error){alert(q.error.message);button.disabled=false;return;}
    const row=button.closest('tr'); if(row)row.remove();
  }
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-delete-request]');
    if(!b)return;
    e.preventDefault(); e.stopImmediatePropagation();
    remove(b.dataset.id,b.dataset.type,b);
  },true);
  const watch=(id,type)=>{const area=$(id);if(!area)return;new MutationObserver(()=>decorate(id,type)).observe(area,{childList:true,subtree:true});decorate(id,type)};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{watch('interestArea','interest');watch('bookingArea','booking')});
  else {watch('interestArea','interest');watch('bookingArea','booking')}
})();