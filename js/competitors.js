// ==================== FONCTIONS CONCURRENTS ====================

function initCompetitors() {
    competitors = [];
    let ourShare = MARKET_SHARE_START;
    let remainingShare = 100 - ourShare;
    
    let numCompetitors = 4;
    let totalAllocated = 0;
    
    for (let i = 0; i < numCompetitors; i++) {
        let name = COMPETITOR_NAMES[Math.floor(Math.random() * COMPETITOR_NAMES.length)];
        let icon = COMPETITOR_ICONS[Math.floor(Math.random() * COMPETITOR_ICONS.length)];
        
        let marketShare;
        if (i === numCompetitors - 1) {
            marketShare = remainingShare - totalAllocated;
        } else {
            let minShare = 15;
            let maxShare = remainingShare - totalAllocated - (minShare * (numCompetitors - i - 1));
            marketShare = Math.floor(Math.random() * (maxShare - minShare + 1)) + minShare;
        }
        marketShare = Math.max(15, Math.min(remainingShare - totalAllocated, marketShare));
        totalAllocated += marketShare;
        
        let threat = marketShare > 25 ? 'high' : marketShare > 18 ? 'medium' : 'low';
        competitors.push({
            id: i,
            name: name,
            icon: icon,
            marketShare: marketShare,
            threat: threat,
            trend: Math.random() > 0.5 ? 'up' : 'down',
            trendValue: 1 + Math.random() * 3
        });
    }
    
    S.reputation = 0;
    S.marketShare = ourShare;
    
    updateCompetitorImpact();
}

function getOurMarketShare() {
    if (!S) return MARKET_SHARE_START;
    return S.marketShare || MARKET_SHARE_START;
}

function getReputationTier() {
    let rep = S.reputation || 0;
    for (let tier of REPUTATION_THRESHOLDS) {
        if (rep >= tier.min && rep <= tier.max) {
            return tier;
        }
    }
    return REPUTATION_THRESHOLDS[0];
}

function getReputationProgress() {
    let rep = S.reputation || 0;
    let currentTier = getReputationTier();
    let nextTier = null;
    for (let i = 0; i < REPUTATION_THRESHOLDS.length; i++) {
        if (REPUTATION_THRESHOLDS[i].name === currentTier.name && i + 1 < REPUTATION_THRESHOLDS.length) {
            nextTier = REPUTATION_THRESHOLDS[i + 1];
            break;
        }
    }
    if (!nextTier) return { progress: 100, needed: 0, current: rep, next: rep };
    
    let needed = nextTier.min - currentTier.min;
    let current = rep - currentTier.min;
    let progress = Math.min(100, Math.max(0, (current / needed) * 100));
    
    return { progress: progress, needed: needed, current: current, next: nextTier.min };
}

function updateMarketShareFromReputation() {
    let rep = S.reputation || 0;
    let currentTier = getReputationTier();
    let maxShare = currentTier.maxMarketShare;
    
    let tierMin = currentTier.min;
    let tierMax = currentTier.max;
    let tierRange = tierMax - tierMin;
    let repInTier = rep - tierMin;
    let progressInTier = tierRange > 0 ? repInTier / tierRange : 1;
    
    let calculatedShare = Math.floor(15 + (maxShare - 15) * Math.min(1, progressInTier));
    S.marketShare = Math.min(maxShare, calculatedShare);
    
    let totalCompetitorShare = 100 - S.marketShare;
    let currentTotal = competitors.reduce((sum, c) => sum + c.marketShare, 0);
    
    if (currentTotal > 0) {
        competitors.forEach(c => {
            let ratio = c.marketShare / currentTotal;
            c.marketShare = Math.max(15, Math.floor(totalCompetitorShare * ratio));
        });
        
        let newTotal = competitors.reduce((sum, c) => sum + c.marketShare, 0);
        let diff = totalCompetitorShare - newTotal;
        if (diff !== 0 && competitors.length > 0) {
            competitors[0].marketShare = Math.max(15, competitors[0].marketShare + diff);
        }
        
        competitors.forEach(c => {
            if (c.marketShare <= 18) c.threat = 'low';
            else if (c.marketShare <= 25) c.threat = 'medium';
            else c.threat = 'high';
        });
    }
    
    updateCompetitorImpact();
}

function addReputation(amount) {
    if (!S) return;
    let oldTier = getReputationTier();
    S.reputation = Math.max(0, (S.reputation || 0) + amount);
    let newTier = getReputationTier();
    updateMarketShareFromReputation();
    refreshCompetitors();
    
    let repEl = document.getElementById('reputation-value');
    let tierEl = document.getElementById('reputation-tier');
    let progressBar = document.getElementById('reputation-progress-fill');
    let progressText = document.getElementById('reputation-progress-text');
    
    if (repEl) repEl.textContent = S.reputation.toFixed(1);
    if (tierEl) {
        tierEl.textContent = newTier.name;
        tierEl.style.color = newTier.color;
    }
    
    let progress = getReputationProgress();
    if (progressBar) progressBar.style.width = progress.progress + '%';
    if (progressText) progressText.textContent = `${Math.floor(progress.current)}/${progress.needed} vers ${progress.next}`;
    
    if (oldTier.name !== newTier.name) {
        toast(`🏆 ${newTier.name} atteint !`, 'ok');
        logProd(`🏆 Nouveau palier atteint : ${newTier.name} !`, 'pos');
    }
}

function removeReputation(amount) {
    if (!S) return;
    let oldTier = getReputationTier();
    S.reputation = Math.max(0, (S.reputation || 0) - amount);
    let newTier = getReputationTier();
    updateMarketShareFromReputation();
    refreshCompetitors();
    
    let repEl = document.getElementById('reputation-value');
    let tierEl = document.getElementById('reputation-tier');
    let progressBar = document.getElementById('reputation-progress-fill');
    let progressText = document.getElementById('reputation-progress-text');
    
    if (repEl) repEl.textContent = S.reputation.toFixed(1);
    if (tierEl) {
        tierEl.textContent = newTier.name;
        tierEl.style.color = newTier.color;
    }
    
    let progress = getReputationProgress();
    if (progressBar) progressBar.style.width = progress.progress + '%';
    if (progressText) progressText.textContent = `${Math.floor(progress.current)}/${progress.needed} vers ${progress.next}`;
    
    if (oldTier.name !== newTier.name) {
        toast(`📉 Rétrogradation : ${newTier.name}`, 'err');
        logProd(`📉 Rétrogradation : ${newTier.name}`, 'neg');
    }
}

function updateCompetitorImpact() {
    let totalShare = competitors.reduce((sum, c) => sum + c.marketShare, 0);
    let competitorReduction = getResearchBonus('competitor');
    let impact = Math.min(50, Math.floor(totalShare * 0.8 * competitorReduction));
    if (S) {
        S.competitorImpact = impact;
        let effectiveMult = Math.max(0.3, 1 - (impact / 100));
        if (S.demandMult === 1.0 || S.demandMult > effectiveMult + 0.05) S.demandMult = effectiveMult;
    }
    return impact;
}

function refreshCompetitors() {
    let impact = updateCompetitorImpact();
    let bar = document.getElementById('competitor-impact-bar');
    if (bar) bar.style.width = Math.min(100, impact) + '%';
    let impactEl = document.getElementById('competitor-demand-impact');
    if (impactEl) impactEl.textContent = '-' + impact + '%';
    
    let ourShare = getOurMarketShare();
    let marketShareEl = document.getElementById('k-market-share');
    if (marketShareEl) marketShareEl.textContent = ourShare + '%';
    
    let repEl = document.getElementById('reputation-value');
    let tierEl = document.getElementById('reputation-tier');
    let progressBar = document.getElementById('reputation-progress-fill');
    let progressText = document.getElementById('reputation-progress-text');
    
    if (repEl && S) repEl.textContent = (S.reputation || 0).toFixed(1);
    if (tierEl && S) {
        let tier = getReputationTier();
        tierEl.textContent = tier.name;
        tierEl.style.color = tier.color;
    }
    
    let progress = getReputationProgress();
    if (progressBar) progressBar.style.width = progress.progress + '%';
    if (progressText) progressText.textContent = `${Math.floor(progress.current)}/${progress.needed} vers ${progress.next}`;
}

function renderCompetitorsPanel() {
    let grid = document.getElementById('competitors-grid');
    if (!grid) return;
    refreshCompetitors();
    
    grid.innerHTML = competitors.map(c => {
        let trendIcon = c.trend === 'up' ? '📈 +' + c.trendValue.toFixed(1) + '%' : '📉 -' + c.trendValue.toFixed(1) + '%';
        let threatClass = c.threat;
        let fillClass = c.marketShare > 25 ? 'high' : c.marketShare > 18 ? 'medium' : 'low';
        let fillPercent = Math.min(100, c.marketShare);
        let cooldown = competitorActionCooldown[c.id] || 0;
        let canAct = cooldown === 0 || cooldown < Date.now();
        
        if (cooldown && cooldown < Date.now()) {
            delete competitorActionCooldown[c.id];
            canAct = true;
        }
        
        return `<div class="competitor-card">
            <div class="competitor-header">
                <span class="competitor-icon">${c.icon}</span>
                <span class="competitor-name">${c.name}</span>
                <span class="competitor-threat ${threatClass}">${c.threat === 'high' ? '🔴 Menace élevée' : c.threat === 'medium' ? '🟠 Menace moyenne' : '🟢 Menace faible'}</span>
            </div>
            <div class="competitor-stats">
                <div class="competitor-stat"><span class="label">Part de marché</span><span>${c.marketShare}%</span></div>
                <div class="competitor-market-share"><div class="competitor-market-fill ${fillClass}" style="width:${fillPercent}%"></div></div>
                <div class="competitor-stat"><span class="label">Tendance</span><span>${trendIcon}</span></div>
            </div>
            <div class="competitor-actions">
                <button class="competitor-action-btn" onclick="askEspionner(${c.id})" ${!canAct ? 'disabled style="opacity:0.5"' : ''}>🕵️ Espionner (${fmt(ESPIONNAGE_COST)})</button>
                <button class="competitor-action-btn danger" onclick="askSaboter(${c.id})" ${!canAct ? 'disabled style="opacity:0.5"' : ''}>💣 Saboter (${fmt(SABOTAGE_COST)})</button>
                <button class="competitor-action-btn gold" onclick="askCollaborer(${c.id})" ${!canAct ? 'disabled style="opacity:0.5"' : ''}>🤝 Collaborer (${fmt(COLLABORATION_COST)})</button>
            </div>
            ${!canAct && cooldown ? `<div style="font-size:10px;color:var(--muted);margin-top:8px">⏱ Action disponible dans ${Math.max(1, Math.ceil((cooldown - Date.now()) / 60000))} min</div>` : ''}
        </div>`;
    }).join('');
}

function askEspionner(competitorId) {
    let c = competitors.find(x => x.id === competitorId);
    if (!c) return;
    showConfirm('🕵️ Espionnage', `Voulez-vous espionner ${c.name} pour ${fmt(ESPIONNAGE_COST)} ? Cela vous donnera des informations sur ses activités.`, () => espionnerConcurrent(competitorId));
}

function askSaboter(competitorId) {
    let c = competitors.find(x => x.id === competitorId);
    if (!c) return;
    showConfirm('💣 Sabotage', `Voulez-vous saboter ${c.name} pour ${fmt(SABOTAGE_COST)} ? Cela réduira sa part de marché de 5% à 10%.`, () => saboterConcurrent(competitorId));
}

function askCollaborer(competitorId) {
    let c = competitors.find(x => x.id === competitorId);
    if (!c) return;
    showConfirm('🤝 Collaboration', `Voulez-vous collaborer avec ${c.name} pour ${fmt(COLLABORATION_COST)} ? Cela augmentera la demande globale de 10-20%.`, () => collaborerConcurrent(competitorId));
}

function espionnerConcurrent(competitorId) {
    let c = competitors.find(x => x.id === competitorId);
    if (!c) return;
    if (competitorActionCooldown[competitorId] && competitorActionCooldown[competitorId] > Date.now()) {
        toast('Action en recharge', 'err');
        return;
    }
    if (S.cash < ESPIONNAGE_COST) {
        toast('Fonds insuffisants', 'err');
        return;
    }
    S.cash -= ESPIONNAGE_COST;
    S.totalSpent += ESPIONNAGE_COST;
    updateIncomeExpenseHistory(ESPIONNAGE_COST, false);
    competitorActionCooldown[competitorId] = Date.now() + 120000;
    let infos = ['Production en hausse', 'Ventes stables', 'Nouveau produit bientôt', 'Difficultés financières', 'Recrutement massif', 'En pleine expansion', 'Rumeurs de rachat'];
    let info = infos[Math.floor(Math.random() * infos.length)];
    toast(`🕵️ ${c.name} : ${info}`, 'ok');
    logAcc(`🕵️ Espionnage de ${c.name} : -${fmt(ESPIONNAGE_COST)}`, 'neg');
    logProd(`🕵️ Espionnage de ${c.name} : ${info}`, 'info');
    updateUI();
    pushChart();
    renderCompetitorsPanel();
}

function saboterConcurrent(competitorId) {
    let c = competitors.find(x => x.id === competitorId);
    if (!c) return;
    if (competitorActionCooldown[competitorId] && competitorActionCooldown[competitorId] > Date.now()) {
        toast('Action en recharge', 'err');
        return;
    }
    if (S.cash < SABOTAGE_COST) {
        toast('Fonds insuffisants', 'err');
        return;
    }
    S.cash -= SABOTAGE_COST;
    S.totalSpent += SABOTAGE_COST;
    updateIncomeExpenseHistory(SABOTAGE_COST, false);
    competitorActionCooldown[competitorId] = Date.now() + 300000;
    
    let isSuccess = Math.random() > 0.5;
    let reduction = isSuccess ? 10 : 5;
    let oldShare = c.marketShare;
    let newShare = Math.max(5, c.marketShare - reduction);
    let actualReduction = oldShare - newShare;
    c.marketShare = newShare;
    
    let ourShare = getOurMarketShare();
    let newOurShare = Math.min(95, ourShare + actualReduction);
    S.marketShare = newOurShare;
    
    if (isSuccess) {
        let repGain = 5;
        addReputation(repGain);
        toast(`💣 Succès ! ${c.name} : Part de marché -${actualReduction}% ! +${repGain} réputation`, 'ok');
        logAcc(`💣 Sabotage réussi de ${c.name} : -${fmt(SABOTAGE_COST)}`, 'neg');
        logProd(`💣 Sabotage réussi de ${c.name} : -${actualReduction}% de parts de marché`, 'pos');
    } else {
        toast(`⚠️ Échec partiel ! ${c.name} n'a perdu que ${actualReduction}%...`, 'err');
        logAcc(`⚠️ Sabotage de ${c.name} : -${fmt(SABOTAGE_COST)}`, 'neg');
        logProd(`⚠️ Sabotage de ${c.name} : -${actualReduction}% seulement`, 'neg');
    }
    
    if (c.marketShare <= 18) c.threat = 'low';
    else if (c.marketShare <= 25) c.threat = 'medium';
    else c.threat = 'high';
    
    updateCompetitorImpact();
    if (S.demandMult > 0.3) S.demandMult = Math.min(1, S.demandMult + 0.05);
    updateUI();
    pushChart();
    renderCompetitorsPanel();
    if (document.getElementById('panel-sell')?.classList.contains('open')) renderSellPanel();
}

function collaborerConcurrent(competitorId) {
    let c = competitors.find(x => x.id === competitorId);
    if (!c) return;
    if (competitorActionCooldown[competitorId] && competitorActionCooldown[competitorId] > Date.now()) {
        toast('Action en recharge', 'err');
        return;
    }
    if (S.cash < COLLABORATION_COST) {
        toast('Fonds insuffisants', 'err');
        return;
    }
    S.cash -= COLLABORATION_COST;
    S.totalSpent += COLLABORATION_COST;
    updateIncomeExpenseHistory(COLLABORATION_COST, false);
    competitorActionCooldown[competitorId] = Date.now() + 180000;
    let gain = Math.min(20, Math.floor(Math.random() * 15) + 5);
    let demandBonus = Math.floor(Math.random() * 20) + 10;
    S.demandMult = Math.min(2, S.demandMult + (demandBonus / 100));
    
    c.marketShare = Math.min(40, c.marketShare + gain);
    let ourShare = getOurMarketShare();
    let newShare = Math.max(1, ourShare - gain);
    S.marketShare = newShare;
    
    let repLoss = 3;
    removeReputation(repLoss);
    
    if (c.marketShare <= 18) c.threat = 'low';
    else if (c.marketShare <= 25) c.threat = 'medium';
    else c.threat = 'high';
    
    logAcc(`🤝 Collaboration avec ${c.name} : -${fmt(COLLABORATION_COST)}`, 'neg');
    logProd(`🤝 Collaboration avec ${c.name} : demande +${demandBonus}%, -${repLoss} réputation`, 'info');
    updateCompetitorImpact();
    toast(`🤝 ${c.name} : Collaboration réussie ! Demande +${demandBonus}%`, 'ok');
    updateUI();
    pushChart();
    renderCompetitorsPanel();
    if (document.getElementById('panel-sell')?.classList.contains('open')) renderSellPanel();
}

function updateCompetitorTrends() {
    let ourShare = getOurMarketShare();
    let totalCompetitorShare = 100 - ourShare;
    let currentTotal = competitors.reduce((sum, c) => sum + c.marketShare, 0);
    
    competitors.forEach(c => {
        let changePercent = (Math.random() - 0.2) * 0.4;
        let change = Math.floor(c.marketShare * changePercent);
        c.marketShare = Math.max(5, Math.min(60, c.marketShare + change));
        
        if (c.marketShare <= 18) c.threat = 'low';
        else if (c.marketShare <= 25) c.threat = 'medium';
        else c.threat = 'high';
        c.trend = change > 0 ? 'up' : 'down';
        c.trendValue = Math.abs(Math.round(change * 10) / 10);
    });
    
    let newTotal = competitors.reduce((sum, c) => sum + c.marketShare, 0);
    if (newTotal > 0) {
        competitors.forEach(c => {
            let ratio = c.marketShare / newTotal;
            c.marketShare = Math.max(5, Math.floor(totalCompetitorShare * ratio));
        });
        
        let finalTotal = competitors.reduce((sum, c) => sum + c.marketShare, 0);
        let diff = totalCompetitorShare - finalTotal;
        if (diff !== 0 && competitors.length > 0) {
            competitors[0].marketShare = Math.max(5, competitors[0].marketShare + diff);
        }
    }
    
    let impact = updateCompetitorImpact();
    if (S) {
        let baseMult = Math.max(0.3, 1 - (impact / 100));
        if (S.demandMult > baseMult + 0.1) S.demandMult = Math.max(baseMult, S.demandMult - 0.02);
        else if (S.demandMult < baseMult - 0.1) S.demandMult = Math.min(1, S.demandMult + 0.02);
    }
    refreshCompetitors();
    if (document.getElementById('panel-competitors')?.classList.contains('open')) renderCompetitorsPanel();
    if (document.getElementById('panel-sell')?.classList.contains('open')) renderSellPanel();
}

function checkCompetitorCooldowns() {
    let now = Date.now();
    let updated = false;
    Object.keys(competitorActionCooldown).forEach(id => {
        if (now >= competitorActionCooldown[id]) {
            delete competitorActionCooldown[id];
            updated = true;
        }
    });
    if (updated && document.getElementById('panel-competitors')?.classList.contains('open')) renderCompetitorsPanel();
}