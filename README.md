# Prompt Battle • EEE FEST 2026
> **AI Prompt Engineering Competition Portal**  
> Organized by **IEEE Power & Energy Society (PES) DIU Student Branch Chapter** for **EEE FEST 2026**

[![Deploy to GitHub Pages](https://github.com/anik-creates/prompt-battle-2026/actions/workflows/deploy.yml/badge.svg)](https://github.com/anik-creates/prompt-battle-2026/actions/workflows/deploy.yml)
[![IEEE PES DIU SBC](https://img.shields.io/badge/Organizer-IEEE%20PES%20DIU%20SBC-6cb33f?style=flat-square)](https://daffodilvarsity.edu.bd/)
[![EEE FEST 2026](https://img.shields.io/badge/Event-EEE%20FEST%202026-00e5ff?style=flat-square)](https://daffodilvarsity.edu.bd/)

---

## ⚡ Live Links
- **GitHub Repository**: [https://github.com/anik-creates/prompt-battle-2026](https://github.com/anik-creates/prompt-battle-2026)
- **Live Website (GitHub Pages)**: [https://anik-creates.github.io/prompt-battle-2026/](https://anik-creates.github.io/prompt-battle-2026/)
- **Participant Submission View**: [https://anik-creates.github.io/prompt-battle-2026/#submit](https://anik-creates.github.io/prompt-battle-2026/#submit)
- **Admin Control Portal**: [https://anik-creates.github.io/prompt-battle-2026/#admin](https://anik-creates.github.io/prompt-battle-2026/#admin)

---

## 🎯 Architecture & Portals

The application is structured into two dedicated portals and a mobile participant submission view:

### 1. Presentation Portal (Auditorium & Projector Screen)
- **Big Battle Clock**: High-contrast, large-scale digital countdown clock readable across the entire venue.
- **Dynamic Scannable QR Code**: Automatically generated QR code projected on-screen for contenders to scan with their smartphone cameras.
- **Live Submission Stream**: Real-time ticker showing contenders who have finished, along with their high-precision recorded finish time (minutes & seconds).
- **Dynamic Leaderboard Reveal**: When the Admin clicks "Publish", the presentation screen smoothly transitions into the **Grand Leaderboard** with animated celebratory confetti and podium rankings.

### 2. Participant Submission Portal (Mobile & Laptop)
- Reached instantly by scanning the QR code (`#submit` or `?view=submit`).
- Mobile-optimized, frictionless form for contenders to enter their name, team ID, and optional prompt strategy notes.
- **"I Have Finished — Submit Time"** action button that captures exact elapsed battle seconds and freezes submission.
- Instant confirmation receipt showing their official recorded time.

### 3. Admin Control Portal (Judges & Adjudicators)
- **Password Protected**: Protected with administrator secret `eeefestadmin`.
- **Battle Timer Dispatcher**:
  - Quick presets: 10m, 15m, 20m, 30m, 45m, 60m or custom duration.
  - Start, Pause, Resume, and Reset battle timer with real-time broadcast.
- **Evaluation & Marking Matrix**:
  - **Finish Time**: Automatically recorded when participant submits (with manual edit override).
  - **Tokens Used**: Contender token consumption input.
  - **Objective Fulfilled**: Score (0 to 30 points).
  - **Finish Status**: Select status with custom details:
    - *Fully Completed* (20 pts)
    - *Substantially Completed* (16 pts)
    - *Partially Fulfilled* (12 pts)
    - *Minimal Fulfillment* (6 pts)
  - **Presentation Skill**: Score (0 to 25 points).
  - **Idea Novelty**: Score (0 to 25 points).
  - **Total Calculated Score**: Auto-computed out of 100 points.
- **Publish / Unpublish Master Switch**: 1-click toggle to broadcast the Official Leaderboard to the auditorium projector.
- **CSV & Data Export**: Download judge spreadsheets in CSV format.

---

## 🎨 Design System & Brand Identity

Designed strictly adhering to the event's specifications:
- **Dark Void Aesthetic**: Deep dark theme (`#06070a`, `#0a0d14`) optimized for auditorium projector contrast.
- **EEE FEST 2026 Gradients**: Cyber Cyan (`#00e5ff`), Neon Magenta/Pink (`#ff007a`), Amber Gold (`#ffb700`), and IEEE PES Green (`#6cb33f`).
- **Prominent Logos**:
  - IEEE PES DIU SBC logo rendered prominently in the top navbar alongside the EEE FEST 2026 logo.
  - Official Patron/Footer logo prominently showcased in the footer.
- **Plain, Minimalist Architecture (No Cards)**: Seamless continuous surfaces, razor-thin luminous dividers, and clean data tables instead of heavy, boxy cards.
- **Zero Emojis**: 100% SVG iconography powered by Lucide React.

---

## 🌐 Real-Time Synchronization Engine

The platform features a **hybrid dual-sync engine**:

1. **Local Multi-Tab Broadcast (Zero Config)**:
   - Uses the browser's native `BroadcastChannel` API and `localStorage` events.
   - Projector, Admin laptop, and simulated contender tabs on the same computer synchronize in under 5 milliseconds with zero internet or cloud dependencies.

2. **Cloud Multi-Device Sync (Firebase Firestore)**:
   - For live multi-device usage during the festival (participants on smartphones, admin on laptop, projector on venue PC):
   - Simply click **"Cloud Setup"** in the Admin panel and paste your free Firebase config JSON.
   - All devices immediately subscribe to real-time snapshot listeners.

---

## 🚀 Local Development

```bash
# Clone repository
git clone https://github.com/anik-creates/prompt-battle-2026.git
cd prompt-battle-2026

# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build
```

---

## ☁️ Hosting on Vercel

To host on your Vercel account:
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and import `anik-creates/prompt-battle-2026`.
3. Framework Preset: **Vite**.
4. Click **Deploy**. Vercel will deploy it in under 30 seconds.

---

## 🛡️ Admin Credentials
- **Password**: `eeefestadmin`
