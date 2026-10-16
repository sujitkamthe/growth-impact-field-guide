// Agree your expectations: confirm your scope, write the doc, get it agreed, with a finished doc,
// as a worksheet, linkable as #agree/<section>. The scope tool links the expectations being written
// against.

import { renderProse } from './prose.js';
import { scopeTool, bindScopeTool } from './_parts.js';

export const render = (content, [open]) => renderProse(content, 'agree', {
    open,
    worksheet: true,
    lead: scopeTool(content, null, 'Writing expectations at'),
    mount: root => bindScopeTool(root, content),
});
