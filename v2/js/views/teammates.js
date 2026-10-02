// Guidance for the people who review expectations, give feedback and take part in team
// checks, as a worksheet, linkable as #teammates/<section>. The scope tool links the expectations
// of the person being reviewed.

import { renderProse } from './prose.js';
import { scopeTool, bindScopeTool } from './_parts.js';

export const render = (content, [open]) => renderProse(content, 'teammates', {
    open,
    worksheet: true,
    lead: scopeTool(content, null, 'Reviewing someone at'),
    mount: root => bindScopeTool(root, content),
});
