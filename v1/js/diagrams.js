// SVG diagram rendering (data-driven from manifest)
(function(G) {
    'use strict';

    let svgColorsCache = null;

    function getSvgColors() {
        if (svgColorsCache) return svgColorsCache;
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
        return getSvgColors()[personaId] || '#888';
    }

    function renderCapabilityRadar() {
        const svg = document.getElementById('capability-radar');
        if (!svg || svg.querySelector('circle')) return;

        const colors = getSvgColors();
        const cx = 250, cy = 200, maxRadius = 150, levels = 5;

        const capabilities = G.manifest.capabilities.map(id => G.manifest.pages[`capability-${id}`]);
        const angleStep = 360 / capabilities.length;

        const labels = capabilities.map((cap, i) => ({
            name: cap.name.replace(' & ', '\n& ').replace('Mentorship & Talent Growth', 'Mentorship &\nTalent Growth'),
            angle: -90 + (i * angleStep)
        }));

        let html = '';

        for (let i = 1; i <= levels; i++) {
            const r = (maxRadius / levels) * i;
            html += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${colors.border}" stroke-width="1"/>`;
        }

        labels.forEach(label => {
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
                html += `<text x="${labelX}" y="${startY + lineIndex * lineHeight}" text-anchor="middle" font-size="12" fill="${colors.textSecondary}">${line}</text>`;
            });
        });

        const sampleValues = [0.7, 0.5, 0.65, 0.4, 0.55];
        let points = '';
        labels.forEach((label, index) => {
            const angleRad = (label.angle * Math.PI) / 180;
            const r = maxRadius * sampleValues[index];
            points += `${cx + r * Math.cos(angleRad)},${cy + r * Math.sin(angleRad)} `;
        });
        html += `<polygon points="${points.trim()}" fill="${colors.accent}" fill-opacity="0.15" stroke="${colors.accent}" stroke-width="2"/>`;

        labels.forEach((label, index) => {
            const angleRad = (label.angle * Math.PI) / 180;
            const r = maxRadius * sampleValues[index];
            html += `<circle cx="${cx + r * Math.cos(angleRad)}" cy="${cy + r * Math.sin(angleRad)}" r="5" fill="${colors.accent}"/>`;
        });

        svg.innerHTML = html;
    }

    function renderImpactRings() {
        const svg = document.getElementById('impact-rings');
        if (!svg || svg.querySelector('circle')) return;

        const colors = getSvgColors();
        const cx = 200, cy = 200;

        const foundationIds = G.manifest.personaGroups.foundation || [];
        const teamIds = G.manifest.personaGroups.team || [];
        const orgIds = G.manifest.personaGroups.org || [];

        function splitByTrack(ids) {
            const mgmtId = ids.find(id => G.manifest.pages[`persona-${id}`]?.track !== 'ic');
            const icId = ids.find(id => G.manifest.pages[`persona-${id}`]?.track === 'ic');
            return { mgmt: mgmtId, ic: icId };
        }

        const teamLevelPair = splitByTrack(teamIds);
        const orgLevelPair = splitByTrack(orgIds);
        const baseRadius = 32, radiusStep = 24;

        const foundationRings = foundationIds.map((id, i) => {
            const p = G.manifest.pages[`persona-${id}`];
            return { id, name: p.name, scope: p.scope.replace(' impact', ''), radius: baseRadius + (i * radiusStep), color: getPersonaColor(id) };
        });

        const teamLevelRadius = baseRadius + (foundationIds.length * radiusStep);
        const orgLevelRadius = baseRadius + ((foundationIds.length + 1) * radiusStep);

        const teamMgmt = teamLevelPair.mgmt ? G.manifest.pages[`persona-${teamLevelPair.mgmt}`] : null;
        const teamIc = teamLevelPair.ic ? G.manifest.pages[`persona-${teamLevelPair.ic}`] : null;
        const orgMgmt = orgLevelPair.mgmt ? G.manifest.pages[`persona-${orgLevelPair.mgmt}`] : null;
        const orgIc = orgLevelPair.ic ? G.manifest.pages[`persona-${orgLevelPair.ic}`] : null;

        let html = '';

        const personasPage = G.manifest.pages['personas'] || {};
        const diagramTitle = personasPage.diagram_title || '';
        const diagramSubtitle = personasPage.diagram_subtitle || '';
        const diagramFooter = personasPage.diagram_footer || '';

        html += `<text x="290" y="28" text-anchor="middle" font-size="13" fill="${colors.text}" font-weight="600" font-family="Inter, sans-serif">${G.escapeHtml(diagramTitle).toUpperCase()}</text>`;
        html += `<text x="290" y="46" text-anchor="middle" font-size="11" fill="${colors.textMuted}" font-family="Inter, sans-serif">${G.escapeHtml(diagramSubtitle)}</text>`;

        const teamColor = getPersonaColor(teamLevelPair.mgmt);
        html += `<circle cx="${cx}" cy="${cy}" r="${teamLevelRadius}" fill="${teamColor}" fill-opacity="0.08" stroke="${teamColor}" stroke-width="2" stroke-dasharray="8,4"/>`;
        const orgColor = getPersonaColor(orgLevelPair.mgmt);
        html += `<circle cx="${cx}" cy="${cy}" r="${orgLevelRadius}" fill="${orgColor}" fill-opacity="0.08" stroke="${orgColor}" stroke-width="2" stroke-dasharray="8,4"/>`;

        for (let i = foundationRings.length - 1; i >= 0; i--) {
            const ring = foundationRings[i];
            html += `<circle cx="${cx}" cy="${cy}" r="${ring.radius}" fill="${ring.color}" fill-opacity="0.12" stroke="${ring.color}" stroke-width="2.5"/>`;
        }

        const labelX = 400;
        const foundationLabelYPositions = [100, 145, 190];
        foundationRings.forEach((ring, index) => {
            const ringX = cx + ring.radius, ringY = cy;
            const labelY = foundationLabelYPositions[index], bendX = 350;
            html += `<path d="M ${ringX} ${ringY} L ${bendX} ${ringY} L ${bendX} ${labelY} L ${labelX - 8} ${labelY}" fill="none" stroke="${ring.color}" stroke-width="1.5" stroke-opacity="0.5"/>`;
            html += `<circle cx="${ringX}" cy="${ringY}" r="4" fill="${ring.color}"/>`;
            html += `<circle cx="${labelX - 8}" cy="${labelY}" r="3" fill="${ring.color}"/>`;
            html += `<text x="${labelX}" y="${labelY - 5}" text-anchor="start" font-size="13" fill="${ring.color}" font-weight="600" font-family="Inter, sans-serif">${ring.name}</text>`;
            html += `<text x="${labelX}" y="${labelY + 10}" text-anchor="start" font-size="10" fill="${colors.textMuted}" font-family="Inter, sans-serif">${ring.scope}</text>`;
        });

        const teamLabelY = 240, teamRingX = cx + teamLevelRadius;
        html += `<path d="M ${teamRingX} ${cy} L 350 ${cy} L 350 ${teamLabelY} L ${labelX - 8} ${teamLabelY}" fill="none" stroke="${teamColor}" stroke-width="1.5" stroke-opacity="0.5"/>`;
        html += `<circle cx="${teamRingX}" cy="${cy}" r="4" fill="${teamColor}"/>`;
        html += `<circle cx="${labelX - 8}" cy="${teamLabelY}" r="3" fill="${teamColor}"/>`;
        html += `<text x="${labelX}" y="${teamLabelY - 5}" text-anchor="start" font-size="13" font-weight="600" font-family="Inter, sans-serif"><tspan fill="${getPersonaColor(teamLevelPair.mgmt)}">${teamMgmt.name}</tspan><tspan fill="${colors.textMuted}"> / </tspan><tspan fill="${getPersonaColor(teamLevelPair.ic)}">${teamIc.name}</tspan></text>`;
        html += `<text x="${labelX}" y="${teamLabelY + 10}" text-anchor="start" font-size="10" fill="${colors.textMuted}" font-family="Inter, sans-serif">Team-level</text>`;

        const orgLabelY = 290, orgRingX = cx + orgLevelRadius;
        html += `<path d="M ${orgRingX} ${cy} L 350 ${cy} L 350 ${orgLabelY} L ${labelX - 8} ${orgLabelY}" fill="none" stroke="${orgColor}" stroke-width="1.5" stroke-opacity="0.5"/>`;
        html += `<circle cx="${orgRingX}" cy="${cy}" r="4" fill="${orgColor}"/>`;
        html += `<circle cx="${labelX - 8}" cy="${orgLabelY}" r="3" fill="${orgColor}"/>`;
        html += `<text x="${labelX}" y="${orgLabelY - 5}" text-anchor="start" font-size="13" font-weight="600" font-family="Inter, sans-serif"><tspan fill="${getPersonaColor(orgLevelPair.mgmt)}">${orgMgmt.name}</tspan><tspan fill="${colors.textMuted}"> / </tspan><tspan fill="${getPersonaColor(orgLevelPair.ic)}">${orgIc.name}</tspan></text>`;
        html += `<text x="${labelX}" y="${orgLabelY + 10}" text-anchor="start" font-size="10" fill="${colors.textMuted}" font-family="Inter, sans-serif">Org-level</text>`;

        html += `<text x="290" y="345" text-anchor="middle" font-size="10" fill="${colors.textMuted}" font-family="Inter, sans-serif"><tspan fill="${teamLevelPair.mgmt ? getPersonaColor(teamLevelPair.mgmt) : colors.textMuted}">TL Track</tspan><tspan> / </tspan><tspan fill="${teamLevelPair.ic ? getPersonaColor(teamLevelPair.ic) : colors.textMuted}">IC Track</tspan></text>`;
        html += `<text x="290" y="365" text-anchor="middle" font-size="10" fill="${colors.textMuted}" font-style="italic" font-family="Inter, sans-serif">${G.escapeHtml(diagramFooter)}</text>`;

        svg.innerHTML = html;
    }

    function refreshSvgDiagrams() {
        svgColorsCache = null;
        const radar = document.getElementById('capability-radar');
        if (radar) { radar.innerHTML = ''; renderCapabilityRadar(); }
        const rings = document.getElementById('impact-rings');
        if (rings) { rings.innerHTML = ''; renderImpactRings(); }
    }

    G.getPersonaColor = getPersonaColor;
    G.renderCapabilityRadar = renderCapabilityRadar;
    G.renderImpactRings = renderImpactRings;
    G.refreshSvgDiagrams = refreshSvgDiagrams;

})(window.FieldGuide = window.FieldGuide || {});
