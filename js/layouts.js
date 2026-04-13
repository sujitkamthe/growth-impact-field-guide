(function(G) {
    'use strict';

    // ============================================
    // Local Helpers
    // ============================================

    function renderIntentCardHtml(card) {
        return `
            <a href="#${card.link}" data-page="${card.link}" class="intent-card">
                <div class="intent-eyebrow">${G.escapeHtml(card.eyebrow)}</div>
                <h2>${G.escapeHtml(card.title)}</h2>
                <p>${G.escapeHtml(card.description)}</p>
                <span class="intent-cta">${G.escapeHtml(card.cta)} &rarr;</span>
            </a>
        `;
    }

    // Shared collapsible/accordion template. Single source of truth for markup,
    // ARIA, and initial state. Toggle handler lives in router.js.
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

    // ============================================
    // Layout Renderers
    // ============================================

    async function renderHomeLayout(content, container) {
        const primaryCards = G.parseIntentCards(content.body, 'intent-cards');
        const secondaryCards = G.parseIntentCards(content.body, 'intent-cards-secondary');

        container.innerHTML = `
            <div class="home-layout">
                <div class="hero-section">
                    <h1>${content.title}</h1>
                    <p class="hero-tagline">${content.tagline}</p>
                </div>
                <div class="intent-grid">
                    ${primaryCards.map(renderIntentCardHtml).join('')}
                </div>
                ${secondaryCards.length > 0 ? `
                <div class="intent-grid intent-grid-secondary">
                    ${secondaryCards.map(renderIntentCardHtml).join('')}
                </div>
                ` : ''}
            </div>
        `;
    }

    // ============================================
    // Virtual Page Renderers
    // ============================================

    // Quick Reference overview — card-based landing for reference sub-pages
    async function renderQuickReferenceOverview(content, container) {
        const introText = content ? G.getIntroText(content.body) : '';
        const refCards = content ? G.parseIntentCards(content.body, 'ref-cards') : [];

        container.innerHTML = `
            <div class="container reference-page-content">
                <h1>${content?.title || 'Quick Reference'}</h1>
                ${introText ? `<p class="page-intro">${G.parseInlineMarkdown(introText)}</p>` : ''}
                <div class="intent-grid ref-grid">
                    ${refCards.map(renderIntentCardHtml).join('')}
                </div>
            </div>
        `;
    }

    // About This Guide — combines What This Guide Is For, Growth Is Self-Directed,
    // How to Use This Guide, Who This Guide Is For, and What We Value from home.md
    async function renderAboutPage(content, container) {
        const sections = G.parseSections(content.body);
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
            // Strip intent-card and ref-card blocks (annotation + H3 card definitions)
            const cleanContent = section.content
                .replace(/<!--\s*(?:intent-cards|intent-cards-secondary|ref-cards)\s*-->[\s\S]*?(?=<!--|\\n## |$)/g, '')
                .replace(/<!--[^>]*-->/g, '');
            const sectionBody = renderMarkdownAsCollapsibles(cleanContent);
            html += `<section class="home-section"><h2>${section.title}</h2>${sectionBody}</section>`;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    // Common Questions — FAQ section from quick-reference.md as accordions
    async function renderCommonQuestionsPage(content, container) {
        const sections = G.parseSections(content.body);
        const faqSection = sections.find(s => s.title === 'Common Questions');

        let html = '<div class="container reference-page-content"><h1>Common Questions</h1>';

        if (faqSection) {
            html += renderMarkdownAsCollapsibles(faqSection.content);
        }

        html += '</div>';
        container.innerHTML = html;
    }

    // Anti-Patterns — sidebar layout with persona nav + warning signs + self-check
    async function renderAntiPatternsPage(content, container) {
        const sections = G.parseSections(content.body);
        const personaSections = {};
        let antiPatternsIntro = null;
        let universalWarnings = null;
        let finalSelfCheck = null;

        for (const section of sections) {
            if (section.title.endsWith(' Anti-Patterns')) {
                const personaName = section.title.replace(' Anti-Patterns', '').toLowerCase();
                personaSections[personaName] = G.parseAntiPatternSection(section.content);
            } else if (section.title === 'Anti-Patterns') {
                antiPatternsIntro = section.content;
            } else if (section.title === 'Universal Warning Signs') {
                universalWarnings = section.content;
            } else if (section.title === 'Final Self-Check') {
                finalSelfCheck = section.content;
            }
        }

        // Build persona panels
        const personaPanels = G.manifest.personas.map((pId, i) => {
            const persona = G.manifest.pages[`persona-${pId}`];
            const antiPatterns = personaSections[pId];
            if (!persona || !antiPatterns) return '';

            const apBorderStyle = G.getPersonaBorderStyle(pId, persona.color);
            const apBorderClass = G.getPersonaBorderClass(pId);
            return `
                <div class="sidebar-panel${i === 0 ? ' active' : ''}" data-panel="persona-${pId}">
                    <div class="anti-pattern-card ${apBorderClass}" style="${apBorderStyle}">
                        <div class="anti-pattern-header">
                            <h3>${persona.name}</h3>
                            <span class="anti-pattern-motto">${antiPatterns.motto}</span>
                        </div>
                        <div class="anti-pattern-grid">
                            <div class="anti-pattern-section">
                                <h4>⚠️ Signs expectations may be too high</h4>
                                <ul>${antiPatterns.signs.map(s => `<li>${G.parseInlineMarkdown(s)}</li>`).join('')}</ul>
                            </div>
                            <div class="anti-pattern-section red-flags">
                                <h4>🚩 Red flags</h4>
                                <ul>${antiPatterns.redFlags.map(r => `<li>${G.parseInlineMarkdown(r)}</li>`).join('')}</ul>
                            </div>
                        </div>
                        <div class="anti-pattern-signal">
                            <strong>Signal:</strong> ${G.parseInlineMarkdown(antiPatterns.signal)}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const introHtml = antiPatternsIntro
            ? `<p class="sidebar-intro">${G.parseInlineMarkdown(antiPatternsIntro.replace(/<!--[^>]*-->/g, '').trim().split('\n')[0])}</p>`
            : '';

        container.innerHTML = `
            <div class="sidebar-layout">
                <aside class="sidebar">
                    <div class="sidebar-inner">
                        <div>
                            <h1 class="sidebar-title">Anti-Patterns</h1>
                            ${introHtml}
                        </div>
                        <nav class="pd-nav" aria-label="Anti-patterns navigation">
                            ${G.manifest.personas.map((pId, index) => {
                                const persona = G.manifest.pages[`persona-${pId}`];
                                return `
                                    <button class="sidebar-nav-btn${index === 0 ? ' active' : ''}" aria-current="${index === 0}" data-panel="persona-${pId}">
                                        <span class="sidebar-nav-label">${persona.name}</span>
                                    </button>
                                `;
                            }).join('')}
                            <div class="sidebar-nav-divider"></div>
                            <button class="sidebar-nav-btn" data-panel="warning-signs">
                                <span class="sidebar-nav-label">Universal Warning Signs</span>
                            </button>
                            <button class="sidebar-nav-btn" data-panel="self-check">
                                <span class="sidebar-nav-label">Final Self-Check</span>
                            </button>
                        </nav>
                    </div>
                </aside>
                <div class="sidebar-content">
                    ${personaPanels}
                    ${universalWarnings ? `<div class="sidebar-panel" data-panel="warning-signs"><h2 class="content-step-title">Universal Warning Signs</h2>${G.parseMarkdownToHtml(universalWarnings)}</div>` : ''}
                    ${finalSelfCheck ? `<div class="sidebar-panel" data-panel="self-check"><h2 class="content-step-title">Final Self-Check</h2>${G.parseMarkdownToHtml(finalSelfCheck)}</div>` : ''}
                </div>
            </div>
        `;
    }

    function renderCardsSection(section) {
        const cards = G.parseCardsFromSection(section.content);
        return `
            <section class="values-section">
                <h2>${section.title}</h2>
                <div class="values-grid">
                    ${cards.map(card => `
                        <div class="value-card">
                            <h3>${card.title}</h3>
                            <p>${G.parseInlineMarkdown(card.description)}</p>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }

    function renderKeyTruthsSection(section) {
        const items = G.parseListItems(section.content);
        return `
            <section class="key-truths-section">
                <h2>${section.title}</h2>
                <ul class="key-truths-list">
                    ${items.map(item => `<li>${G.parseInlineMarkdown(item)}</li>`).join('')}
                </ul>
            </section>
        `;
    }

    function renderGenericSection(section) {
        const paragraphs = G.parseParagraphs(section.content);
        const sectionClass = G.slugify(section.title) + '-section';
        return `
            <section class="${sectionClass}">
                <h2>${section.title}</h2>
                ${paragraphs.map(p => `<p>${G.parseInlineMarkdown(p)}</p>`).join('')}
            </section>
        `;
    }

    function renderUsageSection(section) {
        const items = G.parseListItems(section.content);

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
                    ${items.map(item => `<li>${G.parseInlineMarkdown(item)}</li>`).join('')}
                </ul>
                ${highlight ? `<p class="highlight-box">${G.parseInlineMarkdown(highlight)}</p>` : ''}
        `;

        for (const sub of subsections) {
            const sectionId = G.slugify(sub.heading);
            html += `
                <div class="usage-subsection" id="${sectionId}">
                    <h3>${sub.heading}</h3>
                    ${G.parseMarkdownToHtml(sub.content)}
                </div>
            `;
        }

        html += `</section>`;
        return html;
    }

    async function renderPersonasOverviewLayout(content, container) {
        let html = `
            <div class="container">
                <h1>${content.title}</h1>
                <p class="page-intro">${G.parseInlineMarkdown(G.getIntroText(content.body))}</p>
        `;

        // Check for diagram annotation
        if (content.body.includes('<!-- diagram: impact-rings -->')) {
            html += `
                <div class="diagram-container">
                    <svg id="impact-rings" viewBox="0 0 580 375" class="impact-rings-svg"></svg>
                </div>
            `;
        }

        // Check for tracks-intro annotation and render content between it and persona-cards
        if (content.body.includes('<!-- tracks-intro -->')) {
            const tracksIntroMatch = content.body.match(/<!-- tracks-intro -->\s*([\s\S]*?)(?=<!-- persona-cards -->|$)/);
            if (tracksIntroMatch && tracksIntroMatch[1].trim()) {
                html += `<div class="tracks-intro">${G.parseMarkdownToHtml(tracksIntroMatch[1].trim())}</div>`;
            }
        }

        // Check for persona-cards annotation
        if (content.body.includes('<!-- persona-cards -->')) {
            // Group personas by level (from manifest metadata)
            const foundation = G.manifest.personaGroups.foundation || [];
            const teamLevel = G.manifest.personaGroups.team || [];
            const orgLevel = G.manifest.personaGroups.org || [];

            // Helper to render a persona card
            const renderPersonaCard = async (personaId) => {
                const persona = G.manifest.pages[`persona-${personaId}`];
                const personaContent = await G.loadContent(`persona-${personaId}`);
                const mindset = G.extractMindset(personaContent.body);
                return `
                    <a href="#persona-${persona.id}" data-page="persona-${persona.id}" class="persona-card persona-${persona.id}">
                        <div class="persona-scope">${G.getScopeWithTrack(persona.id, persona.scope)}</div>
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
            G.renderImpactRings();
        }
    }

    async function renderCapabilitiesOverviewLayout(content, container) {
        let html = `
            <div class="container">
                <h1>${content.title}</h1>
                <p class="page-intro">${G.parseInlineMarkdown(G.getIntroText(content.body))}</p>
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
                html += `<p class="diagram-caption">${G.parseInlineMarkdown(captionMatch[1].trim())}</p>`;
            }
        }

        // Check for capability-cards annotation
        if (content.body.includes('<!-- capability-cards -->')) {
            html += `<div class="capabilities-grid">`;

            for (const capId of G.manifest.capabilities) {
                const cap = G.manifest.pages[`capability-${capId}`];
                // Load full capability content to get description
                const capContent = await G.loadContent(`capability-${capId}`);
                const description = G.extractDescription(capContent.body);
                const icon = cap.icon ? await G.loadIcon(cap.icon) : '';

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
        const sections = G.parseSections(content.body);
        for (const section of sections) {
            if (section.annotation?.type === 'balance') {
                html += `
                    <section class="balance-section">
                        <h2>${section.title}</h2>
                        ${G.parseMarkdownToHtml(section.content)}
                    </section>
                `;
            }
        }

        html += `</div>`;
        container.innerHTML = html;

        // Render diagram
        if (content.body.includes('<!-- diagram: capability-radar -->')) {
            G.renderCapabilityRadar();
        }
    }

    async function renderPersonaDetailLayout(content, container) {
        const personaId = content.id;
        const personaIndex = G.manifest.personas.indexOf(personaId);
        const prevPersonaId = personaIndex > 0 ? G.manifest.personas[personaIndex - 1] : null;
        const nextPersonaId = personaIndex < G.manifest.personas.length - 1 ? G.manifest.personas[personaIndex + 1] : null;
        const prevPersona = prevPersonaId ? G.manifest.pages[`persona-${prevPersonaId}`] : null;
        const nextPersona = nextPersonaId ? G.manifest.pages[`persona-${nextPersonaId}`] : null;

        const mindset = G.extractMindset(content.body);
        const trustedQuestion = G.extractTrustedQuestion(content.body);
        const natureOfImpact = G.extractListSection(content.body, 'Nature of Impact');
        const successLooksLike = G.extractListSection(content.body, 'Success Looks Like');
        const explicitExpectation = G.extractListSection(content.body, 'Explicit Expectation');

        const borderClass = G.getPersonaBorderClass(personaId);
        const capabilitySections = G.extractCapabilitySections(content.body);

        // Build capability panels
        const capPanels = G.manifest.capabilities.map(capId => {
            const cap = G.manifest.pages[`capability-${capId}`];
            const capSection = capabilitySections[cap.name];
            if (!cap || !capSection) return null;
            return { capId, cap, capSection };
        }).filter(Boolean);

        container.innerHTML = `
            <div class="sidebar-layout">
                <aside class="sidebar">
                    <div class="sidebar-inner">
                        <div class="pd-identity ${borderClass}">
                            <div class="persona-scope">${G.getScopeWithTrack(personaId, content.scope)}</div>
                            <h1 class="pd-name">${content.name}</h1>
                            <p class="pd-tagline">${content.tagline}</p>
                        </div>

                        <nav class="pd-nav" aria-label="Persona sections">
                            <button class="sidebar-nav-btn active" aria-current="true" data-panel="overview">
                                <span class="sidebar-nav-label">Overview</span>
                            </button>
                            <div class="sidebar-nav-divider"></div>
                            ${capPanels.map(({ capId, cap }) => `
                                <button class="sidebar-nav-btn" data-panel="cap-${capId}">
                                    <span class="sidebar-nav-label">${cap.name}</span>
                                </button>
                            `).join('')}
                        </nav>

                        <div class="sidebar-footer">
                            <a href="#self-assessment" data-page="self-assessment" class="pd-cta">Assess yourself &rarr;</a>
                            <div class="pd-persona-nav">
                                ${prevPersona ? `<a href="#persona-${prevPersona.id}" data-page="persona-${prevPersona.id}">&larr; ${prevPersona.name}</a>` : '<span></span>'}
                                ${nextPersona ? `<a href="#persona-${nextPersona.id}" data-page="persona-${nextPersona.id}">${nextPersona.name} &rarr;</a>` : ''}
                            </div>
                        </div>
                    </div>
                </aside>

                <div class="sidebar-content">
                    <div class="sidebar-panel active" data-panel="overview">
                        <div class="pd-quote">
                            <p class="detail-mindset">"${mindset}"</p>
                            ${trustedQuestion ? `<p class="pd-question"><strong>The question you're trusted to answer:</strong> "${trustedQuestion}"</p>` : ''}
                        </div>
                        <div class="pd-impact-grid">
                            <div class="pd-impact-block">
                                <h4>Nature of Impact</h4>
                                <ul>${natureOfImpact.map(item => `<li>${item}</li>`).join('')}</ul>
                            </div>
                            ${successLooksLike.length > 0 ? `
                            <div class="pd-impact-block">
                                <h4>Success Looks Like</h4>
                                <ul>${successLooksLike.map(item => `<li>${item}</li>`).join('')}</ul>
                            </div>
                            ` : ''}
                            ${explicitExpectation.length > 0 ? `
                            <div class="pd-impact-block">
                                <h4>Explicit Expectation</h4>
                                <ul>${explicitExpectation.map(item => `<li>${item}</li>`).join('')}</ul>
                            </div>
                            ` : ''}
                        </div>
                        ${capPanels[0] ? `
                        <div class="pd-panel-footer">
                            <a href="#persona-${personaId}/cap-${capPanels[0].capId}" class="next-panel-btn">
                                Next: ${capPanels[0].cap.name} &rarr;
                            </a>
                        </div>
                        ` : ''}
                    </div>

                    ${capPanels.map(({ capId, cap, capSection }, i) => {
                        const nextCap = capPanels[i + 1];
                        return `
                        <div class="sidebar-panel" data-panel="cap-${capId}">
                            <h2 class="pd-cap-title">
                                ${cap.name}
                                <a href="#capability-${capId}" data-page="capability-${capId}" class="pd-cap-link">View full capability &rarr;</a>
                            </h2>
                            <ul class="expectations-list">
                                ${capSection.expectations.map(item => `<li>${item}</li>`).join('')}
                            </ul>
                            ${capSection.selfAssessment.length > 0 ? `
                            <div class="pd-prompts">
                                <h3>Self-Assessment Prompts</h3>
                                <ul>${capSection.selfAssessment.map(item => `<li>${item}</li>`).join('')}</ul>
                            </div>
                            ` : ''}
                            ${nextCap ? `
                            <div class="pd-panel-footer">
                                <a href="#persona-${personaId}/cap-${nextCap.capId}" class="next-panel-btn">
                                    Next: ${nextCap.cap.name} &rarr;
                                </a>
                            </div>
                            ` : ''}
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }

    async function renderCapabilityDetailLayout(content, container) {
        const capId = content.id;
        const capIndex = G.manifest.capabilities.indexOf(capId);
        const prevCapId = capIndex > 0 ? G.manifest.capabilities[capIndex - 1] : null;
        const nextCapId = capIndex < G.manifest.capabilities.length - 1 ? G.manifest.capabilities[capIndex + 1] : null;
        const prevCap = prevCapId ? G.manifest.pages[`capability-${prevCapId}`] : null;
        const nextCap = nextCapId ? G.manifest.pages[`capability-${nextCapId}`] : null;

        const intro = G.extractIntroduction(content.body);
        const note = G.extractNote(content.body);

        let html = `
            <div class="container">
                <div class="detail-header">
                    <h1>${content.name}</h1>
                    <p class="detail-subtitle">${content.question}</p>
                    <div class="cap-detail-intro">${G.parseMarkdownToHtml(intro)}</div>
                    ${note ? `<div class="highlight-box cap-detail-note">${G.parseMarkdownToHtml(note)}</div>` : ''}
                </div>

                <h2>Expectations by Persona</h2>

                <div class="persona-tabs" role="tablist">
                    ${G.manifest.personas.map((pId, index) => {
                        const persona = G.manifest.pages[`persona-${pId}`];
                        return `<button class="persona-tab ${index === 0 ? 'active' : ''}" role="tab" aria-selected="${index === 0}" data-persona="${pId}">${persona.name}</button>`;
                    }).join('')}
                </div>

                <div class="persona-contents">
        `;

        // Load all persona content to get their expectations for this capability
        for (let i = 0; i < G.manifest.personas.length; i++) {
            const pId = G.manifest.personas[i];
            const persona = G.manifest.pages[`persona-${pId}`];
            const personaContent = await G.loadContent(`persona-${pId}`);

            const capabilitySections = G.extractCapabilitySections(personaContent.body);
            const expectations = capabilitySections[content.name];
            const mindset = G.extractMindset(personaContent.body);
            const trustedQuestion = G.extractTrustedQuestion(personaContent.body);

            if (persona && expectations) {
                const pBorderStyle = G.getPersonaBorderStyle(pId, persona.color);
                const pBorderClass = G.getPersonaBorderClass(pId);
                html += `
                    <div class="persona-content ${i === 0 ? 'active' : ''}" role="tabpanel" data-persona="${pId}">
                        <div class="capability-section cap-persona-section ${pBorderClass}" style="${pBorderStyle}">
                            <div class="cap-persona-header">
                                <h3 class="cap-persona-name">${persona.name}</h3>
                                <span class="cap-persona-scope">${G.getScopeWithTrack(pId, persona.scope)}</span>
                            </div>
                            <p class="cap-persona-mindset${trustedQuestion ? ' has-question' : ''}">"${mindset}"</p>
                            ${trustedQuestion ? `<p class="cap-persona-question"><strong>The question you're trusted to answer:</strong> "${trustedQuestion}"</p>` : ''}
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
    }

    async function renderMarkdownPageLayout(content, container) {
        const cssClass = G.slugify(content.title) + '-page';
        container.innerHTML = `
            <div class="container ${cssClass}">
                <h1>${content.title}</h1>
                ${G.parseMarkdownToHtml(content.body)}
            </div>
        `;
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
        const calibrationContent = await G.loadContent('calibration-examples');

        // Build step body HTML for each step
        const stepBodies = stepSections.map(step => {
            if (step.content.includes('<!-- calibration-insert -->')) {
                const [before] = step.content.split('<!-- calibration-insert -->');
                // Split rating criteria into collapsible sub-sections
                let html = renderMarkdownAsCollapsibles(before.trim());
                // Wrap calibration examples in a collapsible
                if (calibrationContent) {
                    html += renderCollapsible(
                        'Calibration Examples — see what each rating looks like in practice',
                        renderCalibrationExamples(calibrationContent)
                    );
                }
                return html;
            }
            return G.parseMarkdownToHtml(step.content);
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
                G.parseListItems(keyTruthsSection.content.replace(/<!--\s*key-truths\s*-->/g, '').trim())
                    .map(item => `<li>${G.parseInlineMarkdown(item)}</li>`)
                    .join('')
              }</ul>`
            : '';

        // Sidebar + content panel layout
        container.innerHTML = `
            <div class="sidebar-layout">
                <aside class="sidebar">
                    <div class="sidebar-inner">
                        <h1 class="sidebar-title">${content.title}</h1>
                        <p class="sidebar-intro">${G.parseInlineMarkdown(introPart)}</p>

                        <nav class="step-nav" aria-label="Assessment steps">
                            ${beforeYouBeginParts ? `
                            <button class="sidebar-nav-btn sidebar-ref-btn active" aria-current="true" data-ref="before-you-begin">
                                <span class="sidebar-nav-label">Before you begin</span>
                            </button>
                            <div class="sidebar-nav-divider"></div>
                            ` : ''}
                            ${stepSections.map((step, i) => {
                                const label = step.title.replace(/^Step \d+:\s*/, '');
                                return `
                                    <button class="sidebar-nav-btn" data-step="${i}">
                                        <span class="sidebar-nav-num">${i + 1}</span>
                                        <span class="sidebar-nav-label">${label}</span>
                                    </button>
                                `;
                            }).join('')}
                        </nav>

                        <div class="sidebar-footer">
                            ${commonTrapsSection ? `
                            <button class="sidebar-nav-btn sidebar-ref-btn" data-ref="common-traps">
                                <span class="sidebar-nav-label">Common Traps</span>
                            </button>
                            ` : ''}
                            ${keyTruthsSection ? `
                            <button class="sidebar-nav-btn sidebar-ref-btn" data-ref="key-truths">
                                <span class="sidebar-nav-label">Key Truths</span>
                            </button>
                            ` : ''}
                        </div>
                    </div>
                </aside>

                <div class="sidebar-content">
                    ${stepSections.map((step, i) => {
                        const stepTitle = step.title.replace(/^Step \d+:\s*/, '');
                        const nextStep = stepSections[i + 1];
                        const nextTitle = nextStep ? nextStep.title.replace(/^Step \d+:\s*/, '') : null;
                        return `
                            <div class="content-step" data-step="${i}">
                                <h2 class="content-step-title">Step ${i + 1}: ${stepTitle}</h2>
                                ${stepBodies[i]}
                                ${nextTitle ? `
                                <div class="step-footer">
                                    <button class="next-step-btn" data-next="${i + 1}">
                                        Next: ${nextTitle} &rarr;
                                    </button>
                                </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                    ${beforeYouBeginParts ? `
                    <div class="content-step active" data-ref="before-you-begin">
                        <h2 class="content-step-title">Before You Begin</h2>
                        ${G.parseMarkdownToHtml(beforeYouBeginParts)}
                    </div>
                    ` : ''}
                    ${commonTrapsSection ? `
                    <div class="content-step" data-ref="common-traps">
                        <h2 class="content-step-title">Common Traps</h2>
                        ${G.parseMarkdownToHtml(commonTrapsSection.content)}
                    </div>
                    ` : ''}
                    ${keyTruthsSection ? `
                    <div class="content-step" data-ref="key-truths">
                        <h2 class="content-step-title">Key Truths</h2>
                        ${keyTruthsHtml}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // All click handling is done by the shared initInteractivePatterns() listener.
    }

    function renderCalibrationExamples(calibrationContent) {
        const sections = G.parseSections(calibrationContent.body);
        const personaSections = {};

        for (const section of sections) {
            if (section.title.endsWith(' Calibration Examples')) {
                const personaName = section.title.replace(' Calibration Examples', '').toLowerCase();
                personaSections[personaName] = G.parseCalibrationSection(section.content);
            }
        }

        let html = `
            <section class="calibration-section">
                <h2 id="calibration-examples">Calibration Examples</h2>
                <p class="calibration-disclaimer">These are <strong>illustrative examples</strong>, not exact criteria. Use them to calibrate your thinking about what each rating level looks like in practice. Your situation will differ — what matters is whether the pattern of impact feels similar, not whether the details match.</p>

                <div class="persona-tabs" role="tablist">
                    ${G.manifest.personas.map((pId, index) => {
                        const persona = G.manifest.pages[`persona-${pId}`];
                        return `<button class="persona-tab ${index === 0 ? 'active' : ''}" role="tab" aria-selected="${index === 0}" data-persona="${pId}">${persona.name}</button>`;
                    }).join('')}
                </div>

                <div class="persona-contents">
        `;

        for (let i = 0; i < G.manifest.personas.length; i++) {
            const pId = G.manifest.personas[i];
            const persona = G.manifest.pages[`persona-${pId}`];
            const examples = personaSections[pId];

            if (persona && examples) {
                const borderStyle = G.getPersonaBorderStyle(pId, persona.color);
                const borderClass = G.getPersonaBorderClass(pId);
                html += `
                    <div class="persona-content ${i === 0 ? 'active' : ''}" role="tabpanel" data-persona="${pId}">
                        <div class="calibration-card ${borderClass}" style="${borderStyle}">
                            <h3>${persona.name}</h3>

                            ${examples.prompts.length > 0 ? `
                            <div class="calibration-prompts">
                                <h4>Reflection Prompts</h4>
                                <ul>
                                    ${examples.prompts.map(p => `<li>${G.parseInlineMarkdown(p)}</li>`).join('')}
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

    function renderCalibrationLevel(title, examples, levelClass) {
        if (!examples || examples.length === 0) return '';
        return `
            <div class="calibration-level calibration-level-${levelClass}">
                <h4>${title}</h4>
                ${examples.map((ex, i) => `
                    <div class="calibration-example">
                        <span class="calibration-example-label">Example ${i + 1}</span>
                        <p>${G.parseInlineMarkdown(ex)}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // ============================================
    // Expose on G
    // ============================================

    G.renderHomeLayout = renderHomeLayout;
    G.renderQuickReferenceOverview = renderQuickReferenceOverview;
    G.renderAboutPage = renderAboutPage;
    G.renderCommonQuestionsPage = renderCommonQuestionsPage;
    G.renderAntiPatternsPage = renderAntiPatternsPage;
    G.renderPersonasOverviewLayout = renderPersonasOverviewLayout;
    G.renderCapabilitiesOverviewLayout = renderCapabilitiesOverviewLayout;
    G.renderPersonaDetailLayout = renderPersonaDetailLayout;
    G.renderCapabilityDetailLayout = renderCapabilityDetailLayout;
    G.renderMarkdownPageLayout = renderMarkdownPageLayout;
    G.renderSelfAssessmentLayout = renderSelfAssessmentLayout;

})(window.FieldGuide = window.FieldGuide || {});
