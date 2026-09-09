(function(){
  'use strict';

  // CUSTOMER MANAGEMENT IS ISOLATED FROM THE ADMIN LOGIN/GUARD.
  // This file only adds the customer page functions used by admin.html.
  var SUPABASE_URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  var SUPABASE_KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  var sb=null;
  var customers=[];
  var orders=[];
  var currentFilter='all';
  var currentSearch='';

  function client(){
    if(!sb)sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
    return sb;
  }
  function esc(v){return String(v==null?'':v).replace(/[&<>\"']/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[m];});}
  function money(v){return 'KSh '+Number(v||0).toLocaleString();}
  function statusClass(s){return String(s||'').toLowerCase()==='active'?'green':'red';}
  function showModal(title,body){
    var t=document.getElementById('modalTitle'),b=document.getElementById('modalBody'),m=document.getElementById('modal');
    if(!t||!b||!m){alert('Customer details window is unavailable.');return;}
    t.textContent=title;b.innerHTML=body;m.classList.remove('hidden');
  }
  function filtered(){
    var q=currentSearch.trim().toLowerCase();
    return customers.filter(function(c){
      var status=String(c.status||'active').toLowerCase();
      if(currentFilter!=='all'&&status!==currentFilter)return false;
      if(!q)return true;
      return [c.full_name,c.username,c.email,c.phone,c.location].some(function(v){return String(v||'').toLowerCase().indexOf(q)>=0;});
    });
  }
  function customerStats(c){
    var os=orders.filter(function(o){return o.customer_id===c.id;});
    var total=os.reduce(function(sum,o){return sum+Number(o.total_amount||0);},0);
    return {count:os.length,total:total,last:os.length?os.slice().sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at);})[0]:null};
  }
  function render(){
    var area=document.getElementById('customersArea');if(!area)return;
    var list=filtered();
    var active=customers.filter(function(c){return String(c.status||'active').toLowerCase()==='active';}).length;
    var suspended=customers.filter(function(c){return String(c.status||'').toLowerCase()==='suspended';}).length;
    var totalSpend=orders.reduce(function(s,o){return s+Number(o.total_amount||0);},0);
    var html='<div class="cards" style="grid-template-columns:repeat(4,minmax(0,1fr));margin-top:14px">'+
      '<div class="stat"><span class="muted">Customers</span><b>'+customers.length+'</b></div>'+\
      '<div class="stat"><span class="muted">Active</span><b>'+active+'</b></div>'+\
      '<div class="stat"><span class="muted">Suspended</span><b>'+suspended+'</b></div>'+\
      '<div class="stat"><span class="muted">Customer Order Value</span><b style="font-size:19px">'+money(totalSpend)+'</b></div></div>'+
      '<div class="toolbar" style="margin-top:14px"><div class="filters">'+
      '<button id="cf-all" class="'+(currentFilter==='all'?'orange':'light')+'" onclick="setCustomerFilter(\'all\')">ALL</button>'+\
      '<button id="cf-active" class="'+(currentFilter==='active'?'orange':'light')+'" onclick="setCustomerFilter(\'active\')">ACTIVE</button>'+\
      '<button id="cf-suspended" class="'+(currentFilter==='suspended'?'orange':'light')+'" onclick="setCustomerFilter(\'suspended\')">SUSPENDED</button>'+\
      '</div><input class="search" id="customerSearch" placeholder="Search name, email, phone..." value="'+esc(currentSearch)+'" oninput="setCustomerSearch(this.value)"></div>';
    if(!list.length){area.innerHTML=html+'<div class="empty">No customers found.</div>';return;}
    html+='<div class="table-wrap"><table class="table"><thead><tr><th>Customer</th><th>Contact</th><th>Location</th><th>Orders</th><th>Total Spend</th><th>Status</th><th>Action</th></tr></thead><tbody>';
    list.forEach(function(c){
      var st=customerStats(c);
      html+='<tr><td><b>'+esc(c.full_name||'Unnamed customer')+'</b><br><span class="muted">'+esc(c.username||'')+'</span></td>'+\
        '<td>'+esc(c.phone||'')+'<br>'+esc(c.email||'')+'</td>'+\
        '<td>'+esc(c.location||'')+'</td>'+\
        '<td>'+st.count+'</td>'+\
        '<td><b>'+money(st.total)+'</b></td>'+\
        '<td><span class="pill '+statusClass(c.status)+'">'+esc(c.status||'active')+'</span></td>'+\
        '<td><div class="actions"><button class="blue" onclick="viewCustomer(\''+esc(c.id)+'\')">VIEW DETAILS</button>'+(String(c.status||'active').toLowerCase()==='suspended'?'<button class="approve" onclick="changeCustomerStatus(\''+esc(c.id)+'\',\'active\')">ACTIVATE</button>':'<button class="danger" onclick="changeCustomerStatus(\''+esc(c.id)+'\',\'suspended\')">SUSPEND</button>')+'</div></td></tr>';
    });
    html+='</tbody></table></div>';
    area.innerHTML=html;
  }

  async function loadCustomers(){
    var area=document.getElementById('customersArea');if(!area)return;
    area.innerHTML='<div class="empty">Loading customers...</div>';
    try{
      var s=client();
      var p=await s.from('profiles').select('id,full_name,username,phone,email,location,status,avatar_url,created_at,updated_at').eq('role','customer').order('created_at',{ascending:false});
      if(p.error)throw p.error;
      customers=p.data||[];
      var ids=customers.map(function(c){return c.id;});
      if(ids.length){
        var o=await s.from('orders').select('id,customer_id,receiver_name,receiver_phone,delivery_location,subtotal,service_fee,delivery_fee,other_charges,total_amount,payment_method,payment_status,status,created_at,updated_at').in('customer_id',ids).order('created_at',{ascending:false});
        if(o.error)throw o.error;
        orders=o.data||[];
      }else orders=[];
      render();
    }catch(e){
      console.error('LEOGO customer management:',e);
      area.innerHTML='<div class="msg error">Could not load customers: '+esc(e.message||e)+'</div>';
    }
  }

  function setCustomerFilter(f){currentFilter=f;render();}
  function setCustomerSearch(v){currentSearch=v||'';render();var el=document.getElementById('customerSearch');if(el){el.focus();try{el.setSelectionRange(el.value.length,el.value.length);}catch(_){}}}

  async function viewCustomer(id){
    var c=customers.find(function(x){return x.id===id;});
    if(!c){alert('Customer not found. Please refresh the customer list.');return;}
    var st=customerStats(c),os=orders.filter(function(o){return o.customer_id===id;}).sort(function(a,b){return new Date(b.created_at)-new Date(a.created_at);});
    var body='<div class="detail">'+
      '<div><b>Full Name</b>'+esc(c.full_name||'')+'</div>'+\
      '<div><b>Username</b>'+esc(c.username||'')+'</div>'+\
      '<div><b>Email</b>'+esc(c.email||'')+'</div>'+\
      '<div><b>Phone</b>'+esc(c.phone||'')+'</div>'+\
      '<div><b>Location</b>'+esc(c.location||'')+'</div>'+\
      '<div><b>Status</b>'+esc(c.status||'active')+'</div>'+\
      '<div><b>Customer ID</b>'+esc(c.id)+'</div>'+\
      '<div><b>Registered</b>'+esc(c.created_at?new Date(c.created_at).toLocaleString():'')+'</div>'+\
      '<div><b>Total Orders</b>'+st.count+'</div>'+\
      '<div><b>Total Spend</b>'+money(st.total)+'</div></div>';
    body+='<div class="card" style="margin-top:14px"><h3 style="margin-top:0">Order History ('+os.length+')</h3>';
    if(!os.length)body+='<div class="muted">This customer has not placed any orders.</div>';
    else body+='<div class="table-wrap"><table class="table" style="min-width:700px"><thead><tr><th>Order</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th>Delivery</th></tr></thead><tbody>'+os.map(function(o){return '<tr><td><b>#'+esc(String(o.id).slice(0,8))+'</b></td><td>'+esc(new Date(o.created_at).toLocaleString())+'</td><td>'+money(o.total_amount)+'</td><td>'+esc(o.payment_method||'')+'<br>'+esc(o.payment_status||'')+'</td><td>'+esc(o.status||'')+'</td><td>'+esc(o.delivery_location||'')+'</td></tr>';}).join('')+'</tbody></table></div>';
    body+='</div>';
    body+='<div class="actions" style="margin-top:14px"><button class="'+(String(c.status||'active').toLowerCase()==='suspended'?'approve':'danger')+'" onclick="changeCustomerStatus(\''+esc(c.id)+'\',\''+(String(c.status||'active').toLowerCase()==='suspended'?'active':'suspended')+'\');closeModal()">'+(String(c.status||'active').toLowerCase()==='suspended'?'ACTIVATE CUSTOMER':'SUSPEND CUSTOMER')+'</button></div>';
    showModal('Customer Details',body);
  }

  async function changeCustomerStatus(id,status){
    var c=customers.find(function(x){return x.id===id;});if(!c)return;
    var action=status==='suspended'?'suspend':'activate';
    if(!confirm('Are you sure you want to '+action+' '+(c.full_name||'this customer')+'?'))return;
    try{
      var s=client();
      var r=await s.from('profiles').update({status:status,updated_at:new Date().toISOString()}).eq('id',id).eq('role','customer');
      if(r.error)throw r.error;
      c.status=status;
      render();
    }catch(e){
      console.error('LEOGO customer status update:',e);
      alert('Could not update customer status: '+(e.message||e));
    }
  }

  window.loadCustomers=loadCustomers;
  window.setCustomerFilter=setCustomerFilter;
  window.setCustomerSearch=setCustomerSearch;
  window.viewCustomer=viewCustomer;
  window.changeCustomerStatus=changeCustomerStatus;
})();
