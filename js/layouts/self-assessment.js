// Self-assessment + nested calibration examples layout.
(function(G) {
    'use strict';

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
                let html = G.renderMarkdownAsCollapsibles(before.trim());
                // Wrap calibration examples in a collapsible
                if (calibrationContent) {
                    html += G.renderCollapsible(
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

    G.renderSelfAssessmentLayout = renderSelfAssessmentLayout;

})(window.FieldGuide = window.FieldGuide || {});
