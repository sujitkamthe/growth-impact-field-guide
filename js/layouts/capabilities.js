// Capabilities overview and capability detail layouts.
(function(G) {
    'use strict';

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

    G.renderCapabilitiesOverviewLayout = renderCapabilitiesOverviewLayout;
    G.renderCapabilityDetailLayout = renderCapabilityDetailLayout;

})(window.FieldGuide = window.FieldGuide || {});
