/* Las Flacas Joyas - app.js (Prototipo Funcional) */

const LS_KEYS = {
  PRODUCTS: 'lfj_products_v2', // Cambiamos versión para resetear la data antigua de plata
  CART: 'lfj_cart_v1',
  USER: 'lfj_session_v1',
  USERS_DB: 'lfj_users_db_v1', // "Tabla" de usuarios registrados
  WISHLIST: 'lfj_wishlist_v1',
  ORDERS: 'lfj_orders_v1'
};

// --- Seed de productos
const seedProducts = [
  {
    id:'p1', slug:'aros-corazones',
    nombre:'Aros Corazones - arcilla', 
    descripcion:'Aros con diseño de corazón en arcilla.',
    categoria:'aros', material:'arcilla', precio:18990, stock:15,
    size: 'pequeno', 
    variantes:[{sku:'P1-COR', material:'arcilla', talla:'Única', color:'rojo', precio:18990, stock:15}],
    // AQUÍ ESTÁ EL CAMBIO: Ruta relativa
    media:[{url:'assets/Aros_Corazones.png', alt:'Aros Corazones'}], 
    tags:['best-seller','hipoalergenico'], rating:4.8, reviews: 42
  },
  {
    id:'p2', slug:'collar-flores-amarillas',
    nombre:'Collar Flores Amarillas',
    descripcion:'Collar delicado con flores amarillas en arcilla polimérica.',
    categoria:'collares', material:'arcilla', precio:15990, stock:12,
    size: 'mediano', 
    variantes:[{sku:'P2-AMA', material:'arcilla', talla:'45cm', color:'amarillo', precio:15990, stock:12}],
    media:[{url:'assets/Collar_Flores_Amarillas.png', alt:'Collar Flores'}],
    tags:['lifestyle','regalo'], rating:4.7, reviews: 18
  },
  {
    id:'p3', slug:'argollas-flores-azules',
    nombre:'Argollas Flores Azules',
    descripcion:'Argollas con flores azules moldeadas a mano. Diseño exclusivo.',
    categoria:'argollas', material:'arcilla', precio:22990, stock:8,
    size: 'pequeno', 
    variantes:[{sku:'P3-AZUL', material:'arcilla', talla:'Única', color:'azul', precio:22990, stock:3}],
    media:[{url:'assets/Argollas_Flores_Azules.png', alt:'Argollas Azules'}],
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
  if(!getStore(LS_KEYS.USERS_DB, null)) setStore(LS_KEYS.USERS_DB, []); // Base de datos de usuarios vacía
})();

// --- Catálogo y filtros
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
    if(sort==='top') products.sort((a,b)=>b.rating-a.rating); // Lógica de "Más vendidos" basada en rating
    if(sort==='new') products.sort((a,b)=>b.id.localeCompare(a.id));
  }
  return products;
}

function getBestSellers(limit = 4) {
    // Reutilizamos la lógica de sort 'top'
    return listProducts({ sort: 'top' }).slice(0, limit);
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
  const envio = subtotal>50000 ? 0 : 3990;
  const iva = Math.round((subtotal - descuento + envio) * 0.19 / 1.19);
  const total = subtotal - descuento + envio;
  return {subtotal, descuento, envio, iva, total};
}

// --- AUTH: Login & Registro (Estricto) ---

function getUser(){ return getStore(LS_KEYS.USER, null); }

// Nuevo: Registro de usuarios
function register(nombre, email, password) {
    const users = getStore(LS_KEYS.USERS_DB, []);
    
    // Validación básica
    if(users.find(u => u.email === email)) {
        return { ok: false, msg: 'El email ya está registrado.' };
    }
    
    const newUser = { nombre, email, password, rol: 'cliente', id: 'u-'+Date.now() };
    users.push(newUser);
    setStore(LS_KEYS.USERS_DB, users);
    
    // Auto-login
    setStore(LS_KEYS.USER, { nombre: newUser.nombre, email: newUser.email, rol: newUser.rol });
    return { ok: true };
}

function login(email, pass){
  const cleanEmail = email.trim();

  // 1. Verificar Admin (Credenciales Hardcodeadas)
  const adminDemo = {email:'lasflacasjoyas@gmail.com', password:'asd123', nombre:'Admin', rol:'admin'};
  
  if(cleanEmail === adminDemo.email && pass === adminDemo.password) {
      setStore(LS_KEYS.USER, adminDemo);
      toast(`Bienvenida, Admin`);
      return adminDemo;
  }

  // 2. Verificar Usuarios Registrados (LocalStorage)
  const users = getStore(LS_KEYS.USERS_DB, []);
  const foundUser = users.find(u => u.email === cleanEmail && u.password === pass);

  if (foundUser) {
      // Creamos sesión segura sin guardar password en sesión
      const sessionUser = { nombre: foundUser.nombre, email: foundUser.email, rol: foundUser.rol };
      setStore(LS_KEYS.USER, sessionUser);
      toast(`Hola de nuevo, ${foundUser.nombre}`);
      return sessionUser;
  }

  // 3. Fallo
  return null;
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

function getParam(name){
  const url = new URL(location.href);
  return url.searchParams.get(name);
}

// Init UI Admin check
(function() {
    const user = getUser(); 
    if (user && user.rol === 'admin') {
      const adminBtn = document.getElementById('admin-btn');
      if (adminBtn) adminBtn.style.display = 'inline-flex';
    }
})();