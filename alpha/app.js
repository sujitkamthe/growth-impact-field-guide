// The Field Guide to Growth & Impact - Main Application
// Content-driven architecture with runtime markdown parsing

(function() {
    'use strict';

    // ============================================
    // Configuration
    // ============================================

    const BASE_PATH = '../';

    // ============================================
    // State
    // ============================================

    let manifest = null;
    const contentCache = {};
    const iconCache = {};
    let svgColorsCache = null;

    // ============================================
    // Initialization
    // ============================================

    async function init() {
        try {
            // Load manifest
            const response = await fetch(BASE_PATH + 'manifest.json?_t=' + Date.now());
            if (!response.ok) {
                throw new Error(`Failed to load manifest: ${response.status}`);
            }
            manifest = await response.json();

            // Initialize UI
            populateNavDropdowns();
            initNavigation();
            initDarkMode();

            // Handle initial page from URL hash
            const hash = window.location.hash.slice(1) || 'home';
            const [pageId, sectionId] = hash.split('/');
            await navigateTo(pageId, false, sectionId);
        } catch (error) {
            console.error('Failed to initialize app:', error);
            document.body.innerHTML = '<div class="container"><h1>Error</h1><p>Failed to load application. Please refresh.</p></div>';
        }
    }

    // ============================================
    // Content Loading
    // ============================================

    async function loadContent(pageId) {
        if (contentCache[pageId]) {
            return contentCache[pageId];
        }

        const pageInfo = manifest.pages[pageId];
        if (!pageInfo) {
            return null;
        }

        try {
            const versionParam = manifest.version ? '?v=' + manifest.version : '';
            const file = pageInfo.file;
            const response = await fetch(BASE_PATH + file + versionParam);
            if (!response.ok) {
                console.error(`Failed to load ${pageInfo.file}: ${response.status}`);
                return null;
            }
            const markdown = await response.text();
            const parsed = parseMarkdownFile(markdown);

            contentCache[pageId] = {
                ...pageInfo,
                ...parsed
            };

            return contentCache[pageId];
        } catch (error) {
            console.error(`Failed to fetch content for ${pageId}:`, error);
            return null;
        }
    }

    async function loadIcon(iconPath) {
        if (iconCache[iconPath]) {
            return iconCache[iconPath];
        }

        try {
            const versionParam = manifest.version ? '?v=' + manifest.version : '';
            const response = await fetch(BASE_PATH + 'content/' + iconPath + versionParam);
            if (!response.ok) {
                console.warn(`Icon not found: ${iconPath}`);
                iconCache[iconPath] = '';
                return '';
            }
            const svg = await response.text();
            iconCache[iconPath] = svg;
            return svg;
        } catch (error) {
            console.warn(`Failed to load icon ${iconPath}:`, error.message);
            iconCache[iconPath] = '';
            return '';
        }
    }

    // ============================================
    // Markdown Parsing
    // ============================================

    // Use shared frontmatter parser (loaded from frontmatter-parser.js)
    const parseMarkdownFile = FrontmatterParser.parseFrontmatter;

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

    function parseMarkdownToHtml(markdown) {
        const lines = markdown.split('\n');
        let html = '';
        let inList = false;
        let inOrderedList = false;
        let inTable = false;
        let tableRows = [];

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Close list if we're no longer in one
            if (inList && !line.trim().startsWith('- ')) {
                html += '</ul>\n';
                inList = false;
            }

            // Close ordered list if we're no longer in one
            if (inOrderedList && !line.trim().match(/^\d+\.\s/)) {
                html += '</ol>\n';
                inOrderedList = false;
            }

            // Close table if we're no longer in one
            if (inTable && !line.trim().startsWith('|')) {
                html += renderTable(tableRows);
                tableRows = [];
                inTable = false;
            }

            // Skip annotation comments (we handle these separately)
            if (line.trim().startsWith('<!--') && line.trim().endsWith('-->')) {
                continue;
            }

            // Headers (with auto-generated IDs and anchor links)
            if (line.startsWith('##### ')) {
                const text = line.substring(6);
                const id = slugify(text);
                html += renderHeading(5, text, id);
            } else if (line.startsWith('#### ')) {
                const text = line.substring(5);
                const id = slugify(text);
                html += renderHeading(4, text, id);
            } else if (line.startsWith('### ')) {
                const text = line.substring(4);
                const id = slugify(text);
                html += renderHeading(3, text, id);
            } else if (line.startsWith('## ')) {
                const text = line.substring(3);
                const id = slugify(text);
                html += renderHeading(2, text, id);
            } else if (line.startsWith('# ')) {
                const text = line.substring(2);
                const id = slugify(text);
                html += renderHeading(1, text, id);
            }
            // Horizontal rule
            else if (line.trim() === '---') {
                // Skip (used as section divider in markdown)
            }
            // Blockquotes
            else if (line.startsWith('> ')) {
                html += `<blockquote><p>${parseInlineMarkdown(line.substring(2))}</p></blockquote>\n`;
            }
            // Unordered list items
            else if (line.trim().startsWith('- ')) {
                if (!inList) {
                    html += '<ul>\n';
                    inList = true;
                }
                html += `<li>${parseInlineMarkdown(line.trim().substring(2))}</li>\n`;
            }
            // Ordered list items
            else if (line.trim().match(/^\d+\.\s/)) {
                if (!inOrderedList) {
                    html += '<ol>\n';
                    inOrderedList = true;
                }
                const text = line.trim().replace(/^\d+\.\s/, '');
                html += `<li>${parseInlineMarkdown(text)}</li>\n`;
            }
            // Table rows
            else if (line.trim().startsWith('|')) {
                inTable = true;
                tableRows.push(line.trim());
            }
            // Paragraphs
            else if (line.trim() !== '') {
                html += `<p>${parseInlineMarkdown(line)}</p>\n`;
            }
        }

        // Close any open elements
        if (inList) html += '</ul>\n';
        if (inOrderedList) html += '</ol>\n';
        if (inTable) html += renderTable(tableRows);

        return html;
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

    // ============================================
    // Navigation
    // ============================================

    function populateNavDropdowns() {
        const personasDropdown = document.getElementById('personas-dropdown');
        if (personasDropdown) {
            personasDropdown.innerHTML = manifest.personas.map(id => {
                const page = manifest.pages[`persona-${id}`];
                return `<li><a href="#persona-${id}" data-page="persona-${id}" class="persona-link">${page.name}</a></li>`;
            }).join('');
        }

        const capabilitiesDropdown = document.getElementById('capabilities-dropdown');
        if (capabilitiesDropdown) {
            capabilitiesDropdown.innerHTML = manifest.capabilities.map(id => {
                const page = manifest.pages[`capability-${id}`];
                return `<li><a href="#capability-${id}" data-page="capability-${id}" class="capability-link">${page.name}</a></li>`;
            }).join('');
        }
    }

    function initNavigation() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                navigateTo(pageId);
                return;
            }

            const anchor = e.target.closest('a[href^="#"]');
            if (anchor && !anchor.hasAttribute('data-page')) {
                const href = anchor.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const hash = href.slice(1);
                    const [pageId, sectionId] = hash.split('/');

                    // Check if this is an in-page anchor (element exists on current page)
                    const activePage = document.querySelector('.page.active');
                    const targetElement = activePage?.querySelector('#' + hash) ||
                                         activePage?.querySelector('[id="' + hash + '"]');

                    if (targetElement && !sectionId) {
                        // In-page anchor - scroll to element and update URL
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                        const currentPageId = activePage?.id?.replace('page-', '') || 'home';
                        history.pushState({ page: currentPageId, section: hash }, '', '#' + currentPageId + '/' + hash);
                    } else {
                        // Page navigation
                        navigateTo(pageId, true, sectionId || null);
                    }
                }
            }
        });

        window.addEventListener('popstate', function(e) {
            if (e.state && e.state.page) {
                showPage(e.state.page, false);
            }
        });

        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');

        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', function() {
                navLinks.classList.toggle('active');
            });

            navLinks.addEventListener('click', function(e) {
                if (e.target.closest('a')) {
                    navLinks.classList.remove('active');
                }
            });
        }
    }

    async function navigateTo(pageId, pushState = true, sectionId = null) {
        await showPage(pageId, pushState, sectionId);
    }

    async function showPage(pageId, pushState = true, sectionId = null) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Update nav links — virtual pages highlight their parent dropdown
        const isRefPage = !!virtualPages[pageId];
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            const linkPage = link.getAttribute('data-page');
            if (linkPage === pageId) {
                link.classList.add('active');
            } else if (isRefPage && linkPage === 'quick-reference' && link.closest('.dropdown') && !link.closest('.dropdown-menu')) {
                link.classList.add('active');
            }
        });

        // Get or create page container
        let targetPage = document.getElementById(pageId);
        if (!targetPage) {
            targetPage = document.createElement('section');
            targetPage.id = pageId;
            targetPage.className = 'page';
            document.getElementById('app').appendChild(targetPage);
        }

        // Render content if not already done
        if (targetPage.innerHTML.trim() === '') {
            await renderPage(pageId, targetPage);
            // Add layout-specific class for CSS scoping
            const pageInfo = manifest.pages[pageId];
            if (pageInfo?.layout) {
                targetPage.classList.add(pageInfo.layout + '-page');
            } else if (virtualPages[pageId]) {
                targetPage.classList.add('reference-page');
            }
        }

        targetPage.classList.add('active');

        // Hide footer and lock viewport on full-viewport sidebar pages
        const sidebarPage = pageId === 'self-assessment' || pageId === 'anti-patterns' || pageId.startsWith('persona-') || pageId.startsWith('capability-');
        const footer = document.querySelector('.main-footer');
        if (footer) {
            footer.style.display = sidebarPage ? 'none' : '';
        }
        document.body.classList.toggle('sidebar-active', sidebarPage);

        // Scroll handling
        if (sectionId) {
            const sectionElement = targetPage.querySelector('#' + sectionId) ||
                targetPage.querySelector('[id="' + sectionId + '"]');
            if (sectionElement) {
                setTimeout(() => sectionElement.scrollIntoView({ behavior: 'smooth' }), 50);
            } else {
                window.scrollTo(0, 0);
            }
        } else {
            window.scrollTo(0, 0);
        }

        // Update URL
        if (pushState) {
            const hashUrl = sectionId ? '#' + pageId + '/' + sectionId : '#' + pageId;
            history.pushState({ page: pageId, section: sectionId }, '', hashUrl);
        }
    }

    // ============================================
    // Layout Renderers
    // ============================================

    // Layout registry - maps layout names to render functions
    const layoutRenderers = {
        'home': renderHomeLayout,
        'personas-overview': renderPersonasOverviewLayout,
        'capabilities-overview': renderCapabilitiesOverviewLayout,
        'persona-detail': renderPersonaDetailLayout,
        'capability-detail': renderCapabilityDetailLayout,
        'markdown-page': renderMarkdownPageLayout,
        'self-assessment': renderSelfAssessmentLayout,
        'quick-reference': renderQuickReferenceLayout
    };

    // Virtual pages — rendered from sections of existing content files
    const virtualPages = {
        'quick-reference': {
            renderer: renderQuickReferenceOverview,
            title: 'Quick Reference'
        },
        'about': {
            sourcePageId: 'home',
            renderer: renderAboutPage,
            title: 'About This Guide'
        },
        'common-questions': {
            sourcePageId: 'quick-reference',
            renderer: renderCommonQuestionsPage,
            title: 'Common Questions'
        },
        'anti-patterns': {
            sourcePageId: 'quick-reference',
            renderer: renderAntiPatternsPage,
            title: 'Anti-Patterns'
        }
    };

    async function renderPage(pageId, container) {
        // Check virtual pages first
        const vp = virtualPages[pageId];
        if (vp) {
            if (!vp.sourcePageId) {
                await vp.renderer(null, container);
                return;
            }
            const sourceContent = await loadContent(vp.sourcePageId);
            if (sourceContent) {
                await vp.renderer(sourceContent, container);
                return;
            }
        }

        const content = await loadContent(pageId);
        if (!content) {
            container.innerHTML = '<div class="container"><h1>Page Not Found</h1></div>';
            return;
        }

        const renderer = layoutRenderers[content.layout];
        if (renderer) {
            await renderer(content, container);
        } else {
            container.innerHTML = '<div class="container"><h1>Unknown Layout</h1></div>';
        }
    }

    async function renderHomeLayout(content, container) {
        container.innerHTML = `
            <div class="g-home">
                <div class="g-hero">
                    <h1>${content.title}</h1>
                    <p class="g-tagline">${content.tagline}</p>
                </div>
                <div class="g-intent-grid">
                    <a href="#personas" data-page="personas" class="g-intent-card">
                        <div class="g-intent-eyebrow">Growth Stage</div>
                        <h2>Where am I in my growth?</h2>
                        <p>Find your persona and understand what's expected at your level.</p>
                        <span class="g-intent-cta">Explore Personas &rarr;</span>
                    </a>
                    <a href="#capabilities" data-page="capabilities" class="g-intent-card">
                        <div class="g-intent-eyebrow">Capabilities</div>
                        <h2>What skill should I develop?</h2>
                        <p>Browse the five capability areas and see expectations at each level.</p>
                        <span class="g-intent-cta">Explore Capabilities &rarr;</span>
                    </a>
                    <a href="#self-assessment" data-page="self-assessment" class="g-intent-card">
                        <div class="g-intent-eyebrow">Self-Assessment</div>
                        <h2>Time to reflect on my growth</h2>
                        <p>Process your feedback, rate yourself, and prepare for your team check.</p>
                        <span class="g-intent-cta">Start Self-Assessment &rarr;</span>
                    </a>
                </div>
                <div class="g-intent-grid g-intent-grid-secondary">
                    <a href="#about" data-page="about" class="g-intent-card">
                        <div class="g-intent-eyebrow">Reference</div>
                        <h2>About this guide</h2>
                        <p>What this guide is for, who it's designed for, and how to use it.</p>
                        <span class="g-intent-cta">Read More &rarr;</span>
                    </a>
                    <a href="#common-questions" data-page="common-questions" class="g-intent-card">
                        <div class="g-intent-eyebrow">FAQ</div>
                        <h2>Common questions</h2>
                        <p>Personas, salary, domain switches, and choosing the right level.</p>
                        <span class="g-intent-cta">Browse Questions &rarr;</span>
                    </a>
                </div>
            </div>
        `;
    }

    // ============================================
    // Virtual Page Renderers
    // ============================================

    // Quick Reference overview — card-based landing for reference sub-pages
    async function renderQuickReferenceOverview(content, container) {
        container.innerHTML = `
            <div class="container reference-page-content">
                <h1>Quick Reference</h1>
                <p class="page-intro">Guides, common questions, and calibration tools to help you use the framework effectively.</p>
                <div class="g-intent-grid g-ref-grid">
                    <a href="#about" data-page="about" class="g-intent-card">
                        <div class="g-intent-eyebrow">Guide</div>
                        <h2>About This Guide</h2>
                        <p>What this guide is for, who it's designed for, and how to use it.</p>
                        <span class="g-intent-cta">Read More &rarr;</span>
                    </a>
                    <a href="#common-questions" data-page="common-questions" class="g-intent-card">
                        <div class="g-intent-eyebrow">FAQ</div>
                        <h2>Common Questions</h2>
                        <p>Personas, salary, domain switches, and choosing the right level.</p>
                        <span class="g-intent-cta">Browse Questions &rarr;</span>
                    </a>
                    <a href="#anti-patterns" data-page="anti-patterns" class="g-intent-card">
                        <div class="g-intent-eyebrow">Calibration</div>
                        <h2>Anti-Patterns</h2>
                        <p>Warning signs that expectations may be too high, plus a final self-check.</p>
                        <span class="g-intent-cta">Review Patterns &rarr;</span>
                    </a>
                </div>
            </div>
        `;
    }

    // About This Guide — combines What This Guide Is For, Growth Is Self-Directed,
    // How to Use This Guide, Who This Guide Is For, and What We Value from home.md
    async function renderAboutPage(content, container) {
        const sections = parseSections(content.body);
        const includeSections = [
            'What This Guide Is For', 'Growth Is Self-Directed',
            'How to Use This Guide', 'Who This Guide Is For', 'What We Value'
        ];

        let html = '<div class="container reference-page-content"><h1>About This Guide</h1>';

        for (const section of sections) {
            if (!includeSections.includes(section.title)) continue;

            if (section.annotation?.type === 'cards') {
                html += renderCardsSection(section);
                continue;
            }

            // Render prose with H3 sub-sections as accordions
            const cleanContent = section.content.replace(/<!--[^>]*-->/g, '');
            const parts = cleanContent.split(/^(?=### )/m);
            let sectionBody = '';
            for (const part of parts) {
                if (part.startsWith('### ')) {
                    const nl = part.indexOf('\n');
                    const title = part.substring(4, nl).trim();
                    const body = part.substring(nl + 1).trim();
                    sectionBody += `
                        <div class="g-sa-collapsible collapsed">
                            <button class="g-sa-collapsible-btn">
                                <span>${title}</span>
                                <span class="g-sa-collapsible-icon"></span>
                            </button>
                            <div class="g-sa-collapsible-body">${parseMarkdownToHtml(body)}</div>
                        </div>
                    `;
                } else if (part.trim()) {
                    sectionBody += parseMarkdownToHtml(part.trim());
                }
            }
            html += `<section class="g-home-section"><h2>${section.title}</h2>${sectionBody}</section>`;
        }

        html += '</div>';
        container.innerHTML = html;

        container.addEventListener('click', function(e) {
            const collBtn = e.target.closest('.g-sa-collapsible-btn');
            if (collBtn) {
                collBtn.closest('.g-sa-collapsible').classList.toggle('collapsed');
            }
        });
    }

    // Common Questions — FAQ section from quick-reference.md as accordions
    async function renderCommonQuestionsPage(content, container) {
        const sections = parseSections(content.body);
        const faqSection = sections.find(s => s.title === 'Common Questions');

        let html = '<div class="container reference-page-content"><h1>Common Questions</h1>';

        if (faqSection) {
            const parts = faqSection.content.split(/^(?=### )/m);
            for (const part of parts) {
                if (part.startsWith('### ')) {
                    const nl = part.indexOf('\n');
                    const title = part.substring(4, nl).trim();
                    const body = part.substring(nl + 1).trim();
                    html += `
                        <div class="g-sa-collapsible collapsed">
                            <button class="g-sa-collapsible-btn">
                                <span>${title}</span>
                                <span class="g-sa-collapsible-icon"></span>
                            </button>
                            <div class="g-sa-collapsible-body">${parseMarkdownToHtml(body)}</div>
                        </div>
                    `;
                } else if (part.trim()) {
                    html += parseMarkdownToHtml(part.trim());
                }
            }
        }

        html += '</div>';
        container.innerHTML = html;

        container.addEventListener('click', function(e) {
            const collBtn = e.target.closest('.g-sa-collapsible-btn');
            if (collBtn) {
                collBtn.closest('.g-sa-collapsible').classList.toggle('collapsed');
            }
        });
    }

    // Anti-Patterns — sidebar layout with persona nav + warning signs + self-check
    async function renderAntiPatternsPage(content, container) {
        const sections = parseSections(content.body);
        const personaSections = {};
        let antiPatternsIntro = null;
        let universalWarnings = null;
        let finalSelfCheck = null;

        for (const section of sections) {
            if (section.title.endsWith(' Anti-Patterns')) {
                const personaName = section.title.replace(' Anti-Patterns', '').toLowerCase();
                personaSections[personaName] = parseAntiPatternSection(section.content);
            } else if (section.title === 'Anti-Patterns') {
                antiPatternsIntro = section.content;
            } else if (section.title === 'Universal Warning Signs') {
                universalWarnings = section.content;
            } else if (section.title === 'Final Self-Check') {
                finalSelfCheck = section.content;
            }
        }

        // Build persona panels
        var personaPanels = '';
        for (var i = 0; i < manifest.personas.length; i++) {
            var pId = manifest.personas[i];
            var persona = manifest.pages['persona-' + pId];
            var antiPatterns = personaSections[pId];

            if (persona && antiPatterns) {
                var apBorderStyle = getPersonaBorderStyle(pId, persona.color);
                var apBorderClass = getPersonaBorderClass(pId);
                personaPanels += '<div class="g-sidebar-panel' + (i === 0 ? ' active' : '') + '" data-panel="persona-' + pId + '">' +
                    '<div class="anti-pattern-card ' + apBorderClass + '" style="' + apBorderStyle + '">' +
                        '<div class="anti-pattern-header">' +
                            '<h3>' + persona.name + '</h3>' +
                            '<span class="anti-pattern-motto">' + antiPatterns.motto + '</span>' +
                        '</div>' +
                        '<div class="anti-pattern-grid">' +
                            '<div class="anti-pattern-section">' +
                                '<h4>⚠️ Signs expectations may be too high</h4>' +
                                '<ul>' + antiPatterns.signs.map(function(s) { return '<li>' + parseInlineMarkdown(s) + '</li>'; }).join('') + '</ul>' +
                            '</div>' +
                            '<div class="anti-pattern-section red-flags">' +
                                '<h4>🚩 Red flags</h4>' +
                                '<ul>' + antiPatterns.redFlags.map(function(r) { return '<li>' + parseInlineMarkdown(r) + '</li>'; }).join('') + '</ul>' +
                            '</div>' +
                        '</div>' +
                        '<div class="anti-pattern-signal">' +
                            '<strong>Signal:</strong> ' + parseInlineMarkdown(antiPatterns.signal) +
                        '</div>' +
                    '</div>' +
                '</div>';
            }
        }

        container.innerHTML =
            '<div class="g-sidebar-layout">' +
                '<aside class="g-sidebar">' +
                    '<div class="g-sidebar-inner">' +
                        '<div>' +
                            '<h1 class="g-sa-sidebar-title">Anti-Patterns</h1>' +
                            (antiPatternsIntro ? '<p class="g-sa-sidebar-intro">' + parseInlineMarkdown(antiPatternsIntro.replace(/<!--[^>]*-->/g, '').trim().split('\n')[0]) + '</p>' : '') +
                        '</div>' +
                        '<nav class="g-pd-nav">' +
                            manifest.personas.map(function(pId, index) {
                                var persona = manifest.pages['persona-' + pId];
                                return '<button class="g-sa-nav-btn' + (index === 0 ? ' active' : '') + '" data-panel="persona-' + pId + '">' +
                                    '<span class="g-sa-nav-label">' + persona.name + '</span>' +
                                '</button>';
                            }).join('') +
                            '<div class="g-sa-nav-divider"></div>' +
                            '<button class="g-sa-nav-btn" data-panel="warning-signs">' +
                                '<span class="g-sa-nav-label">Universal Warning Signs</span>' +
                            '</button>' +
                            '<button class="g-sa-nav-btn" data-panel="self-check">' +
                                '<span class="g-sa-nav-label">Final Self-Check</span>' +
                            '</button>' +
                        '</nav>' +
                    '</div>' +
                '</aside>' +
                '<div class="g-sidebar-content">' +
                    personaPanels +
                    (universalWarnings ? '<div class="g-sidebar-panel" data-panel="warning-signs"><h2 class="g-sa-content-step-title">Universal Warning Signs</h2>' + parseMarkdownToHtml(universalWarnings) + '</div>' : '') +
                    (finalSelfCheck ? '<div class="g-sidebar-panel" data-panel="self-check"><h2 class="g-sa-content-step-title">Final Self-Check</h2>' + parseMarkdownToHtml(finalSelfCheck) + '</div>' : '') +
                '</div>' +
            '</div>';

        // Sidebar nav click handler
        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.g-sa-nav-btn');
            if (!btn) return;
            var panelId = btn.getAttribute('data-panel');
            container.querySelectorAll('.g-sa-nav-btn').forEach(function(b) { b.classList.remove('active'); });
            container.querySelectorAll('.g-sidebar-panel').forEach(function(p) { p.classList.remove('active'); });
            btn.classList.add('active');
            var panel = container.querySelector('.g-sidebar-panel[data-panel="' + panelId + '"]');
            if (panel) panel.classList.add('active');
        });
    }

    function renderCardsSection(section) {
        const cards = parseCardsFromSection(section.content);
        return `
            <section class="values-section">
                <h2>${section.title}</h2>
                <div class="values-grid">
                    ${cards.map(card => `
                        <div class="value-card">
                            <h3>${card.title}</h3>
                            <p>${parseInlineMarkdown(card.description)}</p>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderKeyTruthsSection(section) {
        const items = parseListItems(section.content);
        return `
            <section class="key-truths-section">
                <h2>${section.title}</h2>
                <ul class="key-truths-list">
                    ${items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}
                </ul>
            </section>
        `;
    }

    function renderGenericSection(section) {
        const paragraphs = parseParagraphs(section.content);
        const sectionClass = slugify(section.title) + '-section';
        return `
            <section class="${sectionClass}">
                <h2>${section.title}</h2>
                ${paragraphs.map(p => `<p>${parseInlineMarkdown(p)}</p>`).join('')}
            </section>
        `;
    }

    function renderExploreCards() {
        return `
            <section class="explore-section">
                <h2>Explore the Guide</h2>
                <div class="explore-grid">
                    <a href="#personas" data-page="personas" class="explore-card">
                        <h3>Personas</h3>
                        <p class="explore-card-steer">Know your current level? Start here.</p>
                        <p>Understand how impact evolves from Explorer to Strategist</p>
                        <span class="arrow">→</span>
                    </a>
                    <a href="#capabilities" data-page="capabilities" class="explore-card">
                        <h3>Capability Areas</h3>
                        <p class="explore-card-steer">Developing a specific skill? Start here.</p>
                        <p>Explore the five dimensions of engineering impact</p>
                        <span class="arrow">→</span>
                    </a>
                </div>
            </section>
        `;
    }

    async function renderPersonasOverviewLayout(content, container) {
        let html = `
            <div class="container">
                <h1>${content.title}</h1>
                <p class="page-intro">${parseInlineMarkdown(getIntroText(content.body))}</p>
        `;

        // Check for diagram annotation
        if (content.body.includes('<!-- diagram: impact-rings -->')) {
            html += `
                <div class="diagram-container">
                    <svg id="impact-rings" viewBox="0 0 580 400" class="impact-rings-svg"></svg>
                </div>
            `;
        }

        // Check for tracks-intro annotation and render content between it and persona-cards
        if (content.body.includes('<!-- tracks-intro -->')) {
            const tracksIntroMatch = content.body.match(/<!-- tracks-intro -->\s*([\s\S]*?)(?=<!-- persona-cards -->|$)/);
            if (tracksIntroMatch && tracksIntroMatch[1].trim()) {
                html += `<div class="tracks-intro">${parseMarkdownToHtml(tracksIntroMatch[1].trim())}</div>`;
            }
        }

        // Check for persona-cards annotation
        if (content.body.includes('<!-- persona-cards -->')) {
            // Group personas by level
            const foundation = ['explorer', 'artisan', 'catalyst'];
            const teamLevel = ['multiplier', 'amplifier'];
            const orgLevel = ['strategist', 'pioneer'];

            // Helper to render a persona card
            const renderPersonaCard = async (personaId) => {
                const persona = manifest.pages[`persona-${personaId}`];
                const personaContent = await loadContent(`persona-${personaId}`);
                const mindset = extractMindset(personaContent.body);
                return `
                    <a href="#persona-${persona.id}" data-page="persona-${persona.id}" class="persona-card persona-${persona.id}">
                        <div class="persona-scope">${getScopeWithTrack(persona.id, persona.scope)}</div>
                        <h3>${persona.name}</h3>
                        <p class="persona-tagline">${persona.tagline}</p>
                        <p class="persona-mindset">"${mindset}"</p>
                    </a>
                `;
            };

            // Load all persona cards in parallel
            const [foundationCards, teamCards, orgCards] = await Promise.all([
                Promise.all(foundation.map(renderPersonaCard)),
                Promise.all(teamLevel.map(renderPersonaCard)),
                Promise.all(orgLevel.map(renderPersonaCard))
            ]);

            html += `<div class="personas-grid personas-grid-3">${foundationCards.join('')}</div>`;
            html += `<div class="personas-grid personas-grid-2">${teamCards.join('')}</div>`;
            html += `<div class="personas-grid personas-grid-2">${orgCards.join('')}</div>`;
        }

        html += `</div>`;
        container.innerHTML = html;

        // Render diagram
        if (content.body.includes('<!-- diagram: impact-rings -->')) {
            renderImpactRings();
        }
    }

    async function renderCapabilitiesOverviewLayout(content, container) {
        let html = `
            <div class="container">
                <h1>${content.title}</h1>
                <p class="page-intro">${parseInlineMarkdown(getIntroText(content.body))}</p>
        `;

        // Check for diagram annotation
        if (content.body.includes('<!-- diagram: capability-radar -->')) {
            html += `
                <div class="diagram-container">
                    <svg id="capability-radar" viewBox="0 0 500 450" class="radar-svg"></svg>
                </div>
            `;

            // Get diagram caption (text right after diagram annotation)
            const captionMatch = content.body.match(/<!-- diagram: capability-radar -->\s*\n\n([^\n#<]+)/);
            if (captionMatch) {
                html += `<p class="diagram-caption">${parseInlineMarkdown(captionMatch[1].trim())}</p>`;
            }
        }

        // Check for capability-cards annotation
        if (content.body.includes('<!-- capability-cards -->')) {
            html += `<div class="capabilities-grid">`;

            for (const capId of manifest.capabilities) {
                const cap = manifest.pages[`capability-${capId}`];
                // Load full capability content to get description
                const capContent = await loadContent(`capability-${capId}`);
                const description = extractDescription(capContent.body);
                const icon = cap.icon ? await loadIcon(cap.icon) : '';

                html += `
                    <a href="#capability-${cap.id}" data-page="capability-${cap.id}" class="capability-card">
                        <div class="capability-icon">${icon ? icon.replace(/width="\d+"/, 'width="32"').replace(/height="\d+"/, 'height="32"') : ''}</div>
                        <h3>${cap.name}</h3>
                        <p class="capability-question">${cap.question}</p>
                        <p>${description}</p>
                    </a>
                `;
            }

            html += `</div>`;
        }

        // Render any remaining sections with annotations
        const sections = parseSections(content.body);
        for (const section of sections) {
            if (section.annotation?.type === 'balance') {
                html += `
                    <section class="balance-section">
                        <h2>${section.title}</h2>
                        ${parseMarkdownToHtml(section.content)}
                    </section>
                `;
            }
        }

        html += `</div>`;
        container.innerHTML = html;

        // Render diagram
        if (content.body.includes('<!-- diagram: capability-radar -->')) {
            renderCapabilityRadar();
        }
    }

    async function renderPersonaDetailLayout(content, container) {
        const personaId = content.id;
        const personaIndex = manifest.personas.indexOf(personaId);
        const prevPersonaId = personaIndex > 0 ? manifest.personas[personaIndex - 1] : null;
        const nextPersonaId = personaIndex < manifest.personas.length - 1 ? manifest.personas[personaIndex + 1] : null;
        const prevPersona = prevPersonaId ? manifest.pages[`persona-${prevPersonaId}`] : null;
        const nextPersona = nextPersonaId ? manifest.pages[`persona-${nextPersonaId}`] : null;

        const mindset = extractMindset(content.body);
        const trustedQuestion = extractTrustedQuestion(content.body);
        const natureOfImpact = extractListSection(content.body, 'Nature of Impact');
        const successLooksLike = extractListSection(content.body, 'Success Looks Like');
        const explicitExpectation = extractListSection(content.body, 'Explicit Expectation');

        const borderClass = getPersonaBorderClass(personaId);
        const capabilitySections = extractCapabilitySections(content.body);

        // Build capability panels
        const capPanels = manifest.capabilities.map(capId => {
            const cap = manifest.pages[`capability-${capId}`];
            const capSection = capabilitySections[cap.name];
            if (!cap || !capSection) return null;
            return { capId, cap, capSection };
        }).filter(Boolean);

        container.innerHTML = `
            <div class="g-sidebar-layout">
                <aside class="g-sidebar">
                    <div class="g-sidebar-inner">
                        <div class="g-pd-identity ${borderClass}">
                            <div class="persona-scope">${getScopeWithTrack(personaId, content.scope)}</div>
                            <h1 class="g-pd-name">${content.name}</h1>
                            <p class="g-pd-tagline">${content.tagline}</p>
                        </div>

                        <nav class="g-pd-nav">
                            <button class="g-sa-nav-btn active" data-panel="overview">
                                <span class="g-sa-nav-label">Overview</span>
                            </button>
                            <div class="g-sa-nav-divider"></div>
                            ${capPanels.map(({ capId, cap }) => `
                                <button class="g-sa-nav-btn" data-panel="cap-${capId}">
                                    <span class="g-sa-nav-label">${cap.name}</span>
                                </button>
                            `).join('')}
                        </nav>

                        <div class="g-sidebar-footer">
                            <a href="#self-assessment" data-page="self-assessment" class="g-pd-cta">Assess yourself &rarr;</a>
                            <div class="g-pd-persona-nav">
                                ${prevPersona ? `<a href="#persona-${prevPersona.id}" data-page="persona-${prevPersona.id}">&larr; ${prevPersona.name}</a>` : '<span></span>'}
                                ${nextPersona ? `<a href="#persona-${nextPersona.id}" data-page="persona-${nextPersona.id}">${nextPersona.name} &rarr;</a>` : ''}
                            </div>
                        </div>
                    </div>
                </aside>

                <div class="g-sidebar-content">
                    <div class="g-sidebar-panel active" data-panel="overview">
                        <div class="g-pd-quote">
                            <p class="detail-mindset">"${mindset}"</p>
                            ${trustedQuestion ? `<p class="g-pd-question"><strong>The question you're trusted to answer:</strong> "${trustedQuestion}"</p>` : ''}
                        </div>
                        <div class="g-pd-impact-grid">
                            <div class="g-pd-impact-block">
                                <h4>Nature of Impact</h4>
                                <ul>${natureOfImpact.map(item => `<li>${item}</li>`).join('')}</ul>
                            </div>
                            ${successLooksLike.length > 0 ? `
                            <div class="g-pd-impact-block">
                                <h4>Success Looks Like</h4>
                                <ul>${successLooksLike.map(item => `<li>${item}</li>`).join('')}</ul>
                            </div>
                            ` : ''}
                            ${explicitExpectation.length > 0 ? `
                            <div class="g-pd-impact-block">
                                <h4>Explicit Expectation</h4>
                                <ul>${explicitExpectation.map(item => `<li>${item}</li>`).join('')}</ul>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    ${capPanels.map(({ capId, cap, capSection }) => `
                        <div class="g-sidebar-panel" data-panel="cap-${capId}">
                            <h2 class="g-pd-cap-title">
                                ${cap.name}
                                <a href="#capability-${capId}" data-page="capability-${capId}" class="g-pd-cap-link">View full capability &rarr;</a>
                            </h2>
                            <ul class="expectations-list">
                                ${capSection.expectations.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                            ${capSection.selfAssessment.length > 0 ? `
                            <div class="g-pd-prompts">
                                <h3>Self-Assessment Prompts</h3>
                                <ul>${capSection.selfAssessment.map(item => `<li>${item}</li>`).join('')}</ul>
                            </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Event delegation — capability nav switching
        container.addEventListener('click', function(e) {
            const navBtn = e.target.closest('.g-sa-nav-btn[data-panel]');
            if (navBtn) {
                const panelId = navBtn.dataset.panel;
                container.querySelectorAll('.g-sa-nav-btn[data-panel]').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.panel === panelId);
                });
                container.querySelectorAll('.g-sidebar-panel').forEach(panel => {
                    panel.classList.toggle('active', panel.dataset.panel === panelId);
                });
                container.querySelector('.g-sidebar-content').scrollTop = 0;
            }
        });
    }

    async function renderCapabilityDetailLayout(content, container) {
        const capId = content.id;
        const capIndex = manifest.capabilities.indexOf(capId);
        const prevCapId = capIndex > 0 ? manifest.capabilities[capIndex - 1] : null;
        const nextCapId = capIndex < manifest.capabilities.length - 1 ? manifest.capabilities[capIndex + 1] : null;
        const prevCap = prevCapId ? manifest.pages[`capability-${prevCapId}`] : null;
        const nextCap = nextCapId ? manifest.pages[`capability-${nextCapId}`] : null;

        const intro = extractIntroduction(content.body);
        const note = extractNote(content.body);

        let html = `
            <div class="container">
                <div class="detail-header">
                    <h1>${content.name}</h1>
                    <p class="detail-subtitle">${content.question}</p>
                    <div style="color: var(--color-text-secondary);">${parseMarkdownToHtml(intro)}</div>
                    ${note ? `<div class="highlight-box" style="margin-top: var(--space-lg);">${parseMarkdownToHtml(note)}</div>` : ''}
                </div>

                <h2>Expectations by Persona</h2>

                <div class="persona-tabs">
                    ${manifest.personas.map((pId, index) => {
                        const persona = manifest.pages[`persona-${pId}`];
                        return `<button class="persona-tab ${index === 0 ? 'active' : ''}" data-persona="${pId}">${persona.name}</button>`;
                    }).join('')}
                </div>

                <div class="persona-contents">
        `;

        // Load all persona content to get their expectations for this capability
        for (let i = 0; i < manifest.personas.length; i++) {
            const pId = manifest.personas[i];
            const persona = manifest.pages[`persona-${pId}`];
            const personaContent = await loadContent(`persona-${pId}`);

            const capabilitySections = extractCapabilitySections(personaContent.body);
            const expectations = capabilitySections[content.name];
            const mindset = extractMindset(personaContent.body);
            const trustedQuestion = extractTrustedQuestion(personaContent.body);

            if (persona && expectations) {
                const pBorderStyle = getPersonaBorderStyle(pId, persona.color);
                const pBorderClass = getPersonaBorderClass(pId);
                html += `
                    <div class="persona-content ${i === 0 ? 'active' : ''}" data-persona="${pId}">
                        <div class="capability-section ${pBorderClass}" style="${pBorderStyle} margin-left: 0; border-radius: 0 var(--radius-lg) var(--radius-lg) 0;">
                            <div style="display: flex; align-items: baseline; gap: var(--space-md); margin-bottom: var(--space-lg);">
                                <h3 style="border: none; padding: 0; margin: 0;">${persona.name}</h3>
                                <span style="color: var(--color-text-muted); font-size: 0.9rem;">${getScopeWithTrack(pId, persona.scope)}</span>
                            </div>
                            <p style="font-style: italic; color: var(--color-text-secondary); margin-bottom: ${trustedQuestion ? 'var(--space-sm)' : 'var(--space-lg)'};">"${mindset}"</p>
                            ${trustedQuestion ? `<p style="color: var(--color-text-secondary); margin-bottom: var(--space-lg); font-size: 0.9rem;"><strong>The question you're trusted to answer:</strong> "${trustedQuestion}"</p>` : ''}
                            <ul class="expectations-list">
                                ${expectations.expectations.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                            ${expectations.selfAssessment.length > 0 ? `
                            <div class="self-assessment">
                                <h4>Self-Assessment Prompts</h4>
                                <ul>
                                    ${expectations.selfAssessment.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
        }

        html += `
                </div>

                <div class="self-assessment-cta">
                    <a href="#self-assessment" data-page="self-assessment">Ready to assess yourself? &rarr; How to Do Your Self-Assessment</a>
                </div>

                <div class="nav-links-bottom">
                    ${prevCap ? `
                    <a href="#capability-${prevCap.id}" data-page="capability-${prevCap.id}" class="nav-link-prev">
                        <span class="nav-link-label">Previous</span>
                        <span class="nav-link-title">${prevCap.name}</span>
                    </a>
                    ` : '<div></div>'}
                    ${nextCap ? `
                    <a href="#capability-${nextCap.id}" data-page="capability-${nextCap.id}" class="nav-link-next">
                        <span class="nav-link-label">Next</span>
                        <span class="nav-link-title">${nextCap.name}</span>
                    </a>
                    ` : ''}
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Tab switching via event delegation (single listener, survives re-renders)
        container.addEventListener('click', function(e) {
            const tab = e.target.closest('.persona-tab');
            if (!tab) return;

            const targetPersona = tab.getAttribute('data-persona');

            container.querySelectorAll('.persona-tab').forEach(t => t.classList.remove('active'));
            container.querySelectorAll('.persona-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            container.querySelector(`.persona-content[data-persona="${targetPersona}"]`)?.classList.add('active');
        });
    }

    async function renderMarkdownPageLayout(content, container) {
        const cssClass = slugify(content.title) + '-page';
        container.innerHTML = `
            <div class="container ${cssClass}">
                <h1>${content.title}</h1>
                ${parseMarkdownToHtml(content.body)}
            </div>
        `;
    }

    // Splits Step 3 content into collapsible sub-sections for each rating level
    // (Below/Meets/Exceeds) plus the intro and note paragraphs.
    function renderRatingSubSections(markdown) {
        const parts = markdown.split(/^(?=### )/m);
        let html = '';
        for (const part of parts) {
            if (part.startsWith('### ')) {
                const nl = part.indexOf('\n');
                const title = part.substring(4, nl).trim();
                const body = part.substring(nl + 1).trim();
                html += `
                    <div class="g-sa-collapsible collapsed">
                        <button class="g-sa-collapsible-btn">
                            <span>${title}</span>
                            <span class="g-sa-collapsible-icon"></span>
                        </button>
                        <div class="g-sa-collapsible-body">${parseMarkdownToHtml(body)}</div>
                    </div>
                `;
            } else {
                html += parseMarkdownToHtml(part.trim());
            }
        }
        return html;
    }

    async function renderSelfAssessmentLayout(content, container) {
        const body = content.body;

        // Split on ## headers (lookahead keeps ## attached to each part)
        const rawParts = body.split(/^(?=## )/m);
        const introPart = rawParts[0].trim();

        const allSections = rawParts.slice(1).map(part => {
            const nl = part.indexOf('\n');
            return {
                title: part.substring(3, nl).trim(),   // skip "## "
                content: part.substring(nl + 1).trim()
            };
        });

        const growthSection         = allSections.find(s => s.title === 'Growth Is Self-Directed');
        const howItWorksSection     = allSections.find(s => s.title === 'How This Process Works');
        const beforeYouBeginSection = allSections.find(s => s.title === 'Before You Begin');
        const stepSections          = allSections.filter(s => /^Step \d+:/.test(s.title));
        const commonTrapsSection    = allSections.find(s => s.title === 'Common Traps');
        const keyTruthsSection      = allSections.find(s => s.title === 'Key Truths');

        // Pre-load calibration content
        const calibrationContent = await loadContent('calibration-examples');

        // Build step body HTML for each step
        const stepBodies = stepSections.map(step => {
            if (step.content.includes('<!-- calibration-insert -->')) {
                const [before] = step.content.split('<!-- calibration-insert -->');
                // Split rating criteria into collapsible sub-sections
                let html = renderRatingSubSections(before.trim());
                // Wrap calibration examples in a collapsible
                if (calibrationContent) {
                    html += `
                        <div class="g-sa-collapsible collapsed">
                            <button class="g-sa-collapsible-btn">
                                <span>Calibration Examples — see what each rating looks like in practice</span>
                                <span class="g-sa-collapsible-icon"></span>
                            </button>
                            <div class="g-sa-collapsible-body">${renderCalibrationExamples(calibrationContent)}</div>
                        </div>
                    `;
                }
                return html;
            }
            return parseMarkdownToHtml(step.content);
        });

        // Before you begin collapsible content
        const beforeYouBeginParts = [
            growthSection         ? '## ' + growthSection.title         + '\n\n' + growthSection.content         : '',
            howItWorksSection     ? '## ' + howItWorksSection.title     + '\n\n' + howItWorksSection.content     : '',
            beforeYouBeginSection ? '## ' + beforeYouBeginSection.title + '\n\n' + beforeYouBeginSection.content : ''
        ].filter(Boolean).join('\n\n');

        // Key Truths HTML
        const keyTruthsHtml = keyTruthsSection
            ? `<ul class="key-truths-list">${
                parseListItems(keyTruthsSection.content.replace(/<!--\s*key-truths\s*-->/g, '').trim())
                    .map(item => `<li>${parseInlineMarkdown(item)}</li>`)
                    .join('')
              }</ul>`
            : '';

        // Sidebar + content panel layout
        container.innerHTML = `
            <div class="g-sidebar-layout">
                <aside class="g-sidebar">
                    <div class="g-sidebar-inner">
                        <h1 class="g-sidebar-title">${content.title}</h1>
                        <p class="g-sidebar-intro">${parseInlineMarkdown(introPart)}</p>

                        <nav class="g-sa-step-nav">
                            ${beforeYouBeginParts ? `
                            <button class="g-sa-nav-btn g-sa-ref-btn active" data-ref="before-you-begin">
                                <span class="g-sa-nav-label">Before you begin</span>
                            </button>
                            <div class="g-sa-nav-divider"></div>
                            ` : ''}
                            ${stepSections.map((step, i) => {
                                const label = step.title.replace(/^Step \d+:\s*/, '');
                                return `
                                    <button class="g-sa-nav-btn" data-step="${i}">
                                        <span class="g-sa-nav-num">${i + 1}</span>
                                        <span class="g-sa-nav-label">${label}</span>
                                    </button>
                                `;
                            }).join('')}
                        </nav>

                        <div class="g-sidebar-footer">
                            ${commonTrapsSection ? `
                            <button class="g-sa-nav-btn g-sa-ref-btn" data-ref="common-traps">
                                <span class="g-sa-nav-label">Common Traps</span>
                            </button>
                            ` : ''}
                            ${keyTruthsSection ? `
                            <button class="g-sa-nav-btn g-sa-ref-btn" data-ref="key-truths">
                                <span class="g-sa-nav-label">Key Truths</span>
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </aside>

                <div class="g-sidebar-content">
                    ${stepSections.map((step, i) => {
                        const stepTitle = step.title.replace(/^Step \d+:\s*/, '');
                        const nextStep = stepSections[i + 1];
                        const nextTitle = nextStep ? nextStep.title.replace(/^Step \d+:\s*/, '') : null;
                        return `
                            <div class="g-sa-content-step" data-step="${i}">
                                <h2 class="g-sa-content-step-title">Step ${i + 1}: ${stepTitle}</h2>
                                ${stepBodies[i]}
                                ${nextTitle ? `
                                <div class="g-sa-step-footer">
                                    <button class="g-sa-next-btn" data-next="${i + 1}">
                                        Next: ${nextTitle} &rarr;
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                    ${beforeYouBeginParts ? `
                    <div class="g-sa-content-step active" data-ref="before-you-begin">
                        <h2 class="g-sa-content-step-title">Before You Begin</h2>
                        ${parseMarkdownToHtml(beforeYouBeginParts)}
                    </div>
                    ` : ''}
                    ${commonTrapsSection ? `
                    <div class="g-sa-content-step" data-ref="common-traps">
                        <h2 class="g-sa-content-step-title">Common Traps</h2>
                        ${parseMarkdownToHtml(commonTrapsSection.content)}
                    </div>
                    ` : ''}
                    ${keyTruthsSection ? `
                    <div class="g-sa-content-step" data-ref="key-truths">
                        <h2 class="g-sa-content-step-title">Key Truths</h2>
                        ${keyTruthsHtml}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        function setActiveStep(idx) {
            // Clear all button states (both step and ref buttons)
            container.querySelectorAll('.g-sa-nav-btn').forEach(btn => {
                btn.classList.remove('active', 'done');
            });
            // Set step button states (only numbered buttons, not ref buttons)
            const stepBtns = container.querySelectorAll('.g-sa-nav-btn[data-step]');
            stepBtns.forEach((btn, i) => {
                btn.classList.toggle('active', i === idx);
                btn.classList.toggle('done', i < idx);
            });
            // Switch content panel
            container.querySelectorAll('.g-sa-content-step').forEach(step => {
                step.classList.remove('active');
            });
            const steps = container.querySelectorAll('.g-sa-content-step[data-step]');
            if (steps[idx]) steps[idx].classList.add('active');
        }

        function showRefPanel(refId) {
            // Deselect all step nav buttons
            container.querySelectorAll('.g-sa-nav-btn').forEach(btn => btn.classList.remove('active'));
            // Highlight the ref button
            container.querySelectorAll('.g-sa-ref-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.ref === refId);
            });
            // Hide all content steps, show the ref panel
            container.querySelectorAll('.g-sa-content-step').forEach(step => {
                step.classList.toggle('active', step.dataset.ref === refId);
            });
        }

        // Event delegation
        container.addEventListener('click', function(e) {
            // Sidebar ref buttons (Common Traps, Key Truths)
            const refBtn = e.target.closest('.g-sa-ref-btn');
            if (refBtn) {
                showRefPanel(refBtn.dataset.ref);
                container.querySelector('.g-sidebar-content').scrollTop = 0;
                return;
            }

            // Sidebar step nav button
            const navBtn = e.target.closest('.g-sa-nav-btn');
            if (navBtn) {
                const idx = parseInt(navBtn.dataset.step);
                setActiveStep(idx);
                container.querySelector('.g-sidebar-content').scrollTop = 0;
                return;
            }

            // "Next step" button
            const nextBtn = e.target.closest('.g-sa-next-btn');
            if (nextBtn) {
                const idx = parseInt(nextBtn.dataset.next);
                setActiveStep(idx);
                container.querySelector('.g-sidebar-content').scrollTop = 0;
                return;
            }

            // Collapsible sections
            const collBtn = e.target.closest('.g-sa-collapsible-btn');
            if (collBtn) {
                collBtn.closest('.g-sa-collapsible').classList.toggle('collapsed');
                return;
            }

            // Calibration persona tabs
            const tab = e.target.closest('.persona-tab');
            if (!tab) return;
            const targetPersona = tab.getAttribute('data-persona');
            container.querySelectorAll('.persona-tab').forEach(t => t.classList.remove('active'));
            container.querySelectorAll('.persona-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            container.querySelector(`.persona-content[data-persona="${targetPersona}"]`)?.classList.add('active');
        });
    }

    function renderCalibrationExamples(calibrationContent) {
        const sections = parseSections(calibrationContent.body);
        const personaSections = {};

        for (const section of sections) {
            if (section.title.endsWith(' Calibration Examples')) {
                const personaName = section.title.replace(' Calibration Examples', '').toLowerCase();
                personaSections[personaName] = parseCalibrationSection(section.content);
            }
        }

        let html = `
            <section class="calibration-section">
                <h2 id="calibration-examples">Calibration Examples</h2>
                <p class="calibration-disclaimer">These are <strong>illustrative examples</strong>, not exact criteria. Use them to calibrate your thinking about what each rating level looks like in practice. Your situation will differ — what matters is whether the pattern of impact feels similar, not whether the details match.</p>

                <div class="persona-tabs">
                    ${manifest.personas.map((pId, index) => {
                        const persona = manifest.pages[`persona-${pId}`];
                        return `<button class="persona-tab ${index === 0 ? 'active' : ''}" data-persona="${pId}">${persona.name}</button>`;
                    }).join('')}
                </div>

                <div class="persona-contents">
        `;

        for (let i = 0; i < manifest.personas.length; i++) {
            const pId = manifest.personas[i];
            const persona = manifest.pages[`persona-${pId}`];
            const examples = personaSections[pId];

            if (persona && examples) {
                const borderStyle = getPersonaBorderStyle(pId, persona.color);
                const borderClass = getPersonaBorderClass(pId);
                html += `
                    <div class="persona-content ${i === 0 ? 'active' : ''}" data-persona="${pId}">
                        <div class="calibration-card ${borderClass}" style="${borderStyle}">
                            <h3>${persona.name}</h3>

                            ${examples.prompts.length > 0 ? `
                            <div class="calibration-prompts">
                                <h4>Reflection Prompts</h4>
                                <ul>
                                    ${examples.prompts.map(p => `<li>${parseInlineMarkdown(p)}</li>`).join('')}
                                </ul>
                            </div>
                            ` : ''}

                            <div class="calibration-levels">
                                ${renderCalibrationLevel('Below Expectations', examples.below, 'below')}
                                ${renderCalibrationLevel('Meets Expectations', examples.meets, 'meets')}
                                ${renderCalibrationLevel('Exceeds Expectations', examples.exceeds, 'exceeds')}
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        html += `</div></section>`;
        return html;
    }

    function parseCalibrationSection(content) {
        const result = {
            prompts: [],
            below: [],
            meets: [],
            exceeds: []
        };

        // Split by H3 headings
        const h3Regex = /^### (.+)$/gm;
        const parts = content.split(h3Regex);

        let currentSection = null;
        for (let i = 1; i < parts.length; i += 2) {
            const heading = parts[i]?.trim();
            const body = parts[i + 1]?.trim() || '';

            if (heading === 'Reflection Prompts') {
                result.prompts = parseListItems(body);
            } else if (heading === 'Below Expectations') {
                result.below = parseExamples(body);
            } else if (heading === 'Meets Expectations') {
                result.meets = parseExamples(body);
            } else if (heading === 'Exceeds Expectations') {
                result.exceeds = parseExamples(body);
            }
        }

        return result;
    }

    function parseExamples(content) {
        const examples = [];
        const exampleRegex = /\*\*Example \d+:\*\*\s*([\s\S]*?)(?=\*\*Example \d+:\*\*|$)/g;
        let match;
        while ((match = exampleRegex.exec(content)) !== null) {
            examples.push(match[1].trim());
        }
        return examples;
    }

    function renderCalibrationLevel(title, examples, levelClass) {
        if (!examples || examples.length === 0) return '';
        return `
            <div class="calibration-level calibration-level-${levelClass}">
                <h4>${title}</h4>
                ${examples.map((ex, i) => `
                    <div class="calibration-example">
                        <span class="calibration-example-label">Example ${i + 1}</span>
                        <p>${parseInlineMarkdown(ex)}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async function renderQuickReferenceLayout(content, container) {
        // Get intro text (before first H2)
        const introText = getIntroText(content.body);

        // Parse all H2 sections
        const sections = parseSections(content.body);

        // Categorize sections: persona anti-patterns, known special sections, and generic sections
        const personaSections = {};
        const genericSections = [];
        let universalWarnings = null;
        let finalSelfCheck = null;

        for (const section of sections) {
            if (section.title.endsWith(' Anti-Patterns')) {
                // Extract persona name (e.g., "Explorer Anti-Patterns" -> "explorer")
                const personaName = section.title.replace(' Anti-Patterns', '').toLowerCase();
                personaSections[personaName] = parseAntiPatternSection(section.content);
            } else if (section.title === 'Universal Warning Signs') {
                universalWarnings = section.content;
            } else if (section.title === 'Final Self-Check') {
                finalSelfCheck = section.content;
            } else {
                // Generic sections render as regular markdown before the tabs
                genericSections.push(section);
            }
        }

        let html = `
            <div class="container anti-patterns-page">
                <h1>${content.title}</h1>
                <p class="page-intro">${parseInlineMarkdown(introText)}</p>
        `;

        // Render generic sections (FAQ, intro text, etc.) before the tabs
        for (const section of genericSections) {
            const sectionId = slugify(section.title);
            // Split content on ### headers and render as accordions
            const parts = section.content.split(/^(?=### )/m);
            let sectionHtml = '';
            for (const part of parts) {
                if (part.startsWith('### ')) {
                    const nl = part.indexOf('\n');
                    const title = part.substring(4, nl).trim();
                    const body = part.substring(nl + 1).trim();
                    sectionHtml += `
                        <div class="g-sa-collapsible collapsed">
                            <button class="g-sa-collapsible-btn">
                                <span>${title}</span>
                                <span class="g-sa-collapsible-icon"></span>
                            </button>
                            <div class="g-sa-collapsible-body">${parseMarkdownToHtml(body)}</div>
                        </div>
                    `;
                } else if (part.trim()) {
                    sectionHtml += parseMarkdownToHtml(part.trim());
                }
            }
            html += `
                <section class="reference-section">
                    ${renderHeading(2, section.title, sectionId)}
                    ${sectionHtml}
                </section>
            `;
        }

        html += `
                <div class="persona-tabs">
                    ${manifest.personas.map((pId, index) => {
                        const persona = manifest.pages[`persona-${pId}`];
                        return `<button class="persona-tab ${index === 0 ? 'active' : ''}" data-persona="${pId}">${persona.name}</button>`;
                    }).join('')}
                </div>

                <div class="persona-contents">
        `;

        // Render each persona's anti-patterns
        for (let i = 0; i < manifest.personas.length; i++) {
            const pId = manifest.personas[i];
            const persona = manifest.pages[`persona-${pId}`];
            const antiPatterns = personaSections[pId];

            if (persona && antiPatterns) {
                const apBorderStyle = getPersonaBorderStyle(pId, persona.color);
                const apBorderClass = getPersonaBorderClass(pId);
                html += `
                    <div class="persona-content ${i === 0 ? 'active' : ''}" data-persona="${pId}">
                        <div class="anti-pattern-card ${apBorderClass}" style="${apBorderStyle}">
                            <div class="anti-pattern-header">
                                <h3>${persona.name}</h3>
                                <span class="anti-pattern-motto">${antiPatterns.motto}</span>
                            </div>

                            <div class="anti-pattern-grid">
                                <div class="anti-pattern-section">
                                    <h4>⚠️ Signs expectations may be too high</h4>
                                    <ul>
                                        ${antiPatterns.signs.map(s => `<li>${parseInlineMarkdown(s)}</li>`).join('')}
                                    </ul>
                                </div>

                                <div class="anti-pattern-section red-flags">
                                    <h4>🚩 Red flags</h4>
                                    <ul>
                                        ${antiPatterns.redFlags.map(r => `<li>${parseInlineMarkdown(r)}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>

                            <div class="anti-pattern-signal">
                                <strong>Signal:</strong> ${parseInlineMarkdown(antiPatterns.signal)}
                            </div>
                        </div>
                    </div>
                `;
            }
        }

        html += `</div>`;

        // Add universal sections
        if (universalWarnings) {
            html += `
                <section class="universal-warnings">
                    <h2>Universal Warning Signs</h2>
                    ${parseMarkdownToHtml(universalWarnings)}
                </section>
            `;
        }

        if (finalSelfCheck) {
            html += `
                <section class="final-self-check">
                    <h2>Final Self-Check</h2>
                    ${parseMarkdownToHtml(finalSelfCheck)}
                </section>
            `;
        }

        html += `</div>`;
        container.innerHTML = html;

        // Event delegation (single listener, survives re-renders)
        container.addEventListener('click', function(e) {
            // Accordion toggles
            const collBtn = e.target.closest('.g-sa-collapsible-btn');
            if (collBtn) {
                collBtn.closest('.g-sa-collapsible').classList.toggle('collapsed');
                return;
            }

            // Tab switching
            const tab = e.target.closest('.persona-tab');
            if (!tab) return;

            const targetPersona = tab.getAttribute('data-persona');

            container.querySelectorAll('.persona-tab').forEach(t => t.classList.remove('active'));
            container.querySelectorAll('.persona-content').forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            container.querySelector(`.persona-content[data-persona="${targetPersona}"]`)?.classList.add('active');
        });
    }

    function parseAntiPatternSection(content) {
        const result = {
            motto: '',
            signs: [],
            redFlags: [],
            signal: ''
        };

        // Extract motto
        const mottoMatch = content.match(/\*\*Motto:\*\*\s*"([^"]+)"/);
        if (mottoMatch) {
            result.motto = mottoMatch[1];
        }

        // Split by H3 sections
        const h3Regex = /^### (.+)$/gm;
        const parts = content.split(h3Regex);

        for (let i = 1; i < parts.length; i += 2) {
            const heading = parts[i]?.trim();
            const sectionContent = parts[i + 1];

            if (heading?.includes('Signs expectations may be too high')) {
                result.signs = parseListItems(sectionContent);
            } else if (heading?.includes('Red flags')) {
                result.redFlags = parseListItems(sectionContent);
            }
        }

        // Extract signal
        const signalMatch = content.match(/\*\*Signal:\*\*\s*(.+?)(?:\n|$)/);
        if (signalMatch) {
            result.signal = signalMatch[1].trim();
        }

        return result;
    }

    // ============================================
    // Content Extraction Helpers
    // ============================================

    function parseSections(body) {
        const sections = [];
        const h2Regex = /^## (.+)$/gm;
        const parts = body.split(h2Regex);

        for (let i = 1; i < parts.length; i += 2) {
            const title = parts[i]?.trim();
            const content = parts[i + 1];
            if (title && content) {
                // Extract annotation from section content (e.g., <!-- cards --> or <!-- diagram: foo -->)
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
        const h3Regex = /^### (.+)$/gm;
        const parts = content.split(h3Regex);

        for (let i = 1; i < parts.length; i += 2) {
            const title = parts[i]?.trim();
            const body = parts[i + 1]?.trim();
            if (title && body) {
                // Get first paragraph only
                const firstPara = body.split('\n\n')[0].replace(/\n/g, ' ').trim();
                cards.push({ title, description: firstPara });
            }
        }
        return cards;
    }

    function parseListItems(content) {
        const items = [];
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('- ')) {
                items.push(trimmed.substring(2).trim());
            }
        }
        return items;
    }

    function parseParagraphs(content) {
        const paragraphs = [];
        let current = '';

        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('<!--')) {
                if (current) {
                    paragraphs.push(current);
                    current = '';
                }
            } else if (!trimmed.startsWith('- ')) {
                current += (current ? ' ' : '') + trimmed;
            }
        }
        if (current) paragraphs.push(current);

        return paragraphs;
    }

    function renderUsageSection(section) {
        const items = parseListItems(section.content);

        // Find highlight (paragraph after list, before subsections)
        let highlight = '';
        const lines = section.content.split('\n');
        let inList = false;
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('- ')) {
                inList = true;
            } else if (inList && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('<!--')) {
                highlight = trimmed;
                break;
            }
        }

        // Parse subsections
        const h3Regex = /^### (.+)$/gm;
        const parts = section.content.split(h3Regex);
        const subsections = [];

        for (let i = 1; i < parts.length; i += 2) {
            const heading = parts[i]?.trim();
            const content = parts[i + 1]?.trim();
            if (heading && content) {
                subsections.push({ heading, content });
            }
        }

        let html = `
            <section class="usage-section">
                <h2>${section.title}</h2>
                <ul class="usage-list">
                    ${items.map(item => `<li>${parseInlineMarkdown(item)}</li>`).join('')}
                </ul>
                ${highlight ? `<p class="highlight-box">${parseInlineMarkdown(highlight)}</p>` : ''}
        `;

        for (const sub of subsections) {
            const sectionId = slugify(sub.heading);
            html += `
                <div class="usage-subsection" id="${sectionId}">
                    <h3>${sub.heading}</h3>
                    ${parseMarkdownToHtml(sub.content)}
                </div>
            `;
        }

        html += `</section>`;
        return html;
    }

    function getIntroText(body) {
        // Get text before first ## or annotation
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
        if (!match) return '';
        return match[1].trim();
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
        if (!section) return [];
        return parseListItems(section);
    }

    function extractCapabilitySections(body) {
        const sections = {};
        const h1Regex = /^# (.+)$/gm;
        const parts = body.split(h1Regex);

        for (let i = 1; i < parts.length; i += 2) {
            const capName = parts[i]?.trim();
            const content = parts[i + 1];

            if (capName && content) {
                const expectations = [];
                const selfAssessment = [];

                // Extract Expectations
                const expMatch = content.match(/## Expectations\s*\n([\s\S]*?)(?=\n## |$)/);
                if (expMatch) {
                    const lines = expMatch[1].split('\n');
                    for (const line of lines) {
                        if (line.trim().startsWith('- ')) {
                            expectations.push(line.trim().substring(2));
                        }
                    }
                }

                // Extract Self-Assessment
                const selfMatch = content.match(/## Self-Assessment\s*\n([\s\S]*?)(?=\n---|$)/);
                if (selfMatch) {
                    const lines = selfMatch[1].split('\n');
                    for (const line of lines) {
                        if (line.trim().startsWith('- ')) {
                            selfAssessment.push(line.trim().substring(2));
                        }
                    }
                }

                sections[capName] = { expectations, selfAssessment };
            }
        }

        return sections;
    }

    // ============================================
    // SVG Diagrams (Data-Driven)
    // ============================================

    // Get theme-aware colors for SVG rendering (cached to avoid reflows)
    function getSvgColors() {
        if (svgColorsCache) {
            return svgColorsCache;
        }
        const styles = getComputedStyle(document.documentElement);
        svgColorsCache = {
            text: styles.getPropertyValue('--color-text').trim(),
            textSecondary: styles.getPropertyValue('--color-text-secondary').trim(),
            textMuted: styles.getPropertyValue('--color-text-muted').trim(),
            border: styles.getPropertyValue('--color-border').trim(),
            accent: styles.getPropertyValue('--color-accent').trim(),
            explorer: styles.getPropertyValue('--color-explorer').trim(),
            artisan: styles.getPropertyValue('--color-artisan').trim(),
            catalyst: styles.getPropertyValue('--color-catalyst').trim(),
            multiplier: styles.getPropertyValue('--color-multiplier').trim(),
            strategist: styles.getPropertyValue('--color-strategist').trim(),
            amplifier: styles.getPropertyValue('--color-amplifier').trim(),
            pioneer: styles.getPropertyValue('--color-pioneer').trim()
        };
        return svgColorsCache;
    }

    function getPersonaColor(personaId) {
        const colors = getSvgColors();
        return colors[personaId] || '#888';
    }

    // Check if a persona is on the IC track
    function isIcTrack(personaId) {
        return personaId === 'amplifier' || personaId === 'pioneer';
    }

    // Get border style for persona (inline style for TL, class-based for IC)
    function getPersonaBorderStyle(personaId, color) {
        if (isIcTrack(personaId)) {
            return ''; // IC track uses CSS class for diagonal stripes
        }
        return `border-left: 4px solid ${color};`;
    }

    // Get border class for persona
    function getPersonaBorderClass(personaId) {
        if (isIcTrack(personaId)) {
            return `ic-track-border persona-${personaId}-border`;
        }
        return '';
    }

    // Check if a persona is on the Tech Leadership track
    function isTechLeadershipTrack(personaId) {
        return personaId === 'multiplier' || personaId === 'strategist';
    }

    // Get scope label with track suffix for forked personas
    function getScopeWithTrack(personaId, scope) {
        if (isIcTrack(personaId)) {
            return `${scope} (IC Track)`;
        }
        if (isTechLeadershipTrack(personaId)) {
            return `${scope} (TL Track)`;
        }
        return scope; // Foundation personas don't need a track label
    }

    function renderCapabilityRadar() {
        const svg = document.getElementById('capability-radar');
        if (!svg || svg.querySelector('circle')) return;

        const colors = getSvgColors();
        const cx = 250;
        const cy = 200;
        const maxRadius = 150;
        const levels = 5;

        // Build labels from manifest
        const capabilities = manifest.capabilities.map(id => manifest.pages[`capability-${id}`]);
        const angleStep = 360 / capabilities.length;

        const labels = capabilities.map((cap, i) => ({
            name: cap.name.replace(' & ', '\n& ').replace('Mentorship & Talent Growth', 'Mentorship &\nTalent Growth'),
            angle: -90 + (i * angleStep)
        }));

        let html = '';

        // Draw level circles
        for (let i = 1; i <= levels; i++) {
            const r = (maxRadius / levels) * i;
            html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors.border}" stroke-width="1"/>`;
        }

        // Draw axes and labels
        labels.forEach((label, index) => {
            const angleRad = (label.angle * Math.PI) / 180;
            const x2 = cx + maxRadius * Math.cos(angleRad);
            const y2 = cy + maxRadius * Math.sin(angleRad);

            html += `<line x1="${cx}" y1="${cy}" x2="${x2}" y2="${y2}" stroke="${colors.border}" stroke-width="1"/>`;

            const labelX = cx + (maxRadius + 35) * Math.cos(angleRad);
            const labelY = cy + (maxRadius + 35) * Math.sin(angleRad);

            const lines = label.name.split('\n');
            const lineHeight = 14;
            const startY = labelY - ((lines.length - 1) * lineHeight) / 2;

            lines.forEach((line, lineIndex) => {
                html += `<text x="${labelX}" y="${startY + lineIndex * lineHeight}"
                    text-anchor="middle" font-size="12" fill="${colors.textSecondary}">${line}</text>`;
            });
        });

        // Sample polygon
        const sampleValues = [0.7, 0.5, 0.65, 0.4, 0.55];
        let points = '';

        labels.forEach((label, index) => {
            const angleRad = (label.angle * Math.PI) / 180;
            const r = maxRadius * sampleValues[index];
            const x = cx + r * Math.cos(angleRad);
            const y = cy + r * Math.sin(angleRad);
            points += `${x},${y} `;
        });

        html += `<polygon points="${points.trim()}" fill="${colors.accent}" fill-opacity="0.15" stroke="${colors.accent}" stroke-width="2"/>`;

        labels.forEach((label, index) => {
            const angleRad = (label.angle * Math.PI) / 180;
            const r = maxRadius * sampleValues[index];
            const x = cx + r * Math.cos(angleRad);
            const y = cy + r * Math.sin(angleRad);
            html += `<circle cx="${x}" cy="${y}" r="5" fill="${colors.accent}"/>`;
        });

        svg.innerHTML = html;
    }

    function renderImpactRings() {
        const svg = document.getElementById('impact-rings');
        if (!svg || svg.querySelector('circle')) return;

        const colors = getSvgColors();
        const cx = 200;
        const cy = 200;

        // Foundation personas (shared path) - these get full rings
        const foundationIds = ['explorer', 'artisan', 'catalyst'];
        // Post-fork personas - shown as paired labels
        const teamLevelPair = { mgmt: 'multiplier', ic: 'amplifier' };
        const orgLevelPair = { mgmt: 'strategist', ic: 'pioneer' };

        const baseRadius = 32;
        const radiusStep = 24;

        // Build foundation rings
        const foundationRings = foundationIds.map((id, i) => {
            const p = manifest.pages[`persona-${id}`];
            return {
                id: id,
                name: p.name,
                scope: p.scope.replace(' impact', ''),
                radius: baseRadius + (i * radiusStep),
                color: getPersonaColor(id)
            };
        });

        // Build post-fork ring data (rings 4 and 5)
        const teamLevelRadius = baseRadius + (3 * radiusStep);
        const orgLevelRadius = baseRadius + (4 * radiusStep);

        const teamMgmt = manifest.pages[`persona-${teamLevelPair.mgmt}`];
        const teamIc = manifest.pages[`persona-${teamLevelPair.ic}`];
        const orgMgmt = manifest.pages[`persona-${orgLevelPair.mgmt}`];
        const orgIc = manifest.pages[`persona-${orgLevelPair.ic}`];

        let html = '';

        // Title
        html += `<text x="290" y="28" text-anchor="middle" font-size="13" fill="${colors.text}" font-weight="600" font-family="Inter, sans-serif">
            SAHAJ GROWTH PATHS
        </text>`;
        html += `<text x="290" y="46" text-anchor="middle" font-size="11" fill="${colors.textMuted}" font-family="Inter, sans-serif">
            Foundation → Two Tracks
        </text>`;

        // Draw outer rings for the forked levels (using blended/neutral colors)
        // Team-level ring (Multiplier / Amplifier)
        const teamColor = getPersonaColor(teamLevelPair.mgmt);
        html += `<circle cx="${cx}" cy="${cy}" r="${teamLevelRadius}"
            fill="${teamColor}" fill-opacity="0.08"
            stroke="${teamColor}" stroke-width="2" stroke-dasharray="8,4"/>`;

        // Org-level ring (Strategist / Pioneer)
        const orgColor = getPersonaColor(orgLevelPair.mgmt);
        html += `<circle cx="${cx}" cy="${cy}" r="${orgLevelRadius}"
            fill="${orgColor}" fill-opacity="0.08"
            stroke="${orgColor}" stroke-width="2" stroke-dasharray="8,4"/>`;

        // Draw foundation rings (solid, inside-out)
        for (let i = foundationRings.length - 1; i >= 0; i--) {
            const ring = foundationRings[i];
            html += `<circle cx="${cx}" cy="${cy}" r="${ring.radius}"
                fill="${ring.color}" fill-opacity="0.12"
                stroke="${ring.color}" stroke-width="2.5"/>`;
        }

        // Labels section
        const labelX = 400;

        // Foundation labels (rings 1-3)
        const foundationLabelYPositions = [100, 145, 190];
        foundationRings.forEach((ring, index) => {
            const ringX = cx + ring.radius;
            const ringY = cy;
            const labelY = foundationLabelYPositions[index];
            const bendX = 350;

            html += `<path d="M ${ringX} ${ringY} L ${bendX} ${ringY} L ${bendX} ${labelY} L ${labelX - 8} ${labelY}"
                fill="none" stroke="${ring.color}" stroke-width="1.5" stroke-opacity="0.5"/>`;
            html += `<circle cx="${ringX}" cy="${ringY}" r="4" fill="${ring.color}"/>`;
            html += `<circle cx="${labelX - 8}" cy="${labelY}" r="3" fill="${ring.color}"/>`;
            html += `<text x="${labelX}" y="${labelY - 5}" text-anchor="start" font-size="13" fill="${ring.color}" font-weight="600" font-family="Inter, sans-serif">${ring.name}</text>`;
            html += `<text x="${labelX}" y="${labelY + 10}" text-anchor="start" font-size="10" fill="${colors.textMuted}" font-family="Inter, sans-serif">${ring.scope}</text>`;
        });

        // Team-level label (Multiplier / Amplifier)
        const teamLabelY = 240;
        const teamRingX = cx + teamLevelRadius;
        html += `<path d="M ${teamRingX} ${cy} L 350 ${cy} L 350 ${teamLabelY} L ${labelX - 8} ${teamLabelY}"
            fill="none" stroke="${teamColor}" stroke-width="1.5" stroke-opacity="0.5"/>`;
        html += `<circle cx="${teamRingX}" cy="${cy}" r="4" fill="${teamColor}"/>`;
        html += `<circle cx="${labelX - 8}" cy="${teamLabelY}" r="3" fill="${teamColor}"/>`;
        html += `<text x="${labelX}" y="${teamLabelY - 5}" text-anchor="start" font-size="13" font-weight="600" font-family="Inter, sans-serif">
            <tspan fill="${getPersonaColor(teamLevelPair.mgmt)}">${teamMgmt.name}</tspan>
            <tspan fill="${colors.textMuted}"> / </tspan>
            <tspan fill="${getPersonaColor(teamLevelPair.ic)}">${teamIc.name}</tspan>
        </text>`;
        html += `<text x="${labelX}" y="${teamLabelY + 10}" text-anchor="start" font-size="10" fill="${colors.textMuted}" font-family="Inter, sans-serif">Team-level</text>`;

        // Org-level label (Strategist / Pioneer)
        const orgLabelY = 290;
        const orgRingX = cx + orgLevelRadius;
        html += `<path d="M ${orgRingX} ${cy} L 350 ${cy} L 350 ${orgLabelY} L ${labelX - 8} ${orgLabelY}"
            fill="none" stroke="${orgColor}" stroke-width="1.5" stroke-opacity="0.5"/>`;
        html += `<circle cx="${orgRingX}" cy="${cy}" r="4" fill="${orgColor}"/>`;
        html += `<circle cx="${labelX - 8}" cy="${orgLabelY}" r="3" fill="${orgColor}"/>`;
        html += `<text x="${labelX}" y="${orgLabelY - 5}" text-anchor="start" font-size="13" font-weight="600" font-family="Inter, sans-serif">
            <tspan fill="${getPersonaColor(orgLevelPair.mgmt)}">${orgMgmt.name}</tspan>
            <tspan fill="${colors.textMuted}"> / </tspan>
            <tspan fill="${getPersonaColor(orgLevelPair.ic)}">${orgIc.name}</tspan>
        </text>`;
        html += `<text x="${labelX}" y="${orgLabelY + 10}" text-anchor="start" font-size="10" fill="${colors.textMuted}" font-family="Inter, sans-serif">Org-level</text>`;

        // Legend for tracks
        html += `<text x="290" y="345" text-anchor="middle" font-size="10" fill="${colors.textMuted}" font-family="Inter, sans-serif">
            <tspan fill="${getPersonaColor('multiplier')}">TL Track</tspan>
            <tspan> / </tspan>
            <tspan fill="${getPersonaColor('amplifier')}">IC Track</tspan>
        </text>`;

        // Footer
        html += `<text x="290" y="365" text-anchor="middle" font-size="10" fill="${colors.textMuted}" font-style="italic" font-family="Inter, sans-serif">
            Two paths to scale impact. Both equally valued.
        </text>`;

        svg.innerHTML = html;
    }

    function refreshSvgDiagrams() {
        // Invalidate color cache so new theme colors are picked up
        svgColorsCache = null;

        const radar = document.getElementById('capability-radar');
        if (radar) {
            radar.innerHTML = '';
            renderCapabilityRadar();
        }

        const rings = document.getElementById('impact-rings');
        if (rings) {
            rings.innerHTML = '';
            renderImpactRings();
        }
    }

    // ============================================
    // Dark Mode
    // ============================================

    function initDarkMode() {
        const themeToggle = document.querySelector('.theme-toggle');
        if (!themeToggle) return;

        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }

        themeToggle.addEventListener('click', function() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            if (newTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }

            localStorage.setItem('theme', newTheme);

            // Re-render SVG diagrams with new theme colors
            refreshSvgDiagrams();
        });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
            const savedTheme = localStorage.getItem('theme');
            if (!savedTheme) {
                if (e.matches) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                }
                // Re-render SVG diagrams with new theme colors
                refreshSvgDiagrams();
            }
        });
    }

    // ============================================
    // Initialize
    // ============================================

    document.addEventListener('DOMContentLoaded', init);

})();
