const config = {
    gameUpdateRate: 20,
    gameUpdateSpeed: 1e3 / 20,
    maxScreenWidth: 1920,
    maxScreenHeight: 1080,
    tierColors: ["#d3d3d3", "#38b0f5", "#7702bf", "#fcdf00", "#fa0032"],
    droneCost: [0, 40, 60, 90, 100, 100, 100, 120, 120, 130, 140, 1],
    pilotCost: [0, 250, 500, 1e3, 2e3, 4e3, 8e3, 1],
    silverUpgrades: [{
        shapes: [0, 10e3, 20e3, 40e3, 200e3, 400e3, 800e3, 1.5e6, 3e6, 5e6, 8e6, 13e6],
        weapons: [0, 10e3, 20e3, 40e3, 200e3, 400e3, 800e3, 1e6, 1.5e6, 2e6, 2.5e6, 3e6],
        modules: [0, 200e3, 200e3, 200e3, 200e3, 200e3]
    }],
    silverUpgradesMK2: [{
        shapes: [0, 250e3, 500e3, 1e6, 3.75e6, 3.75e6, 3.75e6, 3.75e6, 3.75e6, 3.75e6, 3.75e6, 3.75e6],
        weapons: [0, 4e6, 4.5e6, 5e6, 5.5e6, 6e6, 6.5e6, 7e6, 7.5e6, 8e6, 8.5e6, 9e6]
    }],
    skyPlayerDecel: .997,
    playerDecel: 0.99,
    mk2UpgradeCost: 500,
    mk3UpgradeCost: [1, 1, 2, 3, 4],
    mk3EnchantmentIncrease: .1,
    easyModePoints: 500,
    attrubutesDescription: {
        "Kinetic": "Fires with kinetic shells",
        "Explosive": "Fires with explosive shells",
        "Energy": "Fires with energy shells",
        "Manual": "Direct fire",
        "Automatic": "Slowly fires all ammo",
        "Volley": "Quicky fires all ammo",
        "AoE Effect": "Weapon deals damage to shapes and shields within a radius",
        "Magazine": "Weapon fires all ammunition before reloading",
        "Continuous Reload": "Weapon will be reloading once any ammunition is used",
        "Unlimited Ammo": "Weapon may fire indefinitely without pausing for reloading",
        "Artillery": "Projectiles ignore buildings and obstacles",
        "Acceleration Mode": "After firing for a while, the weapon firing speed will increase",
        "Instability": "Continuously firing weapon causes for weapon to lose accuracy over time",
        "Permanent": "Effect is active all the time",
        "Affects Self": "Affects only your shape",
        "Affects the shape": "This drone's functions affect the shape, its weapons, its shields, etc.",
        "Temporary": "Effect is active for a certain duration",
        "One-time effect": "Module activates once per battle",
        "Manual activation": "Activates by tap",
        "Cooldown": "Effect charges for a certain time after activation"
    },
    attrubutesImages: {
        "Kinetic": "../src/media-files/icons/kinetic.png",
        "Explosive": "",
        "Energy": "",
        "Manual": "../src/media-files/icons/manual.png",
        "Automatic": "../src/media-files/icons/automatic.png",
        "Volley": "",
        "AoE Effect": "",
        "Magazine": "../src/media-files/icons/reload.png",
        "Continuous Reload": "",
        "Unlimited Ammo": "",
        "Artillery": "",
        "Acceleration Mode": "",
        "Instability": "",
        "Permanent": "../src/media-files/icons/permanent.png",
        "Affects Self": "../src/media-files/icons/affects_self.png",
        "Temporary": "../src/media-files/icons/temporary.png",
        "One-time effect": "",
        "Manual activation": "../src/media-files/icons/manual_activation.png",
        "Cooldown": "../src/media-files/icons/cooldown.png",
        "Affects the shape": "../src/media-files/icons/affects_self.png"
    },
    droneAbilityImages: {
        "On Mild Damage: Fix": "../src/media-files/abilities/on_mild_damage_fix.png"
    }
};

export default config;