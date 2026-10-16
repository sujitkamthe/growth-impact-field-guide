// The tour's narrator: speaks one beat at a time and says when it has finished, so the player can
// hold the picture until the sentence is over.
//
// Preferred path: the pre-rendered neural clips (scripts/render-tour-voice.mjs → the film's audio
// folder, see films.js), for the chosen voice, else the default voice's clip for that beat. If neither plays, the browser's own
// speech synthesis reads the line; if that is missing too, the beat counts as spoken at once and the
// player's reading-speed clock times it. Voice and mute are remembered in the browser, for every film.

const KEY_VOICE = 'tour-voice';
const KEY_MUTED = 'tour-muted';

// Silence after each sentence before the next beat starts, in seconds.
export const PAUSE_AFTER = 0.6;

// How long a line takes to say at an unhurried reading pace (about 2.6 words a second).
export function estimateSpoken(text) {
    return Math.max(1.8, text.split(/\s+/).length / 2.6 + 0.2);
}

const store = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch { /* private mode */ } },
};

let browserVoices = null;
function loadBrowserVoices() {
    if (!('speechSynthesis' in window)) return Promise.resolve([]);
    browserVoices ??= new Promise(resolve => {
        const now = speechSynthesis.getVoices();
        if (now.length) return resolve(now);
        speechSynthesis.addEventListener('voiceschanged', () => resolve(speechSynthesis.getVoices()), { once: true });
        setTimeout(() => resolve(speechSynthesis.getVoices()), 1200);
    });
    return browserVoices;
}

// A timeout that stops counting while the narrator is paused.
function pausableTimer(ms, fn) {
    let left = ms, started = performance.now(), id = setTimeout(fn, ms);
    return {
        pause() { clearTimeout(id); left -= performance.now() - started; },
        resume() { started = performance.now(); id = setTimeout(fn, Math.max(0, left)); },
        clear() { clearTimeout(id); },
    };
}

// manifest: the film's manifest.json (audio/tour/ for the guide), or null when it could not be loaded.
// voices: the film's VOICES, the first being the default.
// onBlocked: called when the browser refuses to start audio without a click (autoplay policy).
export function createNarrator({ manifest, voices, onBlocked = () => {} }) {
    const defaultVoice = voices[0].id;
    let voice = voices.some(v => v.id === store.get(KEY_VOICE)) ? store.get(KEY_VOICE) : defaultVoice;
    let muted = store.get(KEY_MUTED) === '1';
    let paused = false;

    // One element plays every clip, so a single click unlocks it on browsers that need one; another
    // only fetches the next clip ahead of time.
    const audio = new Audio();
    audio.preload = 'auto';
    const preloader = new Audio();
    preloader.preload = 'auto';

    // The line being spoken: { token, kind: 'clip' | 'speech', finish(result), timer }.
    let current = null;
    let token = 0;

    loadBrowserVoices();

    const clipsFor = (chapterId, i) => {
        const clips = manifest?.clips ?? {};
        const mine = clips[voice]?.[chapterId]?.[i];
        const fallback = clips[defaultVoice]?.[chapterId]?.[i];
        return [mine, fallback].filter((c, k, all) => c && all.indexOf(c) === k);
    };
    const url = src => new URL(src, document.baseURI).href;
    // Each clip's content hash, so a re-rendered line is fetched afresh though its file name stays the same.
    const clipUrl = clip => `${url(clip.src)}${clip.hash ? `?h=${clip.hash}` : ''}`;

    // Seconds the line takes to say: the clip's length, or the reading-speed estimate when narration
    // is off or there is no clip.
    function spokenLength(chapterId, i, text) {
        if (muted) return estimateSpoken(text);
        return clipsFor(chapterId, i)[0]?.duration ?? estimateSpoken(text);
    }

    function cleanup() {
        if (!current) return;
        current.timer?.clear();
        current.detach?.();
        current = null;
    }

    function stop() {
        const was = current;
        token++;
        cleanup();
        audio.pause();
        audio.removeAttribute('src');
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        was?.resolve('stopped');
    }

    // Speaks the line and resolves with 'ended' when it is over, or 'stopped' if cut short.
    function speak(chapterId, i, text) {
        stop();
        const my = ++token;
        return new Promise(resolve => {
            current = { token: my, resolve, kind: 'none' };
            const finish = result => {
                if (token !== my) return;
                cleanup();
                resolve(result);
            };
            if (muted) return finish('ended');
            const clips = clipsFor(chapterId, i);
            const tryClip = k => {
                if (token !== my) return;
                if (k >= clips.length) return trySpeech();
                const onEnded = () => finish('ended');
                const onError = () => { detach(); tryClip(k + 1); };
                const detach = () => {
                    audio.removeEventListener('ended', onEnded);
                    audio.removeEventListener('error', onError);
                };
                current.kind = 'clip';
                current.detach = detach;
                audio.addEventListener('ended', onEnded);
                audio.addEventListener('error', onError);
                audio.src = clipUrl(clips[k]);
                if (!paused) playClip(my);
            };
            const trySpeech = async () => {
                const all = await loadBrowserVoices();
                if (token !== my) return;
                const pick = all.find(v => v.lang === 'en-GB' && v.localService)
                    ?? all.find(v => v.lang === 'en-GB') ?? all.find(v => /^en/.test(v.lang));
                if (!pick) return finish('ended');
                const u = new SpeechSynthesisUtterance(text);
                u.voice = pick;
                u.lang = pick.lang;
                u.rate = 0.98;
                u.onend = () => finish('ended');
                u.onerror = () => finish('ended');
                current.kind = 'speech';
                // Some browsers never fire onend; don't let a lost event stall the tour.
                current.timer = pausableTimer(estimateSpoken(text) * 2000 + 1500, () => {
                    speechSynthesis.cancel();
                    finish('ended');
                });
                speechSynthesis.speak(u);
                if (paused) { speechSynthesis.pause(); current.timer.pause(); }
            };
            tryClip(0);
        });
    }

    function playClip(my) {
        audio.play().catch(err => {
            if (token !== my || err.name === 'AbortError') return;
            if (err.name === 'NotAllowedError') {
                // Autoplay blocked: hold the clip where it is and let the reader press Play.
                paused = true;
                onBlocked();
            } else {
                audio.dispatchEvent(new Event('error'));
            }
        });
    }

    function preload(chapterId, i) {
        if (muted) return;
        const clip = clipsFor(chapterId, i)[0];
        if (clip && preloader.src !== clipUrl(clip)) preloader.src = clipUrl(clip);
    }

    function pause() {
        paused = true;
        if (!current) return;
        if (current.kind === 'clip') audio.pause();
        if (current.kind === 'speech') { speechSynthesis.pause(); current.timer?.pause(); }
    }

    function resume() {
        paused = false;
        if (!current) return;
        if (current.kind === 'clip' && !audio.ended) playClip(current.token);
        if (current.kind === 'speech') { speechSynthesis.resume(); current.timer?.resume(); }
    }

    return {
        get voice() { return voice; },
        get muted() { return muted; },
        get speaking() { return !!current; },
        setVoice(id) {
            if (!voices.some(v => v.id === id)) return;
            voice = id;
            store.set(KEY_VOICE, id);
            stop();
        },
        setMuted(on) {
            muted = !!on;
            store.set(KEY_MUTED, muted ? '1' : '0');
            stop();
        },
        spokenLength, speak, preload, pause, resume, stop,
        dispose() {
            stop();
            preloader.removeAttribute('src');
            audio.load();
            preloader.load();
        },
    };
}
