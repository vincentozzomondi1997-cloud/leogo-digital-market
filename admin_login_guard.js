(function(){
  function loadSupabase(done){
    if(window.supabase&&window.supabase.createClient){done();return;}
    var s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload=done;
    s.onerror=function(){var m=document.getElementById('loginMsg');if(m)m.innerHTML='<div class="msg error">Could not load the authentication service. Please refresh and try again.</div>';};
    document.head.appendChild(s);
  }
  function getSB(){return window.__leogoAdminSB||(window.__leogoAdminSB=window.supabase.createClient('https://twpiloiiigdghwcdjbnj.supabase.co','sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX'));}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];});}
  function money(v){return 'KSh '+Number(v||0).toLocaleString();}
  function setActive(prefix,value,values){values.forEach(function(x){var b=document.getElementById(prefix+x);if(b)b.classList.toggle('active',x===value);});}
  function installLogin(){
    var btn=document.getElementById('loginBtn');
    if(!btn||typeof window.login==='function')return;
    window.login=async function(){
      var email=(document.getElementById('email')||{}).value||'';
      var password=(document.getElementById('password')||{}).value||'';
      var msg=document.getElementById('loginMsg');btn.disabled=true;btn.textContent='SIGNING IN…';
      loadSupabase(async function(){try{
        var sb=getSB();var r=await sb.auth.signInWithPassword({email:email.trim(),password:password});
        if(r.error){msg.innerHTML='<div class="msg error">'+esc(r.error.message||'Sign in failed.')+'</div>';btn.disabled=false;btn.textContent='SIGN IN';return;}
        var u=r.data&&r.data.user;if(!u){msg.innerHTML='<div class="msg error">Sign in did not return an account.</div>';btn.disabled=false;btn.textContent='SIGN IN';return;}
        var q=await sb.from('profiles').select('id,full_name,email,role,status').eq('id',u.id).maybeSingle();
        if(q.error||!q.data){await sb.auth.signOut();msg.innerHTML='<div class="msg error">LEOGO admin profile could not be loaded.</div>';btn.disabled=false;btn.textContent='SIGN IN';return;}
        var role=String(q.data.role||'').toLowerCase();if(['admin','manager','supervisor','staff'].indexOf(role)<0){await sb.auth.signOut();msg.innerHTML='<div class="msg error">Access denied. This account is not authorized for the Admin Control Center.</div>';btn.disabled=false;btn.textContent='SIGN IN';return;}
        var login=document.getElementById('login'),shell=document.getElementById('shell');if(login)login.classList.add('hidden');if(shell)shell.classList.remove('hidden');var n=document.getElementById('adminName');if(n)n.textContent=(q.data.full_name||'Admin')+' · '+role;
        if(typeof window.go==='function')window.go('dashboard');else if(document.getElementById('page-dashboard'))document.getElementById('page-dashboard').classList.add('active');btn.disabled=false;btn.textContent='SIGN IN';
      }catch(e){console.error(e);msg.innerHTML='<div class="msg error">Admin sign-in error: '+esc(e.message||e)+'</div>';btn.disabled=false;btn.textContent='SIGN IN';}});
    };
  }
  function installNavigationFallback(){
    if(typeof window.go==='function')return;
    window.go=function(page){var target=document.getElementById('page-'+page);if(!target)return;document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});target.classList.add('active');document.querySelectorAll('.nav button[data-page]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-page')===page);});var side=document.getElementById('side');if(side)side.classList.remove('open');var loaders={dashboard:'loadDashboard',products:'loadProducts',sellers:'loadSellers',orders:'loadOrders',customers:'loadCustomers',premium:'loadPremium',services:'loadServices',transport:'loadTransport',staff:'loadStaff',delivery:'loadDelivery',settings:'loadSettings',system:'loadSystem'};var fn=loaders[page];if(fn&&typeof window[fn]==='function'){try{window[fn]();}catch(e){console.error(e);}}window.scrollTo(0,0);};
  }
  function installManagementFallbacks(){
    if(typeof window.setProductFilter!=='function'){
      window.__leogoProductFilter='pending';
      window.setProductFilter=function(f){window.__leogoProductFilter=f;setActive('pf-',f,['pending','approved','rejected','all']);if(typeof window.loadProducts==='function')window.loadProducts();};
    }
    if(typeof window.loadProducts!=='function'){
      window.loadProducts=async function(){var a=document.getElementById('productsArea');if(!a)return;a.innerHTML='<div class="empty">Loading products…</div>';var q=await getSB().from('products').select('id,seller_id,name,category,description,price,stock_qty,image_url,available,approved,approval_status,created_at,sellers(business_name,owner_name,email,status)').order('created_at',{ascending:false});if(q.error){a.innerHTML='<div class="msg error">Could not load products: '+esc(q.error.message)+'</div>';return;}window.__leogoProducts=q.data||[];renderProductFallback();};
    }
    function renderProductFallback(){var a=document.getElementById('productsArea');if(!a)return;var f=window.__leogoProductFilter||'pending',data=window.__leogoProducts||[];var list=f==='all'?data:data.filter(function(p){return String(p.approval_status||(p.approved?'approved':'pending')).toLowerCase()===f;});if(!list.length){a.innerHTML='<div class="empty">No '+esc(f)+' products found.</div>';return;}a.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>Seller</th><th>Category</th><th>Price</th><th>Stock</th><th>Available</th><th>Approval</th></tr></thead><tbody>'+list.map(function(p){var s=Array.isArray(p.sellers)?p.sellers[0]:p.sellers;var ap=p.approval_status||(p.approved?'approved':'pending');return '<tr><td><b>'+esc(p.name)+'</b><br><span class="muted">'+esc((p.description||'').slice(0,70))+'</span></td><td><b>'+esc(s&&s.business_name||'Unknown seller')+'</b><br>'+esc(s&&s.owner_name||'')+'</td><td>'+esc(p.category)+'</td><td>'+money(p.price)+'</td><td>'+esc(p.stock_qty||0)+'</td><td>'+esc(p.available?'Available':'Unavailable')+'</td><td>'+esc(ap)+'</td></tr>';}).join('')+'</tbody></table></div>';}
    if(typeof window.setSellerFilter!=='function){window.__leogoSellerFilter='pending';window.setSellerFilter=function(f){window.__leogoSellerFilter=f;setActive('sf-',f,['pending','active','suspended','all']);if(typeof window.loadSellers==='function')window.loadSellers();};}
    if(typeof window.loadSellers!=='function){window.loadSellers=async function(){var a=document.getElementById('sellersArea');if(!a)return;a.innerHTML='<div class="empty">Loading sellers…</div>';var q=await getSB().from('sellers').select('*').order('created_at',{ascending:false});if(q.error){a.innerHTML='<div class="msg error">Could not load sellers: '+esc(q.error.message)+'</div>';return;}window.__leogoSellers=q.data||[];renderSellerFallback();};}
    function renderSellerFallback(){var a=document.getElementById('sellersArea');if(!a)return;var f=window.__leogoSellerFilter||'pending',data=window.__leogoSellers||[];var list=f==='all'?data:data.filter(function(s){return String(s.status||'').toLowerCase()===f;});if(!list.length){a.innerHTML='<div class="empty">No '+esc(f)+' sellers found.</div>';return;}a.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>Business</th><th>Owner</th><th>Contact</th><th>Category</th><th>Status</th><th>Verification</th></tr></thead><tbody>'+list.map(function(s){return '<tr><td><b>'+esc(s.business_name)+'</b><br>'+esc(s.location||'')+'</td><td>'+esc(s.owner_name)+'</td><td>'+esc(s.phone||'')+'<br>'+esc(s.email||'')+'</td><td>'+esc(s.category||'')+'</td><td>'+esc(s.status||'')+'</td><td>'+esc(s.verification_status||'')+'</td></tr>';}).join('')+'</tbody></table></div>';}
    if(typeof window.setOrderFilter!=='function){window.__leogoOrderFilter='open';window.setOrderFilter=function(f){window.__leogoOrderFilter=f;setActive('of-',f,['open','delivered','cancelled','all']);if(typeof window.loadOrders==='function')window.loadOrders();};}
    if(typeof window.loadOrders!=='function){window.loadOrders=async function(){var a=document.getElementById('ordersArea');if(!a)return;a.innerHTML='<div class="empty">Loading orders…</div>';var q=await getSB().from('orders').select('*').order('created_at',{ascending:false}).limit(300);if(q.error){a.innerHTML='<div class="msg error">Could not load orders: '+esc(q.error.message)+'</div>';return;}window.__leogoOrders=q.data||[];renderOrderFallback();};}
    function renderOrderFallback(){var a=document.getElementById('ordersArea');if(!a)return;var f=window.__leogoOrderFilter||'open',data=window.__leogoOrders||[];var list=data.filter(function(o){var s=String(o.status||'').toLowerCase();return f==='all'?true:f==='delivered'?s==='delivered':f==='cancelled'?s==='cancelled':s!=='delivered'&&s!=='cancelled';});if(!list.length){a.innerHTML='<div class="empty">No '+esc(f)+' orders found.</div>';return;}a.innerHTML='<div class="table-wrap"><table class="table"><thead><tr><th>Order</th><th>Customer</th><th>Delivery</th><th>Total</th><th>Status</th></tr></thead><tbody>'+list.map(function(o){return '<tr><td>#'+esc(String(o.id).slice(0,8))+'</td><td>'+esc(o.receiver_name||'')+'<br>'+esc(o.receiver_phone||'')+'</td><td>'+esc(o.delivery_location||'')+'</td><td>'+money(o.total_amount)+'</td><td>'+esc(o.status||'Order Placed')+'</td></tr>';}).join('')+'</tbody></table></div>';}
  }
  function boot(){installLogin();installNavigationFallback();installManagementFallbacks();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  var timer=setInterval(function(){boot();if(typeof window.login==='function'&&typeof window.go==='function')clearInterval(timer);},100);
})();
