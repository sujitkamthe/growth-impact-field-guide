// Markdown parsing utilities (uses marked library for full markdown support)
(function(G) {
    'use strict';

    function slugify(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }

    function escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function parseInlineMarkdown(text) {
        return escapeHtml(text)
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>');
    }

    function renderHeading(level, text, id) {
        return `<h${level} id="${id}">${parseInlineMarkdown(text)}<a href="#${id}" class="anchor-link" aria-label="Link to this section">#</a></h${level}>\n`;
    }

    // Configure marked with custom heading renderer for anchor links
    const renderer = new marked.Renderer();
    renderer.heading = function({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = slugify(text.replace(/<[^>]*>/g, ''));
        return `<h${depth} id="${id}">${text}<a href="#${id}" class="anchor-link" aria-label="Link to this section">#</a></h${depth}>\n`;
    };

    marked.use({
        renderer,
        breaks: false,
        gfm: true
    });

    function parseMarkdownToHtml(markdown) {
        // Strip annotation comments before parsing
        const cleaned = markdown.replace(/<!--[\s\S]*?-->/g, '');
        return marked.parse(cleaned);
    }

    // Expose
    G.slugify = slugify;
    G.escapeHtml = escapeHtml;
    G.parseInlineMarkdown = parseInlineMarkdown;
    G.renderHeading = renderHeading;
    G.parseMarkdownToHtml = parseMarkdownToHtml;

})(window.FieldGuide = window.FieldGuide || {});
