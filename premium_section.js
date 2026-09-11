/* LEOGO PREMIUM SECTION - isolated customer premium access gate. */
(function(){
  if(window.__leogoPremiumSectionInstalled)return;
  window.__leogoPremiumSectionInstalled=true;

  const URL='https://twpiloiiigdghwcdjbnj.supabase.co';
  const KEY='sb_publishable_c4iJwLdRuH85e0XuFnkSjg_mdxLN2fX';
  const sb=window.supabase.createClient(URL,KEY);
  const CONSENT_VERSION='premium-1.0';

  function esc(v){return String(v??'').replace(/[&<>\'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));}

  function inject(){
    if(document.getElementById('leogoPremiumSection'))return;
    const section=document.createElement('section');
    section.id='leogoPremiumSection';
    section.innerHTML='<div class="container"><div class="banner" style="background:linear-gradient(120deg,#07152f,#172f59);color:#fff;border-color:#243f70"><div><div style="font-weight:900;color:#ffb15a;letter-spacing:1px">PRIVATE • VERIFIED • 18+</div><h2 style="color:#fff;margin:5px 0">🔒 LEOGO Premium</h2><div style="color:#d9e4f7;max-width:760px">A private space where verified adults can connect. LEOGO provides the platform and connection only — relationships, meetings and what happens afterwards are the responsibility of the people involved.</div></div><button class="btn orange" id="leogoPremiumOpen">ENTER PREMIUM 18+</button></div></div>';
    const footer=document.querySelector('footer');
    if(footer)footer.parentNode.insertBefore(section,footer);
    else document.getElementById('storefront')?.appendChild(section);
    document.getElementById('leogoPremiumOpen').onclick=openPremium;
  }

  function close(){document.getElementById('leogoPremiumModal')?.remove();}

  async function openPremium(){
    const session=(await sb.auth.getSession()).data?.session;
    if(!session){if(typeof window.openAuth==='function')window.openAuth();else alert('Please log in as a customer to enter LEOGO Premium.');return;}
    const q=await sb.from('premium_members').select('age_confirmed,relationship_disclaimer_accepted,consent_version').eq('user_id',session.user.id).maybeSingle();
    if(q.error){alert('Premium is temporarily unavailable. Please try again.');return;}
    if(q.data?.age_confirmed===true&&q.data?.relationship_disclaimer_accepted===true&&q.data?.consent_version===CONSENT_VERSION){showPremiumPlaceholder(true);return;}

    close();
    const m=document.createElement('div');m.id='leogoPremiumModal';m.className='modal';
    m.innerHTML='<div class="modal-card" style="width:min(620px,100%)"><div class="modal-head"><div><div style="font-size:11px;font-weight:900;color:#ff7a00">LEOGO PREMIUM • 18+</div><h2 style="margin:3px 0">Age & Responsibility Confirmation</h2></div><button class="close" id="lpClose">✕</button></div>'+ 
      '<div class="notice" style="background:#fff7ed;color:#7c2d12"><b>Adults only.</b> You must be 18 years or older to enter this section. By continuing, you confirm that the information you provide is truthful and that you are legally permitted to use an adults-only service.</div>'+ 
      '<div class="panel" style="margin:14px 0;background:#f8fafc"><h3>LEOGO’s role</h3><p style="margin:8px 0;color:#475467">LEOGO only provides a platform for people to connect and, where applicable, supports identity/profile verification. LEOGO does not arrange, control, supervise or guarantee any friendship, dating, romantic, sexual or other personal relationship.</p><p style="margin:8px 0;color:#475467"><b>LEOGO is not responsible for any relationship, meeting, communication, transaction, disagreement, loss, injury or other event that occurs between members after they connect.</b> Members are responsible for their own decisions, conduct, safety and interactions.</p></div>'+ 
      '<div class="panel" style="margin:14px 0"><h3>Privacy & protection</h3><p style="margin:8px 0;color:#475467">Premium member information is intended to remain private and protected. Sensitive profile information is not displayed publicly unless the member has chosen information for a permitted profile view. LEOGO will use access controls to restrict premium member data to authorized users and functions.</p></div>'+ 
      '<label style="display:flex;gap:10px;align-items:flex-start;margin:14px 0;font-weight:700"><input id="lpAge" type="checkbox" style="margin-top:4px;width:18px;height:18px"><span>I confirm that I am <b>18 years or older</b>.</span></label>'+ 
      '<label style="display:flex;gap:10px;align-items:flex-start;margin:14px 0;font-weight:700"><input id="lpDisclaimer" type="checkbox" style="margin-top:4px;width:18px;height:18px"><span>I understand and accept that <b>LEOGO is not responsible for any relationship or events after people connect.</b></span></label>'+ 
      '<div id="lpMsg"></div><button class="btn orange" id="lpContinue" style="width:100%">CONFIRM & ENTER PREMIUM</button></div>';
    document.body.appendChild(m);
    document.getElementById('lpClose').onclick=close;
    m.onclick=e=>{if(e.target===m)close();};
    document.getElementById('lpContinue').onclick=saveConsent;
  }

  async function saveConsent(){
    const age=document.getElementById('lpAge')?.checked,disc=document.getElementById('lpDisclaimer')?.checked,msg=document.getElementById('lpMsg'),b=document.getElementById('lpContinue');
    if(!age||!disc){msg.innerHTML='<div class="notice error">You must confirm both statements before entering LEOGO Premium.</div>';return;}
    const session=(await sb.auth.getSession()).data?.session;
    if(!session){msg.innerHTML='<div class="notice error">Your session has expired. Please log in again.</div>';return;}
    b.disabled=true;b.textContent='SAVING…';
    const now=new Date().toISOString();
    const q=await sb.from('premium_members').upsert({user_id:session.user.id,age_confirmed:true,age_confirmed_at:now,relationship_disclaimer_accepted:true,disclaimer_accepted_at:now,consent_version:CONSENT_VERSION},{onConflict:'user_id'});
    if(q.error){b.disabled=false;b.textContent='CONFIRM & ENTER PREMIUM';msg.innerHTML='<div class="notice error">'+esc(q.error.message)+'</div>';return;}
    close();showPremiumPlaceholder(false);
  }

  function showPremiumPlaceholder(returning){
    close();
    const m=document.createElement('div');m.id='leogoPremiumModal';m.className='modal';
    m.innerHTML='<div class="modal-card" style="width:min(760px,100%)"><div class="modal-head"><div><div style="font-size:11px;font-weight:900;color:#ff7a00">PRIVATE • VERIFIED • 18+</div><h2 style="margin:3px 0">🔒 LEOGO Premium</h2></div><button class="close" id="lpClose2">✕</button></div><div class="notice success"><b>Access confirmed.</b> Your Premium age and responsibility confirmations are on record.</div><div class="panel" style="background:#f8fafc"><h3>Private Premium Area</h3><p class="muted">Premium profiles and member features will appear here. Only approved, eligible Premium members will be able to access protected member information.</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px"><div class="cat"><div class="emoji">🛡️</div><b>Privacy Protected</b></div><div class="cat"><div class="emoji">✓</div><b>Verified Profiles</b></div><div class="cat"><div class="emoji">🔐</div><b>Private Connections</b></div></div></div><div class="muted" style="font-size:12px">LEOGO connects people; members are responsible for their own relationships, decisions, communication and meetings.</div><div style="display:flex;justify-content:flex-end;margin-top:15px"><button class="btn primary" id="lpClose3">CLOSE</button></div></div>';
    document.body.appendChild(m);
    document.getElementById('lpClose2').onclick=close;document.getElementById('lpClose3').onclick=close;m.onclick=e=>{if(e.target===m)close();};
  }

  function start(){inject();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();