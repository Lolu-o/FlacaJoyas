/* Las Flacas Joyas - app.js (demo sin backend)
  - Catálogo, filtros, carrito, checkout, reseñas, wishlist
  - Cuenta/registro/login simulado (NO producción)
  - Admin-lite: CRUD de productos (localStorage)
  \Reemplaza por una API real (Node/Express + Postgres) para producción.
*/
const LS_KEYS = {
  PRODUCTS: 'lfj_products_v1',
  CART: 'lfj_cart_v1',
  USER: 'lfj_user_v1',
  WISHLIST: 'lfj_wishlist_v1',
  ORDERS: 'lfj_orders_v1'
};

// --- Seed de productos (ejemplo)
const seedProducts = [
  {
    id:'p1', slug:'aros-aurora-plata-925',
    nombre:'Aros Aurora - Plata 925',
    descripcion:'Aros minimalistas en plata 925 hipoalergénica. Hecho a mano.',
    categoria:'aros', material:'plata', precio:18990, stock:15,
    size: 'pequeno', 
    variantes:[{sku:'P1-PLATA', material:'plata', talla:'Única', color:'plata', precio:18990, stock:15}],
    media:[{url:'assets/aros1.jpg', alt:'Aros Aurora'},{url:'assets/aros1b.jpg', alt:'Aros Aurora detalle'}],
    tags:['best-seller','plata925'], rating:4.8, reviews: 42
  },
  {
    id:'p2', slug:'collar-luna-arcilla-polimerica',
    nombre:'Collar Luna - Arcilla Polimérica',
    descripcion:'Collar con dije luna, arcilla polimérica y cadena acero.',
    categoria:'collares', material:'arcilla', precio:15990, stock:12,
    size: 'mediano', 
    variantes:[{sku:'P2-ARC', material:'arcilla', talla:'45cm', color:'dorado', precio:15990, stock:12}],
    media:[{url:'assets/collar1.jpg', alt:'Collar Luna'}],
    tags:['lifestyle','regalo'], rating:4.7, reviews: 18
  },
  {
    id:'p3', slug:'anillo-aurum-plata-925',
    nombre:'Anillo Aurum - Plata 925',
    descripcion:'Anillo ajustable plata 925, baño oro suave.',
    categoria:'argollas', material:'plata', precio:22990, stock:8, // <-- CAMBIO AQUÍ
    size: 'pequeno', 
    variantes:[{sku:'P3-PL-6', material:'plata', talla:'6', color:'plata', precio:22990, stock:3},
              {sku:'P3-PL-7', material:'plata', talla:'7', color:'plata', precio:22990, stock:3},
              {sku:'P3-PL-8', material:'plata', talla:'8', color:'plata', precio:22990, stock:2}],
    media:[{url:'assets/anillo1.jpg', alt:'Anillo Aurum'}],
    tags:['nuevo'], rating:4.6, reviews: 11
  }
];

function getStore(key, fallback) {
  try{
    const raw = localStorage.getItem(key);
    if(!raw) return fallback;
    return JSON.parse(raw);
  }catch(e){ return fallback; }
}
function setStore(key, val){ localStorage.setItem(key, JSON.stringify(val)); }
function money(clp){ return new Intl.NumberFormat('es-CL',{style:'currency',currency:'CLP'}).format(clp); }

// --- Inicialización
(function init(){
  if(!getStore(LS_KEYS.PRODUCTS, null)){
    setStore(LS_KEYS.PRODUCTS, seedProducts);
  }
  if(!getStore(LS_KEYS.CART, null)){
    setStore(LS_KEYS.CART, {items:[], coupon:null, updatedAt:Date.now()});
  }
  if(!getStore(LS_KEYS.WISHLIST, null)) setStore(LS_KEYS.WISHLIST, []);
  if(!getStore(LS_KEYS.ORDERS, null)) setStore(LS_KEYS.ORDERS, []);
})();

// --- Catálogo y filtros (PLP)
function listProducts({categoria, material, precioMax, sort, q, size}={}){
  let products = getStore(LS_KEYS.PRODUCTS, []);
  if(categoria) products = products.filter(p=>p.categoria===categoria);
  if(material) products = products.filter(p=>p.material===material);
  if(size) products = products.filter(p=>p.size===size); 
  if(precioMax) products = products.filter(p=>p.precio <= +precioMax);
  if(q){
    const s = q.toLowerCase();
    products = products.filter(p=> (p.nombre+p.descripcion+p.tags.join(" ")).toLowerCase().includes(s));
  }
  if(sort){
    if(sort==='price-asc') products.sort((a,b)=>a.precio-b.precio);
    if(sort==='price-desc') products.sort((a,b)=>b.precio-a.precio);
    if(sort==='top') products.sort((a,b)=>b.rating-a.rating);
    if(sort==='new') products.sort((a,b)=>b.id.localeCompare(a.id));
  }
  return products;
}

// --- PDP helpers
function getProductBySlug(slug){
  const products = getStore(LS_KEYS.PRODUCTS, []);
  return products.find(p=>p.slug===slug);
}

function adminGetProduct(id){
  const products = getStore(LS_KEYS.PRODUCTS, []);
  return products.find(p=>p.id===id);
}

// --- Carrito
function getCart(){ return getStore(LS_KEYS.CART, {items:[]}); }
function saveCart(c){ c.updatedAt=Date.now(); setStore(LS_KEYS.CART,c); toast('Carrito actualizado'); }
function addToCart(variantId, qty=1){
  const products = getStore(LS_KEYS.PRODUCTS, []);
  let variant, product;
  for(const p of products){
    variant = p.variantes.find(v=>v.sku===variantId);
    if(variant){ product=p; break; }
  }
  if(!variant) return alert('Variante no encontrada');
  const cart = getCart();
  const existing = cart.items.find(i=>i.sku===variantId);
  if(existing){ existing.qty += qty; }
  else { cart.items.push({sku:variantId, qty, nombre:product.nombre, precio:variant.precio, productId:product.id}); }
  saveCart(cart);
}
function removeFromCart(sku){
  const cart = getCart();
  cart.items = cart.items.filter(i=>i.sku!==sku);
  saveCart(cart);
}
function applyCoupon(code){
  const cart = getCart();
  const map = { "FLACA10": {tipo:"%", valor:10}, "FLACA5K": {tipo:"$", valor:5000, min:30000} };
  const c = map[code.toUpperCase()];
  if(!c) return {ok:false,msg:'Cupón inválido'};
  cart.coupon = {code:code.toUpperCase(),...c};
  saveCart(cart);
  return {ok:true};
}
function cartTotals(cart=null){
  cart = cart || getCart();
  const subtotal = cart.items.reduce((acc,i)=> acc + (i.precio*i.qty),0);
  let descuento = 0;
  if(cart.coupon){
    if(cart.coupon.tipo==='%') descuento = Math.round(subtotal * cart.coupon.valor/100);
    else if(cart.coupon.tipo==='$' && (!cart.coupon.min || subtotal>=cart.coupon.min)) descuento = cart.coupon.valor;
  }
  const envio = subtotal>50000 ? 0 : 3990; // ejemplo regla
  const iva = Math.round((subtotal - descuento + envio) * 0.19 / 1.19); // IVA incluido
  const total = subtotal - descuento + envio;
  return {subtotal, descuento, envio, iva, total};
}

// --- Cuenta (login/registro simulado)
function getUser(){ return getStore(LS_KEYS.USER, null); }
function login(email, pass){
  const demo = {email:'lasflacasjoyas@gamil.com', password:'asd123', nombre:'Admin', rol:'admin'};
  const user = (email===demo.email && pass===demo.password) ? demo : {email, nombre: email.split('@')[0], rol:'cliente'};
  setStore(LS_KEYS.USER, user);
  toast(`Bienvenida, ${user.nombre}`);
  return user;
}
function logout(){ localStorage.removeItem(LS_KEYS.USER); toast('Sesión cerrada'); }

// --- Wishlist
function toggleWishlist(productId){
  const wl = getStore(LS_KEYS.WISHLIST, []);
  const i = wl.indexOf(productId);
  if(i>=0) wl.splice(i,1); else wl.push(productId);
  setStore(LS_KEYS.WISHLIST, wl);
}

// --- Admin lite (CRUD)
function adminList(){ return getStore(LS_KEYS.PRODUCTS, []); }
function adminCreate(p){
  const items = getStore(LS_KEYS.PRODUCTS, []);
  p.id = 'p'+(Date.now());
  items.push(p);
  setStore(LS_KEYS.PRODUCTS, items);
}
function adminUpdate(id, patch){
  const items = getStore(LS_KEYS.PRODUCTS, []);
  const i = items.findIndex(x=>x.id===id);
  if(i<0) return;
  items[i] = {...items[i], ...patch};
  setStore(LS_KEYS.PRODUCTS, items);
}
function adminDelete(id){
  const items = getStore(LS_KEYS.PRODUCTS, []);
  setStore(LS_KEYS.PRODUCTS, items.filter(x=>x.id!==id));
}

// --- Toast
function toast(msg){
  const t = document.querySelector('.toast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1600);
}

// --- Util para cargar params
function getParam(name){
  const url = new URL(location.href);
  return url.searchParams.get(name);
}


//MODO ADMIN

(function() {
    const user = getUser(); 
    
    if (user && user.rol === 'admin') {
      const adminBtn = document.getElementById('admin-btn');
      if (adminBtn) {
        adminBtn.style.display = 'inline-flex';
      }
    }
  })();