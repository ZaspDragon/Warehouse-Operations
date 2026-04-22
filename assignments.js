import { db, auth } from "../firebase/config.js";
import {
  collection, addDoc, getDocs, doc, updateDoc,
  query, orderBy, onSnapshot, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { setStatus } from "../components/ui.js";

// ── Load employees for assignment dropdown ────────────────────
export async function loadEmployees() {
  const sel = document.getElementById("assignToSelect");
  if (!sel) return;
  const snap = await getDocs(query(collection(db, "users"), where("role","==","employee")));
  sel.innerHTML = `<option value="">Assign to...</option>` +
    snap.docs.map(d => `<option value="${d.id}">${d.data().name}</option>`).join("");
}

// ── Add a new task ────────────────────────────────────────────
export async function addTask(userProfile) {
  const text = document.getElementById("taskInput")?.value?.trim();
  const assignedTo = document.getElementById("assignToSelect")?.value;
  const priority = document.getElementById("taskPriority")?.value || "normal";
  if (!text) { setStatus("taskStatus", "Enter a task description.", "error"); return; }

  const task = {
    text,
    assignedTo: assignedTo || auth.currentUser.uid,
    assignedBy: auth.currentUser.uid,
    assignedByName: userProfile?.name || "Manager",
    priority,
    status: "pending",
    createdAt: serverTimestamp()
  };

  try {
    await addDoc(collection(db, "tasks"), task);
    document.getElementById("taskInput").value = "";
    setStatus("taskStatus", "Task added.", "success");
  } catch (e) {
    setStatus("taskStatus", "Error adding task.", "error");
  }
}

// ── Update task status ────────────────────────────────────────
export async function updateTaskStatus(taskId, status) {
  await updateDoc(doc(db, "tasks", taskId), { status });
}

// ── Listen to tasks for current user or all (manager) ────────
export function listenTasks(uid, isManager, onUpdate) {
  const q = isManager
    ? query(collection(db, "tasks"), orderBy("createdAt", "desc"))
    : query(collection(db, "tasks"), where("assignedTo", "==", uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => {
    onUpdate(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  });
}

// ── Render task list ─────────────────────────────────────────
export function renderTasks(tasks, isManager) {
  const el = document.getElementById("taskList");
  if (!el) return;
  if (!tasks.length) { el.innerHTML = '<p class="muted">No tasks yet.</p>'; return; }

  const STATUS_COLORS = { pending: "yellow", "in progress": "blue", done: "green" };

  el.innerHTML = tasks.map(t => `
    <div class="task-card priority-${t.priority}">
      <div class="task-header">
        <span class="task-text">${t.text}</span>
        <span class="task-badge kpi-${STATUS_COLORS[t.status] || 'yellow'}">${t.status}</span>
      </div>
      <div class="task-meta muted">
        By ${t.assignedByName || "—"} · ${t.priority} priority
      </div>
      <div class="task-actions">
        ${t.status !== "in progress" ? `<button class="btn-sm btn-blue" onclick="window._updateTask('${t.id}','in progress')">Start</button>` : ""}
        ${t.status !== "done" ? `<button class="btn-sm btn-green" onclick="window._updateTask('${t.id}','done')">Done</button>` : ""}
        ${t.status !== "pending" ? `<button class="btn-sm btn-gray" onclick="window._updateTask('${t.id}','pending')">Reset</button>` : ""}
      </div>
    </div>
  `).join("");
}
