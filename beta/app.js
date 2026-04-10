// The Field Guide to Growth & Impact - Main Application
// Content-driven architecture with runtime markdown parsing

(function() {
    'use strict';

    // ============================================
    // Beta configuration
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
            const response = await fetch(BASE_PATH + pageInfo.file + versionParam);
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

        // Update nav links
        document.querySelectorAll('.nav-links a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-page') === pageId) {
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
            }
        }

        targetPage.classList.add('active');

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

    async function renderPage(pageId, container) {
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
        let html = `
            <div class="hero">
                <h1>${content.title}</h1>
                <p class="tagline">${content.tagline}</p>
            </div>
            <div class="container">
        `;

        // Parse sections from body (now includes annotation info)
        const sections = parseSections(content.body);

        for (const section of sections) {
            const annotationType = section.annotation?.type;

            switch (annotationType) {
                case 'cards':
                    html += renderCardsSection(section);
                    break;
                case 'key-truths':
                    html += renderKeyTruthsSection(section);
                    break;
                case 'usage':
                    html += renderUsageSection(section);
                    break;
                case 'explore-cards':
                    html += renderGenericSection(section);
                    html += renderExploreCards();
                    break;
                default:
                    html += renderGenericSection(section);
            }
        }

        html += `</div>`;
        container.innerHTML = html;
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
                        <p>Understand how impact evolves from Explorer to Strategist</p>
                        <span class="arrow">→</span>
                    </a>
                    <a href="#capabilities" data-page="capabilities" class="explore-card">
                        <h3>Capability Areas</h3>
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

        const borderStyle = getPersonaBorderStyle(personaId, content.color);
        const borderClass = getPersonaBorderClass(personaId);

        let html = `
            <div class="container">
                <div class="detail-header ${borderClass}" style="${borderStyle} padding-left: var(--space-lg);">
                    <div class="persona-scope">${getScopeWithTrack(personaId, content.scope)}</div>
                    <h1>${content.name}</h1>
                    <p class="detail-subtitle">${content.tagline}</p>
                    <p class="detail-mindset">"${mindset}"</p>
                    ${trustedQuestion ? `<p class="detail-trusted-question"><strong>The question you're trusted to answer:</strong> "${trustedQuestion}"</p>` : ''}
                </div>

                <div class="impact-info">
                    <div class="impact-block">
                        <h4>Nature of Impact</h4>
                        <ul>
                            ${natureOfImpact.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    ${successLooksLike.length > 0 ? `
                    <div class="impact-block">
                        <h4>Success Looks Like</h4>
                        <ul>
                            ${successLooksLike.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                    ${explicitExpectation.length > 0 ? `
                    <div class="impact-block">
                        <h4>Explicit Expectation</h4>
                        <ul>
                            ${explicitExpectation.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>

                <h2>Expectations by Capability Area</h2>
        `;

        // Extract capability sections
        const capabilitySections = extractCapabilitySections(content.body);

        for (const capId of manifest.capabilities) {
            const cap = manifest.pages[`capability-${capId}`];
            const capSection = capabilitySections[cap.name];

            if (cap && capSection) {
                html += `
                    <div class="capability-section">
                        <h3>${cap.name}</h3>
                        <ul class="expectations-list">
                            ${capSection.expectations.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                        ${capSection.selfAssessment.length > 0 ? `
                        <div class="self-assessment">
                            <h4>Self-Assessment Prompts</h4>
                            <ul>
                                ${capSection.selfAssessment.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                        </div>
                        ` : ''}
                    </div>
                `;
            }
        }

        // Navigation links
        html += `
                <div class="nav-links-bottom">
                    ${prevPersona ? `
                    <a href="#persona-${prevPersona.id}" data-page="persona-${prevPersona.id}" class="nav-link-prev">
                        <span class="nav-link-label">Previous</span>
                        <span class="nav-link-title">${prevPersona.name}</span>
                    </a>
                    ` : '<div></div>'}
                    ${nextPersona ? `
                    <a href="#persona-${nextPersona.id}" data-page="persona-${nextPersona.id}" class="nav-link-next">
                        <span class="nav-link-label">Next</span>
                        <span class="nav-link-title">${nextPersona.name}</span>
                    </a>
                    ` : ''}
                </div>
            </div>
        `;

        container.innerHTML = html;
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
                    <p style="color: var(--color-text-secondary);">${intro}</p>
                    ${note ? `<p class="highlight-box" style="margin-top: var(--space-lg);">${note}</p>` : ''}
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

    async function renderSelfAssessmentLayout(content, container) {
        const cssClass = slugify(content.title) + '-page';

        // Split body at the calibration insert marker
        const markerIndex = content.body.indexOf('<!-- calibration-insert -->');
        let beforeMarker, afterMarker;
        if (markerIndex !== -1) {
            beforeMarker = content.body.substring(0, markerIndex);
            afterMarker = content.body.substring(markerIndex + '<!-- calibration-insert -->'.length);
        } else {
            beforeMarker = content.body;
            afterMarker = '';
        }

        // Load calibration examples
        const calibrationContent = await loadContent('calibration-examples');

        let html = `
            <div class="container ${cssClass}">
                <h1>${content.title}</h1>
                ${parseMarkdownToHtml(beforeMarker)}
        `;

        // Insert calibration examples section
        if (calibrationContent) {
            html += renderCalibrationExamples(calibrationContent);
        }

        html += parseMarkdownToHtml(afterMarker);
        html += `</div>`;
        container.innerHTML = html;

        // Tab switching via event delegation
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
            html += `
                <section class="reference-section">
                    ${renderHeading(2, section.title, sectionId)}
                    ${parseMarkdownToHtml(section.content)}
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
        return match[1].trim().replace(/\n\n/g, ' ').replace(/\n/g, ' ');
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
