// Markdown parsing utilities
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

    function renderTable(rows) {
        if (rows.length < 2) return '';

        const parseRow = (row) => row.split('|').filter(cell => cell.trim() !== '').map(cell => cell.trim());
        const headers = parseRow(rows[0]);
        const dataRows = rows.slice(2).map(parseRow);

        let html = '<table>\n<thead>\n<tr>\n';
        headers.forEach(h => html += `<th>${parseInlineMarkdown(h)}</th>\n`);
        html += '</tr>\n</thead>\n<tbody>\n';
        dataRows.forEach(row => {
            html += '<tr>\n';
            row.forEach(cell => html += `<td>${parseInlineMarkdown(cell)}</td>\n`);
            html += '</tr>\n';
        });
        html += '</tbody>\n</table>\n';
        return html;
    }

    function parseMarkdownToHtml(markdown) {
        const lines = markdown.split('\n');
        let html = '';
        let inList = false;
        let inOrderedList = false;
        let inTable = false;
        let tableRows = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            if (inList && !line.trim().startsWith('- ')) {
                html += '</ul>\n';
                inList = false;
            }

            if (inOrderedList && !line.trim().match(/^\d+\.\s/)) {
                html += '</ol>\n';
                inOrderedList = false;
            }

            if (inTable && !line.trim().startsWith('|')) {
                html += renderTable(tableRows);
                tableRows = [];
                inTable = false;
            }

            if (line.trim().startsWith('<!--') && line.trim().endsWith('-->')) {
                continue;
            }

            if (line.startsWith('##### ')) {
                const text = line.substring(6);
                html += renderHeading(5, text, slugify(text));
            } else if (line.startsWith('#### ')) {
                const text = line.substring(5);
                html += renderHeading(4, text, slugify(text));
            } else if (line.startsWith('### ')) {
                const text = line.substring(4);
                html += renderHeading(3, text, slugify(text));
            } else if (line.startsWith('## ')) {
                const text = line.substring(3);
                html += renderHeading(2, text, slugify(text));
            } else if (line.startsWith('# ')) {
                const text = line.substring(2);
                html += renderHeading(1, text, slugify(text));
            }
            else if (line.trim() === '---') {
                // Skip (section divider)
            }
            else if (line.startsWith('> ')) {
                html += `<blockquote><p>${parseInlineMarkdown(line.substring(2))}</p></blockquote>\n`;
            }
            else if (line.trim().startsWith('- ')) {
                if (!inList) {
                    html += '<ul>\n';
                    inList = true;
                }
                html += `<li>${parseInlineMarkdown(line.trim().substring(2))}</li>\n`;
            }
            else if (line.trim().match(/^\d+\.\s/)) {
                if (!inOrderedList) {
                    html += '<ol>\n';
                    inOrderedList = true;
                }
                const text = line.trim().replace(/^\d+\.\s/, '');
                html += `<li>${parseInlineMarkdown(text)}</li>\n`;
            }
            else if (line.trim().startsWith('|')) {
                inTable = true;
                tableRows.push(line.trim());
            }
            else if (line.trim() !== '') {
                html += `<p>${parseInlineMarkdown(line)}</p>\n`;
            }
        }

        if (inList) html += '</ul>\n';
        if (inOrderedList) html += '</ol>\n';
        if (inTable) html += renderTable(tableRows);

        return html;
    }

    // Expose
    G.slugify = slugify;
    G.escapeHtml = escapeHtml;
    G.parseInlineMarkdown = parseInlineMarkdown;
    G.renderHeading = renderHeading;
    G.parseMarkdownToHtml = parseMarkdownToHtml;

})(window.FieldGuide = window.FieldGuide || {});
