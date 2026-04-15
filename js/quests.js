// ==================== QUÊTES SECONDAIRES ====================

function generateQuest() {
    let level = getLevelFromXP(S.xp);
    let quests = [
        { name: "Production en série", desc: "Produisez 20 produits", check: (s) => Object.values(s.productStocks).reduce((a, b) => a + b, 0) >= 20, rewardMoney: 2000, rewardXP: 40 },
        { name: "Vente record", desc: "Vendez 10 produits", check: (s) => s.totalEarned >= 10000, rewardMoney: 3000, rewardXP: 60 },
        { name: "Machine neuve", desc: "Achetez une machine", check: (s) => machines.length >= 2, rewardMoney: 5000, rewardXP: 80 },
        { name: "Contrat gagnant", desc: "Complétez 2 contrats", check: (s) => activeContracts.filter(c => c.status === 'completed').length >= 2, rewardMoney: 4000, rewardXP: 100 },
        { name: "Trésorerie positive", desc: "Atteignez 50000€", check: (s) => s.cash >= 50000, rewardMoney: 0, rewardXP: 120 },
        { name: "Réparation express", desc: "Réparer 2 machines", check: (s) => Object.keys(repairsInProgress).length >= 2, rewardMoney: 3000, rewardXP: 60 },
        { name: "Recrutement massif", desc: "Embauchez 3 employés", check: (s) => employees.length >= 8, rewardMoney: 5000, rewardXP: 100 },
        { name: "Concurrent affaibli", desc: "Sabotez un concurrent", check: (s) => competitors.some(c => c.marketShare < 10), rewardMoney: 8000, rewardXP: 150 },
        { name: "Recherche avancée", desc: "Débloquez une recherche", check: (s) => researches.filter(r => r.unlocked).length >= 1, rewardMoney: 10000, rewardXP: 200 },
        { name: "Niveau supérieur", desc: "Atteignez le niveau 5", check: (s) => getLevelFromXP(s.xp) >= 5, rewardMoney: 15000, rewardXP: 300 }
    ];
    
    let available = quests.filter(q => !q.check(S));
    if (available.length === 0) available = quests;
    let quest = available[Math.floor(Math.random() * available.length)];
    let difficulty = Math.floor(level / 10) + 1;
    let moneyMult = 1 + (difficulty - 1) * 0.5;
    let xpMult = 1 + (difficulty - 1) * 0.3;
    
    return {
        id: Date.now(),
        name: quest.name,
        desc: quest.desc,
        check: quest.check,
        rewardMoney: Math.round(quest.rewardMoney * moneyMult),
        rewardXP: Math.round(quest.rewardXP * xpMult),
        active: false,
        progress: 0,
        target: 1
    };
}

function showQuestNotification() {
    let icon = document.getElementById('quest-icon');
    if (icon) icon.classList.add('has-quest');
}

function hideQuestNotification() {
    let icon = document.getElementById('quest-icon');
    if (icon) icon.classList.remove('has-quest');
}

function openQuestDialog() {
    if (!currentQuest || currentQuest.active) {
        toast('Aucune nouvelle quête disponible pour le moment', '');
        return;
    }
    document.getElementById('quest-title').textContent = currentQuest.name;
    document.getElementById('quest-desc').textContent = currentQuest.desc;
    document.getElementById('quest-reward').innerHTML = `<div>💰 Récompense : ${currentQuest.rewardMoney.toLocaleString('fr-FR')} €</div><div>⭐ XP : ${currentQuest.rewardXP} XP</div>`;
    document.getElementById('quest-overlay').style.display = 'flex';
    
    document.getElementById('quest-accept').onclick = () => {
        currentQuest.active = true;
        currentQuestActive = currentQuest;
        currentQuest = null;
        closeQuestDialog();
        hideQuestNotification();
        updateQuestActiveBar();
        toast(`Quête acceptée : ${currentQuestActive.name}`, 'ok');
        logQuest(`Quête acceptée : ${currentQuestActive.name}`, 'info');
    };
    
    document.getElementById('quest-refuse').onclick = () => {
        currentQuest = null;
        closeQuestDialog();
        hideQuestNotification();
        toast('Quête refusée', '');
    };
}

function closeQuestDialog() {
    document.getElementById('quest-overlay').style.display = 'none';
}

function updateQuestActiveBar() {
    let bar = document.getElementById('quest-active-bar');
    if (!currentQuestActive) {
        bar.classList.remove('show');
        return;
    }
    bar.classList.add('show');
    
    // Calcul de la progression
    let progress = 0;
    let progressText = "";
    
    if (currentQuestActive.name === "Production en série") {
        let totalStock = Object.values(S.productStocks).reduce((a, b) => a + b, 0);
        progress = Math.min(100, (totalStock / 20) * 100);
        progressText = `${totalStock}/20 produits`;
    } else if (currentQuestActive.name === "Vente record") {
        progress = Math.min(100, (S.totalEarned / 10000) * 100);
        progressText = `${Math.round(S.totalEarned).toLocaleString('fr-FR')}/10 000 €`;
    } else if (currentQuestActive.name === "Machine neuve") {
        progress = Math.min(100, ((machines.length - 1) / 1) * 100);
        progressText = `${machines.length - 1}/1 machine achetée`;
    } else if (currentQuestActive.name === "Contrat gagnant") {
        let completed = activeContracts.filter(c => c.status === 'completed').length;
        progress = Math.min(100, (completed / 2) * 100);
        progressText = `${completed}/2 contrats`;
    } else if (currentQuestActive.name === "Trésorerie positive") {
        progress = Math.min(100, (S.cash / 50000) * 100);
        progressText = `${Math.round(S.cash).toLocaleString('fr-FR')}/50 000 €`;
    } else if (currentQuestActive.name === "Réparation express") {
        let repairing = Object.keys(repairsInProgress).length;
        progress = Math.min(100, (repairing / 2) * 100);
        progressText = `${repairing}/2 réparations`;
    } else if (currentQuestActive.name === "Recrutement massif") {
        progress = Math.min(100, ((employees.length - 5) / 3) * 100);
        progressText = `${employees.length - 5}/3 employés embauchés`;
    } else if (currentQuestActive.name === "Concurrent affaibli") {
        let weak = competitors.filter(c => c.marketShare < 10).length;
        progress = weak >= 1 ? 100 : 0;
        progressText = weak >= 1 ? "1/1" : "0/1";
    } else if (currentQuestActive.name === "Recherche avancée") {
        let unlocked = researches.filter(r => r.unlocked).length;
        progress = Math.min(100, (unlocked / 1) * 100);
        progressText = `${unlocked}/1 recherche`;
    } else if (currentQuestActive.name === "Niveau supérieur") {
        let level = getLevelFromXP(S.xp);
        progress = Math.min(100, ((level - 1) / 4) * 100);
        progressText = `Niveau ${level}/5`;
    } else {
        if (currentQuestActive.check && currentQuestActive.check(S)) progress = 100;
        else progress = 0;
    }
    
    bar.innerHTML = `
        <div class="quest-active-title">📜 ${currentQuestActive.name}</div>
        <div class="quest-active-desc">🎯 ${currentQuestActive.desc}</div>
        <div class="quest-active-progress"><div class="quest-active-progress-fill" style="width:${progress}%"></div></div>
        <div class="quest-active-reward">💰 ${currentQuestActive.rewardMoney.toLocaleString('fr-FR')} € | ⭐ ${currentQuestActive.rewardXP} XP</div>
        <div class="quest-active-cancel" onclick="cancelQuest()">❌ Abandonner (gratuit)</div>
    `;
}

function cancelQuest() {
    if (!currentQuestActive) return;
    showConfirm('Abandonner la quête ?', `Voulez-vous vraiment abandonner "${currentQuestActive.name}" ? Aucun coût.`, () => {
        logQuest(`Quête abandonnée : ${currentQuestActive.name}`, 'info');
        toast(`Quête abandonnée : ${currentQuestActive.name}`, '');
        currentQuestActive = null;
        updateQuestActiveBar();
        scheduleNextQuest();
    });
}

function showQuestCompletePopup(quest) {
    let overlay = document.getElementById('quest-complete-overlay');
    let titleEl = document.getElementById('quest-complete-title');
    let descEl = document.getElementById('quest-complete-desc');
    let rewardEl = document.getElementById('quest-complete-reward');
    
    if (!overlay) return;
    
    if (titleEl) titleEl.textContent = "🏆 QUÊTE COMPLÉTÉE !";
    if (descEl) descEl.textContent = quest.name;
    if (rewardEl) rewardEl.innerHTML = `💰 ${quest.rewardMoney.toLocaleString('fr-FR')} €<br>⭐ ${quest.rewardXP} XP`;
    
    overlay.style.display = 'flex';
    
    // Fermeture automatique après 4 secondes
    setTimeout(() => {
        if (overlay.style.display === 'flex') {
            overlay.style.display = 'none';
        }
    }, 4000);
}

function checkQuestProgress() {
    if (!currentQuestActive) return;
    
    if (currentQuestActive.check(S)) {
        S.cash += currentQuestActive.rewardMoney;
        S.totalEarned += currentQuestActive.rewardMoney;
        addXP(currentQuestActive.rewardXP);
        
        logQuest(`✅ Quête complétée : ${currentQuestActive.name} ! +${currentQuestActive.rewardMoney.toLocaleString('fr-FR')}€ +${currentQuestActive.rewardXP} XP`, 'pos');
        toast(`🎉 Quête complétée ! +${currentQuestActive.rewardMoney.toLocaleString('fr-FR')}€ +${currentQuestActive.rewardXP} XP`, 'ok');
        
        // Afficher la popup de récapitulation
        showQuestCompletePopup(currentQuestActive);
        
        currentQuestActive = null;
        updateQuestActiveBar();
        scheduleNextQuest();
    }
    updateQuestActiveBar();
}

function scheduleNextQuest() {
    if (questTimer) clearTimeout(questTimer);
    let delay = 900000 + Math.random() * 900000;
    questTimer = setTimeout(() => {
        if (!currentQuest && !currentQuestActive) {
            currentQuest = generateQuest();
            showQuestNotification();
            toast('📜 Une nouvelle quête est disponible ! Cliquez sur l\'icône 📜', 'ok');
        }
        scheduleNextQuest();
    }, delay);
}