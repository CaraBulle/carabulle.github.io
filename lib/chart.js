// ==================== INITIALISATION ====================
document.addEventListener('click', e => {
  if (e.target.id === 'bsp-brand' || e.target.closest('#bsp-brand')) { bspClickCount++; if (bspClickCount >= 5) { bspClickCount = 0; document.getElementById('password-overlay').style.display = 'flex'; } setTimeout(() => bspClickCount = 0, 2000); }
  if (!e.target.closest('.dropdown-checkbox')) document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
});

document.getElementById('confirm-overlay').onclick = e => { if (e.target === document.getElementById('confirm-overlay')) closeConfirm(); };
document.getElementById('hire-refresh-btn').onclick = () => refreshCandidates();
document.getElementById('hire-confirm-btn').onclick = () => confirmHire();

window.addEventListener('beforeunload', () => { if (S) saveGame(); });
if (localStorage.getItem('bsp5_autosave')) { loadGame('bsp5_autosave'); localStorage.removeItem('bsp5_autosave'); }
setInterval(updateTimers, 1000);

// ==================== DEBUG ====================
function checkPassword() { if (document.getElementById('debug-password').value === '2291') { closePasswordDialog(); showDebugPanel(); } else toast('Mot de passe incorrect', 'err'); }
function closePasswordDialog() { document.getElementById('password-overlay').style.display = 'none'; }

function showDebugPanel() {
  let eb = document.getElementById('debug-event-buttons'); eb.innerHTML = EVENTS_DEF.map((e, i) => `<button class="tb-btn" onclick="triggerEvent(${i})">${e.label}</button>`).join('');
  let saveInfo = localStorage.getItem('bsp5') ? JSON.parse(localStorage.getItem('bsp5')) : null;
  let saveHtml = '<div class="debug-card"><h4>💾 Sauvegarde</h4>';
  if (saveInfo) { saveHtml += '<p><b>Données sauvegardées :</b></p><ul style="margin-left:20px;font-size:11px">'; saveHtml += '<li>S (état du jeu)</li><li>products</li><li>chartHistory</li><li>logProdEntries</li><li>logAccEntries</li><li>gameTime</li><li>machines</li><li>employees</li><li>pendingTaxes</li><li>currentLoan</li><li>utilityPrices</li><li>activeContracts</li><li>repairsInProgress</li><li>hireCount</li>'; saveHtml += '</ul>'; } else { saveHtml += '<p>Aucune sauvegarde</p>'; } saveHtml += '</div>';
  document.getElementById('debug-grid').innerHTML = saveHtml + `<div class="debug-card"><h4>⏱️ Temps</h4><p>Événements : 60s-60min</p><p>Salaires : 24min</p><p>Taxes : 2min</p><p>Prêt : 24min</p><p>Demande : 60min</p><p>Contrats : chaque jour</p></div><div class="debug-card"><h4>🔧 Réparations</h4><p>Temps réel : 2min</p><p>Temps jeu : 2h</p></div><div class="debug-card"><h4>🇫🇷 Contrat d'État</h4><p>Chance : 0,003%</p><button class="tb-btn gold" onclick="forceStateContract()">Forcer Contrat d'État</button></div>`;
  document.getElementById('debug-panel').style.display = 'block';
}

function forceStateContract() { let sc = generateStateContract(); if (sc) { activeContracts.push(sc); if (document.getElementById('panel-contracts').classList.contains('open')) renderContractsPanel(); toast('Contrat d\'État généré !', 'ok'); } }
function closeDebugPanel() { document.getElementById('debug-panel').style.display = 'none'; }