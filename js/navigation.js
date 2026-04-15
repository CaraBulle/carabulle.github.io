// ==================== SYSTÈME DE NAVIGATION COMPLET ====================

// Fermer tous les panels ouverts
function closeAllPanels() {
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.remove('open');
    });
}

// Ouvrir un panel spécifique
function openPanel(panelName) {
    closeAllPanels();
    let panel = document.getElementById(`panel-${panelName}`);
    if (panel) {
        panel.classList.add('open');
        refreshPanelContent(panelName);
    } else {
        console.error(`Panel non trouvé: panel-${panelName}`);
    }
}

// Fermer un panel spécifique
function closePanel(panelName) {
    let panel = document.getElementById(`panel-${panelName}`);
    if (panel) {
        panel.classList.remove('open');
    }
}

// Pop-up panier avant fermeture
function showCartConfirmBeforeClose(panelName) {
    let items = Object.entries(cart);
    if (items.length === 0) {
        let panel = document.getElementById(`panel-${panelName}`);
        if (panel) panel.classList.remove('open');
        return;
    }
    
    let itemsHtml = items.map(([m, q]) => {
        let price = S.prices[m];
        return `<div class="cart-confirm-item">
            <span class="cart-confirm-icon">${MAT_MAP[m]?.icon || '📦'}</span>
            <span class="cart-confirm-name">${m}</span>
            <span class="cart-confirm-qty">×${q}</span>
            <span class="cart-confirm-price">${(price * q).toLocaleString('fr-FR')} €</span>
        </div>`;
    }).join('');
    
    let total = items.reduce((sum, [m, q]) => sum + S.prices[m] * q, 0);
    let msg = `<div class="cart-confirm-header">🛒 Votre panier</div>
        <div class="cart-confirm-items" style="max-height:300px; overflow-y:auto; margin-bottom:16px; border:1px solid var(--border); border-radius:12px; background:var(--surface2);">
            ${itemsHtml}
        </div>
        <div class="cart-confirm-total" style="display:flex; justify-content:space-between; align-items:center; padding:14px 18px; background:var(--surface3); border-radius:12px; margin-bottom:20px;">
            <span>Total</span>
            <span class="cart-confirm-total-amount" style="color:var(--green); font-size:22px;">${total.toLocaleString('fr-FR')} €</span>
        </div>
        <p class="cart-confirm-message" style="color:var(--muted); text-align:center; margin-bottom:20px;">Que voulez-vous faire ?</p>`;
    
    let actions = `<button class="tb-btn green cart-confirm-validate" id="cart-validate" style="flex:1;">✅ Valider et payer</button>
        <button class="tb-btn danger cart-confirm-clear" id="cart-clear" style="flex:1;">🗑️ Vider le panier</button>
        <button class="tb-btn cart-confirm-keep" id="cart-keep" style="flex:1;">📦 Garder et continuer</button>`;
    
    showConfirm('', msg, () => {}, actions);
    
    setTimeout(() => {
        let validateBtn = document.getElementById('cart-validate');
        let clearBtn = document.getElementById('cart-clear');
        let keepBtn = document.getElementById('cart-keep');
        
        if (validateBtn) {
            validateBtn.onclick = () => {
                checkoutCart();
                closeConfirm();
                let panel = document.getElementById(`panel-${panelName}`);
                if (panel) panel.classList.remove('open');
            };
        }
        
        if (clearBtn) {
            clearBtn.onclick = () => {
                clearCart();
                closeConfirm();
                let panel = document.getElementById(`panel-${panelName}`);
                if (panel) panel.classList.remove('open');
            };
        }
        
        if (keepBtn) {
            keepBtn.onclick = () => {
                closeConfirm();
                let panel = document.getElementById(`panel-${panelName}`);
                if (panel) panel.classList.remove('open');
            };
        }
    }, 10);
}

// Rafraîchir le contenu d'un panel
function refreshPanelContent(panelName) {
    switch(panelName) {
        case 'market': if (typeof renderMarket === 'function') renderMarket(); break;
        case 'production': if (typeof renderProdPanel === 'function') renderProdPanel(); break;
        case 'sell': if (typeof renderSellPanel === 'function') renderSellPanel(); break;
        case 'demand': if (typeof renderDemandPanel === 'function') renderDemandPanel(); break;
        case 'stock': if (typeof renderStockPanel === 'function') renderStockPanel(); break;
        case 'employees': if (typeof renderEmployeePanel === 'function') renderEmployeePanel(); break;
        case 'machines': if (typeof renderMachinesPanel === 'function') renderMachinesPanel(); break;
        case 'contracts': if (typeof renderContractsPanel === 'function') renderContractsPanel(); break;
        case 'competitors': if (typeof renderCompetitorsPanel === 'function') renderCompetitorsPanel(); break;
        case 'research': if (typeof renderResearchPanel === 'function') renderResearchPanel(); break;
        case 'accounting': refreshAccountingPanel(); break;
        case 'bank': refreshBankPanel(); break;
        default: console.log(`Panel non géré: ${panelName}`);
    }
}

function refreshAccountingPanel() {
    if (typeof initAccountingCharts === 'function') initAccountingCharts();
    if (typeof renderAccountingPanel === 'function') renderAccountingPanel();
    if (typeof renderUtilitiesPanel === 'function') renderUtilitiesPanel();
}

function refreshBankPanel() {
    if (typeof updateLoanDisplay === 'function') updateLoanDisplay(1000);
}

// Fonctions raccourcis
function openProduction() { openPanel('production'); }
function openSell() { openPanel('sell'); }
function openMarket() { openPanel('market'); }
function openStock() { openPanel('stock'); }
function openDemand() { openPanel('demand'); }
function openEmployees() { openPanel('employees'); }
function openMachines() { openPanel('machines'); }
function openContracts() { openPanel('contracts'); }
function openCompetitors() { openPanel('competitors'); }
function openResearch() { openPanel('research'); }
function openAccounting() { openPanel('accounting'); }
function openBank() { openPanel('bank'); }

// Alias
function openProductionPanel() { openPanel('production'); }
function openSellPanel() { openPanel('sell'); }
function openMarketPanel() { openPanel('market'); }
function openStockPanel() { openPanel('stock'); }
function openDemandPanel() { openPanel('demand'); }
function openEmployeesPanel() { openPanel('employees'); }
function openMachinesPanel() { openPanel('machines'); }
function openContractsPanel() { openPanel('contracts'); }
function openCompetitorsPanel() { openPanel('competitors'); }
function openResearchPanel() { openPanel('research'); }
function openAccountingPanel() { openPanel('accounting'); }
function openBankPanel() { openPanel('bank'); }