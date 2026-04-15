// ==================== FONCTIONS MARCHÉ ====================

function playCashSound() {
    let audio = new Audio('sounds/caisse.mp3');
    audio.volume = typeof window.soundVolume !== 'undefined' ? window.soundVolume : 0.4;
    audio.play().catch(e => console.log("Audio play failed:", e));
}

function filterMarket() {
    marketSearchTerm = document.getElementById('market-search').value.toLowerCase();
    renderMarket();
}

function cqty(material, delta) {
    let input = document.getElementById(`qty-${material}`);
    if (input) {
        input.value = Math.max(0, Math.min(9999, (parseInt(input.value) || 0) + delta));
        updTotal(material);
    }
}

function updTotal(material) {
    let qty = parseInt(document.getElementById(`qty-${material}`).value) || 0;
    let total = qty * S.prices[material];
    document.getElementById(`total-${material}`).textContent = total.toLocaleString('fr-FR') + ' €';
}

function addToCart(material) {
    let qty = Math.max(1, parseInt(document.getElementById(`qty-${material}`).value) || 0);
    if (qty > 0) {
        let currentTotal = getCartTotal();
        let newTotal = currentTotal + (qty * S.prices[material]);
        if (newTotal > 100000) {
            toast('Limite de 100 000€ atteinte pour le panier !', 'err');
            return;
        }
        cart[material] = (cart[material] || 0) + qty;
        document.getElementById(`qty-${material}`).value = 0;
        updTotal(material);
        renderCart();
    }
}

function getCartTotal() {
    let total = 0;
    for (let [m, q] of Object.entries(cart)) {
        total += S.prices[m] * q;
    }
    return total;
}

function removeFromCart(material) {
    delete cart[material];
    renderCart();
}

function clearCart() {
    cart = {};
    renderCart();
}

function renderCart() {
    let items = Object.entries(cart);
    let total = getCartTotal();
    let itemsDiv = document.getElementById('cart-items');
    if (!itemsDiv) return;
    
    if (items.length) {
        itemsDiv.innerHTML = items.map(([m, q]) => {
            let price = S.prices[m];
            let subtotal = price * q;
            return `<div class="cart-item">
                <div class="cart-item-info">
                    <span>${MAT_MAP[m]?.icon || '📦'}</span>
                    <span>${m}</span>
                    <span>${q} × ${price} €</span>
                    <span>= ${subtotal.toLocaleString('fr-FR')} €</span>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart('${m}')">✕</button>
            </div>`;
        }).join('');
    } else {
        itemsDiv.innerHTML = '<div style="color:var(--muted);text-align:center">Panier vide</div>';
    }
    
    document.getElementById('cart-total').textContent = total.toLocaleString('fr-FR') + ' €';
    document.getElementById('cart-count').textContent = items.length + ' article' + (items.length > 1 ? 's' : '');
}

function checkoutCart() {
    let items = Object.entries(cart);
    if (!items.length) return;
    
    let total = getCartTotal();
    
    if (total > S.cash) {
        toast('Fonds insuffisants', 'err');
        return;
    }
    
    S.cash -= total;
    items.forEach(([m, q]) => {
        S.materialsStock[m] = (S.materialsStock[m] || 0) + q;
        S.totalSpent += S.prices[m] * q;
        updateIncomeExpenseHistory(S.prices[m] * q, false);
        logAcc(`🛒 Achat de ${q}× ${m} : -${fmt(S.prices[m] * q)}`, 'neg');
    });
    
    playCashSound();
    
    toast(`Achat validé — ${fmt(total)}`, 'ok');
    clearCart();
    updateUI();
    pushChart();
    renderMarket();
}

function renderMarket() {
    let cashEl = document.getElementById('mkt-cash');
    if (cashEl) cashEl.innerHTML = formatCash(S.cash);
    
    let sortedMaterials = [...MATERIALS].sort((a, b) => a.name.localeCompare(b.name));
    let filtered = sortedMaterials.filter(m => m.name.toLowerCase().includes(marketSearchTerm));
    
    let grid = document.getElementById('market-grid');
    if (!grid) return;
    
    grid.innerHTML = filtered.map(m => {
        let price = S.prices[m.name];
        let diff = price - m.base;
        let trendClass = diff > 3 ? 'up' : diff < -3 ? 'down' : 'flat';
        let trendText = trendClass === 'up' ? '▲ +' + diff + '€' : trendClass === 'down' ? '▼ ' + Math.abs(diff) + '€' : '—';
        
        return `<div class="mcard">
            <div class="mcard-top">
                <span>${m.icon} ${m.name}</span>
                <span class="trend ${trendClass}">${trendText}</span>
            </div>
            <span class="mcard-price">${price} €</span>
            <div>Stock : <b>${S.materialsStock[m.name] || 0}</b></div>
            <div class="qty-row-modern">
                <button class="qty-btn-modern" onclick="cqty('${m.name}',-10)">-10</button>
                <button class="qty-btn-modern" onclick="cqty('${m.name}',-1)">-</button>
                <input class="qty-input-modern" id="qty-${m.name}" value="0" min="0" oninput="updTotal('${m.name}')">
                <button class="qty-btn-modern" onclick="cqty('${m.name}',1)">+</button>
                <button class="qty-btn-modern" onclick="cqty('${m.name}',10)">+10</button>
            </div>
            <div class="buy-total" id="total-${m.name}">0 €</div>
            <button class="buy-btn" onclick="addToCart('${m.name}')">🛒 Ajouter</button>
        </div>`;
    }).join('');
    renderCart();
}

function fluctuatePrices() {
    if (!S) return;
    MATERIALS.forEach(m => {
        let delta = (Math.random() - 0.5) * 0.15;
        S.prices[m.name] = Math.max(Math.round(m.base * 0.4), Math.round(S.prices[m.name] * (1 + delta)));
    });
    if (document.getElementById('panel-market')?.classList.contains('open')) renderMarket();
}