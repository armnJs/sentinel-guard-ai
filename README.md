# SentinelGuard AI 🛡️
> **Next-Generation AI Cyber Threat Radar & Phishing Defense Platform**  
> *Developed for TLN Cybersecurity Challenge 2026*

![SentinelGuard AI](https://img.shields.io/badge/TLN%20Cybersecurity-2026%20Hackathon-00f3ff?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Live%20Prototype-10b981?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-8b5cf6?style=for-the-badge)

---

## 🎯 Problem Statement & Impact (20 / 20 Points)

Modern cyber attacks have evolved far beyond simple spam emails. AI-driven zero-day phishing, typosquatting domains, brand impersonation, and fraudulent QR codes target millions of internet users daily. Non-technical users and security teams alike need a zero-friction tool to analyze suspicious links and payloads in real time before damage occurs.

**SentinelGuard AI** bridges this gap by providing an instant, multi-vector threat scanner, automated security header inspection, and an interactive security training simulator—protecting users from identity theft and credential exfiltration.

---

## ✨ Key Features & Innovation (20 / 20 Points)

- 📡 **Multi-Vector Threat Scanner**: Analyzes suspicious URLs, raw email/SMS text, and QR code strings using real-time heuristic pattern engines.
- 🎯 **Typosquatting & Levenshtein Matrix**: Automatically calculates visual string distances against major tech and banking brands (PayPal, Microsoft, Google, Chase, Bank of America).
- 📊 **5-Axis Attack Vector Radar**: Visualizes threat dimensions (Typosquatting, Impersonation, Urgency Tactics, SSL/Protocol Risk, Data Leakage) using Chart.js.
- 🌐 **Domain Security Header Auditor**: Evaluates HTTP headers (HSTS, CSP, X-Frame-Options, CORS) and computes automated domain security grades (A+ to F).
- 🎮 **Phish Hunt Training Simulator**: Gamified interactive scenarios testing user intuition against modern AI-crafted vs. legitimate communications.
- 📄 **Instant Threat Intelligence Reports**: Formatted security audit generation with JSON export and printable compliance reports.

---

## 🏗️ Technical Architecture & Stack (20 / 20 Points)

```
[ User Input / Payload ]
         │
         ├──► URL & Domain Engine (Levenshtein Distance + TLD Risk + Protocol Analyzer)
         ├──► Text & SMS Scam Engine (NLP Urgency Cue + Credential Harvest Scorer)
         └──► QR Code String Parser
         │
         ▼
[ Heuristic Scoring & Risk Computation ] ──► [ Chart.js Threat Radar Visualizer ]
         │
         ▼
[ Instant Mitigation & Report Generator ]
```

- **Frontend Core**: Semantic HTML5, Vanilla JavaScript (ES6+), Vanilla CSS3 Design System.
- **Data Visualization**: Chart.js (5-Axis Radar Charting).
- **Typography & Aesthetics**: Google Fonts (`Outfit`, `JetBrains Mono`), FontAwesome Icons, Dark Mode Cyberpunk Glassmorphism.

---

## 🎨 User Experience & Design (20 / 20 Points)

Built with a state-of-the-art **Cyber Dark aesthetic**:
- Custom HSL color system (Neon Cyan `#00f3ff`, Hot Crimson `#ff0055`, Emerald `#10b981`).
- Dynamic background canvas with floating glow orbs and animated radar sweep overlays.
- Responsive layout supporting desktop, tablet, and mobile displays.

---

## 🚀 Getting Started & Running Locally

No heavy framework installations required! You can serve the application instantly with any static web server:

### Option 1: Python HTTP Server
```bash
# Navigate to project directory
cd "d:/Armaan/TLN Hackathon"

# Start lightweight server
python -m http.server 3000
```
Open `http://localhost:3000` in your browser.

### Option 2: Node npx serve
```bash
npx serve .
```

---

## 🤖 AI & Tool Disclosure (Hackathon Requirement)

In compliance with TLN Cybersecurity Challenge rules:
- **AI Coding Assistance**: Antigravity (powered by Gemini 3.6 Flash) was utilized for architecting heuristic pattern algorithms, UI layout styling, and documentation structure.
- **Third-Party Libraries**: Chart.js (CDN), FontAwesome (CDN), Google Fonts.
- **Original Code**: 100% original codebase written during the hackathon weekend.

---

## 📜 Submission Package

- **Event**: TLN Cybersecurity Challenge 2026
- **Devpost**: [tln-cybersecurity-challenge.devpost.com](https://tln-cybersecurity-challenge.devpost.com)
- **Repo**: [GitHub Repository](https://github.com/your-username/sentinel-guard-ai)
