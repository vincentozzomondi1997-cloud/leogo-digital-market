/* LEOGO PREMIUM GALLERY COMPACT VIEW — ADMIN UI ONLY
   Hides large gallery thumbnails and replaces them with lightweight VIEW PHOTO links.
   No database, approval or rejection logic is changed. */
(function(){
  'use strict';
  if(window.__leogoPremiumGalleryCompact)return;
  window.__leogoPremiumGalleryCompact=true;
  function compact(){
    const host=document.getElementById('premiumMediaApprovalArea');
    if(!host)return;
    host.querySelectorAll('div').forEach(card=>{
      if(card.dataset.galleryCompact==='1')return;
      const title=(card.querySelector('b')?.textContent||'').trim();
      if(!/^Gallery Photo [1-6]$/i.test(title))return;
      const img=card.querySelector('img');
      if(!img)return;
      const url=img.getAttribute('src');
      if(!url)return;
      card.dataset.galleryCompact='1';
      img.style.display='none';
      const link=document.createElement('a');
      link.href=url;link.target='_blank';link.rel='noopener noreferrer';link.textContent='VIEW PHOTO ↗';
      link.style.cssText='display:inline-block;margin-top:10px;padding:8px 10px;border-radius:9px;background:#eef3fb;color:#07152f;font-size:12px;font-weight:900;text-decoration:none;';
      img.parentNode.insertBefore(link,img);
    });
  }
  window.compactPremiumGallery=compact;
  function start(){compact();if(window.MutationObserver)new MutationObserver(()=>setTimeout(compact,0)).observe(document.body,{childList:true,subtree:true});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();