// The deployed build's id, stamped into index.html's <meta name="v2-build"> at deploy time by
// scripts/stamp-build.mjs ("dev" when the site runs locally). versioned(url) adds it to a URL that is
// built at runtime, so a browser fetches the files a new deploy changed instead of reusing cached
// copies; the deploy step versions the static imports and stylesheets itself.
const meta = typeof document !== 'undefined' ? document.querySelector('meta[name="v2-build"]') : null;
export const BUILD = meta?.content || 'dev';
export const versioned = url => (BUILD === 'dev' ? url : `${url}${url.includes('?') ? '&' : '?'}v=${BUILD}`);
