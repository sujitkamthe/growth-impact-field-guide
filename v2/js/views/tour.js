// The narrated 3D films (js/tour/): #tour plays the guide in three minutes, #tour/<film> another
// film from js/tour/films.js. This view lays out the stage, caption and controls; js/tour/player.js
// runs the timeline and js/tour/narrator.js the voice.
import { filmAtRoute, filmMinutes } from '../tour/films.js';
import { icon as lineIcon } from '../icons.js';

const icon = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
    pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5h2.6v13H8zM13.4 5.5H16v13h-2.6z" fill="currentColor"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 6v12M18 6.5 10 12l8 5.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 6v12M6 6.5 14 12l-8 5.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>',
    sound: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 9.5h3.2L12 6v12l-4.3-3.5H4.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M15.2 9.2a4 4 0 0 1 0 5.6M17.6 6.8a7.4 7.4 0 0 1 0 10.4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
    expand: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    shrink: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4.5V9H4.5M19.5 9H15V4.5M15 19.5V15h4.5M4.5 15H9v4.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 9.5h3.2L12 6v12l-4.3-3.5H4.5z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="m15.5 9.5 5 5M20.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
};

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// A compact link to a film from another page: a small thumbnail with a play mark, the title and its
// length. Without a thumbnail (none set in films.js, or it fails to load) the play mark sits on the dark tile.
export function filmLink(film, note = 'narrated, with captions') {
    return `<a class="film-link" href="#${film.route}">
        <span class="film-link-thumb">${film.thumbnail ? `<img src="${esc(film.thumbnail)}" width="160" height="90" alt="" loading="lazy" onerror="this.hidden=true">` : ''}${lineIcon('play')}</span>
        <span class="film-link-text"><strong>Watch: ${esc(film.title)}</strong><span>${filmMinutes(film)} min, ${esc(note)}</span></span>
    </a>`;
}

export function render(content, [name]) {
    // The film to play (inside mount, `film` is the .tour-film element).
    const theFilm = filmAtRoute(name ? `tour/${name}` : 'tour');
    if (!theFilm) return null;
    const { title: TITLE, chapters: CHAPTERS, voices: VOICES } = theFilm;
    const endLinks = theFilm.end.map(l => `<a class="button${l.quiet ? ' quiet' : ''}" href="${esc(l.href)}">${esc(l.label)}</a>`).join('');
    const chips = CHAPTERS.map((c, i) => `<li><button class="tour-chip" type="button" data-chapter="${i}">${esc(c.title)}</button></li>`).join('');
    const segments = CHAPTERS.map(() => '<span class="tour-seg"><span class="tour-seg-fill"></span></span>').join('');
    const voices = VOICES.map(v => `<option value="${esc(v.id)}">${esc(v.label)}</option>`).join('');
    const html = `
<section class="tour" data-film="${esc(theFilm.id)}" aria-labelledby="tour-title">
    <div class="tour-head">
        <h1 id="tour-title">${esc(TITLE)}</h1>
        <p class="hint">Narrated, with captions. Space plays or pauses, the arrow keys change chapter, F goes full screen.</p>
    </div>
    <div class="tour-film">
        <div class="tour-stage is-loading">
            <canvas class="tour-canvas" aria-hidden="true"></canvas>
            <div class="tour-hud" aria-hidden="true"></div>
            <p class="tour-note" hidden>The animation for this chapter is still being drawn.</p>
            <div class="tour-cover">
                <button class="tour-start" type="button" disabled>${icon.play}<span class="tour-start-label">Loading the valley</span></button>
                <span class="tour-loading" aria-hidden="true"><span class="tour-loading-fill"></span></span>
                <p class="tour-cover-note" hidden>Your browser held the sound back. Press play to continue.</p>
            </div>
            <div class="tour-end" hidden>
                <p class="tour-end-line">${esc(CHAPTERS.at(-1).beats.at(-1))}</p>
                <div class="tour-end-actions">
                    ${endLinks}
                    <button class="button quiet" type="button" data-act="again">Watch again</button>
                </div>
            </div>
        </div>
        <p class="tour-caption" aria-live="polite">${esc(CHAPTERS[0].beats[0])}</p>
        <div class="tour-bar">
            <div class="tour-progress" role="progressbar" aria-label="Tour progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">${segments}</div>
            <div class="tour-controls">
                <button class="tour-icon tour-play" type="button" data-act="play" aria-label="Play">${icon.play}</button>
                <button class="tour-icon" type="button" data-act="prev" aria-label="Previous chapter">${icon.prev}</button>
                <button class="tour-icon" type="button" data-act="next" aria-label="Next chapter">${icon.next}</button>
                <p class="tour-now"><span class="tour-now-num">1 / ${CHAPTERS.length}</span> <span class="tour-now-title">${esc(CHAPTERS[0].title)}</span></p>
                <button class="tour-icon" type="button" data-act="mute" aria-pressed="false" aria-label="Mute narration">${icon.sound}</button>
                <label class="tour-voice"><span class="visually-hidden">Narrator voice</span>
                    <select name="tour-voice" data-act="voice">${voices}</select>
                </label>
                <button class="tour-icon" type="button" data-act="fullscreen" aria-label="Full screen">${icon.expand}</button>
            </div>
        </div>
    </div>
    <nav class="tour-chapters" aria-label="Chapters"><ol>${chips}</ol></nav>
</section>`;

    let player = null;
    let gone = false;
    const cleanups = [];

    async function mount(root) {
        const el = sel => root.querySelector(sel);
        const stageEl = el('.tour-stage'), canvas = el('.tour-canvas'), caption = el('.tour-caption');
        const cover = el('.tour-cover'), coverNote = el('.tour-cover-note'), endCard = el('.tour-end');
        const playBtn = el('[data-act="play"]'), muteBtn = el('[data-act="mute"]'), voiceSel = el('[data-act="voice"]');
        const progress = el('.tour-progress'), fills = [...root.querySelectorAll('.tour-seg-fill')];
        const segs = [...root.querySelectorAll('.tour-seg')], chips = [...root.querySelectorAll('.tour-chip')];
        const note = el('.tour-note'), film = el('.tour-film');
        const nowNum = el('.tour-now-num'), nowTitle = el('.tour-now-title'), fsBtn = el('[data-act="fullscreen"]');
        const startBtn = el('.tour-start'), startLabel = el('.tour-start-label'), loadFill = el('.tour-loading-fill');
        const onProgress = k => {
            loadFill.style.transform = `scaleX(${k})`;
            startLabel.textContent = `Loading the valley… ${Math.round(k * 100)}%`;
        };

        // While playing, the control bar and cursor fade after a moment without the pointer moving,
        // like a video player; any movement, touch or key brings them back.
        let idleTimer = 0;
        function wake() {
            film.classList.remove('is-idle');
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                const focusInBar = document.activeElement?.closest?.('.tour-bar');
                if (film.classList.contains('is-playing') && !focusInBar) film.classList.add('is-idle');
            }, 2600);
        }
        // Full screen takes the whole film: picture, game HUD, captions and controls.
        const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement;
        function toggleFullscreen() {
            if (fsElement()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
            else (film.requestFullscreen || film.webkitRequestFullscreen)?.call(film);
        }
        function onFullscreen() {
            const full = fsElement() === film;
            film.classList.toggle('is-full', full);
            fsBtn.innerHTML = full ? icon.shrink : icon.expand;
            fsBtn.setAttribute('aria-label', full ? 'Exit full screen' : 'Full screen');
            wake();
        }
        if (!(film.requestFullscreen || film.webkitRequestFullscreen)) fsBtn.hidden = true;

        let seen = {};
        const onUpdate = s => {
            const changed = key => { const v = JSON.stringify(s[key]); if (seen[key] === v) return false; seen[key] = v; return true; };
            if (changed('caption')) caption.textContent = s.caption;
            if (changed('chapter')) {
                chips.forEach((c, i) => (i === s.chapter ? c.setAttribute('aria-current', 'step') : c.removeAttribute('aria-current')));
                const chip = chips[s.chapter];
                const strip = chip.closest('ol');
                strip.scrollTo({ left: chip.offsetLeft - strip.clientWidth / 2 + chip.clientWidth / 2, behavior: s.reducedMotion ? 'auto' : 'smooth' });
                note.hidden = s.worldMissing ? false : s.chapters[s.chapter].ready;
                nowNum.textContent = `${s.chapter + 1} / ${CHAPTERS.length}`;
                nowTitle.textContent = CHAPTERS[s.chapter].title;
            }
            if (changed('chapters')) {
                s.chapters.forEach((c, i) => { segs[i].style.flexGrow = String(c.duration); });
                startLabel.innerHTML = `${esc(theFilm.playLabel)} <span class="tour-length">(${Math.max(1, Math.round(s.total / 60))} min)</span>`;
            }
            fills.forEach((f, i) => {
                const k = i < s.chapter ? 1 : i > s.chapter ? 0 : s.ended ? 1 : s.chapterProgress;
                f.style.transform = `scaleX(${k})`;
            });
            const pct = Math.round(s.progress * 100);
            if (progress.getAttribute('aria-valuenow') !== String(pct)) progress.setAttribute('aria-valuenow', String(pct));
            if (changed('playing')) {
                film.classList.toggle('is-playing', s.playing);
                if (!s.playing) wake();
                playBtn.innerHTML = s.playing ? icon.pause : icon.play;
                playBtn.setAttribute('aria-label', s.playing ? 'Pause' : 'Play');
            }
            if (changed('muted')) {
                muteBtn.innerHTML = s.muted ? icon.muted : icon.sound;
                muteBtn.setAttribute('aria-pressed', String(s.muted));
                muteBtn.setAttribute('aria-label', s.muted ? 'Turn narration on' : 'Mute narration');
            }
            if (changed('voice')) voiceSel.value = s.voice;
            voiceSel.disabled = s.muted;
            // The cover stays until the tour first plays, and comes back if the browser blocks sound.
            cover.hidden = !(s.blocked || !s.started);
            coverNote.hidden = !s.blocked;
            endCard.hidden = !s.ended;
            stageEl.classList.toggle('is-ended', s.ended);
            film.classList.toggle('is-ended', s.ended);
        };

        try {
            const { createPlayer } = await import('../tour/player.js');
            if (gone) return;
            player = await createPlayer({ film: theFilm, canvas, hudRoot: el('.tour-hud'), onProgress, onUpdate });
            if (gone) { player.dispose(); return; }
        } catch (err) {
            console.error(err);
            stageEl.classList.remove('is-loading');
            stageEl.classList.add('is-broken');
            cover.hidden = true;
            note.hidden = false;
            note.textContent = 'The tour could not start in this browser.';
            return;
        }
        stageEl.classList.remove('is-loading');
        startBtn.disabled = false;
        if (player.state.worldMissing) {
            note.hidden = false;
            note.textContent = "The 3D valley isn't built yet, so the narration and captions play on their own.";
        }

        const on = (target, type, fn) => { target.addEventListener(type, fn); cleanups.push(() => target.removeEventListener(type, fn)); };
        on(el('.tour-start'), 'click', () => player.play());
        on(canvas, 'click', () => player.toggle());
        on(playBtn, 'click', () => player.toggle());
        on(el('[data-act="prev"]'), 'click', () => player.prev());
        on(el('[data-act="next"]'), 'click', () => player.next());
        on(el('[data-act="again"]'), 'click', () => { player.restart(); playBtn.focus(); });
        on(muteBtn, 'click', () => player.setMuted(!player.state.muted));
        on(voiceSel, 'change', () => player.setVoice(voiceSel.value));
        on(fsBtn, 'click', toggleFullscreen);
        on(document, 'fullscreenchange', onFullscreen);
        on(document, 'webkitfullscreenchange', onFullscreen);
        for (const type of ['pointermove', 'pointerdown', 'focusin']) on(film, type, wake);
        cleanups.push(() => clearTimeout(idleTimer));
        chips.forEach((chip, i) => on(chip, 'click', () => player.goTo(i)));
        on(document, 'keydown', e => {
            if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
            const tag = e.target.closest?.('input, select, textarea, [contenteditable]');
            if (tag) return;
            if (e.key === ' ' || e.code === 'Space') {
                // A focused button already answers Space with its own click.
                if (e.target.closest?.('button, a')) return;
                e.preventDefault();
                player.toggle();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                player.next();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                player.prev();
            } else if (e.key === 'f' || e.key === 'F') {
                e.preventDefault();
                toggleFullscreen();
            }
            wake();
        });
    }

    function unmount() {
        gone = true;
        if (document.fullscreenElement) document.exitFullscreen?.();
        cleanups.splice(0).forEach(fn => fn());
        player?.dispose();
        player = null;
    }

    return { title: TITLE, html, mount, unmount };
}
