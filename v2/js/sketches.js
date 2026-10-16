// Monochrome line sketches for page heads, named in a page's frontmatter ("sketch: <name>"). They
// sit in the empty space beside the title, never over text, and are decoration only, so they carry
// no words and are hidden from screen readers. Drawn in the principles' line style, without the
// accent fill, on a 240 × 170 grid (the wide Principles head uses 300 × 170).

// A standing figure with its feet at (x, y), about 86 units tall. turn shifts the head towards
// whoever the figure faces; left and right replace the hanging arms with a gesture.
function person(x, y, { turn = 0, left, right } = {}) {
    const l = left ?? `M${x - 9} ${y - 54}C${x - 13} ${y - 46} ${x - 14} ${y - 40} ${x - 13} ${y - 33}`;
    const r = right ?? `M${x + 9} ${y - 54}C${x + 13} ${y - 46} ${x + 14} ${y - 40} ${x + 13} ${y - 33}`;
    return `<circle class="sk-ink" cx="${x + turn}" cy="${y - 70}" r="8"/>
        <path class="sk-ink" d="M${x - 10} ${y - 30}C${x - 11} ${y - 48} ${x - 9} ${y - 58} ${x} ${y - 59}C${x + 9} ${y - 58} ${x + 11} ${y - 48} ${x + 10} ${y - 30}"/>
        <path class="sk-ink" d="M${x - 5} ${y - 31}L${x - 6} ${y}M${x + 5} ${y - 31}L${x + 6} ${y}"/>
        <path class="sk-ink" d="${l}"/><path class="sk-ink" d="${r}"/>`;
}

const SKETCHES = {
    // Principles: someone at a crossroads, reading a signpost, with paths fanning out to choose from.
    crossroads: {
        view: '0 0 300 170',
        art: `<path class="sk-line" d="M8 160H292"/>
            <path class="sk-faint" d="M132 160C170 150 220 146 286 138M132 160C168 136 200 112 244 98M132 160C150 128 168 92 196 62"/>
            <circle class="sk-dot" cx="286" cy="138" r="3.5"/><circle class="sk-dot" cx="244" cy="98" r="3.5"/>
            <circle class="sk-dot" cx="196" cy="62" r="3.5"/>
            <path class="sk-ink" d="M150 160V64"/>
            <path class="sk-ink" d="M152 70H190L197 76L190 82H152Z"/><path class="sk-line" d="M159 76H182"/>
            <path class="sk-ink" d="M148 88H118L111 94L118 100H148Z"/><path class="sk-line" d="M124 94H142"/>
            <path class="sk-ink" d="M152 106H184L190 111L184 116H152Z"/><path class="sk-line" d="M159 111H178"/>
            ${person(84, 160, { turn: 2 })}`,
    },
    // Set your expectations: two teammates at a notice board, one pinning up a new sheet.
    'notice-board': {
        view: '0 0 240 170',
        art: `<path class="sk-line" d="M8 160H232"/>
            <path class="sk-ink" d="M76 128V160M158 128V160"/>
            <rect class="sk-ink" x="64" y="56" width="106" height="72" rx="3"/>
            <rect class="sk-line" x="74" y="66" width="26" height="32"/><path class="sk-faint" d="M79 75H95M79 82H95M79 89H90"/>
            <rect class="sk-line" x="106" y="64" width="24" height="22"/><path class="sk-faint" d="M111 72H125M111 79H121"/>
            <rect class="sk-fill sk-ink" x="136" y="70" width="26" height="34" transform="rotate(4 149 87)"/>
            <path class="sk-line" d="M141 81H156M141 88H156M141 95H151"/>
            <circle class="sk-start" cx="149" cy="72" r="2"/>
            ${person(200, 160, { turn: -2, left: 'M191 106C181 102 172 96 164 90' })}
            ${person(34, 160, { turn: 2, right: 'M43 106C50 104 55 99 60 93' })}`,
    },
    // Feedback: two teammates facing each other, each saying something to the other.
    conversation: {
        view: '0 0 240 170',
        art: `<path class="sk-line" d="M8 160H232"/>
            <path class="sk-ink" d="M52 12H106A12 12 0 0 1 118 24V36A12 12 0 0 1 106 48H84L74 60L76 48H52A12 12 0 0 1 40 36V24A12 12 0 0 1 52 12Z"/>
            <path class="sk-line" d="M54 26H104M54 35H90"/>
            <path class="sk-line" d="M136 30H184A12 12 0 0 1 196 42V50A12 12 0 0 1 184 62H170L170 74L158 62H136A12 12 0 0 1 124 50V42A12 12 0 0 1 136 30Z"/>
            <path class="sk-faint" d="M138 42H182M138 51H168"/>
            ${person(70, 160, { turn: 2, right: 'M79 106C86 102 92 102 98 96' })}
            ${person(170, 160, { turn: -2 })}`,
    },
    // Self-assessment: someone on a rise, looking back along the ground they covered this cycle.
    'looking-back': {
        view: '0 0 240 170',
        art: `<path class="sk-far" d="M8 104C28 88 44 96 60 84C76 74 92 86 112 78C128 72 140 80 150 76"/>
            <path class="sk-line" d="M8 164C50 160 88 148 124 132C154 118 180 110 236 110"/>
            <circle class="sk-dot" cx="27" cy="161.6" r="3.5"/><circle class="sk-dot" cx="68" cy="152.5" r="3.5"/>
            <circle class="sk-dot" cx="124" cy="132" r="3.5"/><circle class="sk-dot" cx="170" cy="115.8" r="3.5"/>
            ${person(200, 110, { turn: -2, left: 'M191 56C186 50 187 44 193 41' })}`,
    },
    // Agreed focus: one teammate handing a responsibility, a box, to another who chose to take it on.
    handover: {
        view: '0 0 240 170',
        art: `<path class="sk-line" d="M8 160H232"/>
            <path class="sk-faint" d="M84 64C104 46 136 46 156 64"/><path class="sk-line" d="M148 63L156 64L157 56"/>
            <rect class="sk-fill sk-ink" x="104" y="100" width="32" height="26" rx="1"/>
            <path class="sk-line" d="M104 108H136M120 100V108"/>
            ${person(64, 160, { turn: 2, right: 'M73 106C84 106 94 110 104 113' })}
            ${person(176, 160, { turn: -2, left: 'M167 106C156 106 146 110 136 113' })}`,
    },
};

export function sketch(name) {
    const s = SKETCHES[name];
    if (!s) return '';
    return `<div class="page-sketch" aria-hidden="true"><svg viewBox="${s.view}" focusable="false">${s.art}</svg></div>`;
}
