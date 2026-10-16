// Agreed focus (#specialisation, the file keeps its old name so links work): how specialists and
// all-rounders grow and are recognised, linkable as #specialisation/<section>. Its fairness section
// leads with the team diagram (diagram.js), which carries what a table and its prose used to.

import { renderProse } from './prose.js';
import { md } from '../ui.js';
import { focusTeamDiagram } from '../diagram.js';

const FAIR = 'fair-to-everyone-on-the-team';

export function render(content, [open]) {
    const fair = content.pages.specialisation.sections.find(s => s.slug === FAIR);
    const body = fair ? fair.body.replace(/^<!-- group: .*? -->\s*/, '') : '';
    return renderProse(content, 'specialisation', { open, bodies: fair ? { [FAIR]: { visual: focusTeamDiagram() + md(body) } } : {} });
}
