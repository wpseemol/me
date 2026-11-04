import type { SheetContent, Skill } from "./skillsData";

const W = 1024;
const H = 1360;

function paperColors(dark: boolean) {
  return dark
    ? {
        bg: "#121826",
        bg2: "#171f30",
        ink: "#eef2ff",
        body: "rgba(238,242,255,0.64)",
        muted: "rgba(238,242,255,0.42)",
        rule: "rgba(67,228,255,0.12)",
        track: "rgba(255,255,255,0.12)",
      }
    : {
        bg: "#f3efe6",
        bg2: "#faf7f1",
        ink: "#17140f",
        body: "rgba(23,20,15,0.62)",
        muted: "rgba(23,20,15,0.42)",
        rule: "rgba(27,99,255,0.12)",
        track: "rgba(0,0,0,0.1)",
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
  return c;
}

function drawIntro(
  ctx: CanvasRenderingContext2D,
  content: Extract<SheetContent, { kind: "intro" }>,
  dark: boolean,
) {
  const c = paintBase(ctx, dark);
  const pad = 64;
  ctx.fillStyle = c.muted;
  ctx.font = "500 22px ui-monospace, monospace";
  ctx.fillText("INTRODUCTION", pad, pad + 10);

  ctx.fillStyle = c.ink;
  ctx.font = "600 48px Georgia, 'Times New Roman', serif";
  wrapText(ctx, content.title, pad, pad + 70, W - pad * 2, 56, 2);

  ctx.fillStyle = c.body;
  ctx.font = "400 26px system-ui, sans-serif";
  let y = wrapText(ctx, content.lede, pad, pad + 160, W - pad * 2, 36, 4);

  y += 24;
  const colW = (W - pad * 2 - 24) / 2;
  content.skills.forEach((s, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = pad + col * (colW + 24);
    const yy = y + row * 34;
    ctx.fillStyle = c.muted;
    ctx.font = "500 18px ui-monospace, monospace";
    ctx.fillText(String(i + 1).padStart(2, "0"), x, yy);
    ctx.fillStyle = c.ink;
    ctx.font = "600 20px system-ui, sans-serif";
    ctx.fillText(s.name, x + 42, yy);
  });

  ctx.fillStyle = c.muted;
  ctx.font = "500 18px ui-monospace, monospace";
  ctx.fillText(content.footer, pad, H - pad);
}

function drawSkill(
  ctx: CanvasRenderingContext2D,
  content: Extract<SheetContent, { kind: "skill" }>,
  dark: boolean,
  compact: boolean,
) {
  const c = paintBase(ctx, dark);
  const pad = 64;
  const { skill, index, total } = content;

  ctx.fillStyle = c.muted;
  ctx.font = "500 20px ui-monospace, monospace";
  ctx.fillText(
    `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`,
    W - pad - 90,
    pad + 8,
  );

  ctx.fillStyle = c.muted;
  ctx.font = "500 20px ui-monospace, monospace";
  ctx.fillText(skill.group.toUpperCase(), pad, pad + 48);

  ctx.fillStyle = c.ink;
  ctx.font = "700 56px system-ui, sans-serif";
  ctx.fillText(skill.name, pad, pad + 120);

  ctx.fillStyle = c.body;
  ctx.font = "600 26px system-ui, sans-serif";
  let y = wrapText(ctx, skill.blurb, pad, pad + 170, W - pad * 2, 36, 2);

  y += 28;
  ctx.fillStyle = c.muted;
  ctx.font = "500 18px ui-monospace, monospace";
  ctx.fillText("HOW I LEARNED", pad, y);
  y += 36;
  ctx.fillStyle = c.body;
  ctx.font = "400 24px system-ui, sans-serif";
  y = wrapText(
    ctx,
    skill.learned,
    pad,
    y,
    W - pad * 2,
    34,
    compact ? 8 : 5,
  );

  if (!compact) {
    y += 20;
    skill.practice.slice(0, 2).forEach((item) => {
      ctx.fillStyle = c.ink;
      ctx.beginPath();
      ctx.arc(pad + 6, y - 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c.body;
      ctx.font = "400 22px system-ui, sans-serif";
      y = wrapText(ctx, item, pad + 22, y, W - pad * 2 - 22, 30, 1) + 10;
    });
  }

  // Level bar
  const barY = H - pad - 36;
  ctx.fillStyle = c.muted;
  ctx.font = "500 18px ui-monospace, monospace";
  ctx.fillText("LEVEL", pad, barY - 16);
  ctx.fillText(`${skill.level}%`, W - pad - 50, barY - 16);
  ctx.fillStyle = c.track;
  roundRect(ctx, pad, barY, W - pad * 2, 14, 7);
  ctx.fill();
  ctx.fillStyle = "#1b63ff";
  roundRect(ctx, pad, barY, ((W - pad * 2) * skill.level) / 100, 14, 7);
  ctx.fill();
}

function drawNotes(
  ctx: CanvasRenderingContext2D,
  content: Extract<SheetContent, { kind: "notes" }>,
  dark: boolean,
) {
  const c = paintBase(ctx, dark);
  const pad = 64;
  ctx.fillStyle = c.muted;
  ctx.font = "500 22px ui-monospace, monospace";
  ctx.fillText(content.title.toUpperCase(), pad, pad + 20);
  ctx.fillStyle = c.ink;
  ctx.font = "600 42px Georgia, 'Times New Roman', serif";
  wrapText(ctx, content.body, pad, pad + 100, W - pad * 2, 52, 5);
  ctx.fillStyle = c.muted;
  ctx.font = "500 20px ui-monospace, monospace";
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
  else if (content.kind === "skill")
    drawSkill(ctx, content, dark, verso);
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
  const pad = 64;
  ctx.fillStyle = c.muted;
  ctx.font = "500 22px ui-monospace, monospace";
  ctx.fillText(eyebrow.toUpperCase(), pad, pad + 20);
  ctx.fillStyle = c.ink;
  ctx.font = "600 44px Georgia, 'Times New Roman', serif";
  let y = wrapText(ctx, title, pad, pad + 90, W - pad * 2, 52, 3);
  y += 24;
  ctx.fillStyle = c.body;
  ctx.font = "400 26px system-ui, sans-serif";
  wrapText(ctx, body, pad, y, W - pad * 2, 36, 8);
  return canvas;
}

export function createPageEdgeCanvas(dark: boolean): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const a = dark ? "#2a3348" : "#f4efe4";
  const b = dark ? "#1c2436" : "#e2d8c8";
  for (let y = 0; y < 1024; y += 3) {
    ctx.fillStyle = Math.floor(y / 3) % 2 === 0 ? a : b;
    ctx.fillRect(0, y, 64, 3);
  }
  const g = ctx.createLinearGradient(0, 0, 64, 0);
  g.addColorStop(0, "rgba(0,0,0,0.35)");
  g.addColorStop(0.5, "transparent");
  g.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 1024);
  return canvas;
}

export type { Skill };
