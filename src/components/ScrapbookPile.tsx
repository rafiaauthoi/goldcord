import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";
import Cord from "./Cord";
import { DEMO_GOAL, HAND_SIZE, dealHand, formatHours } from "../lib/demoSessions";
import type { DemoSession } from "../lib/demoSessions";

type Body = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  vr: number;
  held: boolean;
  used: boolean;
  ox: number;
  oy: number;
  lx: number;
  ly: number;
  lt: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  r: number;
  vr: number;
  color: string;
  delay: number;
};

type Deal = {
  id: number;
  hand: DemoSession[];
};

const ZONE_HEIGHT = 128;
const CARDS_TOP = 84;
const MAX_SWAY = 7;
const CARD_COLORS = [
  "var(--danger)",
  "var(--gold-text)",
  "var(--ink)",
  "var(--success)",
  "var(--ink-hover)",
  "var(--ink-soft)",
];
const PIN_COLORS = ["var(--danger)", "var(--success)", "var(--gold)", "var(--ink)"];
const CONFETTI = ["#c9a227", "#a9861a", "#1b2440", "#f1e6c4", "#fffdf8", "#3f6b52"];
const ARROWS: Record<string, [number, number]> = {
  ArrowLeft: [-14, 0],
  ArrowRight: [14, 0],
  ArrowUp: [0, -14],
  ArrowDown: [0, 14],
};

function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function emptyBody(): Body {
  return { x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0, held: false, used: false, ox: 0, oy: 0, lx: 0, ly: 0, lt: 0 };
}

function cardTransform(body: Body) {
  return `translate(${body.x}px, ${body.y}px) rotate(${body.r}deg)`;
}

export default function ScrapbookPile({ onStartReal }: { onStartReal: () => void }) {
  const hangRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const bodies = useRef<Body[]>([]);
  const totalRef = useRef(0);
  const zIndex = useRef(10);
  const physicsFrame = useRef(0);
  const confettiFrame = useRef(0);
  const swayFrame = useRef(0);
  const running = useRef(false);
  const timers = useRef<number[]>([]);
  const swing = useRef({ angle: 0, speed: 0, running: false, dragging: false, lastX: 0 });

  const [deal, setDeal] = useState<Deal>(() => ({ id: 0, hand: dealHand() }));
  const [used, setUsed] = useState<boolean[]>(() => Array(HAND_SIZE).fill(false));
  const [total, setTotal] = useState(0);
  const [over, setOver] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const runSway = useCallback(() => {
    const state = swing.current;
    const hang = hangRef.current;
    if (!hang || state.running || reducedMotion()) return;
    state.running = true;
    const loop = () => {
      state.speed += -0.03 * state.angle - 0.06 * state.speed;
      state.angle = Math.max(-MAX_SWAY, Math.min(MAX_SWAY, state.angle + state.speed));
      hang.style.transform = `rotate(${state.angle}deg)`;
      if (Math.abs(state.angle) + Math.abs(state.speed) > 0.01 || state.dragging) {
        swayFrame.current = requestAnimationFrame(loop);
      } else {
        state.angle = 0;
        state.speed = 0;
        state.running = false;
        hang.style.transform = "";
      }
    };
    swayFrame.current = requestAnimationFrame(loop);
  }, []);

  const nudge = useCallback(
    (force: number) => {
      swing.current.speed += force;
      runSway();
    },
    [runSway],
  );

  const paint = useCallback((index: number) => {
    const el = cardRefs.current[index];
    const body = bodies.current[index];
    if (!el || !body || body.used) return;
    el.style.transform = cardTransform(body);
  }, []);

  const clamp = useCallback((index: number) => {
    const desk = deskRef.current;
    const el = cardRefs.current[index];
    const body = bodies.current[index];
    if (!desk || !el || !body) return;
    const maxX = desk.clientWidth - el.offsetWidth;
    const maxY = desk.clientHeight - el.offsetHeight;
    if (body.x < 0) {
      body.x = 0;
      body.vx *= -0.5;
    }
    if (body.x > maxX) {
      body.x = maxX;
      body.vx *= -0.5;
    }
    if (body.y < 8) {
      body.y = 8;
      body.vy *= -0.5;
    }
    if (body.y > maxY) {
      body.y = maxY;
      body.vy *= -0.5;
    }
  }, []);

  const inZone = useCallback((index: number) => {
    const desk = deskRef.current;
    const el = cardRefs.current[index];
    const body = bodies.current[index];
    if (!desk || !el || !body) return false;
    return body.y + el.offsetHeight * 0.55 > desk.clientHeight - ZONE_HEIGHT;
  }, []);

  const addToCord = useCallback(
    (index: number) => {
      const desk = deskRef.current;
      const el = cardRefs.current[index];
      const body = bodies.current[index];
      if (!desk || !el || !body || body.used) return;
      body.used = true;
      body.held = false;
      el.style.transition = "transform 0.35s ease-in, opacity 0.35s ease";
      el.style.transform = `translate(${body.x}px, ${desk.clientHeight - 80}px) rotate(0deg) scale(0.4)`;
      const session = deal.hand[index];
      totalRef.current += session.hours;
      const next = totalRef.current;
      setTotal(next);
      setUsed((previous) => previous.map((value, i) => (i === index ? true : value)));
      setAnnouncement(
        `${session.org} added. ${formatHours(next)} of ${DEMO_GOAL} hours.${next >= DEMO_GOAL ? " You did it!" : ""}`,
      );
      nudge(Math.random() < 0.5 ? -0.35 : 0.35);
    },
    [deal, nudge],
  );

  const step = useCallback(() => {
    let moving = false;
    bodies.current.forEach((body, index) => {
      if (body.held || body.used) return;
      if (Math.abs(body.vx) + Math.abs(body.vy) + Math.abs(body.vr) < 0.05) return;
      body.x += body.vx;
      body.y += body.vy;
      body.r = Math.max(-14, Math.min(14, body.r + body.vr));
      body.vx *= 0.9;
      body.vy *= 0.9;
      body.vr *= 0.85;
      clamp(index);
      paint(index);
      if (inZone(index)) {
        addToCord(index);
        return;
      }
      moving = true;
    });
    if (moving) {
      physicsFrame.current = requestAnimationFrame(step);
    } else {
      running.current = false;
    }
  }, [addToCord, clamp, inZone, paint]);

  const startPhysics = useCallback(() => {
    if (running.current) return;
    running.current = true;
    physicsFrame.current = requestAnimationFrame(step);
  }, [step]);

  useLayoutEffect(() => {
    const desk = deskRef.current;
    if (!desk) return;
    const width = desk.clientWidth;
    const cardWidth = cardRefs.current[0]?.offsetWidth ?? 130;
    const narrow = width < 420;
    const cols = narrow ? 2 : 3;
    const slot = (width - cardWidth - 16) / (cols - 1);
    const rowGap = narrow ? 72 : 150;
    bodies.current = deal.hand.map((_, index) => {
      const body = emptyBody();
      const col = index % cols;
      const row = Math.floor(index / cols);
      body.x = Math.max(8, Math.min(width - cardWidth - 8, 8 + col * slot + Math.random() * 12));
      body.y = CARDS_TOP + row * rowGap + Math.random() * 14;
      body.r = Math.random() * 14 - 7;
      return body;
    });

    const animate = deal.id > 0 && !reducedMotion();
    cardRefs.current.forEach((el, index) => {
      if (!el) return;
      const body = bodies.current[index];
      el.style.zIndex = String(zIndex.current++);
      if (!animate) {
        el.style.transition = "";
        el.style.opacity = "";
        paint(index);
        return;
      }
      el.style.transition = "none";
      el.style.opacity = "0";
      el.style.transform = `translate(${body.x}px, -260px) rotate(${body.r * 3}deg)`;
    });
    if (!animate) return;

    void desk.offsetWidth;
    cardRefs.current.forEach((el, index) => {
      if (!el) return;
      const delay = index * 70;
      el.style.transition = `transform 0.6s cubic-bezier(0.2, 1.25, 0.4, 1) ${delay}ms, opacity 0.25s ease ${delay}ms`;
      el.style.opacity = "1";
      paint(index);
    });
    const settle = window.setTimeout(() => {
      cardRefs.current.forEach((el, index) => {
        if (el && !bodies.current[index]?.used) el.style.transition = "";
      });
      nudge(0.5);
    }, 1000);
    return () => window.clearTimeout(settle);
  }, [deal, paint, nudge]);

  useEffect(() => {
    function handleResize() {
      bodies.current.forEach((_, index) => {
        clamp(index);
        paint(index);
      });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clamp, paint]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      cancelAnimationFrame(physicsFrame.current);
      cancelAnimationFrame(confettiFrame.current);
      cancelAnimationFrame(swayFrame.current);
      pending.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const burst = useCallback(() => {
    const desk = deskRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!desk || !canvas || !ctx) return;
    const width = desk.clientWidth;
    const height = desk.clientHeight - ZONE_HEIGHT;
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const speed = Math.max(8, width / 48);
    const particles: Particle[] = [];
    for (const [originX, direction] of [
      [0, 1],
      [width, -1],
    ]) {
      for (let i = 0; i < 75; i += 1) {
        const angle = (0.12 + Math.random() * 0.55) * (Math.PI / 2);
        const velocity = speed * (0.6 + Math.random() * 0.6);
        particles.push({
          x: originX,
          y: height * 0.8 + (Math.random() - 0.5) * 40,
          vx: Math.cos(angle) * velocity * direction,
          vy: -Math.sin(angle) * velocity * 1.25,
          w: 5 + Math.random() * 7,
          h: 3 + Math.random() * 9,
          r: Math.random() * 6,
          vr: (Math.random() - 0.5) * 0.4,
          color: CONFETTI[i % CONFETTI.length],
          delay: Math.random() * 140,
        });
      }
    }

    const start = performance.now();
    function draw(now: number) {
      if (!ctx) return;
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - 1500) / 600);
      for (const p of particles) {
        if (elapsed < p.delay) continue;
        p.vy += 0.26;
        p.vx *= 0.982;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (elapsed < 2100) {
        confettiFrame.current = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    }
    confettiFrame.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    if (total < DEMO_GOAL || celebrating) return;
    const reduce = reducedMotion();
    const burstTimer = window.setTimeout(() => {
      if (!reduce) burst();
    }, reduce ? 0 : 1000);
    const noteTimer = window.setTimeout(() => setCelebrating(true), reduce ? 0 : 1350);
    return () => {
      window.clearTimeout(burstTimer);
      window.clearTimeout(noteTimer);
    };
  }, [total, celebrating, burst]);

  function newDeal() {
    if (leaving) return;
    cancelAnimationFrame(physicsFrame.current);
    cancelAnimationFrame(confettiFrame.current);
    running.current = false;
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    totalRef.current = 0;
    setTotal(0);
    setCelebrating(false);
    setOver(false);
    setAnnouncement("New pile dealt.");
    const previous = deal.hand.map((session) => session.org);
    const swap = () => {
      setUsed(Array(HAND_SIZE).fill(false));
      setLeaving(false);
      setDeal((current) => ({ id: current.id + 1, hand: dealHand(previous) }));
    };
    if (reducedMotion()) {
      swap();
      return;
    }
    setLeaving(true);
    later(swap, 200);
  }

  function handlePointerDown(index: number, event: PointerEvent<HTMLDivElement>) {
    const body = bodies.current[index];
    if (!body || body.used) return;
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-held");
    event.currentTarget.style.transition = "";
    event.currentTarget.style.zIndex = String(zIndex.current++);
    body.held = true;
    body.ox = event.clientX - body.x;
    body.oy = event.clientY - body.y;
    body.lx = event.clientX;
    body.ly = event.clientY;
    body.lt = performance.now();
    body.vx = 0;
    body.vy = 0;
  }

  function handlePointerMove(index: number, event: PointerEvent<HTMLDivElement>) {
    const body = bodies.current[index];
    if (!body || !body.held) return;
    const now = performance.now();
    const dt = Math.max(16, now - body.lt);
    body.vx = ((event.clientX - body.lx) / dt) * 16;
    body.vy = ((event.clientY - body.ly) / dt) * 16;
    body.lx = event.clientX;
    body.ly = event.clientY;
    body.lt = now;
    body.x = event.clientX - body.ox;
    body.y = event.clientY - body.oy;
    body.r = Math.max(-20, Math.min(20, body.r + body.vx * 0.15));
    clamp(index);
    paint(index);
    setOver(inZone(index));
  }

  function handlePointerUp(index: number, event: PointerEvent<HTMLDivElement>) {
    const body = bodies.current[index];
    if (!body || !body.held) return;
    body.held = false;
    event.currentTarget.classList.remove("is-held");
    setOver(false);
    if (inZone(index)) {
      addToCord(index);
      return;
    }
    if (reducedMotion()) {
      body.vx = 0;
      body.vy = 0;
      body.vr = 0;
      return;
    }
    body.vr = body.vx * 0.4;
    startPhysics();
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLDivElement>) {
    const body = bodies.current[index];
    if (!body || body.used) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      addToCord(index);
      return;
    }
    const move = ARROWS[event.key];
    if (!move) return;
    event.preventDefault();
    event.currentTarget.style.zIndex = String(zIndex.current++);
    body.x += move[0];
    body.y += move[1];
    clamp(index);
    paint(index);
    if (inZone(index)) addToCord(index);
  }

  function onFrame(target: EventTarget) {
    return target instanceof Element && !target.closest(".pile-desk");
  }

  function handleFrameDown(event: PointerEvent<HTMLDivElement>) {
    if (!onFrame(event.target) || reducedMotion()) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-grabbed");
    swing.current.dragging = true;
    swing.current.lastX = event.clientX;
    runSway();
  }

  function handleFrameMove(event: PointerEvent<HTMLDivElement>) {
    const state = swing.current;
    if (!state.dragging) return;
    state.speed += (event.clientX - state.lastX) * 0.012;
    state.lastX = event.clientX;
  }

  function handleFrameUp(event: PointerEvent<HTMLDivElement>) {
    if (!swing.current.dragging) return;
    swing.current.dragging = false;
    event.currentTarget.classList.remove("is-grabbed");
  }

  function handleFrameDoubleClick(event: MouseEvent<HTMLDivElement>) {
    if (!onFrame(event.target)) return;
    nudge(Math.random() < 0.5 ? -1.8 : 1.8);
  }

  return (
    <div className="pile">
      <div className="pile-hang" ref={hangRef}>
        <svg className="pile-string" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M16 100 L50 7 L84 100" vectorEffect="non-scaling-stroke" />
        </svg>
        <span className="pile-nail" aria-hidden="true" />
        <div
          className="pile-frame"
          onPointerDown={handleFrameDown}
          onPointerMove={handleFrameMove}
          onPointerUp={handleFrameUp}
          onPointerCancel={handleFrameUp}
          onDoubleClick={handleFrameDoubleClick}
        >
          <div className="pile-desk" ref={deskRef} data-ui>
            <canvas className="pile-confetti" ref={canvasRef} aria-hidden="true" />

            <p className={`pile-label${celebrating ? " is-hidden" : ""}`}>
              <span className="pile-pin pile-pin-left" aria-hidden="true" />
              <span className="pile-pin pile-pin-right" aria-hidden="true" />
              Drag all six cards onto the cord to finish your year.
            </p>

            {deal.hand.map((session, index) => (
              <div
                key={`${deal.id}-${session.org}`}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className={`pile-card${used[index] ? " is-used" : ""}${leaving ? " is-leaving" : ""}`}
                role="button"
                tabIndex={used[index] ? -1 : 0}
                aria-label={`${session.org}, ${session.task}, ${formatHours(session.hours)} hours. Press Enter to add it to the cord.`}
                onPointerDown={(event) => handlePointerDown(index, event)}
                onPointerMove={(event) => handlePointerMove(index, event)}
                onPointerUp={(event) => handlePointerUp(index, event)}
                onPointerCancel={(event) => handlePointerUp(index, event)}
                onKeyDown={(event) => handleKeyDown(index, event)}
              >
                <span
                  className="pile-pin"
                  style={{ background: PIN_COLORS[index % PIN_COLORS.length] }}
                  aria-hidden="true"
                />
                <div className="pile-photo" style={{ background: CARD_COLORS[index % CARD_COLORS.length] }} aria-hidden="true">
                  {session.org}
                </div>
                <p className="pile-task" aria-hidden="true">
                  {session.task}
                </p>
                <p className="pile-hours num" aria-hidden="true">
                  {formatHours(session.hours)} hrs
                </p>
              </div>
            ))}

            <div className={`pile-note${celebrating ? " is-on" : ""}`} aria-hidden={!celebrating}>
              <span className="pile-tape" aria-hidden="true" />
              <p className="pile-note-title">You did it!</p>
              <p className="pile-note-text">
                That's your 20 hours for this school year. Come back in July to start a fresh cord, or
                if you're graduating, <em>congratulations, wear it proudly.</em>
              </p>
              <button type="button" className="small" onClick={onStartReal} tabIndex={celebrating ? 0 : -1}>
                Start your real cord
              </button>
            </div>

            <div className={`pile-zone${over ? " is-over" : ""}`}>
              <div className="pile-zone-row">
                <p className="pile-count">
                  <span className="pile-total num">{formatHours(total)}</span> of {DEMO_GOAL} sample hours.
                  {total >= DEMO_GOAL ? " Cord complete." : ""}
                </p>
                <button type="button" className="link pile-deal" onClick={newDeal}>
                  Deal a new pile
                </button>
              </div>
              <Cord value={total} max={DEMO_GOAL} label="Sample hours on the demo cord" />
            </div>
          </div>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}