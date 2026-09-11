(function(){
  'use strict';
  function getSB(){return window.__leogoAdminSB||(window.__leogoAdminSB=window.supabase.createClient('https://twpiloiiigdghwcdjbnj.supabase.co','sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX'));}
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m];});}
  function money(v){return 'KSh '+Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2});}
  function pill(text,cls){return '<span class="pill '+(cls||'')+'">'+esc(text)+'</span>';}
  function fmtDate(v){return v?new Date(v).toLocaleString():'—';}
  function statusClass(s){s=String(s||'').toLowerCase();return s==='paid'||s==='active'?'green':s==='rejected'||s==='expired'?'red':s==='pending'?'':'blue';}
  function getArea(){return document.getElementById('premiumArea');}

  async function loadPremiumAdmin(){
    var a=getArea();if(!a)return;
    a.innerHTML='<div class="empty">Loading Premium management…</div>';
    var sb=getSB();
    var [payments, members, pricing, profiles]=await Promise.all([
      sb.from('premium_payments').select('*').order('created_at',{ascending:false}).limit(200),
      sb.from('premium_memberships').select('*').order('created_at',{ascending:false}).limit(200),
      sb.from('premium_pricing').select('id,plan_code,plan_name,price,duration_days,is_active,updated_at').order('plan_code'),
      sb.from('premium_profiles').select('id,user_id,username,location,verified,approved,created_at').order('created_at',{ascending:false}).limit(200)
    ]);
    if(payments.error){a.innerHTML='<div class="msg error">Could not load Premium payments: '+esc(payments.error.message)+'</div>';return;}
    if(members.error){a.innerHTML='<div class="msg error">Could not load Premium memberships: '+esc(members.error.message)+'</div>';return;}
    if(pricing.error){a.innerHTML='<div class="msg error">Could not load Premium pricing: '+esc(pricing.error.message)+'</div>';return;}
    if(profiles.error){a.innerHTML='<div class="msg error">Could not load Premium profiles: '+esc(profiles.error.message)+'</div>';return;}

    var pay=payments.data||[],mem=members.data||[],plans=pricing.data||[],prof=profiles.data||[];
    var userIds=Array.from(new Set(pay.map(function(x){return x.user_id;}).concat(mem.map(function(x){return x.user_id;})).filter(Boolean)));
    var userMap={};
    if(userIds.length){
      var uq=await sb.from('profiles').select('id,full_name,username,email,phone').in('id',userIds);
      if(!uq.error)(uq.data||[]).forEach(function(u){userMap[u.id]=u;});
    }

    var pending=pay.filter(function(x){return String(x.status).toLowerCase()==='pending';}).length;
    var active=mem.filter(function(x){return String(x.status).toLowerCase()==='active' && (!x.expires_at || new Date(x.expires_at)>new Date());}).length;

    var html='';
    html+='<div class="grid2">';
    html+='<div class="card"><div class="toolbar"><div><h3 style="margin:0">Premium Payments</h3><div class="muted">Verify M-Pesa references before activating membership.</div></div><div class="actions"><button class="light" onclick="loadPremium()">↻ REFRESH</button></div></div>';
    html+='<div class="cards" style="grid-template-columns:repeat(2,minmax(0,1fr));margin-top:12px;margin-bottom:0"><div class="stat"><span class="muted">Pending Payments</span><b>'+pending+'</b></div><div class="stat"><span class="muted">Active Memberships</span><b>'+active+'</b></div></div>';
    html+='<div class="table-wrap"><table class="table"><thead><tr><th>Customer</th><th>Plan</th><th>Amount</th><th>M-Pesa Reference</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    if(!pay.length){html+='<tr><td colspan="7"><div class="empty">No Premium payments found.</div></td></tr>';}
    else pay.forEach(function(p){
      var u=userMap[p.user_id]||{},m=mem.find(function(x){return x.id===p.membership_id;});
      var isPending=String(p.status).toLowerCase()==='pending';
      html+='<tr><td><b>'+esc(u.full_name||u.username||'Customer')+'</b><br><span class="muted">'+esc(u.email||u.phone||'')+'</span></td>';
      html+='<td>'+esc(m&&m.plan_name||p.plan_name||'Premium')+'<br><span class="muted">'+esc(m&&m.plan_code||'')+'</span></td>';
      html+='<td><b>'+money(p.amount)+'</b></td><td><b>'+esc(p.reference)+'</b></td><td>'+fmtDate(p.created_at)+'</td><td>'+pill(p.status,statusClass(p.status))+'</td><td>';
      if(isPending) html+='<div class="actions"><button class="approve" onclick="reviewPremiumPayment(\''+p.id+'\',\'paid\')">APPROVE & ACTIVATE</button><button class="danger" onclick="reviewPremiumPayment(\''+p.id+'\',\'rejected\')">REJECT</button></div>';
      else html+='<span class="muted">Reviewed</span>';
      html+='</td></tr>';
    });
    html+='</tbody></table></div></div>';

    html+='<div class="card"><div class="toolbar"><div><h3 style="margin:0">Premium Pricing</h3><div class="muted">Change the customer-facing price without changing the plan duration.</div></div></div>';
    if(!plans.length) html+='<div class="empty">No active Premium pricing found.</div>';
    else plans.forEach(function(x){
      var duration=Number(x.duration_days||0),label=x.plan_code==='one_time'?'24 hours':duration===30?'30 days':duration+' days';
      html+='<div class="setting-row"><div><b>'+esc(x.plan_name)+'</b><div class="muted">'+esc(label)+' · '+(x.is_active?'Active':'Inactive')+' · Updated '+fmtDate(x.updated_at)+'</div></div><div style="display:flex;gap:6px;align-items:center;min-width:180px"><input id="premium-price-'+esc(x.plan_code)+'" type="number" min="0" step="0.01" value="'+esc(x.price)+'" style="width:125px"><button class="orange" onclick="updatePremiumPrice(\''+x.plan_code+'\')">SAVE</button></div></div>';
    });
    html+='</div></div>';

    html+='<div class="card"><div class="toolbar"><div><h3 style="margin:0">Memberships</h3><div class="muted">One-time access expires after 24 hours; monthly access expires after 30 days.</div></div></div>';
    html+='<div class="table-wrap"><table class="table"><thead><tr><th>Customer</th><th>Plan</th><th>Price</th><th>Status</th><th>Starts</th><th>Expires</th></tr></thead><tbody>';
    if(!mem.length) html+='<tr><td colspan="6"><div class="empty">No Premium memberships found.</div></td></tr>';
    else mem.forEach(function(m){
      var u=userMap[m.user_id]||{},expired=m.expires_at && new Date(m.expires_at)<=new Date(),shownStatus=expired&&m.status==='active'?'expired':m.status;
      html+='<tr><td><b>'+esc(u.full_name||u.username||'Customer')+'</b><br><span class="muted">'+esc(u.email||u.phone||'')+'</span></td><td>'+esc(m.plan_name||m.plan_code)+'</td><td>'+money(m.price)+'</td><td>'+pill(shownStatus,statusClass(shownStatus))+'</td><td>'+fmtDate(m.starts_at)+'</td><td>'+fmtDate(m.expires_at)+'</td></tr>';
    });
    html+='</tbody></table></div></div>';

    html+='<div class="card"><div class="toolbar"><div><h3 style="margin:0">Premium Profiles</h3><div class="muted">Profile approval and verification remain separate from payment activation.</div></div></div>';
    html+='<div class="table-wrap"><table class="table"><thead><tr><th>Profile</th><th>Location</th><th>Verified</th><th>Approved</th></tr></thead><tbody>';
    if(!prof.length) html+='<tr><td colspan="4"><div class="empty">No Premium profiles found.</div></td></tr>';
    else prof.forEach(function(p){html+='<tr><td><b>'+esc(p.username||'')+'</b></td><td>'+esc(p.location||'')+'</td><td>'+pill(p.verified?'Verified':'Not verified',p.verified?'green':'red')+'</td><td>'+pill(p.approved?'Approved':'Pending',p.approved?'green':'')+'</td></tr>';});
    html+='</tbody></table></div></div>';
    a.innerHTML=html;
  }

  window.loadPremium=loadPremiumAdmin;
  window.reviewPremiumPayment=async function(paymentId,decision){
    var action=decision==='paid'?'approve and activate this Premium payment':'reject this Premium payment';
    if(!confirm('Are you sure you want to '+action+'?'))return;
    var sb=getSB();
    var q=await sb.rpc('admin_review_premium_payment',{p_payment_id:paymentId,p_decision:decision});
    if(q.error){alert('Premium payment review failed: '+q.error.message);return;}
    alert(decision==='paid'?'Payment approved. Premium membership is now active.':'Payment rejected.');
    await loadPremiumAdmin();
  };
  window.updatePremiumPrice=async function(planCode){
    var input=document.getElementById('premium-price-'+planCode);if(!input)return;
    var price=Number(input.value);
    if(!Number.isFinite(price)||price<0){alert('Enter a valid non-negative price.');return;}
    if(!confirm('Save '+planCode+' Premium price as KSh '+price.toLocaleString()+'?'))return;
    var sb=getSB();
    var q=await sb.rpc('admin_update_premium_price',{p_plan_code:planCode,p_price:price});
    if(q.error){alert('Premium price update failed: '+q.error.message);return;}
    alert('Premium price updated successfully.');
    await loadPremiumAdmin();
  };

  function installPremiumNavigation(){
    var page=document.getElementById('page-premium');
    if(!page||page.__premiumObserverInstalled)return;
    page.__premiumObserverInstalled=true;
    var observer=new MutationObserver(function(){
      if(page.classList.contains('active'))loadPremiumAdmin();
    });
    observer.observe(page,{attributes:true,attributeFilter:['class']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installPremiumNavigation);else installPremiumNavigation();
})();
