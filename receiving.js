import { db, auth } from "../firebase/config.js";
import {
  collection, addDoc, query, where,
  orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { setStatus, formatMinutes, scoreColor } from "../components/ui.js";

let receivingStart = null;
let timerInterval = null;

// ── Start receiving timer ────────────────────────────────────
export function startReceiving() {
  if (receivingStart) return;
  const units = Number(document.getElementById("unitsInput")?.value || 0);
  if (!units) { setStatus("receivingStatus", "Enter units first.", "error"); return; }

  receivingStart = Date.now();
  document.getElementById("receivingStatus").textContent = "Timer running...";
  document.getElementById("startReceivingBtn").disabled = true;

  // Live clock
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - receivingStart) / 60000;
    document.getElementById("receivingElapsed").textContent =
      formatMinutes(elapsed);
  }, 1000);

  document.getElementById("activeTimerBanner").style.display = "flex";
  document.getElementById("activeTimerLabel").textContent = "Receiving timer active";
}

// ── Stop + save to Firestore ─────────────────────────────────
export async function stopReceiving(userProfile) {
  if (!receivingStart) { setStatus("receivingStatus", "No active timer.", "error"); return; }

  clearInterval(timerInterval);
  timerInterval = null;

  const endTime = Date.now();
  const minutes = (endTime - receivingStart) / 60000;
  const units = Number(document.getElementById("unitsInput")?.value || 0);
  const unitsPerHour = minutes > 0 ? units / (minutes / 60) : 0;
  const efficiency = Math.min(100, Math.round((unitsPerHour / 60) * 100));

  const session = {
    userId: auth.currentUser.uid,
    userName: userProfile?.name || "Unknown",
    startTime: receivingStart,
    endTime,
    units,
    minutes,
    unitsPerHour: parseFloat(unitsPerHour.toFixed(2)),
    efficiency,
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "receivingSessions"), session);
    setStatus("receivingStatus", `Saved: ${unitsPerHour.toFixed(1)} UPH · ${efficiency}% efficiency`, "success");
  } catch (e) {
    setStatus("receivingStatus", "Error saving session.", "error");
  }

  receivingStart = null;
  document.getElementById("startReceivingBtn").disabled = false;
  document.getElementById("receivingElapsed").textContent = "0 min";
  document.getElementById("activeTimerBanner").style.display = "none";
}

// ── Listen to own sessions in real-time ──────────────────────
export function listenReceivingSessions(uid, onUpdate) {
  const q = query(
    collection(db, "receivingSessions"),
    where("userId", "==", uid),
    orderBy("startTime", "desc")
  );
  return onSnapshot(q, snap => {
    const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    onUpdate(sessions);
  });
}

// ── Render session log ───────────────────────────────────────
export function renderSessionLog(sessions) {
  const el = document.getElementById("receivingLog");
  if (!el) return;
  if (!sessions.length) { el.innerHTML = '<p class="muted">No sessions yet.</p>'; return; }

  el.innerHTML = sessions.slice(0, 10).map(s => `
    <div class="log-row">
      <span class="log-date">${new Date(s.startTime).toLocaleDateString([], {month:'short',day:'numeric'})}</span>
      <span class="log-units">${s.units} units</span>
      <span class="log-uph kpi-${scoreColor(s.unitsPerHour)}">${s.unitsPerHour.toFixed(1)} UPH</span>
      <span class="log-eff">${s.efficiency}% eff.</span>
      <span class="log-dur">${formatMinutes(s.minutes)}</span>
    </div>
  `).join("");
}
