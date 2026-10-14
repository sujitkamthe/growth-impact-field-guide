// The village by the clock for Principles, Scopes and Areas: the later chapters' villageDay() and
// chatting() (from _shared2.js) for everyone a chapter isn't choreographing, plus the few villagers
// these chapters keep in their own places (see CAST in _shared.js). Kept apart from _shared.js because
// _shared2.js imports _shared.js.

import { villageDay, chatting } from './_shared2.js';
import { CAST } from './_shared.js';

// skip: villager indices the chapter is choreographing itself this frame.
export function village(world, clock, skip = [], { readersAtBoard = true } = {}) {
    const v = world.villagers;
    const on = i => !skip.includes(i);
    villageDay(world, clock, skip);
    // the readers stand at the notice board until Areas sends them over to chat in the square
    chatting(world, clock, readersAtBoard ? [...skip, ...CAST.readers.map(r => r.who)] : skip);
    const { watcher: w, cartHand: c, neighbour: n } = CAST;
    if (on(w.who)) v[w.who].place(w.at, w.facing);
    if (on(c.who)) v[c.who].place(c.at, c.facing).play('Idle', clock + 2.1);
    if (on(n.who)) v[n.who].place(n.at, n.facing).play('Interact', clock * 0.9 + 1.1);
    if (readersAtBoard) for (const { who, at, facing } of CAST.readers) if (on(who)) v[who].place(at, facing);
}
