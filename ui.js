// ── Shared UI utility helpers ────────────────────────────────

export function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const el = document.getElementById(pageId);
  if (el) el.classList.add("active");
}

export function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const el = document.getElementById(viewId);
  if (el) el.classList.add("active");
  document.querySelectorAll(".nav-btn").forEach(b => {
    b.classList.toggle("active", b.dataset.view === viewId);
  });
}

export function setStatus(elId, msg, type = "info") {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.className = `status-msg status-${type}`;
}

export function formatMinutes(min) {
  if (min < 60) return `${min.toFixed(1)} min`;
  return `${(min / 60).toFixed(1)} hr`;
}

export function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function formatDate(ts) {
  return new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function scoreColor(uph, target = 60) {
  const pct = uph / target;
  if (pct >= 0.95) return "green";
  if (pct >= 0.75) return "yellow";
  return "red";
}

export function buildKpiCard(label, value, sub, color = "") {
  return `
    <div class="kpi-card ${color}">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value">${value}</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ""}
    </div>`;
}
