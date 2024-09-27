const shapes = [{
    tier: 0,
    name: "Gray Circle",
    description: `
    Training shape for mastering the basics of combat.<br><br>
    Recommended Equipment: x2 Punisher
    `,
    aimTurnSpeed: 0.008,
    fovMulti: 1.4,
    scale: 55,
    indxRole: 1,
    speedData: {
        base: 0.0018,
        level: [0, 0, 0.0001, 0.0001, 0, 0.0001, 0.0001, 0, 0.0001, 0.0002, 0.0003, 0.0004]
    },
    mk2DataIncrease: 1.2,
    healthData: {
        base: 44e3,
        level: [0, 1e3, 1e3, 2e3, 2e3, 4e3, 4e3, 4e3, 4e3, 5e3, 8e3, 8e3]
    },
    color: "#808080",
    weaponHardpoints: {
        light: 2,
        medium: 0,
        heavy: 0
    },
    moduleHardpoints: {
        defense: 0,
        assault: 0,
        universal: 1
    },
    abilities: [],
    cost: {
        silver: 75e3,
        gold: 0
    }
}, {
    tier: 0,
    name: "Light Brown Circle",
    description: `
    Having 4 light weapon slots, this shape is extremely verstile. Fit for combay at any range.<br><br>
    Recommended Equipment: x4 Punisher
    `,
    aimTurnSpeed: 0.008,
    fovMulti: 1.45,
    scale: 65,
    indxRole: 1,
    speedData: {
        base: 0.0008,
        level: [0, 0, 0.0001, 0.0001, 0, 0, 0.0001, 0, 0.0001, 0, 0.0001, 0.0001]
    },
    mk2DataIncrease: 1.35,
    healthData: {
        base: 71e3,
        level: [0, 3e3, 3e3, 4e3, 4e3, 6e3, 6e3, 6e3, 8e3, 8e3, 11e3, 13e3]
    },
    color: "#c4a484",
    weaponHardpoints: {
        light: 4,
        medium: 0,
        heavy: 0
    },
    moduleHardpoints: {
        defense: 1,
        assault: 0,
        universal: 0
    },
    abilities: [],
    cost: {
        silver: 500e3,
        gold: 0
    }
}, {
    tier: 0,
    name: "Charcoal Circle",
    description: `
    Very small and fast shape. Jumping engines allows this shape to jump across obstacles.<br><br>
    Recommended Equipment: x1 Punisher T
    `,
    aimTurnSpeed: 0.008,
    fovMulti: 1.2,
    scale: 40,
    indxRole: 2,
    speedData: {
        base: 0.002,
        level: [0, 0, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0001, 0.0002, 0.0003, 0.0003]
    },
    mk2DataIncrease: 1.2,
    healthData: {
        base: 39e3,
        level: [0, 500, 500, 1e3, 1e3, 3e3, 3e3, 4e3, 4e3, 5e3, 6e3, 8e3]
    },
    color: "#302813",
    weaponHardpoints: {
        light: 0,
        medium: 1,
        heavy: 0
    },
    moduleHardpoints: {
        defense: 0,
        assault: 0,
        universal: 0
    },
    abilities: [{
        name: "Jump",
        description: "The shape jumps onto the air in an chosen direction, avoiding terrain and buildings.",
        imageSource: "../src/media-files/abilities/jump.png",
        reload: 5e3
    }],
    cost: {
        silver: 75e3,
        gold: 0
    }
}];

const weapons = [{
    tier: 0,
    industryName: "Circle",
    name: "Punisher",
    type: "light",
    projType: "normal",
    description: "Multi-barreled machine gun with a high rate of fire. Great at close range.",
    damageData: {
        base: 160,
        level: [0, 20, 20, 20, 20, 20, 30, 30, 30, 40, 40, 40]
    },
    attributes: ["Kinetic", "Manual", "Automatic", "Magazine"],
    mothershipChargeRate: 0.000125,
    mk2DataIncrease: 1.2,
    imageSource: "../src/media-files/weapons/punisher.png",
    ammo: 220,
    fireRate: 60,
    reload: 8e3,
    range: 1200,
    cost: {
        silver: 20e3,
        gold: 0
    }
}, {
    tier: 0,
    industryName: "Circle",
    name: "Molot",
    type: "light",
    projType: "normal",
    description: "Multi-barreled machine gun with a high rate of fire. Great at close range.",
    damageData: {
        base: 279,
        level: [0, 30, 30, 30, 40, 40, 40, 40, 40, 50, 60, 70]
    },
    attributes: ["Kinetic", "Manual", "Automatic", "Magazine"],
    mothershipChargeRate: 0.000125,
    mk2DataIncrease: 1.2,
    imageSource: "../src/media-files/weapons/molot.png",
    ammo: 70,
    fireRate: 145,
    reload: 8e3,
    range: 2600,
    cost: {
        silver: 20e3,
        gold: 0
    }
}, {
    tier: 0,
    industryName: "Circle",
    name: "Punisher T",
    type: "medium",
    projType: "normal",
    description: "Twin lightweight and fast firing machineguns. Most effective aganist enemies at close range.",
    damageData: {
        base: 260,
        level: [0, 30, 30, 40, 45, 45, 50, 50, 60, 65, 65, 80]
    },
    attributes: ["Kinetic", "Manual", "Automatic", "Magazine"],
    mothershipChargeRate: 0.000125,
    mk2DataIncrease: 1.2,
    imageSource: "../src/media-files/weapons/punisher_t.png",
    ammo: 220,
    fireRate: 60,
    reload: 8e3,
    range: 1200,
    cost: {
        silver: 30e3,
        gold: 0
    }
}];

// Defense, Assault, Universal

const modules = [{
    tier: 0,
    name: "Armor Kit",
    type: "Defense",
    description: "Basic armor plating, increases shape's durability",
    healthIncreaseData: {
        base: 0.02,
        level: [0, 0.01, 0.01, 0.01, 0.01, 0.01]
    },
    imageSource: "../src/media-files/modules/armor_kit.png",
    attributes: ["Affects Self", "Permanent"],
    cost: {
        silver: 50e3,
        gold: 0
    }
}];

const activeModules = [{
    tier: 0,
    typeOfObj: "module",
    name: "Repair Unit",
    type: "Active",
    description: "Restores a portion of robot's durability each second",
    regenData: {
        power: 0.05,
        rate: 1e3
    },
    imageSource: "../src/media-files/modules/repair_unit.png",
    attributes: ["Affects Self", "Manual activation", "Temporary", "Cooldown"],
    duration: 5e3,
    reload: 20e3,
    cost: 20
}, {
    tier: 0,
    typeOfObj: "module",
    name: "Advanced Repair Unit",
    type: "Active",
    description: "Restores a considerable portion of robot's durability each second",
    regenData: {
        power: 0.1,
        rate: 1e3
    },
    imageSource: "../src/media-files/modules/advanced_repair_unit.png",
    attributes: ["Affects Self", "Manual activation", "Temporary", "Cooldown"],
    duration: 4e3,
    reload: 20e3,
    cost: 40
}];

const pilots = [];

const drones = [{
    tier: 0,
    name: "Starter",
    industryName: "Circle",
    description: "",
    visualData: {
        name: "Circle",
        color: "#808080",
        scale: 25
    },
    abilities: [{
        name: "On Mild Damage: Fix",
        description: "If shape receives more than 70K damage within 5 secounds: instantly repairs durability.",
        statIcons: ["../src/media-files/icons/repair.png"],
        statTitles: ["Repairable Durability"],
        stats: [{
            base: 12e3,
            level: [0, 1e3, 2e3]
        }],
        attributes: ["Temporary", "Affects the shape"],
        reload: 5e3
    }],
    maxlevel: 3,
    cost: 10
}];

const motherships = [];

const turrets = [];

export default { shapes, weapons, modules, activeModules, pilots, drones, motherships, turrets };