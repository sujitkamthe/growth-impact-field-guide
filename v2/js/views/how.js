// How it works: the model in one place, with the diagram where it helps most.

import { modelDiagram } from '../diagram.js';
import { renderProse } from './prose.js';

export function render(content) {
    const team = content.scope('team');
    const figure = (svg, caption) => `<figure class="diagram-figure">${svg}<figcaption>${caption}</figcaption></figure>`;
    return renderProse(content, 'how-it-works', {
        'one-scope-per-person': figure(modelDiagram(content, { scope: team, size: 190 }),
            'Team scope: the same band in all three areas.'),
        'growing-into-the-next-scope': figure(modelDiagram(content, { scope: team, stretch: ['cd'], size: 190 }),
            'Team scope, stretching into Wider in Client & Delivery.'),
    });
}
