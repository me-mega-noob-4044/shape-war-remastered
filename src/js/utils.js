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

export const styleNumberWithComma = (value) => {
    if (typeof value == "string") {
        console.log("Number cannot be styled: Value is a string!");
        return value;
    }

    return Math.round(value).toLocaleString();//
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