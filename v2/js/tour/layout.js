// The valley's map: every place, path, camera shot and fog-of-war state, by name, so chapters
// refer to places rather than numbers and the world builds itself from the same coordinates.
//
// Coordinates are metres on the ground as [x, z]: +x is east, -z is north (the default camera looks
// north). Facing angles are degrees clockwise from north seen from above: 0 north, 90 east, 180
// south, 270 west. The playable valley is 140 x 140 m (x and z from -70 to 70); the terrain runs
// on past it under the fog.

export const MAP = { half: 70, terrainHalf: 110 };
export const WATER_Y = -0.55;

// ---- Places ------------------------------------------------------------------------------------

export const places = {
    // Camp, south-west: where the explorer starts.
    tent: [-45.6, 39.8],
    campfire: [-41.2, 41.6],
    camp: [-43.4, 40.4],             // just outside the tent's mouth, where the explorer steps out
    crossroads: [-28, 25],
    stoneRing: [-33, 7],             // centre of the ring, on top of a low hill
    lake: [-18, -9],                 // centre of the lake
    lakeShore: [-14.6, -1.7],        // where the explorer stands to see their reflection
    noticeBoard: [-3.6, 9],          // the board itself; it faces west, towards the path
    noticeBoardFront: [-5.9, 9.3],   // where a reader stands
    square: [5, 4],                  // centre of the village square (the fountain)
    plot: [-19, 21.5],               // your plot
    plotWork: [-19.5, 21],           // where the explorer kneels to work it
    neighbours: [[-19, 30.5], [-9.5, 29.5]],
    neighbourWork: [-18.5, 30.2],
    market: [14, 3],
    workbench: [18.6, 3.6],
    watermill: [21, -19.4],          // the mill house, on the river's north bank
    millWheel: [21, -14.7],          // its wheel, turning in the river on the side facing the camera
    cart: [10.8, -2.6],
    houses: [-3, 17],                // the People & Team houses
    garden: [-7, 23.2],
    bridge: [6, -11.6],
    hamlet: [12, -33],
    windmill: [-15, -38],
    fire: [1.2, 7.8],                // the evening fire in the square's south-west corner
    fireSeat: [-0.4, 6.3],           // where the explorer sits by it, facing the fire
};

// Lake: an ellipse. River: a polyline the water follows, with its half-width. Creek: feeds the lake.
export const lake = { x: -18, z: -9, rx: 10.5, rz: 6.6 };
export const river = {
    halfWidth: 2.7,
    points: [[-9.5, -9.4], [-3, -10.8], [6, -11.6], [14, -11.2], [22, -12.6], [32, -15.2], [44, -13.4], [56, -15.6], [72, -18.5], [100, -20]],
};
export const creek = {
    halfWidth: 1.5,
    points: [[-62, -78], [-52, -58], [-43, -44], [-35, -31], [-28, -19], [-23, -13]],
};

// Hills (Gaussian bumps): [x, z, height, radius].
export const hills = [
    [-33, 7, 3.4, 10],        // the stone ring's hill
    [-15, -38, 6.5, 14],      // windmill hill
    [-58, -12, 5, 18],        // west ridge
    [48, 30, 4, 20],          // south-east downs
    [55, -48, 7, 22],         // north-east heights
    [-30, -62, 6, 20],
    [20, 58, 3, 18],
];

// Flat ground for buildings: [x, z, radius]; the terrain eases to the height at the centre.
export const flats = [
    [5, 5, 15], [17, 1, 9], [21, -19.5, 6.5], [-3, 18, 11], [-19, 25, 11], [-43, 40, 7], [12, -33, 11], [-15, -38, 5], [-33, 7, 6.5],
];

// ---- Paths -------------------------------------------------------------------------------------

// Walkable paths by name, as [x, z] points. person.walk('campToCrossroads', k) follows one.
export const paths = {
    tentExit: [[-45.5, 39.85], [-44.5, 40.2], [-43.4, 40.4]],
    arrivalSteps: [[-43.4, 40.4], [-42.5, 38.9], [-41.3, 37.1], [-39.8, 35.3]],
    campToCrossroads: [[-39.8, 35.3], [-36.4, 32.4], [-32, 28.6], [-28, 25]],
    crossroadsToRing: [[-28, 25], [-29.4, 19.2], [-31.4, 13.6], [-32.0, 12.0], [-32.6, 9.4], [-33, 7]],   // between two stones
    // out of the ring between two stones and along the north side of the house by the junction
    ringToBoard: [[-33, 7], [-30.4, 6.6], [-27.6, 6.3], [-25, 8.4], [-21, 9.4], [-17.2, 9.4], [-15.6, 8.4], [-11.4, 8.0], [-5.9, 9.3]],
    boardToLake: [[-5.9, 9.3], [-8, 5.2], [-11, 1.2], [-14.6, -1.7]],
    // round the west of the house by the junction and in through the plot's east gate
    lakeToPlot: [[-14.6, -1.7], [-13.3, 0.4], [-13.4, 3.2], [-15.6, 8.4], [-16.4, 11.5], [-16.4, 15.5], [-14.6, 17.0], [-13.5, 18.6], [-13.4, 20.6], [-14.1, 21.5], [-16.3, 21.4]],
    // the plot is fenced with its gate on the east side, so round its north side to the gate
    crossroadsToPlot: [[-28, 25], [-24.4, 23.0], [-24.6, 19.4], [-24.0, 17.6], [-21.6, 17.0], [-17, 17.2], [-13.6, 18.6], [-13.4, 20.6], [-14.1, 21.5], [-16.3, 21.4]],
    // out of the plot's east gate, down the track and in by the wheat field's south gate
    plotToNeighbour: [[-16.3, 21.4], [-14.1, 21.5], [-13.5, 22.6], [-13.9, 28.8], [-14.0, 33.4], [-15.0, 34.4], [-18.0, 34.3], [-18.0, 33.2], [-18.3, 31.6], [-18.5, 30.2]],
    // out of the plot's gate, along the strip between the garden and the pumpkins, up the lane between
    // the two People & Team houses and into the square
    plotToSquare: [[-16.3, 21.4], [-14.1, 21.5], [-13.6, 26.3], [-10.0, 26.1], [-5.0, 26.0], [-2.2, 25.6], [-2.2, 24.4], [-3.6, 22.6], [-3.6, 16.4], [-2.4, 14.4], [0.8, 11.0], [3.4, 6.4]],
    boardToSquare: [[-5.9, 9.3], [-1.2, 7.6], [2.6, 6.2]],
    squareToBoard: [[2.6, 6.2], [-1.2, 7.6], [-5.9, 9.3]],
    squareToMarket: [[3.4, 6.4], [8.6, 4.6], [12.2, 3.2]],
    marketToHouses: [[12.2, 3.2], [9.6, 9.6], [3.6, 13.8], [-2.2, 15.4]],
    housesToSquare: [[-2.2, 15.4], [0.8, 11], [3.4, 6.4]],
    squareToFire: [[3.4, 6.4], [1.6, 5.0], [-0.4, 6.3]],
    squareToBridge: [[4.6, -1.6], [5.6, -6.4], [6, -11.6], [6.4, -16]],
    bridgeToHamlet: [[6.4, -16], [8, -22], [10.8, -28], [12, -31]],
    cartRoute: [[10.8, -2.6], [8, -6.2], [6.2, -10], [6.4, -16], [8, -22]],
};

// Roads painted on the ground (dirt), with half-widths. The explorer's paths run along them.
export const roads = [
    { w: 1.15, points: [[-44.2, 39.4], ...paths.campToCrossroads] },
    { w: 1.1, points: [...paths.crossroadsToRing, [-36, 3], [-40, -4]] },
    { w: 1.2, points: [[-28, 25], [-24.2, 23.2], [-20, 22.6]] },
    { w: 1.1, points: [[-28, 25], [-34, 26], [-44, 24], [-56, 26], [-70, 23]] },        // the west track, into the fog
    { w: 1.15, points: [[-33, 7], [-28, 8.4], [-21, 9.9], [-13, 10.4], [-6.5, 9.5], [-1.2, 7.6], [1.5, 6.5]] },
    { w: 1.0, points: paths.boardToLake },
    { w: 0.9, points: [[-13, 4], [-15, 10.4], [-17.2, 16], [-19.5, 18.4]] },
    { w: 1.0, points: [[-15, 22], [-14.4, 27.8], [-15, 33], [-14, 40]] },
    { w: 1.0, points: [[-12.5, 15.6], [-6.5, 12], [-0.5, 8.4]] },
    { w: 1.3, points: [[8, 4.6], [12.2, 3.2], [17, 2.4], [26, 1], [38, 4], [52, 2], [70, 6]] },  // the east road
    { w: 1.0, points: paths.marketToHouses },
    { w: 1.3, points: [[5, -1.6], [5.6, -6.4], [6, -9]] },
    { w: 1.2, points: [[6.2, -14], [6.4, -16], [8, -22], [10.8, -28], [12, -31], [13, -36], [12, -46], [10, -70]] },
    { w: 1.0, points: [[11, -30], [2, -33], [-6, -35], [-12, -37.5]] },                  // up windmill hill
    { w: 1.0, points: [[13, -32], [24, -30], [34, -27], [46, -30], [70, -28]] },
    { w: 1.1, points: [[4, 11], [3, 16], [1, 24], [-2, 34], [-6, 48], [-8, 70]] },        // south road
    { w: 0.9, points: [[6.4, -16.4], [12, -17.6], [17.4, -18.6]] },
];

// ---- Buildings and props -------------------------------------------------------------------------

// Houses: centre, facing (the door's side), w cells along the ridge, d cells deep, floors, stone,
// roof colour. One cell is 3 m.
export const houses = [
    // People & Team (south-west of the square)
    { at: [-7.5, 18.6], facing: 180, w: 2, d: 2, floors: 1, roof: 'terracotta' },
    { at: [1.8, 19.8], facing: 180, w: 3, d: 2, floors: 2, roof: 'brown' },
    { at: [-13.2, 12.6], facing: 90, w: 2, d: 1, floors: 1, roof: 'slate' },
    { at: [13.6, 21.6], facing: 225, w: 2, d: 2, floors: 1, roof: 'terracotta', stone: true },
    // Building Sahaj: the hall on the square's north side
    { at: [-2.4, -3.8], facing: 160, w: 3, d: 2, floors: 2, roof: 'slate', stone: true },
    // Client & Delivery (east): the mill and a store
    { at: [21, -19.4], facing: 270, w: 2, d: 2, floors: 2, roof: 'brown', stone: true, mill: true },
    { at: [20.6, 10.6], facing: 270, w: 2, d: 2, floors: 1, roof: 'terracotta' },
    { at: [15.4, -3.4], facing: 225, w: 1, d: 1, floors: 1, roof: 'brown' },
    // The wider hamlet across the river
    { at: [7.2, -36.2], facing: 135, w: 2, d: 2, floors: 1, roof: 'terracotta' },
    { at: [16.8, -37.2], facing: 200, w: 3, d: 2, floors: 2, roof: 'slate' },
    { at: [23.4, -28.6], facing: 250, w: 2, d: 1, floors: 1, roof: 'brown' },
    { at: [5, -27.6], facing: 90, w: 1, d: 1, floors: 1, roof: 'terracotta', stone: true },
    // Farms on the edges
    { at: [40, 8.6], facing: 180, w: 2, d: 2, floors: 1, roof: 'brown' },
    { at: [-4, 42], facing: 90, w: 2, d: 1, floors: 1, roof: 'terracotta' },
    { at: [36, -33], facing: 180, w: 2, d: 2, floors: 1, roof: 'terracotta', stone: true },
];

// Crop plots: centre, size (w along x, d along z), crop, fenced, and rotation in degrees.
export const plots = [
    { id: 'plot', at: [-19, 21.5], w: 8, d: 6, crop: 'leafs', fence: true, gate: 'east' },
    { id: 'neighbourA', at: [-19, 30.6], w: 8, d: 5, crop: 'wheat', fence: true },
    { id: 'neighbourB', at: [-9.4, 29.6], w: 7, d: 5, crop: 'pumpkin', fence: true },
    { id: 'garden1', at: [-7, 23.6], w: 5, d: 3, crop: 'carrot', fence: true },
    { id: 'garden2', at: [2, 25], w: 6, d: 3, crop: 'leafs', fence: true },
    { id: 'field1', at: [28, -42], w: 16, d: 10, crop: 'wheat' },
    { id: 'field2', at: [-2, -50], w: 12, d: 9, crop: 'corn' },
    { id: 'field3', at: [44, 16], w: 14, d: 9, crop: 'corn' },
    { id: 'field4', at: [-30, 45], w: 10, d: 7, crop: 'wheat' },
    { id: 'field5', at: [46, -20], w: 10, d: 8, crop: 'pumpkin' },
];

// Area districts: where each area's banners stand (x, z, facing).
export const districts = {
    cd: { name: 'Client & Delivery', centre: [16, 2], banners: [[11.6, -4.6, 200], [17.4, -1.2, 250], [18.4, 7.4, 270], [11.6, 8.2, 160]] },
    pt: { name: 'People & Team', centre: [-3, 18], banners: [[-3.4, 14.6, 180], [5.6, 15.2, 180], [-10.8, 17, 120], [-1.6, 22.6, 180]] },
    oc: { name: 'Building Sahaj', centre: [5, 4], banners: [[2.4, -0.8, 170], [9.6, -1.4, 200], [11.4, 9.2, 200], [-1.4, 9.6, 160]] },
};

// Market stalls and other village props: [name, x, z, facing].
export const village = {
    stalls: [['stall-green', 13.4, 0.2, 270], ['stall-red', 14.2, 6.4, 270], ['stall', 10.6, 10.6, 200]],
    lanterns: [[-0.8, 2.8], [10.8, 2.6], [8.8, 10.2], [4.4, 11.8], [-5.6, 12.2], [6.6, -1.8], [6.8, -14.8], [13.8, -31]],
    ratingFlags: [[6.6, 9.4], [8.8, 7.9], [10.1, 5.4]],
};

// ---- Landmarks (world.discover) ------------------------------------------------------------------

// What world.discover(name) names in the toast, and where its little flag goes up.
export const landmarks = {
    camp: { label: 'Your camp', flag: [-46.6, 37.4] },
    crossroads: { label: 'The crossroads', flag: [-26.2, 26.4] },
    stoneRing: { label: 'The stone ring', flag: [-27.9, 0.8] },
    noticeBoard: { label: 'The notice board', flag: [-3.2, 11.6] },
    lake: { label: 'The still lake', flag: [-12.6, -2.4] },
    plot: { label: 'Your plot', flag: [-23.4, 18.2] },
    neighbours: { label: "Your neighbours' plots", flag: [-23.4, 28.2] },
    village: { label: 'The village', flag: [-0.6, 0.6] },
    market: { label: 'The market', flag: [16.6, -1.6] },
    houses: { label: 'The houses', flag: [-11, 21.6] },
    bridge: { label: 'The bridge', flag: [8.8, -15] },
    hamlet: { label: 'The hamlet beyond the river', flag: [10, -30.6] },
    windmill: { label: 'The windmill', flag: [-11.6, -35] },
};

// ---- Camera shots ------------------------------------------------------------------------------

// target [x, y, z]; distance in metres; yaw: where the camera stands around the target, degrees
// (0 south of it looking north, 90 east of it looking west); pitch: degrees down from level.
const game = { pitch: 50, fov: 28 };
export const SHOTS = {
    overview: { target: [-3, 0, 5], distance: 205, yaw: 6, pitch: 60, fov: 28 },
    close: { target: [-2, 0, 2], distance: 225, yaw: 8, pitch: 62, fov: 28 },
    arrivalHigh: { target: [-32, 0, 22], distance: 128, yaw: 16, pitch: 58, fov: 28 },
    start: { target: [-42.6, 0.6, 38.4], distance: 40, yaw: 16, ...game },
    camp: { target: [-41.6, 0.8, 37.2], distance: 34, yaw: 18, ...game },
    campClose: { target: [-43.4, 1.0, 38.6], distance: 12.5, yaw: 24, pitch: 24, fov: 30 },
    crossroads: { target: [-28.6, 0.6, 24.6], distance: 32, yaw: 14, ...game },
    stoneRing: { target: [-33, 3.2, 7.4], distance: 36, yaw: 10, ...game },
    stoneRingHigh: { target: [-28, 3, 4], distance: 78, yaw: 10, pitch: 58, fov: 28 },
    noticeBoard: { target: [-4.6, 1.4, 9.2], distance: 17, yaw: 228, pitch: 30, fov: 30 },
    noticeBoardClose: { target: [-3.7, 1.7, 9.05], distance: 5.6, yaw: 262, pitch: 10, fov: 30 },
    lake: { target: [-14.8, 0.6, -2.6], distance: 11.5, yaw: 172, pitch: 7, fov: 32 },
    lakeHigh: { target: [-16, 0, -5], distance: 42, yaw: 10, ...game },
    plot: { target: [-19, 0.6, 22], distance: 24, yaw: 14, ...game },
    neighbours: { target: [-16, 0.6, 26.4], distance: 38, yaw: 14, ...game },
    village: { target: [3, 0.6, 7], distance: 96, yaw: 14, pitch: 55, fov: 28 },
    square: { target: [5.4, 0.6, 4.4], distance: 48, yaw: 12, pitch: 49, fov: 28 },
    market: { target: [16, 0.6, 1], distance: 32, yaw: 34, pitch: 46, fov: 28 },
    houses: { target: [-2.6, 0.6, 17.6], distance: 32, yaw: -14, pitch: 46, fov: 28 },
    bridge: { target: [6, 0, -13], distance: 36, yaw: 20, ...game },
    wider: { target: [4, 2, -30], distance: 92, yaw: 8, pitch: 54, fov: 28 },
    fire: { target: [0.9, 1.3, 7.4], distance: 12.5, yaw: 56, pitch: 13, fov: 32 },
    grown: { target: [2, 0, 6], distance: 168, yaw: 10, pitch: 61, fov: 28 },     // over the Team ring, the explorer's reach after Growth
};

// ---- Reach: the four scopes as rings on the map --------------------------------------------------

// Each scope is a circle on the map: Direct round the explorer's own plot, Extended taking in the
// neighbours' plots, the houses, the notice board and the square's fire, Team the whole village (its
// three districts in three arcs: Building Sahaj north, Client & Delivery east, People & Team south
// and west), Wider the valley across the river. Each lies wholly inside the next. The fog is lifted
// only as far as the explorer's own reach: Extended after Scopes, Team after Growth.
export const SCOPE_RINGS = {
    direct: { name: 'Direct', c: [-19, 21.5], r: 6.5 },
    extended: { name: 'Extended', c: [-8, 18], r: 22 },
    team: { name: 'Team', c: [2, 8], r: 39, arcs: { oc: [290, 45], cd: [45, 150], pt: [150, 290] } },
    wider: { name: 'Wider', c: [0, 0], r: 60 },
};
const LIFT = 3;           // the fog lifts a little beyond a ring, so the ring sits in clear land
const disc = ({ c, r }) => ({ x: c[0], z: c[1], r: r + LIFT });

// ---- Fog of war ------------------------------------------------------------------------------

// Cumulative reveals at the end of each chapter. Fog lifts for reach only, never for discovery: the
// principles are found under the shroud (lit up for a moment, not uncovered).
const R = (x, z, r) => ({ x, z, r });
const start = [R(-43.4, 39.6, 9)];
const afterArrival = [...start, R(-38.8, 34.4, 8.5)];
const afterPrinciples = afterArrival;
// the lit pool round the lake shore as Principles ends (a moment's light, not reach; Scopes lets it go)
const lakeLit = [...afterArrival, R(-15.6, -2.4, 6.5)];
const afterScopes = [...afterArrival, disc(SCOPE_RINGS.direct), disc(SCOPE_RINGS.extended)];
const afterGrowth = [...afterScopes, disc(SCOPE_RINGS.team)];
const final = afterGrowth;
// Scopes' "Wider" beat: the whole valley for a moment
const scopeWider = [...afterScopes, disc(SCOPE_RINGS.team), disc(SCOPE_RINGS.wider)];

export const REVEALS = {
    start, afterArrival, afterPrinciples, lakeLit, afterScopes,
    afterAreas: afterScopes, afterExpectations: afterScopes, afterFeedback: afterScopes,
    afterSelfAssessment: afterScopes, afterGrowth, final, scopeWider,
};

// ---- Chapter boundaries ------------------------------------------------------------------------

// Where each chapter leaves things, so the next one starts from the same frame.
// shot: a SHOTS name; explorer: where they stand and which way they face; hours: time of day.
export const states = {
    start: { shot: 'start', explorer: { at: places.camp, facing: 45 }, reveals: start, hours: 7.4 },
    afterArrival: { shot: 'camp', explorer: { at: paths.arrivalSteps.at(-1), facing: 41 }, reveals: afterArrival, hours: 7.8 },
    afterPrinciples: { shot: 'lake', explorer: { at: places.lakeShore, facing: 340 }, reveals: lakeLit, hours: 10 },
    afterScopes: { shot: 'village', explorer: { at: places.neighbourWork, facing: 20 }, reveals: afterScopes, hours: 11 },
    afterAreas: { shot: 'square', explorer: { at: [3.4, 6.4], facing: 20 }, reveals: afterScopes, hours: 12 },
    afterExpectations: { shot: 'noticeBoard', explorer: { at: places.noticeBoardFront, facing: 90 }, reveals: afterScopes, hours: 13 },
    afterFeedback: { shot: 'square', explorer: { at: [3.4, 6.4], facing: 160 }, reveals: afterScopes, hours: 17.6 },
    afterSelfAssessment: { shot: 'fire', explorer: { at: places.fireSeat, facing: 133 }, reveals: afterScopes, hours: 19 },
    afterGrowth: { shot: 'grown', explorer: { at: [7.0, 1.0], facing: 340 }, reveals: afterGrowth, hours: 8 },
    end: { shot: 'close', explorer: { at: [7.0, 1.0], facing: 340 }, reveals: final, hours: 9 },
};
