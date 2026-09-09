(function(){
  function loadSupabase(done){
    if(window.supabase&&window.supabase.createClient){done();return;}
    var s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    s.onload=done;
    s.onerror=function(){var m=document.getElementById('loginMsg');if(m)m.innerHTML='<div class="msg error">Could not load the authentication service. Please refresh and try again.</div>';};
    document.head.appendChild(s);
  }
  function installLogin(){
    var btn=document.getElementById('loginBtn');
    if(!btn||typeof window.login==='function')return;
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
  function boot(){installLogin();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  var timer=setInterval(function(){boot();if(typeof window.login==='function')clearInterval(timer);},100);
})();
