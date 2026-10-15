// Specialisation: a draft view on how depth and breadth should be recognised, linkable as
// #specialisation/<section>. Marked as a draft (status: draft in its frontmatter), so the page says
// it isn't agreed and doesn't change the expectations elsewhere in the guide.

import { renderProse } from './prose.js';

export const render = (content, [open]) => renderProse(content, 'specialisation', { open });
