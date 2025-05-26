// Name attribute is not used in the code
// but is for dev purposes

/**
 * @type {{ name: string; type: "normal" | "rocket"; speed: number; scale: number; imageSource: string; }[]}
 */

const projectiles = [{
    name: "normal projectile",
    type: "normal",
    speed: 4,
    scale: 20,
    imageSource: "../src/media-files/projectiles/normal.png"
}, {
    name: "rockets",
    type: "rocket",
    speed: 3,
    scale: 25,
    imageSource: "../src/media-files/projectiles/rocket.png"
}];

export default projectiles;