// A small spring for things you touch, the way Apple describes them: not a
// duration but a "response" (how fast it gets there, in seconds) and a "damping"
// (1 = settles without overshoot, lower = bouncier). It starts from where the
// element is and how fast your finger was moving, so letting go has no seam.

type SpringOptions = {
  from: number;
  to: number;
  /** Speed at the start in units per second, e.g. the finger's speed on release. */
  velocity?: number;
  response?: number;
  damping?: number;
  onUpdate: (value: number) => void;
  onDone?: () => void;
};

/** Runs the spring; returns a function that stops it (e.g. when you grab it again). */
export function spring({ from, to, velocity = 0, response = 0.3, damping = 1, onUpdate, onDone }: SpringOptions) {
  // Response and damping as physics (mass 1): stiffness and friction.
  const stiffness = (2 * Math.PI / response) ** 2;
  const friction = (4 * Math.PI * damping) / response;
  let offset = from - to;
  let speed = velocity;
  let last = performance.now();
  let frame = 0;

  const step = (now: number) => {
    // Small fixed steps keep it stable, also after a slow frame.
    const elapsed = Math.min(0.064, (now - last) / 1000);
    last = now;
    const steps = Math.max(1, Math.ceil(elapsed / 0.004));
    const h = elapsed / steps;
    for (let i = 0; i < steps; i++) {
      speed += (-stiffness * offset - friction * speed) * h;
      offset += speed * h;
    }
    if (Math.abs(offset) < 0.5 && Math.abs(speed) < 5) {
      onUpdate(to);
      onDone?.();
      return;
    }
    onUpdate(to + offset);
    frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

/**
 * Where a flick would come to rest, like scrolling slowing down (Apple's formula):
 * a quick flick travels far, a slow release barely moves.
 */
export function projectedDistance(velocity: number, decelerationRate = 0.998): number {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/** Past an edge, follow the finger less and less, instead of stopping hard. */
export function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/** Short haptic tick on phones that support it (Android); silently nothing elsewhere. */
export function haptic(ms = 10) {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
}
