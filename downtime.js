import { db, auth } from "../firebase/config.js";
import {
  collection, addDoc, query, where,
  orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { setStatus, formatMinutes } from "../components/ui.js";

let downtimeStart = null;
let dtInterval = null;

const CATEGORIES = ["Equipment failure", "Labor shortage", "System/IT", "Break", "Training", "Other"];

export function initDowntimeCategories() {
  const sel = document.getElementById("downtimeCategory");
  if (!sel) return;
  sel.innerHTML = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join("");
}

export function startDowntime() {
  if (downtimeStart) return;
  const reason = document.getElementById("downtimeCategory")?.value || "Other";

  downtimeStart = Date.now();
  document.getElementById("startDowntimeBtn").disabled = true;
  document.getElementById("downtimeStatus").textContent = `Tracking: ${reason}`;

  dtInterval = setInterval(() => {
    const elapsed = (Date.now() - downtimeStart) / 60000;
    document.getElementById("downtimeElapsed").textContent = formatMinutes(elapsed);
  }, 1000);

  document.getElementById("activeTimerBanner").style.display = "flex";
  document.getElementById("activeTimerLabel").textContent = "Downtime timer active";
}

export async function stopDowntime(userProfile) {
  if (!downtimeStart) { setStatus("downtimeStatus", "No active downtime.", "error"); return; }

  clearInterval(dtInterval);
  dtInterval = null;

  const endTime = Date.now();
  const minutes = (endTime - downtimeStart) / 60000;
  const reason = document.getElementById("downtimeCategory")?.value || "Other";
  const notes = document.getElementById("downtimeNotes")?.value || "";

  const log = {
    userId: auth.currentUser.uid,
    userName: userProfile?.name || "Unknown",
    reason,
    notes,
    startTime: downtimeStart,
    endTime,
    duration: parseFloat(minutes.toFixed(2)),
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "downtimeLogs"), log);
    setStatus("downtimeStatus", `Logged ${formatMinutes(minutes)} of downtime (${reason})`, "success");
  } catch (e) {
    setStatus("downtimeStatus", "Error saving downtime.", "error");
  }

  downtimeStart = null;
  document.getElementById("startDowntimeBtn").disabled = false;
  document.getElementById("downtimeElapsed").textContent = "0 min";
  document.getElementById("activeTimerBanner").style.display = "none";
}

export function listenDowntimeLogs(uid, onUpdate) {
  const q = query(
    collection(db, "downtimeLogs"),
    where("userId", "==", uid),
    orderBy("startTime", "desc")
  );
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

export function renderDowntimeLog(logs) {
  const el = document.getElementById("downtimeLog");
  if (!el) return;
  if (!logs.length) { el.innerHTML = '<p class="muted">No downtime logged yet.</p>'; return; }

  const totals = {};
  logs.forEach(l => { totals[l.reason] = (totals[l.reason] || 0) + l.duration; });

  el.innerHTML = `
    <div class="downtime-summary">
      ${Object.entries(totals).map(([r, m]) => `
        <div class="log-row">
          <span class="log-reason">${r}</span>
          <span class="log-dur">${formatMinutes(m)}</span>
        </div>`).join("")}
    </div>
    <div class="log-header muted" style="margin-top:12px">Recent events</div>
    ${logs.slice(0, 8).map(l => `
      <div class="log-row">
        <span class="log-date">${new Date(l.startTime).toLocaleDateString([],{month:'short',day:'numeric'})}</span>
        <span class="log-reason">${l.reason}</span>
        <span class="log-dur">${formatMinutes(l.duration)}</span>
        ${l.notes ? `<span class="log-notes muted">${l.notes}</span>` : ""}
      </div>`).join("")}`;
}
