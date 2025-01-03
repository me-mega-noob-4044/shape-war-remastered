const shapes = [{
    tier: 0,
    name: "Gray Circle",
    description: `
    Training shape for mastering the basics of combat.<br><br>
    Recommended Equipment: x2 Punisher
    `,
    aimTurnSpeed: .008,
    fovMulti: 1.35,
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
    aimTurnSpeed: 0.006,
    fovMulti: 1.6,
    scale: 65,
    indxRole: 1,
    speedData: {
        base: 0.0016,
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
    fovMulti: 1.15,
    scale: 40,
    indxRole: 2,
    speedData: {
        base: 0.0032,
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
    description: "Multi-barreled machine gun with a high rate of fire. Great at close range.",
    damageData: {
        base: 160,
        level: [0, 20, 20, 20, 20, 20, 30, 30, 30, 40, 40, 40]
    },
    projectileId: 0,
    spread: 10,
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
    description: "Multi-barreled machine gun with a high rate of fire. Great at close range.",
    damageData: {
        base: 279,
        level: [0, 30, 30, 30, 40, 40, 40, 40, 40, 50, 60, 70]
    },
    projectileId: 0,
    spread: 7,
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
    description: "Twin lightweight and fast firing machineguns. Most effective aganist enemies at close range.",
    damageData: {
        base: 260,
        level: [0, 30, 30, 40, 45, 45, 50, 50, 60, 65, 65, 80]
    },
    projectileId: 0,
    spread: 10,
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

// main = data that is displayed

const skills = [{
    tier: 1,
    name: "Armor Expert",
    description: "Increases the maximum durability of the shape.",
    imageSource: "../src/media-files/modules/armor_kit.png",
    main: "healthIncrease",
    healthIncrease: .07
}, {
    tier: 1,
    name: "Tough Guy",
    description: "Increases the maximum durability of the shape but reduces 12% of the shape's weapon damage.",
    imageSource: "../src/media-files/modules/armor_kit.png",
    main: "healthIncrease",
    healthIncrease: .12,
    dmgIncrease: -.12
}, {
    tier: 0,
    name: "Master Gunsmith",
    description: "Increases the damage output of all weapons mounted on the shape.",
    imageSource: "../src/media-files/modules/nuclear_reactor.png",
    main: "dmgIncrease",
    dmgIncrease: .07
}, {
    tier: 2,
    name: "Thrill Seeker",
    description: "Increases the damage output of all weapons but reduces the shape's durability by 12%.",
    imageSource: "../src/media-files/modules/nuclear_reactor.png",
    main: "dmgIncrease",
    dmgIncrease: .12,
    healthIncrease: .12
}];

// description = story

const pilots = [{
    tier: 0,
    name: "Harold",
    description: `
    Year 220.<br>
    Harold never imagined that, at the prime age of 45, he would be at the lowest of his life. Life had struck him hard&ndash;his once thriving business, which had been his pride and joy, collapsed under the weight of the war. But that wasn't what hurt the most. His family, friends, and siblings were being drafted into the endless battle, disappearing without a trace, never to be heard of again.<br><br>
    He wasn't unfamiliar with the military; he had served for a bit during his youth, back when the wars were more about political standing. He left that life behind, wanting to build something more stable, more free, and less bloodborne. But as the war grew, and the world spiraled deeper into chaos, his past came knocking back on his door. A letter arrived&ndash;a formal draft, cold and impersonal, calling him back into the life he had abandoned. This time however, he had been selected for a special top secret program that promised the conclusion of the war.<br><br>
    He stared at the letter for hours. He had nothing left to lose: his family was gone, his business became a financial leech, and everything around him had no future like the war&ndash;torn world around him. Maybe this program is the answer, he thought. The last chance to make sense of everything around him. Mixed with desperation and hope, he signed his acceptance without looking back.<br><br>
    He had no idea what the program truly had to offer. The instructions were vague, the instructors cold and clinical, but Harold pressed forward, wanting to end this war, the war that took the ones he loved away from him. Day after day, the drills became more intense, pushing him beyond his own limits. The purpose of the training was never fully revealed, he assumed that it was just another hard military training&ndash;until the day he was led into a hangar, staring up at the towering combat shapes.<br><br>
    It was then that the pieces started falling into place, he wasn't trained to fight like a traditional soldier. The program had prepared him to pilot these massive war machines. And while the government had promised that the program would end the war, he had soon realized the truth: other nations had their own “secret programs,” training their own soldiers to do the exact same thing he was.<br><br>
    This war was never going to end. It was just the beginning, and now, Harold is a part of it.
    `,
    imageSource: "../src/media-files/pilots-badges/harold.png",
    maxSkills: 3,
    cost: 100
}];

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

export default { shapes, weapons, modules, activeModules, pilots, skills, drones, motherships, turrets };