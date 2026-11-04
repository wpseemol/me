import type { SheetContent, Skill } from "./skillsData";

const W = 1280;
const H = 1700;

/** Light = warm paper; dark = night folio — both tuned for contrast. */
function paperColors(dark: boolean) {
  return dark
    ? {
        bg: "#0e1524",
        bg2: "#161f33",
        ink: "#f4f7ff",
        body: "rgba(244,247,255,0.78)",
        muted: "rgba(244,247,255,0.5)",
        rule: "rgba(67,228,255,0.16)",
        track: "rgba(255,255,255,0.14)",
        accent: "#4f80ff",
      }
    : {
        bg: "#f6f0e4",
        bg2: "#fffdf8",
        ink: "#14110c",
        body: "rgba(20,17,12,0.72)",
        muted: "rgba(20,17,12,0.48)",
        rule: "rgba(27,99,255,0.14)",
        track: "rgba(0,0,0,0.12)",
        accent: "#0b4ae6",
      };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const words = text.split(/\s+/);
  let line = "";
  let dy = y;
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i]!;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, dy);
      line = words[i]!;
      dy += lineHeight;
      lines++;
      if (lines >= maxLines) {
        ctx.fillText(line.slice(0, Math.max(1, line.length - 1)) + "…", x, dy);
        return dy + lineHeight;
      }
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, dy);
    dy += lineHeight;
  }
  return dy;
}

function paintBase(ctx: CanvasRenderingContext2D, dark: boolean) {
  const c = paperColors(dark);
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, c.bg2);
  g.addColorStop(1, c.bg);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Soft inner margin so pages feel printed
  ctx.strokeStyle = c.rule;
  ctx.lineWidth = 2;
  roundRect(ctx, 36, 36, W - 72, H - 72, 18);
  ctx.stroke();
  return c;
}

function drawIntro(
  ctx: CanvasRenderingContext2D,
  content: Extract<SheetContent, { kind: "intro" }>,
  dark: boolean,
) {
  const c = paintBase(ctx, dark);
  const pad = 80;
  ctx.fillStyle = c.muted;
  ctx.font = "600 28px ui-monospace, monospace";
  ctx.fillText("INTRODUCTION", pad, pad + 12);

  ctx.fillStyle = c.ink;
  ctx.font = "600 64px Georgia, 'Times New Roman', serif";
  wrapText(ctx, content.title, pad, pad + 90, W - pad * 2, 72, 2);

  ctx.fillStyle = c.body;
  ctx.font = "400 34px system-ui, sans-serif";
  let y = wrapText(ctx, content.lede, pad, pad + 210, W - pad * 2, 46, 4);

  y += 36;
  const colW = (W - pad * 2 - 32) / 2;
  content.skills.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = pad + col * (colW + 32);
    const yy = y + row * 44;
    ctx.fillStyle = c.muted;
    ctx.font = "600 24px ui-monospace, monospace";
    ctx.fillText(String(i + 1).padStart(2, "0"), x, yy);
    ctx.fillStyle = c.ink;
    ctx.font = "600 28px system-ui, sans-serif";
    ctx.fillText(s.name, x + 56, yy);
  });

  ctx.fillStyle = c.muted;
  ctx.font = "600 24px ui-monospace, monospace";
  ctx.fillText(content.footer, pad, H - pad);
}

function drawSkill(
  ctx: CanvasRenderingContext2D,
  content: Extract<SheetContent, { kind: "skill" }>,
  dark: boolean,
  compact: boolean,
) {
  const c = paintBase(ctx, dark);
  const pad = 80;
  const { skill, index, total } = content;

  ctx.fillStyle = c.muted;
  ctx.font = "600 26px ui-monospace, monospace";
  ctx.fillText(
    `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    W - pad - 120,
    pad + 10,
  );

  ctx.fillStyle = c.muted;
  ctx.font = "600 26px ui-monospace, monospace";
  ctx.fillText(skill.group.toUpperCase(), pad, pad + 56);

  ctx.fillStyle = c.ink;
  ctx.font = "700 72px system-ui, sans-serif";
  ctx.fillText(skill.name, pad, pad + 150);

  ctx.fillStyle = c.body;
  ctx.font = "600 34px system-ui, sans-serif";
  let y = wrapText(ctx, skill.blurb, pad, pad + 210, W - pad * 2, 46, 2);

  y += 36;
  ctx.fillStyle = c.muted;
  ctx.font = "600 24px ui-monospace, monospace";
  ctx.fillText("HOW I LEARNED", pad, y);
  y += 44;
  ctx.fillStyle = c.body;
  ctx.font = "400 32px system-ui, sans-serif";
  y = wrapText(
    ctx,
    skill.learned,
    pad,
    y,
    W - pad * 2,
    44,
    compact ? 9 : 6,
  );

  if (!compact) {
    y += 28;
    skill.practice.slice(0, 2).forEach((item) => {
      ctx.fillStyle = c.accent;
      ctx.beginPath();
      ctx.arc(pad + 8, y - 8, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.body;
      ctx.font = "400 28px system-ui, sans-serif";
      y = wrapText(ctx, item, pad + 28, y, W - pad * 2 - 28, 38, 1) + 14;
    });
  }

  const barY = H - pad - 48;
  ctx.fillStyle = c.muted;
  ctx.font = "600 24px ui-monospace, monospace";
  ctx.fillText("LEVEL", pad, barY - 20);
  ctx.fillText(`${skill.level}%`, W - pad - 70, barY - 20);
  ctx.fillStyle = c.track;
  roundRect(ctx, pad, barY, W - pad * 2, 18, 9);
  ctx.fill();
  ctx.fillStyle = c.accent;
  roundRect(ctx, pad, barY, ((W - pad * 2) * skill.level) / 100, 18, 9);
  ctx.fill();
}

function drawNotes(
  ctx: CanvasRenderingContext2D,
  content: Extract<SheetContent, { kind: "notes" }>,
  dark: boolean,
) {
  const c = paintBase(ctx, dark);
  const pad = 80;
  ctx.fillStyle = c.muted;
  ctx.font = "600 28px ui-monospace, monospace";
  ctx.fillText(content.title.toUpperCase(), pad, pad + 24);
  ctx.fillStyle = c.ink;
  ctx.font = "600 56px Georgia, 'Times New Roman', serif";
  wrapText(ctx, content.body, pad, pad + 120, W - pad * 2, 68, 5);
  ctx.fillStyle = c.muted;
  ctx.font = "600 26px ui-monospace, monospace";
  ctx.fillText(`@${content.handle}`, pad, H - pad);
}

export function createPageCanvas(
  content: SheetContent,
  dark: boolean,
  verso = false,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  if (content.kind === "intro") drawIntro(ctx, content, dark);
  else if (content.kind === "skill") drawSkill(ctx, content, dark, verso);
  else drawNotes(ctx, content, dark);
  return canvas;
}

export function createPlainPageCanvas(
  eyebrow: string,
  title: string,
  body: string,
  dark: boolean,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const c = paintBase(ctx, dark);
  const pad = 80;
  ctx.fillStyle = c.muted;
  ctx.font = "600 28px ui-monospace, monospace";
  ctx.fillText(eyebrow.toUpperCase(), pad, pad + 24);
  ctx.fillStyle = c.ink;
  ctx.font = "600 58px Georgia, 'Times New Roman', serif";
  let y = wrapText(ctx, title, pad, pad + 110, W - pad * 2, 68, 3);
  y += 32;
  ctx.fillStyle = c.body;
  ctx.font = "400 34px system-ui, sans-serif";
  wrapText(ctx, body, pad, y, W - pad * 2, 46, 8);
  return canvas;
}

export function createPageEdgeCanvas(dark: boolean): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 80;
  canvas.height = 1400;
  const ctx = canvas.getContext("2d")!;
  const a = dark ? "#2f3a52" : "#f7f1e6";
  const b = dark ? "#1c2436" : "#e5dccb";
  for (let y = 0; y < 1400; y += 3) {
    ctx.fillStyle = Math.floor(y / 3) % 2 === 0 ? a : b;
    ctx.fillRect(0, y, 80, 3);
  }
  const g = ctx.createLinearGradient(0, 0, 80, 0);
  g.addColorStop(0, dark ? "rgba(0,0,0,0.45)" : "rgba(0,0,0,0.28)");
  g.addColorStop(0.5, "transparent");
  g.addColorStop(1, dark ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.1)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 80, 1400);
  return canvas;
}

export type { Skill };
