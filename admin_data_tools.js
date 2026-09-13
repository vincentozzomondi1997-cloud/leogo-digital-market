/* LEOGO Admin Data Tools — centralized Operations data management, safe export and deletion helpers. */
(function(){
'use strict';
if(window.__leogoAdminDataTools)return; window.__leogoAdminDataTools=true;
const SUPABASE_URL='https://twpiloiiigdghwcdjbnj.supabase.co';
const SUPABASE_KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

/* Deletion remains deliberately limited to disposable operational tables. */
const DELETE_TABLES=['notifications','order_status_history','premium_profile_chat_messages','premium_profile_media_changes','premium_profile_daily_requests','premium_profile_daily_acceptances','premium_profile_gallery'];
const DELETE_LABELS={notifications:'Notifications',order_status_history:'Order Status History',premium_profile_chat_messages:'Premium Chat Messages',premium_profile_media_changes:'Premium Media Changes',premium_profile_daily_requests:'Premium Daily Requests',premium_profile_daily_acceptances:'Premium Daily Acceptances',premium_profile_gallery:'Premium Profile Gallery'};

const DATASETS={
 sellers:{label:'Sellers',main:'sellers'},
 providers:{label:'Service Providers',main:'providers'},
 transporters:{label:'Transporters & Vehicles',main:'transporters'},
 customers:{label:'Registered Customers',main:'customers'},
 premium:{label:'Premium Profiles',main:'premium'},
 reports:{label:'Order & Work Reports',main:'reports'}
};
let CACHE={};
let CURRENT={dataset:'sellers',rows:[],sheets:{}};

function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function msg(t,ok){const e=document.getElementById('adtMsg');if(e)e.innerHTML='<div style="padding:10px;border-radius:9px;background:'+(ok?'#ecfdf3;color:#166534':'#fef2f2;color:#991b1b')+'">'+esc(t)+'</div>'}
function fmt(v){if(v===null||v===undefined)return ''; if(typeof v==='object')return JSON.stringify(v); return String(v)}
function norm(v){return String(v??'').toLowerCase()}
function dateOnly(v){return v?String(v).slice(0,10):''}

async function admin(){const {data:{session}}=await sb.auth.getSession();if(!session)return false;const q=await sb.rpc('leogo_is_admin');return !q.error&&q.data===true}
async function get(table,columns='*',order='created_at'){const q=await sb.from(table).select(columns);if(q.error)throw q.error;let d=q.data||[];if(order&&d.length&&Object.prototype.hasOwnProperty.call(d[0],order))d.sort((a,b)=>String(b[order]||'').localeCompare(String(a[order]||'')));return d}
async function safeGet(table,columns='*',order='created_at'){try{return await get(table,columns,order)}catch(e){return []}}

async function loadDataset(name){
 if(CACHE[name])return CACHE[name];
 if(!await admin())throw new Error('Admin access is required.');
 let d={main:[],sheets:{}};
 if(name==='sellers'){
   const [sellers,products,items,orders]=await Promise.all([get('sellers'),get('products'),get('order_items'),get('orders')]);
   const bySeller={}; items.forEach(i=>(bySeller[i.seller_id]??=[]).push(i));
   d.main=sellers.map(s=>{const ps=products.filter(p=>p.seller_id===s.id),is=bySeller[s.id]||[],orderIds=[...new Set(is.map(i=>i.order_id))],os=orders.filter(o=>orderIds.includes(o.id));return {...s,item_count:ps.length,items:ps.map(p=>p.name).filter(Boolean).join(' | '),orders_received:os.length,order_ids:orderIds.join(' | ')}});
   d.sheets={Sellers:sellers,'Seller Items':products,'Seller Order Items':items,'Seller Orders':orders.filter(o=>items.some(i=>i.order_id===o.id))};
 }
 if(name==='providers'){
   const [profiles,services,jobs]=await Promise.all([get('profiles'),get('services'),get('service_jobs')]);
   const providers=profiles.filter(p=>norm(p.role).includes('provider'));
   d.main=providers.map(p=>{const ss=services.filter(s=>s.provider_id===p.id),js=jobs.filter(j=>j.provider_id===p.id);return {...p,service_count:ss.length,services:ss.map(s=>s.name).filter(Boolean).join(' | '),bookings_received:js.length,booking_ids:js.map(j=>j.id).join(' | ')}});
   d.sheets={'Service Providers':providers,Services:services,'Service Bookings / Jobs':jobs};
 }
 if(name==='transporters'){
   const [profiles,vehicles,requests]=await Promise.all([get('profiles'),get('vehicles'),get('transport_requests')]);
   const transporters=profiles.filter(p=>norm(p.role).includes('transport'));
   d.main=transporters.map(p=>{const vs=vehicles.filter(v=>v.owner_id===p.id),rs=requests.filter(r=>r.driver_id===p.id);return {...p,vehicle_count:vs.length,vehicles:vs.map(v=>v.registration||v.vehicle_type).filter(Boolean).join(' | '),requests_received:rs.length,request_ids:rs.map(r=>r.id).join(' | ')}});
   d.sheets={Transporters:transporters,Vehicles:vehicles,'Transport Requests':requests};
 }
 if(name==='customers'){
   const [profiles,orders,jobs,requests]=await Promise.all([get('profiles'),get('orders'),get('service_jobs'),get('transport_requests')]);
   const customers=profiles.filter(p=>norm(p.role)==='customer'||norm(p.role).includes('customer'));
   d.main=customers.map(p=>({...p,order_count:orders.filter(o=>o.customer_id===p.id).length,service_booking_count:jobs.filter(j=>j.customer_id===p.id).length,transport_request_count:requests.filter(r=>r.customer_id===p.id).length}));
   d.sheets={Customers:customers,Orders:orders,'Service Bookings / Jobs':jobs,'Transport Requests':requests};
 }
 if(name==='premium'){
   const [profiles,applications,bookings]=await Promise.all([get('premium_profiles'),safeGet('premium_profile_applications'),safeGet('premium_profile_bookings')]);
   d.main=profiles.map(p=>({...p,booking_count:bookings.filter(b=>b.premium_profile_id===p.id).length,application_status:(applications.find(a=>a.user_id===p.user_id)||{}).status||''}));
   d.sheets={'Premium Profiles':profiles,'Premium Applications':applications,'Premium Bookings':bookings};
 }
 if(name==='reports'){
   const [orders,items,history,jobs,requests,premiumBookings]=await Promise.all([get('orders'),get('order_items'),get('order_status_history'),get('service_jobs'),get('transport_requests'),safeGet('premium_profile_bookings')]);
   d.main=[
     ...orders.map(x=>({...x,report_type:'ORDER'})),
     ...jobs.map(x=>({...x,report_type:'SERVICE WORK',report_id:x.id,status:x.status,amount:x.price??x.budget})),
     ...requests.map(x=>({...x,report_type:'TRANSPORT WORK',report_id:x.id,status:x.status,amount:x.customer_total??x.price})),
     ...premiumBookings.map(x=>({...x,report_type:'PREMIUM BOOKING',report_id:x.id,status:x.status}))
   ];
   d.sheets={Orders:orders,'Order Items':items,'Order Status History':history,'Service Work':jobs,'Transport Work':requests,'Premium Bookings':premiumBookings};
 }
 CACHE[name]=d;return d;
}

function applyFilters(rows){
 const q=norm(document.getElementById('adtSearch')?.value),status=norm(document.getElementById('adtStatus')?.value),from=document.getElementById('adtFrom')?.value,to=document.getElementById('adtTo')?.value;
 return rows.filter(r=>{
   const text=Object.values(r).map(fmt).join(' ').toLowerCase();
   const dt=dateOnly(r.created_at||r.submitted_at||r.requested_date||r.preferred_date);
   return (!q||text.includes(q))&&(!status||norm(r.status||r.approval_status||r.verification_status||r.application_status).includes(status))&&(!from||!dt||dt>=from)&&(!to||!dt||dt<=to);
 });
}
function statusOptions(rows){const vals=[...new Set(rows.map(r=>r.status||r.approval_status||r.verification_status||r.application_status).filter(Boolean).map(String))].sort();return '<option value="">All statuses</option>'+vals.map(v=>'<option value="'+esc(v)+'">'+esc(v)+'</option>').join('')}
function columns(rows){const keys=[];rows.slice(0,100).forEach(r=>Object.keys(r).forEach(k=>{if(!keys.includes(k))keys.push(k)}));return keys.slice(0,14)}
function renderRows(rows){
 const area=document.getElementById('adtPreview');if(!area)return;
 if(!rows.length){area.innerHTML='<div class="empty">No records match the current filters.</div>';return}
 const cols=columns(rows);const head=cols.map(k=>'<th>'+esc(k)+'</th>').join('');const body=rows.slice(0,200).map(r=>'<tr>'+cols.map(k=>'<td>'+esc(fmt(r[k]))+'</td>').join('')+'</tr>').join('');
 area.innerHTML='<div class="muted" style="margin-bottom:8px">Showing '+Math.min(rows.length,200)+' of '+rows.length+' matching records.</div><div class="table-wrap"><table class="table"><thead><tr>'+head+'</tr></thead><tbody>'+body+'</tbody></table></div>';
}
function renderDataset(){
 const d=CACHE[CURRENT.dataset];if(!d)return;
 const filtered=applyFilters(d.main);CURRENT.rows=filtered;renderRows(filtered);
 const status=document.getElementById('adtStatus');if(status)status.innerHTML=statusOptions(d.main);
 const count=document.getElementById('adtCount');if(count)count.textContent=filtered.length+' matching records';
}
async function chooseDataset(name){try{CURRENT.dataset=name;document.querySelectorAll('.adtDataTab').forEach(b=>b.classList.toggle('active',b.dataset.dataset===name));if(!CACHE[name]){document.getElementById('adtPreview').innerHTML='<div class="empty">Loading data…</div>';await loadDataset(name)}renderDataset();msg(DATASETS[name].label+' loaded.',true)}catch(e){msg(e.message||'Unable to load data.',false)}}
function injectOperationsPage(){
 if(document.getElementById('page-admin-data'))return;
 const side=document.getElementById('side');
 if(side){const navTitles=[...side.querySelectorAll('.nav-title')];const op=navTitles.find(x=>norm(x.textContent)==='operations');if(op){const nav=op.nextElementSibling;if(nav&&nav.classList.contains('nav')){const b=document.createElement('button');b.dataset.page='admin-data';b.textContent='🗂️ Data Management';b.onclick=openOperations;b.className='adtNav';nav.appendChild(b)}}}
 const section=document.createElement('section');section.id='page-admin-data';section.className='page';section.innerHTML='<div class="card"><div class="toolbar"><div><h2 style="margin:0">Operations Data Management</h2><div class="muted">Central admin view of seller, provider, transporter, customer, premium and operational report data.</div></div><div class="actions"><button id="adtRefresh" class="light">↻ REFRESH</button><button id="adtExport" class="orange">📊 EXPORT FILTERED EXCEL</button></div></div><div class="filters" style="margin-top:12px">'+Object.entries(DATASETS).map(([k,v],i)=>'<button class="adtDataTab '+(i===0?'orange active':'light')+'" data-dataset="'+k+'">'+v.label+'</button>').join('')+'</div><div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:8px;align-items:end;margin-top:12px"><label style="margin:0">Search<input id="adtSearch" placeholder="Name, phone, business, status, ID…"></label><label style="margin:0">Status<select id="adtStatus"></select></label><label style="margin:0">From<input id="adtFrom" type="date"></label><label style="margin:0">To<input id="adtTo" type="date"></label><button id="adtFilter" class="light">FILTER</button></div><div class="toolbar" style="margin-top:12px"><b id="adtCount">0 matching records</b><span class="muted">Preview is limited to 200 rows for safety/performance; export uses all filtered records.</span></div><div id="adtPreview"></div><div id="adtMsg" style="margin-top:10px"></div><div class="notice" style="margin-top:12px">This is a read/export workspace. Existing marketplace, seller, service, transport, customer and premium management functions are not rewritten here. Core business data is not deleted by the DELETE DATA control below.</div></div><div class="card"><div class="toolbar"><div><h2 style="margin:0">Disposable Data Cleanup</h2><div class="muted">Use only for old operational records that are safe to remove.</div></div><button id="adtDelete" class="danger">🗑️ DELETE SELECTED DISPOSABLE DATA</button></div><label style="max-width:520px">Data type<select id="adtDeleteTable"></select></label></div>';
 const host=document.querySelector('main');(host||document.body).appendChild(section);
 section.querySelectorAll('.adtDataTab').forEach(b=>b.onclick=()=>chooseDataset(b.dataset.dataset));
 section.querySelector('#adtFilter').onclick=renderDataset;section.querySelector('#adtRefresh').onclick=async()=>{CACHE={};await chooseDataset(CURRENT.dataset)};section.querySelector('#adtExport').onclick=exportCurrent;section.querySelector('#adtDelete').onclick=deleteData;
 section.querySelector('#adtDeleteTable').innerHTML='<option value="">Select disposable data</option>'+DELETE_TABLES.map(t=>'<option value="'+t+'">'+DELETE_LABELS[t]+'</option>').join('');
 ['adtSearch','adtFrom','adtTo'].forEach(id=>section.querySelector('#'+id).addEventListener('input',renderDataset));
 section.querySelector('#adtStatus').addEventListener('change',renderDataset);
 chooseDataset('sellers');
}
function openOperations(){
 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('active'));
 const p=document.getElementById('page-admin-data'),b=document.querySelector('.adtNav');if(p)p.classList.add('active');if(b)b.classList.add('active');if(window.innerWidth<760)document.getElementById('side')?.classList.remove('open');
}
async function loadXLSX(){if(window.XLSX)return;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})}
async function exportCurrent(){try{if(!await admin())return msg('Admin access is required.',false);const d=CACHE[CURRENT.dataset]||await loadDataset(CURRENT.dataset);const filtered=applyFilters(d.main);if(!filtered.length)return msg('There is no data matching the current filters.',false);await loadXLSX();const wb=XLSX.utils.book_new();const filteredSheet=filtered;XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(filteredSheet),'Filtered View');Object.entries(d.sheets).forEach(([name,rows])=>{const fr=applyFilters(rows);if(fr.length)XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(fr),name.slice(0,31))});XLSX.writeFile(wb,'LEOGO_'+CURRENT.dataset+'_report_'+new Date().toISOString().slice(0,10)+'.xlsx');msg(filtered.length+' matching records exported to Excel.',true)}catch(e){msg(e.message||'Export failed.',false)}}
async function deleteData(){try{const table=document.getElementById('adtDeleteTable')?.value;if(!table)return msg('Select disposable data first.',false);if(!await admin())return msg('Admin access is required.',false);if(!confirm('WARNING: This permanently deletes ALL '+(DELETE_LABELS[table]||table)+'. Continue?'))return;const token=prompt('Type DELETE to confirm permanent deletion:');if(token!=='DELETE')return msg('Deletion cancelled.',false);const q=await sb.rpc('leogo_admin_clear_disposable_data',{p_table_name:table});if(q.error)throw q.error;CACHE={};msg('Data deleted successfully. Refresh the selected report if needed.',true)}catch(e){msg(e.message||'Deletion failed.',false)}}
function init(){injectOperationsPage()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
