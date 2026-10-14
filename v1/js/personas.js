// Persona helper utilities
(function(G) {
    'use strict';

    function isIcTrack(personaId) {
        const page = G.manifest.pages[`persona-${personaId}`];
        return page?.track === 'ic';
    }

    function isTechLeadershipTrack(personaId) {
        const page = G.manifest.pages[`persona-${personaId}`];
        return !isIcTrack(personaId) && (page?.group === 'team' || page?.group === 'org');
    }

    function getScopeWithTrack(personaId, scope) {
        if (isIcTrack(personaId)) return `${scope} (IC Track)`;
        if (isTechLeadershipTrack(personaId)) return `${scope} (TL Track)`;
        return scope;
    }

    function getPersonaBorderStyle(personaId, color) {
        if (isIcTrack(personaId)) return '';
        return `border-left: 4px solid ${color};`;
    }

    function getPersonaBorderClass(personaId) {
        if (isIcTrack(personaId)) return `ic-track-border persona-${personaId}-border`;
        return '';
    }

    G.isIcTrack = isIcTrack;
    G.isTechLeadershipTrack = isTechLeadershipTrack;
    G.getScopeWithTrack = getScopeWithTrack;
    G.getPersonaBorderStyle = getPersonaBorderStyle;
    G.getPersonaBorderClass = getPersonaBorderClass;

})(window.FieldGuide = window.FieldGuide || {});
