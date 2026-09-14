/* LEOGO Premium Profile Owner — old request cleanup */
(function(){
  'use strict';
  if(window.__leogoPremiumOwnerRequestCleanup)return;
  window.__leogoPremiumOwnerRequestCleanup=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const $=id=>document.getElementById(id);

  async function addDeleteButtons(areaId,type){
    const area=$(areaId); if(!area)return;
    const table=type==='booking'?'premium_profile_bookings':'premium_profile_interests';
    const q=await sb.from(table).select('id,status').order('created_at',{ascending:false});
    if(q.error)return;
    const rows=q.data||[];
    area.querySelectorAll('tbody tr').forEach((tr,index)=>{
      const dbRow=rows[index];
      if(!dbRow || dbRow.status==='pending')return;
      const cell=tr.lastElementChild; if(!cell)return;
      if(cell.querySelector('[data-owner-delete-request]'))return;
      const b=document.createElement('button');
      b.type='button'; b.className='btn danger'; b.textContent='DELETE';
      b.dataset.ownerDeleteRequest='1';
      b.dataset.type=type;
      b.dataset.id=dbRow.id;
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
      const refresh=type==='booking'?$('refreshBooking'):$('refreshInterest');
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

  async function decorate(){
    await Promise.all([
      addDeleteButtons('interestArea','interest'),
      addDeleteButtons('bookingArea','booking')
    ]);
  }

  const observer=new MutationObserver(()=>setTimeout(decorate,100));
  observer.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(decorate,500));
  else setTimeout(decorate,500);
})();
