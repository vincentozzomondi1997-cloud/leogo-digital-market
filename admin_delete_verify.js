/* LEOGO selected-delete verification layer.
   Does NOT collect or store passwords. Step 1 confirms the deletion; Step 2 requires a fresh admin password sign-in through the existing Admin login screen. */
(function(){
'use strict';
const SUPABASE_URL='https://twpiloiiigdghwcdjbnj.supabase.co';
const SUPABASE_KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const TABLES=['notifications','order_status_history','premium_profile_chat_messages','premium_profile_media_changes','premium_profile_daily_requests','premium_profile_daily_acceptances','premium_profile_gallery'];
const labels={notifications:'Notifications',order_status_history:'Order Status History',premium_profile_chat_messages:'Premium Chat Messages',premium_profile_media_changes:'Premium Media Changes',premium_profile_daily_requests:'Premium Daily Requests',premium_profile_daily_acceptances:'Premium Daily Acceptances',premium_profile_gallery:'Premium Profile Gallery'};
function message(text,ok){const e=document.getElementById('adtMsg');if(e)e.innerHTML='<div style="padding:10px;border-radius:9px;background:'+(ok?'#ecfdf3;color:#166534':'#fef2f2;color:#991b1b')+'">'+String(text).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</div>'}
async function performPendingDelete(){
 let raw=null;try{raw=sessionStorage.getItem('leogo_pending_delete')}catch(e){return}
 if(!raw)return;
 let pending;try{pending=JSON.parse(raw)}catch(e){sessionStorage.removeItem('leogo_pending_delete');return}
 if(!pending||pending.action!=='delete_disposable'||!Array.isArray(pending.ids)||!pending.ids.length){sessionStorage.removeItem('leogo_pending_delete');return}
 const {data:{user},error:userError}=await sb.auth.getUser();
 if(userError||!user){return}
 try{
   let total=0;const results=[];
   for(const table of TABLES){
     const q=await sb.from(table).select('id').in('id',pending.ids);if(q.error)throw q.error;
     const ids=(q.data||[]).map(r=>r.id);if(!ids.length)continue;
     const r=await sb.rpc('leogo_admin_delete_selected_disposable_data',{p_table_name:table,p_ids:ids});
     if(r.error)throw r.error;
     const n=Number(r.data?.deleted_count||0);total+=n;if(n)results.push(labels[table]+': '+n);
   }
   sessionStorage.removeItem('leogo_pending_delete');
   if(total){message('Deletion authorized by fresh admin sign-in. Deleted '+total+' selected record(s). '+results.join(' · '),true);document.querySelector('#adtRefresh')?.click()}
   else message('No selected records were found. Nothing was deleted.',false);
 }catch(e){sessionStorage.removeItem('leogo_pending_delete');message(e.message||'Deletion failed. Nothing was deleted.',false)}
}
async function deleteSelected(){
 const dataset=document.querySelector('.adtDataTab.active')?.dataset.dataset;
 if(dataset!=='cleanup'){message('Selected deletion is available only for Disposable Cleanup records. Core business records remain protected.',false);return}
 const ids=[...document.querySelectorAll('.adtRowCheck:checked')].map(x=>x.dataset.rowKey).filter(Boolean);
 if(!ids.length){message('Select at least one record to delete.',false);return}
 if(!confirm('Step 1 of 2: Permanently delete '+ids.length+' selected record(s)? This cannot be undone.'))return;
 try{sessionStorage.setItem('leogo_pending_delete',JSON.stringify({action:'delete_disposable',ids:ids.slice(0,500),created_at:Date.now()}))}catch(e){message('Could not prepare the secure deletion request.',false);return}
 alert('Step 2 of 2: You will now return to the Admin login screen. Sign in again with the admin password. After successful sign-in, only the selected records will be deleted.');
 await sb.auth.signOut();
 window.location.href='admin.html?reauth=delete';
}
window.deleteSelected=deleteSelected;
function bind(){const b=document.getElementById('adtDeleteSelected');if(b){b.onclick=deleteSelected;b.title='Requires fresh admin password sign-in';}performPendingDelete()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind);else bind();
})();
