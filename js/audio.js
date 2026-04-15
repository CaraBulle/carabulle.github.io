// ==================== SYSTÈME AUDIO (sans fichiers) ====================
let audioContext = null;
let soundEnabled = true;
let speechEnabled = true;
let ambientSound = null;

// Initialiser le contexte audio (doit être fait après une interaction utilisateur)
function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Résumer le contexte s'il est suspendu
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  const btn = document.getElementById('sound-btn');
  if (btn) btn.textContent = soundEnabled ? '🔊' : '🔇';
  if (!soundEnabled) {
    stopAmbientSound();
  } else {
    startAmbientSound();
  }
  return soundEnabled;
}

function toggleSpeech() {
  speechEnabled = !speechEnabled;
  return speechEnabled;
}

// ==================== SONS DE BASE ====================

function playSuccessSound(type = 'default') {
  if (!soundEnabled) return;
  const ctx = initAudio();
  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  if (type === 'sale') {
    osc.frequency.value = 800;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.start();
    osc.stop(now + 0.12);
  } else if (type === 'purchase') {
    osc.frequency.value = 600;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.setValueAtTime(0.01, now + 0.05);
    gain.gain.setValueAtTime(0.06, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);
    osc.start();
    osc.stop(now + 0.13);
  } else if (type === 'hire') {
    osc.frequency.value = 500;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0.06, now);
    osc.frequency.linearRampToValueAtTime(700, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.start();
    osc.stop(now + 0.1);
  } else {
    osc.frequency.value = 600;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.start();
    osc.stop(now + 0.08);
  }
}

function playErrorSound(type = 'default') {
  if (!soundEnabled) return;
  const ctx = initAudio();
  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  if (type === 'broken') {
    osc.frequency.value = 200;
    osc.type = 'sawtooth';
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.setValueAtTime(0.01, now + 0.08);
    gain.gain.setValueAtTime(0.08, now + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.start();
    osc.stop(now + 0.2);
  } else {
    osc.frequency.value = 150;
    osc.type = 'square';
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.start();
    osc.stop(now + 0.15);
  }
}

function playNotificationSound() {
  if (!soundEnabled) return;
  const ctx = initAudio();
  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.frequency.value = 700;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
  
  osc.start();
  osc.stop(now + 0.15);
}

function playContractSound() {
  if (!soundEnabled) return;
  const ctx = initAudio();
  const now = ctx.currentTime;
  
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  
  osc1.frequency.value = 600;
  osc2.frequency.value = 800;
  osc1.type = 'triangle';
  osc2.type = 'triangle';
  
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
  
  osc1.start();
  osc2.start();
  osc1.stop(now + 0.25);
  osc2.stop(now + 0.25);
}

function playLevelUpSound() {
  if (!soundEnabled) return;
  const ctx = initAudio();
  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.frequency.value = 400;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.05, now);
  
  osc.frequency.linearRampToValueAtTime(800, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
  
  osc.start();
  osc.stop(now + 0.2);
}

function playClickSound() {
  if (!soundEnabled) return;
  const ctx = initAudio();
  const now = ctx.currentTime;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.frequency.value = 1000;
  osc.type = 'sine';
  gain.gain.setValueAtTime(0.02, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  
  osc.start();
  osc.stop(now + 0.03);
}

// ==================== SYNTHÈSE VOCALE ====================

function speak(text, priority = 'normal') {
  if (!speechEnabled) return;
  if (priority === 'low' && Math.random() > 0.3) return;
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;
  
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

// ==================== SON AMBIANT ====================

function startAmbientSound() {
  if (!soundEnabled) return;
  const ctx = initAudio();
  
  if (ambientSound) {
    ambientSound.stop();
  }
  
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  osc1.frequency.value = 60;
  osc2.frequency.value = 120;
  osc1.type = 'sine';
  osc2.type = 'sine';
  
  filter.type = 'lowpass';
  filter.frequency.value = 200;
  
  gain.gain.value = 0.02;
  
  osc1.start();
  osc2.start();
  
  ambientSound = { stop: () => { osc1.stop(); osc2.stop(); } };
}

function stopAmbientSound() {
  if (ambientSound) {
    ambientSound.stop();
    ambientSound = null;
  }
}