// Presentation only: glass header on scroll, repeating scroll reveals, button ripples, cart bump.
(function(){
  const bar=document.querySelector(".topbar");
  const onScroll=()=>bar&&bar.classList.toggle("scrolled",scrollY>10);
  addEventListener("scroll",onScroll,{passive:true});onScroll();
  const sel=".section-heading,.category-tile,.product-card,.stat-card,.owner-card,.form-card,.owner-product-row,.cart-section,.panel,.owner-banner,.reservation-item";
  // Replays every time an element enters the viewport — no reload needed.
  const io="IntersectionObserver" in window?new IntersectionObserver((es)=>es.forEach(e=>{
    e.target.classList.toggle("in",e.isIntersecting);
  }),{rootMargin:"0px 0px -6% 0px"}):null;
  function scan(){let i=0;document.querySelectorAll(sel).forEach(el=>{if(el.dataset.rv)return;el.dataset.rv=1;if(!io)return;el.classList.add("reveal");el.style.transitionDelay=Math.min(i++,8)*45+"ms";io.observe(el)})}
  scan();new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  document.addEventListener("pointerdown",e=>{const b=e.target.closest("button,.cart-pill");if(!b||b.disabled)return;const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height),d=document.createElement("span");d.className="ripple";d.style.cssText=`width:${s}px;height:${s}px;left:${e.clientX-r.left-s/2}px;top:${e.clientY-r.top-s/2}px`;b.appendChild(d);setTimeout(()=>d.remove(),600)});
  const pill=document.querySelector(".cart-pill");
  if(pill)new MutationObserver(()=>{pill.classList.remove("bump");void pill.offsetWidth;pill.classList.add("bump")}).observe(pill,{childList:true,subtree:true,characterData:true});
})();
