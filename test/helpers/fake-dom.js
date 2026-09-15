// Minimal DOM stand-in so overlay modules can run under node --test.
class ClassList {
  constructor() { this.set = new Set(); }
  add(...c) { c.forEach((x) => this.set.add(x)); }
  remove(...c) { c.forEach((x) => this.set.delete(x)); }
  contains(c) { return this.set.has(c); }
  toString() { return [...this.set].join(' '); }
}

export class FakeElement {
  constructor(id) {
    this.id = id;
    this.innerHTML = '';
    this.style = {};
    this.classList = new ClassList();
    this.children = [];
    this.attributes = {};
  }
  setAttribute(k, v) { this.attributes[k] = v; }
  appendChild(c) { this.children.push(c); return c; }
  getContext() { return {}; }
  set innerHTML(v) { this._html = v; if (v === '') this.children = []; }
  get innerHTML() { return this._html; }
}

export function installFakeDom(ids) {
  const els = new Map(ids.map((id) => [id, new FakeElement(id)]));
  globalThis.document = {
    getElementById(id) {
      if (!els.has(id)) els.set(id, new FakeElement(id));
      return els.get(id);
    },
    createElement(tag) { return new FakeElement(tag); }
  };
  globalThis.window = { location: { host: '127.0.0.1:24050' } };
  // CountUp stub: record last value on the target element.
  globalThis.CountUp = class {
    constructor(target) { this.el = els.get(target) ?? (els.set(target, new FakeElement(target)), els.get(target)); }
    update(v) { this.el.lastCountUp = v; }
  };
  // Odometer stub: no-op (real one watches innerHTML).
  globalThis.Odometer = class { constructor() {} };
  // Image stub: resolves load synchronously so background logic can be asserted.
  globalThis.Image = class {
    set src(v) { this._src = v; queueMicrotask(() => this.onload && this.onload()); }
    get src() { return this._src; }
  };
  // setInterval runs the callback up to 10 times synchronously (staged reveals finish in one update).
  globalThis.setInterval = (fn) => { const h = { stop: false }; for (let i = 0; i < 10 && !h.stop; i++) fn(); return h; };
  globalThis.clearInterval = (h) => { if (h) h.stop = true; };
  globalThis.setTimeout = (fn) => { fn(); return 0; };
  // anime.js stub: jump targets to final values, fire update+complete synchronously.
  globalThis.anime = ({ targets, easing, update, complete, ...props }) => {
    for (const [k, v] of Object.entries(props)) if (typeof v === 'number') targets[k] = v;
    update && update();
    complete && complete();
    return { completed: true };
  };
  // Chart.js stub: keep config, count updates.
  globalThis.Chart = class { constructor(ctx, config) { this.config = config; this.updates = 0; Chart.instances.push(this); } update() { this.updates++; } };
  globalThis.Chart.instances = [];
  return (id) => els.get(id);
}
