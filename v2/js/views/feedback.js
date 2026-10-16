// Feedback: what to cover, how to give it, and the mid-cycle check, as a worksheet, linkable as
// #feedback/<section>. Reviewing and feedback (#teammates) keeps the short three-part form and
// links here for the rest.

import { renderProse } from './prose.js';

export const render = (content, [open]) => renderProse(content, 'feedback', { open, worksheet: true });
