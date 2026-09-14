/* LEOGO Premium Profile Owner — old request cleanup */
(function(){
  'use strict';
  if(window.__leogoPremiumOwnerRequestCleanup)return;
  window.__leogoPremiumOwnerRequestCleanup=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  function addDeleteButtons(areaId,type){
    const area=$(areaId); if(!area)return;
    area.querySelectorAll('tbody tr').forEach(tr=>{
      const status=(tr.querySelector('.pill')?.textContent||'').trim().toLowerCase();
      const cell=tr.lastElementChild; if(!cell)return;
      if(cell.querySelector('[data-owner-delete-request]'))return;
      if(status==='pending')return;
      const b=document.createElement('button');
      b.type='button'; b.className='btn danger'; b.textContent='DELETE';
      b.dataset.ownerDeleteRequest='1';
      b.dataset.type=type;
      const view=cell.querySelector('[data-action="view"], [data-owner-customer-view]');
      if(view)b.dataset.id=view.dataset.id;
      else{
        const buttons=cell.querySelectorAll('button');
        const first=buttons[0];
        if(first)b.dataset.id=first.dataset.id;
      }
      if(!b.dataset.id)return;
      const wrap=cell.querySelector('div')||cell;
      wrap.appendChild(b);
    });
  }

  async function removeRequest(id,type){
    if(!id)return;
    const label=type==='booking'?'booking request':'interest request';
    if(!confirm('Delete this old '+label+'?\n\nThis permanently removes the request record. This cannot be undone.'))return;
    const b=[...document.querySelectorAll('[data-owner-delete-request]')].find(x=>x.dataset.id===id&&x.dataset.type===type);
    if(b)b.disabled=true;
    try{
      const q=await sb.rpc('premium_profile_owner_delete_request',{p_request_id:id,p_type:type});
      if(q.error)throw q.error;
      alert('The '+label+' was deleted.');
      const refresh=type==='booking'?$ ('refreshBooking'):$('refreshInterest');
      if(refresh)refresh.click();
    }catch(e){
      alert(e.message||'Unable to delete the request.');
      if(b)b.disabled=false;
    }
  }

  document.addEventListener('click',function(e){
    const b=e.target.closest('[data-owner-delete-request]');
    if(!b)return;
    e.preventDefault(); e.stopImmediatePropagation();
    removeRequest(b.dataset.id,b.dataset.type);
  },true);

  function decorate(){
    addDeleteButtons('interestArea','interest');
    addDeleteButtons('bookingArea','booking');
  }

  const observer=new MutationObserver(()=>setTimeout(decorate,50));
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(decorate,400));
  else setTimeout(decorate,400);
})();
