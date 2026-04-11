// Shared frontmatter parser for build.js (Node) and app.js (browser)
(function(exports) {
    'use strict';

    /**
     * Parse YAML frontmatter from markdown content
     * @param {string} content - Raw markdown with frontmatter
     * @returns {{ frontmatter: Object, body: string }}
     */
    function parseFrontmatter(content) {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);

        if (!match) {
            return { frontmatter: {}, body: content };
        }

        const frontmatterStr = match[1];
        const body = match[2];
        const frontmatter = {};

        frontmatterStr.split('\n').forEach(line => {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();

                // Remove quotes if present
                if ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }

                // Parse numbers
                if (!isNaN(value) && value !== '') {
                    value = Number(value);
                }

                frontmatter[key] = value;
            }
        });

        return { frontmatter, body };
    }

    exports.parseFrontmatter = parseFrontmatter;

})(typeof module !== 'undefined' && module.exports ? module.exports : (window.FrontmatterParser = {}));
