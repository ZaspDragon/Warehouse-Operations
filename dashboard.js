import { db } from "../firebase/config.js";
import {
  collection, query, where, orderBy,
  onSnapshot, Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { buildKpiCard, scoreColor, formatMinutes } from "../components/ui.js";

// ── Listen to all receiving sessions (today) ─────────────────
export function listenManagerDashboard(onUpdate) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, "receivingSessions"),
    orderBy("startTime", "desc")
  );

  return onSnapshot(q, snap => {
    const allSessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const todaySessions = allSessions.filter(s => s.startTime >= todayStart.getTime());
    onUpdate(allSessions, todaySessions);
  });
}

export function listenManagerDowntime(onUpdate) {
  const q = query(collection(db, "downtimeLogs"), orderBy("startTime", "desc"));
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── Aggregate stats across employees ─────────────────────────
export function aggregateStats(sessions, dtLogs) {
  const byEmployee = {};

  sessions.forEach(s => {
    if (!byEmployee[s.userId]) {
      byEmployee[s.userId] = { name: s.userName, sessions: [], totalUnits: 0, totalMin: 0, totalDT: 0 };
    }
    byEmployee[s.userId].sessions.push(s);
    byEmployee[s.userId].totalUnits += s.units || 0;
    byEmployee[s.userId].totalMin += s.minutes || 0;
  });

  dtLogs.forEach(l => {
    if (byEmployee[l.userId]) byEmployee[l.userId].totalDT += l.duration || 0;
  });

  return Object.entries(byEmployee).map(([uid, e]) => ({
    uid,
    name: e.name,
    sessions: e.sessions.length,
    totalUnits: e.totalUnits,
    avgUPH: e.totalMin > 0 ? (e.totalUnits / (e.totalMin / 60)) : 0,
    totalDT: e.totalDT
  })).sort((a, b) => b.avgUPH - a.avgUPH);
}

// ── Render manager dashboard ──────────────────────────────────
export function renderManagerDashboard(sessions, dtLogs) {
  const stats = aggregateStats(sessions, dtLogs);
  const totalUnits = sessions.reduce((s, x) => s + (x.units || 0), 0);
  const totalDT = dtLogs.reduce((s, x) => s + (x.duration || 0), 0);
  const avgUPH = stats.length ? stats.reduce((s, e) => s + e.avgUPH, 0) / stats.length : 0;
  const top = stats[0];
  const bottom = stats[stats.length - 1];

  // Summary cards
  document.getElementById("mgr-kpis").innerHTML =
    buildKpiCard("Total Units Today", totalUnits, "All employees") +
    buildKpiCard("Avg UPH", avgUPH.toFixed(1), "Across team", scoreColor(avgUPH)) +
    buildKpiCard("Total Downtime", formatMinutes(totalDT), "All causes") +
    buildKpiCard("Active Employees", stats.length, "With sessions");

  // Leaderboard
  const lb = document.getElementById("leaderboard");
  if (!lb) return;
  if (!stats.length) { lb.innerHTML = '<p class="muted">No data yet.</p>'; return; }

  lb.innerHTML = `
    <table class="lb-table">
      <thead><tr><th>#</th><th>Employee</th><th>UPH</th><th>Units</th><th>Sessions</th><th>Downtime</th><th>Status</th></tr></thead>
      <tbody>
        ${stats.map((e, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${e.name}</td>
            <td class="kpi-${scoreColor(e.avgUPH)}">${e.avgUPH.toFixed(1)}</td>
            <td>${e.totalUnits}</td>
            <td>${e.sessions}</td>
            <td>${formatMinutes(e.totalDT)}</td>
            <td><span class="badge-${scoreColor(e.avgUPH)}">${scoreColor(e.avgUPH) === 'green' ? 'On target' : scoreColor(e.avgUPH) === 'yellow' ? 'Near target' : 'Below target'}</span></td>
          </tr>`).join("")}
      </tbody>
    </table>`;
}
