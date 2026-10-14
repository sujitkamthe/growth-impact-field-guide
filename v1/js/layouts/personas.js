// Personas overview, persona detail, and anti-patterns layouts.
(function(G) {
    'use strict';

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

    G.renderPersonasOverviewLayout = renderPersonasOverviewLayout;
    G.renderPersonaDetailLayout = renderPersonaDetailLayout;
    G.renderAntiPatternsPage = renderAntiPatternsPage;

})(window.FieldGuide = window.FieldGuide || {});
