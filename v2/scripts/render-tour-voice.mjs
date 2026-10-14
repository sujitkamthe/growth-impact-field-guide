// Pre-renders every film's narration (js/tour/films.js) as neural speech, one clip per beat and
// voice, into the film's audio folder (audio/tour/ for the guide, audio/tour/org/ for the org film),
// and writes a manifest.json there with each clip's duration so the player can time the beats.
// Uses edge-tts (Microsoft's neural voices through Edge's read-aloud service): free and keyless but
// unofficial, so fine for building the site's audio; Azure Speech offers the same voices officially.
//
// usage: node v2/scripts/render-tour-voice.mjs [--films=id,id] [--voices=id,id] [--force]   (npm run tour:voice)
// env:   EDGE_TTS=/path/to/edge-tts  (default: ~/.meeting-assistant/venv/bin/edge-tts)
//
// Clips are cached by a hash of voice|rate|text, so a re-run only renders lines that changed.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const V2 = join(dirname(fileURLToPath(import.meta.url)), '..');
const EDGE = process.env.EDGE_TTS ?? join(homedir(), '.meeting-assistant', 'venv', 'bin', 'edge-tts');
const RATE = '-3%';

const { FILMS } = await import(pathToFileURL(join(V2, 'js', 'tour', 'films.js')).href);

if (!existsSync(EDGE)) { console.error(`edge-tts not found at ${EDGE}; set EDGE_TTS`); process.exit(1); }

const srtTime = s => { const [h, m, rest] = s.split(':'); const [sec, ms] = rest.split(','); return +h * 3600 + +m * 60 + +sec + +ms / 1000; };
// The clip's spoken length: the end of the subtitle file's last cue.
const srtEnd = srt => Math.max(0, ...srt.split('\n').filter(l => l.includes('-->')).map(l => srtTime(l.split('-->')[1].trim())));

const only = process.argv.find(a => a.startsWith('--voices='))?.slice(9).split(',');
const films = process.argv.find(a => a.startsWith('--films='))?.slice(8).split(',');
const force = process.argv.includes('--force');

// Working files (text in, subtitles out) live outside the site so only the mp3s are published.
const work = mkdtempSync(join(tmpdir(), 'tour-voice-'));
let made = 0, cached = 0;
const failed = [];

// One film: its clips in <audio>/<voice>/<chapter>-<beat>.mp3 and its manifest in <audio>/manifest.json.
function renderFilm({ id, chapters: CHAPTERS, voices: VOICES, audio }) {
    const OUT = join(V2, audio);
    const manifestPath = join(OUT, 'manifest.json');
    const old = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath, 'utf8')) : { clips: {} };
    const manifest = {
        engine: 'edge-tts (Microsoft neural voices, unofficial; Azure Speech offers the same voices officially)',
        rate: RATE,
        voices: VOICES,
        clips: {},
    };
    for (const voice of VOICES) {
        const dir = join(OUT, voice.id);
        mkdirSync(dir, { recursive: true });
        const keep = new Set();
        for (const chapter of CHAPTERS) {
            const list = (manifest.clips[voice.id] ??= {})[chapter.id] = [];
            for (const [i, text] of chapter.beats.entries()) {
                const name = `${chapter.id}-${i}.mp3`;
                const mp3 = join(dir, name);
                keep.add(name);
                const hash = createHash('sha1').update(`${voice.id}|${RATE}|${text}`).digest('hex').slice(0, 12);
                const prev = old.clips?.[voice.id]?.[chapter.id]?.[i];
                const skip = only && !only.includes(voice.id);
                if ((prev?.hash === hash && existsSync(mp3) && !force) || (skip && prev)) { list.push(prev); cached++; continue; }
                if (skip) { list.push(null); continue; }
                const txt = join(work, 'line.txt'), srt = join(work, 'line.srt');
                writeFileSync(txt, text);
                let ok = false;
                // The online service drops the odd request, so try a few times before giving up on a clip.
                for (let attempt = 1; attempt <= 4 && !ok; attempt++) {
                    try {
                        execFileSync(EDGE, ['--voice', voice.id, `--rate=${RATE}`, '--file', txt, '--write-media', mp3, '--write-subtitles', srt], { stdio: 'ignore' });
                        ok = statSync(mp3).size > 0;
                    } catch {
                        execFileSync('sleep', [String(attempt * 3)]);
                    }
                }
                // A missing clip stays as null, so beat indices line up; the player falls back for it.
                if (!ok) { failed.push(`${id} ${voice.id} ${chapter.id}-${i}`); list.push(null); continue; }
                const duration = Math.round(srtEnd(readFileSync(srt, 'utf8')) * 100) / 100;
                list.push({ src: `${audio}${voice.id}/${name}`, duration, hash });
                made++;
                process.stdout.write(`${id} ${voice.id} ${chapter.id}-${i} ${duration}s\n`);
            }
        }
        // Clips for lines that no longer exist (a beat removed) are dropped.
        for (const f of readdirSync(dir)) if (!keep.has(f)) rmSync(join(dir, f));
    }
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
}

try {
    for (const film of FILMS) if (!films || films.includes(film.id)) renderFilm(film);
} finally {
    rmSync(work, { recursive: true, force: true });
}

console.log(JSON.stringify({ films: FILMS.filter(f => !films || films.includes(f.id)).map(f => f.id), rendered: made, cached, failed }));
if (failed.length) process.exit(1);
