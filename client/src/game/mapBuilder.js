import { buildings } from "../main.js";
import GameObject from "./GameObject.js";

export class Map {

    /**
     * @param {string} name 
     * @param {number} width 
     * @param {number} height 
     * @param {{ x: number, y: number }} firstSpawn 
     * @param {{ x: number, y: number  }} secondSpawn 
     */

    constructor(name, width, height, firstSpawn, secondSpawn) {
        this.name = name;
        this.width = width;
        this.height = height;
        this.locations = [firstSpawn, secondSpawn];
    }
}

/** @type {Map[]} */

export const maps = [
    new Map("Bastion", 8e3, 4e3, { x: 500, y: 2e3 }, { x: 7500, y: 2e3 })
];

export class MapBuilder {

    /** @type {GameObject[]} */

    static build() {
        let indx = Math.floor(Math.random() * maps.length);
        let map = maps[indx];

        if (indx == 0) {
            buildings.push(new GameObject("beacon", 1700, map.height * .75));
            buildings.push(new GameObject("beacon", map.width / 2, map.height * .25));
            buildings.push(new GameObject("beacon", map.width / 2, map.height * .75));
            buildings.push(new GameObject("beacon", 6300, map.height * .25));
            buildings.push(new GameObject("beacon", 7015, 3785));

            buildings.push(new GameObject("wall", map.width / 2 - 900, map.height / 2 - 150, 1800, 300));
            buildings.push(new GameObject("wall", 5100, 2600, 800, 800));
            buildings.push(new GameObject("wall", 5100, 0, 300, 1300));
            buildings.push(new GameObject("wall", 5400, 1700, 400, 400));
            buildings.push(new GameObject("wall", 1500, 0, 400, 2400));
            buildings.push(new GameObject("wall", 6315, 2600, 1350, 300));
            buildings.push(new GameObject("wall", 2708, 1087, 300, 300));

            buildings.push(new GameObject("healing beacon", 2500, 350, 0, 0, 450, 1e3));
            buildings.push(new GameObject("healing beacon", 5250, 3750, 0, 0, 550, 3e3));
            buildings.push(new GameObject("healing beacon", 55, 4e3, 0, 0, 550, 3e3));
        }

        return map;
    }
}