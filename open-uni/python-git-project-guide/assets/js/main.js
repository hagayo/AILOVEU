const toggle=document.querySelector('.nav-toggle');
const nav=document.querySelector('.main-nav');
if(toggle&&nav){toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});}
const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}})},{threshold:.14});
document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));
document.querySelectorAll('pre').forEach(pre=>{const wrap=document.createElement('div');wrap.className='copy-wrap';pre.parentNode.insertBefore(wrap,pre);wrap.appendChild(pre);const btn=document.createElement('button');btn.className='copy-btn';btn.type='button';btn.textContent='העתק';btn.addEventListener('click',async()=>{await navigator.clipboard.writeText(pre.innerText);btn.textContent='הועתק';setTimeout(()=>btn.textContent='העתק',1200);});wrap.appendChild(btn);});
