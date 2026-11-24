// WARD marketplace shared helpers
const SB_URL = 'https://ungagrjhdahwgrhsinwi.supabase.co';
const SB_KEY = 'sb_publishable_yP37gVP-FrT3o-xITXMOlg_ZLFHJRfL'; // public key, safe in browser (RLS protects data)
const sb = supabase.createClient(SB_URL, SB_KEY);

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const aed = n => 'AED ' + Number(n || 0).toFixed(2);
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'}) : '—';
const EMIRATES = ['Abu Dhabi','Dubai','Sharjah','Ajman','Umm Al Quwain','Ras Al Khaimah','Fujairah'];

function toast(msg) {
  let t = $('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(t._h); t._h = setTimeout(() => t.style.display = 'none', 3800);
}
function errMsg(e) { return (e && (e.message || e.error_description)) || String(e); }

let RATES = [];
async function loadRates() {
  if (RATES.length) return RATES;
  const { data } = await sb.from('commission_rates').select('*').order('sort');
  RATES = data || []; return RATES;
}
const rateOf = k => (RATES.find(r => r.key === k) || {}).rate || 0;
const catName = k => { const r = RATES.find(r => r.key === k); return r ? `${r.name_en} · ${r.name_ar}` : k; };
const catOptions = sel => RATES.map(r => `<option value="${r.key}" ${r.key === sel ? 'selected' : ''}>${esc(r.name_en)} · ${esc(r.name_ar)} (${r.rate}%)</option>`).join('');

// Estimate what a seller keeps on one sale of `price` (single item, before card fee)
function sellerKeeps(price, cat, plan) {
  const off = plan === 'premium' ? 2 : plan === 'growth' ? 1 : 0;
  let comm = price * Math.max(rateOf(cat) - off, 0) / 100;
  const min = price < 50 ? 3 : price <= 100 ? 5 : 0;
  if (comm < min) comm = min;
  return { comm, keep: price - comm };
}

function imgUrl(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return sb.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

// Cart (per-browser)
const Cart = {
  get() { try { return JSON.parse(localStorage.getItem('ward_cart') || '[]'); } catch { return []; } },
  set(c) { try { localStorage.setItem('ward_cart', JSON.stringify(c)); } catch {} Cart.badge(); },
  add(id, qty) { const c = Cart.get(); const f = c.find(i => i.id === id); f ? f.qty += qty : c.push({ id, qty }); Cart.set(c); },
  count() { return Cart.get().reduce((a, i) => a + i.qty, 0); },
  badge() { const b = $('#cartCount'); if (b) b.textContent = Cart.count(); }
};

function header(active) {
  const h = document.createElement('header');
  h.className = 'top';
  h.innerHTML = `<a href="/"><img src="/logo.png" alt="WARD"></a>
  <nav>
    <a href="/market/" class="${active==='shop'?'on':''}">Shop · تسوّقي</a>
    <a href="/market/seller.html" class="${active==='seller'?'on':''}">Sell on WARD · بيعي معنا</a>
    <a href="/market/cart.html" class="cartlink">Cart · السلة (<span id="cartCount">0</span>)</a>
  </nav>`;
  document.body.prepend(h);
  const f = document.createElement('footer'); f.className = 'mk';
  f.innerHTML = `© 2026 WARD LLC · Sharjah Media City (Shams) · <a href="/terms.html">Terms</a> · <a href="/privacy.html">Privacy</a> · <a href="/conduct.html">Seller code</a>`;
  document.body.appendChild(f);
  Cart.badge();
}

function tag(s) { return `<span class="tag ${esc(s)}">${esc(s)}</span>`; }
