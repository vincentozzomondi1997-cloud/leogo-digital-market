/* LEOGO PREMIUM SECTION - isolated customer premium access and pricing. */
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
    if(q.data?.age_confirmed===true&&q.data?.relationship_disclaimer_accepted===true&&q.data?.consent_version===CONSENT_VERSION){showPremiumArea(true);return;}

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
    close();showPremiumArea(false);
  }

  async function getPricing(){
    const q=await sb.rpc('get_premium_pricing');
    if(q.error)return [];
    return q.data||[];
  }

  async function choosePlan(planCode){
    const msg=document.getElementById('lpPlanMsg');
    if(msg)msg.innerHTML='<div class="notice">Preparing your Premium payment...</div>';
    const q=await sb.rpc('start_premium_checkout',{p_plan_code:planCode});
    if(q.error){if(msg)msg.innerHTML='<div class="notice error">'+esc(q.error.message)+'</div>';return;}
    const row=q.data?.[0];
    if(!row){if(msg)msg.innerHTML='<div class="notice error">Unable to create the Premium payment request.</div>';return;}
    if(msg)msg.innerHTML='<div class="notice success"><b>Premium plan selected.</b> KSh '+Number(row.price).toLocaleString()+' payment request created. Payment processing will be connected next.</div>';
  }

  async function showPremiumArea(){
    close();
    const m=document.createElement('div');m.id='leogoPremiumModal';m.className='modal';
    m.innerHTML='<div class="modal-card" style="width:min(820px,100%)"><div class="modal-head"><div><div style="font-size:11px;font-weight:900;color:#ff7a00">PRIVATE • VERIFIED • 18+</div><h2 style="margin:3px 0">🔒 LEOGO Premium</h2></div><button class="close" id="lpClose2">✕</button></div><div class="notice success"><b>Access confirmation recorded.</b> Premium member access is protected by your account and consent.</div><div class="panel" style="background:#f8fafc"><h3>Premium Membership</h3><p class="muted">Choose how you want to access LEOGO Premium. Prices are controlled by LEOGO administration and may be changed from time to time.</p><div id="lpPlans" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:15px"></div><div id="lpPlanMsg" style="margin-top:12px"></div></div><div class="panel" style="margin-top:14px"><h3>Private Premium Area</h3><p class="muted">Only approved, eligible Premium members will be able to access protected member information, profiles and connections.</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:14px"><div class="cat"><div class="emoji">🛡️</div><b>Privacy Protected</b></div><div class="cat"><div class="emoji">✓</div><b>Verified Profiles</b></div><div class="cat"><div class="emoji">🔐</div><b>Private Connections</b></div></div></div><div class="muted" style="font-size:12px;margin-top:12px">LEOGO connects people; members are responsible for their own relationships, decisions, communication and meetings.</div><div style="display:flex;justify-content:flex-end;margin-top:15px"><button class="btn primary" id="lpClose3">CLOSE</button></div></div>';
    document.body.appendChild(m);
    document.getElementById('lpClose2').onclick=close;document.getElementById('lpClose3').onclick=close;m.onclick=e=>{if(e.target===m)close();};
    const plans=await getPricing();
    const wrap=document.getElementById('lpPlans');
    if(!plans.length){wrap.innerHTML='<div class="notice error" style="grid-column:1/-1">Premium plans are temporarily unavailable.</div>';return;}
    wrap.innerHTML=plans.map(p=>'<div class="cat" style="text-align:left;padding:18px;border:2px solid #dbe4f0"><div style="font-weight:900;color:#ff7a00">'+esc(p.plan_name)+'</div><div style="font-size:30px;font-weight:950;margin:6px 0">KSh '+Number(p.price).toLocaleString()+'</div><div class="muted" style="font-size:12px;margin-bottom:12px">'+(p.plan_code==='monthly'?'30 days • recurring plan':'One-time payment • no recurring charge')+'</div><button class="btn orange lpChoose" data-plan="'+esc(p.plan_code)+'" style="width:100%">CHOOSE PLAN</button></div>').join('');
    wrap.querySelectorAll('.lpChoose').forEach(b=>b.onclick=()=>choosePlan(b.dataset.plan));
  }

  function start(){inject();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();