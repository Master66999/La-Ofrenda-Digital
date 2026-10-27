/* ===========================
   LA OFRENDA DIGITAL — app.js
   Day of the Dead Virtual Memorial Builder
   Powered by Ollama local AI
   =========================== */

'use strict';

/* ══════════════════════════════
   GLOBAL STATE
══════════════════════════════ */
const state = {
  personName: '',
  birthYear: '',
  deathYear: '',
  relationship: '',
  personality: '',
  photoDataUrl: null,
  foods: [],
  songs: [],
  objects: [],
  memory: '',
  remembrance: '',
  audioEnabled: false,
  audioCtx: null,
  currentOfrenda: null,
};

/* ══════════════════════════════
   PARTICLE SYSTEM
══════════════════════════════ */
(function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  const COLORS = ['#f5a623','#ff7b00','#e74c8b','#ffc947','#fff176'];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      vx: (Math.random() - 0.5) * 0.6,
      vy: -(Math.random() * 1.2 + 0.4),
      alpha: Math.random() * 0.6 + 0.2,
      size: Math.random() * 3 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: 0,
      maxLife: Math.random() * 200 + 100,
    };
  }

  function tick() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (particles.length < 60 && Math.random() < 0.3) particles.push(createParticle());

    particles = particles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life++;
      const ratio = 1 - p.life / p.maxLife;
      ctx.globalAlpha = p.alpha * ratio;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      return p.life < p.maxLife;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  tick();
})();

/* ══════════════════════════════
   SECTION NAVIGATION
══════════════════════════════ */
function showSection(id) {
  document.querySelectorAll('.hero, .app-section').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(id);
  if (target) {
    target.classList.remove('hidden');
    target.classList.add('fade-in');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => target.classList.remove('fade-in'), 600);
  }
}

/* ══════════════════════════════
   OLLAMA STATUS CHECK
══════════════════════════════ */
async function checkOllamaStatus() {
  const dot  = document.getElementById('ollama-dot');
  const text = document.getElementById('ollama-status-text');
  try {
    const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      const models = data.models || [];
      dot.className = 'badge-dot online';
      text.textContent = models.length
        ? `Ollama connected · ${models.length} model${models.length > 1 ? 's' : ''} available`
        : 'Ollama connected (no models pulled yet)';
    } else {
      throw new Error('bad status');
    }
  } catch {
    dot.className = 'badge-dot offline';
    text.textContent = 'Ollama offline — AI features unavailable';
  }
}

/* ══════════════════════════════
   PHOTO INPUT
══════════════════════════════ */
document.getElementById('photo-input').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.photoDataUrl = e.target.result;
    const preview = document.getElementById('photo-preview');
    preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="cursor:pointer" onclick="document.getElementById('photo-input').click()" />`;
  };
  reader.readAsDataURL(file);
});

/* ══════════════════════════════
   TAG CHIPS
══════════════════════════════ */
const tagStores = { food: [], song: [], object: [] };

function addTag(type, value) {
  const val = (value || '').trim();
  if (!val || tagStores[type].includes(val)) return;
  tagStores[type].push(val);
  renderTags(type);
}

function removeTag(type, value) {
  tagStores[type] = tagStores[type].filter(t => t !== value);
  renderTags(type);
}

function renderTags(type) {
  const container = document.getElementById(`${type}-tags`);
  container.innerHTML = tagStores[type].map(t =>
    `<span class="tag-chip">${t}<span class="remove-tag" onclick="removeTag('${type}','${t.replace(/'/g,"\\'")}')">✕</span></span>`
  ).join('');
}

// Wire up tag inputs (Enter key)
['food','song','object'].forEach(type => {
  const input = document.getElementById(`${type}-input`);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag(type, input.value);
      input.value = '';
    }
  });
});

/* ══════════════════════════════
   FORM VALIDATION & STEP FORWARD
══════════════════════════════ */
function validateAndNext() {
  const name = document.getElementById('person-name').value.trim();
  if (!name) {
    alert('Please enter a full name to continue.');
    document.getElementById('person-name').focus();
    return;
  }
  // Collect form data into state
  state.personName    = name;
  state.birthYear     = document.getElementById('birth-year').value;
  state.deathYear     = document.getElementById('death-year').value;
  state.relationship  = document.getElementById('relationship').value;
  state.personality   = document.getElementById('personality').value;

  showSection('offerings-section');
}

/* ══════════════════════════════
   AI REMEMBRANCE VIA OLLAMA
══════════════════════════════ */
async function getOllamaModel() {
  try {
    const res = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    const data = await res.json();
    const models = data.models || [];
    if (!models.length) return null;
    // Prefer llama / mistral / gemma models
    const preferred = models.find(m => /llama|mistral|gemma|phi|qwen/i.test(m.name));
    return preferred ? preferred.name : models[0].name;
  } catch {
    return null;
  }
}

async function generateRemembrance() {
  const model = await getOllamaModel();
  if (!model) return null;

  const prompt = buildPrompt();

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.85, num_predict: 220 },
    }),
  });

  if (!response.ok) throw new Error('Ollama generate failed');
  const data = await response.json();
  return (data.response || '').trim();
}

function buildPrompt() {
  const foods   = tagStores.food.join(', ')   || 'various foods';
  const songs   = tagStores.song.join(', ')   || 'beloved music';
  const objects = tagStores.object.join(', ') || 'cherished objects';
  const years   = state.birthYear && state.deathYear
    ? `who lived from ${state.birthYear} to ${state.deathYear}`
    : state.birthYear ? `born in ${state.birthYear}` : '';

  return `You are writing a heartfelt, poetic remembrance for a Day of the Dead (Día de los Muertos) ofrenda.

Write a short, warm, and personal tribute (3-5 sentences) for ${state.personName}, ${state.relationship ? `a beloved ${state.relationship}` : 'a beloved person'} ${years}.

About them: ${state.personality || 'They were deeply loved and will always be remembered.'}

Their favorite foods: ${foods}
Their favorite songs/artists: ${songs}
Their cherished objects: ${objects}
${state.memory ? `\nA special memory: ${state.memory}` : ''}

Write only the tribute text. Make it poetic, warm, and in the spirit of Día de los Muertos — celebrating life and keeping memories alive. Do not include any titles or headings.`;
}

function buildFallbackRemembrance() {
  const rel = state.relationship ? state.relationship : 'beloved soul';
  const yr  = state.birthYear && state.deathYear
    ? ` (${state.birthYear}–${state.deathYear})`
    : '';
  const foods = tagStores.food.slice(0, 3).join(', ');
  const songs = tagStores.song.slice(0, 2).join(', ');

  let text = `In loving memory of ${state.personName}${yr}, a cherished ${rel}.`;
  if (state.personality) text += ` ${state.personality.split('.')[0]}.`;
  if (foods) text += ` Their ofrenda is adorned with ${foods} — simple offerings that carry the fragrance of memory.`;
  if (songs) text += ` The songs of ${songs} play softly as their spirit dances among the marigolds.`;
  text += ` Though they have crossed to the other side, their love lives on in every candle lit in their name. May their memory be eternal. 🌼`;
  return text;
}

/* ══════════════════════════════
   GENERATE OFRENDA (Main Flow)
══════════════════════════════ */
async function generateOfrenda() {
  // Collect offerings state
  state.foods   = [...tagStores.food];
  state.songs   = [...tagStores.song];
  state.objects = [...tagStores.object];
  state.memory  = document.getElementById('memory-text').value.trim();

  showSection('loading-section');
  updateLoadingMsg('Calling upon the spirits of memory...');

  let remembrance = null;
  try {
    updateLoadingMsg('Local AI is weaving a tribute...');
    remembrance = await generateRemembrance();
  } catch (err) {
    console.warn('Ollama error:', err);
  }

  if (!remembrance) {
    updateLoadingMsg('Crafting a heartfelt tribute...');
    await sleep(800);
    remembrance = buildFallbackRemembrance();
  }

  state.remembrance = remembrance;

  // Save to current ofrenda
  state.currentOfrenda = buildOfrendaData();

  // Render the altar
  renderOfrenda(state.currentOfrenda);
  showSection('ofrenda-section');
}

function updateLoadingMsg(msg) {
  const el = document.getElementById('loading-msg');
  if (el) el.textContent = msg;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/* ══════════════════════════════
   RENDER OFRENDA
══════════════════════════════ */
function buildOfrendaData() {
  return {
    id: Date.now(),
    name:         state.personName,
    birthYear:    state.birthYear,
    deathYear:    state.deathYear,
    relationship: state.relationship,
    personality:  state.personality,
    photo:        state.photoDataUrl,
    foods:        [...state.foods],
    songs:        [...state.songs],
    objects:      [...state.objects],
    memory:       state.memory,
    remembrance:  state.remembrance,
    createdAt:    new Date().toISOString(),
  };
}

function renderOfrenda(data) {
  // Portrait
  const img     = document.getElementById('portrait-img');
  const initial = document.getElementById('portrait-initial');
  if (data.photo) {
    img.src = data.photo;
    img.style.display = 'block';
    initial.style.display = 'none';
  } else {
    img.style.display = 'none';
    initial.style.display = 'block';
    initial.textContent = data.name.charAt(0).toUpperCase();
  }

  // Name & dates
  document.getElementById('ofrenda-name').textContent = data.name;
  const years = [data.birthYear, data.deathYear].filter(Boolean).join(' – ');
  document.getElementById('ofrenda-years').textContent = years;
  document.getElementById('ofrenda-relationship').textContent =
    data.relationship ? `✦ ${capitalise(data.relationship)} ✦` : '';

  // Remembrance
  document.getElementById('remembrance-text').textContent = data.remembrance;

  // Shelves
  renderShelf('food-items-display',   data.foods);
  renderShelf('song-items-display',   data.songs);
  renderShelf('object-items-display', data.objects);

  // Memory
  const memEl  = document.getElementById('memory-display');
  const memTxt = document.getElementById('memory-display-text');
  if (data.memory) {
    memEl.style.display = 'block';
    memTxt.textContent  = `"${data.memory}"`;
  } else {
    memEl.style.display = 'none';
  }
}

function renderShelf(containerId, items) {
  const el = document.getElementById(containerId);
  if (!items || !items.length) {
    el.innerHTML = '<span style="color:var(--text-dim);font-size:0.8rem;font-style:italic">None added</span>';
    return;
  }
  el.innerHTML = items.map(i => `<span class="shelf-item">${i}</span>`).join('');
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ══════════════════════════════
   REGENERATE REMEMBRANCE
══════════════════════════════ */
async function regenerateRemembrance() {
  const el = document.getElementById('remembrance-text');
  el.style.opacity = '0.4';
  el.textContent = 'Weaving a new remembrance...';
  try {
    const r = await generateRemembrance();
    state.remembrance = r || buildFallbackRemembrance();
  } catch {
    state.remembrance = buildFallbackRemembrance();
  }
  el.textContent = state.remembrance;
  el.style.opacity = '1';
  if (state.currentOfrenda) state.currentOfrenda.remembrance = state.remembrance;
}

/* ══════════════════════════════
   SAVE / LOAD (localStorage)
══════════════════════════════ */
function getSavedOfrendas() {
  try {
    return JSON.parse(localStorage.getItem('ofrendas') || '[]');
  } catch {
    return [];
  }
}

function saveOfrenda() {
  if (!state.currentOfrenda) return;
  const ofrendas = getSavedOfrendas();
  const existing = ofrendas.findIndex(o => o.id === state.currentOfrenda.id);
  if (existing >= 0) {
    ofrendas[existing] = state.currentOfrenda;
  } else {
    ofrendas.push(state.currentOfrenda);
  }
  localStorage.setItem('ofrendas', JSON.stringify(ofrendas));
  showToast('💾 Ofrenda saved to your browser!');
}

function deleteOfrenda(id) {
  if (!confirm('Remove this ofrenda?')) return;
  const ofrendas = getSavedOfrendas().filter(o => o.id !== id);
  localStorage.setItem('ofrendas', JSON.stringify(ofrendas));
  renderGallery();
}

/* ══════════════════════════════
   GALLERY
══════════════════════════════ */
function renderGallery() {
  const grid  = document.getElementById('gallery-grid');
  const empty = document.getElementById('gallery-empty');
  const items = getSavedOfrendas();

  if (!items.length) {
    empty.style.display = 'flex';
    // Remove any old cards
    grid.querySelectorAll('.gallery-card').forEach(c => c.remove());
    return;
  }

  empty.style.display = 'none';
  grid.querySelectorAll('.gallery-card').forEach(c => c.remove());

  items.forEach(data => {
    const card = document.createElement('div');
    card.className = 'gallery-card fade-in';

    const avatar = data.photo
      ? `<div class="gallery-avatar"><img src="${data.photo}" alt="${data.name}" /></div>`
      : `<div class="gallery-avatar">${data.name.charAt(0).toUpperCase()}</div>`;

    const years = [data.birthYear, data.deathYear].filter(Boolean).join(' – ');

    card.innerHTML = `
      ${avatar}
      <div class="gallery-name">${data.name}</div>
      <div class="gallery-years">${years || 'Remembered always'}</div>
      <div class="gallery-actions">
        <button onclick="loadOfrenda(${data.id})">🕯️ View</button>
        <button class="del" onclick="deleteOfrenda(${data.id})">🗑️ Remove</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

function loadOfrenda(id) {
  const data = getSavedOfrendas().find(o => o.id === id);
  if (!data) return;
  state.currentOfrenda = data;
  state.remembrance = data.remembrance;
  renderOfrenda(data);
  showSection('ofrenda-section');
}

/* ══════════════════════════════
   PRINT / EXPORT
══════════════════════════════ */
function printOfrenda() {
  window.print();
}

/* ══════════════════════════════
   AMBIENT AUDIO (Web Audio API)
══════════════════════════════ */
function toggleAudio() {
  const btn = document.getElementById('audio-btn');
  if (state.audioEnabled) {
    stopAudio();
    btn.textContent = '🔇 Enable Ambient Sound';
    state.audioEnabled = false;
  } else {
    startAudio();
    btn.textContent = '🔊 Disable Ambient Sound';
    state.audioEnabled = true;
  }
}

function startAudio() {
  if (!state.audioCtx) {
    state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const ctx = state.audioCtx;

  // Soft wind / ambient drone
  function playDrone(freq, gain) {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + 2);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    state._droneNodes = state._droneNodes || [];
    state._droneNodes.push({ osc, g });
    return { osc, g };
  }

  playDrone(60, 0.04);
  playDrone(90, 0.03);
  playDrone(120, 0.02);
  playDrone(180, 0.015);

  // Soft bell-like pings
  function pingBell() {
    if (!state.audioEnabled) return;
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 440 + Math.random() * 440;
    g.gain.setValueAtTime(0.07, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 2.5);
    setTimeout(pingBell, 3000 + Math.random() * 4000);
  }
  pingBell();
}

function stopAudio() {
  if (state._droneNodes) {
    const ctx = state.audioCtx;
    state._droneNodes.forEach(({ osc, g }) => {
      g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
      osc.stop(ctx.currentTime + 1.1);
    });
    state._droneNodes = [];
  }
}

/* ══════════════════════════════
   CANDLE CEREMONY MODAL
══════════════════════════════ */
const CANDLE_MSGS = [
  'A flame lit in memory. May their spirit feel the warmth.',
  'The light you carry for them never fades.',
  'In the flicker of this flame, they are present.',
  'All candles lit — may they find peace on the other side. 🌼',
];

function lightCandle(wrapper) {
  const candle = wrapper.querySelector('.c-candle');
  const flame  = wrapper.querySelector('.c-flame');
  if (candle.classList.contains('lit')) return;

  candle.classList.remove('unlit');
  candle.classList.add('lit');
  flame.classList.remove('hidden');
  wrapper.classList.add('lit');

  const litCount = document.querySelectorAll('.ceremony-candle.lit').length;
  const msg = CANDLE_MSGS[Math.min(litCount - 1, CANDLE_MSGS.length - 1)];
  document.getElementById('ceremony-msg').textContent = msg;
}

function openModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('hidden');
}

function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
  // Reset candles
  document.querySelectorAll('.ceremony-candle').forEach(c => {
    c.classList.remove('lit');
    c.querySelector('.c-candle').classList.remove('lit');
    c.querySelector('.c-candle').classList.add('unlit');
    c.querySelector('.c-flame').classList.add('hidden');
  });
  document.getElementById('ceremony-msg').textContent = 'Click a candle to light it...';
}

/* ══════════════════════════════
   TOAST NOTIFICATION
══════════════════════════════ */
function showToast(message) {
  const existing = document.getElementById('toast-msg');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-msg';
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '5rem', left: '50%', transform: 'translateX(-50%)',
    background: 'linear-gradient(135deg,#f5a623,#ff7b00)',
    color: '#1a0a00', fontWeight: '700', fontSize: '0.9rem',
    padding: '0.65rem 1.5rem', borderRadius: '50px',
    boxShadow: '0 4px 20px rgba(245,166,35,0.4)',
    zIndex: '200', animation: 'fadeInUp 0.3s ease',
    whiteSpace: 'nowrap',
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

/* ══════════════════════════════
   RESET STATE (for "Add Another")
══════════════════════════════ */
function resetState() {
  state.personName = '';
  state.birthYear = '';
  state.deathYear = '';
  state.relationship = '';
  state.personality = '';
  state.photoDataUrl = null;
  state.foods = [];
  state.songs = [];
  state.objects = [];
  state.memory = '';
  state.remembrance = '';
  state.currentOfrenda = null;

  // Reset form fields
  ['person-name','birth-year','death-year','personality','memory-text'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const rel = document.getElementById('relationship');
  if (rel) rel.value = '';

  // Reset photo
  document.getElementById('photo-preview').innerHTML = `
    <div class="photo-placeholder" onclick="document.getElementById('photo-input').click()">
      <span class="placeholder-icon">📷</span>
      <span>Click to add photo</span>
    </div>`;
  document.getElementById('photo-input').value = '';

  // Reset tag stores
  ['food','song','object'].forEach(type => {
    tagStores[type] = [];
    renderTags(type);
  });
}

// Override "Add Another" button behavior
document.querySelectorAll('button').forEach(btn => {
  if (btn.textContent.includes('Add Another')) {
    btn.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      resetState();
      showSection('setup-section');
    });
  }
});

/* ══════════════════════════════
   INIT
══════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  checkOllamaStatus();

  // Show hero initially
  showSection('hero-section');
});
