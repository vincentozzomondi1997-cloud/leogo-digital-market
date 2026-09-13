/* LEOGO selected-delete confirmation layer.
   Deletion is intentionally limited to Disposable Cleanup records and only to checked rows.
   No password re-login is used. */
(function(){
  'use strict';
  if(window.__leogoSimpleDeleteLoaded)return;
  window.__leogoSimpleDeleteLoaded=true;

  const SUPABASE_URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const SUPABASE_KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
  const TABLES=[
    'notifications',
    'order_status_history',
    'premium_profile_chat_messages',
    'premium_profile_media_changes',
    'premium_profile_daily_requests',
    'premium_profile_daily_acceptances',
    'premium_profile_gallery'
  ];

  function message(text,ok){
    const e=document.getElementById('adtMsg');
    if(e){
      const safe=String(text).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
      e.innerHTML='<div style="padding:10px;border-radius:9px;background:'+(ok?'#ecfdf3;color:#166534':'#fef2f2;color:#991b1b')+'">'+safe+'</div>';
    }
  }

  async function deleteSelected(){
    const dataset=document.querySelector('.adtDataTab.active')?.dataset.dataset;
    if(dataset!=='cleanup'){
      message('Deletion is available only in Disposable Cleanup. Core business records are protected.',false);
      return;
    }

    const selected=[...document.querySelectorAll('.adtRowCheck:checked')]
      .map(x=>String(x.dataset.rowKey||'').trim())
      .filter(Boolean);
    if(!selected.length){
      message('Select at least one record to delete.',false);
      return;
    }

    if(!confirm('Are you sure you permanently want to delete '+selected.length+' selected data record(s)? This action cannot be undone.'))return;

    try{
      const matches=new Map();
      for(const table of TABLES){
        const q=await sb.from(table).select('id').in('id',selected);
        if(q.error)throw q.error;
        for(const row of (q.data||[])){
          const id=String(row.id);
          if(!matches.has(id))matches.set(id,[]);
          matches.get(id).push(table);
        }
      }

      const ambiguous=[];
      const byTable={};
      for(const id of selected){
        const tables=matches.get(id)||[];
        if(tables.length!==1){
          if(tables.length>1)ambiguous.push(id);
          continue;
        }
        (byTable[tables[0]]??=[]).push(id);
      }

      if(ambiguous.length){
        message('Deletion stopped safely because '+ambiguous.length+' selected ID(s) exist in more than one disposable table. Nothing was deleted for those ambiguous selections.',false);
        return;
      }

      let total=0;
      const details=[];
      for(const [table,ids] of Object.entries(byTable)){
        if(!ids.length)continue;
        const r=await sb.rpc('leogo_admin_delete_selected_disposable_data',{p_table_name:table,p_ids:ids});
        if(r.error)throw r.error;
        const n=Number(r.data?.deleted_count||0);
        total+=n;
        if(n)details.push(table+': '+n);
      }

      if(total){
        message('Deleted '+total+' selected record(s). '+details.join(' · '),true);
        document.querySelector('#adtRefresh')?.click();
      }else{
        message('The selected records were not found. Nothing was deleted.',false);
      }
    }catch(e){
      message(e?.message||'Deletion failed. Nothing was deleted.',false);
    }
  }

  function bind(){
    const b=document.getElementById('adtDeleteSelected');
    if(!b){setTimeout(bind,300);return;}
    b.onclick=deleteSelected;
    b.title='Permanently delete only the selected Disposable Cleanup records';
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
