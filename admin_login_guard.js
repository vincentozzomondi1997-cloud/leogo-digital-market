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
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m];});}
  function money(v){return 'KSh '+Number(v||0).toLocaleString();}
  function setActive(prefix,value,values){values.forEach(function(x){var b=document.getElementById(prefix+x);if(b)b.classList.toggle('active',x===value);});}
  function installLogin(){
    var btn=document.getElementById('loginBtn');if(!btn||typeof window.login==='function')return;
    window.login=async function(){
      var email=(document.getElementById('email')||{}).value||'',password=(document.getElementById('password')||{}).value||'',msg=document.getElementById('loginMsg');
      btn.disabled=true;btn.textContent='SIGNING IN…';
      loadSupabase(async function(){try{
        var sb=getSB(),r=await sb.auth.signInWithPassword({email:email.trim(),password:password});
        if(r.error){msg.innerHTML='<div class="msg error">'+esc(r.error.message||'Sign in failed.')+'</div>';btn.disabled=false;btn.textContent='SIGN IN';return;}
        var u=r.data&&r.data.user;if(!u){msg.innerHTML='<div class="msg error">Sign in did not return an account.</div>';btn.disabled=false;btn.textContent='SIGN IN';return;}
        var q=await sb.from('profiles').select('id,full_name,email,role,status').eq('id',u.id).maybeSingle();
        if(q.error||!q.data){await sb.auth.signOut();msg.innerHTML='<div class="msg error">LEOGO admin profile could not be loaded.</div>';btn.disabled=false;btn.textContent='SIGN IN';return;}
        var role=String(q.data.role||'').toLowerCase();
        if(['admin','manager','supervisor','staff'].indexOf(role)<0){await sb.auth.signOut();msg.innerHTML='<div class="msg error">Access denied. This account is not authorized for the Admin Control Center.</div>';btn.disabled=false;btn.textContent='SIGN IN';return;}
        var login=document.getElementById('login'),shell=document.getElementById('shell');
        if(login)login.classList.add('hidden');if(shell)shell.classList.remove('hidden');
        var n=document.getElementById('adminName');if(n)n.textContent=(q.data.full_name||'Admin')+' · '+role;
        if(typeof window.go==='function')window.go('dashboard');else if(document.getElementById('page-dashboard'))document.getElementById('page-dashboard').classList.add('active');
        btn.disabled=false;btn.textContent='SIGN IN';
      }catch(e){console.error(e);msg.innerHTML='<div class="msg error">Admin sign-in error: '+esc(e.message||e)+'</div>';btn.disabled=false;btn.textContent='SIGN IN';}});
    };
  }
  function installNavigationFallback(){
    if(typeof window.go==='function')return;
    window.go=function(page){
      var target=document.getElementById('page-'+page);if(!target)return;
      document.querySelectorAll('.page').forEach(function(p){p.classList.remove('active');});target.classList.add('active');
      document.querySelectorAll('.nav button[data-page]').forEach(function(b){b.classList.toggle('active',b.getAttribute('data-page')===page);});
      var side=document.getElementById('side');if(side)side.classList.remove('open');
      var loaders={dashboard:'loadDashboard',products:'loadProducts',sellers:'loadSellers',orders:'loadOrders',customers:'loadCustomers',premium:'loadPremium',services:'loadServices',transport:'loadTransport',staff:'loadStaff',delivery:'loadDelivery',settings:'loadSettings',system:'loadSystem'};
      var fn=loaders[page];if(fn&&typeof window[fn]==='function'){try{window[fn]();}catch(e){console.error(e);}}window.scrollTo(0,0);
    };
  }
  function modal(title,body){var t=document.getElementById('modalTitle'),b=document.getElementById('modalBody'),m=document.getElementById('modal');if(!t||!b||!m)return;t.textContent=title;b.innerHTML=body;m.classList.remove('hidden');}
  function variationRows(rows){
    if(!rows||!rows.length)return '<div class="notice">No product variations saved for this product.</div>';
    return '<div class="variation-list"><div class="variation-title">Product Variations ('+rows.length+')</div>'+rows.map(function(v){return '<div class="variation"><div>'+(v.image_url?'<img src="'+esc(v.image_url)+'">':'')+'</div><div><b>'+esc(v.name)+'</b><div class="muted">'+(v.available?'Available':'Unavailable')+'</div></div><div>'+money(v.price)+'</div><div>Stock: '+esc(v.stock_qty||0)+'</div></div>';}).join('')+'</div>';
  }
  async function viewProductEnhanced(id){
    var sb=getSB(),p=(window.__leogoProducts||[]).find(function(x){return x.id===id;});
    if(!p){var q=await sb.from('products').select('*,sellers(*)').eq('id',id).maybeSingle();if(q.error||!q.data){alert('Could not load product details.');return;}p=q.data;}
    var seller=Array.isArray(p.sellers)?p.sellers[0]:p.sellers;
    var v=await sb.from('product_variations').select('id,name,price,stock_qty,available,image_url,created_at').eq('product_id',id).order('created_at',{ascending:true});
    if(v.error){alert('Could not load product variations: '+v.error.message);return;}
    modal('Product Details','<div class="detail"><div><b>Product</b>'+esc(p.name)+'</div><div><b>Seller</b>'+esc(seller&&seller.business_name||'Unknown seller')+'</div><div><b>Owner</b>'+esc(seller&&seller.owner_name||'')+'</div><div><b>Category</b>'+esc(p.category||'')+'</div><div><b>Price</b>'+money(p.price)+'</div><div><b>Stock</b>'+esc(p.stock_qty||0)+'</div><div><b>Available</b>'+esc(p.available?'Yes':'No')+'</div><div><b>Approval</b>'+esc(p.approval_status||(p.approved?'approved':'pending'))+'</div></div><div class="card" style="margin-top:14px"><b>Description</b><div style="margin-top:6px">'+esc(p.description||'No description')+'</div></div>'+variationRows(v.data||[]));
  }
  function documentButtons(s){
    var docs=Array.isArray(s.documents)?s.documents:[];if(!docs.length)return '<div class="notice">No business documents were uploaded for this seller.</div>';
    return '<div class="variation-list"><div class="variation-title">Uploaded Business Documents ('+docs.length+')</div>'+docs.map(function(d,i){return '<div class="setting-row"><div><b>'+esc(d.label||d.name||('Document '+(i+1)))+'</b><div class="muted">'+esc(d.name||'')+'</div></div><button class="blue" onclick="openSellerDocument(\''+esc(s.id)+'\','+i+')">OPEN DOCUMENT</button></div>';}).join('')+'</div>';
  }
  async function viewSellerEnhanced(id){
    var sb=getSB(),q=await sb.from('sellers').select('*').eq('id',id).maybeSingle();if(q.error||!q.data){alert('Could not load seller details.');return;}var s=q.data;
    var pc=await sb.from('products').select('id,name,price,stock_qty,available,approval_status').eq('seller_id',id).order('created_at',{ascending:false});var products=pc.data||[];
    modal('Seller Details','<div class="detail"><div><b>Business Name</b>'+esc(s.business_name)+'</div><div><b>Owner</b>'+esc(s.owner_name)+'</div><div><b>Phone</b>'+esc(s.phone)+'</div><div><b>Email</b>'+esc(s.email)+'</div><div><b>Category</b>'+esc(s.category)+'</div><div><b>Location</b>'+esc(s.location)+'</div><div><b>Address</b>'+esc(s.address)+'</div><div><b>Status</b>'+esc(s.status)+'</div><div><b>Verification</b>'+esc(s.verification_status)+'</div><div><b>Registration No.</b>'+esc(s.registration_number)+'</div><div><b>Licence No.</b>'+esc(s.licence_number)+'</div><div><b>Seller ID</b>'+esc(s.id)+'</div></div><div class="card" style="margin-top:14px"><b>Business Description</b><div style="margin-top:6px">'+esc(s.description||'No description')+'</div></div>'+documentButtons(s)+'<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Seller Products ('+products.length+')</h3>'+(products.length?products.map(function(p){return '<div class="setting-row"><div><b>'+esc(p.name)+'</b><div class="muted">'+money(p.price)+' · Stock '+esc(p.stock_qty||0)+' · '+esc(p.approval_status||'pending')+'</div></div><button class="light" onclick="viewProduct(\''+p.id+'\')">VIEW PRODUCT</button></div>';}).join(''):'<div class="muted">No products registered.</div>')+'</div>');
  }
  async function openSellerDocument(id,index){
    var sb=getSB(),q=await sb.from('sellers').select('documents').eq('id',id).maybeSingle();if(q.error||!q.data){alert('Could not load seller documents.');return;}
    var docs=Array.isArray(q.data.documents)?q.data.documents:[],d=docs[index];if(!d||!d.path){alert('This document has no stored file path.');return;}
    var r=await sb.storage.from('business-documents').createSignedUrl(d.path,600);if(r.error){alert('Could not open document: '+r.error.message);return;}window.open(r.data.signedUrl,'_blank','noopener,noreferrer');
  }
  function productRows(data,f){
    var list=f==='all'?data:data.filter(function(p){return String(p.approval_status||(p.approved?'approved':'pending')).toLowerCase()===f;});if(!list.length)return '<div class="empty">No '+esc(f)+' products found.</div>';
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Product</th><th>Seller</th><th>Category</th><th>Price</th><th>Stock</th><th>Available</th><th>Approval</th><th>Action</th></tr></thead><tbody>'+list.map(function(p){var s=Array.isArray(p.sellers)?p.sellers[0]:p.sellers,ap=p.approval_status||(p.approved?'approved':'pending');return '<tr><td><b>'+esc(p.name)+'</b><br><span class="muted">'+esc((p.description||'').slice(0,80))+'</span></td><td><b>'+esc(s&&s.business_name||'Unknown seller')+'</b><br>'+esc(s&&s.owner_name||'')+'</td><td>'+esc(p.category||'')+'</td><td>'+money(p.price)+'</td><td>'+esc(p.stock_qty||0)+'</td><td>'+esc(p.available?'Available':'Unavailable')+'</td><td>'+esc(ap)+'</td><td><button class="light" onclick="viewProduct(\''+p.id+'\')">VIEW DETAILS</button></td></tr>';}).join('')+'</tbody></table></div>';
  }
  function sellerRows(data,f){
    var list=f==='all'?data:data.filter(function(s){return String(s.status||'').toLowerCase()===f;});if(!list.length)return '<div class="empty">No '+esc(f)+' sellers found.</div>';
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Business</th><th>Owner</th><th>Contact</th><th>Category</th><th>Status</th><th>Verification</th><th>Action</th></tr></thead><tbody>'+list.map(function(s){return '<tr><td><b>'+esc(s.business_name)+'</b><br>'+esc(s.location||'')+'</td><td>'+esc(s.owner_name)+'</td><td>'+esc(s.phone||'')+'<br>'+esc(s.email||'')+'</td><td>'+esc(s.category||'')+'</td><td>'+esc(s.status||'')+'</td><td>'+esc(s.verification_status||'')+'</td><td><button class="blue" onclick="viewSeller(\''+s.id+'\')">VIEW DETAILS</button></td></tr>';}).join('')+'</tbody></table></div>';
  }
  function orderRows(data,f){
    var list=data.filter(function(o){var s=String(o.status||'').toLowerCase();return f==='all'?true:f==='delivered'?s==='delivered':f==='cancelled'?s==='cancelled':s!=='delivered'&&s!=='cancelled';});if(!list.length)return '<div class="empty">No '+esc(f)+' orders found.</div>';
    var statuses=['Order Placed','Confirmed','Preparing','Ready for Pickup','Out for Delivery','Delivered','Cancelled'];
    return '<div class="table-wrap"><table class="table"><thead><tr><th>Order</th><th>Customer</th><th>Delivery</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>'+list.map(function(o){var st=o.status||'Order Placed';return '<tr><td><b>#'+esc(String(o.id).slice(0,8))+'</b><br><span class="muted">'+new Date(o.created_at).toLocaleString()+'</span></td><td>'+esc(o.receiver_name||'')+'<br>'+esc(o.receiver_phone||'')+'</td><td>'+esc(o.delivery_location||'')+'</td><td><b>'+money(o.total_amount)+'</b></td><td>'+esc(st)+'</td><td><div class="actions"><button class="orange" onclick="viewOrder(\''+o.id+'\')">VIEW ORDER</button><select onchange="updateOrderStatus(\''+o.id+'\',this.value)">'+statuses.map(function(x){return '<option '+(x===st?'selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select></div></td></tr>';}).join('')+'</tbody></table></div>';
  }
  async function viewOrderEnhanced(id){
    var sb=getSB(),q=await sb.from('orders').select('*').eq('id',id).maybeSingle();if(q.error||!q.data){alert('Could not load order details.');return;}var o=q.data;
    var itemsQ=await sb.from('order_items').select('*').eq('order_id',id).order('id');if(itemsQ.error){alert('Could not load order items: '+itemsQ.error.message);return;}var items=itemsQ.data||[];
    var sellerIds=Array.from(new Set(items.map(function(i){return i.seller_id;}).filter(Boolean))),sellersMap={};if(sellerIds.length){var sq=await sb.from('sellers').select('id,business_name,owner_name,phone,email').in('id',sellerIds);(sq.data||[]).forEach(function(s){sellersMap[s.id]=s;});}
    var variationIds=Array.from(new Set(items.map(function(i){return i.variation_id;}).filter(Boolean))),varsMap={};if(variationIds.length){var vq=await sb.from('product_variations').select('id,name,price,stock_qty,available').in('id',variationIds);(vq.data||[]).forEach(function(v){varsMap[v.id]=v;});}
    var rows=items.map(function(i){var s=sellersMap[i.seller_id],v=varsMap[i.variation_id];return '<div class="setting-row"><div><b>'+esc(i.product_name||'Product')+'</b><div class="muted">Qty: '+esc(i.quantity)+' · Unit: '+money(i.unit_price)+(v?' · Variation: '+esc(v.name):'')+'</div><div class="muted">'+(s?'Seller: '+esc(s.business_name)+' · '+esc(s.owner_name||''):'Seller information unavailable')+'</div></div><b>'+money(i.line_total)+'</b></div>';}).join('');
    var statuses=['Order Placed','Confirmed','Preparing','Ready for Pickup','Out for Delivery','Delivered','Cancelled'];
    modal('Order #'+String(id).slice(0,8),'<div class="detail"><div><b>Customer / Receiver</b>'+esc(o.receiver_name)+'</div><div><b>Phone</b>'+esc(o.receiver_phone)+'</div><div><b>Delivery Location</b>'+esc(o.delivery_location)+'</div><div><b>Landmark</b>'+esc(o.landmark)+'</div><div><b>County / Area</b>'+esc(o.county||o.subcounty||o.estate||'')+'</div><div><b>Payment Method</b>'+esc(o.payment_method)+'</div><div><b>Payment Status</b>'+esc(o.payment_status||'pending')+'</div><div><b>Current Status</b>'+esc(o.status||'Order Placed')+'</div><div><b>Subtotal</b>'+money(o.subtotal)+'</div><div><b>Service Fee</b>'+money(o.service_fee)+'</div><div><b>Delivery Fee</b>'+money(o.delivery_fee)+'</div><div><b>Grand Total</b>'+money(o.total_amount)+'</div></div><div class="card" style="margin-top:14px"><h3 style="margin-top:0">Ordered Items</h3>'+(rows||'<div class="muted">No order items found.</div>')+'</div><div class="card" style="margin-top:14px"><h3 style="margin-top:0">Update Order Status</h3><select id="adminOrderStatus" style="max-width:360px">'+statuses.map(function(x){return '<option '+(x===o.status?'selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select> <button class="primary" onclick="saveOrderStatus(\''+id+'\')">SAVE STATUS</button></div>');
  }
  async function saveOrderStatus(id){var el=document.getElementById('adminOrderStatus');if(!el)return;var ok=await window.updateOrderStatus(id,el.value);if(ok)setTimeout(function(){viewOrderEnhanced(id);},250);}
  function installEnhancedManagement(){
    if(typeof window.setProductFilter!=='function'){window.__leogoProductFilter='pending';window.setProductFilter=function(f){window.__leogoProductFilter=f;setActive('pf-',f,['pending','approved','rejected','all']);window.loadProducts();};}
    if(typeof window.loadProducts!=='function'){window.loadProducts=async function(){var a=document.getElementById('productsArea');if(!a)return;a.innerHTML='<div class="empty">Loading products…</div>';var q=await getSB().from('products').select('id,seller_id,name,category,description,price,stock_qty,image_url,available,approved,approval_status,created_at,sellers(business_name,owner_name,email,status)').order('created_at',{ascending:false});if(q.error){a.innerHTML='<div class="msg error">Could not load products: '+esc(q.error.message)+'</div>';return;}window.__leogoProducts=q.data||[];a.innerHTML=productRows(window.__leogoProducts,window.__leogoProductFilter||'pending');};}
    if(typeof window.setSellerFilter!=='function'){window.__leogoSellerFilter='pending';window.setSellerFilter=function(f){window.__leogoSellerFilter=f;setActive('sf-',f,['pending','active','suspended','all']);window.loadSellers();};}
    if(typeof window.loadSellers!=='function'){window.loadSellers=async function(){var a=document.getElementById('sellersArea');if(!a)return;a.innerHTML='<div class="empty">Loading sellers…</div>';var q=await getSB().from('sellers').select('*').order('created_at',{ascending:false});if(q.error){a.innerHTML='<div class="msg error">Could not load sellers: '+esc(q.error.message)+'</div>';return;}window.__leogoSellers=q.data||[];a.innerHTML=sellerRows(window.__leogoSellers,window.__leogoSellerFilter||'pending');};}
    if(typeof window.setOrderFilter!=='function'){window.__leogoOrderFilter='open';window.setOrderFilter=function(f){window.__leogoOrderFilter=f;setActive('of-',f,['open','delivered','cancelled','all']);window.loadOrders();};}
    if(typeof window.loadOrders!=='function'){window.loadOrders=async function(){var a=document.getElementById('ordersArea');if(!a)return;a.innerHTML='<div class="empty">Loading orders…</div>';var q=await getSB().from('orders').select('*').order('created_at',{ascending:false}).limit(300);if(q.error){a.innerHTML='<div class="msg error">Could not load orders: '+esc(q.error.message)+'</div>';return;}window.__leogoOrders=q.data||[];a.innerHTML=orderRows(window.__leogoOrders,window.__leogoOrderFilter||'open');};}
    window.viewProduct=viewProductEnhanced;window.viewSeller=viewSellerEnhanced;window.openSellerDocument=openSellerDocument;window.viewOrder=viewOrderEnhanced;
    if(typeof window.updateOrderStatus!=='function'){window.updateOrderStatus=async function(id,status){var q=await getSB().from('orders').update({status:status,updated_at:new Date().toISOString()}).eq('id',id).select('id,status').maybeSingle();if(q.error){alert('Order status update failed: '+q.error.message);return false;}if(!q.data){alert('No order was updated. Check Admin permissions.');return false;}if(typeof window.loadOrders==='function')await window.loadOrders();return true;};}
  }
  function boot(){installLogin();installNavigationFallback();installEnhancedManagement();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  var timer=setInterval(function(){boot();if(typeof window.login==='function'&&typeof window.go==='function')clearInterval(timer);},100);
})();