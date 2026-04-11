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

        if (targetPage.innerHTML.trim() === '') {
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
                collBtn.closest('.collapsible').classList.toggle('collapsed');
                return;
            }

            const tab = e.target.closest('.persona-tab');
            if (tab) {
                const container = tab.closest('.persona-tabs')?.parentElement;
                if (!container) return;
                const targetPersona = tab.getAttribute('data-persona');
                container.querySelectorAll('.persona-tab').forEach(t => t.classList.remove('active'));
                container.querySelectorAll('.persona-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                container.querySelector(`.persona-content[data-persona="${targetPersona}"]`)?.classList.add('active');
                return;
            }

            const navBtn = e.target.closest('.sidebar-nav-btn[data-panel]');
            if (navBtn) {
                const layout = navBtn.closest('.sidebar-layout');
                if (!layout) return;
                const panelId = navBtn.getAttribute('data-panel');
                layout.querySelectorAll('.sidebar-nav-btn').forEach(b => b.classList.remove('active'));
                layout.querySelectorAll('.sidebar-panel').forEach(p => p.classList.remove('active'));
                navBtn.classList.add('active');
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
                setActiveStep(layout, parseInt(stepBtn.dataset.step));
                return;
            }

            const refBtn = e.target.closest('.sidebar-ref-btn[data-ref]');
            if (refBtn) {
                const layout = refBtn.closest('.sidebar-layout');
                if (!layout) return;
                showRefPanel(layout, refBtn.dataset.ref);
                return;
            }

            const nextBtn = e.target.closest('.next-step-btn');
            if (nextBtn) {
                const layout = nextBtn.closest('.sidebar-layout');
                if (!layout) return;
                setActiveStep(layout, parseInt(nextBtn.dataset.next));
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
            if (e.state && e.state.page) showPage(e.state.page, false);
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
