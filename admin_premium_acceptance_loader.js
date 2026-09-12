(function(){
  'use strict';
  var ADMIN_EMAIL='leogodigitalmarket@gmail.com';
  var loaded=false;
  function sb(){return window.supabase.createClient('https://twpiloiiigdghwcdjbnj.supabase.co','sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX');}
  function installAdminLogin(){
    if(!window.supabase||typeof window.supabase.createClient!=='function')return;
    var client=sb(),btn=document.getElementById('loginBtn'),msg=document.getElementById('loginMsg');
    if(!btn)return;
    window.login=async function(){
      var email=(document.getElementById('email')?.value||'').trim().toLowerCase(),password=document.getElementById('password')?.value||'';
      if(email!==ADMIN_EMAIL){if(msg)msg.innerHTML='<div class="msg error">Access denied. This email is reserved for the LEOGO Admin Control Center.</div>';return;}
      btn.disabled=true;btn.textContent='SIGNING IN…';
      try{
        var r=await client.auth.signInWithPassword({email:ADMIN_EMAIL,password:password});
        if(r.error)throw r.error;
        var u=r.data?.user;if(!u||String(u.email||'').toLowerCase()!==ADMIN_EMAIL)throw new Error('Admin account could not be verified.');
        var q=await client.from('profiles').select('id,full_name,email,role,status').eq('id',u.id).maybeSingle();
        if(q.error||!q.data)throw new Error('LEOGO admin profile could not be loaded.');
        if(String(q.data.role||'').toLowerCase()!=='admin'||String(q.data.status||'').toLowerCase()!=='active')throw new Error('The protected Admin account is not active.');
        document.getElementById('login')?.classList.add('hidden');document.getElementById('shell')?.classList.remove('hidden');
        var n=document.getElementById('adminName');if(n)n.textContent=(q.data.full_name||'Admin')+' · admin';
        if(typeof window.go==='function')window.go('dashboard');
      }catch(e){await client.auth.signOut();if(msg)msg.innerHTML='<div class="msg error">Admin sign-in failed: '+String(e.message||e).replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))+'</div>'}
      btn.disabled=false;btn.textContent='SIGN IN';
    };
  }
  function clearNonAdminSession(){
    if(!window.supabase)return;
    var client=sb();client.auth.getSession().then(function(r){var u=r.data?.session?.user;if(u&&String(u.email||'').toLowerCase()!==ADMIN_EMAIL)client.auth.signOut();});
  }
  function load(){
    if(loaded)return;
    var page=document.getElementById('page-premium');
    if(!page)return;
    loaded=true;
    var s=document.createElement('script');
    s.src='premium_acceptance_admin.js';
    s.onload=function(){if(typeof window.initPremiumAcceptanceAdmin==='function')window.initPremiumAcceptanceAdmin();};
    s.onerror=function(){console.error('LEOGO: Could not load Premium acceptance approval panel.');};
    document.head.appendChild(s);
  }
  function watch(){
    installAdminLogin();
    clearNonAdminSession();
    load();
    var nav=document.querySelectorAll('[data-page="premium"]');
    nav.forEach(function(b){b.addEventListener('click',function(){setTimeout(load,0);});});
    if(window.MutationObserver)new MutationObserver(load).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',watch);else watch();
})();
