// How to write a self-assessment and rate each area, as a worksheet. The assessment itself
// is written in the person's expectations doc; this page is the guide, linkable as
// #self-assessment/<section>. The scope tool links the expectations they're writing against.

import { renderProse } from './prose.js';
import { savedScope, scopeTool, bindScopeTool } from './_parts.js';

export const render = (content, [open]) => renderProse(content, 'self-assessment', {
    open,
    worksheet: true,
    lead: scopeTool(content, savedScope(content), 'Writing against'),
    mount: root => bindScopeTool(root, content, { save: true }),
});
