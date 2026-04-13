<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Business Simulator Pro · BSP</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
<div id="toast"></div>

<!-- Overlays -->
<div class="confirm-overlay" id="confirm-overlay">
  <div class="confirm-dialog">
    <div class="confirm-title" id="confirm-title"></div>
    <div class="confirm-message" id="confirm-message"></div>
    <div class="confirm-actions" id="confirm-actions"></div>
  </div>
</div>

<div class="hire-overlay" id="hire-overlay">
  <div class="hire-dialog">
    <div class="hire-title">👥 Recrutement</div>
    <div class="hire-subtitle">Sélectionnez un candidat. Coût : <span id="hire-cost-display">0 €</span></div>
    <div class="candidates-grid" id="candidates-grid"></div>
    <div class="hire-actions">
      <button class="hire-refresh-btn" id="hire-refresh-btn">🔄 Changer (<span id="refresh-cost">Gratuit</span>)</button>
      <button class="hire-confirm-btn" id="hire-confirm-btn" disabled>✅ Embaucher</button>
    </div>
    <button class="tb-btn" style="width:100%;margin-top:12px" onclick="closeHireOverlay()">Annuler</button>
  </div>
</div>

<div class="tutorial-overlay" id="bankruptcy-overlay">
  <div class="tutorial-dialog" style="text-align:center">
    <div style="font-size:56px">📉</div>
    <div class="tutorial-title" style="color:var(--red)">Faillite !</div>
    <p style="color:var(--muted);margin:16px 0">Trésorerie <b style="color:var(--red)">−250 000 €</b>.<br>Votre entreprise a fait faillite.</p>
    <button class="btn btn-primary" onclick="declareBankruptcy()">↩ Retour au menu</button>
  </div>
</div>

<div class="tutorial-overlay" id="tutorial-overlay">
  <div class="tutorial-dialog">
    <div class="tutorial-title">🎮 Bienvenue !</div>
    <div class="tutorial-section"><h4>🏭 Production</h4><p>Achetez des matières premières, produisez et vendez.</p></div>
    <div class="tutorial-section"><h4>👥 Employés</h4><p>Emballez des employés, assignez-leur des postes.</p></div>
    <button class="tb-btn green" style="width:100%;margin-top:20px" onclick="closeTutorial()">Commencer !</button>
  </div>
</div>

<div class="password-overlay" id="password-overlay">
  <div class="password-dialog">
    <h3>🔐 Accès développeur</h3>
    <input type="password" class="password-input" id="debug-password" placeholder="Mot de passe" maxlength="4">
    <div style="display:flex;gap:10px">
      <button class="tb-btn" style="flex:1" onclick="closePasswordDialog()">Annuler</button>
      <button class="tb-btn green" style="flex:1" onclick="checkPassword()">Valider</button>
    </div>
  </div>
</div>

<div class="debug-panel" id="debug-panel">
  <div style="display:flex;gap:20px;margin-bottom:20px">
    <h2 style="color:var(--purple)">🛠️ Debug</h2>
    <button class="tb-btn danger" onclick="closeDebugPanel()">Fermer</button>
  </div>
  <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap" id="debug-event-buttons"></div>
  <div class="debug-grid" id="debug-grid"></div>
</div>

<!-- Écran Menu -->
<div id="screen-menu" class="screen active">
  <div class="menu-eyebrow">Business Simulator Pro</div>
  <h1 class="menu-title">Bâtissez<br>votre empire</h1>
  <p class="menu-sub">Achetez, produisez, fixez vos prix, vendez.</p>
  <div class="menu-btns">
    <button class="btn btn-primary" onclick="startNewGame()">Nouvelle partie</button>
    <button class="btn btn-ghost" onclick="loadGame()">Charger</button>
  </div>
</div>

<!-- Écran Jeu -->
<div id="screen-game" class="screen">
  <nav class="topbar">
    <div class="topbar-left">
      <span class="topbar-brand" id="bsp-brand">BSP</span>
      <div class="topbar-stats">
        <div class="res-chip cash"><span>💰</span><span class="val" id="tb-cash">—</span></div>
        <div class="res-chip machines"><span>⚙️</span><span class="val" id="tb-mfree">—</span>/<span class="val" id="tb-mtotal">—</span><span class="chip-tooltip" id="machines-tooltip"></span></div>
        <div class="res-chip employees"><span>👷</span><span class="val" id="tb-efree">—</span>/<span class="val" id="tb-etotal">—</span><span class="chip-tooltip" id="employees-tooltip"></span></div>
      </div>
    </div>
    <button class="tb-btn amber" onclick="openPanel('market')">🛒 Marché</button>
    <button class="tb-btn purple" onclick="openPanel('production')">🏭 Production</button>
    <button class="tb-btn teal" onclick="openPanel('sell')">🏷️ Vendre</button>
    <button class="tb-btn blue" onclick="openPanel('stock')">📦 Stocks</button>
    <button class="tb-btn amber" onclick="openPanel('demand')">📊 Demandes</button>
    <button class="tb-btn blue" onclick="openPanel('employees')">👥 Personnel</button>
    <button class="tb-btn amber" onclick="openPanel('machines')">⚙️ Machines</button>
    <button class="tb-btn pink" onclick="openPanel('contracts')">📋 Contrats</button>
    <button class="tb-btn green" onclick="openPanel('accounting')">📈 Comptabilité</button>
    <button class="tb-btn green" onclick="saveGame()">💾</button>
    <button class="tb-btn danger" onclick="backToMenu()">✕</button>
  </nav>

  <div class="main-content">
    <div class="kpi-bar">
      <div class="kpi"><div class="kpi-label">Trésorerie</div><div class="kpi-val green" id="k-cash">—</div></div>
      <div class="kpi"><div class="kpi-label">Revenus</div><div class="kpi-val teal" id="k-earned">0 €</div></div>
      <div class="kpi"><div class="kpi-label">Stocks produits finis</div><div class="kpi-val blue" id="k-pstock">0</div></div>
      <div class="kpi"><div class="kpi-label">Prod.</div><div class="kpi-val amber" id="k-active">0</div></div>
      <div class="kpi"><div class="kpi-label">Demande</div><div class="kpi-val" id="k-demand">100%</div></div>
    </div>
    <div class="event-row">
      <div class="ev-badge neutral" id="ev-badge">— Marché calme</div>
      <div class="ev-text" id="ev-text">Aucun événement.</div>
      <div class="ev-cd">Prochain <span class="cdval" id="ev-cd">—</span></div>
    </div>
    <div class="timer-wrap"><div class="timer-fill" id="timer-fill" style="width:100%"></div></div>
    <div class="happiness-bar-container">
      <div class="happiness-label"><span>😊</span> Bonheur général du site</div>
      <div class="happiness-progress"><div class="happiness-fill high" id="happiness-fill" style="width:75%"></div></div>
      <div class="happiness-value" id="happiness-value">75%</div>
    </div>
    <div class="dashboard-grid">
      <div class="dash-widget"><div class="dash-widget-title">⚙️ Machines <span style="margin-left:auto"><span style="color:var(--green)" id="dw-mok">0</span>·<span style="color:var(--red)" id="dw-mbr">0</span></span></div><div id="dw-machines-list"></div></div>
      <div class="dash-widget"><div class="dash-widget-title">📦 Stocks produits finis</div><div id="dw-stocks-list"></div></div>
      <div class="dash-widget"><div class="dash-widget-title">🏷️ Vente rapide</div><div id="dw-quicksell-list"></div></div>
    </div>
    <div class="dashboard-grid" style="margin-top:0">
      <div class="dash-widget"><div class="dash-widget-title">🔧 Maintenance rapide</div><div style="display:flex;flex-direction:column;gap:6px"><button class="tb-btn amber" style="width:100%" onclick="repairAllMachines()">🔧 Réparer toutes</button><button class="tb-btn" style="width:100%" onclick="openPanel('machines')">⚙️ Gérer les machines</button></div></div>
      <div class="dash-widget"><div class="dash-widget-title">👥 Personnel rapide</div><div style="display:flex;flex-direction:column;gap:6px"><button class="tb-btn green" style="width:100%" onclick="openHireOverlay()">+ Embaucher</button><button class="tb-btn blue" style="width:100%" onclick="openPanel('employees')">📋 Voir le personnel</button></div></div>
      <div class="dash-widget"><div class="dash-widget-title">📊 Accès rapides</div><div style="display:flex;flex-direction:column;gap:6px"><button class="tb-btn teal" style="width:100%" onclick="openPanel('contracts')">📋 Contrats</button><button class="tb-btn purple" style="width:100%" onclick="openPanel('accounting')">📈 Comptabilité</button></div></div>
    </div>
    <div class="bottom-row">
      <div class="card"><div class="card-title">Actions rapides</div>
        <button class="tb-btn amber" style="width:100%;margin-bottom:7px" onclick="openPanel('market')">🛒 Acheter matières</button>
        <button class="tb-btn purple" style="width:100%;margin-bottom:7px" onclick="openPanel('production')">🏭 Production</button>
        <button class="tb-btn teal" style="width:100%;margin-bottom:7px" onclick="openPanel('sell')">🏷️ Vendre</button>
        <div style="display:flex;gap:7px"><button class="tb-btn" style="flex:1" onclick="openHireOverlay()">+ Embaucher</button><button class="tb-btn" style="flex:1" onclick="buyMachineAction()">+ Machine</button></div>
      </div>
      <div class="mid-row">
        <div class="card"><div class="card-title">🏭 Journal</div><div class="log-list" id="log-prod-list"></div></div>
        <div class="card"><div class="card-title">💰 Comptabilité</div><div class="log-list" id="log-acc-list"></div></div>
      </div>
    </div>
  </div>
</div>

<div class="timers-container">
  <div class="timer-item"><span class="timer-label">Temps réel</span><span class="timer-value blue" id="real-time">--:--:--</span></div>
  <div class="timer-item"><span class="timer-label">Temps jeu</span><span class="timer-value purple" id="game-time">1 Jan 2026 00:00</span></div>
</div>
<div class="creator-credit">Create by CaraBulle</div>

<!-- Panels -->
<div class="panel" id="panel-market">
  <div class="panel-header"><button class="tb-btn home" onclick="closePanel('market')">🏠</button><span>🛒</span><span class="panel-title">Marché</span><button class="panel-close" onclick="closePanel('market')">✕</button></div>
  <div class="panel-body">
    <div class="panel-info"><span>Trésorerie :</span><span id="mkt-cash">—</span><span style="margin-left:auto">Prix / 60s</span></div>
    <div class="cart-panel">
      <div class="cart-title"><span>🛒 Panier</span><span id="cart-count">0</span></div>
      <div class="cart-items" id="cart-items"></div>
      <div class="cart-total"><span>Total</span><span id="cart-total">0 €</span></div>
      <div class="cart-actions"><button class="tb-btn" onclick="clearCart()">🗑️</button><button class="tb-btn green" onclick="checkoutCart()">✅ Valider</button></div>
    </div>
    <div class="search-bar"><input type="text" class="search-input" id="market-search" placeholder="🔍 Rechercher..." oninput="filterMarket()"></div>
    <div class="market-grid" id="market-grid"></div>
  </div>
</div>

<div class="panel" id="panel-production">
  <div class="panel-header"><button class="tb-btn home" onclick="closePanel('production')">🏠</button><span>🏭</span><span class="panel-title">Production</span><div style="margin-left:auto;display:flex;gap:10px"><div class="res-chip machines">⚙️ <span id="prod-mfree">—</span>/<span id="prod-mtotal">—</span></div><div class="res-chip employees">👷 <span id="prod-efree">—</span>/<span id="prod-etotal">—</span></div></div><button class="panel-close" onclick="closePanel('production')">✕</button></div>
  <div class="panel-body">
    <div class="search-bar"><input type="text" class="search-input" id="prod-search" placeholder="🔍 Rechercher un produit..." oninput="filterProduction()"></div>
    <div class="prod-grid" id="prod-grid"></div>
  </div>
</div>

<div class="panel" id="panel-sell">
  <div class="panel-header"><button class="tb-btn home" onclick="closePanel('sell')">🏠</button><span>🏷️</span><span class="panel-title">Vente</span><button class="panel-close" onclick="closePanel('sell')">✕</button></div>
  <div class="panel-body">
    <div class="panel-info"><span>Trésorerie :</span><span id="sell-cash">—</span><span>Demande :</span><span id="sell-demand-mult">—</span></div>
    <div class="sell-grid" id="sell-grid"></div>
  </div>
</div>

<div class="panel" id="panel-demand">
  <div class="panel-header"><button class="tb-btn home" onclick="closePanel('demand')">🏠</button><span>📊</span><span class="panel-title">Demandes</span><button class="panel-close" onclick="closePanel('demand')">✕</button></div>
  <div class="panel-body">
    <div class="search-bar"><input type="text" class="search-input" id="demand-search" placeholder="🔍 Rechercher..." oninput="filterDemand()"></div>
    <div class="demand-grid" id="demand-grid"></div>
  </div>
</div>

<div class="panel" id="panel-stock">
  <div class="panel-header"><button class="tb-btn home" onclick="closePanel('stock')">🏠</button><span>📦</span><span class="panel-title">Stocks</span><button class="panel-close" onclick="closePanel('stock')">✕</button></div>
  <div class="panel-body">
    <div class="tabs">
      <button class="tab active" onclick="switchStockTab('materials')">Matières</button>
      <button class="tab" onclick="switchStockTab('products')">Produits finis</button>
      <button class="tab" onclick="switchStockTab('productsN2')">Produits N2</button>
      <button class="tab" onclick="switchStockTab('productsN3')">Produits N3</button>
      <button class="tab" onclick="switchStockTab('productsN4')">Produits N4</button>
    </div>
    <div id="stock-materials"><table class="stock-table"><thead><tr><th>Matière</th><th>Stock</th><th>Prix</th><th>Valeur</th></tr></thead><tbody id="stock-materials-body"></tbody></table></div>
    <div id="stock-products" style="display:none"><table class="stock-table"><thead><tr><th>Produit</th><th>Stock</th><th>Prix</th><th>Valeur</th></tr></thead><tbody id="stock-products-body"></tbody></table></div>
    <div id="stock-productsN2" style="display:none"><table class="stock-table"><thead><tr><th>Produit N2</th><th>Stock</th><th>Prix</th><th>Valeur</th></tr></thead><tbody id="stock-productsN2-body"></tbody></table></div>
    <div id="stock-productsN3" style="display:none"><table class="stock-table"><thead><tr><th>Produit N3</th><th>Stock</th><th>Prix</th><th>Valeur</th></tr></thead><tbody id="stock-productsN3-body"></tbody></table></div>
    <div id="stock-productsN4" style="display:none"><table class="stock-table"><thead><tr><th>Produit N4</th><th>Stock</th><th>Prix</th><th>Valeur</th></tr></thead><tbody id="stock-productsN4-body"></tbody></table></div>
  </div>
</div>

<div class="panel" id="panel-employees">
  <div class="panel-header"><button class="tb-btn home" onclick="closePanel('employees')">🏠</button><span>👥</span><span class="panel-title">Personnel</span><button class="tb-btn green" style="margin-left:auto" onclick="openHireOverlay()">+ Embaucher</button><button class="panel-close" onclick="closePanel('employees')">✕</button></div>
  <div class="panel-body">
    <div class="tabs">
      <button class="tab active" onclick="switchEmployeeTab('list')">📋 Liste</button>
      <button class="tab" onclick="switchEmployeeTab('jobs')">💼 Postes</button>
      <button class="tab" onclick="switchEmployeeTab('training')">📚 Formation</button>
      <button class="tab" onclick="switchEmployeeTab('bonus')">🎁 Primes</button>
    </div>
    <div id="employee-list-tab">
      <div class="panel-info"><span>Total :</span><span id="emp-total">—</span><span>Occupés :</span><span id="emp-busy">—</span><span>Dispo :</span><span id="emp-free">—</span><span>Formation :</span><span id="emp-training">0</span></div>
      <div class="employee-grid" id="employee-grid"></div>
    </div>
    <div id="employee-jobs-tab" style="display:none">
      <div class="tabs">
        <button class="tab active" onclick="switchJobsSubTab('maintenance')">🔧 Maintenance & Entretien</button>
        <button class="tab" onclick="switchJobsSubTab('management')">👔 Management & Logistique</button>
      </div>
      <div id="jobs-maintenance">
        <div class="job-assignment"><div class="job-title">🔧 Agent de maintenance</div><div class="job-selector"><div class="dropdown-checkbox" id="dropdown-maintenance"><button class="dropdown-btn" onclick="toggleDropdown('maintenance')">Sélectionner ▼</button><div class="dropdown-content" id="dropdown-content-maintenance"></div></div><button class="tb-btn green" onclick="assignSelectedToJob('maintenance')">Affecter</button></div><div>Actuels : <span id="current-maintenance">—</span></div></div>
        <div class="job-assignment"><div class="job-title">🧹 Agent d'entretien</div><div class="job-selector"><div class="dropdown-checkbox" id="dropdown-cleaner"><button class="dropdown-btn" onclick="toggleDropdown('cleaner')">Sélectionner ▼</button><div class="dropdown-content" id="dropdown-content-cleaner"></div></div><button class="tb-btn green" onclick="assignSelectedToJob('cleaner')">Affecter</button></div><div>Actuels : <span id="current-cleaners">—</span></div></div>
      </div>
      <div id="jobs-management" style="display:none">
        <div class="job-assignment"><div class="job-title">📦 Manutentionnaire</div><div class="job-selector"><div class="dropdown-checkbox" id="dropdown-handler"><button class="dropdown-btn" onclick="toggleDropdown('handler')">Sélectionner ▼</button><div class="dropdown-content" id="dropdown-content-handler"></div></div><button class="tb-btn green" onclick="assignSelectedToJob('handler')">Affecter</button></div><div>Actuels : <span id="current-handlers">—</span></div></div>
        <div class="job-assignment"><div class="job-title">👔 Manager de ligne</div><div class="job-selector"><div class="dropdown-checkbox" id="dropdown-lineManager"><button class="dropdown-btn" onclick="toggleDropdown('lineManager')">Sélectionner ▼</button><div class="dropdown-content" id="dropdown-content-lineManager"></div></div><button class="tb-btn green" onclick="assignSelectedToJob('lineManager')">Affecter</button></div><div>Actuels : <span id="current-lineManagers">—</span></div></div>
        <div class="job-assignment"><div class="job-title">🏢 Manager de site</div><div class="job-selector"><div class="dropdown-checkbox" id="dropdown-siteManager"><button class="dropdown-btn" onclick="toggleDropdown('siteManager')">Sélectionner ▼</button><div class="dropdown-content" id="dropdown-content-siteManager"></div></div><button class="tb-btn green" onclick="assignSelectedToJob('siteManager')">Affecter</button></div><div>Actuels : <span id="current-siteManagers">—</span></div></div>
      </div>
    </div>
    <div id="employee-training-tab" style="display:none">
      <div class="panel-info">📚 Envoyez des employés en formation (1 mois). Coût de base : 200€ + supplément selon compétences.</div>
      <div class="job-assignment"><div class="job-title">Sélectionner les employés à former</div><div class="job-selector"><div class="dropdown-checkbox" id="dropdown-training"><button class="dropdown-btn" onclick="toggleDropdown('training')">Sélectionner ▼</button><div class="dropdown-content" id="dropdown-content-training"></div></div><div style="display:flex;justify-content:space-between;margin-top:8px"><span>Coût total : <span id="training-total-cost">0 €</span></span><button class="tb-btn green" onclick="startTraining()">📚 Lancer la formation</button></div></div></div>
      <div class="card"><div class="card-title">Employés en formation</div><div class="log-list" id="training-list"></div></div>
    </div>
    <div id="employee-bonus-tab" style="display:none">
      <div class="bonus-section"><div style="font-weight:700;margin-bottom:12px;color:var(--amber)">🎁 Prime</div><div class="bonus-row"><select class="bonus-select" id="bonus-employee-select"><option value="">— Choisir —</option></select><input type="number" class="bonus-amount-input" id="bonus-amount" placeholder="Montant" value="500"><button class="tb-btn green" onclick="giveBonusToEmployee()">✅ Verser</button></div><div>Total mois : <span id="bonus-total-month">0 €</span></div></div>
      <div class="card"><div class="card-title">Historique</div><div class="log-list" id="bonus-log-list"></div></div>
    </div>
  </div>
</div>

<div class="panel" id="panel-machines">
  <div class="panel-header"><button class="tb-btn home" onclick="closePanel('machines')">🏠</button><span>⚙️</span><span class="panel-title">Machines</span><button class="tb-btn green" style="margin-left:auto" onclick="buyMachineAction()">+ Acheter</button><button class="tb-btn danger" onclick="repairAllMachines()">🔧 Tout réparer</button><button class="panel-close" onclick="closePanel('machines')">✕</button></div>
  <div class="panel-body">
    <div class="tabs">
      <button class="tab active" onclick="switchMachinesTab('basic')">⚙️ Basic</button>
      <button class="tab" onclick="switchMachinesTab('advanced')">🔧 Avancé</button>
      <button class="tab" onclick="switchMachinesTab('pro')">⚡ Pro</button>
      <button class="tab" onclick="switchMachinesTab('complex')">💎 Complexe</button>
      <button class="tab" onclick="switchMachinesTab('specific')">🎯 Spécifique</button>
    </div>
    <div id="machines-basic"><div class="panel-info"><span>Total :</span><span id="mach-total">—</span><span>Fonctionnelles :</span><span id="mach-functional">—</span><span>Panne :</span><span id="mach-broken">—</span></div><div class="machine-grid" id="machine-grid"></div></div>
    <div id="machines-advanced" style="display:none"><div class="panel-info">🔧 Machines avancées</div><div style="text-align:center;padding:40px"><div style="font-size:48px">🔧</div><h3>À débloquer</h3></div></div>
    <div id="machines-pro" style="display:none"><div class="panel-info">⚡ Machines Pro</div><div style="text-align:center;padding:40px"><div style="font-size:48px">⚡</div><h3>À débloquer</h3></div></div>
    <div id="machines-complex" style="display:none"><div class="panel-info">💎 Machines Complexes</div><div style="text-align:center;padding:40px"><div style="font-size:48px">💎</div><h3>À débloquer</h3></div></div>
    <div id="machines-specific" style="display:none"><div class="panel-info">🎯 Machines Spécifiques</div><div style="text-align:center;padding:40px"><div style="font-size:48px">🎯</div><h3>À débloquer</h3></div></div>
  </div>
</div>

<div class="panel" id="panel-contracts">
  <div class="panel-header"><button class="tb-btn home" onclick="closePanel('contracts')">🏠</button><span>📋</span><span class="panel-title">Contrats</span><button class="panel-close" onclick="closePanel('contracts')">✕</button></div>
  <div class="panel-body"><div class="panel-info">📋 Contrats renouvelés quotidiennement. 5 max.</div><div class="contracts-grid" id="contracts-grid"></div></div>
</div>

<div class="panel" id="panel-accounting">
  <div class="panel-header"><button class="tb-btn home" onclick="closePanel('accounting')">🏠</button><span>📈</span><span class="panel-title">Comptabilité</span><button class="panel-close" onclick="closePanel('accounting')">✕</button></div>
  <div class="panel-body">
    <div class="accounting-summary">
      <div class="accounting-card"><div class="accounting-label">Trésorerie</div><div class="accounting-value green" id="acc-cash">—</div></div>
      <div class="accounting-card"><div class="accounting-label">Revenus totaux</div><div class="accounting-value green" id="acc-revenue">—</div></div>
      <div class="accounting-card"><div class="accounting-label">Dépenses totales</div><div class="accounting-value red" id="acc-expenses">—</div></div>
      <div class="accounting-card"><div class="accounting-label">Bénéfice net</div><div class="accounting-value" id="acc-profit">—</div></div>
      <div class="accounting-card"><div class="accounting-label">Taxes à payer</div><div class="accounting-value amber" id="acc-taxes">0 €</div></div>
      <div class="accounting-card"><div class="accounting-label">Crédit restant</div><div class="accounting-value amber" id="acc-loan">0 €</div></div>
    </div>
    <div class="card" style="margin-bottom:20px">
      <div class="card-title">Évolution de la trésorerie</div>
      <div class="chart-wrap" style="height:200px"><canvas id="accounting-chart"></canvas></div>
      <div class="chart-views">
        <button class="chart-view-btn active" id="cvb-realtime" onclick="setChartView('realtime')">⏱ Temps réel</button>
        <button class="chart-view-btn" id="cvb-day" onclick="setChartView('day')">📅 Par jour</button>
        <button class="chart-view-btn" id="cvb-week" onclick="setChartView('week')">📆 Par semaine</button>
        <button class="chart-view-btn" id="cvb-month" onclick="setChartView('month')">🗓 Par mois</button>
        <button class="chart-view-btn" id="cvb-year" onclick="setChartView('year')">📊 Par année</button>
      </div>
    </div>
    <div class="card"><div class="card-title">Historique des transactions</div><div class="log-list" id="accounting-log-list" style="max-height:300px"></div></div>
    <div style="margin-top:24px;margin-bottom:12px"><span style="font-size:16px;font-weight:700">⚡ Consommables & Énergie</span></div>
    <div class="util-total-bar"><span>Charge totale</span><span id="util-total-cost">—</span><button class="tb-btn danger" onclick="payAllUtilities()">⚡ Payer toutes les charges</button></div>
    <div class="util-grid" id="util-grid"></div>
    <div style="margin-top:20px;text-align:center"><button class="tb-btn blue" onclick="openPanel('bank')">🏦 Accéder à la Banque</button></div>
  </div>
</div>

<div class="panel" id="panel-bank">
  <div class="panel-header"><button class="tb-btn home" onclick="closePanel('bank')">🏠</button><span>🏦</span><span class="panel-title">Banque</span><button class="panel-close" onclick="closePanel('bank')">✕</button></div>
  <div class="panel-body">
    <div class="loan-slider-container">
      <h3>Demande de prêt</h3>
      <div class="loan-amount-display" id="loan-amount-display">1 000 €</div>
      <div class="loan-input-row"><input type="number" id="loan-amount-input" min="0" max="1000000" step="1000" value="1000" oninput="updateLoanSlider()"></div>
      <input type="range" class="loan-slider" id="loan-slider" min="0" max="1000000" step="1000" value="1000" oninput="updateLoanInput()">
      <div class="loan-info">
        <div><span>Taux :</span><span id="loan-interest-rate">2.0%</span></div>
        <div><span>Total :</span><span id="loan-total-amount">1 020 €</span></div>
        <div><span>Mensualité :</span><span id="loan-payment-amount">102 €</span></div>
      </div>
      <button class="tb-btn green" style="width:100%;padding:15px" onclick="takeLoan()">✅ Valider</button>
    </div>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<script src="js/constants.js"></script>
<script src="js/state.js"></script>
<script src="js/utils.js"></script>
<script src="js/economy.js"></script>
<script src="js/production.js"></script>
<script src="js/employees.js"></script>
<script src="js/market.js"></script>
<script src="js/contracts.js"></script>
<script src="js/accounting.js"></script>
<script src="js/events.js"></script>
<script src="js/ui.js"></script>
<script src="js/game.js"></script>
<script src="js/main.js"></script>
</body>
</html>
