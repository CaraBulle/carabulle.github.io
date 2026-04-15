// ==================== FONCTIONS CONTRATS ====================

let hasStateContract = false; // Variable pour suivre si un contrat d'état existe déjà

function generateStateContract() {
    // Vérifier si un contrat d'état existe déjà
    if (hasStateContract) {
        console.log("Un contrat d'État existe déjà");
        return null;
    }
    
    let highProducts = products.filter(p => p.complexity >= 7);
    if (!highProducts.length) return null;
    let numProducts = 2 + Math.floor(Math.random() * 3);
    let selectedProducts = [];
    let usedIds = new Set();
    for (let i = 0; i < numProducts && i < highProducts.length; i++) {
        let p;
        do { p = highProducts[Math.floor(Math.random() * highProducts.length)]; } while (usedIds.has(p.id));
        usedIds.add(p.id);
        selectedProducts.push({ id: p.id, name: p.name, quantity: (3 + Math.floor(Math.random() * 5)) * 5 });
    }
    let totalReward = selectedProducts.reduce((sum, p) => {
        let prod = products.find(x => x.id === p.id);
        return sum + (prod.basePrice * p.quantity * 2);
    }, 0);
    stateContractBonus = true;
    hasStateContract = true;
    return {
        id: 'state_' + Date.now(),
        client: 'République Française',
        icon: '🇫🇷',
        products: selectedProducts,
        reward: Math.round(totalReward * 1.5),
        timeLimit: 5400000,
        status: 'available',
        isState: true
    };
}

function generateRandomContract(index) {
    let product = products[Math.floor(Math.random() * products.length)];
    let quantity = 5 + Math.floor(Math.random() * 20);
    let reward = Math.round(product.basePrice * quantity * 1.5);
    let clients = ['Industries Aéro', 'Green Energy', 'Tech Innov', 'Auto Plus', 'Construction', 'MegaCorp', 'Startup Inc', 'Logistique Pro', 'Retail World', 'Export Global'];
    let icons = ['✈️', '🌱', '💻', '🚗', '🏗️', '🏢', '🚀', '📦', '🏪', '🌍'];
    let clientIndex = Math.floor(Math.random() * clients.length);
    
    // Bonus si part de marché >= 60% et recherche débloquée
    let ourShare = getOurMarketShare();
    let hasContractBonus = getResearchBonus('contracts') > 1;
    let rewardMultiplier = 1;
    let quantityMultiplier = 1;
    
    if (ourShare >= 60 && hasContractBonus) {
        rewardMultiplier = 1.15;
        quantityMultiplier = 2;
        quantity = Math.floor(quantity * quantityMultiplier);
        reward = Math.round(reward * rewardMultiplier);
    }
    
    return {
        id: 'c_' + Date.now() + '_' + index,
        client: clients[clientIndex],
        icon: icons[clientIndex],
        products: [{ id: product.id, name: product.name, quantity: quantity }],
        reward: reward,
        timeLimit: 1800000 + Math.random() * 3600000,
        status: 'available',
        isState: false,
        isPremium: ourShare >= 60 && hasContractBonus
    };
}

function refreshContracts() {
    let active = activeContracts.filter(c => c.status === 'active' || c.status === 'completed');
    let newContracts = [];
    let maxContracts = 5 + Math.floor(getResearchBonus('capacity'));
    
    // Mettre à jour hasStateContract en fonction des contrats existants
    hasStateContract = active.some(c => c.isState === true) || activeContracts.some(c => c.isState === true);
    
    let needed = Math.max(5, maxContracts) - active.filter(c => c.status === 'available').length;
    
    for (let i = 0; i < needed; i++) {
        // 3% de chance d'avoir un contrat d'état, mais seulement si aucun n'existe déjà
        if (Math.random() < 0.03 && !hasStateContract) {
            let stateContract = generateStateContract();
            if (stateContract) {
                newContracts.push(stateContract);
                hasStateContract = true;
            } else {
                newContracts.push(generateRandomContract(i));
            }
        } else {
            newContracts.push(generateRandomContract(i));
        }
    }
    
    activeContracts = [...active, ...newContracts];
    
    if (activeContracts.length > maxContracts + 5) {
        activeContracts = activeContracts.slice(0, maxContracts + 5);
    }
    
    if (document.getElementById('panel-contracts')?.classList.contains('open')) renderContractsPanel();
}

function acceptContract(contractId) {
    let contract = activeContracts.find(x => x.id === contractId);
    if (!contract || contract.status !== 'available') return;
    contract.status = 'active';
    contract.startTime = Date.now();
    contract.endTime = Date.now() + contract.timeLimit;
    logAcc(`📋 Contrat accepté : ${contract.client}`, 'info');
    toast(`Contrat accepté !`, 'ok');
    if (document.getElementById('panel-contracts')?.classList.contains('open')) renderContractsPanel();
}

function cancelContract(contractId) {
    let contract = activeContracts.find(x => x.id === contractId);
    if (!contract || contract.status !== 'active') return;
    let penalty = Math.round(contract.reward * 0.1);
    showConfirm('Annuler le contrat ?', `L'annulation de ce contrat coûtera ${fmt(penalty)} (10% de la récompense).`, () => {
        if (S.cash < penalty) {
            toast('Fonds insuffisants pour annuler !', 'err');
            return;
        }
        S.cash -= penalty;
        S.totalSpent += penalty;
        updateIncomeExpenseHistory(penalty, false);
        activeContracts = activeContracts.filter(x => x.id !== contractId);
        
        // Perte de réputation
        let repLoss = REPUTATION_LOST_PER_CANCEL;
        removeReputation(repLoss);
        
        logAcc(`❌ Contrat ${contract.client} annulé : -${fmt(penalty)}`, 'neg');
        logProd(`❌ Contrat ${contract.client} annulé : -${repLoss} réputation`, 'neg');
        toast('Contrat annulé', 'ok');
        updateUI();
        pushChart();
        if (document.getElementById('panel-contracts')?.classList.contains('open')) renderContractsPanel();
    });
}

function checkContractProgress() {
    activeContracts.forEach(contract => {
        if (contract.status !== 'active') return;
        
        let allCompleted = contract.products.every(p => (S.productStocks[p.id] || 0) >= p.quantity);
        if (allCompleted) {
            contract.status = 'completed';
            contract.products.forEach(p => {
                S.productStocks[p.id] -= p.quantity;
            });
            S.cash += contract.reward;
            S.totalEarned += contract.reward;
            updateIncomeExpenseHistory(contract.reward, true);
            
            // Gain de réputation pour contrat réussi
            let repGain = REPUTATION_PER_CONTRACT;
            addReputation(repGain);
            
            logAcc(`✅ Contrat ${contract.client} : +${fmt(contract.reward)}`, 'pos');
            logProd(`✅ Contrat ${contract.client} réussi : +${repGain} réputation`, 'pos');
            toast(`Contrat complété !`, 'ok');
            addXP(20);
            updateUI();
            pushChart();
            
            // Si c'était un contrat d'état, on libère la place
            if (contract.isState) {
                hasStateContract = false;
            }
            
            setTimeout(() => {
                activeContracts = activeContracts.filter(x => x.id !== contract.id);
                if (document.getElementById('panel-contracts')?.classList.contains('open')) renderContractsPanel();
            }, 5000);
        } else if (Date.now() > contract.endTime) {
            contract.status = 'available';
            contract.startTime = null;
            contract.endTime = null;
        }
    });
}

function updateContractProgressBars() {
    if (!document.getElementById('panel-contracts')?.classList.contains('open')) return;
    activeContracts.forEach(contract => {
        if (contract.status !== 'active') return;
        let remaining = Math.max(0, contract.endTime - Date.now());
        let percent = (remaining / contract.timeLimit) * 100;
        let gameRemaining = remaining * REAL_TO_GAME_RATIO / 1000;
        let hours = Math.floor(gameRemaining / 3600);
        let minutes = Math.floor((gameRemaining % 3600) / 60);
        
        let fill = document.getElementById(`contract-fill-${contract.id}`);
        let timeEl = document.getElementById(`contract-time-${contract.id}`);
        let pctEl = document.getElementById(`contract-pct-${contract.id}`);
        
        if (fill) fill.style.width = percent + '%';
        if (timeEl) timeEl.textContent = `${hours}h ${minutes}m`;
        if (pctEl) pctEl.textContent = `${Math.round(percent)}%`;
    });
}

function renderContractsPanel() {
    let grid = document.getElementById('contracts-grid');
    if (!grid) return;
    if (!activeContracts.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px">Aucun contrat</div>';
        return;
    }
    
    grid.innerHTML = activeContracts.map(contract => {
        let remaining = contract.status === 'active' ? Math.max(0, contract.endTime - Date.now()) : contract.timeLimit;
        let gameRemaining = remaining * REAL_TO_GAME_RATIO / 1000;
        let hours = Math.floor(gameRemaining / 3600);
        let minutes = Math.floor((gameRemaining % 3600) / 60);
        let percent = (remaining / contract.timeLimit) * 100;
        
        let statusClass = 'available';
        let statusText = 'Disponible';
        if (contract.status === 'active') { statusClass = 'active'; statusText = 'En cours'; }
        else if (contract.status === 'completed') { statusClass = 'completed'; statusText = 'Terminé'; }
        
        let isState = contract.isState;
        let isPremium = contract.isPremium;
        let productsHtml = contract.products.map(p => {
            let stock = S.productStocks[p.id] || 0;
            let progress = Math.min(stock, p.quantity);
            let progPercent = (progress / p.quantity) * 100;
            return `<div class="contract-requirement">
                <span>📦 ${p.name}</span>
                <strong>${progress}/${p.quantity}</strong>
                <div style="width:60px;height:4px;background:var(--border);border-radius:2px;margin-left:8px;overflow:hidden">
                    <div style="width:${progPercent}%;height:100%;background:var(--blue);border-radius:2px"></div>
                </div>
            </div>`;
        }).join('');
        
        let bonusText = isState ? '<div style="font-size:11px;color:var(--gold);margin-top:4px">🏆 Contrat d\'État (récompense majorée)</div>' : '';
        let premiumText = isPremium ? '<div style="font-size:11px;color:var(--purple);margin-top:4px">💎 Contrat Premium (x1.15 récompense)</div>' : '';
        
        return `<div class="contract-card ${statusClass} ${isState ? 'state' : ''} ${isPremium ? 'premium' : ''}">
            <div class="contract-header">
                <span class="contract-icon">${contract.icon}</span>
                <span class="contract-title">${contract.client}</span>
                <span class="contract-badge ${statusClass} ${isState ? 'state' : ''}">${statusText}</span>
            </div>
            ${productsHtml}
            <div class="contract-reward ${isState ? 'state-reward' : ''}">
                <span>🏆 Récompense :</span>
                <span>${contract.reward.toLocaleString('fr-FR')} €</span>
            </div>
            ${bonusText}
            ${premiumText}
            ${contract.status === 'active' ? 
                `<div class="contract-progress">
                    <div class="contract-progress-bar">
                        <div class="contract-progress-fill" id="contract-fill-${contract.id}" style="width:${percent}%"></div>
                    </div>
                    <div class="contract-progress-text">
                        <span id="contract-time-${contract.id}">${hours}h ${minutes}m</span>
                        <span id="contract-pct-${contract.id}">${Math.round(percent)}%</span>
                    </div>
                </div>` : 
                contract.status === 'available' ? 
                `<div class="contract-deadline">⏱️ ${hours}h ${minutes}m</div>` : ''}
            <div class="contract-actions">
                ${contract.status === 'available' ? 
                    `<button class="tb-btn green" style="flex:1" onclick="acceptContract('${contract.id}')">✅ Accepter</button>` : 
                    contract.status === 'active' ? 
                    `<button class="tb-btn" disabled style="flex:1">⏳ En cours...</button>
                     <button class="tb-btn danger" onclick="cancelContract('${contract.id}')">❌ Annuler</button>` : 
                    `<button class="tb-btn purple" disabled style="flex:1">✨ Terminé !</button>`}
            </div>
        </div>`;
    }).join('');
}

// Fonction debug pour forcer un contrat d'état (avec vérification)
function forceStateContract() {
    if (hasStateContract) {
        toast('Un contrat d\'État existe déjà !', 'err');
        return false;
    }
    let stateContract = generateStateContract();
    if (stateContract) {
        activeContracts.push(stateContract);
        hasStateContract = true;
        if (document.getElementById('panel-contracts')?.classList.contains('open')) renderContractsPanel();
        toast('Contrat d\'État généré !', 'ok');
        return true;
    }
    return false;
}