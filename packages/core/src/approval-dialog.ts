import type { ApprovalRequest, ToolRisk } from "./types.js";

const RISK_CONFIG: Record<ToolRisk, { color: string; bg: string; label: string }> = {
  read: { color: "#059669", bg: "#d1fae5", label: "Read" },
  low: { color: "#16a34a", bg: "#dcfce7", label: "Low" },
  medium: { color: "#d97706", bg: "#fef3c7", label: "Medium" },
  high: { color: "#dc2626", bg: "#fee2e2", label: "High" },
  critical: { color: "#7c3aed", bg: "#ede9fe", label: "Critical" }
};

const DIALOG_ID = "webmcp-js-approval-dialog";

export function showApprovalDialog(request: ApprovalRequest): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof document === "undefined") {
      resolve(false);
      return;
    }

    if (document.getElementById(DIALOG_ID)) {
      resolve(false);
      return;
    }

    const risk = RISK_CONFIG[request.risk] ?? RISK_CONFIG.medium;
    let resolved = false;

    function dismiss(approved: boolean) {
      if (resolved) return;
      resolved = true;
      document.removeEventListener("keydown", handleKey);
      overlay.remove();
      resolve(approved);
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss(false);
    }

    const overlay = document.createElement("div");
    overlay.id = DIALOG_ID;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "webmcp-dialog-title");
    overlay.style.cssText = [
      "position:fixed",
      "inset:0",
      "z-index:2147483647",
      "background:rgba(17,24,39,0.65)",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "padding:16px",
      "box-sizing:border-box",
      "backdrop-filter:blur(2px)"
    ].join(";");

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) dismiss(false);
    });

    const dialog = document.createElement("div");
    dialog.style.cssText = [
      "background:#ffffff",
      "border-radius:12px",
      "box-shadow:0 24px 64px rgba(17,24,39,0.28),0 0 0 1px rgba(17,24,39,0.06)",
      "padding:24px",
      "width:min(420px,100%)",
      "box-sizing:border-box",
      "font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
    ].join(";");

    // Header row: icon + title
    const headerRow = document.createElement("div");
    headerRow.style.cssText = "display:flex;align-items:flex-start;gap:12px;margin-bottom:16px";

    const iconWrap = document.createElement("div");
    iconWrap.style.cssText = [
      `background:${risk.bg}`,
      `border:1.5px solid ${risk.color}40`,
      "border-radius:10px",
      "width:40px",
      "height:40px",
      "display:flex",
      "align-items:center",
      "justify-content:center",
      "flex-shrink:0"
    ].join(";");
    iconWrap.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 2.5L2.5 17.5H17.5L10 2.5Z" stroke="${risk.color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 8V11" stroke="${risk.color}" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="14" r="0.8" fill="${risk.color}"/></svg>`;

    const titleGroup = document.createElement("div");
    titleGroup.style.cssText = "flex:1;min-width:0";

    const title = document.createElement("h2");
    title.id = "webmcp-dialog-title";
    title.textContent = "Tool Approval Required";
    title.style.cssText = "font:700 16px/1.3 inherit;margin:0 0 4px;color:#111827";

    const toolName = document.createElement("div");
    toolName.textContent = request.tool;
    toolName.style.cssText = [
      "font:600 13px/1.2 ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace",
      "color:#6b7280",
      "overflow:hidden",
      "text-overflow:ellipsis",
      "white-space:nowrap"
    ].join(";");

    titleGroup.append(title, toolName);
    headerRow.append(iconWrap, titleGroup);
    dialog.append(headerRow);

    // Divider
    const divider = document.createElement("div");
    divider.style.cssText = "height:1px;background:#f3f4f6;margin:0 -24px 16px";
    dialog.append(divider);

    // Description
    const descEl = document.createElement("p");
    descEl.textContent = request.description;
    descEl.style.cssText = "font:400 14px/1.55 inherit;color:#374151;margin:0 0 14px";
    dialog.append(descEl);

    // Risk badge row
    const metaRow = document.createElement("div");
    metaRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:14px";

    const riskLabel = document.createElement("span");
    riskLabel.style.cssText = "font:500 13px/1 inherit;color:#6b7280";
    riskLabel.textContent = "Risk level:";

    const riskBadge = document.createElement("span");
    riskBadge.textContent = risk.label;
    riskBadge.style.cssText = [
      `background:${risk.bg}`,
      `color:${risk.color}`,
      `border:1px solid ${risk.color}50`,
      "border-radius:6px",
      "font:700 12px/1 inherit",
      "padding:3px 10px",
      "text-transform:uppercase",
      "letter-spacing:0.04em"
    ].join(";");

    metaRow.append(riskLabel, riskBadge);
    dialog.append(metaRow);

    // Reason box
    if (request.reason) {
      const reasonBox = document.createElement("div");
      reasonBox.style.cssText = [
        "background:#f9fafb",
        "border:1px solid #e5e7eb",
        "border-radius:8px",
        "padding:10px 12px",
        "margin-bottom:14px"
      ].join(";");
      const reasonText = document.createElement("p");
      reasonText.textContent = request.reason;
      reasonText.style.cssText = "font:400 13px/1.5 inherit;color:#4b5563;margin:0";
      reasonBox.append(reasonText);
      dialog.append(reasonBox);
    }

    // Dry run preview
    if (request.dryRunResult) {
      const dryRunBox = document.createElement("div");
      dryRunBox.style.cssText = [
        "background:#fffbeb",
        "border:1px solid #fde68a",
        "border-radius:8px",
        "padding:12px 14px",
        "margin-bottom:20px"
      ].join(";");

      const dryRunHeader = document.createElement("div");
      dryRunHeader.style.cssText = "display:flex;align-items:center;gap:6px;margin-bottom:6px";
      dryRunHeader.innerHTML = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 1.5v11M1.5 7h11" stroke="#d97706" stroke-width="1.6" stroke-linecap="round"/></svg>`;
      const dryRunLabel = document.createElement("span");
      dryRunLabel.textContent = "Preview";
      dryRunLabel.style.cssText = "font:600 12px/1 inherit;color:#92400e;text-transform:uppercase;letter-spacing:0.05em";
      dryRunHeader.append(dryRunLabel);
      dryRunBox.append(dryRunHeader);

      const summaryEl = document.createElement("p");
      summaryEl.textContent = request.dryRunResult.summary;
      summaryEl.style.cssText = "font:400 13px/1.5 inherit;color:#78350f;margin:0";
      dryRunBox.append(summaryEl);

      if (request.dryRunResult.effects && request.dryRunResult.effects.length > 0) {
        const effectsList = document.createElement("ul");
        effectsList.style.cssText = "margin:8px 0 0;padding:0 0 0 16px";
        for (const effect of request.dryRunResult.effects) {
          const li = document.createElement("li");
          li.textContent = effect;
          li.style.cssText = "font:400 12px/1.6 inherit;color:#92400e";
          effectsList.append(li);
        }
        dryRunBox.append(effectsList);
      }

      dialog.append(dryRunBox);
    }

    // Action buttons
    const actions = document.createElement("div");
    actions.style.cssText = "display:flex;gap:10px;justify-content:flex-end";

    const denyBtn = document.createElement("button");
    denyBtn.type = "button";
    denyBtn.textContent = "Deny";
    denyBtn.style.cssText = [
      "background:#ffffff",
      "border:1.5px solid #d1d5db",
      "border-radius:8px",
      "color:#374151",
      "cursor:pointer",
      "font:600 14px/1 inherit",
      "padding:9px 18px",
      "transition:background 0.1s,border-color 0.1s"
    ].join(";");
    denyBtn.addEventListener("mouseenter", () => {
      denyBtn.style.background = "#f9fafb";
      denyBtn.style.borderColor = "#9ca3af";
    });
    denyBtn.addEventListener("mouseleave", () => {
      denyBtn.style.background = "#ffffff";
      denyBtn.style.borderColor = "#d1d5db";
    });
    denyBtn.addEventListener("click", () => dismiss(false));

    const approveBtn = document.createElement("button");
    approveBtn.type = "button";
    approveBtn.textContent = "Approve";
    approveBtn.style.cssText = [
      `background:${risk.color}`,
      "border:1.5px solid transparent",
      "border-radius:8px",
      "color:#ffffff",
      "cursor:pointer",
      "font:600 14px/1 inherit",
      "padding:9px 18px",
      "transition:opacity 0.1s"
    ].join(";");
    approveBtn.addEventListener("mouseenter", () => {
      approveBtn.style.opacity = "0.88";
    });
    approveBtn.addEventListener("mouseleave", () => {
      approveBtn.style.opacity = "1";
    });
    approveBtn.addEventListener("click", () => dismiss(true));

    actions.append(denyBtn, approveBtn);
    dialog.append(actions);
    overlay.append(dialog);
    document.body.append(overlay);

    document.addEventListener("keydown", handleKey);

    // Focus the deny button by default (safer UX — approve is the intentional action)
    requestAnimationFrame(() => denyBtn.focus());
  });
}
