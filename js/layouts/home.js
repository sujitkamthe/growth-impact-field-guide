// Home, Quick Reference overview, About, Common Questions, and generic markdown layouts.
(function(G) {
    'use strict';

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
            const sectionBody = G.renderMarkdownAsCollapsibles(cleanContent);
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
            html += G.renderMarkdownAsCollapsibles(faqSection.content);
        }

        html += '</div>';
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

    G.renderHomeLayout = renderHomeLayout;
    G.renderQuickReferenceOverview = renderQuickReferenceOverview;
    G.renderAboutPage = renderAboutPage;
    G.renderCommonQuestionsPage = renderCommonQuestionsPage;
    G.renderMarkdownPageLayout = renderMarkdownPageLayout;

})(window.FieldGuide = window.FieldGuide || {});
