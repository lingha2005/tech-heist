# 🕵️ TECH-HEIST

> **Operation Omega** — a cyberpunk-themed, real-time campus treasure hunt built for **Fiesta'26**, organised by the Department of Biomedical Engineering, KPR Institute of Engineering and Technology (KPRIET).

**🔗 Live site:** [tech-heist.vercel.app](https://tech-heist.vercel.app)

---

## 📖 About the Project

The Omega Mainframe, the core of a smart-city grid, has been compromised. Teams play as elite operatives who must decipher intercepted signals, debug corrupted systems and hunt down clues hidden around the physical campus, all while a shared clock keeps ticking.

Tech-Heist is a mix of an **online puzzle terminal** and a **real-world scavenger hunt**. Teams log in on a single device, work through four levels that alternate between the browser and physical QR-code checkpoints, and race to open the final "Omega Box". The fastest team on the clock wins.

The project has two sides:

| Side | Route | Who uses it |
|------|-------|-------------|
| **Operative Terminal** | `/` | Participating teams |
| **Mission Control** | `/admin` | Event organisers |

---

## 🎮 Game Flow

| Level | Theme | What the team does |
|-------|-------|--------------------|
| **1** | Signal Interception | Decode a flashing symbolic transmission using a physical decoder sheet hidden on campus, then enter the decimal sequence. |
| **2** | Smart City Water Terminal | Find the physical clue to bypass the firewall, then debug a buggy Python program in the built-in code editor and run it to get the access key. |
| **3** | Virtual Hardware Override | Scan a QR code at a campus location to bypass the firewall, then debug a virtual circuit on Tinkercad and decode its pulses. |
| **4** | The Omega Box | Find the last QR code, solve a sliding-tile puzzle to reveal a vocal passphrase, give it to the Overseer in person and receive the final completion code from the box. |
| **5** | Mission Complete | Timer stops and the final time is shown. Ranking is decided on the admin dashboard. |

> 🔒 Answers, access codes and the puzzle passphrase are intentionally not documented here so the hunt stays fun for future participants.

---

## ✨ Features

**For participants**
- 🔐 Team login with a shared event access code
- 🧠 Four themed levels mixing cipher-solving, coding, electronics and physical exploration
- 💻 In-browser Python editor with a simulated compiler and realistic error messages (copy, cut and paste are disabled so teams have to actually fix the code)
- 🧩 Built-in 3×3 sliding puzzle for the final level
- 🗺️ Campus map overlay, available any time after login
- ⏱️ Live team timer that survives page refreshes and re-logins
- 📜 Welcome screen with the rules of engagement, plus a mission briefing before each level

**For organisers**
- 📊 Live leaderboard, sorted by level reached, with each team's timer
- ⏸️ One-click **Pause / Resume** for every team at once. Paused time is subtracted so nobody is penalised.
- 🏁 Finished teams' clocks freeze at their completion time
- 💥 Password-protected "Nuke" button to wipe all teams before a fresh run

**Under the hood**
- 🔄 Real-time sync with Firestore, so pausing from the admin panel instantly freezes every team's screen
- 💾 Progress is stored per team, so closing the tab or switching browsers won't lose your place

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev), plain CSS (neon-terminal theme) |
| Database | [Firebase Firestore](https://firebase.google.com/docs/firestore) (real-time listeners) |
| Fonts | [Geist](https://vercel.com/font) via `next/font` |
| Linting | ESLint 9 with `eslint-config-next` |
| Hosting | [Vercel](https://vercel.com) |

---

## 📁 Project Structure

```
tech-heist/
├── public/
│   └── tech-heist-map.png     # Campus map shown in the in-game map overlay
├── src/
│   ├── firebase.js            # Firebase / Firestore initialisation
│   └── app/
│       ├── layout.js          # Root layout and fonts
│       ├── globals.css        # Neon-green terminal theme
│       ├── page.js            # Participant experience: login, levels, timer, puzzles
│       └── admin/
│           └── page.js        # Mission Control: leaderboard, pause/resume, reset
├── eslint.config.mjs
├── jsconfig.json              # "@/*" path alias → ./src/*
├── next.config.mjs
└── package.json
```

---

## 🗄️ Data Model

Each team is a single document in the `teams` collection. The document ID is the team name, uppercased, with spaces replaced by underscores.

| Field | Type | Purpose |
|-------|------|---------|
| `name` | string | Team display name |
| `currentLevel` | number | 1–4 while playing, `5` once finished |
| `startedAt` | number (ms) | When the team first logged in |
| `pausedAt` | number \| null | Set while the event is paused |
| `totalPaused` | number (ms) | Total time spent paused, subtracted from the timer |
| `finishedAt` | number \| null | Completion timestamp, freezes the timer |
| `welcome_seen`, `level1_seen`, `level2_seen`, `level3_seen` | boolean | Whether intro screens have been shown |
| `level2_access_granted`, `level3_access_granted`, `level4_access_granted` | boolean | Whether the physical "firewall" code for that level has been cracked |

**Elapsed time** = `(finishedAt ‖ pausedAt ‖ now) − startedAt − totalPaused`

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org) 18.18 or later (required by Next.js 16)
- A [Firebase](https://console.firebase.google.com) project with **Firestore Database** enabled

### 1. Clone and install

```bash
git clone https://github.com/lingha2005/tech-heist.git
cd tech-heist
npm install
```

### 2. Connect your own Firebase project

Open `src/firebase.js` and replace the `firebaseConfig` values with your own web app config (Firebase Console → Project settings → Your apps).

### 3. Run the dev server

```bash
npm run dev
```

Then open:
- `http://localhost:3000` for the participant terminal
- `http://localhost:3000/admin` for Mission Control

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## 🎛️ Running Your Own Event

If you want to reuse Tech-Heist for another event, here is what to change:

1. **Firebase:** Point `src/firebase.js` at your own project and set Firestore security rules that suit your event.
2. **Access codes and answers:** All login codes, level answers and the admin code are defined in `src/app/page.js` and `src/app/admin/page.js`. Replace every one of them with your own.
3. **Clues and story:** Edit the briefing and clue text in `src/app/page.js` to match your venue.
4. **Campus map:** Swap `public/tech-heist-map.png` with your own map.
5. **Level 3 circuit:** Update the Tinkercad link to your own shared circuit.
6. **Page title:** Update the `metadata` in `src/app/layout.js`.

---

## ☁️ Deployment

Tech-Heist is deployed on **Vercel** and live at **[tech-heist.vercel.app](https://tech-heist.vercel.app/)**.

Want your own copy? Import the repository into [Vercel](https://vercel.com/new) and deploy with the default Next.js settings. See the [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying) for other hosting options.

---

## 👥 Credits

Organised by the **Department of Biomedical Engineering, KPR Institute of Engineering and Technology (KPRIET)** as part of **Fiesta'26**.

Maintained by [@lingha2005](https://github.com/lingha2005).
