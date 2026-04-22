# 📦 Warehouse KPI Platform

A multi-user SaaS warehouse performance tracking system with Manager and Employee roles, real-time KPI dashboards, timers, downtime tracking, and task assignments — powered by Firebase.

---

## 🚀 Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/kpi-warehouse-app.git
cd kpi-warehouse-app
```

### 2. Set up Firebase

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g. `warehouse-kpi`)
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database** (start in test mode)
5. Go to Project Settings → Your Apps → Add Web App
6. Copy your config and paste it into `src/firebase/config.js`

### 3. Configure your Firebase credentials

Open `src/firebase/config.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 4. Deploy to Firebase Hosting (optional)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

Or just open `index.html` directly in your browser for local use.

---

## 👥 Roles

| Role | Capabilities |
|------|-------------|
| **Manager** | View all employees, compare performance, assign tasks, see leaderboard |
| **Employee** | Log receiving sessions, track downtime, view own KPIs |

To make someone a Manager, set their `role` field to `"manager"` in Firestore under the `users` collection.

---

## 📁 File Structure

```
kpi-warehouse-app/
├── index.html              # App entry point
├── src/
│   ├── firebase/
│   │   └── config.js       # Firebase setup (add your keys here)
│   ├── auth/
│   │   └── auth.js         # Login / register / role logic
│   ├── pages/
│   │   ├── dashboard.js    # Manager live dashboard
│   │   ├── receiving.js    # Receiving timer + logging
│   │   ├── downtime.js     # Downtime tracker
│   │   └── assignments.js  # Task management
│   ├── components/
│   │   └── ui.js           # Shared UI helpers
│   └── styles/
│       └── styles.css      # All styles
├── .gitignore
└── README.md
```

---

## 🔥 Firestore Collections

| Collection | Description |
|---|---|
| `users` | User profiles with name + role |
| `receivingSessions` | Timer sessions with units/hour |
| `downtimeLogs` | Downtime events with reason + duration |
| `tasks` | Assignments with status tracking |

---

## 📊 KPI Metrics Tracked

- Units per hour (UPH)
- Total units processed
- Downtime duration + reason
- Efficiency score per employee
- Dock-to-stock time
- Task completion rate

---

## 🛡️ Security

Before going to production, update your Firestore rules in the Firebase console:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /receivingSessions/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 📬 Support

Built as a starter SaaS warehouse platform. Fork, extend, and sell!
