// Content loading, extraction, and parsing helpers
(function(G) {
    'use strict';

    const contentCache = {};
    const iconCache = {};

    async function loadContent(pageId) {
        if (contentCache[pageId]) return contentCache[pageId];

        const pageInfo = G.manifest.pages[pageId];
        if (!pageInfo) return null;

        try {
            const versionParam = G.manifest.version ? '?v=' + G.manifest.version : '';
            const response = await fetch(pageInfo.file + versionParam);
            if (!response.ok) {
                console.error(`Failed to load ${pageInfo.file}: ${response.status}`);
                return null;
            }
            const markdown = await response.text();
            const parsed = FrontmatterParser.parseFrontmatter(markdown);

            contentCache[pageId] = { ...pageInfo, ...parsed };
            return contentCache[pageId];
        } catch (error) {
            console.error(`Failed to fetch content for ${pageId}:`, error);
            return null;
        }
    }

    async function loadIcon(iconPath) {
        if (iconCache[iconPath]) return iconCache[iconPath];

        try {
            const versionParam = G.manifest.version ? '?v=' + G.manifest.version : '';
            const response = await fetch('content/' + iconPath + versionParam);
            if (!response.ok) {
                iconCache[iconPath] = '';
                return '';
            }
            const svg = await response.text();
            iconCache[iconPath] = svg;
            return svg;
        } catch (error) {
            iconCache[iconPath] = '';
            return '';
        }
    }

    // ---- Section & card parsers ----

    function parseSections(body) {
        const sections = [];
        const parts = body.split(/^## (.+)$/gm);

        for (let i = 1; i < parts.length; i += 2) {
            const title = parts[i]?.trim();
            const content = parts[i + 1];
            if (title && content) {
                const annotationMatch = content.match(/<!--\s*([\w-]+)(?::\s*([^\s]+))?\s*-->/);
                const annotation = annotationMatch ? {
                    type: annotationMatch[1],
                    value: annotationMatch[2] || null
                } : null;
                sections.push({ title, content, annotation });
            }
        }
        return sections;
    }

    function parseCardsFromSection(content) {
        const cards = [];
        const parts = content.split(/^### (.+)$/gm);

        for (let i = 1; i < parts.length; i += 2) {
            const title = parts[i]?.trim();
            const body = parts[i + 1]?.trim();
            if (title && body) {
                const firstPara = body.split('\n\n')[0].replace(/\n/g, ' ').trim();
                cards.push({ title, description: firstPara });
            }
        }
        return cards;
    }

    function parseListItems(content) {
        const items = [];
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed.startsWith('- ')) items.push(trimmed.substring(2).trim());
        }
        return items;
    }

    function parseParagraphs(content) {
        const paragraphs = [];
        let current = '';

        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('<!--')) {
                if (current) { paragraphs.push(current); current = ''; }
            } else if (!trimmed.startsWith('- ')) {
                current += (current ? ' ' : '') + trimmed;
            }
        }
        if (current) paragraphs.push(current);
        return paragraphs;
    }

    function parseIntentCards(content, annotation) {
        const regex = new RegExp(`<!--\\s*${annotation}\\s*-->([\\s\\S]*?)(?=<!--|\\n## |$)`);
        const match = content.match(regex);
        if (!match) return [];

        const section = match[1];
        const cards = [];
        const parts = section.split(/^(?=### )/m);

        for (const part of parts) {
            if (!part.startsWith('### ')) continue;
            const lines = part.split('\n');
            const title = lines[0].substring(4).trim();
            const card = { title, eyebrow: '', link: '', cta: '', description: '' };

            const descLines = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('eyebrow:')) card.eyebrow = line.substring(8).trim();
                else if (line.startsWith('link:')) card.link = line.substring(5).trim();
                else if (line.startsWith('cta:')) card.cta = line.substring(4).trim();
                else if (line) descLines.push(line);
            }
            card.description = descLines.join(' ');
            cards.push(card);
        }
        return cards;
    }

    function parseAntiPatternSection(content) {
        const result = { motto: '', signs: [], redFlags: [], signal: '' };

        const mottoMatch = content.match(/\*\*Motto:\*\*\s*"([^"]+)"/);
        if (mottoMatch) result.motto = mottoMatch[1];

        const parts = content.split(/^### (.+)$/gm);
        for (let i = 1; i < parts.length; i += 2) {
            const heading = parts[i]?.trim();
            const sectionContent = parts[i + 1];
            if (heading?.includes('Signs expectations may be too high')) {
                result.signs = parseListItems(sectionContent);
            } else if (heading?.includes('Red flags')) {
                result.redFlags = parseListItems(sectionContent);
            }
        }

        const signalMatch = content.match(/\*\*Signal:\*\*\s*(.+?)(?:\n|$)/);
        if (signalMatch) result.signal = signalMatch[1].trim();

        return result;
    }

    function parseCalibrationSection(content) {
        const result = { prompts: [], below: [], meets: [], exceeds: [] };

        const parts = content.split(/^### (.+)$/gm);
        for (let i = 1; i < parts.length; i += 2) {
            const heading = parts[i]?.trim();
            const body = parts[i + 1]?.trim() || '';

            if (heading === 'Reflection Prompts') result.prompts = parseListItems(body);
            else if (heading === 'Below Expectations') result.below = parseExamples(body);
            else if (heading === 'Meets Expectations') result.meets = parseExamples(body);
            else if (heading === 'Exceeds Expectations') result.exceeds = parseExamples(body);
        }
        return result;
    }

    function parseExamples(content) {
        const examples = [];
        const regex = /\*\*Example \d+:\*\*\s*([\s\S]*?)(?=\*\*Example \d+:\*\*|$)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            examples.push(match[1].trim());
        }
        return examples;
    }

    // ---- Extraction helpers ----

    function getIntroText(body) {
        const lines = body.split('\n');
        const introLines = [];
        for (const line of lines) {
            if (line.startsWith('##') || line.startsWith('<!--')) break;
            if (line.trim()) introLines.push(line.trim());
        }
        return introLines.join(' ');
    }

    function extractMindset(body) {
        const match = body.match(/## Mindset\s*\n\s*"([^"]+)"/);
        return match ? match[1] : '';
    }

    function extractTrustedQuestion(body) {
        const match = body.match(/\*\*The question you're trusted to answer:\*\*\s*"([^"]+)"/);
        return match ? match[1] : '';
    }

    function extractDescription(body) {
        const match = body.match(/## Description\s*\n\s*([^\n#]+)/);
        return match ? match[1].trim() : '';
    }

    function extractIntroduction(body) {
        const match = body.match(/## Introduction\s*\n([\s\S]*?)(?=\n## |$)/);
        return match ? match[1].trim() : '';
    }

    function extractNote(body) {
        const match = body.match(/## Note\s*\n([\s\S]*?)(?=\n## |$)/);
        return match ? match[1].trim() : '';
    }

    function extractSection(body, heading) {
        const regex = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`);
        const match = body.match(regex);
        return match ? match[1].trim() : null;
    }

    function extractListSection(body, heading) {
        const section = extractSection(body, heading);
        return section ? parseListItems(section) : [];
    }

    function extractCapabilitySections(body) {
        const sections = {};
        const parts = body.split(/^# (.+)$/gm);

        for (let i = 1; i < parts.length; i += 2) {
            const capName = parts[i]?.trim();
            const content = parts[i + 1];

            if (capName && content) {
                const expectations = [];
                const selfAssessment = [];

                const expMatch = content.match(/## Expectations\s*\n([\s\S]*?)(?=\n## |$)/);
                if (expMatch) {
                    for (const line of expMatch[1].split('\n')) {
                        if (line.trim().startsWith('- ')) expectations.push(line.trim().substring(2));
                    }
                }

                const selfMatch = content.match(/## Self-Assessment\s*\n([\s\S]*?)(?=\n---|$)/);
                if (selfMatch) {
                    for (const line of selfMatch[1].split('\n')) {
                        if (line.trim().startsWith('- ')) selfAssessment.push(line.trim().substring(2));
                    }
                }

                sections[capName] = { expectations, selfAssessment };
            }
        }
        return sections;
    }

    // Expose
    G.loadContent = loadContent;
    G.loadIcon = loadIcon;
    G.parseSections = parseSections;
    G.parseCardsFromSection = parseCardsFromSection;
    G.parseListItems = parseListItems;
    G.parseParagraphs = parseParagraphs;
    G.parseIntentCards = parseIntentCards;
    G.parseAntiPatternSection = parseAntiPatternSection;
    G.parseCalibrationSection = parseCalibrationSection;
    G.parseExamples = parseExamples;
    G.getIntroText = getIntroText;
    G.extractMindset = extractMindset;
    G.extractTrustedQuestion = extractTrustedQuestion;
    G.extractDescription = extractDescription;
    G.extractIntroduction = extractIntroduction;
    G.extractNote = extractNote;
    G.extractSection = extractSection;
    G.extractListSection = extractListSection;
    G.extractCapabilitySections = extractCapabilitySections;

})(window.FieldGuide = window.FieldGuide || {});
