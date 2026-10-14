// Shared rendering primitives used across layout modules.
(function(G) {
    'use strict';

    // Single source of truth for accordion markup, ARIA, and initial state.
    // Toggle handler lives in router.js.
    function renderCollapsible(title, bodyHtml, { collapsed = true } = {}) {
        return `
            <div class="collapsible${collapsed ? ' collapsed' : ''}">
                <button class="collapsible-btn" aria-expanded="${!collapsed}">
                    <span>${title}</span>
                    <span class="collapsible-icon"></span>
                </button>
                <div class="collapsible-body">${bodyHtml}</div>
            </div>
        `;
    }

    // Splits markdown on H3 boundaries, wraps each H3 subsection as a collapsible,
    // renders intro/trailing prose inline. Used by About, Common Questions,
    // and Self-Assessment rating sections.
    function renderMarkdownAsCollapsibles(markdown) {
        const parts = markdown.split(/^(?=### )/m);
        let html = '';
        for (const part of parts) {
            if (part.startsWith('### ')) {
                const nl = part.indexOf('\n');
                const title = part.substring(4, nl).trim();
                const body = part.substring(nl + 1).trim();
                html += renderCollapsible(title, G.parseMarkdownToHtml(body));
            } else if (part.trim()) {
                html += G.parseMarkdownToHtml(part.trim());
            }
        }
        return html;
    }

    G.renderCollapsible = renderCollapsible;
    G.renderMarkdownAsCollapsibles = renderMarkdownAsCollapsibles;

})(window.FieldGuide = window.FieldGuide || {});
