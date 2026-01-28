import {
  App,
  applyDocumentTheme,
  applyHostFonts,
  applyHostStyleVariables,
} from "@modelcontextprotocol/ext-apps";

const planTitleEl = document.getElementById("planTitle") as HTMLHeadingElement;
const metaEl = document.getElementById("meta") as HTMLSpanElement;
const statusEl = document.getElementById("status") as HTMLSpanElement;
const kpiEl = document.getElementById("kpi") as HTMLSpanElement;
const progressBarEl = document.getElementById("progressBar") as HTMLDivElement;
const stepsCountEl = document.getElementById("stepsCount") as HTMLSpanElement;

const refreshBtn = document.getElementById("refresh") as HTMLButtonElement;
const prevBtn = document.getElementById("prevStep") as HTMLButtonElement;
const nextBtn = document.getElementById("nextStep") as HTMLButtonElement;

const stepListEl = document.getElementById("stepList") as HTMLDivElement;

const detailEmptyEl = document.getElementById("detailEmpty") as HTMLDivElement;
const detailEl = document.getElementById("detail") as HTMLDivElement;
const stepTitleEl = document.getElementById("stepTitle") as HTMLHeadingElement;
const stepDescEl = document.getElementById("stepDesc") as HTMLDivElement;
const stepBadgesEl = document.getElementById("stepBadges") as HTMLDivElement;
const actionsEl = document.getElementById("actions") as HTMLDivElement;

const btnApprove = document.getElementById("btnApprove") as HTMLButtonElement;
const btnReject = document.getElementById("btnReject") as HTMLButtonElement;
const btnSkip = document.getElementById("btnSkip") as HTMLButtonElement;

const reviewerEl = document.getElementById("reviewer") as HTMLInputElement;
const stepCommentEl = document.getElementById("stepComment") as HTMLTextAreaElement;
const addStepCommentBtn = document.getElementById("addStepComment") as HTMLButtonElement;

const commentsEl = document.getElementById("comments") as HTMLDivElement;
const commentsCountEl = document.getElementById("commentsCount") as HTMLSpanElement;

type ToolResult = {
  content?: Array<{ type: string; text?: string }>;
};

type PlanDTO = {
  planId: string;
  metadata?: { title?: string };
  planType?: string;
  status?: string;
  steps?: StepDTO[];
};

type StepDTO = {
  id: string;
  title: string;
  description: string;
  kind?: string;
  status?: string;
  estimatedDuration?: { value: number; unit: string } | string;
  actions?: Array<{ type: string; description?: string; command?: string; filePath?: string }>;
  comments?: Array<{ id: string; content: string; author?: string; createdAt: string }>;
  reviewStatus?: { decision: "approved" | "rejected" | "skipped"; timestamp: string; reviewer?: string };
};

const state: {
  planId?: string;
  plan?: PlanDTO;
  selectedStepId?: string;
} = {};

function setStatus(text: string) {
  statusEl.textContent = text;
}

function setMeta(text: string) {
  metaEl.textContent = text;
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function pillClassForDecision(decision?: string): string {
  if (decision === "approved") return "pill ok";
  if (decision === "rejected") return "pill bad";
  if (decision === "skipped") return "pill warn";
  return "pill";
}

function parseToolJson(result: ToolResult): any {
  const text = result.content?.find((c) => c.type === "text")?.text;
  if (!text) return result;
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

function computeProgress(steps: StepDTO[]) {
  const total = steps.length;
  const reviewed = steps.filter((s) => Boolean(s.reviewStatus?.decision)).length;
  const percent = total ? Math.round((reviewed / total) * 100) : 0;
  return { total, reviewed, percent };
}

function clearChildren(el: HTMLElement) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function renderStepList() {
  clearChildren(stepListEl);
  const steps = state.plan?.steps ?? [];
  stepsCountEl.textContent = `${steps.length} steps`;

  for (const step of steps) {
    const item = document.createElement("div");
    item.className = "stepItem";
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-current", String(step.id === state.selectedStepId));

    const left = document.createElement("div");
    const title = document.createElement("div");
    title.className = "stepTitle";
    title.textContent = step.title || step.id;
    left.appendChild(title);

    const meta = document.createElement("div");
    meta.className = "stepMeta";
    const kind = document.createElement("span");
    kind.textContent = step.kind ? step.kind : "step";
    kind.className = "kbd";
    meta.appendChild(kind);

    const status = document.createElement("span");
    status.textContent = step.status || "pending";
    status.className = "pill";
    meta.appendChild(status);

    if (step.reviewStatus?.decision) {
      const rs = document.createElement("span");
      rs.textContent = step.reviewStatus.decision;
      rs.className = pillClassForDecision(step.reviewStatus.decision);
      meta.appendChild(rs);
    }

    left.appendChild(meta);

    const right = document.createElement("div");
    right.style.display = "flex";
    right.style.alignItems = "center";
    const chevron = document.createElement("span");
    chevron.className = "muted";
    chevron.textContent = "→";
    right.appendChild(chevron);

    item.appendChild(left);
    item.appendChild(right);

    item.addEventListener("click", () => selectStep(step.id));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        selectStep(step.id);
      }
    });

    stepListEl.appendChild(item);
  }

  // Keep the current selection visible when the list is scrollable.
  const selected = stepListEl.querySelector('[aria-current="true"]') as HTMLElement | null;
  if (selected) {
    selected.scrollIntoView({ block: "nearest" });
  }
}

function renderActions(step: StepDTO) {
  clearChildren(actionsEl);
  const actions = step.actions ?? [];
  if (!actions.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No actions for this step.";
    actionsEl.appendChild(empty);
    return;
  }

  for (const a of actions) {
    const card = document.createElement("div");
    card.className = "actionCard";
    const icon = document.createElement("div");
    icon.className = "actionIcon";
    icon.textContent = a.type === "run_command" ? ">_" : "◆";
    const body = document.createElement("div");

    const t = document.createElement("div");
    t.style.fontWeight = "650";
    t.style.fontSize = "12px";
    t.textContent = a.type;
    body.appendChild(t);

    if (a.description) {
      const d = document.createElement("div");
      d.className = "muted";
      d.textContent = a.description;
      d.style.marginTop = "4px";
      body.appendChild(d);
    }

    if (a.command) {
      const cmd = document.createElement("div");
      cmd.style.marginTop = "8px";
      cmd.innerHTML = `<span class="kbd">${escapeHtml(a.command)}</span>`;
      body.appendChild(cmd);
    }

    if (a.filePath) {
      const fp = document.createElement("div");
      fp.style.marginTop = "8px";
      fp.innerHTML = `<span class="kbd">${escapeHtml(a.filePath)}</span>`;
      body.appendChild(fp);
    }

    card.appendChild(icon);
    card.appendChild(body);
    actionsEl.appendChild(card);
  }
}

function renderComments(step: StepDTO) {
  clearChildren(commentsEl);
  const comments = step.comments ?? [];
  commentsCountEl.textContent = String(comments.length);

  if (!comments.length) {
    const empty = document.createElement("div");
    empty.className = "muted";
    empty.textContent = "No comments yet.";
    commentsEl.appendChild(empty);
    return;
  }

  for (const c of comments) {
    const card = document.createElement("div");
    card.className = "comment";
    const head = document.createElement("div");
    head.className = "commentHead";
    const left = document.createElement("span");
    left.textContent = `${c.author ?? "unknown"} • ${new Date(c.createdAt).toLocaleString()}`;
    head.appendChild(left);
    const body = document.createElement("div");
    body.className = "commentBody";
    body.textContent = c.content;
    card.appendChild(head);
    card.appendChild(body);
    commentsEl.appendChild(card);
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function selectStep(stepId: string) {
  state.selectedStepId = stepId;
  renderStepList();

  const step = state.plan?.steps?.find((s) => s.id === stepId);
  if (!step) return;

  detailEmptyEl.style.display = "none";
  detailEl.style.display = "block";

  stepTitleEl.textContent = step.title;
  stepDescEl.textContent = step.description || "";

  clearChildren(stepBadgesEl);
  const b1 = document.createElement("span");
  b1.className = "kbd";
  b1.textContent = step.kind ?? "step";
  stepBadgesEl.appendChild(b1);
  const b2 = document.createElement("span");
  b2.className = "pill";
  b2.textContent = step.status ?? "pending";
  stepBadgesEl.appendChild(b2);
  if (step.reviewStatus?.decision) {
    const b3 = document.createElement("span");
    b3.className = pillClassForDecision(step.reviewStatus.decision);
    b3.textContent = `review: ${step.reviewStatus.decision}`;
    stepBadgesEl.appendChild(b3);
  }

  renderActions(step);
  renderComments(step);

  const idx = (state.plan?.steps ?? []).findIndex((s) => s.id === stepId);
  prevBtn.disabled = idx <= 0;
  nextBtn.disabled = idx === -1 || idx >= (state.plan?.steps?.length ?? 0) - 1;
  addStepCommentBtn.disabled = !state.planId || !stepId;
}

async function refreshPlan() {
  if (!state.planId) return;
  setStatus("refreshing");
  const result = await app.callServerTool({
    name: "plans-review-ui",
    arguments: { planId: state.planId },
  });
  const parsed = parseToolJson(result as any);
  state.plan = parsed as PlanDTO;
  renderPlan();
  setStatus("ready");
}

function renderPlan() {
  const plan = state.plan;
  if (!plan) return;

  const title = plan.metadata?.title || "Plan Review";
  planTitleEl.textContent = title;
  setMeta(`planId: ${plan.planId}`);

  const steps = plan.steps ?? [];
  const { total, reviewed, percent } = computeProgress(steps);
  kpiEl.textContent = `${reviewed}/${total}`;
  progressBarEl.style.width = `${percent}%`;

  renderStepList();
  if (state.selectedStepId && steps.some((s) => s.id === state.selectedStepId)) {
    selectStep(state.selectedStepId);
  } else if (steps.length) {
    selectStep(steps[0].id);
  } else {
    detailEmptyEl.style.display = "block";
    detailEl.style.display = "none";
  }
}

const app = new App({ name: "Plan Review", version: "1.0.0" });

app.onhostcontextchanged = (ctx) => {
  if (ctx.theme) applyDocumentTheme(ctx.theme);
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
  if (ctx.styles?.css?.fonts) applyHostFonts(ctx.styles.css.fonts);

  if (ctx.safeAreaInsets) {
    const { top, right, bottom, left } = ctx.safeAreaInsets;
    const root = document.documentElement;
    root.style.setProperty("--safe-top", `${top}px`);
    root.style.setProperty("--safe-right", `${right}px`);
    root.style.setProperty("--safe-bottom", `${bottom}px`);
    root.style.setProperty("--safe-left", `${left}px`);
  }
};

app.ontoolinput = (params) => {
  const planId = (params.arguments as any)?.planId as string | undefined;
  state.planId = planId;
  setMeta(planId ? `planId: ${planId}` : "no planId provided");
  refreshBtn.disabled = !planId;
};

app.ontoolresult = (result) => {
  setStatus("ready");
  const parsed = parseToolJson(result as any);
  state.plan = parsed as PlanDTO;
  renderPlan();
};

refreshBtn.addEventListener("click", async () => {
  if (!state.planId) return;
  try {
    await refreshPlan();
  } catch (err) {
    setStatus("error");
    setMeta(`error: ${String(err)}`);
  }
});

prevBtn.addEventListener("click", () => {
  const steps = state.plan?.steps ?? [];
  const idx = steps.findIndex((s) => s.id === state.selectedStepId);
  if (idx > 0) selectStep(steps[idx - 1].id);
});

nextBtn.addEventListener("click", () => {
  const steps = state.plan?.steps ?? [];
  const idx = steps.findIndex((s) => s.id === state.selectedStepId);
  if (idx >= 0 && idx < steps.length - 1) selectStep(steps[idx + 1].id);
});

async function setReviewDecision(decision: "approved" | "rejected" | "skipped") {
  if (!state.planId || !state.selectedStepId) return;
  setStatus("saving");
  await app.callServerTool({
    name: "steps-review-set",
    arguments: {
      planId: state.planId,
      stepId: state.selectedStepId,
      decision,
      reviewer: reviewerEl.value || undefined,
    },
  });
  await refreshPlan();
}

btnApprove.addEventListener("click", async () => {
  try {
    await setReviewDecision("approved");
  } catch (err) {
    setStatus("error");
    setMeta(`error: ${String(err)}`);
  }
});
btnReject.addEventListener("click", async () => {
  try {
    await setReviewDecision("rejected");
  } catch (err) {
    setStatus("error");
    setMeta(`error: ${String(err)}`);
  }
});
btnSkip.addEventListener("click", async () => {
  try {
    await setReviewDecision("skipped");
  } catch (err) {
    setStatus("error");
    setMeta(`error: ${String(err)}`);
  }
});

addStepCommentBtn.addEventListener("click", async () => {
  if (!state.planId || !state.selectedStepId) return;
  const content = stepCommentEl.value.trim();
  if (!content) return;
  setStatus("saving");
  try {
    await app.callServerTool({
      name: "steps-comment-add",
      arguments: {
        planId: state.planId,
        stepId: state.selectedStepId,
        content,
        author: reviewerEl.value || "reviewer",
      },
    });
    stepCommentEl.value = "";
    await refreshPlan();
  } catch (err) {
    setStatus("error");
    setMeta(`error: ${String(err)}`);
  }
});

setStatus("connecting");
app.connect();
