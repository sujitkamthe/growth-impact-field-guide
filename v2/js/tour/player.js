// The tour's player: builds the world and every chapter of one film (films.js), and runs one
// timeline through them.
//
// Each beat lasts as long as its narration takes to say (the clip's length from the audio manifest,
// or a reading-speed estimate when narration is off) plus a short pause. The clock also holds at
// the end of a beat's sentence until the narrator says it has finished, so a clip that starts late
// never leaves the picture ahead of the voice. Every frame the world is reset and only the active
// chapter's group is shown and updated from the time alone (see WORLD.md).
//
// If the world can't be created (world.js not built yet, or no WebGL), the timeline still runs with
// narration and captions over a placeholder, so the page always works.
//
// Under prefers-reduced-motion each beat shows only its end state, with a short crossfade of the
// canvas between beats (the .is-fading class in tour.css).

import { FILMS } from './films.js';
import { createNarrator, PAUSE_AFTER } from './narrator.js';

const FADE_MS = 220;

async function loadChapters(world, film) {
    // Chapter paths are relative to this file: the guide's in chapters/, another film's in films/<id>/chapters/.
    const modules = world ? await Promise.allSettled(film.chapters.map(c => import(`${film.base}chapters/${c.id}.js`))) : [];
    return film.chapters.map((meta, i) => {
        const chapter = { ...meta, module: null, group: null };
        if (!world) return chapter;
        const loaded = modules[i];
        if (loaded.status !== 'fulfilled' || !loaded.value.default) {
            console.info(`Tour: chapter "${film.id}/${meta.id}" is not available yet; showing a plain stage.`);
            return chapter;
        }
        try {
            const group = loaded.value.default.build(world);
            group.visible = false;
            world.scene.add(group);
            Object.assign(chapter, { module: loaded.value.default, group });
        } catch (err) {
            console.error(`Tour: chapter "${film.id}/${meta.id}" failed to build`, err);
        }
        return chapter;
    });
}

// Creates the world, or null (with the reason logged) when it isn't available.
async function loadWorld(canvas, hudRoot, options) {
    let createWorld;
    try {
        ({ createWorld } = await import('./world.js'));
    } catch (err) {
        console.info('Tour: the 3D world is not built yet; playing narration and captions only.', err.message);
        return { world: null, reason: 'missing' };
    }
    try {
        return { world: await createWorld(canvas, hudRoot, options), reason: null };
    } catch (err) {
        console.error('Tour: the 3D world failed to start', err);
        return { world: null, reason: 'failed' };
    }
}

// film: an entry of FILMS (default: the guide). canvas: the <canvas> to draw on, inside a sized container; hudRoot: an element over it for the
// world's game HUD. onProgress(k): asset loading, 0 to 1. onUpdate(state): after every rendered
// frame and every change, for the controls to follow.
export async function createPlayer({ film = FILMS[0], canvas, hudRoot, onProgress = () => {}, onUpdate = () => {} }) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const VOICES = film.voices;
    const manifestLoad = fetch(`${film.audio}manifest.json`).then(r => (r.ok ? r.json() : null)).catch(() => null);
    // The world reports progress as a fraction or as { loaded, total }; pass on a fraction.
    const progress = p => onProgress(Math.max(0, Math.min(1, typeof p === 'number' ? p : p?.total ? p.loaded / p.total : 0)));
    const [{ world, reason: worldMissing }, manifest] = await Promise.all([
        loadWorld(canvas, hudRoot, { reducedMotion, onProgress: progress }),
        manifestLoad,
    ]);
    const chapters = await loadChapters(world, film);

    let ci = 0;             // current chapter
    let t = 0;              // seconds into it
    let playing = false;
    let ended = false;
    let blocked = false;    // the browser refused to start audio; waiting for a click
    let spokenKey = null;   // `${ci}:${beat}` whose narration has been started
    let spokenDone = false; // and whether it has finished
    let disposed = false;
    let raf = 0, last = 0;
    let resumeOnShow = false;
    // Reduced motion: the beat on screen, which trails the timeline by one crossfade.
    let shown = null, fadeTimer = 0;

    const narrator = createNarrator({
        manifest, voices: VOICES,
        onBlocked() { blocked = true; playing = false; stopLoop(); emit(); },
    });

    // Beat lengths for every chapter, from the narration as it is set now.
    let timing = [];
    function retime() {
        timing = chapters.map(c => {
            const spoken = c.beats.map((text, i) => narrator.spokenLength(c.id, i, text));
            const starts = [], ends = [];
            spoken.reduce((at, s) => { starts.push(at); ends.push(at + s + PAUSE_AFTER); return at + s + PAUSE_AFTER; }, 0);
            return { spoken, starts, ends, duration: ends.at(-1) };
        });
    }
    retime();
    const total = () => timing.reduce((sum, c) => sum + c.duration, 0);
    const beatAt = (k, time) => {
        const ends = timing[k].ends;
        const i = ends.findIndex(e => time < e);
        return i < 0 ? ends.length - 1 : i;
    };

    // ---- Narration ---------------------------------------------------------------------------

    function nextBeat(k, b) {
        if (b + 1 < chapters[k].beats.length) return [k, b + 1];
        return k + 1 < chapters.length ? [k + 1, 0] : null;
    }

    // Starts the current beat's narration if it hasn't been started yet.
    function ensureNarration() {
        const b = beatAt(ci, t);
        const key = `${ci}:${b}`;
        if (spokenKey === key) return;
        spokenKey = key;
        spokenDone = false;
        narrator.speak(chapters[ci].id, b, chapters[ci].beats[b]).then(result => {
            if (spokenKey === key && result === 'ended') spokenDone = true;
        });
        const after = nextBeat(ci, b);
        if (after) narrator.preload(chapters[after[0]].id, after[1]);
    }

    function forgetNarration() {
        narrator.stop();
        spokenKey = null;
        spokenDone = false;
    }

    // ---- Clock -------------------------------------------------------------------------------

    function advance(dt) {
        ensureNarration();
        const tm = timing[ci];
        const b = beatAt(ci, t);
        let next = t + dt;
        // Hold at the end of the sentence until the voice has finished it.
        const hold = tm.starts[b] + tm.spoken[b];
        if (!spokenDone && next > hold) next = Math.max(t, hold);
        t = next;
        if (t >= tm.duration) {
            if (ci + 1 < chapters.length) {
                ci++;
                t = 0;
            } else {
                t = tm.duration;
                ended = true;
                playing = false;
                forgetNarration();
            }
        }
    }

    // ---- Drawing -----------------------------------------------------------------------------

    function draw(k, time, beatOverride) {
        if (!world) return;
        const c = chapters[k];
        const tm = timing[k];
        const clock = timing.slice(0, k).reduce((s, x) => s + x.duration, 0) + time;
        world.reset(clock);
        for (const other of chapters) if (other.group) other.group.visible = false;
        if (c.module) {
            const beat = beatOverride ?? beatAt(k, time);
            const len = tm.ends[beat] - tm.starts[beat];
            const beatT = beatOverride != null ? 1 : Math.min(1, Math.max(0, (time - tm.starts[beat]) / len));
            c.group.visible = true;
            try {
                c.module.update(world, c.group, { t: time, duration: tm.duration, beat, beatT, beatStarts: tm.starts, beatEnds: tm.ends, clock });
            } catch (err) {
                // A broken chapter shows the plain world instead of throwing every frame.
                console.error(`Tour: chapter "${c.id}" failed to update`, err);
                c.group.visible = false;
                c.module = null;
                world.reset(clock);
            }
        }
        world.render();
    }

    function render() {
        if (!reducedMotion) return draw(ci, t);
        // Reduced motion: each beat's end state, crossfading through the page colour between them.
        const target = { k: ci, b: ended ? timing[ci].ends.length - 1 : beatAt(ci, t) };
        if (!shown) shown = target;
        if ((shown.k !== target.k || shown.b !== target.b) && !fadeTimer) {
            canvas.classList.add('is-fading');
            fadeTimer = setTimeout(() => {
                fadeTimer = 0;
                shown = { k: ci, b: ended ? timing[ci].ends.length - 1 : beatAt(ci, t) };
                draw(shown.k, timing[shown.k].ends[shown.b], shown.b);
                canvas.classList.remove('is-fading');
            }, FADE_MS);
        }
        draw(shown.k, timing[shown.k].ends[shown.b], shown.b);
    }

    // ---- Loop --------------------------------------------------------------------------------

    function frame(now) {
        raf = 0;
        if (disposed) return;
        if (playing) {
            advance(Math.min(0.1, Math.max(0, (now - last) / 1000)));
            last = now;
        }
        render();
        emit();
        if (playing && !document.hidden) raf = requestAnimationFrame(frame);
    }
    function requestRender() {
        if (!raf && !disposed) raf = requestAnimationFrame(frame);
    }
    function stopLoop() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
    }

    function state() {
        const b = beatAt(ci, t);
        const before = timing.slice(0, ci).reduce((s, c) => s + c.duration, 0);
        return {
            chapter: ci, beat: b, caption: chapters[ci].beats[b],
            chapters: chapters.map((c, k) => ({ id: c.id, title: c.title, duration: timing[k].duration, ready: !!c.module })),
            chapterProgress: timing[ci].duration ? t / timing[ci].duration : 0,
            progress: (before + t) / total(), total: total(),
            playing, ended, blocked, started: playing || ended || spokenKey !== null || ci > 0 || t > 0,
            muted: narrator.muted, voice: narrator.voice, voices: VOICES, reducedMotion, worldMissing,
        };
    }
    function emit() { if (!disposed) onUpdate(state()); }

    // ---- Controls ----------------------------------------------------------------------------

    function play() {
        if (disposed) return;
        if (ended) { ended = false; ci = 0; t = 0; forgetNarration(); }
        playing = true;
        blocked = false;
        last = performance.now();
        // Start (or resume) the voice inside the click, so browsers that need a gesture allow it.
        if (spokenKey === `${ci}:${beatAt(ci, t)}`) narrator.resume();
        else ensureNarration();
        stopLoop();
        requestRender();
        emit();
    }
    function pause() {
        playing = false;
        narrator.pause();
        stopLoop();
        emit();
    }
    function goTo(k) {
        ci = Math.max(0, Math.min(chapters.length - 1, k));
        t = 0;
        ended = false;
        forgetNarration();
        if (playing) { last = performance.now(); ensureNarration(); }
        requestRender();
        emit();
    }

    // Retimes after the narration changes and keeps the place: muting keeps the picture where it is,
    // while a voice change or unmuting restarts the beat so it is heard from its start.
    function narrationChanged(restartBeat) {
        const b = beatAt(ci, t);
        const old = timing[ci];
        const k = (t - old.starts[b]) / (old.ends[b] - old.starts[b]);
        forgetNarration();
        retime();
        const tm = timing[ci];
        t = restartBeat ? tm.starts[b] : tm.starts[b] + Math.min(0.999, k) * (tm.ends[b] - tm.starts[b]);
        if (ended) t = tm.duration;
        if (playing) { last = performance.now(); ensureNarration(); }
        requestRender();
        emit();
    }

    // ---- Page lifecycle ------------------------------------------------------------------------

    const onVisibility = () => {
        if (document.hidden && playing) { resumeOnShow = true; pause(); }
        else if (!document.hidden && resumeOnShow) { resumeOnShow = false; play(); }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const resizer = new ResizeObserver(() => { world?.resize(); requestRender(); });
    resizer.observe(canvas.parentElement);

    world?.resize();
    requestRender();

    return {
        play, pause,
        toggle() { (playing ? pause : play)(); },
        restart() { goTo(0); play(); },
        goTo,
        next() { if (ci + 1 < chapters.length) goTo(ci + 1); },
        prev() { goTo(ci - 1); },
        setMuted(on) { narrator.setMuted(on); narrationChanged(!on); },
        setVoice(id) { narrator.setVoice(id); narrationChanged(true); },
        get state() { return state(); },
        dispose() {
            disposed = true;
            stopLoop();
            clearTimeout(fadeTimer);
            narrator.dispose();
            document.removeEventListener('visibilitychange', onVisibility);
            resizer.disconnect();
            world?.dispose();
        },
    };
}
