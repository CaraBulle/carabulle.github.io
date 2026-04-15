// ==================== FONCTIONS VENTE ====================

function playCashSound() {
    let audio = new Audio('sounds/caisse.mp3');
    audio.volume = typeof window.soundVolume !== 'undefined' ? window.soundVolume : 0.4;
    audio.play().catch(e => console.log("Audio play failed:", e));
}

function switchSellTab(tier) {
    let level = getLevelFromXP(S.xp);
    if (tier === 'mid' && level < 5) { toast('Niveau 5 requis pour voir les produits Mid-game !', 'err'); return; }
    if (tier === 'last' && level < 15) { toast('Niveau 15 requis pour voir les produits Last-game !', 'err'); return; }
    if (tier === 'end' && level < 30) { toast('Niveau 30 requis pour voir les produits End-game !', 'err'); return; }
    currentSellTab = tier;
    document.querySelectorAll('#sell-tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`#sell-tabs .tab[data-tier="${tier}"]`).classList.add('active');
    renderSellPanel();
}

function filterSell() {
    sellSearchTerm = document.getElementById('sell-search').value.toLowerCase();
    renderSellPanel();
}

function onPriceChange(productId) {
    let p = products.find(x => x.id == productId);
    if (!p) return;
    let demand = S.productDemands[p.id] || p.baseDemand;
    let price = Math.max(1, parseInt(document.getElementById(`sprice-${productId}`).value) || p.basePrice);
    let demandFactor = Math.max(0.2, Math.min(2.0, p.baseDemand / price));
    let newDemand = Math.min(p.baseDemand * 3, Math.max(1, Math.floor(p.baseDemand * demandFactor)));
    S.productDemands[p.id] = newDemand;
    let percent = Math.min(100, Math.round(S.productDemands[p.id] / p.baseDemand * 100));
    document.getElementById(`dbar-${productId}`).style.width = percent + '%';
    document.getElementById(`dval-${productId}`).textContent = `${S.productDemands[p.id]} produits demandés`;
    onSellQtyChange(productId);
}

function onSellQtyChange(productId) {
    let p = products.find(x => x.id == productId);
    if (!p) return;
    let price = Math.max(1, parseInt(document.getElementById(`sprice-${productId}`)?.value) || 1);
    let qty = parseInt(document.getElementById(`sqty-${productId}`)?.value) || 0;
    qty = Math.min(qty, S.productStocks[p.id] || 0);
    let total = qty * price;
    let tax = Math.round(total * TAX_RATE);
    document.getElementById(`stotal-${productId}`).textContent = `= ${total.toLocaleString('fr-FR')} €`;
    document.getElementById(`stax-${productId}`).textContent = `Taxe = ${tax.toLocaleString('fr-FR')} €`;
}

function sellProduct(productId) {
    let p = products.find(x => x.id == productId);
    if (!p) return;
    let stock = S.productStocks[p.id] || 0;
    if (!stock) return;
    let qty = Math.min(stock, parseInt(document.getElementById(`sqty-${productId}`)?.value) || 0);
    if (!qty) return;
    let demand = S.productDemands[p.id] || p.baseDemand;
    if (qty > demand) {
        toast(`Demande insuffisante ! (max: ${demand} produits demandés)`, 'err');
        return;
    }
    let price = Math.max(1, parseInt(document.getElementById(`sprice-${productId}`)?.value) || p.basePrice);
    let revenue = qty * price;
    pendingTaxes += Math.round(revenue * TAX_RATE);
    S.productStocks[p.id] = stock - qty;
    S.productDemands[p.id] = demand - qty;
    S.cash += revenue;
    S.totalEarned += revenue;
    updateIncomeExpenseHistory(revenue, true);
    logAcc(`🏷️ Vente ${qty}× ${p.name} : +${fmt(revenue)}`, 'pos');
    
    let repGain = qty * REPUTATION_PER_SALE;
    addReputation(repGain);
    logProd(`📈 Vente de ${qty}× ${p.name} : +${repGain.toFixed(1)} réputation`, 'pos');
    
    playCashSound();
    
    updateUI();
    renderSellPanel();
    pushChart();
    checkContractProgress();
    checkQuestProgress();
    if (document.getElementById('panel-demand')?.classList.contains('open')) renderDemandPanel();
}

function quickSellProduct(productId) {
    let p = products.find(x => x.id == productId);
    if (!p) return;
    let stock = S.productStocks[p.id] || 0;
    if (!stock) return;
    let qty = Math.min(stock, parseInt(document.getElementById(`qs-${productId}`)?.value) || 1);
    let demand = S.productDemands[p.id] || p.baseDemand;
    if (qty > demand) {
        toast(`Demande insuffisante ! (max: ${demand} produits demandés)`, 'err');
        return;
    }
    let revenue = qty * p.basePrice;
    pendingTaxes += Math.round(revenue * TAX_RATE);
    S.productStocks[p.id] = stock - qty;
    S.productDemands[p.id] = demand - qty;
    S.cash += revenue;
    S.totalEarned += revenue;
    updateIncomeExpenseHistory(revenue, true);
    logAcc(`⚡ Vente rapide ${qty}× ${p.name} : +${fmt(revenue)} (vente au prix conseillé)`, 'pos');
    
    let repGain = qty * REPUTATION_PER_SALE;
    addReputation(repGain);
    logProd(`📈 Vente rapide de ${qty}× ${p.name} : +${repGain.toFixed(1)} réputation`, 'pos');
    
    playCashSound();
    
    updateUI();
    pushChart();
    checkContractProgress();
    checkQuestProgress();
    if (document.getElementById('panel-demand')?.classList.contains('open')) renderDemandPanel();
}

function updateDemands() {
    products.forEach(p => {
        let demandBonus = getResearchBonus('demand');
        S.productDemands[p.id] = Math.floor(Math.random() * (p.baseDemand + 1)) * demandBonus;
    });
    if (document.getElementById('panel-demand')?.classList.contains('open')) renderDemandPanel();
    if (document.getElementById('panel-sell')?.classList.contains('open')) renderSellPanel();
}

function filterDemand() {
    demandSearchTerm = document.getElementById('demand-search').value.toLowerCase();
    renderDemandPanel();
}

function renderDemandPanel() {
    let filtered = products.filter(p => p.name.toLowerCase().includes(demandSearchTerm));
    filtered.sort((a, b) => a.name.localeCompare(b.name));
    let grid = document.getElementById('demand-grid');
    if (!grid) return;
    
    grid.innerHTML = filtered.map(p => {
        let demand = S.productDemands[p.id] || p.baseDemand;
        let percent = Math.min(100, Math.round(demand / p.baseDemand * 100));
        let level = percent >= 70 ? 'high' : percent >= 30 ? 'medium' : 'low';
        return `<div class="demand-card">
            <div class="demand-card-top">
                <span>${p.name}</span>
                <span class="demand-card-badge ${level}">${level === 'high' ? 'Forte' : level === 'medium' ? 'Moyenne' : 'Faible'}</span>
            </div>
            <div>Prix conseillé : ${p.basePrice} €</div>
            <div class="demand-bar-large">
                <div class="demand-bar-large-fill" style="width:${percent}%;background:${level === 'high' ? 'var(--green)' : level === 'medium' ? 'var(--amber)' : 'var(--red)'}"></div>
            </div>
            <div class="demand-stats">
                <span>Demande : ${demand} produits demandés</span>
                <span>${percent}%</span>
            </div>
        </div>`;
    }).join('');
}