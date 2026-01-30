let products = [];

const productsGrid = document.getElementById('products-grid');
const cartCountEl = document.getElementById('cart-count');
const viewCartBtn = document.getElementById('view-cart');
const cartPanel = document.getElementById('cart-panel');
const closeCartBtn = document.getElementById('close-cart');
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const toastEl = document.getElementById('toast');
const themeToggle = document.getElementById('theme-toggle');

let cart = [];

function formatPrice(n){ return `$${n.toFixed(2)}` }

function renderProducts(){
  productsGrid.innerHTML = '';
  products.forEach(p => {
    const el = document.createElement('div');
    el.className = 'card';
    el.innerHTML = `
      <img src="${p.img}" alt="${p.name}">
      <h4>${p.name}</h4>
      <p>Pet favorite — high quality and safe.</p>
      <div class="card-row">
        <span class="price">${formatPrice(p.price)}</span>
        <button data-id="${p.id}">Add</button>
      </div>
    `;
    const btn = el.querySelector('button');
    btn.addEventListener('click', ()=> addToCart(p.id, el));
    productsGrid.appendChild(el);
  });
}

function showToast(text){
  if(!toastEl) return;
  toastEl.textContent = text;
  toastEl.classList.add('show');
  clearTimeout(toastEl._hideTimeout);
  toastEl._hideTimeout = setTimeout(()=> toastEl.classList.remove('show'), 1800);
}

// Theme handling
function applyTheme(theme){
  const root = document.documentElement;
  if(theme === 'dark'){
    root.classList.add('dark');
    if(themeToggle) { themeToggle.innerText = '☀️'; themeToggle.setAttribute('aria-pressed','true'); }
  } else {
    root.classList.remove('dark');
    if(themeToggle) { themeToggle.innerText = '🌙'; themeToggle.setAttribute('aria-pressed','false'); }
  }
  try{ localStorage.setItem('theme', theme); }catch(e){}
}

function initTheme(){
  const saved = localStorage.getItem('theme');
  if(saved){ applyTheme(saved); return }
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

if(themeToggle){
  themeToggle.addEventListener('click', ()=>{
    const isDark = document.documentElement.classList.contains('dark');
    applyTheme(isDark ? 'light' : 'dark');
  });
}

function flyToCart(imgEl){
  if(!imgEl) return;
  const imgRect = imgEl.getBoundingClientRect();
  const cartRect = viewCartBtn.getBoundingClientRect();
  const f = imgEl.cloneNode(true);
  f.className = 'fly-img';
  f.style.left = imgRect.left + 'px';
  f.style.top = imgRect.top + 'px';
  f.style.width = imgRect.width + 'px';
  f.style.height = imgRect.height + 'px';
  document.body.appendChild(f);
  const dx = (cartRect.left + cartRect.width/2) - (imgRect.left + imgRect.width/2);
  const dy = (cartRect.top + cartRect.height/2) - (imgRect.top + imgRect.height/2);
  const anim = f.animate([
    { transform: 'translate(0,0) scale(1)', opacity: 1 },
    { transform: `translate(${dx}px, ${dy}px) scale(0.18)`, opacity: 0.6 }
  ], { duration: 720, easing: 'cubic-bezier(.2,.8,.2,1)' });
  anim.onfinish = ()=> f.remove();
}

function pulseCartButton(){
  viewCartBtn.classList.add('pulse');
  setTimeout(()=> viewCartBtn.classList.remove('pulse'), 380);
}

function addToCart(id, cardEl){
  const prod = products.find(p=>p.id===id);
  if(!prod) return;
  // fly animation from card image
  const img = cardEl.querySelector('img');
  flyToCart(img);
  // add to cart
  cart.push(Object.assign({}, prod));
  updateCartUI();
  // microinteractions
  pulseCartButton();
  showToast(`${prod.name} added to cart`);
}

function updateCartUI(){
  cartCountEl.textContent = cart.length;
  cartItemsEl.innerHTML = '';
  let total = 0;
  cart.forEach((item, i)=>{
    total += item.price;
    const li = document.createElement('li');
    li.innerHTML = `
      <img src="${item.img}" alt="${item.name}">
      <div style="flex:1">
        <div style="font-weight:600">${item.name}</div>
        <div style="color:#6b7280;font-size:0.9rem">${formatPrice(item.price)}</div>
      </div>
      <div>
        <button data-index="${i}" class="remove">Remove</button>
      </div>
    `;
    li.querySelector('.remove').addEventListener('click', e=>{
      const idx = Number(e.currentTarget.dataset.index);
      cart.splice(idx,1);
      updateCartUI();
    });
    cartItemsEl.appendChild(li);
  });
  cartTotalEl.textContent = `Total: ${formatPrice(total)}`;
}

viewCartBtn.addEventListener('click', ()=>{
  cartPanel.classList.toggle('hidden');
});
closeCartBtn.addEventListener('click', ()=> cartPanel.classList.add('hidden'));

document.getElementById('checkout').addEventListener('click', ()=>{
  if(cart.length===0){ alert('Your cart is empty'); return }
  alert(`Checked out ${cart.length} item(s). Total ${cart.reduce((s,i)=>s+i.price,0).toFixed(2)}`);
  cart = [];
  updateCartUI();
  cartPanel.classList.add('hidden');
});

async function loadProducts() {
  try {
    const res = await fetch('products.json');
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    products = await res.json();
    renderProducts();
  } catch (e) {
    console.error('Could not load products', e);
    if(productsGrid) productsGrid.innerHTML = '<p>Error loading products.</p>';
  }
}

initTheme();
loadProducts();
