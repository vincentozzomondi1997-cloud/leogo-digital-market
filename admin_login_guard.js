(function(){
  function loadSupabase(done){
    if(window.supabase&&window.supabase.createClient){done();return;}
    var s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload=done;
    s.onerror=function(){var m=document.getElementById('loginMsg');if(m)m.innerHTML='<div class="msg error">Could not load the authentication service. Please refresh and try again.</div>';};
    document.head.appendChild(s);
  }
  function install(){
    if(typeof window.login==='function') return;
    var btn=document.getElementById('loginBtn');
    if(!btn) return;
    window.login=async function(){
      var email=(document.getElementById('email')||{}).value||'';
      var password=(document.getElementById('password')||{}).value||'';
      var msg=document.getElementById('loginMsg');
      btn.disabled=true;btn.textContent='SIGNING IN…';
      loadSupabase(async function(){
        try{
          var sb=window.__leogoAdminSB||(window.__leogoAdminSB=window.supabase.createClient('https://twpiloiiigdghwcdjbnj.supabase.co','sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX'));
          var r=await sb.auth.signInWithPassword({email:email.trim(),password:password});
          if(r.error){msg.innerHTML='<div class="msg error">'+String(r.error.message||'Sign in failed.')+'</div>';btn.disabled=false;btn.textContent='SIGN IN';return;}
          var u=r.data&&r.data.user;
          if(!u){msg.innerHTML='<div class="msg error">Sign in did not return an account.</div>';btn.disabled=false;btn.textContent='SIGN IN';return;}
          var q=await sb.from('profiles').select('id,full_name,email,role,status').eq('id',u.id).maybeSingle();
          if(q.error||!q.data){await sb.auth.signOut();msg.innerHTML='<div class="msg error">LEOGO admin profile could not be loaded.</div>';btn.disabled=false;btn.textContent='SIGN IN';return;}
          var role=String(q.data.role||'').toLowerCase();
          if(['admin','manager','supervisor','staff'].indexOf(role)<0){await sb.auth.signOut();msg.innerHTML='<div class="msg error">Access denied. This account is not authorized for the Admin Control Center.</div>';btn.disabled=false;btn.textContent='SIGN IN';return;}
          var login=document.getElementById('login'),shell=document.getElementById('shell');
          if(login)login.classList.add('hidden');
          if(shell)shell.classList.remove('hidden');
          var n=document.getElementById('adminName');if(n)n.textContent=(q.data.full_name||'Admin')+' · '+role;
          if(typeof window.go==='function')window.go('dashboard');
          else if(document.getElementById('page-dashboard'))document.getElementById('page-dashboard').classList.add('active');
          btn.disabled=false;btn.textContent='SIGN IN';
        }catch(e){console.error(e);msg.innerHTML='<div class="msg error">Admin sign-in error: '+String(e.message||e)+'</div>';btn.disabled=false;btn.textContent='SIGN IN';}
      });
    };
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();
// LEOGO admin login recovery guard: force workflow to inject this script into admin.html.

// LEOGO ORDER MANAGEMENT V2 — installed through the existing admin login guard.
function installLeogoOrderPatch(){
  if(window.__leogoAdminOrderPatchInstalled)return;
  if(typeof window.loadOrders!=='function' || !document.getElementById('ordersArea') || !window.supabase)return;
  window.__leogoAdminOrderPatchInstalled=true;
  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  let adb=null, filter='open', riders=[];
  const esc2=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money2=v=>'KSh '+Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});
  const pill2=(v,c='')=>'<span class="pill '+c+'">'+esc2(v)+'</span>';
  const statuses=['Order Placed','Confirmed','Preparing','Ready for Pickup','Out for Delivery','Delivered','Cancelled'];
  const roleNames=['rider','driver','delivery','delivery_rider','logistics','transport'];
  async function client(){
    if(!adb&&window.supabase)adb=window.supabase.createClient(URL,KEY);
    return adb;
  }
  async function loadRiders(){
    const s=await client(); if(!s)return;
    const q=await s.from('profiles').select('id,full_name,phone,email,role,status').order('full_name');
    riders=q.error?[]:(q.data||[]).filter(x=>x.status==='active'&&roleNames.includes(String(x.role||'').toLowerCase()));
  }
  window.setOrderFilter=function(f){filter=f;['open','delivered','cancelled','all'].forEach(x=>{const b=document.getElementById('of-'+x);if(b)b.classList.toggle('active',x===f)});window.renderOrders();};
  window.loadOrders=async function(){
    const a=document.getElementById('ordersArea'); if(!a)return;
    const s=await client(); if(!s){a.innerHTML='<div class="msg error">Supabase is not ready. Refresh the page.</div>';return;}
    a.innerHTML='<div class="empty">Loading customer orders…</div>';
    await loadRiders();
    const q=await s.from('orders').select('*').order('created_at',{ascending:false}).limit(300);
    if(q.error){a.innerHTML='<div class="msg error">Could not load customer orders: '+esc2(q.error.message)+'</div>';return;}
    window.__leogoOrders=q.data||[];window.renderOrders();
  };
  window.renderOrders=function(){
    const a=document.getElementById('ordersArea');if(!a)return;
    const orders=window.__leogoOrders||[];
    const list=orders.filter(o=>filter==='all'?true:filter==='delivered'?String(o.status||'').toLowerCase()==='delivered':filter==='cancelled'?String(o.status||'').toLowerCase()==='cancelled':!['delivered','cancelled'].includes(String(o.status||'').toLowerCase()));
    if(!list.length){a.innerHTML='<div class="empty">No '+esc2(filter)+' customer orders found.</div>';return;}
    a.innerHTML='<div class="notice"><b>Order Management</b><br>Review customer orders, send delivery quotes when requested, assign riders/drivers, and update delivery status.</div><div class="table-wrap"><table class="table"><thead><tr><th>Order</th><th>Customer</th><th>Delivery</th><th>Total</th><th>Pricing</th><th>Rider</th><th>Status / Action</th></tr></thead><tbody>'+list.map(o=>{const r=riders.find(x=>x.id===o.assigned_rider_id);const requested=String(o.delivery_pricing_status||'fixed')==='requested';const st=o.status||'Order Placed';return '<tr><td><b>#'+esc2(String(o.id).slice(0,8))+'</b><br><span class="muted">'+new Date(o.created_at).toLocaleString()+'</span></td><td><b>'+esc2(o.receiver_name)+'</b><br>'+esc2(o.receiver_phone)+'</td><td>'+esc2(o.delivery_location)+'</td><td><b>'+money2(o.total_amount)+'</b><br><span class="muted">Delivery '+money2(o.delivery_fee)+'</span></td><td>'+pill2(o.delivery_pricing_status||'fixed',requested?'':'green')+(requested?'<br><button class="orange" style="margin-top:5px" onclick="viewOrder(\''+o.id+'\')">SEND QUOTE</button>':'')+'</td><td>'+esc2(r?.full_name||'Unassigned')+'</td><td><select onchange="updateOrderStatus(\''+o.id+'\',this.value)">'+statuses.map(x=>'<option '+(x===st?'selected':'')+'>'+esc2(x)+'</option>').join('')+'</select><br><button class="light" style="margin-top:5px" onclick="viewOrder(\''+o.id+'\')">VIEW / MANAGE</button></td></tr>'}).join('')+'</tbody></table></div>';
  };
  window.updateOrderStatus=async function(id,status){
    const s=await client();const o=(window.__leogoOrders||[]).find(x=>x.id===id);if(!s||!o)return;
    if(status==='Delivered'&&!o.assigned_rider_id&&!confirm('No rider is assigned. Mark this order Delivered anyway?'))return;
    const q=await s.from('orders').update({status,updated_at:new Date().toISOString()}).eq('id',id);
    if(q.error){alert(q.error.message);return;}
    const u=await s.auth.getUser();if(u.data?.user?.id)await s.from('order_status_history').insert({order_id:id,status,changed_by:u.data.user.id,notes:'Updated from LEOGO Admin Control Center'});
    await loadOrders();
  };
  window.assignOrderRider=async function(id,riderId){
    const s=await client();if(!s)return;const q=await s.from('orders').update({assigned_rider_id:riderId||null,updated_at:new Date().toISOString()}).eq('id',id);if(q.error){alert(q.error.message);return;}await loadOrders();await viewOrder(id);
  };
  window.saveOrderDelivery=async function(id){
    const s=await client();const o=(window.__leogoOrders||[]).find(x=>x.id===id);if(!s||!o)return;
    const fee=Number(document.getElementById('orderDeliveryFee')?.value);if(!Number.isFinite(fee)||fee<0){alert('Enter a valid delivery fee.');return;}
    const status=document.getElementById('orderPricingStatus')?.value||'quoted';
    const total=Number(o.subtotal||0)+Number(o.service_fee||0)+fee+Number(o.other_charges||0);
    const payload={delivery_fee:fee,total_amount:total,delivery_pricing_status:status,delivery_pricing_note:(document.getElementById('orderPricingNote')?.value||'').trim()||null,delivery_estimate:(document.getElementById('orderDeliveryEstimate')?.value||'').trim()||null,updated_at:new Date().toISOString()};
    const q=await s.from('orders').update(payload).eq('id',id);if(q.error){alert('Delivery pricing update failed: '+q.error.message);return;}
    Object.assign(o,payload);alert('Delivery fee updated to '+money2(fee)+'. New customer total: '+money2(total));await loadOrders();await viewOrder(id);
  };
  window.viewOrder=async function(id){
    const s=await client();const o=(window.__leogoOrders||[]).find(x=>x.id===id);if(!s||!o)return;await loadRiders();
    const [items,history]=await Promise.all([s.from('order_items').select('*').eq('order_id',id),s.from('order_status_history').select('status,notes,created_at').eq('order_id',id).order('created_at',{ascending:false}).limit(20)]);
    const riderOpts='<option value="">— Not assigned —</option>'+riders.map(r=>'<option value="'+esc2(r.id)+'" '+(r.id===o.assigned_rider_id?'selected':'')+'>'+esc2(r.full_name)+' · '+esc2(r.role)+(r.phone?' · '+esc2(r.phone):'')+'</option>').join('');
    const itemHtml=(items.data||[]).map(i=>'<div class="setting-row"><div><b>'+esc2(i.product_name)+'</b><div class="muted">Qty '+esc2(i.quantity)+'</div></div><b>'+money2(i.line_total)+'</b></div>').join('');
    const histHtml=(history.data||[]).map(h=>'<div class="setting-row"><div><b>'+esc2(h.status)+'</b><div class="muted">'+esc2(h.notes||'')+'</div></div><span class="muted">'+new Date(h.created_at).toLocaleString()+'</span></div>').join('');
    document.getElementById('modalTitle').textContent='Customer Order #'+String(id).slice(0,8);
    document.getElementById('modalBody').innerHTML='<div class="detail"><div><b>Customer</b>'+esc2(o.receiver_name)+'</div><div><b>Phone</b>'+esc2(o.receiver_phone)+'</div><div><b>Location</b>'+esc2(o.delivery_location)+'</div><div><b>Landmark</b>'+esc2(o.landmark)+'</div><div><b>Payment</b>'+esc2(o.payment_method)+' / '+esc2(o.payment_status||'pending')+'</div><div><b>Status</b>'+esc2(o.status)+'</div><div><b>Subtotal</b>'+money2(o.subtotal)+'</div><div><b>Service Fee</b>'+money2(o.service_fee)+'</div><div><b>Delivery Fee</b>'+money2(o.delivery_fee)+'</div><div><b>Total</b><b>'+money2(o.total_amount)+'</b></div></div><div class="card" style="margin-top:14px"><h3 style="margin-top:0">Delivery Pricing</h3><div class="field"><label>Delivery Fee (KSh)</label><input id="orderDeliveryFee" type="number" min="0" step="1" value="'+esc2(o.delivery_fee??0)+'"></div><div class="field"><label>Pricing Status</label><select id="orderPricingStatus"><option value="fixed" '+(o.delivery_pricing_status==='fixed'?'selected':'')+'>Fixed</option><option value="requested" '+(o.delivery_pricing_status==='requested'?'selected':'')+'>Customer Requested Quote</option><option value="quoted" '+(o.delivery_pricing_status==='quoted'?'selected':'')+'>Quote Sent to Customer</option></select></div><div class="field"><label>Message / Pricing Note</label><textarea id="orderPricingNote" placeholder="e.g. Delivery to Ugunja is KSh 250.">'+esc2(o.delivery_pricing_note||'')+'</textarea></div><div class="field"><label>Delivery Estimate</label><input id="orderDeliveryEstimate" value="'+esc2(o.delivery_estimate||'')+'" placeholder="e.g. Today 3:00–5:00 PM"></div><button class="orange" onclick="saveOrderDelivery(\''+id+'\')">SEND / SAVE DELIVERY FEE</button></div><div class="card" style="margin-top:14px"><h3 style="margin-top:0">Assign Rider / Driver</h3><select onchange="assignOrderRider(\''+id+'\',this.value)">'+riderOpts+'</select>'+(riders.length?'':'<div class="notice" style="margin-top:10px">No active rider/driver profiles are currently available. Add a profile with role rider, driver or delivery.</div>')+'</div><div class="card" style="margin-top:14px"><h3 style="margin-top:0">Items</h3>'+(itemHtml||'<div class="muted">No order items found.</div>')+'</div><div class="card" style="margin-top:14px"><h3 style="margin-top:0">Status</h3><div class="actions">'+statuses.map(x=>'<button class="'+(x===o.status?'orange':'light')+'" onclick="updateOrderStatus(\''+id+'\',\''+x+'\');setTimeout(()=>viewOrder(\''+id+'\'),500)">'+esc2(x)+'</button>').join('')+'</div></div><div class="card" style="margin-top:14px"><h3 style="margin-top:0">Status History</h3>'+(histHtml||'<div class="muted">No status history yet.</div>')+'</div>';
    document.getElementById('modal').classList.remove('hidden');
  };
}
const __leogoOrderTimer=setInterval(()=>{if(window.__leogoAdminOrderPatchInstalled){clearInterval(__leogoOrderTimer);return;}installLeogoOrderPatch();},100);
installLeogoOrderPatch();
