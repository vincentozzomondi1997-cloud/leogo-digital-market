/* LEOGO PREMIUM CUSTOMER REQUESTS — ADMIN VIEW ONLY
   Priority queue for incoming Premium booking/interest requests.
   IMPORTANT: Staff/Admin have NO accept/decline controls here. The Premium Profile Owner remains responsible for responding. */
(function(){
  'use strict';
  if(window.__leogoPremiumCustomerRequests)return;
  window.__leogoPremiumCustomerRequests=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co',KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.__leogoAdminSB||window.supabase.createClient(URL,KEY);
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const ago=v=>{if(!v)return '—';const ms=Date.now()-new Date(v).getTime();if(ms<60000)return 'Just now';if(ms<3600000)return Math.floor(ms/60000)+' min ago';if(ms<86400000)return Math.floor(ms/3600000)+' hr ago';return Math.floor(ms/86400000)+' day(s) ago'};
  let timer=null;
  async function load(){
    const host=$('premiumCustomerRequestsArea');if(!host)return;
    host.innerHTML='<div class="muted">Checking new Premium customer requests…</div>';
    const [b,i,p]=await Promise.all([
      sb.from('premium_profile_bookings').select('id,premium_profile_id,customer_id,requested_date,requested_time,message,status,created_at').eq('status','pending').order('created_at',{ascending:false}).limit(100),
      sb.from('premium_profile_interests').select('id,premium_profile_id,customer_id,message,status,created_at').eq('status','pending').order('created_at',{ascending:false}).limit(100),
      sb.from('premium_profiles').select('id,username,location,availability,approved').eq('approved',true)
    ]);
    if(b.error||i.error||p.error){host.innerHTML='<div class="msg error">Could not load Premium customer requests: '+esc(b.error?.message||i.error?.message||p.error?.message||'')+'</div>';return;}
    const bookings=b.data||[], interests=i.data||[], profiles=p.data||[];
    const pmap={};profiles.forEach(x=>pmap[x.id]=x);
    const customerIds=[...new Set([...bookings,...interests].map(x=>x.customer_id).filter(Boolean))];
    let cm={};
    if(customerIds.length){const c=await sb.from('profiles').select('id,full_name,username,location,role,status').in('id',customerIds);if(c.error){host.innerHTML='<div class="msg error">'+esc(c.error.message)+'</div>';return;} (c.data||[]).forEach(x=>cm[x.id]=x);}
    const all=[...bookings.map(x=>({...x,request_type:'Booking'})),...interests.map(x=>({...x,request_type:'Interest'}))].sort((a,z)=>new Date(z.created_at)-new Date(a.created_at));
    const countB=bookings.length,countI=interests.length;
    let h='<div class="cards" style="margin-top:12px"><div class="stat"><span class="muted">NEW BOOKINGS</span><b>'+countB+'</b></div><div class="stat"><span class="muted">NEW INTERESTS</span><b>'+countI+'</b></div><div class="stat"><span class="muted">TOTAL PENDING</span><b>'+all.length+'</b></div></div>';
    h+='<div class="notice"><b>🚨 Priority queue</b><br>New Premium customer booking and interest requests appear here first. This is a <b>VIEW-ONLY staff queue</b>. Staff/Admin cannot accept or decline requests; the Premium Profile Owner responds from the Owner Dashboard.</div>';
    if(!all.length){h+='<div class="empty">No pending Premium customer requests right now.</div>';host.innerHTML=h;return;}
    h+='<div class="table-wrap"><table class="table" style="min-width:1100px"><thead><tr><th>New Request</th><th>Customer</th><th>Premium Profile</th><th>Requested Time</th><th>Message</th><th>Action</th></tr></thead><tbody>';
    all.forEach(r=>{const c=cm[r.customer_id]||{},pr=pmap[r.premium_profile_id]||{};h+='<tr><td><span class="pill '+(r.request_type==='Booking'?'blue':'')+'">'+esc(r.request_type.toUpperCase())+'</span><br><b>'+esc(ago(r.created_at))+'</b><br><span class="muted">'+esc(new Date(r.created_at).toLocaleString('en-KE'))+'</span></td><td><b>'+esc(c.username||c.full_name||'Customer')+'</b><br>'+esc(c.full_name||'')+'<br><span class="muted">'+esc(c.location||'')+'</span></td><td><b>'+esc(pr.username||'Premium Profile')+'</b><br><span class="muted">'+esc(pr.location||'')+' · '+esc(pr.availability||'')+'</span></td><td>'+esc(r.request_type==='Booking'?(r.requested_date||'—')+' '+(r.requested_time||''):'Interest request')+'</td><td>'+esc(r.message||'—')+'</td><td><button class="blue" data-premium-request-view="'+esc(r.id)+'" data-request-type="'+esc(r.request_type.toLowerCase())+'">VIEW REQUEST</button></td></tr>';});
    h+='</tbody></table></div>';
    h+='<div class="muted" style="margin-top:10px">Auto-refresh: every 15 seconds while the Premium page is open.</div>';
    host.innerHTML=h;
    host.querySelectorAll('[data-premium-request-view]').forEach(btn=>btn.onclick=()=>viewRequest(btn.dataset.premiumRequestView,btn.dataset.requestType));
  }
  async function viewRequest(id,type){
    const table=type==='booking'?'premium_profile_bookings':'premium_profile_interests';
    const q=await sb.from(table).select('*').eq('id',id).maybeSingle();
    if(q.error||!q.data){alert(q.error?.message||'Request not found.');return;}
    const r=q.data;
    const [c,pr]=await Promise.all([
      sb.from('profiles').select('full_name,username,location,status').eq('id',r.customer_id).maybeSingle(),
      sb.from('premium_profiles').select('username,location,availability,approved').eq('id',r.premium_profile_id).maybeSingle()
    ]);
    const title=type==='booking'?'Premium Booking Request':'Premium Interest Request';
    let h='<div class="notice"><b>VIEW ONLY</b><br>Staff/Admin cannot accept or decline this request. The Premium Profile Owner handles the response.</div><div class="detail">';
    h+='<div><b>Request Type</b>'+esc(title)+'</div><div><b>Received</b>'+esc(r.created_at?new Date(r.created_at).toLocaleString('en-KE'):'—')+'</div>';
    h+='<div><b>Customer</b>'+esc(c.data?.username||c.data?.full_name||'Customer')+'<br>'+esc(c.data?.full_name||'')+'</div><div><b>Customer Location</b>'+esc(c.data?.location||'—')+'</div>';
    h+='<div><b>Premium Profile</b>'+esc(pr.data?.username||'—')+'</div><div><b>Profile Location / Availability</b>'+esc(pr.data?.location||'—')+' · '+esc(pr.data?.availability||'—')+'</div>';
    if(type==='booking')h+='<div><b>Requested Date</b>'+esc(r.requested_date||'—')+'</div><div><b>Requested Time</b>'+esc(r.requested_time||'—')+'</div>';
    h+='<div><b>Message</b>'+esc(r.message||'—')+'</div><div><b>Status</b>'+esc(r.status||'pending')+'</div></div>';
    const m=$('modal'),t=$('modalTitle'),body=$('modalBody');if(m&&t&&body){t.textContent=title;t.textContent+=' — VIEW ONLY';body.innerHTML=h;m.classList.remove('hidden');}
  }
  function init(){
    const area=$('premiumArea');if(!area)return;
    if($('premiumCustomerRequestsCard')){load();return;}
    const card=document.createElement('div');card.id='premiumCustomerRequestsCard';card.className='card';
    card.style.cssText='margin-bottom:16px;border:2px solid #ff7a00;box-shadow:0 8px 28px #ff7a0015;';
    card.innerHTML='<div class="toolbar"><div><h2 style="margin:0">🚨 Premium Customer Requests — PRIORITY</h2><div class="muted">Incoming booking and interest requests for Premium Profiles. View only — no staff approval/rejection.</div></div><button class="orange" id="refreshPremiumCustomerRequests">↻ CHECK NOW</button></div><div id="premiumCustomerRequestsArea" style="margin-top:12px"></div>';
    area.insertBefore(card,area.firstChild);$('refreshPremiumCustomerRequests').onclick=load;load();
    if(timer)clearInterval(timer);timer=setInterval(()=>{if($('page-premium')?.classList.contains('active'))load()},15000);
  }
  window.initPremiumCustomerRequests=init;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0));else setTimeout(init,0);
})();