// ==================== MARCHÉ ====================
function addToCart(m) { let q = Math.max(1, parseInt(document.getElementById(`qty-${m}`).value) || 0); if (q > 0) { cart[m] = (cart[m] || 0) + q; document.getElementById(`qty-${m}`).value = 0; updTotal(m); renderCart(); } }
function removeFromCart(m) { delete cart[m]; renderCart(); }
function clearCart() { cart = {}; renderCart(); }

function renderCart() {
  let i = Object.entries(cart), t = 0;
  document.getElementById('cart-items').innerHTML = i.length ? i.map(([m, q]) => { let p = S.prices[m], s = p * q; t += s; return `<div class="cart-item"><div class="cart-item-info"><span>${MAT_MAP[m]?.icon || ''}</span><span>${m}</span><span>${q} × ${p} €</span><span>= ${fmtNum(s)} €</span></div><button class="cart-item-remove" onclick="removeFromCart('${m}')">✕</button></div>`; }).join('') : '<div style="color:var(--muted);text-align:center">Panier vide</div>';
  document.getElementById('cart-total').textContent = fmtNum(t) + ' €'; document.getElementById('cart-count').textContent = i.length + ' article' + (i.length > 1 ? 's' : '');
}

function checkoutCart() {
  let i = Object.entries(cart); if (!i.length) return; let t = 0; i.forEach(([m, q]) => t += S.prices[m] * q);
  if (t > S.cash) { toast('Fonds insuffisants', 'err'); return; }
  S.cash -= t; i.forEach(([m, q]) => { S.materialsStock[m] = (S.materialsStock[m] || 0) + q; S.totalSpent += S.prices[m] * q; });
  toast(`Achat validé — ${fmt(t)}`, 'ok'); clearCart(); updateUI(); pushChart(); renderMarket();
}

function filterMarket() { marketSearchTerm = document.getElementById('market-search').value.toLowerCase(); renderMarket(); }

function renderMarket() {
  document.getElementById('mkt-cash').textContent = fmt(S.cash);
  let sortedMaterials = [...MATERIALS].sort((a, b) => a.name.localeCompare(b.name));
  let f = sortedMaterials.filter(m => m.name.toLowerCase().includes(marketSearchTerm));
  document.getElementById('market-grid').innerHTML = f.map(m => { let p = S.prices[m.name], d = p - m.base, tc = d > 3 ? 'up' : d < -3 ? 'down' : 'flat'; return `<div class="mcard"><div class="mcard-top"><span>${m.icon} ${m.name}</span><span class="trend ${tc}">${tc === 'up' ? '▲ +' + d + '€' : tc === 'down' ? '▼ ' + d + '€' : '—'}</span></div><span class="mcard-price">${p} €</span><div>Stock : <b>${S.materialsStock[m.name] || 0}</b></div><div class="qty-row"><button class="qty-btn" onclick="cqty('${m.name}',-10)">−10</button><button class="qty-btn" onclick="cqty('${m.name}',-1)">−</button><input class="qty-input" id="qty-${m.name}" value="0" min="0" oninput="updTotal('${m.name}')"><button class="qty-btn" onclick="cqty('${m.name}',1)">+</button><button class="qty-btn" onclick="cqty('${m.name}',10)">+10</button></div><div class="buy-total" id="total-${m.name}">0 €</div><button class="buy-btn" onclick="addToCart('${m.name}')">🛒 Ajouter</button></div>`; }).join('');
  renderCart();
}

function cqty(m, d) { let i = document.getElementById(`qty-${m}`); i.value = Math.max(0, Math.min(9999, (parseInt(i.value) || 0) + d)); updTotal(m); }
function updTotal(m) { let q = parseInt(document.getElementById(`qty-${m}`).value) || 0; document.getElementById(`total-${m}`).textContent = `${(q * S.prices[m]).toLocaleString('fr-FR')} €`; }