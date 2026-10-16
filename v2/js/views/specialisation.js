// Specialisation: how specialists and all-rounders grow and are recognised, including specialist
// agreements, linkable as #specialisation/<section>. A page with status: draft in its frontmatter
// would show the draft notice; this one is agreed.

import { renderProse } from './prose.js';

export const render = (content, [open]) => renderProse(content, 'specialisation', { open });
