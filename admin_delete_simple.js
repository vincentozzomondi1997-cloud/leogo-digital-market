/* LEOGO selected-data archival deletion.
   Backup selected records to Excel first, then re-authenticate through the existing Admin login before deletion. */
(function(){
  'use strict';
  if(window.__leogoArchiveDeleteLoaded)return;
  window.__leogoArchiveDeleteLoaded=true;

  const SUPABASE_URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const SUPABASE_KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const CLEANUP_TABLES=['notifications','order_status_history','premium_profile_chat_messages','premium_profile_media_changes','premium_profile_daily_requests','premium_profile_daily_acceptances','premium_profile_gallery'];
  const PENDING_KEY='leogo_pending_archive_delete';

  function message(text,ok){
    const e=document.getElementById('adtMsg');
    if(e){const safe=String(text).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));e.innerHTML='<div style="padding:10px;border-radius:9px;background:'+(ok?'#ecfdf3;color:#166534':'#fef2f2;color:#991b1b')+'">'+safe+'</div>';}
  }
  function ids(){return [...document.querySelectorAll('.adtRowCheck:checked')].map(x=>String(x.dataset.rowKey||'').trim()).filter(Boolean)}
  function dataset(){return document.querySelector('.adtDataTab.active')?.dataset.dataset||''}

  async function cleanupGroups(selected){
    const found={};
    for(const table of CLEANUP_TABLES){
      const q=await sb.from(table).select('id').in('id',selected);if(q.error)throw q.error;
      (q.data||[]).forEach(r=>{const id=String(r.id);(found[id]??=[]).push(table);});
    }
    const grouped={};
    for(const id of selected){const t=found[id]||[];if(t.length!==1)throw new Error('A selected cleanup record could not be uniquely identified. Nothing was deleted.');(grouped[t[0]]??=[]).push(id);}
    return grouped;
  }

  async function finishPending(){
    const raw=sessionStorage.getItem(PENDING_KEY);if(!raw)return;
    let p;try{p=JSON.parse(raw)}catch(e){sessionStorage.removeItem(PENDING_KEY);return;}
    if(!p?.ids?.length||Date.now()-Number(p.created_at||0)>10*60*1000){sessionStorage.removeItem(PENDING_KEY);return;}
    const {data:{session}}=await sb.auth.getSession();if(!session)return;
    try{
      if(p.dataset==='reports'){
        const r=await sb.rpc('leogo_admin_delete_selected_data',{p_dataset:'reports',p_ids:p.ids});if(r.error)throw r.error;
        const n=Number(r.data?.deleted_count||0);sessionStorage.removeItem(PENDING_KEY);message(n?'Deleted '+n+' selected report record(s).':'No selected records were deleted.',!!n);if(n)document.getElementById('adtRefresh')?.click();
      }else if(p.dataset==='cleanup'){
        const groups=await cleanupGroups(p.ids);let n=0;
        for(const [table,group] of Object.entries(groups)){const r=await sb.rpc('leogo_admin_delete_selected_disposable_data',{p_table_name:table,p_ids:group});if(r.error)throw r.error;n+=Number(r.data?.deleted_count||0);}
        sessionStorage.removeItem(PENDING_KEY);message(n?'Deleted '+n+' selected disposable record(s).':'No selected records were deleted.',!!n);if(n)document.getElementById('adtRefresh')?.click();
      }
    }catch(e){sessionStorage.removeItem(PENDING_KEY);message(e?.message||'Deletion failed. Nothing was deleted.',false);}
  }

  function beginDelete(){
    const d=dataset(),selected=ids();
    if(!selected.length){message('Select at least one record first.',false);return;}
    if(d!=='reports'&&d!=='cleanup'){message('Deletion is protected on this tab. Old operational data should be removed from Order & Work Reports; master records remain protected.',false);return;}
    if(!confirm('BACKUP CHECK\n\nHave you already clicked EXPORT SELECTED EXCEL and safely saved the backup?\n\nOK = backup saved. Cancel = export first.'))return;
    if(!confirm('FINAL CONFIRMATION\n\nDelete '+selected.length+' selected record(s)? Only the checked records will be targeted.\n\nAfter this confirmation, use the existing Admin SIGN OUT button, then sign back in with the admin password. The pending deletion will continue automatically after the fresh login.'))return;
    sessionStorage.setItem(PENDING_KEY,JSON.stringify({dataset:d,ids:selected,created_at:Date.now()}));
    message('Deletion is prepared. Please click SIGN OUT, then sign in again with the Admin password. The selected records will then be deleted automatically.',true);
  }

  function bind(){const b=document.getElementById('adtDeleteSelected');if(!b){setTimeout(bind,400);return;}b.onclick=beginDelete;b.disabled=false;b.title='Export backup first, then sign out and sign in again before deletion';}
  sb.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'&&sessionStorage.getItem(PENDING_KEY))setTimeout(finishPending,500);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{bind();finishPending();});else{bind();finishPending();}
})();
