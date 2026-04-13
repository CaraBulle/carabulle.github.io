// ==================== ÉCONOMIE ====================
function payDailyWages() {
  let t = employees.reduce((s, e) => s + e.wage, 0);
  if (S.cash >= t) { S.cash -= t; S.totalSpent += t; logAcc(`Salaires : -${fmt(t)}`, 'neg'); }
  else { logAcc(`Salaires impayés !`, 'neg'); }
  updateUI(); pushChart(); refreshAllHappiness();
}

function payTaxes() {
  if (pendingTaxes <= 0) return;
  if (S.cash >= pendingTaxes) { S.cash -= pendingTaxes; S.totalSpent += pendingTaxes; logAcc(`Taxes : -${fmt(pendingTaxes)}`, 'neg'); pendingTaxes = 0; }
  else { logAcc(`Taxes impayées !`, 'neg'); }
  updateUI(); pushChart();
}

function payLoan() {
  if (currentLoan.remaining <= 0) return;
  let p = Math.min(currentLoan.remaining, Math.round(currentLoan.total * 0.1));
  S.cash -= p; S.totalSpent += p; currentLoan.remaining -= p;
  logAcc(`Prêt : -${fmt(p)}`, 'neg');
  if (currentLoan.remaining <= 0) { currentLoan = { amount: 0, total: 0, remaining: 0 }; logAcc('Prêt remboursé', 'pos'); }
  updateUI(); pushChart(); checkBankruptcy();
}

function updateLoanSlider() {
  let i = document.getElementById('loan-amount-input'), v = Math.max(0, Math.min(1000000, parseInt(i.value) || 0));
  i.value = v; document.getElementById('loan-slider').value = v; updateLoanDisplay(v);
}

function updateLoanInput() {
  let s = document.getElementById('loan-slider'), v = parseInt(s.value) || 0;
  document.getElementById('loan-amount-input').value = v; updateLoanDisplay(v);
}

function updateLoanDisplay(a) {
  let r = a < 1000 ? 0.02 : 0.02 + Math.max(0, a - 1000) / 999000 * 0.105;
  let t = Math.round(a * (1 + r)), p = Math.round(t * 0.1);
  document.getElementById('loan-amount-display').textContent = a.toLocaleString('fr-FR') + ' €';
  document.getElementById('loan-interest-rate').textContent = (r * 100).toFixed(1) + '%';
  document.getElementById('loan-total-amount').textContent = t.toLocaleString('fr-FR') + ' €';
  document.getElementById('loan-payment-amount').textContent = p.toLocaleString('fr-FR') + ' €';
}

function takeLoan() {
  if (currentLoan.remaining > 0) return;
  let a = parseInt(document.getElementById('loan-amount-input').value) || 0;
  if (a < 1000) a = 1000;
  let r = a < 1000 ? 0.02 : 0.02 + Math.max(0, a - 1000) / 999000 * 0.105;
  let t = Math.round(a * (1 + r));
  currentLoan = { amount: a, total: t, remaining: t };
  S.cash += a;
  updateUI(); pushChart(); closePanel('bank');
}