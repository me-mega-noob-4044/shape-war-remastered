import config from "./config.js";

export const getElement = (id) => {
    return document.getElementById(id);
};

export const getSavedVal = (id) => {
    return localStorage.getItem(id);
};

export const saveVal = (id, value) => {
    localStorage.setItem(id, value);
};

export const deleteVal = (id) => {
    localStorage.removeItem(id);
}

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
        hex = hex.split("").map(function(h) {
            return h + h;
        }).join("");
    }

    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return r + "," + g + "," + b;
};

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

export const styleNumberWithSpace = (value) => {
    value = styleNumberWithComma(value);

    return value.split(",").join(" ");
};

export const styleNumberWithComma = (value) => {
    if (typeof value == "string") {
        console.log("Number cannot be styled: Value is a string!");
        return value;
    }

    return Math.round(value).toLocaleString();
};

export const getDistance = (start, end) => {
    return Math.hypot(start.y - end.y, start.x - end.x);
};

export const getDirection = (start, end) => {
    return Math.atan2(end.y - start.y, end.x - start.x);
};

export const capitalizeFirstLetter = (string) => {
    return string[0].toUpperCase() + string.substring(1);
};

export const droneStatAmount = (name, value) => {
    if (name == "On Mild Damage: Fix") {
        return styleNumberWithComma(value);
    } else if (name == "reload") {
        return `${(value / 1e3)} sec`;
    }
};