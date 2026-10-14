// The Field Guide to Growth & Impact — App initialization
// Loads manifest, initializes all modules, handles initial route.
(function() {
    'use strict';

    const G = window.FieldGuide = window.FieldGuide || {};

    async function init() {
        try {
            const response = await fetch('manifest.json?_t=' + Date.now());
            if (!response.ok) throw new Error(`Failed to load manifest: ${response.status}`);
            G.manifest = await response.json();

            G.populateNavDropdowns();
            G.populateFooter();
            G.initNavigation();
            G.initInteractivePatterns();
            G.initDarkMode();

            const hash = window.location.hash.slice(1) || 'home';
            const [pageId, sectionId] = hash.split('/');
            await G.navigateTo(pageId, false, sectionId);
        } catch (error) {
            console.error('Failed to initialize app:', error);
            document.body.innerHTML = '<div class="container"><h1>Error</h1><p>Failed to load application. Please refresh.</p></div>';
        }
    }

    document.addEventListener('DOMContentLoaded', init);
})();
