// Tiny pub/sub. Events.on('noise', fn) / Events.emit('noise', payload)
const handlers = new Map();

export const Events = {
  on(type, fn) {
    if (!handlers.has(type)) handlers.set(type, new Set());
    handlers.get(type).add(fn);
    return () => handlers.get(type)?.delete(fn);
  },
  once(type, fn) {
    const off = Events.on(type, (p) => { off(); fn(p); });
    return off;
  },
  emit(type, payload) {
    const set = handlers.get(type);
    if (set) for (const fn of [...set]) fn(payload);
  },
};
