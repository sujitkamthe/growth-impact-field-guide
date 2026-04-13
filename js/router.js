// Navigation, routing, page management, and interactive UI patterns
(function(G) {
    'use strict';

    // ============================================
    // Nav population
    // ============================================

    function populateNavDropdowns() {
        const personasDropdown = document.getElementById('personas-dropdown');
        if (personasDropdown) {
            personasDropdown.innerHTML = G.manifest.personas.map(id => {
                const page = G.manifest.pages[`persona-${id}`];
                return `<li><a href="#persona-${id}" data-page="persona-${id}" class="persona-link">${page.name}</a></li>`;
            }).join('');
        }

        const capabilitiesDropdown = document.getElementById('capabilities-dropdown');
        if (capabilitiesDropdown) {
            capabilitiesDropdown.innerHTML = G.manifest.capabilities.map(id => {
                const page = G.manifest.pages[`capability-${id}`];
                return `<li><a href="#capability-${id}" data-page="capability-${id}" class="capability-link">${page.name}</a></li>`;
            }).join('');
        }

        const referenceDropdown = document.getElementById('reference-dropdown');
        if (referenceDropdown) {
            referenceDropdown.innerHTML = Object.entries(virtualPages)
                .filter(([id, vp]) => vp.sourcePageId && id !== 'quick-reference')
                .map(([id, vp]) => `<li><a href="#${id}" data-page="${id}">${vp.title}</a></li>`)
                .join('');
        }
    }

    function populateFooter() {
        const homePage = G.manifest.pages['home'];
        if (!homePage) return;

        const footer = document.querySelector('.main-footer .container');
        if (footer) {
            const title = homePage.title || '';
            const note = homePage.footer_note || '';
            footer.innerHTML = `
                <p>${G.escapeHtml(title)}</p>
                ${note ? `<p class="footer-note">${G.escapeHtml(note)}</p>` : ''}
            `;
        }
    }

    // ============================================
    // Layout registry & virtual pages
    // ============================================

    const layoutRenderers = {
        'home': 'renderHomeLayout',
        'personas-overview': 'renderPersonasOverviewLayout',
        'capabilities-overview': 'renderCapabilitiesOverviewLayout',
        'persona-detail': 'renderPersonaDetailLayout',
        'capability-detail': 'renderCapabilityDetailLayout',
        'markdown-page': 'renderMarkdownPageLayout',
        'self-assessment': 'renderSelfAssessmentLayout'
    };

    const virtualPages = {
        'quick-reference': {
            sourcePageId: 'quick-reference',
            renderer: 'renderQuickReferenceOverview',
            title: 'Quick Reference'
        },
        'about': {
            sourcePageId: 'home',
            renderer: 'renderAboutPage',
            title: 'About This Guide'
        },
        'common-questions': {
            sourcePageId: 'quick-reference',
            renderer: 'renderCommonQuestionsPage',
            title: 'Common Questions'
        },
        'anti-patterns': {
            sourcePageId: 'quick-reference',
            renderer: 'renderAntiPatternsPage',
            title: 'Anti-Patterns'
        }
    };

    // ============================================
    // Page rendering & navigation
    // ============================================

    async function renderPage(pageId, container) {
        const vp = virtualPages[pageId];
        if (vp) {
            if (!vp.sourcePageId) {
                await G[vp.renderer](null, container);
                return;
            }
            const sourceContent = await G.loadContent(vp.sourcePageId);
            if (sourceContent) {
                await G[vp.renderer](sourceContent, container);
                return;
            }
        }

        const content = await G.loadContent(pageId);
        if (!content) {
            container.innerHTML = '<div class="container"><h1>Page Not Found</h1></div>';
            return;
        }

        const rendererName = layoutRenderers[content.layout];
        if (rendererName && G[rendererName]) {
            await G[rendererName](content, container);
        } else {
            container.innerHTML = '<div class="container"><h1>Unknown Layout</h1></div>';
        }
    }

    async function navigateTo(pageId, pushState, sectionId) {
        await showPage(pageId, pushState === undefined ? true : pushState, sectionId || null);
    }

    async function showPage(pageId, pushState, sectionId) {
        document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));

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

        let targetPage = document.getElementById(pageId);
        if (!targetPage) {
            targetPage = document.createElement('section');
            targetPage.id = pageId;
            targetPage.className = 'page';
            document.getElementById('app').appendChild(targetPage);
        }

        if (targetPage.innerHTML.trim() === '' || targetPage.querySelector('.page-loading')) {
            targetPage.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
            await renderPage(pageId, targetPage);
            const pageInfo = G.manifest.pages[pageId];
            if (pageInfo?.layout) {
                targetPage.classList.add(pageInfo.layout + '-page');
            } else if (virtualPages[pageId]) {
                targetPage.classList.add('reference-page');
            }
        }

        targetPage.classList.add('active');

        const sidebarPage = pageId === 'self-assessment' || pageId === 'anti-patterns' || pageId.startsWith('persona-');
        const footer = document.querySelector('.main-footer');
        if (footer) footer.style.display = sidebarPage ? 'none' : '';
        document.body.classList.toggle('sidebar-active', sidebarPage);

        if (sectionId) {
            // For sidebar-layout pages, switch to the panel that owns this section
            // before attempting to scroll. Without this, the target element may be
            // inside a hidden panel and scrollIntoView lands on nothing visible.
            activateSidebarSection(targetPage, sectionId);

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

        if (pushState) {
            const hashUrl = sectionId ? '#' + pageId + '/' + sectionId : '#' + pageId;
            history.pushState({ page: pageId, section: sectionId }, '', hashUrl);
        }
    }

    // ============================================
    // Interactive UI patterns (single delegated handler)
    // ============================================

    function initInteractivePatterns() {
        document.getElementById('app').addEventListener('click', function(e) {
            const collBtn = e.target.closest('.collapsible-btn');
            if (collBtn) {
                const collapsible = collBtn.closest('.collapsible');
                collapsible.classList.toggle('collapsed');
                collBtn.setAttribute('aria-expanded', !collapsible.classList.contains('collapsed'));
                return;
            }

            const tab = e.target.closest('.persona-tab');
            if (tab) {
                const container = tab.closest('.persona-tabs')?.parentElement;
                if (!container) return;
                const targetPersona = tab.getAttribute('data-persona');
                container.querySelectorAll('.persona-tab').forEach(t => {
                    t.classList.remove('active');
                    t.setAttribute('aria-selected', 'false');
                });
                container.querySelectorAll('.persona-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                tab.setAttribute('aria-selected', 'true');
                container.querySelector(`.persona-content[data-persona="${targetPersona}"]`)?.classList.add('active');
                return;
            }

            const navBtn = e.target.closest('.sidebar-nav-btn[data-panel]');
            if (navBtn) {
                const layout = navBtn.closest('.sidebar-layout');
                if (!layout) return;
                const panelId = navBtn.getAttribute('data-panel');
                layout.querySelectorAll('.sidebar-nav-btn').forEach(b => {
                    b.classList.remove('active');
                    b.setAttribute('aria-current', 'false');
                });
                layout.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
                navBtn.classList.add('active');
                navBtn.setAttribute('aria-current', 'true');
                const panel = layout.querySelector(`.sidebar-panel[data-panel="${panelId}"]`);
                if (panel) panel.classList.add('active');
                const content = layout.querySelector('.sidebar-content');
                if (content) content.scrollTop = 0;
                return;
            }

            const stepBtn = e.target.closest('.sidebar-nav-btn[data-step]');
            if (stepBtn) {
                const layout = stepBtn.closest('.sidebar-layout');
                if (!layout) return;
                const idx = parseInt(stepBtn.dataset.step);
                setActiveStep(layout, idx);
                updateHashForSection('step-' + (idx + 1));
                return;
            }

            const refBtn = e.target.closest('.sidebar-ref-btn[data-ref]');
            if (refBtn) {
                const layout = refBtn.closest('.sidebar-layout');
                if (!layout) return;
                showRefPanel(layout, refBtn.dataset.ref);
                updateHashForSection(refBtn.dataset.ref);
                return;
            }

            const nextBtn = e.target.closest('.next-step-btn');
            if (nextBtn) {
                const layout = nextBtn.closest('.sidebar-layout');
                if (!layout) return;
                const idx = parseInt(nextBtn.dataset.next);
                setActiveStep(layout, idx);
                updateHashForSection('step-' + (idx + 1));
                return;
            }
        });
    }

    function setActiveStep(layout, idx) {
        layout.querySelectorAll('.sidebar-nav-btn').forEach(btn => btn.classList.remove('active', 'done'));
        const stepBtns = layout.querySelectorAll('.sidebar-nav-btn[data-step]');
        stepBtns.forEach((btn, i) => {
            btn.classList.toggle('active', i === idx);
            btn.classList.toggle('done', i < idx);
        });
        layout.querySelectorAll('.content-step').forEach(step => step.classList.remove('active'));
        const steps = layout.querySelectorAll('.content-step[data-step]');
        if (steps[idx]) steps[idx].classList.add('active');
        const content = layout.querySelector('.sidebar-content');
        if (content) content.scrollTop = 0;
    }

    function showRefPanel(layout, refId) {
        layout.querySelectorAll('.sidebar-nav-btn').forEach(btn => btn.classList.remove('active'));
        layout.querySelectorAll('.sidebar-ref-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.ref === refId);
        });
        layout.querySelectorAll('.content-step').forEach(step => {
            step.classList.toggle('active', step.dataset.ref === refId);
        });
        const content = layout.querySelector('.sidebar-content');
        if (content) content.scrollTop = 0;
    }

    // Given a section id from the URL hash (e.g. "common-traps", "step-3",
    // "overstating"), activate the sidebar panel that contains it. Returns the
    // panel element, or null if the page isn't a sidebar layout or no match.
    function activateSidebarSection(targetPage, sectionId) {
        const layout = targetPage.querySelector('.sidebar-layout');
        if (!layout) return null;

        // Direct match on a panel's data-ref
        let panel = layout.querySelector('.content-step[data-ref="' + sectionId + '"]');

        // step-N (1-indexed) maps to data-step="N-1"
        if (!panel) {
            const m = sectionId.match(/^step-(\d+)$/);
            if (m) {
                panel = layout.querySelector('.content-step[data-step="' + (parseInt(m[1]) - 1) + '"]');
            }
        }

        // Fallback: the section id refers to an element (e.g. a heading)
        // inside one of the panels — activate its containing panel.
        if (!panel) {
            const el = targetPage.querySelector('[id="' + sectionId + '"]');
            if (el) panel = el.closest('.content-step');
        }

        if (!panel) return null;

        if (panel.dataset.ref) {
            showRefPanel(layout, panel.dataset.ref);
        } else if (panel.dataset.step !== undefined && panel.dataset.step !== '') {
            setActiveStep(layout, parseInt(panel.dataset.step));
        }
        return panel;
    }

    // Push a hash like #<activePageId>/<sectionId> so sidebar clicks are deep-linkable.
    function updateHashForSection(sectionId) {
        const activePage = document.querySelector('.page.active');
        if (!activePage) return;
        const pageId = activePage.id.replace(/^page-/, '');
        history.pushState({ page: pageId, section: sectionId }, '', '#' + pageId + '/' + sectionId);
    }

    // ============================================
    // Navigation event listeners
    // ============================================

    function initNavigation() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                navigateTo(link.getAttribute('data-page'));
                return;
            }

            const anchor = e.target.closest('a[href^="#"]');
            if (anchor && !anchor.hasAttribute('data-page')) {
                const href = anchor.getAttribute('href');
                if (href && href.startsWith('#')) {
                    e.preventDefault();
                    const hash = href.slice(1);
                    const [pageId, sectionId] = hash.split('/');

                    const activePage = document.querySelector('.page.active');
                    const targetElement = activePage?.querySelector('#' + hash) ||
                                         activePage?.querySelector('[id="' + hash + '"]');

                    if (targetElement && !sectionId) {
                        targetElement.scrollIntoView({ behavior: 'smooth' });
                        const currentPageId = activePage?.id?.replace('page-', '') || 'home';
                        history.pushState({ page: currentPageId, section: hash }, '', '#' + currentPageId + '/' + hash);
                    } else {
                        navigateTo(pageId, true, sectionId || null);
                    }
                }
            }
        });

        window.addEventListener('popstate', function(e) {
            if (e.state && e.state.page) showPage(e.state.page, false, e.state.section || null);
        });

        window.addEventListener('hashchange', function() {
            const hash = window.location.hash.slice(1) || 'home';
            const [pageId, sectionId] = hash.split('/');
            navigateTo(pageId, false, sectionId);
        });

        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navLinks = document.querySelector('.nav-links');
        if (mobileMenuBtn && navLinks) {
            mobileMenuBtn.addEventListener('click', function() {
                navLinks.classList.toggle('active');
                mobileMenuBtn.setAttribute('aria-expanded', navLinks.classList.contains('active'));
            });
            navLinks.addEventListener('click', function(e) {
                if (e.target.closest('a')) navLinks.classList.remove('active');
            });
        }
    }

    // Expose
    G.populateNavDropdowns = populateNavDropdowns;
    G.populateFooter = populateFooter;
    G.initInteractivePatterns = initInteractivePatterns;
    G.initNavigation = initNavigation;
    G.navigateTo = navigateTo;
    G.showPage = showPage;
    G.virtualPages = virtualPages;
    G.renderPage = renderPage;

})(window.FieldGuide = window.FieldGuide || {});
