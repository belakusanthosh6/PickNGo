// Presentation only: category shortcuts, product photography, and cart feedback.
(function(){
 const photoRules=[[/banana/i,0],[/tomato/i,1],[/milk/i,2],[/egg/i,3],[/bread/i,4],[/butter/i,5],[/spinach|palak/i,6],[/apple/i,7],[/curd|yogurt/i,8],[/oil/i,9],[/rice/i,10],[/potato/i,11]];
 const bag='<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16h24l3 26H9l3-26zM18 17V12a6 6 0 0112 0v5"/></svg>';
 function enhance(){
  document.querySelectorAll('.grouped-product-card').forEach(card=>{
   if(card.querySelector('.product-photo,.product-placeholder'))return;
   const title=card.querySelector('.grouped-product-name');if(!title)return;
   const src=window.pickngoImageFor?window.pickngoImageFor(card.dataset.image,title.textContent):null;
   if(src){const img=document.createElement('img');img.className='product-photo';img.src=src;img.alt=title.textContent;img.width=384;img.height=384;img.loading='lazy';card.prepend(img);}
   else{const placeholder=document.createElement('div');placeholder.className='product-placeholder';placeholder.setAttribute('aria-hidden','true');placeholder.innerHTML=bag;card.prepend(placeholder);}
   card.querySelectorAll('.shop-add-button').forEach(b=>{b.textContent='ADD';b.setAttribute('aria-label','Add '+title.textContent+' to cart');});
  });
  const b=document.getElementById('cartBadge');if(b){let n=0;document.querySelectorAll('#cartItems .cart-item').forEach(r=>{const s=r.querySelector('span');n+=parseInt(s&&s.textContent)||1;});if(b.textContent!==String(n))b.textContent=String(n);}
 }
 new MutationObserver(enhance).observe(document.body,{childList:true,subtree:true});enhance();
 document.querySelectorAll('.chip').forEach(c=>c.addEventListener('click',()=>{
 document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));c.classList.add('active');
 const i=document.getElementById('searchInput');if(i){i.value=c.dataset.q||'';i.dispatchEvent(new Event('input',{bubbles:true}));}
 document.getElementById('searchButton')?.click();document.getElementById('productList')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
 }));
})();
