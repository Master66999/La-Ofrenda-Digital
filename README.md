# 💀 La Ofrenda Digital
### *A Virtual Memorial Builder for Día de los Muertos*

<p align="center">
  <img src="https://img.shields.io/badge/built%20with-Vanilla%20JS-f5a623?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/AI-Ollama%20%7C%20Local%20LLM-8e44ad?style=for-the-badge&logo=ollama&logoColor=white" />
  <img src="https://img.shields.io/badge/privacy-100%25%20Offline-27ae60?style=for-the-badge&logo=shield&logoColor=white" />
  <img src="https://img.shields.io/badge/license-MIT-3498db?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Hacktoberfest-2024-e74c3c?style=for-the-badge&logo=github&logoColor=white" />
</p>

<p align="center">
  <strong>Honor the ones you have loved. Keep their stories alive.</strong><br/>
  A private, offline-first memorial builder powered by local open-source AI.
</p>

---

## 🌼 Overview

**La Ofrenda Digital** is a browser-based application that lets you build a beautiful, heartfelt digital *ofrenda* (altar) to honor loved ones who have passed. Inspired by the rich Mexican tradition of **Día de los Muertos**, the app combines stunning visuals with local AI to craft a personalized remembrance — all without a single byte of your memories ever leaving your device.

> *"They are not truly gone as long as someone remembers them."*

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **AI Remembrance** | Generates a poetic tribute using a local LLM via [Ollama](https://ollama.com) — completely private |
| 📷 **Photo Portrait** | Upload a photo or use a monogram initial as the centerpiece of the altar |
| 🍽️ **Offerings** | Add favourite foods, songs/artists, and meaningful objects as offerings |
| 📖 **Memory Journal** | Write a personal story or memory to display on the ofrenda |
| 🕯️ **Candle Ceremony** | Interactive candle-lighting ritual with reflective messages |
| 💾 **Gallery** | All ofrendas saved locally in your browser — no account, no cloud |
| 🔊 **Ambient Sound** | Atmospheric audio via Web Audio API (drone + soft bells) |
| 🖨️ **Print / Export** | Save or print your ofrenda as a keepsake |
| ✨ **Particle Effects** | Floating marigold-coloured orbs fill the background |
| 📱 **Responsive** | Works beautifully on desktop, tablet, and mobile |

---

## 🚀 Quick Start

### 1. Clone or Download

```bash
git clone https://github.com/your-username/la-ofrenda-digital.git
cd la-ofrenda-digital
```

Or simply download the ZIP and extract it.

### 2. Open in Browser

This is a **zero-dependency, zero-build** web app. Just open the file:

```bash
# Option A — double-click index.html in your file explorer

# Option B — serve locally (recommended for full feature support)
npx serve .
# or
python -m http.server 8080
```

Then visit `http://localhost:8080` in your browser.

### 3. (Optional) Enable AI Features with Ollama

For AI-generated remembrances, install [Ollama](https://ollama.com) and pull a model:

```bash
# Install Ollama — https://ollama.com/download

# Pull a recommended model (choose one)
ollama pull llama3.2        # Best quality
ollama pull mistral          # Fast & lightweight
ollama pull gemma2           # Google's open model
ollama pull phi3             # Compact & capable

# Start the Ollama server
ollama serve
```

The app automatically detects Ollama at `http://localhost:11434` and selects the best available model. A **green indicator** in the hero section confirms the connection.

> **No Ollama?** No problem — the app falls back to a beautifully crafted template-based remembrance automatically.

---

## 🗂️ Project Structure

```
week 5/
├── index.html      # App structure & semantic HTML
├── style.css       # Full design system & animations
├── app.js          # All app logic, AI integration & state
└── README.md       # This file
```

| File | Purpose |
|---|---|
| `index.html` | Semantic HTML5 — 6 sections: Hero, Setup, Offerings, Loading, Ofrenda, Gallery |
| `style.css` | CSS custom properties, animations, glassmorphism, responsive layout |
| `app.js` | State management, Ollama API calls, localStorage, Web Audio, particle system |

---

## 🎨 Design System

The visual identity is rooted in the colours and symbolism of **Día de los Muertos**:

| Token | Value | Usage |
|---|---|---|
| `--gold` | `#f5a623` | Primary accent, titles, borders |
| `--marigold` | `#ff7b00` | Gradients, CTA buttons |
| `--rose` | `#e74c8b` | Relationship text, accents |
| `--bg-deep` | `#0c0608` | Page background |
| `--cream` | `#fdf3e3` | Body text, remembrance prose |
| `--font-display` | Cinzel Decorative | Hero titles |
| `--font-serif` | Playfair Display | Remembrance, names |
| `--font-body` | Inter | UI labels, buttons |

### Key Animations

- **Papel picado** — CSS `sway` keyframes on clipped banner triangles
- **Candle flames** — 5-step `flicker` keyframe with scale + rotate + opacity
- **Skull icon** — `floatBob` ease-in-out infinite loop
- **Particles** — Canvas-based floating orbs in marigold palette
- **Loading bar** — `loadPulse` mimics AI processing progress

---

## 🤖 AI Integration Details

The app communicates with Ollama's REST API entirely from the browser:

```
POST http://localhost:11434/api/generate
```

**Model selection** is automatic — the app fetches available models from `/api/tags` and prefers models matching `llama`, `mistral`, `gemma`, or `phi`.

**The prompt** is dynamically built from:
- Person's name, years, and relationship
- Personality description
- Food, song, and object offerings
- A written memory (optional)

**Fallback behavior** — if Ollama is unreachable, a rich template-based remembrance is generated client-side automatically.

---

## 🧩 User Flow

```
Hero Page
   │
   ├─▶ Begin Your Ofrenda ──▶ Add Your Loved One (Setup Form)
   │                                │
   │                                ▼
   │                        Add Offerings
   │                     (Foods · Songs · Objects · Memory)
   │                                │
   │                                ▼
   │                    AI Generation (Ollama)
   │                      or Fallback Template
   │                                │
   │                                ▼
   │                    Ofrenda Display (Altar)
   │                     Save · Print · Regenerate
   │
   └─▶ View Ofrendas ──▶ Gallery (localStorage)
                           View · Delete Saved Ofrendas
```

---

## 🔒 Privacy First

- **Zero cloud dependency** — no APIs, no accounts, no tracking
- **All data stays local** — photos, names, and memories stored only in `localStorage`
- **Offline capable** — the full app works without internet (fonts/AI optional)
- **AI runs on your machine** — Ollama executes the LLM locally; no data sent to any server

---

## 🛠️ Browser Compatibility

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Full support |
| Firefox 88+ | ✅ Full support |
| Edge 90+ | ✅ Full support |
| Safari 15+ | ✅ Full support |
| Mobile Chrome | ✅ Responsive |
| Mobile Safari | ✅ Responsive |

---

## 🌐 Recommended Ollama Models

| Model | Size | Best For |
|---|---|---|
| `llama3.2` | ~2 GB | Best prose quality |
| `mistral` | ~4 GB | Balanced quality + speed |
| `gemma2:2b` | ~1.6 GB | Fast, low resource |
| `phi3:mini` | ~2.3 GB | Efficient on older hardware |
| `qwen2.5` | ~4.7 GB | Multilingual support |

---

## 📜 Built for Hacktoberfest 2024

This project was built during **Hacktoberfest Week 5** — exploring the intersection of cultural heritage, AI, and open-source web development.

**Topics:** `hacktoberfest` · `day-of-the-dead` · `ollama` · `local-ai` · `memorial` · `vanilla-js` · `web-app`

---

## 🤝 Contributing

Contributions are warmly welcomed! Here are some ideas:

- 🌍 **i18n** — Spanish, Portuguese, French translations
- 🖼️ **Image export** — `html2canvas` PNG export of the ofrenda
- 🎵 **Music links** — Embed YouTube/Spotify links for favourite songs
- 📅 **Reminders** — Annual reminder on Día de los Muertos (Nov 1–2)
- 🌐 **Share link** — Generate a read-only shareable URL

### Steps

```bash
# 1. Fork the repository
# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes and commit
git commit -m "feat: add image export functionality"

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

Please follow the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🙏 Acknowledgements

- **[Ollama](https://ollama.com)** — for making local LLMs accessible to everyone
- **[Google Fonts](https://fonts.google.com)** — Cinzel Decorative, Playfair Display, Inter
- **Día de los Muertos tradition** — for the rich cultural inspiration
- **Hacktoberfest 2024** — for the creative challenge

---

<p align="center">
  Made with 🌼 and candlelight &nbsp;·&nbsp; <em>In memory of all those we carry in our hearts</em>
</p>
#
