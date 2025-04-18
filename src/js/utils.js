import GameObject from "../../client/src/game/GameObject.js";
import Shape from "./shape.js";
import Skill from "./skill.js";

/**
 * @param {string} id 
 * @returns {HTMLElement}
 */

export const getElement = (id) => {
    return document.getElementById(id);
};

/**
 * @param {string} id 
 */

export const getSavedVal = (id) => {
    return localStorage.getItem(id);
};

/**
 * @param {string} id 
 * @param {string} value
 */

export const saveVal = (id, value) => {
    localStorage.setItem(id, value);
};

/**
 * @param {string} id 
 */

export const deleteVal = (id) => {
    localStorage.removeItem(id);
}

/**
 * @param {number} pilotTier 
 * @param {Skill} skill 
 * @param {number} pilotLevel 
 * @param {boolean} int 
 * @returns {number} cost
 */

export const getSkillCost = (pilotTier, skill, pilotLevel, int) => {
    let baseCost = 100;

    baseCost *= (1 + (pilotTier / 2));

    if (pilotTier >= 2) {
        baseCost += 750;
    }

    let skillCost = skill.tier * 250;
    let cost = Math.ceil(skillCost + baseCost);

    let times = 0;
    for (let i = 0; i < pilotLevel; i++) {
        times++;

        if (times < 3) {
            cost += 25;
        } else if (times < 5) {
            cost += 50;
        } else if (i == 6) {
            cost += 150;
        } else {
            cost += 75;
        }
    }

    return int ? cost : styleNumberWithComma(cost);
};

export const hexToRgb = (hex) => {
    hex = hex.replace(/^#/, "");

    if (hex.length === 3) {
        hex = hex.split("").map(function (h) {
            return h + h;
        }).join("");
    }

    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return r + "," + g + "," + b;
};

/**
 * @param {number} value 
 * @returns {string}
 */

export const abbreviateNumber = (value) => {
    if (value < 1e3) {
        return value;
    }
    if (value >= 1e9) {
        value = (Math.round(value / 1e7) / 100) + "B";
    } else if (value >= 1e6) {
        value = (Math.round(value / 1e4) / 100) + "M";
    } else if (value >= 1e3) {
        value = (Math.round(value / 10) / 100) + "K";
    }
    return value;
};

export const fixTo = (value, indx) => {
    return parseFloat(value.toFixed(indx));
};

/**
 * @param {number} value 
 * @returns {string}
 */

export const styleNumberWithSpace = (value) => {
    value = styleNumberWithComma(value);

    return value.split(",").join(" ");
};

/**
 * @param {number} value 
 * @returns {string}
 */

export const styleNumberWithComma = (value) => {
    if (typeof value == "string") {
        console.log("Number cannot be styled: Value is a string!");
        return value;
    }

    return Math.round(value).toLocaleString();
};

/**
 * @param {Shape | GameObject | { x: number, y: number }} start 
 * @param {Shape | GameObject | { x: number, y: number }} end 
 * @returns {number}
 */

export const getDistance = (start, end) => {
    return Math.hypot(start.y - end.y, start.x - end.x);
};

/**
 * @param {Shape | GameObject | { x: number, y: number }} start 
 * @param {Shape | GameObject | { x: number, y: number }} end 
 * @returns {number}
 */

export const getDirection = (start, end) => {
    return Math.atan2(start.y - end.y, start.x - end.x);
};

export const capitalizeFirstLetter = (string) => {
    return string[0].toUpperCase() + string.substring(1);
};

/**
 * @param {string} name 
 * @param {number} value 
 * @returns {string}
 */

export const droneStatAmount = (name, value) => {
    if (name == "On Mild Damage: Fix") {
        return styleNumberWithComma(value);
    } else if (name == "reload") {
        return `${(value / 1e3)} sec`;
    }
};

/**
 * @param {number} degrees 
 * @returns {number}
 */

export const randDirectionSpread = (degrees) => {
    let rand = Math.random() * (degrees / 2);
    rand = rand / 180 * Math.PI;

    return rand * (Math.random() > .5 ? -1 : 1);
};

/**
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */

export const randInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const formatMilliseconds = (ms) => {
    let minutes = Math.floor(ms / 60000);
    let seconds = Math.floor((ms % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * @param {number} recX 
 * @param {number} recY 
 * @param {number} recX2 
 * @param {number} recY2 
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @returns {boolean}
 */

export const lineInRect = function (recX, recY, recX2, recY2, x1, y1, x2, y2) {
    let minX = x1;
    let maxX = x2;

    if (x1 > x2) {
        minX = x2;
        maxX = x1;
    }
    if (maxX > recX2) maxX = recX2;
    if (minX < recX) minX = recX;
    if (minX > maxX) return false;

    let minY = y1;
    let maxY = y2;
    let dx = x2 - x1;

    if (Math.abs(dx) > 0.0000001) {
        let a = (y2 - y1) / dx;
        let b = y1 - a * x1;
        minY = a * minX + b;
        maxY = a * maxX + b;
    }

    if (minY > maxY) {
        let tmp = maxY;
        maxY = minY;
        minY = tmp;
    }

    if (maxY > recY2) maxY = recY2;
    if (minY < recY) minY = recY;
    if (minY > maxY) return false;

    return true;
};

export const damageIndicatorStyle = (val) => {
    if (val >= 1e9) {
        return Math.floor(val / 1e9) + "B"; // This is never going to happen lol
    } else if (val >= 1e6) {
        return Math.floor(val / 1e6) + "M";
    } else if (val >= 10e3) {
        return Math.floor(val / 1e3) + "K";
    } else if (val >= 1e3) {
        return (val / 1e3).toFixed(1) + "K";
    } else {
        return Math.floor(val);
    }
};

export const randFloat = (min, max) => {
    return Math.random() * (max - min) + min;
}
