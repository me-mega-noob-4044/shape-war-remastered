"use strict";
import config from "../src/js/config.js";
import * as UTILS from "../src/js/utils.js";
import items from "../src/js/items.js";
import shape from "../src/js/shape.js";
import weapon from "../src/js/weapon.js";
import module from "../src/js/module.js";
import drone from "../src/js/drone.js";
import pilot from "../src/js/pilot.js";
import skill from "../src/js/skill.js";
import msgpack from "../src/js/msgpack.js";
import projectile from "../client/src/game/projectile.js";

(function () {
    var elements = {
        loadingText: UTILS.getElement("loadingText"),
        gameLoad: UTILS.getElement("gameLoad"),
        gameCanvas: UTILS.getElement("gameCanvas"),
        hangerUI: UTILS.getElement("hangerUI"),
        shapeViewUI: UTILS.getElement("shapeViewUI"),
        darkFadeTransition: UTILS.getElement("darkFadeTransition"),
        chooseShapesUI: UTILS.getElement("chooseShapesUI"),
        droneViewUI: UTILS.getElement("droneViewUI"),
        pilotViewUI: UTILS.getElement("pilotViewUI"),
        pilotSkillChangeUi: UTILS.getElement("pilot-skill-change-ui"),
        hangerButtonsUI: UTILS.getElement("hangerButtonsUI"),
        toBattleButton: UTILS.getElement("toBattleButton"),
        chooseShapeUI: UTILS.getElement("chooseShapeUI"),
        gameUI: UTILS.getElement("gameUI"),
        inGameUI: UTILS.getElement("inGameUI"),
        pingDisplay: UTILS.getElement("pingDisplay"),
        weaponsDisplay: UTILS.getElement("weaponsDisplay")
    };

    const hangerUIObserver = new MutationObserver(() => {
        if (elements.hangerUI.style.display != "none") {
            elements.hangerButtonsUI.style.display = "block";
        } else {
            elements.hangerButtonsUI.style.display = "none";
        }
    });
    hangerUIObserver.observe(elements.hangerUI, { attributes: true});

    var indxRole = ["Tank", "Assault", "Scout", "Support"];

    var storeManager = new class {
        constructor() { }
        setUpStoreWeapons(shape) {
            let weapons = [];
            let hardpoints = shape.weaponHardpoints;
            let weaponSlots = 0;
            if (hardpoints.light) {
                let wpn = items.weapons.find(e => e.name == "Punisher");
                for (let i = 0; i < hardpoints.light; i++) {
                    let tmpWpn = new weapon(wpn, undefined, weaponSlots);
                    weaponSlots++;
                    weapons.push(tmpWpn);
                }
            }
            if (hardpoints.medium) {
                let wpn = items.weapons.find(e => e.name == "Punisher T");
                for (let i = 0; i < hardpoints.medium; i++) {
                    let tmpWpn = new weapon(wpn, undefined, weaponSlots);
                    weaponSlots++;
                    weapons.push(tmpWpn);
                }
            }
            if (hardpoints.heavy) { }
            return weapons;
        }
        addItem(type, name, slot, ownerSID) {
            if (type == "shape") {
                let tmp = items.shapes.find(e => e.name == name);
                let tmpItem = new shape(tmp, slot);
                let hardpoints = tmpItem.weaponHardpoints;
                let weaponSlots = 0;
                if (hardpoints.light) {
                    let wpn = items.weapons.find(e => e.name == "Punisher");
                    for (let i = 0; i < hardpoints.light; i++) {
                        let tmpWpn = new weapon(wpn, tmpItem.sid, weaponSlots);
                        weaponSlots++;
                        userProfile.weapons.push(tmpWpn);
                    }
                }
                if (hardpoints.medium) {
                    let wpn = items.weapons.find(e => e.name == "Punisher T");
                    for (let i = 0; i < hardpoints.medium; i++) {
                        let tmpWpn = new weapon(wpn, tmpItem.sid, weaponSlots);
                        weaponSlots++;
                        userProfile.weapons.push(tmpWpn);
                    }
                }
                if (hardpoints.heavy) { }
                userProfile.shapes.push(tmpItem);
                userProfile.saveProfile();
            } else if (type == "weapon") {
                let data = items.weapons.find(e => e.name == name);
                userProfile.weapons.push(new weapon(data, ownerSID, slot));
                userProfile.saveProfile();
            } else if (type == "module") {
                let data = items.modules.find(e => e.name == name);
                userProfile.modules.push(new module(data, ownerSID, slot));
                userProfile.saveProfile();
            } else if (type == "drone") {
                let data = items.drones.find(e => e.name == name);
                userProfile.drones.push(new drone(data, ownerSID));
                userProfile.saveProfile();
            } else if (type == "pilot") {
                let data = items.pilots.find(e => e.name == name);
                userProfile.pilots.push(new pilot(data, ownerSID));
                userProfile.saveProfile();
            }
        }
    };

    // Don't really need to use a database (MongoDB for example) for this because
    // this is only a single player game
    var userProfile = new class {
        constructor() {
            this.bank = {
                silver: 100e3 * 1e6,
                gold: 500 * 1e3,
                platinum: 50,
                microchips: 0 + 1e3,
                keys: 100,
                powercells: 2e3,
                tokens: 0 + 10,
                components: {
                    shapes: {},
                    weapon: {},
                    motherships: {}
                }
            };
            this.shapes = [];
            this.weapons = [];
            this.modules = [];
            this.pilots = [];
            this.drones = [];
            this.motherships = [];
            this.leaguePoints = 0;
            this.slotsData = [{
                locked: false,
                cost: 0
            }];
            for (let i = 0; i < 7; i++) {
                this.slotsData.push({
                    locked: true,
                    cost: i >= 6 ? (i * 750) : i >= 4 ? (i * 500) : ((i * 250) + 250)
                });
            }
        }
        purchaseSlot(indx, cost) {
            this.slotsData[indx].locked = false;
            this.changeBank("gold", -cost);
            hangerDisplay.updateHanger();
        }
        changeBank(id, value) {
            this.bank[id] += value;
            moneyDisplayManager.updateItems();
            this.saveProfile();
        }
        saveProfile() {
            let { leaguePoints, bank, slotsData } = this;

            let shapes = [];
            for (let i = 0; i < this.shapes.length; i++) {
                let tmp = this.shapes[i];
                let data = {
                    name: tmp.name,
                    sid: tmp.sid,
                    level: tmp.level,
                    slot: tmp.slot,
                    activeModuleIndex: tmp.activeModuleIndex
                };
                shapes.push(data);
            }

            let weapons = [];
            for (let i = 0; i < this.weapons.length; i++) {
                let tmp = this.weapons[i];
                let data = {
                    name: tmp.name,
                    ownerSID: tmp.owner,
                    level: tmp.level,
                    slot: tmp.slot
                };
                weapons.push(data);
            }

            let modules = [];
            for (let i = 0; i < this.modules.length; i++) {
                let tmp = this.modules[i];
                let data = {
                    name: tmp.name,
                    ownerSID: tmp.owner,
                    level: tmp.level,
                    slot: tmp.slot
                };
                modules.push(data);
            }

            let drones = [];
            for (let i = 0; i < this.drones.length; i++) {
                let tmp = this.drones[i];
                let data = {
                    name: tmp.name,
                    ownerSID: tmp.owner,
                    level: tmp.level
                };
                drones.push(data);
            }

            let pilots = [];
            for (let i = 0; i < this.pilots.length; i++) {
                let pilot = this.pilots[i];
                let skills = [];

                pilot.skills.forEach(e => {
                    skills.push({
                        name: e.name,
                        slot: e.slot
                    });
                });

                pilots.push({
                    name: pilot.name,
                    ownerSID: pilot.owner,
                    level: pilot.level,
                    skills: skills
                });
            }

            let motherships = [];
            for (let i = 0; i < this.motherships.length; i++) {
                let mothership = this.motherships[i];
                let turrets = [];
                mothership.turrets.forEach(e => {
                    turrets.push({
                        name: e.name,
                        slot: e.slot
                    });
                });
                motherships.push({
                    name: mothership.name,
                    equipped: mothership.equipped,
                    level: mothership.level,
                    turrets: turrets
                });
            }

            let content = JSON.stringify({ slotsData, leaguePoints, bank, shapes, weapons, modules, drones, pilots, motherships });
            UTILS.saveVal("userProfile", content);
        }
        setDefaultItems() {
            storeManager.addItem("shape", "Gray Circle", 0);
        }
        loadProfile() {
            let content = JSON.parse(UTILS.getSavedVal("userProfile"));
            let highestSid = 0;
            this.bank = content.bank;
            this.leaguePoints = parseInt(content.leaguePoints);
            this.slotsData = content.slotsData;
            for (let i = 0; i < content.shapes.length; i++) {
                let data = content.shapes[i];
                let tmp = items.shapes.find(e => e.name == data.name);
                let tmpItem = new shape(tmp, data.slot, true);
                tmpItem.sid = data.sid;
                tmpItem.slot = data.slot;
                tmpItem.activeModuleIndex = (data.activeModuleIndex || 0);
                for (let t = 0; t < data.level - 1; t++) {
                    upgraderManager.upgradeShape(tmpItem, true);
                }
                this.shapes.push(tmpItem);
                if (data.sid > highestSid) {
                    highestSid = data.sid;
                }
            }
            window.shapeSid = highestSid + 1;

            for (let i = 0; i < content.weapons.length; i++) {
                let data = content.weapons[i];
                let tmp = items.weapons.find(e => e.name == data.name);
                let tmpItem = new weapon(tmp, data.ownerSID, data.slot);
                for (let t = 0; t < data.level - 1; t++) {
                    upgraderManager.upgradeWeapon(tmpItem, true);
                }
                this.weapons.push(tmpItem);
            }

            for (let i = 0; i < content.modules.length; i++) {
                let data = content.modules[i];
                let tmp = items.modules.find(e => e.name == data.name);
                let tmpItem = new module(tmp, data.ownerSID, data.slot);
                for (let t = 0; t < data.level - 1; t++) {
                    upgraderManager.upgradeModule(tmpItem, true);
                }
                this.modules.push(tmpItem);
            }

            for (let i = 0; i < content.drones.length; i++) {
                let data = content.drones[i];
                let tmp = items.drones.find(e => e.name == data.name);
                let tmpItem = new drone(tmp, data.ownerSID);
                for (let t = 0; t < data.level - 1; t++) {
                    upgraderManager.upgradeDrone(tmpItem, true);
                }
                this.drones.push(tmpItem);
            }

            for (let i = 0; i < content.pilots.length; i++) {
                let data = content.pilots[i];
                let tmp = items.pilots.find(e => e.name == data.name);
                let tmpItem = new pilot(tmp, data.ownerSID);
                tmpItem.level = data.level;

                data.skills.forEach(e => {
                    let tmp = items.skills.find(obj => obj.name == e.name);

                    tmpItem.skills.push(new skill(tmp, e.slot));
                });

                this.pilots.push(tmpItem);
            }

            for (let i = 0; i < content.motherships.length; i++) {
                //
            }
        }
    };

    var imageManager = new class {
        constructor() {
            this.images = {};
            this.iconImages = ["../src/media-files/icons/range.png", "../src/media-files/icons/reload.png", "../src/media-files/icons/damage.png", "../src/media-files/icons/health.png", "../src/media-files/icons/speed.png", "../src/media-files/icons/unequip_button.png"];
            this.moneyIcons = ["../src/media-files/money/silver.png", "../src/media-files/money/gold.png", "../src/media-files/money/platinum.png", "../src/media-files/money/keys.png", "../src/media-files/money/powercells.png", "../src/media-files/money/microchips.png", "../src/media-files/money/tokens.png"];
        }
        generateWhiteImage() {
            let canvas = document.createElement("canvas");
            canvas.width = canvas.height = 300;

            let ctx = canvas.getContext("2d");
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, 300, 300);

            return canvas.toDataURL();
        }
        cacheImage(source) {
            let image = this.images[source];
            if (!image) {
                image = new Image();
                image.src = source;
                image.onload = () => {
                    image.isLoaded = true;
                    console.log(`"${source}" has loaded.`);
                };
                image.onerror = () => {
                    image.onerror = null;
                    image.src = this.generateWhiteImage();
                };
                this.images[source] = image;
            }
        }
        getImage(source) {
            let originalImage = this.images[source];
            if (originalImage && originalImage.isLoaded) {
                let duplicateImage = new Image();
                duplicateImage.src = source;
                duplicateImage.onerror = () => {
                    duplicateImage.onerror = null;
                    duplicateImage.src = this.generateWhiteImage();
                };
                return duplicateImage;
            }
        }
        loadImages() {
            for (let i = 0; i < items.shapes.length; i++) {
                let data = items.shapes[i];
                if (data) {
                    data.abilities.forEach(e => {
                        this.cacheImage(e.imageSource);
                    });
                }
            }

            for (let i = 0; i < items.weapons.length + items.modules.length + items.activeModules.length; i++) {
                let data = items.weapons[i] || items.modules[i - items.weapons.length] || items.activeModules[i - (items.weapons.length + items.modules.length)];
                if (data) {
                    this.cacheImage(data.imageSource);
                }
            }

            for (let i = 0; i < items.pilots.length; i++) {
                let data = items.pilots[i];
                if (data) {
                    this.cacheImage(data.imageSource);
                }
            }

            for (let i = 0; i < this.moneyIcons.length + this.iconImages.length; i++) {
                let data = this.moneyIcons[i] || this.iconImages[i - this.moneyIcons.length];
                if (data) {
                    this.cacheImage(data);
                }
            }

            for (let i in config.attrubutesImages) {
                let data = config.attrubutesImages[i];
                if (data) {
                    this.cacheImage(data);
                }
            }

            for (let i in config.droneAbilityImages) {
                let data = config.droneAbilityImages[i];
                if (data) {
                    this.cacheImage(data);
                }
            }
        }
    };

    window.generateWhiteImage = imageManager.generateWhiteImage;

    function doDarkModeTransition() {
        elements.darkFadeTransition.style.display = "block";
        setTimeout(() => {
            elements.darkFadeTransition.style.opacity = 0;
            setTimeout(() => {
                elements.darkFadeTransition.style.display = "none";
                elements.darkFadeTransition.style.opacity = 1;
            }, 200);
        }, 50);
    }

    var canvasDrawer = new class {
        constructor() {
            this.mainContext = elements.gameCanvas.getContext("2d");
            this.bulletImages = {};
            this.bulletSprites = {};
        }

        drawCircle(x, y, tmpContext, scale, dontStroke, dontFill) {
            tmpContext.beginPath();
            tmpContext.arc(x, y, scale, 0, Math.PI * 2);
            if (!dontFill) tmpContext.fill();
            if (!dontStroke) tmpContext.stroke();
        }

        createUIItem(tmpObj) {
            if (tmpObj.visualData) tmpObj = tmpObj.visualData;

            let tmpCanvas = document.createElement("canvas");
            tmpCanvas.width = tmpCanvas.height = tmpObj.scale * 6;
            tmpCanvas.style.width = tmpCanvas.style.height = (tmpObj.scale * 6) + "px"

            let tmpContext = tmpCanvas.getContext("2d");
            tmpContext.globalAlpha = 1;
            tmpContext.translate((tmpCanvas.width / 2), (tmpCanvas.height / 2));
            tmpContext.lineWidth = 5.5;
            tmpContext.strokeStyle = "#000";

            if (tmpObj.name.includes("Circle")) {
                tmpContext.fillStyle = tmpObj.color;
                this.drawCircle(0, 0, tmpContext, tmpObj.scale * 2, false, false, 11);
            }
            return tmpCanvas;
        }

        getBulletSprite(tmpObj) {
            let tmp = this.bulletSprites[tmpObj.imageSource];

            if (!tmp) {
                tmp = new Image();
                tmp.src = tmpObj.imageSource;
                tmp.onload = function () {
                    tmp.isLoaded = true;
                }

                this.bulletSprites[tmpObj.imageSource] = tmp;
            }

            if (tmp.isLoaded) return tmp;
        }

        getBulletImage(tmpObj) {
            let image = this.bulletImages[tmpObj.imageSource];

            if (!image) {
                let image = this.getBulletSprite(tmpObj);

                if (image) {
                    let tmpCanvas = document.createElement("canvas");
                    tmpCanvas.width = tmpCanvas.height = 160;
                    tmpCanvas.style.width = tmpCanvas.style.height = 160 + "px";

                    let tmpCtx = tmpCanvas.getContext("2d");
                    tmpCtx.globalAlpha = 1;
                    tmpCtx.translate((tmpCanvas.width / 2), (tmpCanvas.height / 2));

                    let size = 160;
                    tmpCtx.drawImage(image, -size / 2, -size / 2, size, size);

                    this.bulletImages[tmpObj.imageSource] = image = tmpCanvas;
                }
            }

            return image;
        }
    };

    var game = new class {
        constructor() {
            this.screenSize = {
                x: config.defaultScreenX,
                y: config.defaultScreenY
            }
            this.menuLoaderInterval = null;
            this.doMenuLoading();
        }
        loadUserProfile() {
            let savedProfile = UTILS.getSavedVal("userProfile");
            if (savedProfile) {
                userProfile.loadProfile();
            } else {
                userProfile.setDefaultItems();
            }
        }
        doMenuLoading() {
            let counter = 0;
            let loadingContent = [".", "..", "...", ""];

            this.menuLoaderInterval = setInterval(() => {
                elements.loadingText.textContent = `Loading${loadingContent[counter % loadingContent.length]}`;
                counter++;
            }, 500);
        }
        finishLoading() {
            elements.gameLoad.style.display = "none";
            elements.hangerUI.style.display = "block";
            hangerDisplay.updateHanger();
        }
        init() {
            this.loadUserProfile();
            imageManager.loadImages();
            setTimeout(() => {
                clearInterval(this.menuLoaderInterval);
                this.finishLoading();
            }, 1e3);
        }
    };

    var upgraderManager = new class {
        upgradeShape(shape, dontSaveData) {
            let item = items.shapes.find(e => e.name == shape.name);
            if (item.healthData) {
                let value = item.healthData.level[shape.level];
                if (shape.level >= 24) {
                    if (shape.level == 24) {
                        shape.health += hangerDisplay.getMk3Amount(item.healthData);
                    }
                } else if (shape.level > 12) {
                    shape.health += hangerDisplay.getMk2Amount(shape, item.healthData);
                } else if (value) {
                    shape.health += value;
                }

                shape.maxhealth = shape.health;
            }
            if (item.speedData) {
                let value = item.speedData.level[shape.level];
                if (value) {
                    shape.speed += value;
                }
            }
            shape.level++;
            if (!dontSaveData) userProfile.saveProfile();
        }
        upgradeWeapon(weapon, dontSaveData) {
            let item = items.weapons.find(e => e.name == weapon.name);
            if (item.damageData) {
                let value = item.damageData.level[weapon.level];
                if (weapon.level >= 24) {
                    if (weapon.level == 24) {
                        weapon.dmg += hangerDisplay.getMk3Amount(item.damageData);
                    }
                } else if (weapon.level > 12) {
                    weapon.dmg += hangerDisplay.getMk2Amount(weapon, item.damageData, "weapon");
                } else if (value) {
                    weapon.dmg += value;
                }
            }

            weapon.level++;
            if (!dontSaveData) userProfile.saveProfile();
        }
        upgradeModule(module, dontSaveData) {
            let item = items.modules.find(e => e.name == module.name);
            if (item.healthIncreaseData) {
                module.healthIncrease += item.healthIncreaseData.level[module.level];
            }

            module.level++;
            if (!dontSaveData) userProfile.saveProfile();
        }
        upgradeDrone(drone, dontSaveData) {
            let item = items.drones.find(e => e.name == drone.name);

            for (let i = 0; i < drone.abilities.length; i++) {
                let ability = drone.abilities[i];
                let abilityItem = item.abilities[i]

                for (let t = 0; t < abilityItem.stats.length; t++) {
                    let stat = abilityItem.stats[t];

                    if (typeof stat == "object") {
                        let increase = stat.level[drone.level];

                        if (increase) {
                            ability.stats[t] += increase;
                        }
                    }
                }
            }

            drone.level++;
            if (!dontSaveData) userProfile.saveProfile();
        }
    };

    document.addEventListener("wheel", function (event) {
        if (event.deltaX !== 0) {
            event.preventDefault();
        }
    }, { passive: false });

    var moneyConverter = new class {
        convertSilverToGold(amount) {
            return Math.ceil(amount / 1250);
        }
        convertMicrochipsToGold(amount) {
            return Math.ceil(amount * 255);
        }
    };

    var errorEventManager = new class {

        /**
         * shows a popup error message
         * @param {string} text 
         */

        error(text) {
            let element = document.createElement("div");
            element.style = `
            z-index: 1001;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 550px;
            height: 300px;
            background-color: rgb(0, 0, 0, .85);
            border-radius: 6px;
            `;

            element.innerHTML = `
            <div style="font-weight: 600; display: flex; align-items: center; justify-content: center; position: absolute; color: #fff; text-align: center; font-size: 35px; top: 0px; left: 0px; width: 100%; height: 50px; background: linear-gradient(to right, transparent 0%, transparent 20%, rgb(255, 255, 255, .4) 50%, transparent 80%, transparent 100%);">
            ATTENTION
            </div>
            <div style="color: white; font-weight: 600; font-size: 16px; position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);">
            ${text}
            </div>
            `;

            let button = document.createElement("div");
            button.style = "font-weight: 600; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; border-radius: 4px; width: 200px; height: 50px; background-color: rgb(255, 255, 255, .75); cursor: pointer; position: absolute; left: 50%; bottom: 10px; transform: translateX(-50%);";
            button.innerHTML = "OK";

            button.onclick = () => {
                element.remove();
            };

            element.appendChild(button);

            document.body.appendChild(element);
        }
    };

    var pilotSkillManager = new class {
        getSkills(pilot) {
            let skills = [];
            let pilotSkills = pilot.skills;

            for (let i = 0; i < pilot.skills.length; i++) {}
            for (let i = 0; i < items.skills.length; i++) {
                let skill = items.skills[i];
                let hasSkill = pilotSkills.find(e => e.name == skill.name);

                if (hasSkill) continue;

                skills.push(skill);
            }

            return skills;
        }
        styleSkillValue(skill) {
            let value = skill[skill.main];

            if (value == .07) {
                value = 7;
            } else {
                value *= 100;
            }

            return value + "%";
        }
    };

    var hangerDisplay = new class {
        constructor() {
            this.shapeViewUI = elements.shapeViewUI;
            this.shapeViewItemInfoImage = UTILS.getElement("shape-view-item-info-image");
            this.changeShapeItemBarDisplay = UTILS.getElement("change-shape-item-bar-display");
            this.shapeViewBackButton = UTILS.getElement("shape-view-back-button");
            this.imageElement = UTILS.getElement("imageView");
            this.levelDisplay = UTILS.getElement("shape-view-level");
            this.nameDisplay = UTILS.getElement("shape-view-name");
            this.rightSideDisplay = UTILS.getElement("right-view-display");
            this.industryDisplay = UTILS.getElement("shape-view-industry-name");
            this.shapeElements = ["pentagon-shape", "circle-shape"];
            this.statsDisplay = UTILS.getElement("view-shape-stats");
            this.viewWeaponsButton = UTILS.getElement("right-view-weapons");
            this.viewModulesButton = UTILS.getElement("right-view-modules");
            this.shapeViewUpgradeButton = UTILS.getElement("shape-view-upgrade-button");
            this.shapeAbilityViewImage = UTILS.getElement("shape-ability-view-image");
            this.shapeAbilityViewName = UTILS.getElement("shape-ability-view-name");
            this.shapeAbilityView = UTILS.getElement("shape-ability-view");
            this.shapeViewUnequipButton = UTILS.getElement("shape-view-unequip-button");
            this.shapeViewInfoMenu = UTILS.getElement("shape-view-info-menu");
            this.shapeUpgradeViewMenu = UTILS.getElement("shape-view-upgrade-menu");
            this.upgradeImageElement = UTILS.getElement("shape-view-upgrade-image");
            this.shapeViewUpgradeRightDisplay = UTILS.getElement("shape-view-upgrade-right-display");
            this.shapeViewUpgradeMoneyDisplay = UTILS.getElement("shape-view-upgrade-money-display");
            this.shapeViewUpgradeMoneyIcon = UTILS.getElement("shape-view-upgrade-money-icon");
            this.shapeViewUpgradeButton2 = UTILS.getElement("shape-view-upgrade-button-2");
            this.shapeViewUpgradeName = UTILS.getElement("shape-view-upgrade-name");
            this.shapeViewUpgradeBackButton = UTILS.getElement("shape-view-upgrade-back-button");
            this.shapeViewUpgradeText = UTILS.getElement("shape-view-upgrade-text");
            this.changeShapeStoreButton = UTILS.getElement("change-shape-store-button");
            this.changeShapeInventoryButton = UTILS.getElement("change-shape-inventory-button");
            this.changeShapeDisplay = UTILS.getElement("change-shape-display");
            this.shapeViewChangeButton = UTILS.getElement("shape-view-change-button");
            this.shapeViewBuyButton = UTILS.getElement("shape-view-buy-button");
            this.shapeViewBuyMoneyIcon = UTILS.getElement("shape-view-buy-money-icon");
            this.shapeViewBuyMoneyDisplay = UTILS.getElement("shape-view-buy-money-display");
            this.shapeViewBackButton2 = UTILS.getElement("shape-view-back-button-2");
            this.shapeViewEquipButton = UTILS.getElement("shape-view-equip-button");
            this.changeShapeReplacingHolder = UTILS.getElement("change-shape-replacing-holder");
            this.shapeViewMoreInfo = UTILS.getElement("shape-view-more-info");
            this.shapeViewInfoBackButton = UTILS.getElement("shape-view-info-back-button");
            this.shapeViewInfoImage = UTILS.getElement("shape-view-info-image");
            this.shapeViewInfoRightDisplay = UTILS.getElement("shape-view-info-right-display");
            this.shapeViewInfoName = UTILS.getElement("shape-view-info-name");
            this.shapeItemsUI = UTILS.getElement("shapeItemsUI");
            this.shapeInDepthViewInventoryButton = UTILS.getElement("shape-in-depth-view-inventory-button");
            this.shapeInDepthViewStoreButton = UTILS.getElement("shape-in-depth-view-store-button");
            this.changeShapeItemReplacingHolder = UTILS.getElement("change-shape-item-replacing-holder");
            this.changeShapeItemDisplay = UTILS.getElement("change-shape-item-display");
            this.shapeItemViewBuyButton = UTILS.getElement("shape-item-view-buy-button");
            this.shapeItemViewUpgradeButton = UTILS.getElement("shape-item-view-upgrade-button");
            this.shapeItemViewBuyMoneyIcon = UTILS.getElement("shape-item-view-buy-money-icon");
            this.shapeItemViewBuyMoneyDisplay = UTILS.getElement("shape-item-view-buy-money-display");
            this.shapeViewBackButton3 = UTILS.getElement("shape-view-back-button-3");
            this.shapeViewItemUpgradeButton = UTILS.getElement("shape-item-view-upgrade-button");
            this.shapeViewItemUpgradeMenu = UTILS.getElement("shape-view-item-upgrade-menu");
            this.shapeViewItemUpgradeImage = UTILS.getElement("shape-view-item-upgrade-image");
            this.shapeViewItemUpgradeMoneyIcon = UTILS.getElement("shape-view-item-upgrade-money-icon");
            this.shapeViewItemUpgradeMoneyDisplay = UTILS.getElement("shape-view-item-upgrade-money-display");
            this.shapeViewItemUpgradeText = UTILS.getElement("shape-view-item-upgrade-text");
            this.shapeViewItemUpgradeName = UTILS.getElement("shape-view-item-upgrade-name");
            this.shapeViewItemUpgradeRightDisplay = UTILS.getElement("shape-view-item-upgrade-right-display");
            this.shapeViewItemUpgradeButton2 = UTILS.getElement("shape-view-item-upgrade-button-2");
            this.shapeViewItemUpgradeBackButton = UTILS.getElement("shape-view-item-upgrade-back-button");
            this.shapeItemViewEquipButton = UTILS.getElement("shape-item-view-equip-button");
            this.shapeItemViewUnequipButton = UTILS.getElement("shape-item-view-unequip-button");
            this.shapeViewItemInfoMenu = UTILS.getElement("shape-view-item-info-menu");
            this.shapeViewItemInfoName = UTILS.getElement("shape-view-item-info-name");
            this.shapeViewItemInfoBackButton = UTILS.getElement("shape-view-item-info-back-button");
            this.shapeViewItemInfoRightDisplay = UTILS.getElement("shape-view-item-info-right-display");
            this.droneViewNameLabel = UTILS.getElement("droneViewNameLabel");
            this.droneImageView = UTILS.getElement("droneImageView");
            this.droneViewEquipButton = UTILS.getElement("drone-view-equip-button");
            this.droneViewChangeButton = UTILS.getElement("drone-view-change-button");
            this.droneViewUnequipButton = UTILS.getElement("drone-view-unequip-button");
            this.droneViewUpgradeButton = UTILS.getElement("drone-view-upgrade-button");
            this.droneViewBuyButton = UTILS.getElement("drone-view-buy-button");
            this.droneViewBuyMoneyIcon = UTILS.getElement("drone-view-buy-money-icon");
            this.droneViewBuyMoneyDisplay = UTILS.getElement("drone-view-buy-money-display");
            this.droneItemViewLeft = UTILS.getElement("drone-item-view-left");
            this.droneItemViewRight = UTILS.getElement("drone-item-view-right");
            this.droneViewBackButton = UTILS.getElement("drone-view-back-button");
            this.droneAbilityInfoMenu = UTILS.getElement("drone-ability-info-menu");
            this.droneAbilityInfoName = UTILS.getElement("drone-ability-info-name");
            this.droneAbilityInfoImage = UTILS.getElement("drone-ability-info-image");
            this.droneAbilityInfoRightDisplay = UTILS.getElement("drone-ability-info-right-display");
            this.droneAbilityInfoBackButton = UTILS.getElement("drone-ability-info-back-button");
            this.droneViewUpgradeMenu = UTILS.getElement("drone-view-upgrade-menu");
            this.droneViewUpgradeName = UTILS.getElement("drone-view-upgrade-name");
            this.droneViewUpgradeImage = UTILS.getElement("drone-view-upgrade-image");
            this.droneViewUpgradeRightDisplay = UTILS.getElement("drone-view-upgrade-right-display");
            this.droneViewUpgradeMoneyDisplay = UTILS.getElement("drone-view-upgrade-money-display");
            this.droneViewUpgradeMoneyIcon = UTILS.getElement("drone-view-upgrade-money-icon");
            this.droneViewUpgradeBackButton = UTILS.getElement("drone-view-upgrade-back-button");
            this.droneViewUpgradeButton2 = UTILS.getElement("drone-view-upgrade-button-2");
            this.pilotDisplayName = UTILS.getElement("pilot-display-name");
            this.pilotViewEquipButton = UTILS.getElement("pilot-view-equip-button");
            this.pilotViewUnequipButton = UTILS.getElement("pilot-view-unequip-button");
            this.pilotViewUpgradeButton = UTILS.getElement("pilot-view-upgrade-button");
            this.pilotViewBuyButton = UTILS.getElement("pilot-view-buy-button");
            this.pilotViewChangeButton = UTILS.getElement("pilot-view-change-button");
            this.pilotViewBuyMoneyDisplay = UTILS.getElement("pilot-view-buy-money-display");
            this.pilotDisplayImage = UTILS.getElement("pilot-display-image");
            this.pilotRightSideDisplay = UTILS.getElement("pilot-right-side-display");
            this.pilotStoryDisplay = UTILS.getElement("pilot-story-display");
            this.pilotOperatesHeader = UTILS.getElement("pilot-operates-header");
            this.pilotHeaderDisplayLevel = UTILS.getElement("pilot-header-display-level");
            this.pilotHeaderDisplayName = UTILS.getElement("pilot-header-display-name");
            this.pilotSkillHeaderActiveSkills = UTILS.getElement("pilot-skill-header-active-skills");
            this.pilotSkillHeaderMaxSkills = UTILS.getElement("pilot-skill-header-max-skills");
            this.pilotSkillsDisplay = UTILS.getElement("pilot-skills-display");
            this.pilotViewUpgradeMoneyDisplay = UTILS.getElement("pilot-view-upgrade-money-display");
            this.changePilotSkillButton = UTILS.getElement("change-pilot-skill-button");
            this.pilotViewBackButton = UTILS.getElement("pilot-view-back-button");
            this.pilotSkillsLeftSideDisplay = UTILS.getElement("pilot-skills-left-side-display");
            this.pilotSkillsRightSideDisplay = UTILS.getElement("pilot-skills-right-side-display");
            this.pilotSkillsViewBackButton = UTILS.getElement("pilot-skills-view-back-button");
            this.dataToImage = {
                "healthData": "../src/media-files/icons/health.png",
                "speedData": "../src/media-files/icons/speed.png",
                "damageData": "../src/media-files/icons/damage.png",
                "rangeData": "../src/media-files/icons/range.png",
                "reloadData": "../src/media-files/icons/reload.png",
                "healthIncreaseData": "../src/media-files/modules/armor_kit.png",
                "duration": "../src/media-files/icons/cooldown.png",
                "regenData": "../src/media-files/modules/repair_unit.png"
            };
            this.dataToDescription = {
                "healthData": "Hit points",
                "speedData": "Speed",
                "damageData": "Damage",
                "reloadData": "Reload",
                "rangeData": "Range",
                "healthIncreaseData": "Health Boost",
                "duration": "Duration",
                "regenData": "Regeneration Power"
            };
            this.tmpElements = [];
        }
        showImageBadge(name) {
            for (let i = 0; i < this.shapeElements.length; i++) {
                let id = this.shapeElements[i];
                if (id.includes(name)) {
                    UTILS.getElement(id).style.display = "block";
                } else {
                    UTILS.getElement(id).style.display = "none";
                }
            }
        }
        doStatWidthMath(tmpObj, tmp, amount, isUpgradeStat, isUpgrading, data) {
            let item = items.shapes.find(e => e.name == tmpObj.name);
            if (tmpObj.typeOfObj == "weapon") {
                item = items.weapons.find(e => e.name == tmpObj.name);
            } else if (tmpObj.typeOfObj == "module") {
                item = items.modules.find(e => e.name == tmpObj.name);
            }

            let maxNumber = tmp.base;
            for (let i = 0; i < tmp.level.length; i++) {
                maxNumber += tmp.level[i];
            }
            let savedNumber = maxNumber;
            if (tmpObj.level > 12) {
                if (data == "healthData" || data == "damageData") {
                    maxNumber *= item.mk2DataIncrease;
                    if (tmpObj.level >= 24) {
                        maxNumber += savedNumber * config.mk3EnchantmentIncrease;
                    }
                }
            }
            if (isUpgradeStat) {
                let minusIndx = isUpgrading ? 1 : 0;
                if (isUpgrading) {
                    if (tmp.level[tmpObj.level] <= 0) {
                        minusIndx = 0;
                    }
                }
                let addOn = tmp.level[tmpObj.level - minusIndx] || 0;
                if (["healthData", "damageData"].includes(data)) {
                    if (tmpObj.level > 12 && tmpObj.level < 25) {
                        if (isUpgrading) {
                            if (tmpObj.level == 24) {
                                addOn = this.getMk3Amount(tmp);
                            } else {
                                addOn = this.getMk2Amount(tmpObj, tmp, tmpObj.typeOfObj);
                            }
                            addOn *= -1;
                        } else {
                            if (tmpObj.level == 24) {
                                addOn = this.getMk3Amount(tmp);
                            } else {
                                addOn = this.getMk2Amount(tmpObj, tmp, tmpObj.typeOfObj);
                            }
                        }
                    }
                }
                return ((amount + addOn) / maxNumber) * 100;
            }
            let addOn = (isUpgrading ? tmp.level[tmpObj.level - 1] : 0);
            if (isUpgrading && tmpObj.level > 12 && tmpObj.level < 25) {
                if (["healthData", "damageData"].includes(data)) {
                    if (tmpObj.level == 24) {
                        addOn = this.getMk3Amount(tmp);
                    } else {
                        addOn = this.getMk2Amount(tmpObj, tmp, tmpObj.typeOfObj);
                    }
                } else {
                    addOn = 0;
                }
            }

            return ((amount - addOn) / maxNumber) * 100;
        }
        styleAmountData(amount, data) {
            if (data == "speedData") {
                amount = Math.floor(amount * 1e4) + " px/s";
            } else if (["healthIncreaseData"].includes(data)) {
                amount *= 1e4;
                amount = Math.round(amount);
                amount /= 100;
                amount += "%";
            } else {
                amount = UTILS.styleNumberWithComma(amount);
            }
            return amount;
        }
        upgradeAmountData(tmpObj, itemData, data) {
            let amount = itemData.level[tmpObj.level];
            if (["healthData", "damageData"].includes(data) && tmpObj.level > 12 && tmpObj.level < 25) {
                if (tmpObj.level == 24) {
                    amount = this.getMk3Amount(itemData);
                } else {
                    amount = this.getMk2Amount(tmpObj, itemData, tmpObj.typeOfObj);
                }
            }
            if (amount <= 0 || isNaN(amount + 1)) return "";
            if (data == "speedData") {
                return "+" + (UTILS.styleNumberWithComma(amount * 1e5) / 10) + " px/s";
            } else if (data == "healthIncreaseData") {
                amount *= 1e4;
                amount = Math.round(amount);
                amount /= 100;
                amount += "%";
            }
            return "+" + UTILS.styleNumberWithComma(amount);
        }
        getMk3Amount(tmp) {
            let maxNumber = tmp.base;
            for (let i = 0; i < tmp.level.length; i++) {
                maxNumber += tmp.level[i];
            }
            let mk3Increase = maxNumber * config.mk3EnchantmentIncrease;

            return mk3Increase;
        }
        getMk2Amount(tmpObj, tmp, type) {
            let item = items.shapes.find(e => e.name == tmpObj.name);
            if (type == "weapon") {
                item = items.weapons.find(e => e.name == tmpObj.name);
            } else if (type == "module") {
                item = items.modules.find(e => e.name == tmpObj.name);
            }

            let maxNumber = tmp.base;
            for (let i = 0; i < tmp.level.length; i++) {
                maxNumber += tmp.level[i];
            }
            let mk2Increase = maxNumber * item.mk2DataIncrease;
            let total = mk2Increase - maxNumber;

            if (tmpObj.level == 24) {
                return 0;
            }

            return total / 11;
        }
        showStat(type, tmpObj, data, isUpgradeStat, isUpgrading) {
            let element = document.createElement("div");
            element.style = `display: flex; align-items: center; width: 100%; height: ${isUpgradeStat ? 60 : 40}px;`;
            let item = items.shapes.find(e => e.name == tmpObj.name);
            if (type == "weapon") {
                item = items.weapons.find(e => e.name == tmpObj.name);
            } else if (type == "module") {
                item = items.modules.find(e => e.name == tmpObj.name);
            }
            let barHolderDisplay = document.createElement("div");
            let barDisplay = document.createElement("div");
            let amountElement = document.createElement("div");
            let statBarItem = document.createElement("div");
            let barDisplayDescription, barAdditionDisplay, barUpgradeItem;

            let itemData = item[data];

            if (isUpgradeStat) {
                barDisplayDescription = document.createElement("div");
                barDisplayDescription.style = "color: #404040; font-size: 12px; margin-top: -5px;";
                barDisplayDescription.innerHTML = this.dataToDescription[data];

                let dataSplit = data.split("Data");
                if (data == "damageData") {
                    dataSplit = ["dmg"];
                }
                let amount = tmpObj[dataSplit[0]];

                barAdditionDisplay = document.createElement("div");
                barAdditionDisplay.style = "position: absolute; color: #00ff00; top: 0px; right: 18px;";
                barAdditionDisplay.innerHTML = this.upgradeAmountData(tmpObj, itemData, data);

                barUpgradeItem = document.createElement("div");
                barUpgradeItem.style = "position: absolute; top: 0px; left: 0px; height: 100%; background-color: #00ff00;";
                if (isUpgrading) barUpgradeItem.style.width = `${this.doStatWidthMath(tmpObj, itemData, amount, true, isUpgrading, data)}%`;
                if (isUpgrading) barUpgradeItem.style.transition = "width .5s";
                setTimeout(() => {
                    barUpgradeItem.style.width = `${this.doStatWidthMath(tmpObj, itemData, amount, true, false, data)}%`;
                }, isUpgrading ? 100 : -1);
            }
            barHolderDisplay.style = "margin-left: 45px; width: 100%;";
            statBarItem.classList.add("stat-bar-item");

            let dataSplit = data.split("Data");
            if (data == "damageData") {
                dataSplit = ["dmg"];
            }
            let amount = tmpObj[dataSplit[0]];

            if (isUpgrading) statBarItem.style.width = `${this.doStatWidthMath(tmpObj, itemData, amount, false, isUpgrading, data)}%`;
            if (isUpgrading) statBarItem.style.transition = "width .5s";

            barDisplay.classList.add("stat-bar-style");
            amountElement.classList.add("stat-amount");

            barHolderDisplay.appendChild(amountElement);
            if (barDisplayDescription) barHolderDisplay.appendChild(barDisplayDescription);
            barHolderDisplay.appendChild(barDisplay);
            if (barUpgradeItem) barDisplay.appendChild(barUpgradeItem);
            barDisplay.appendChild(statBarItem);
            element.appendChild(barHolderDisplay);

            if (itemData) {
                let image = imageManager.getImage(this.dataToImage[data]);
                image.style = "position: absolute; width: 40px; height: 40px;";
                element.appendChild(image);
                setTimeout(() => {
                    statBarItem.style.width = `${this.doStatWidthMath(tmpObj, itemData, amount, false, false, data)}%`;
                }, isUpgrading ? 100 : -1);
                amountElement.innerHTML = this.styleAmountData(amount, data);
                if (barAdditionDisplay) amountElement.appendChild(barAdditionDisplay);
                return element;
            }
        }
        addMissingItemSlot(parentElement, wpnType, height) {
            let offsetValue = height + 60;
            let nameDisplayHolder = document.createElement("div");
            let nameDisplay = document.createElement("div");
            nameDisplayHolder.style = `position: absolute; display: flex; align-items: center; font-size: 24px; top: 10px; left: 10px; width: calc(100% - ${offsetValue}px);`;
            nameDisplay.style = `margin-left: 8px; display: flex; align-items: center;`;
            nameDisplay.innerHTML = `
            <span style="color: white;" class="material-symbols-outlined">warning</span>
            <span style="margin-left: 8px;">${UTILS.capitalizeFirstLetter(wpnType)}</span>
            `;

            let equipCircleElement = document.createElement("div");
            equipCircleElement.style = `position: absolute; top: 15px; right: 15px; height: ${height - 30}px; width: ${height - 30}px; display: flex; align-items: center; justify-content: center; border-radius: 100%; background-color: rgb(0, 0, 0, .25);`;
            equipCircleElement.innerHTML = `<span style="color: white; font-size: 72px;" class="material-symbols-outlined">add</span>`;
            parentElement.appendChild(equipCircleElement);

            nameDisplayHolder.appendChild(nameDisplay);
            parentElement.appendChild(nameDisplayHolder);
        }
        addWpnDisplayData(item, parentElement, height, isStore, itemType) {
            let image = imageManager.getImage(item.imageSource);
            image.style = `position: absolute; right: 50px; top: 0px; width: ${height}px; height: ${height}px;`;
            parentElement.appendChild(image);

            //let offsetValue = height + 60;
            let nameDisplayHolder = document.createElement("div");
            let levelDisplay = document.createElement("div");
            let nameDisplay = document.createElement("div");// - ${offsetValue}px
            nameDisplayHolder.style = `position: absolute; display: flex; align-items: center; font-size: 24px; top: 10px; left: 10px; width: calc(100%);`;
            levelDisplay.classList.add("view-weapon-levelDisplay-style");
            if (item.type != "Active") {
                levelDisplay.style.backgroundColor = config.tierColors[item.tier];
            } else {
                levelDisplay.style.backgroundSize = "30px 30px";
                levelDisplay.style.backgroundImage = "url('../src/media-files/money/powercells.png'), none";
            }
            nameDisplay.style.marginLeft = "38px";
            nameDisplay.innerHTML = item.name;
            if (item.type != "Active") {
                levelDisplay.innerHTML = item.level == 25 ? 1 : item.level > 12 ? item.level - 12 : item.level;
            }

            if (item.level == 25) {
                nameDisplay.innerHTML += `<span style="color: #ffff00;">&nbsp;MK3</span>`;
            } else if (item.level > 12) {
                nameDisplay.innerHTML += `<span style="color: #00ff00;">&nbsp;MK2</span>`;
            }

            nameDisplayHolder.appendChild(levelDisplay);
            nameDisplayHolder.appendChild(nameDisplay);
            parentElement.appendChild(nameDisplayHolder);

            let typeHolder = document.createElement("div");
            typeHolder.style = `position: absolute; display: flex; align-items: center; font-size: 14px; color: ${item.type == "Active" ? "#0f0" : "#000"}; top: 40px; left: 49px;`;
            typeHolder.innerHTML = itemType || UTILS.capitalizeFirstLetter(item.type);
            parentElement.appendChild(typeHolder);

            if (!isStore) {
                let moreInfoButton = document.createElement("div");
                moreInfoButton.classList.add("view-weapon-indepth-button");
                moreInfoButton.innerHTML = "i";
                moreInfoButton.onclick = (event) => {
                    this.doShapeItemMoreInfo(item);

                    event.stopPropagation();
                };
                parentElement.appendChild(moreInfoButton);
            }
        }
        doShapeItemMoreInfo(item) {
            doDarkModeTransition();
            moneyDisplayManager.displayItems([]);
            this.shapeViewItemInfoMenu.style.display = "block";

            this.shapeViewItemInfoName.innerHTML = "";
            let levelDisplay = document.createElement("div");
            let nameDisplay = document.createElement("div");
            nameDisplay.style = "margin-left: 40px;"
            levelDisplay.classList.add("shape-view-upgrade-name-level-display");
            if (item.level == 25) {
                levelDisplay.innerHTML = item.level - 24;
            } else if (item.level > 12) {
                levelDisplay.innerHTML = item.level - 12;
            } else {
                levelDisplay.innerHTML = (item.level || 1);
            }

            if (item.level == 25) {
                nameDisplay.innerHTML = `<span style="color: white;">${item.name}</span> <span style="color: #ffff00">MK3</span>`;
            } else if (item.level > 12) {
                nameDisplay.innerHTML = `<span style="color: white;">${item.name}</span> <span style="color: #00ff00">MK2</span>`;
            } else {
                nameDisplay.innerHTML = `<span style="color: white;">${item.name}</span>`;
            }

            levelDisplay.style.backgroundColor = config.tierColors[item.tier];
            this.shapeViewItemInfoName.appendChild(levelDisplay);
            this.shapeViewItemInfoName.appendChild(nameDisplay);

            this.doShapeItemDescriptionDisplay(item);

            this.shapeViewItemInfoBackButton.onclick = () => {
                doDarkModeTransition();
                this.shapeViewItemInfoMenu.style.display = "none";
                moneyDisplayManager.displayItems(["powercells", "gold", "silver"]);
            };
        }
        doShapeItemDescriptionDisplay(item, DifferentMode) {
            this.shapeViewItemInfoRightDisplay.innerHTML = "";
            let industryName = item.industryName;

            let image = imageManager.getImage(item.imageSource);
            image.style = "width: 100%; height: 100%;";
            this.shapeViewItemInfoImage.innerHTML = "";
            this.shapeViewItemInfoImage.appendChild(image);

            if (item.typeOfObj == "weapon") {
                let industryDisplayHolder = document.createElement("div");
                industryDisplayHolder.style = `display: flex; align-items: center;`;

                let industryDisplay = document.createElement("div");
                industryDisplay.style = "width: 20px; height: 20px;";
                industryDisplay.classList.add(`${industryName.toLowerCase()}-shape`);

                let industryNameElement = document.createElement("div");
                industryNameElement.style = "font-weight: 600; margin-left: 5px;";
                industryNameElement.innerHTML = industryName;

                industryDisplayHolder.appendChild(industryDisplay);
                industryDisplayHolder.appendChild(industryNameElement);

                this.shapeViewItemInfoRightDisplay.appendChild(industryDisplayHolder);
            }


            this.shapeViewItemInfoRightDisplay.innerHTML += `
                <div style="font-weight: 600;">${item.description}</div>
            `;

            let data = ["damageData", "rangeData", "reloadData"];
            let statAmount = 3;

            if (item.typeOfObj == "module") {
                if (item.type == "Active") {
                    data = ["duration", "regenData"];
                    statAmount = 2;
                } else {
                    data = ["healthIncreaseData"];
                    statAmount = 1;
                }
            }

            for (let t = 0; t < statAmount; t++) {
                let displayData = data[t];
                let element = document.createElement("div");
                let amountDisplay = document.createElement("div");
                amountDisplay.style.marginLeft = "45px";
                amountDisplay.style.color = "white";
                amountDisplay.style.fontSize = "24px";
                amountDisplay.style.fontWeight = "600";
                element.classList.add("store-item-stats-style-display");
                if (t == 0) element.style.marginTop = "10px";
                if (t > 0) element.style.marginTop = "5px";
                if (displayData) {
                    let splitData = displayData.split("Data")[0];

                    if (displayData == "damageData") {
                        splitData = "dmg";
                    } else if (displayData == "rangeData") {
                        splitData = "range";
                    } else if (displayData == "reloadData") {
                        splitData = "reload";
                    }

                    let multi = (displayData == "reloadData" || displayData == "duration") ? 0.001 : displayData == "speedData" ? 1e4 : 1;

                    let amount = item[displayData == "regenData" ? displayData : splitData];

                    if (typeof amount == "object") {
                        if (displayData == "regenData") {
                            amount = amount.power * 100;
                        }
                    }

                    if (displayData == "healthIncreaseData") {
                        amount *= 1e4;
                        amount = Math.round(amount);
                        amount /= 100;
                    }

                    amountDisplay.innerHTML = `${this.dataToDescription[displayData]}: ${UTILS.styleNumberWithComma(amount * multi)}`;

                    if (displayData == "healthIncreaseData" || displayData == "regenData") {
                        amountDisplay.innerHTML += "%";
                    }

                    if (displayData == "reloadData" || displayData == "duration") {
                        amountDisplay.innerHTML += " sec";
                    } else if (displayData == "rangeData") {
                        amountDisplay.innerHTML += " px";
                    }

                    let image = imageManager.getImage(this.dataToImage[displayData]);
                    image.style = "position: absolute; width: 40px; height: 40px;";
                    element.appendChild(image);
                    element.appendChild(amountDisplay);
                }
                this.shapeViewItemInfoRightDisplay.appendChild(element);
            }

            this.shapeViewItemInfoRightDisplay.innerHTML += "<br>Attributes";

            for (let i = 0; i < item.attributes.length; i++) {
                let attribute = item.attributes[i];

                let element = document.createElement("div");
                let amountDisplay = document.createElement("div");
                let amountDisplayHolder = document.createElement("div");
                amountDisplayHolder.style.marginLeft = "45px";
                amountDisplayHolder.style.color = "white";
                amountDisplay.style.fontSize = "16px";
                amountDisplay.style.fontWeight = "600";

                let descriptionElement = document.createElement("div");
                descriptionElement.style.fontSize = "8px";
                descriptionElement.innerHTML = config.attrubutesDescription[attribute];

                element.classList.add("store-item-stats-style-display");

                amountDisplay.innerHTML = attribute;

                let image = imageManager.getImage(config.attrubutesImages[attribute]);
                image.style = "position: absolute; width: 40px; height: 40px;";
                element.appendChild(image);
                amountDisplayHolder.appendChild(amountDisplay);
                amountDisplayHolder.appendChild(descriptionElement);
                element.appendChild(amountDisplayHolder);

                this.shapeViewItemInfoRightDisplay.appendChild(element);
            }
        }
        doShapeDescriptionDisplay(shape) {
            this.shapeViewInfoRightDisplay.innerHTML = "";
            let splitData = shape.name.split(" ");
            let industryName = splitData[splitData.length - 1];

            let industryDisplayHolder = document.createElement("div");
            industryDisplayHolder.style = `display: flex; align-items: center;`;

            let industryDisplay = document.createElement("div");
            industryDisplay.style = "width: 20px; height: 20px;";
            industryDisplay.classList.add(`${industryName.toLowerCase()}-shape`);

            let industryNameElement = document.createElement("div");
            industryNameElement.style = "margin-left: 5px;";
            industryNameElement.innerHTML = industryName;

            industryDisplayHolder.appendChild(industryDisplay);
            industryDisplayHolder.appendChild(industryNameElement);

            this.shapeViewInfoRightDisplay.appendChild(industryDisplayHolder);

            this.shapeViewInfoRightDisplay.innerHTML += `
                ${shape.description}
            `;

            if (shape.abilities.length) {
                this.shapeViewInfoRightDisplay.innerHTML += `<br><br>Abilit${shape.abilities.length > 1 ? "ities" : "y"}:`
                for (let i = 0; i < shape.abilities.length; i++) {
                    let ability = shape.abilities[i];

                    this.shapeViewInfoRightDisplay.innerHTML += `
                    <div style="color: white;">${ability.name} <span style="color: black;">${ability.description}</span></div>
                    `;

                    this.shapeViewInfoRightDisplay.innerHTML += `
                    <br>Ability Stats (${ability.name}):<br>
                    ${ability.duration ? `Duration: ${(ability.duration / 1e3)} sec<br>` : ""}
                    ${ability.reload ? `Cooldown: ${(ability.reload / 1e3)} sec<br>` : ""}
                    `;
                }
            }

            let data = ["healthData", "speedData"];
            let statAmount = 2;
            for (let t = 0; t < statAmount; t++) {
                let displayData = data[t];
                let element = document.createElement("div");
                let amountDisplay = document.createElement("div");
                amountDisplay.style.marginLeft = "45px";
                amountDisplay.style.color = "white";
                amountDisplay.style.fontSize = "24px";
                element.classList.add("store-item-stats-style-display");
                if (t == 0) element.style.marginTop = "10px";
                if (t > 0) element.style.marginTop = "5px";
                if (displayData) {
                    let splitData = displayData.split("Data")[0];
                    let multi = displayData == "speedData" ? 1e4 : 1;
                    amountDisplay.innerHTML = UTILS.styleNumberWithComma(shape[splitData] * multi);

                    if (displayData == "speedData") {
                        amountDisplay.innerHTML += " px/s";
                    }

                    let image = imageManager.getImage(this.dataToImage[displayData]);
                    image.style = "position: absolute; width: 40px; height: 40px;";
                    element.appendChild(image);
                    element.appendChild(amountDisplay);
                } else {
                    // ability icons and names
                }
                this.shapeViewInfoRightDisplay.appendChild(element);
            }
        }
        displayShapeItems(itemsData, indx, slotId, ownerSID, isStore, isModuleData, itemType) {
            let isUpgrading = false;
            let height = window.innerHeight * .72;
            this.changeShapeItemDisplay.innerHTML = "";
            let width = window.innerWidth - 180;

            this.changeShapeItemBarDisplay.style.left = (((((indx) / itemsData.length) * width) / width) * 100) + "%";
            this.changeShapeItemBarDisplay.style.width = ((1 / itemsData.length) * 100) + "%";

            this.shapeViewItemUpgradeButton.onclick = () => { };

            for (let i = 0; i < itemsData.length; i++) {
                let item = itemsData[i];
                let data = isModuleData ? isModuleData == "Active" ? items.activeModules.find(e => e.name == item.name) : items.modules.find(e => e.name == item.name) : items.weapons.find(e => e.name == item.name);
                if (Math.abs(indx - i) <= 1) {
                    let element = document.createElement("div");
                    if (i < indx) {
                        element.style = `position: absolute; left: 15%; top: 50%; transform: translateY(-50%); filter: brightness(75%);`;

                        let backgroundColorDisplay = document.createElement("div");
                        backgroundColorDisplay.classList.add("center-the-god-damn-node");
                        backgroundColorDisplay.style = `height: ${height - 150}px; width: ${height - 150}px; border-radius: 100%; background: radial-gradient(circle, ${config.tierColors[data.tier]} 0%, rgb(255, 255, 255, .5) 15%, rgb(255, 255, 255, 0) 50%);`;
                        element.appendChild(backgroundColorDisplay);

                        let imgDisplay = imageManager.getImage(data.imageSource);
                        imgDisplay.classList.add("center-the-god-damn-node");
                        imgDisplay.style = `height: ${height - 200}px; width: ${height - 200}px;`;
                        element.appendChild(imgDisplay);
                    } else if (i == indx) {
                        let inStock = document.createElement("div");
                        inStock.style = `position: absolute; text-align: center; top: calc(50% + ${(height / 2) * .75}px); left: 0px; width: 100%;`;
                        if (item.amount != "main") {
                            if (isStore) {
                                if (isModuleData != "Active") inStock.innerHTML = `In Stock: ${(isModuleData ? userProfile.modules.filter(e => e.name == item.name) : userProfile.weapons.filter(e => e.name == item.name)).length}`;
                            } else {
                                this.shapeItemViewUnequipButton.style.display = "none";
                                this.shapeItemViewEquipButton.style.display = "flex";

                                if (isModuleData == "Active") {
                                    this.shapeItemViewUpgradeButton.style.display = "none";
                                    this.shapeItemViewEquipButton.style.display = "flex";
                                } else {
                                    inStock.innerHTML = `In Stock: ${item.amount}`;
                                }
                            }
                        } else {
                            if (isModuleData == "Active") {
                                this.shapeItemViewUnequipButton.style.display = "none";
                                this.shapeItemViewEquipButton.style.display = "none";
                                this.shapeItemViewUpgradeButton.style.display = "none";
                            } else {
                                this.shapeItemViewUnequipButton.style.display = "flex";
                                this.shapeItemViewEquipButton.style.display = "none";
                            }
                        }
                        this.changeShapeItemDisplay.appendChild(inStock);

                        element.style = `width: ${height}px; height: ${height}px;`;
                        element.classList.add("center-the-god-damn-node");

                        let backgroundColorDisplay = document.createElement("div");
                        backgroundColorDisplay.classList.add("center-the-god-damn-node");
                        backgroundColorDisplay.style = `height: ${height - 150}px; width: ${height - 150}px; border-radius: 100%; background: radial-gradient(circle, ${config.tierColors[data.tier]} 0%, rgb(255, 255, 255, .5) 15%, rgb(255, 255, 255, 0) 50%);`;
                        element.appendChild(backgroundColorDisplay);

                        let imgSize = height - 200;
                        let displayOffsets = (width / 2) - (imgSize * .75);
                        let imgDisplay = imageManager.getImage(data.imageSource);
                        imgDisplay.classList.add("center-the-god-damn-node");
                        imgDisplay.style = `height: ${imgSize}px; width: ${imgSize}px;`;
                        element.appendChild(imgDisplay);

                        let imgDisplay2 = imageManager.getImage(data.imageSource);
                        imgDisplay2.style = "width: 100%; height: 100%;";
                        this.shapeViewItemUpgradeImage.innerHTML = "";
                        this.shapeViewItemUpgradeImage.appendChild(imgDisplay2)

                        let powercellCostDisplay = document.createElement("div");
                        powercellCostDisplay.style = `position: absolute; font-size: 12px; display: flex; align-items: center; top: ${((height / 2) - 20) - ((imgSize / 2) - 5)}px; left: 50%; transform: translateX(-50%); height: 30px;`;
                        if (isModuleData == "Active") {
                            powercellCostDisplay.innerHTML = `
                            Activate with powercells:
                            <div style="width: 20px; height: 20px; background-size: 20px 20px; background-image: url('../src/media-files/money/powercells.png');"></div>
                            ${data.cost}
                            `;
                        }
                        element.appendChild(powercellCostDisplay);

                        let nameholderDisplay = document.createElement("div");
                        let levelDisplay = document.createElement("div");
                        let nameDisplay = document.createElement("div");
                        levelDisplay.style = `position: absolute; display: flex; align-items: center; justify-content: center; color: white; top: 0px; left: 0px; width: 30px; height: 30px; border-radius: 100%; background-color: ${config.tierColors[data.tier]};`;
                        nameholderDisplay.style = `position: absolute; display: flex; align-items: center; top: ${((height / 2) - 20) - ((imgSize / 2) + 20)}px; left: 50%; transform: translateX(-50%); height: 30px; padding-right: 35px; border-radius: 16px; background-color: rgb(0, 0, 0, .2);`;
                        nameDisplay.style = "margin-left: 35px";
                        levelDisplay.innerHTML = item.level == 25 ? 1 : item.level > 12 ? item.level - 12 : (item.level || 1);
                        nameDisplay.innerHTML = data.name;

                        let itemData = isModuleData == "Active" ? data : isModuleData ? new module(data, null, null) : new weapon(data, null, null);

                        let moreInfoButton = document.createElement("div");
                        moreInfoButton.style = `position: absolute; right: 2.5px; top: 2.5px; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 100%; width: 25px; height: 25px; background-color: rgb(255, 255, 255, .6);`;
                        moreInfoButton.innerHTML = "i";
                        nameholderDisplay.appendChild(moreInfoButton);
                        moreInfoButton.onclick = () => {
                            let Item = userProfile.weapons.find(e => e.name == data.name && item.level == e.level);

                            if (isModuleData) {
                                if (isModuleData == "Active") {
                                    Item = items.activeModules.find(e => e.name == data.name);
                                } else {
                                    Item = userProfile.modules.find(e => e.name == data.name && item.level == e.level);
                                }
                            }

                            if (isStore) {
                                Item = itemData;
                            }

                            this.doShapeItemMoreInfo(Item);
                        };

                        if (item.level == 25) {
                            nameDisplay.innerHTML += `<span style="color: #ffff00;">&nbsp;MK3</span>`;
                        } else if (item.level > 12) {
                            nameDisplay.innerHTML += `<span style="color: #00ff00;">&nbsp;MK2</span>`;
                        }

                        nameholderDisplay.appendChild(levelDisplay);
                        nameholderDisplay.appendChild(nameDisplay);
                        element.appendChild(nameholderDisplay);

                        let backgroundImage = "../src/media-files/money/silver.png";
                        if (data.cost?.gold > 0) {
                            backgroundImage = "../src/media-files/money/gold.png";
                        }
                        this.shapeItemViewBuyMoneyIcon.style.backgroundImage = `url('${backgroundImage}'), none`;

                        let equipmentCost = data.cost?.gold || data.cost?.silver;
                        let equipmentCostType = data.cost?.gold ? "gold" : "silver";

                        this.shapeItemViewEquipButton.onclick = () => {
                            if (isModuleData == "Active") {
                                let indx = items.activeModules.findIndex(e => data.name == e.name);

                                let shape = userProfile.shapes.find(e => e.sid == ownerSID);

                                if (shape) {
                                    shape.activeModuleIndex = indx;
                                }
                            } else {
                                let Item = userProfile.weapons.find(e => e.name == data.name && item.level == e.level && e.owner == null);
                                let oldItem = userProfile.weapons.find(e => e.owner == ownerSID && e.slot == slotId);

                                if (isModuleData) {
                                    Item = userProfile.modules.find(e => e.name == data.name && item.level == e.level && e.owner == null);
                                    oldItem = userProfile.modules.find(e => e.owner == ownerSID && e.slot == slotId);
                                }

                                if (oldItem) {
                                    oldItem.owner = null;
                                    oldItem.slot = null;
                                }

                                if (Item) {
                                    Item.owner = ownerSID;
                                    Item.slot = slotId;
                                }
                            }

                            userProfile.saveProfile();

                            this.shapeViewBackButton3.click();
                        };

                        this.shapeItemViewBuyButton.onclick = () => {
                            if (userProfile.bank[equipmentCostType] - equipmentCost >= 0) {
                                userProfile.changeBank(equipmentCostType, -equipmentCost);

                                let oldItem = userProfile.weapons.find(e => e.owner == ownerSID && e.slot == slotId);

                                if (isModuleData) {
                                    oldItem = userProfile.modules.find(e => e.owner == ownerSID && e.slot == slotId);
                                }

                                if (oldItem) {
                                    oldItem.owner = null;
                                    oldItem.slot = null;
                                }

                                if (isModuleData) {
                                    storeManager.addItem("module", data.name, slotId, ownerSID);
                                } else {
                                    storeManager.addItem("weapon", data.name, slotId, ownerSID);
                                }

                                this.shapeViewBackButton3.click();
                            }
                        };

                        this.shapeItemViewUnequipButton.onclick = () => {
                            let oldItem = userProfile.weapons.find(e => e.owner == ownerSID && e.slot == slotId);

                            if (isModuleData) {
                                oldItem = userProfile.modules.find(e => e.owner == ownerSID && e.slot == slotId);
                            }

                            if (oldItem) {
                                oldItem.owner = null;
                                oldItem.slot = null;
                            }

                            userProfile.saveProfile();

                            this.shapeViewBackButton3.click();
                        };

                        this.shapeItemViewBuyMoneyDisplay.innerHTML = UTILS.styleNumberWithComma(equipmentCost);

                        let middleHeight = (window.innerHeight * .72) / 2;

                        let leftSideDisplay = document.createElement("div");
                        leftSideDisplay.style = `position: absolute; text-align: right; z-index: 10; padding-right: 0px; top: ${middleHeight - (imgSize / 2)}px; left: ${displayOffsets}px; height: ${imgSize}px;`;
                        this.changeShapeItemDisplay.appendChild(leftSideDisplay);

                        if (isModuleData != "Active") {
                            for (let t = 0; t < item.level - 1; t++) {
                                if (isModuleData) {
                                    upgraderManager.upgradeModule(itemData, true);
                                } else {
                                    upgraderManager.upgradeWeapon(itemData, true);
                                }
                            }
                        }

                        let dataDisplays = ["industryName", "dmg", "range", "reload"];
                        let dataDisplayIcons = ["", "../src/media-files/icons/damage.png", "../src/media-files/icons/range.png", "../src/media-files/icons/reload.png"];

                        if (isModuleData) {
                            if (isModuleData == "Active") {
                                dataDisplays = ["duration", "regenData"];
                                dataDisplayIcons = ["../src/media-files/icons/cooldown.png", "../src/media-files/modules/repair_unit.png"];
                            } else {
                                dataDisplays = ["healthIncrease"];
                                dataDisplayIcons = ["../src/media-files/modules/armor_kit.png"];
                            }
                        }

                        for (let t = 0; t < dataDisplays.length; t++) {
                            let data = dataDisplays[t];
                            let icon = dataDisplayIcons[t];

                            let dataValue = itemData[data];

                            if (data == "regenData") {
                                dataValue = dataValue.power * 100;
                                dataValue += "% hp/sec";
                            } else if (data == "reload" || data == "duration") {
                                dataValue /= 1e3;
                                dataValue += " sec";
                            } else if (data == "range") {
                                dataValue = UTILS.styleNumberWithComma(dataValue);
                                dataValue += " px";
                            } else if (data == "healthIncrease") {
                                dataValue *= 1e4;
                                dataValue = Math.round(dataValue);
                                dataValue /= 100;
                                dataValue += "%";
                            }

                            if (data == "industryName") {
                                let element = document.createElement("div");
                                element.style = "display: flex; font-size: 18px; color: white; align-items: center; height: 50px;";
                                element.innerHTML = `
                                    <div class="circle-shape" style="margin: 0px 10px 0px 5px; width: 45px; height: 45px;"></div>
                                    ${dataValue}
                                    `;

                                leftSideDisplay.appendChild(element);
                            } else if (dataValue != null && dataValue != undefined) {
                                let element = document.createElement("div");
                                let offsetLeft = data == "dmg" ? -2.5 : 0;
                                element.style = `display: flex; margin-left: ${offsetLeft}px; font-size: 18px; color: white; align-items: center; height: 50px;`;
                                element.innerHTML = `
                                    <div style="width: 60px; height: 60px; background-size: 60px 60px; background-image: url('${icon}');"></div>
                                    ${typeof dataValue == "string" ? dataValue : UTILS.styleNumberWithComma(dataValue)}
                                    `;

                                leftSideDisplay.appendChild(element);
                            }
                        }

                        let rightSideDisplay = document.createElement("div");
                        rightSideDisplay.style = `position: absolute; top: ${middleHeight - (imgSize / 2)}px; z-index: 10; right: ${displayOffsets}px; height: ${imgSize}px; width: 50px;`;
                        this.changeShapeItemDisplay.appendChild(rightSideDisplay);

                        for (let t = 0; t < data.attributes.length; t++) {
                            let attribute = data.attributes[t];
                            let element = document.createElement("div");
                            element.style = `width: 50px; height: 50px; background-size: 50px 50px; background-image: url('${config.attrubutesImages[attribute]}')`;

                            rightSideDisplay.appendChild(element);
                        }

                        let needMoreSilverIsOn = false;

                        this.shapeViewItemUpgradeButton.onclick = () => {
                            doDarkModeTransition();
                            moneyDisplayManager.displayItems(["gold", "silver", "platinum", "tokens"]);
                            this.shapeViewItemUpgradeMenu.style.display = "block";

                            let itemToUpgrade = undefined;

                            if (item.amount == "main") {
                                if (isModuleData) {
                                    itemToUpgrade = userProfile.modules.find(e => e.name == data.name && e.owner == ownerSID && e.slot == slotId);
                                } else {
                                    itemToUpgrade = userProfile.weapons.find(e => e.name == data.name && e.owner == ownerSID && e.slot == slotId);
                                }
                            } else {
                                if (isModuleData) {
                                    itemToUpgrade = userProfile.modules.find(e => e.name == data.name && e.owner == null && e.level == item.level);
                                } else {
                                    itemToUpgrade = userProfile.weapons.find(e => e.name == data.name && e.owner == null && e.level == item.level);
                                }
                            }

                            let items = ["damageData"];

                            if (isModuleData) {
                                items = ["healthIncreaseData"];
                            }

                            this.shapeViewItemUpgradeRightDisplay.innerHTML = "";
                            for (let i = 0; i < items.length; i++) {
                                let item = items[i];
                                let element = this.showStat(isModuleData ? "module" : "weapon", itemToUpgrade, item, true, isUpgrading);
                                if (element) {
                                    this.shapeViewItemUpgradeRightDisplay.appendChild(element);
                                }
                            }

                            let amount = config.silverUpgrades[itemToUpgrade.tier]?.weapons[itemToUpgrade.level] || "undefined";
                            if (itemToUpgrade.level > 12) {
                                amount = config.silverUpgradesMK2[itemToUpgrade.tier]?.weapons[itemToUpgrade.level - 12] || "undefined";
                            }

                            if (isModuleData) {
                                amount = config.silverUpgrades[itemToUpgrade.tier]?.modules[itemToUpgrade.level] || "undefined";
                                if (itemToUpgrade.level > 12) {
                                    amount = config.silverUpgradesMK2[itemToUpgrade.tier]?.modules[itemToUpgrade.level - 12] || "undefined";
                                }
                            }

                            if (itemToUpgrade.level == 24) {
                                this.shapeViewItemUpgradeMoneyDisplay.innerHTML = config.mk3UpgradeCost[data.tier];
                                this.shapeViewItemUpgradeText.innerHTML = "ENHANCE";
                            } else if (itemToUpgrade.level == 12) {
                                this.shapeViewItemUpgradeMoneyDisplay.innerHTML = config.mk2UpgradeCost;
                                this.shapeViewItemUpgradeText.innerHTML = "ENHANCE";
                            } else if (amount != "undefined") {
                                this.shapeViewItemUpgradeText.innerHTML = "UPGRADE";
                                this.shapeViewItemUpgradeMoneyDisplay.innerHTML = amount >= 1e6 ? UTILS.abbreviateNumber(amount) : UTILS.styleNumberWithComma(amount);
                            }

                            if (itemToUpgrade.level == 24) {
                                this.shapeViewItemUpgradeMoneyIcon.style.backgroundImage = `url('../src/media-files/money/tokens.png'), none`;
                            } else if (itemToUpgrade.level == 12) {
                                this.shapeViewItemUpgradeMoneyIcon.style.backgroundImage = `url('../src/media-files/money/gold.png'), none`;
                            } else {
                                this.shapeViewItemUpgradeMoneyIcon.style.backgroundImage = `url('../src/media-files/money/silver.png'), none`;
                            }

                            this.shapeViewItemUpgradeName.innerHTML = "";
                            let levelDisplay = document.createElement("div");
                            let nameDisplay = document.createElement("div");
                            nameDisplay.style = "margin-left: 40px;"
                            levelDisplay.classList.add("shape-view-upgrade-name-level-display");
                            if (itemToUpgrade.level == 25 || (isModuleData && itemToUpgrade.level == 6)) {
                                this.shapeViewUpgradeButton2.style.display = "none";
                                levelDisplay.innerHTML = itemToUpgrade.level - (isModuleData && itemToUpgrade.level == 6 ? 0 : 24);
                            } else if (itemToUpgrade.level > 12) {
                                this.shapeViewUpgradeButton2.style.display = "flex";
                                levelDisplay.innerHTML = itemToUpgrade.level - 12;
                            } else {
                                this.shapeViewUpgradeButton2.style.display = "flex";
                                levelDisplay.innerHTML = itemToUpgrade.level;
                            }

                            if (itemToUpgrade.level == 25) {
                                nameDisplay.innerHTML = `<span style="color: white;">${itemToUpgrade.name}</span> <span style="color: #ffff00">MK3</span>`;
                            } else if (itemToUpgrade.level == 24) {
                                nameDisplay.innerHTML = `<span style="color: white;">${itemToUpgrade.name}</span> <span style="color: #00ff00">MK2</span> enhance to <span style="color: #ffff00">MK3</span>`;
                            } else if (itemToUpgrade.level > 12) {
                                nameDisplay.innerHTML = `<span style="color: white;">${itemToUpgrade.name}</span> <span style="color: #00ff00">MK2</span> upgrade to level ${(itemToUpgrade.level - 12) + 1}`;
                            } else if (itemToUpgrade.level == 12) {
                                nameDisplay.innerHTML = `<span style="color: white;">${itemToUpgrade.name}</span> enhance to <span style="color: #00ff00">MK2</span>`;
                            } else if (isModuleData && itemToUpgrade.level == 6) {
                                nameDisplay.innerHTML = `<span style="color: white;">${itemToUpgrade.name}</span>`;
                            } else {
                                nameDisplay.innerHTML = `<span style="color: white;">${itemToUpgrade.name}</span> upgrade to level ${itemToUpgrade.level + 1}`;
                            }

                            levelDisplay.style.backgroundColor = config.tierColors[data.tier];
                            this.shapeViewItemUpgradeName.appendChild(levelDisplay);
                            this.shapeViewItemUpgradeName.appendChild(nameDisplay);

                            this.shapeViewItemUpgradeBackButton.onclick = () => {
                                if (needMoreSilverIsOn) return;

                                this.shapeViewItemUpgradeMenu.style.display = "none";

                                let Item = userProfile.weapons.find(e => e.name == data.name && e.owner == ownerSID && e.slot == slotId);

                                if (isModuleData) {
                                    Item = userProfile.modules.find(e => e.name == data.name && e.owner == ownerSID && e.slot == slotId);
                                }

                                this.doInDepthShapeItem(userProfile.shapes.find(e => e.sid == ownerSID), Item, slotId, indx, isStore, itemType);
                            };

                            this.shapeViewItemUpgradeButton2.onclick = () => {
                                if (needMoreSilverIsOn) return;
                                if (itemToUpgrade.level < 25) {
                                    if (itemToUpgrade.level == 12 || itemToUpgrade.level == 24) {
                                        if (itemToUpgrade.level == 24) {
                                            if (userProfile.bank.tokens - config.mk3UpgradeCost[data.tier] >= 0) {
                                                isUpgrading = true;
                                                userProfile.changeBank("tokens", -config.mk3UpgradeCost[data.tier]);
                                                moneyDisplayManager.displayItems(["gold", "silver", "platinum", "tokens"]);
                                                upgraderManager.upgradeWeapon(itemToUpgrade);
                                                item.level++;
                                                userProfile.saveProfile();
                                                this.shapeViewItemUpgradeButton.click();
                                            }
                                        } else {
                                            if (userProfile.bank.gold - config.mk2UpgradeCost >= 0) {
                                                isUpgrading = false;
                                                userProfile.changeBank("gold", -config.mk2UpgradeCost);
                                                moneyDisplayManager.displayItems(["gold", "silver", "platinum", "tokens"]);
                                                itemToUpgrade.level++;
                                                item.level++;
                                                userProfile.saveProfile();
                                                this.shapeViewItemUpgradeButton.click();
                                            }
                                        }
                                    } else if (itemToUpgrade.level < 12 || itemToUpgrade.level > 12) {
                                        if (userProfile.bank.silver - amount >= 0) {
                                            isUpgrading = true;
                                            userProfile.changeBank("silver", -amount);
                                            moneyDisplayManager.displayItems(["gold", "silver", "platinum", "tokens"]);
                                            if (isModuleData) {
                                                upgraderManager.upgradeModule(itemToUpgrade);
                                            } else {
                                                upgraderManager.upgradeWeapon(itemToUpgrade);
                                            }
                                            item.level++;
                                            this.shapeViewItemUpgradeButton.click();
                                        } else {
                                            let amountNeed = Math.abs(userProfile.bank.silver - amount);

                                            let goldCost = moneyConverter.convertSilverToGold(amountNeed);

                                            if (userProfile.bank.gold - goldCost >= 0) {
                                                needMoreSilverIsOn = true;

                                                let goldAndSilverElement = document.createElement("div");
                                                goldAndSilverElement.style = "position: absolute; display: flex; align-items: center; justify-content: center; flex-direction: column; left: 0px; top: 50%; transform: translateY(-50%); width: 100%; height: 500px;";
                                                document.body.appendChild(goldAndSilverElement);

                                                let alertElement = document.createElement("div");
                                                alertElement.style = "color: white; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-direction: column; width: 550px; height: 325px; border-radius: 4px; background-color: rgb(0, 0, 0, .6);";
                                                alertElement.innerHTML = `
                                                <div style="font-size: 24px;">ATTENTION</div>
                                                <div>You are missing <span style="color: yellow;">${UTILS.styleNumberWithComma(amountNeed)}</span> silver to purchase the upgrade.</div>
                                                <div>You can use <span style="color: yellow;">gold</span> as a replacement for the missing silver.</div>
                                                `;
                                                goldAndSilverElement.appendChild(alertElement);

                                                let buttonsHolder = document.createElement("div");
                                                buttonsHolder.style = "display: flex; align-items: center; margin-top: 10px; width: 550px; height: 75px;";
                                                goldAndSilverElement.appendChild(buttonsHolder);

                                                let cancelButton = document.createElement("div");
                                                cancelButton.style = "display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 24px; color: white; width: calc(50% - 5px); height: 100%; background-color: #f00; border-radius: 4px; cursor: pointer;";
                                                cancelButton.innerHTML = "CANCEL";
                                                buttonsHolder.appendChild(cancelButton);

                                                cancelButton.onmouseover = () => {
                                                    cancelButton.style.backgroundColor = "#de0000";
                                                };
                                                cancelButton.onmouseout = () => {
                                                    cancelButton.style.backgroundColor = "#f00";
                                                };

                                                let confirmButton = document.createElement("div");
                                                confirmButton.style = "display: flex; align-items: center; justify-content: center; flex-direction: column; font-weight: 700; font-size: 18px; color: white; margin-left: 10px; width: calc(50% - 5px); height: 100%; background-color: #0f0; border-radius: 4px; cursor: pointer;";
                                                confirmButton.innerHTML = `
                                                <div>CONFIRM</div>
                                                <div style="display: flex; align-items: center; justify-content: center;">
                                                    <div style="width: 20px; height: 20px; background-size: 20px 20px; background-image: url('../src/media-files/money/gold.png');"></div>
                                                    <span>${UTILS.styleNumberWithComma(goldCost)}</span>
                                                </div>
                                                `;
                                                buttonsHolder.appendChild(confirmButton);

                                                confirmButton.onmouseover = () => {
                                                    confirmButton.style.backgroundColor = "#00de00";
                                                };
                                                confirmButton.onmouseout = () => {
                                                    confirmButton.style.backgroundColor = "#0f0";
                                                };

                                                cancelButton.onclick = () => {
                                                    goldAndSilverElement.remove();

                                                    needMoreSilverIsOn = false;
                                                };
                                                confirmButton.onclick = () => {
                                                    isUpgrading = true;
                                                    userProfile.changeBank("silver", -userProfile.bank.silver);
                                                    userProfile.changeBank("gold", -goldCost);
                                                    moneyDisplayManager.displayItems(["gold", "silver", "platinum", "tokens"]);
                                                    if (isModuleData) {
                                                        upgraderManager.upgradeModule(itemToUpgrade);
                                                    } else {
                                                        upgraderManager.upgradeWeapon(itemToUpgrade);
                                                    }
                                                    item.level++;
                                                    this.shapeViewItemUpgradeButton.click();
                                                    goldAndSilverElement.remove();

                                                    needMoreSilverIsOn = false;
                                                };
                                            }
                                        }
                                    }
                                }
                            };

                            if (itemToUpgrade.level == 25 || (isModuleData && itemToUpgrade.level == 6)) {
                                this.shapeViewItemUpgradeButton2.style.display = "none";
                            } else {
                                this.shapeViewItemUpgradeButton2.style.display = "flex";
                            }
                        };
                    } else if (i > indx) {
                        element.style = `position: absolute; right: 15%; top: 50%; transform: translateY(-50%); filter: brightness(75%);`;

                        let backgroundColorDisplay = document.createElement("div");
                        backgroundColorDisplay.classList.add("center-the-god-damn-node");
                        backgroundColorDisplay.style = `height: ${height - 150}px; width: ${height - 150}px; border-radius: 100%; background: radial-gradient(circle, ${config.tierColors[data.tier]} 0%, rgb(255, 255, 255, .5) 15%, rgb(255, 255, 255, 0) 50%);`;
                        element.appendChild(backgroundColorDisplay);

                        let imgDisplay = imageManager.getImage(data.imageSource);
                        imgDisplay.classList.add("center-the-god-damn-node");
                        imgDisplay.style = `height: ${height - 200}px; width: ${height - 200}px;`;
                        element.appendChild(imgDisplay);
                    }
                    this.changeShapeItemDisplay.appendChild(element);
                }
            }

            if (!itemsData.length) {
                this.shapeItemViewUnequipButton.style.display = "none";
                this.shapeItemViewEquipButton.style.display = "none";
                this.shapeItemViewUpgradeButton.style.display = "none";

                let element = document.createElement("div");
                element.style = "font-size: 22px; color: white; position: absolute; width: 100%; height: 100%; top: 0px; left: 0px; display: flex; align-items: center; justify-content: center;";
                element.innerHTML = `You have no ${itemType == "weapon" ? "weapons" : "modules"} in your inventory`;

                this.changeShapeItemDisplay.appendChild(element);
            }
        }
        doInDepthShapeItem(shape, oldWpn, slot, currentIndx = 0, isStore = "SUPERMAN", itemType) {
            let isModuleData = false;
            if (itemType || oldWpn.type == "Active") {
                isModuleData = itemType || oldWpn.type;

                if (oldWpn.type == "Active") {
                    isModuleData = "Active";
                }
            }

            doDarkModeTransition();
            moneyDisplayManager.displayItems(["gold", "silver"]);
            this.shapeViewUI.style.display = "none";
            this.shapeItemsUI.style.display = "block";

            let notClickBackground = "rgb(0, 0, 0, .3)";
            let clickBackground = "rgb(255, 255, 255, .3)";

            let doNewSend = false;
            let IsStore = false;

            let unequipedItems = userProfile.weapons.filter(e => e.type == oldWpn.type && (e.slot == null || e.slot == undefined)).sort((a, b) => a.tier - b.tier);

            if (isModuleData) {
                if (isModuleData == "Active") {
                    unequipedItems = items.activeModules.filter(e => e.name != oldWpn.name).sort((a, b) => a.tier - b.tier);
                } else {
                    unequipedItems = userProfile.modules.filter(e => (itemType == "Universal" ? true : e.type == itemType) && (e.slot == null || e.slot == undefined)).sort((a, b) => a.tier - b.tier);
                }
            }

            let filteredItems = [];
            for (let i = 0; i < unequipedItems.length; i++) {
                let itemData = unequipedItems[i];
                let indx = filteredItems.findIndex(e => e.name == itemData.name && e.level == itemData.level);
                if (indx >= 0) {
                    filteredItems[indx].amount++;
                } else {
                    filteredItems.push({
                        name: itemData.name,
                        level: itemData.level,
                        amount: 1
                    });
                }
            }

            this.shapeInDepthViewStoreButton.onclick = () => {
                if (!doNewSend) currentIndx = 0;

                this.shapeInDepthViewStoreButton.style.backgroundColor = clickBackground;
                this.shapeInDepthViewStoreButton.style.pointerEvents = "none";
                this.shapeInDepthViewInventoryButton.style.backgroundColor = notClickBackground;
                this.shapeInDepthViewInventoryButton.style.pointerEvents = "auto";

                filteredItems = items.weapons.filter(e => e.type == oldWpn.type).sort((a, b) => a.slot - b.slot);

                if (isModuleData) {
                    if (isModuleData == "Active") {
                        filteredItems = items.activeModules.filter(e => e.name != oldWpn.name).sort((a, b) => a.tier - b.tier);
                    } else {
                        filteredItems = items.modules.filter(e => itemType == "Universal" ? true : e.type == itemType).sort((a, b) => a.slot - b.slot);
                    }
                }

                this.shapeItemViewBuyButton.style.display = "flex";
                this.shapeItemViewUnequipButton.style.display = "none";
                this.shapeItemViewUpgradeButton.style.display = "none";
                this.shapeItemViewEquipButton.style.display = "none";

                doNewSend = false;
                IsStore = true;

                this.displayShapeItems(filteredItems, currentIndx, slot, shape.sid, true, isModuleData, itemType);
            };
            this.shapeInDepthViewInventoryButton.onclick = () => {
                if (!doNewSend) currentIndx = 0;

                this.shapeInDepthViewInventoryButton.style.backgroundColor = clickBackground;
                this.shapeInDepthViewInventoryButton.style.pointerEvents = "none";
                this.shapeInDepthViewStoreButton.style.backgroundColor = notClickBackground;
                this.shapeInDepthViewStoreButton.style.pointerEvents = "auto";

                this.shapeItemViewBuyButton.style.display = "none";
                this.shapeItemViewUnequipButton.style.display = "flex";
                this.shapeItemViewUpgradeButton.style.display = "flex";
                this.shapeItemViewEquipButton.style.display = "none";

                doNewSend = false;
                IsStore = false;

                unequipedItems = userProfile.weapons.filter(e => e.type == oldWpn.type && (e.slot == null || e.slot == undefined)).sort((a, b) => a.tier - b.tier);

                if (isModuleData) {
                    if (isModuleData == "Active") {
                        unequipedItems = items.activeModules.filter(e => e.name != oldWpn.name).sort((a, b) => a.tier - b.tier);
                    } else {
                        unequipedItems = userProfile.modules.filter(e => (itemType == "Universal" ? true : e.type == itemType) && (e.slot == null || e.slot == undefined)).sort((a, b) => a.tier - b.tier);
                    }
                }

                filteredItems = [];
                for (let i = 0; i < unequipedItems.length; i++) {
                    let itemData = unequipedItems[i];
                    let indx = filteredItems.findIndex(e => e.name == itemData.name && e.level == itemData.level);
                    if (indx >= 0) {
                        filteredItems[indx].amount++;
                    } else {
                        filteredItems.push({
                            name: itemData.name,
                            level: itemData.level,
                            amount: 1
                        });
                    }
                }

                if (oldWpn && !oldWpn.notItem) {
                    filteredItems.unshift({
                        name: oldWpn.name,
                        level: oldWpn.level,
                        amount: "main"
                    });
                }

                this.displayShapeItems(filteredItems, currentIndx, slot, shape.sid, false, isModuleData, itemType);
            };

            if (isModuleData == "Active") {
                this.shapeInDepthViewInventoryButton.style.display = "none";
                this.shapeInDepthViewStoreButton.style.display = "none";
            } else {
                this.shapeInDepthViewInventoryButton.style.display = "flex";
                this.shapeInDepthViewStoreButton.style.display = "flex";
            }

            if (isStore != "SUPERMAN") {
                doNewSend = true;
                if (isStore) {
                    this.shapeInDepthViewStoreButton.click();
                } else this.shapeInDepthViewInventoryButton.click();
            } else if (unequipedItems.length || oldWpn) {
                this.changeShapeItemReplacingHolder.innerHTML = "";
                if (shape) {
                    let replacingText = document.createElement("div");
                    replacingText.style = `margin-top: 3px; margin-left: 15px; width: 100%;`;
                    if (isModuleData) {
                        if (oldWpn.type == "Active") {
                            replacingText.innerHTML = "Active modules";
                        } else if (itemType == "Universal") {
                            replacingText.innerHTML = "All shape modules";
                        } else {
                            replacingText.innerHTML = `${itemType} modules`;
                        }
                    } else {
                        replacingText.innerHTML = `${oldWpn.type} weapons`;
                    }

                    let nameHolder = document.createElement("div");
                    let levelDisplay = document.createElement("div");
                    let nameDisplay = document.createElement("div");
                    levelDisplay.style = "position: absolute; color: white; display: flex; align-item: center; justify-content: center; top: 0px; left: 0px; width: 21.5px; height: width: 21.5px; border-radius: 100%;";
                    levelDisplay.style.backgroundColor = config.tierColors[shape.tier];
                    nameHolder.style = `position: relative; width: 100%; margin-left: 15px;`;
                    nameDisplay.style.marginLeft = "25px";
                    levelDisplay.innerHTML = (shape.level == 25 ? 1 : shape.level > 12 ? shape.level - 12 : shape.level);
                    nameDisplay.innerHTML = shape.name;

                    if (shape.level == 25) {
                        nameDisplay.innerHTML += `<span style="color: #ffff00;">&nbsp;MK3</span>`;
                    } else if (shape.level > 12) {
                        nameDisplay.innerHTML += `<span style="color: #00ff00;">&nbsp;MK2</span>`;
                    }

                    nameHolder.appendChild(levelDisplay);
                    nameHolder.appendChild(nameDisplay);
                    this.changeShapeItemReplacingHolder.appendChild(replacingText);
                    this.changeShapeItemReplacingHolder.appendChild(nameHolder);
                }

                if (oldWpn.notItem && !unequipedItems.length) {
                    this.shapeInDepthViewStoreButton.click();
                } else {
                    this.shapeInDepthViewInventoryButton.click();
                }
            } else {
                this.shapeInDepthViewStoreButton.click();
            }

            let deltaX = 0;
            this.changeShapeItemDisplay.onwheel = (event) => {
                if (event.deltaX) {
                    if (event.deltaX >= 1 && deltaX <= -1) {
                        deltaX = 0;
                    } else if (event.deltaX <= -1 && deltaX >= 1) {
                        deltaX = 0;
                    }

                    deltaX += event.deltaX;

                    if (Math.abs(deltaX) >= 125) {
                        if (deltaX >= 1) {
                            if (filteredItems[currentIndx + 1]) {
                                currentIndx++;
                                this.displayShapeItems(filteredItems, currentIndx, slot, shape.sid, IsStore, isModuleData, itemType);
                            }
                        } else if (deltaX <= -1) {
                            if (filteredItems[currentIndx - 1]) {
                                currentIndx--;
                                this.displayShapeItems(filteredItems, currentIndx, slot, shape.sid, IsStore, isModuleData, itemType);
                            }
                        }
                        deltaX = 0;
                    }
                }
            };

            this.shapeViewBackButton3.onclick = () => {
                doDarkModeTransition();
                moneyDisplayManager.displayItems(["powercells", "gold", "silver"]);
                this.shapeViewUI.style.display = "block";
                this.shapeItemsUI.style.display = "none";

                this.viewInDepth(shape, false, false, (shape.slot == null || shape.slot == undefined), (isModuleData || "false"));
            };
        }
        drawRightDisplay(shape, type, Items, isStore) {
            this.rightSideDisplay.innerHTML = "";

            let displayHeight = this.rightSideDisplay.clientHeight;

            let boxHeight = displayHeight / 4;
            let hardpoints = type == "module" ? (shape.moduleHardpoints.defense + shape.moduleHardpoints.assault + shape.moduleHardpoints.universal) : (shape.weaponHardpoints.heavy + shape.weaponHardpoints.medium + shape.weaponHardpoints.light);
            for (let i = 0; i < 4; i++) {
                let wpn = Items.find(e => e.slot == i);
                if (wpn || (type == "module" && i == hardpoints)) {
                    if (type == "module" && i == hardpoints) {
                        wpn = items.activeModules[shape.activeModuleIndex];
                    }

                    let wpnElement = document.createElement("div");
                    let height = boxHeight - (i + 1 < (Items.length + (type == "module" ? 1 : 0)) ? 2 : 0);
                    wpnElement.classList.add("view-weapon-bar-style");
                    wpnElement.style = `height: ${height}px;`;
                    if (isStore) wpnElement.style.pointerEvents = "none";
                    if (i > 0) {
                        wpnElement.style.border = "solid";
                        wpnElement.style.borderWidth = "2px 0px 0px 0px";
                        if (i == 3) {
                            wpnElement.style.borderRadius = "0px 0px 6px 6px";
                        }
                    }

                    let itemType = "";
                    if (wpn.typeOfObj == "module") {
                        if (i < shape.moduleHardpoints.defense && shape.moduleHardpoints.defense > 0) {
                            itemType = "Defense";
                        } else if ((i - shape.moduleHardpoints.defense) < shape.moduleHardpoints.assault && shape.moduleHardpoints.assault > 0) {
                            itemType = "Assault";
                        } else {
                            if (i == hardpoints) {
                                itemType = "Active";
                            } else {
                                itemType = "Universal";
                            }
                        }
                    }

                    this.addWpnDisplayData(wpn, wpnElement, height, isStore, itemType);
                    wpnElement.onclick = () => {
                        if (!isStore) {
                            this.doInDepthShapeItem(shape, wpn, i, undefined, undefined, itemType);
                        }
                    };
                    this.rightSideDisplay.appendChild(wpnElement);
                } else if (i < hardpoints) {
                    let wpnElement = document.createElement("div");
                    let height = boxHeight - (i + 1 < items.length ? 2 : 0);
                    wpnElement.classList.add("view-weapon-bar-style");
                    wpnElement.style = `top: ${(boxHeight - (i > 0 ? 2 : 0)) * i}px; height: ${height}px;`;

                    if (isStore) wpnElement.style.pointerEvents = "none";

                    let itemType = "";

                    if (type == "module") {
                        if (i < shape.moduleHardpoints.defense && shape.moduleHardpoints.defense > 0) {
                            itemType = "Defense";
                        } else if ((i - shape.moduleHardpoints.defense) < shape.moduleHardpoints.assault && shape.moduleHardpoints.assault > 0) {
                            itemType = "Assault";
                        } else {
                            itemType = "Universal";
                        }
                    } else {
                        if (i < shape.weaponHardpoints.light && shape.weaponHardpoints.light > 0) {
                            itemType = "light";
                        } else if ((i - shape.weaponHardpoints.light) < shape.weaponHardpoints.medium && shape.weaponHardpoints.medium > 0) {
                            itemType = "medium";
                        } else {
                            itemType = "heavy";
                        }
                    }

                    if (i > 0) {
                        wpnElement.style.border = "solid";
                        wpnElement.style.borderWidth = "2px 0px 0px 0px";
                        if (i == 3) {
                            wpnElement.style.borderRadius = "0px 0px 6px 6px";
                        }
                    }

                    this.addMissingItemSlot(wpnElement, itemType, height);

                    wpnElement.onclick = () => {
                        if (!isStore) {
                            this.doInDepthShapeItem(shape, {
                                notItem: true,
                                type: itemType
                            }, i, undefined, undefined, type == "module" ? itemType : undefined);
                        }
                    };

                    this.rightSideDisplay.appendChild(wpnElement);
                }
            }

            if (hardpoints < 4) {
                let amount = 4 - (hardpoints + (type == "module" ? 1 : 0));
                let fillRestElement = document.createElement("div");
                fillRestElement.style = `position: absolute; top: ${(hardpoints + (type == "module" ? 1 : 0)) * boxHeight}px; left: 0px; height: ${boxHeight * amount}px; width: 100%;`;
                fillRestElement.classList.add("diagonal-line-pattern");
                this.rightSideDisplay.appendChild(fillRestElement);
            }
        }
        viewDroneAbilityDescription(ability) {
            doDarkModeTransition();
            this.droneAbilityInfoMenu.style.display = "block";
            moneyDisplayManager.displayItems([]);

            let abilityImage = config.droneAbilityImages[ability.name];

            let icon = document.createElement("div");
            icon.style = `width: 40px; height: 40px; background-size: 40px 40px; background-image: url('${abilityImage}');`;

            let name = document.createElement("div");
            name.style = "color: white; margin-left: 5px; font-weight: 600;";
            name.innerHTML = ability.name;

            let width = window.innerWidth * .5 - 100;

            this.droneAbilityInfoImage.style.backgroundSize = `${width}px ${width}px`;
            this.droneAbilityInfoImage.style.backgroundImage = `url('${abilityImage}'), none`;

            this.droneAbilityInfoName.innerHTML = "";
            this.droneAbilityInfoName.appendChild(icon);
            this.droneAbilityInfoName.appendChild(name);

            this.droneAbilityInfoRightDisplay.innerHTML = `
            <div class="drone-ability-info-display-header"><div style="margin-left: 4px;">DRONE ABILITY</div></div>
            <div style="margin-top: 4px; margin-bottom: 4px; margin-left: 4px; font-weight: 600;">${ability.description}</div>
            <div class="drone-ability-info-display-header"><div style="margin-left: 4px;">CHARACTERISTICS</div></div>
            `;

            let characteristicsHolder = document.createElement("div");
            characteristicsHolder.style = "margin-top: 4px; margin-bottom: 4px;";

            let otherCharacteristics = ["reload"];
            let otherCharacteristicsTitles = ["Cooldown time"];
            let otherCharacteristicsIcons = ["../src/media-files/icons/cooldown.png"];
            for (let i = 0; i < ability.statTitles.length + otherCharacteristics.length; i++) {
                let otherCharacteristic = otherCharacteristics[i - ability.statTitles.length];
                let stat = ability.stats[i];
                let title = ability.statTitles[i] || otherCharacteristicsTitles[i - ability.statTitles.length];
                let icon = ability.statIcons[i];

                if (title == otherCharacteristicsTitles[i - ability.statTitles.length]) {
                    stat = ability[otherCharacteristic];
                    icon = otherCharacteristicsIcons[i - ability.statTitles.length];
                }

                if (title) {
                    let element = document.createElement("div");
                    element.style = "position: relative;";

                    let iconDisplay = document.createElement("div");
                    iconDisplay.style = `width: 50px; height: 50px; background-size: 50px 50px; background-image: url('${icon}');`;

                    let titleHolder = document.createElement("div");
                    titleHolder.style = "position: absolute; top: 0px; left: 55px; height: 50px; display: flex; flex-direction: column;";

                    let statDisplay = document.createElement("div");
                    statDisplay.style = "font-weight: 600; font-size: 22px;";

                    let indx = i - ability.statTitles.length;
                    statDisplay.innerHTML = UTILS.droneStatAmount(indx >= 0 ? otherCharacteristic : ability.name, stat);

                    let titleDisplay = document.createElement("div");
                    titleDisplay.style = "font-weight: 600; margin-top: -5px; font-size: 14px;";
                    titleDisplay.innerHTML = title;

                    titleHolder.appendChild(statDisplay);
                    titleHolder.appendChild(titleDisplay);

                    element.appendChild(iconDisplay);
                    element.appendChild(titleHolder);

                    characteristicsHolder.appendChild(element);
                }
            }

            this.droneAbilityInfoRightDisplay.appendChild(characteristicsHolder);

            this.droneAbilityInfoRightDisplay.innerHTML += `
            <div class="drone-ability-info-display-header"><div style="margin-left: 4px;">PROPERTIES</div></div>
            `;

            let propertiesHolder = document.createElement("div");
            propertiesHolder.style = "margin-top: 4px; margin-bottom: 4px;";

            for (let i = 0; i < ability.attributes.length; i++) {
                let attribute = ability.attributes[i];
                let title = config.attrubutesDescription[attribute];
                let icon = config.attrubutesImages[attribute];

                let element = document.createElement("div");
                element.style = "position: relative;";

                let iconDisplay = document.createElement("div");
                iconDisplay.style = `width: 50px; height: 50px; background-size: 50px 50px; background-image: url('${icon}');`;

                let titleHolder = document.createElement("div");
                titleHolder.style = "position: absolute; top: 0px; left: 55px; height: 50px; display: flex; flex-direction: column;";

                let statDisplay = document.createElement("div");
                statDisplay.style = "font-weight: 600; font-size: 22px;";

                statDisplay.innerHTML = attribute;

                let titleDisplay = document.createElement("div");
                titleDisplay.style = "font-weight: 600; margin-top: -5px; font-size: 14px;";
                titleDisplay.innerHTML = title;

                titleHolder.appendChild(statDisplay);
                titleHolder.appendChild(titleDisplay);

                element.appendChild(iconDisplay);
                element.appendChild(titleHolder);

                propertiesHolder.appendChild(element);
            }

            this.droneAbilityInfoRightDisplay.appendChild(propertiesHolder);

            this.droneAbilityInfoBackButton.onclick = () => {
                doDarkModeTransition();
                this.droneAbilityInfoMenu.style.display = "none";
                moneyDisplayManager.displayItems(["microchips"]);
            };
        }
        purchaseDrone(drone, dontUpdateCost, slotId) {
            if (!dontUpdateCost) {
                userProfile.changeBank("microchips", -drone.cost);
            }

            doDarkModeTransition();
            this.droneViewBackButton.click();
            storeManager.addItem("drone", drone.name, undefined, slotId);

            let shape = userProfile.shapes.find(e => e.sid == slotId);
            elements.chooseShapesUI.style.display = "none";

            this.viewInDepth(shape, false, shape.slot, shape.slot);
        }
        // isUpgrading allows the function/method to do a nice upgrading animation
        doDroneUpgradeProcessBar(drone, ability, abilityIndx, parentElement, isUpgrading) {
            let droneItem = items.drones.find(e => e.name == drone.name);

            for (let i = 0; i < ability.statTitles.length; i++) {
                let title = ability.statTitles[i];
                let icon = ability.statIcons[i];

                let statData = droneItem.abilities[abilityIndx].stats[i];
                let stat = ability.stats[i];

                if (title) {
                    let element = document.createElement("div");
                    element.style = "display: flex; align-items: center; width: 100%; height: 60px;";
    
                    let iconDisplay = document.createElement("div");
                    iconDisplay.style = `position: absolute; width: 40px; height: 40px; background-size: 40px 40px; background-image: url('${icon}');`;
                    element.appendChild(iconDisplay);

                    let barHolder = document.createElement("div");
                    barHolder.style = "margin-left: 45px; width: 100%;";

                    let totalStat = statData?.base || statData;
                    let nextProgress = 0;
                    let lastProgress = 0;

                    if (typeof statData == "object") {
                        lastProgress = statData.level[drone.level - 1];
                        nextProgress = statData.level[drone.level];

                        for (let i = 0 ; i < statData.level.length; i++) {
                            totalStat += statData.level[i];
                        }
                    }

                    let statHolder = document.createElement("div");
                    statHolder.classList.add("stat-amount");
                    statHolder.innerHTML = UTILS.styleNumberWithComma(stat);
                    barHolder.appendChild(statHolder);
                    
                    if (drone.level < drone.maxlevel && nextProgress > 0) {
                        let nextProgressDisplay = document.createElement("div");
                        nextProgressDisplay.style = "position: absolute; color: #00ff00; top: 0px; right: 18px;";
                        nextProgressDisplay.innerHTML = `+${UTILS.styleNumberWithComma(nextProgress)}`;

                        statHolder.appendChild(nextProgressDisplay);
                    }

                    let titleDisplay = document.createElement("div");
                    titleDisplay.style = "color: rgb(67, 67, 67); font-size: 12px; margin-top: -5px;";
                    titleDisplay.innerHTML = title;
                    barHolder.appendChild(titleDisplay);

                    let bar = document.createElement("div");
                    bar.classList.add("stat-bar-style");
                    barHolder.appendChild(bar);

                    if (drone.level < drone.maxlevel && nextProgress > 0) {
                        let progressBar = document.createElement("div");
                        progressBar.style = "position: absolute; top: 0px; left: 0px; height: 100%; background-color: rgb(0, 255, 0);";

                        if (isUpgrading) progressBar.style.transition = "width .5s";
                        if (isUpgrading) {
                            progressBar.style.width = `${(stat / totalStat) * 100}%`;

                            setTimeout(() => {
                                progressBar.style.width = `${((stat + nextProgress) / totalStat) * 100}%`;
                            }, 100);
                        } else {
                            progressBar.style.width = `${((stat + nextProgress) / totalStat) * 100}%`;
                        }

                        bar.appendChild(progressBar);
                    }

                    let currentBar = document.createElement("div");
                    currentBar.classList.add("stat-bar-item");

                    if (isUpgrading) currentBar.style.transition = "width .5s";
                    if (isUpgrading) {
                        currentBar.style.width = `${((stat - lastProgress) / totalStat) * 100}%`;

                        setTimeout(() => {
                            currentBar.style.width = `${(stat / totalStat) * 100}%`;
                        }, 100);
                    } else {
                        currentBar.style.width = `${(stat / totalStat) * 100}%`;
                    }

                    bar.appendChild(currentBar);

                    element.appendChild(barHolder);

                    parentElement.appendChild(element);
                }
            }
        }
        viewDroneInDepth(drone, isStore, isChanging, slotId) { // slotId is for locating the owner shape
            moneyDisplayManager.displayItems(["microchips"]);
            elements.droneViewUI.style.display = "block";

            let droneImage = canvasDrawer.createUIItem(drone);
            droneImage.style = "width: 100%; height: 100%;";
            this.droneImageView.innerHTML = "";
            this.droneImageView.appendChild(droneImage);

            let levelIcon = document.createElement("div");
            levelIcon.classList.add("drone-level-display");
            levelIcon.style.backgroundColor = config.tierColors[drone.tier];
            levelIcon.innerHTML = drone.level;

            let nameDisplay = document.createElement("div");
            nameDisplay.style = "padding-left: 5px; padding-right: 10px;";
            nameDisplay.innerHTML = drone.name;

            this.droneViewNameLabel.innerHTML = "";
            this.droneViewNameLabel.appendChild(levelIcon);
            this.droneViewNameLabel.appendChild(nameDisplay);

            if (isStore) {
                this.droneViewUnequipButton.style.display = "none";
                this.droneViewEquipButton.style.display = "none";
                this.droneViewChangeButton.style.display = "none";
                this.droneViewUpgradeButton.style.display = "none";
                this.droneViewBuyButton.style.display = "flex";

                this.droneViewBuyMoneyIcon.style.backgroundImage = `url('../src/media-files/money/microchips.png'), none`;
                this.droneViewBuyMoneyDisplay.innerHTML = UTILS.styleNumberWithComma(drone.cost);
            } else {
                if (drone.owner != null && drone.owner != undefined) {
                    this.droneViewEquipButton.style.display = "none";
                    this.droneViewChangeButton.style.display = "flex";
                    this.droneViewUnequipButton.style.display = "flex";

                    this.droneViewChangeButton.onclick = () => {
                        doDarkModeTransition();
                        elements.droneViewUI.style.display = "none";

                        let shape = userProfile.shapes.find(e => e.sid == slotId);

                        this.changeSlot(slotId, shape, "drone", drone);
                    };

                    this.droneViewUnequipButton.onclick = () => {
                        doDarkModeTransition();

                        drone.owner = null;

                        userProfile.saveProfile();

                        this.droneViewBackButton.click();

                        let shape = userProfile.shapes.find(e => e.sid == slotId);

                        this.viewInDepth(shape, false, false, shape.slot);
                    };
                } else {
                    this.droneViewEquipButton.style.display = "flex";
                    this.droneViewChangeButton.style.display = "none";
                    this.droneViewUnequipButton.style.display = "none";

                    this.droneViewEquipButton.onclick = () => {
                        doDarkModeTransition();

                        drone.owner = slotId;

                        userProfile.saveProfile();

                        this.droneViewBackButton.click();

                        let shape = userProfile.shapes.find(e => e.sid == slotId);

                        this.viewInDepth(shape, false, false, shape.slot);
                    };
                }
                this.droneViewBuyButton.style.display = "none";

                if (drone.level < drone.maxlevel) {
                    this.droneViewUpgradeButton.style.display = "flex";
                } else {
                    this.droneViewUpgradeButton.style.display = "none";
                }
            }

            let isUpgrading = false;

            this.droneViewUpgradeButton.onclick = () => {
                doDarkModeTransition();
                this.droneViewUpgradeMenu.style.display = "block";

                this.droneViewUpgradeName.innerHTML = "";
                let levelDisplay = document.createElement("div");
                let nameDisplay = document.createElement("div");
                nameDisplay.style = "margin-left: 40px;"
                levelDisplay.classList.add("shape-view-upgrade-name-level-display");
                levelDisplay.innerHTML = drone.level;

                if (drone.level >= drone.maxlevel) {
                    nameDisplay.innerHTML = `<span style="color: white;">${drone.name}</span>`;
                } else {
                    nameDisplay.innerHTML = `<span style="color: white;">${drone.name}</span> upgrade to level ${drone.level + 1}`;
                }

                levelDisplay.style.backgroundColor = config.tierColors[drone.tier];
                this.droneViewUpgradeName.appendChild(levelDisplay);
                this.droneViewUpgradeName.appendChild(nameDisplay);

                this.droneViewUpgradeImage.innerHTML = "";
                let droneImg = canvasDrawer.createUIItem(drone);
                droneImg.style = "width: 100%; height: 100%;";
                this.droneViewUpgradeImage.appendChild(droneImg);

                this.droneViewUpgradeRightDisplay.innerHTML = "";

                let droneCost = config.droneCost[drone.level];

                this.droneViewUpgradeMoneyIcon.style.backgroundImage = `url("../src/media-files/money/microchips.png")`;
                this.droneViewUpgradeMoneyDisplay.innerHTML = droneCost;

                for (let i = 0; i < drone.abilities.length; i++) {
                    let ability = drone.abilities[i];
                    this.doDroneUpgradeProcessBar(drone, ability, i, this.droneViewUpgradeRightDisplay, isUpgrading);
                }

                if (drone.level < drone.maxlevel) {
                    this.droneViewUpgradeButton2.style.display = "flex";
                } else {
                    this.droneViewUpgradeButton2.style.display = "none";
                }

                this.droneViewUpgradeButton2.onclick = () => {
                    if (userProfile.bank.microchips - droneCost >= 0 && drone.level < drone.maxlevel) {
                        doDarkModeTransition();
                        userProfile.changeBank("microchips", -droneCost);
                        upgraderManager.upgradeDrone(drone);

                        isUpgrading = true;
                        this.droneViewUpgradeButton.click();
                    }
                };

                this.droneViewUpgradeBackButton.onclick = () => {
                    doDarkModeTransition();
                    this.droneViewUpgradeMenu.style.display = "none";
                    this.viewDroneInDepth(drone, isStore, isChanging, slotId);
                };
            };

            let isIngoldAndMicrochipsElement = false;

            this.droneViewBuyButton.onclick = () => {
                let amount = drone.cost;

                if (userProfile.bank.microchips - amount >= 0) {
                    this.purchaseDrone(drone, false, slotId);
                } else {
                    moneyDisplayManager.displayItems(["microchips", "gold"]);

                    let amountNeed = Math.abs(userProfile.bank.microchips - amount);

                    let goldCost = moneyConverter.convertMicrochipsToGold(amountNeed);

                    if (userProfile.bank.gold - goldCost >= 0) {
                        let goldAndMicrochipsElement = document.createElement("div");
                        goldAndMicrochipsElement.style = "position: absolute; display: flex; align-items: center; justify-content: center; flex-direction: column; left: 0px; top: 50%; transform: translateY(-50%); width: 100%; height: 500px;";
                        document.body.appendChild(goldAndMicrochipsElement);

                        let alertElement = document.createElement("div");
                        alertElement.style = "color: white; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-direction: column; width: 550px; height: 325px; border-radius: 4px; background-color: rgb(0, 0, 0, .6);";
                        alertElement.innerHTML = `
                        <div style="font-size: 24px;">ATTENTION</div>
                        <div>You are missing <span style="color: yellow;">${UTILS.styleNumberWithComma(amountNeed)}</span> microchips to purchase the item.</div>
                        <div>You can use <span style="color: yellow;">gold</span> as a replacement for the missing microchips.</div>
                        `;
                        goldAndMicrochipsElement.appendChild(alertElement);

                        let buttonsHolder = document.createElement("div");
                        buttonsHolder.style = "display: flex; align-items: center; margin-top: 10px; width: 550px; height: 75px;";
                        goldAndMicrochipsElement.appendChild(buttonsHolder);

                        let cancelButton = document.createElement("div");
                        cancelButton.style = "display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 24px; color: white; width: calc(50% - 5px); height: 100%; background-color: #f00; border-radius: 4px; cursor: pointer;";
                        cancelButton.innerHTML = "CANCEL";
                        buttonsHolder.appendChild(cancelButton);

                        cancelButton.onmouseover = () => {
                            cancelButton.style.backgroundColor = "#de0000";
                        };
                        cancelButton.onmouseout = () => {
                            cancelButton.style.backgroundColor = "#f00";
                        };

                        let confirmButton = document.createElement("div");
                        confirmButton.style = "display: flex; align-items: center; justify-content: center; flex-direction: column; font-weight: 700; font-size: 18px; color: white; margin-left: 10px; width: calc(50% - 5px); height: 100%; background-color: #0f0; border-radius: 4px; cursor: pointer;";
                        confirmButton.innerHTML = `
                        <div>CONFIRM</div>
                        <div style="display: flex; align-items: center; justify-content: center;">
                        <div style="width: 20px; height: 20px; background-size: 20px 20px; background-image: url('../src/media-files/money/gold.png');"></div>
                            <span>${UTILS.styleNumberWithComma(goldCost)}</span>
                        </div>
                                    `;
                        buttonsHolder.appendChild(confirmButton);

                        confirmButton.onmouseover = () => {
                            confirmButton.style.backgroundColor = "#00de00";
                        };
                        confirmButton.onmouseout = () => {
                            confirmButton.style.backgroundColor = "#0f0";
                        };

                        isIngoldAndMicrochipsElement = true;

                        cancelButton.onclick = () => {
                            moneyDisplayManager.displayItems(["microchips"]);

                            goldAndMicrochipsElement.remove();

                            isIngoldAndMicrochipsElement = false;
                        };
                        confirmButton.onclick = () => {
                            userProfile.changeBank("microchips", -userProfile.bank.microchips);
                            userProfile.changeBank("gold", -goldCost);

                            this.purchaseDrone(drone, true, slotId);
                        };
                    }
                }
            };

            this.droneItemViewLeft.innerHTML = "";
            this.droneItemViewRight.innerHTML = "";

            for (let i = 0; i < drone.abilities.length; i++) {
                let ability = drone.abilities[i];

                let element = document.createElement("div");
                element.style = `position: absolute; top: ${((i + 1) % 2 == 1) ? 0 : 50}%; width: 100%; height: calc(50% - 2px); border: solid; border-color: white; border-width: 0px 0px 2px 0px;`;

                let iconHolder = document.createElement("div");
                iconHolder.style = `position: absolute; display: flex; align-items: center; justify-content: center; top: 0px; left: 0px; width: 125px; height: 125px;`;
                let icon = document.createElement("div");
                icon.classList.add("drone-ability-icon-image");
                icon.style.backgroundImage = `url('${config.droneAbilityImages[ability.name]}'), none`;
                iconHolder.appendChild(icon);
                element.appendChild(iconHolder);

                let dataHolder = document.createElement("div");
                dataHolder.classList.add("drone-ability-data-holder");

                let nameHolder = document.createElement("div");
                nameHolder.classList.add("drone-ability-name-holder");

                let nameDisplay = document.createElement("div");
                nameDisplay.innerHTML = ability.name;

                nameHolder.appendChild(nameDisplay);

                let statHolder = document.createElement("div");
                statHolder.classList.add("drone-ability-stat-holder");

                let statIcon = document.createElement("div");
                statIcon.style = `width: 20px; height: 20px; background-size: 20px 20px; background-image: url('${ability.statIcons[0]}');`;

                let statAmount = document.createElement("div");
                statAmount.style = "color: white; margin-left: 4px;";
                statAmount.innerHTML = UTILS.droneStatAmount(ability.name, ability.stats[0]);

                statHolder.appendChild(statIcon);
                statHolder.appendChild(statAmount);

                dataHolder.appendChild(nameHolder);
                dataHolder.appendChild(statHolder);

                let moreInfoButton = document.createElement("div");
                moreInfoButton.classList.add("more-info-button");
                moreInfoButton.innerHTML = "i";

                moreInfoButton.onclick = () => {
                    this.viewDroneAbilityDescription(ability);
                };

                element.appendChild(dataHolder);
                element.appendChild(moreInfoButton);

                if (i <= 1) {
                    this.droneItemViewLeft.appendChild(element);
                } else {
                    this.droneItemViewRight.appendChild(element);
                }
            }

            if (drone.abilities.length < 2) {
                let linePattern = document.createElement("div");
                linePattern.style = "width: 100%; height: 100%; border-radius: 6px;";
                linePattern.classList.add("diagonal-line-pattern");

                this.droneItemViewRight.appendChild(linePattern);

                if (drone.abilities.length == 1) {
                    let linePattern = document.createElement("div");
                    linePattern.style = "position: absolute; top: 50%; width: 100%; height: 50%; border-radius: 6px;";
                    linePattern.classList.add("diagonal-line-pattern");

                    this.droneItemViewLeft.appendChild(linePattern);
                }
            }

            this.droneViewBackButton.onclick = () => {
                if (isIngoldAndMicrochipsElement) return;

                doDarkModeTransition();
                if (isChanging) {
                    moneyDisplayManager.displayItems(["powercells", "gold", "silver"]);

                    elements.shapeViewUI.style.display = "block";
                    elements.droneViewUI.style.display = "none";
                } else {
                    elements.chooseShapesUI.style.display = "block";
                    elements.droneViewUI.style.display = "none";
                }
            };

        }
        buildPilotSkillDisplay(type, indx, tier, skill, pilotLevel) {
            let element = document.createElement("div");
            element.style = "position: relative; display: flex; align-items: center; width: 100%; height: 65px; margin-top: 7px; background-color: rgba(0, 0, 0, .15); border-radius: 4px;";

            if (type == "store" || type == "empty") {
                element.style.width = "calc(100% - 4px)";
                element.style.border = "solid #00ff00 2px";

                let weirdIcon = document.createElement("div");
                weirdIcon.style = "pointer-events: none; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-left: 5px; width: 45px; height: 45px; border-radius: 2px; background-color: rgba(0, 255, 0, .25);";
                weirdIcon.innerHTML = `
                <span style="font-size: 80px; color: rgba(0, 255, 0, .45); font-weight: 400;" class="material-symbols-outlined">
                    close
                </span>
                `;
                element.appendChild(weirdIcon);

                let textDisplay = document.createElement("div");
                textDisplay.style = "font-size: 20px; margin-left: 8px; color: #00ff00; font-weight: 600;";
                textDisplay.innerHTML = "Empty skill slot";
                element.appendChild(textDisplay);

                if (type == "empty") {
                    element.style.cursor = "pointer";

                    let addIconHolder = document.createElement("div");
                    addIconHolder.style = "position: absolute; display: flex; align-items: center; justify-content: center; width: 65px; height: 65px; right: 15px; top: 0px;";
                    addIconHolder.innerHTML = `
                    <span style="font-size: 80px; color: #00ff00;" class="material-symbols-outlined">
                        add
                    </span>
                    `;
    
                    element.appendChild(addIconHolder);

                    element.onmouseover = () => {
                        element.style.backgroundColor = "rgba(0, 0, 0, .25)";
                    };

                    element.onmouseout = () => {
                        element.style.backgroundColor = "rgba(0, 0, 0, .15)";
                    };
                }
            } else if (type == "locked") {
                let addIconHolder = document.createElement("div");
                addIconHolder.style = "position: absolute; display: flex; align-items: center; justify-content: center; width: 65px; height: 65px; left: 5px; top: 0px;";
                addIconHolder.innerHTML = `
                <span style="font-size: 50px; color: #3d3d3d;" class="material-symbols-outlined">
                    lock
                </span>
                `;
    
                element.appendChild(addIconHolder);

                let unlockDisplayHolder = document.createElement("div");
                unlockDisplayHolder.style = "display: flex; align-items: center; justify-content: center; font-size: 18px; position: absolute; left: 65px; top: 0px; height: 65px;";
                unlockDisplayHolder.innerHTML = `
                <span class="material-symbols-outlined">
                    add
                </span>
                skill at level
                <div style="display: flex; align-items: center; justify-content: center; margin-left: 4px; border-radius: 100%; width: 25px; height: 25px; background-color: ${config.tierColors[tier]};">
                ${indx + 1}
                </div>
                `;
                element.appendChild(unlockDisplayHolder);
            } else if (type == "skill" || type == "selector" || type == "purchase") {
                if (type == "selector" || type == "purchase") {
                    element.style.width = "calc(100% - 10px)";
                    element.style.cursor = "pointer";

                    if (type == "purchase") {
                        element.style.height = "95px";
                    }
                }

                let rgb =  UTILS.hexToRgb(config.tierColors[skill.tier])
                element.style.backgroundColor = `rgba(${rgb}, .75)`;

                let iconDisplay = document.createElement("div");
                iconDisplay.style = `position: absolute; display: flex; align-items: center; justify-content: center; width: 65px; height: 65px; left: 5px; top: 0px; background-image: url('${skill.imageSource}'); background-size: 65px 65px;`;
                element.appendChild(iconDisplay);

                if (type == "purchase") {
                    iconDisplay.style.top = "13.75px";
                    element.style.pointerEvents = "none";

                    let purchaseButton = document.createElement("div");
                    purchaseButton.style = "pointer-events: auto; display: flex; align-items: center; justify-content: center; position: absolute; bottom: 5px; right: 15px; width: 150px; height: 35px; border-radius: 6px;";
                    purchaseButton.classList.add("upgrade-button-hover");

                    let moneyDisplay = document.createElement("div");
                    moneyDisplay.style = "width: 25px; height: 25px; background-size: 25px 25px; background-image: url('src/media-files/money/gold.png');";
                    purchaseButton.appendChild(moneyDisplay);

                    let cost = document.createElement("div");
                    cost.style = "color: white;";
                    cost.innerHTML = UTILS.getSkillCost(tier, skill, pilotLevel);
                    purchaseButton.appendChild(cost);

                    element.appendChild(purchaseButton);
                }

                let dataHolder = document.createElement("div");
                dataHolder.style = "position: absolute; display: flex; justify-content: center; flex-direction: column; top: 0px; left: 75px; height: 65px; width: calc(100% - 75px);";
                dataHolder.innerHTML = `
                <div style="position: relative; color: white; height: 24.5px; font-size: 18px;">
                    <div style="position: absolute; left: 0px;">${skill.name}</div>
                    <div style="position: absolute; right: 15px;">${pilotSkillManager.styleSkillValue(skill)}</div>
                </div>
                <div style="color: white; margin-top: -5px; font-weight: 500; font-size: 12px;">${skill.description}</div>
                `;
                element.appendChild(dataHolder);
            }

            return element;
        }
        modifyPilotSkill(type, pilot, slot) {
            let skills = pilotSkillManager.getSkills(pilot);
            if (type == "empty") {
                pilot.skills.push(new skill(skills[Math.floor(Math.random() * skills.length)], slot));

                userProfile.saveProfile();
            }
        }
        changePilotSkill(pilot, callback) {
            moneyDisplayManager.displayItems(["gold"]);

            doDarkModeTransition();
            elements.pilotViewUI.style.display = "none";
            elements.pilotSkillChangeUi.style.display = "block";

            let sorted = pilot.skills.sort((a, b) => a.slot - b.slot);

            let skillClassConstructor = skill;

            let selectedSkill;

            this.pilotSkillsLeftSideDisplay.innerHTML = "";
            this.pilotSkillsRightSideDisplay.innerHTML = "";

            for (let i = 0; i < sorted.length; i++) {
                let skill = sorted[i];

                let data = this.buildPilotSkillDisplay("selector", i, pilot.tier, skill);

                data.onclick = () => {
                    if (selectedSkill) {
                        selectedSkill.style.width = "calc(100% - 10px)";
                        selectedSkill.style.border = "none";
                    } else {
                        let avaiableSkills = pilotSkillManager.getSkills(pilot);

                        for (let i = 0; i < avaiableSkills.length; i++) {
                            let Skill = avaiableSkills[i];

                            let Data = this.buildPilotSkillDisplay("purchase", i, pilot.tier, Skill, pilot.level);

                            let cost = UTILS.getSkillCost(pilot.tier, Skill, pilot.level);

                            Data.onclick = () => {
                                if (userProfile.bank.gold - cost >= 0) {
                                    doDarkModeTransition();
                                    userProfile.changeBank("gold", -cost);

                                    pilot.skills.push(new skillClassConstructor(Skill, skill.slot));

                                    let oldIndx = pilot.skills.findIndex(e => e == skill);
                                    pilot.skills.splice(oldIndx, 1);

                                    userProfile.saveProfile();

                                    callback();
                                }
                            };

                            this.pilotSkillsRightSideDisplay.appendChild(Data);
                        }
                    }

                    selectedSkill = data;

                    data.style.width = "calc(100% - 15px)";
                    data.style.border = "solid";
                    data.style.borderWidth = "2.5px";
                    data.style.borderColor = "white";
                };

                this.pilotSkillsLeftSideDisplay.appendChild(data);
            }

            this.pilotSkillsViewBackButton.onclick = () => {
                doDarkModeTransition();
                elements.pilotViewUI.style.display = "block";
                elements.pilotSkillChangeUi.style.display = "none";
                moneyDisplayManager.displayItems(["gold", "tokens"]);
            };
        }
        viewPilotInDepth(pilot, isStore, isChanging, slotId) { // slotId is for locating the owner shape
            moneyDisplayManager.displayItems(["gold", "tokens"]);
            elements.pilotViewUI.style.display = "block";

            this.pilotDisplayName.innerHTML = "";
            let nameDisplayHolder = document.createElement("div");
            nameDisplayHolder.style = "display: flex; align-items: center;";

            let levelDisplay = document.createElement("div");
            levelDisplay.style = "display: flex; align-items: center; width: 37px; height: 37px; justify-content: center; border-radius: 100%; border: solid; border-color: white; border-width: 1px;";
            levelDisplay.style.backgroundColor = config.tierColors[pilot.tier];
            levelDisplay.innerHTML = pilot.level;

            let nameDisplay = document.createElement("div");
            nameDisplay.style = "margin-left: 7px;";
            nameDisplay.innerHTML = pilot.name;

            nameDisplayHolder.appendChild(levelDisplay);
            nameDisplayHolder.appendChild(nameDisplay);

            this.pilotDisplayName.appendChild(nameDisplayHolder);

            this.pilotDisplayImage.innerHTML = "";
            let image = imageManager.getImage(pilot.imageSource);
            image.style = "width: 100%; height: 100%;";
            this.pilotDisplayImage.appendChild(image);

            let parentShape = userProfile.shapes.find(e => e.sid == slotId);

            if (isStore || isChanging) {
                this.pilotOperatesHeader.innerHTML = "Unassigned";
                this.pilotHeaderDisplayLevel.style.display = "none";
                this.pilotHeaderDisplayName.innerHTML = "";
                this.pilotSkillHeaderActiveSkills.innerHTML = "0";
                this.pilotSkillHeaderMaxSkills.innerHTML = pilot.maxSkills;
                this.changePilotSkillButton.style.display = "none";

                this.pilotSkillsDisplay.innerHTML = "";
                for (let i = 0; i < pilot.maxSkills; i++) {
                    if (isStore) {
                        let data = this.buildPilotSkillDisplay("store", i);

                        this.pilotSkillsDisplay.appendChild(data);
                    } else {
                        let skill = pilot.skills.find(e => e.slot == i);
                        let data;

                        if (skill) {
                            data = this.buildPilotSkillDisplay("skill", i, pilot.tier, skill);
                        } else if (i < pilot.level) {
                            data = this.buildPilotSkillDisplay("store", i);
                        } else {
                            data = this.buildPilotSkillDisplay("locked", i, pilot.tier);
                        }

                        if (data) this.pilotSkillsDisplay.appendChild(data);
                    }
                }
            } else {
                this.pilotOperatesHeader.innerHTML = "Operates:";
                this.pilotHeaderDisplayLevel.style.display = "flex";
                if (parentShape.level == 25) {
                    this.pilotHeaderDisplayLevel.innerHTML = 1;
                } else if (parentShape.level > 12) {
                    this.pilotHeaderDisplayLevel.innerHTML = parentShape.level - 12;
                } else {
                    this.pilotHeaderDisplayLevel.innerHTML = parentShape.level;
                }

                this.pilotHeaderDisplayLevel.style.backgroundColor = config.tierColors[parentShape.tier];

                if (parentShape.level == 25) {
                    this.pilotHeaderDisplayName.innerHTML = `${parentShape.name} <span style="color: #ffff00;">MK3</span>`;
                } else if (parentShape.level > 12) {
                    this.pilotHeaderDisplayName.innerHTML = `${parentShape.name} <span style="color: #00ff00;">MK2</span>` ;
                } else {
                    this.pilotHeaderDisplayName.innerHTML = parentShape.name;
                }

                this.pilotSkillHeaderActiveSkills.innerHTML = pilot.skills.filter(e => e).length;
                this.pilotSkillHeaderMaxSkills.innerHTML = pilot.level;
                this.changePilotSkillButton.style.display = "flex";

                let hasSkills = pilot.skills.find(e => e);
                this.changePilotSkillButton.onclick = () => {
                    if (!hasSkills) {
                        errorEventManager.error("Please train your pilot before trying to retrain them");
                    } else {
                        this.changePilotSkill(pilot, () => {
                            elements.pilotSkillChangeUi.style.display = "none";
                            this.viewPilotInDepth(pilot, isStore, isChanging, slotId);
                        });
                    }
                };

                this.pilotSkillsDisplay.innerHTML = "";

                for (let i = 0; i < pilot.maxSkills; i++) {
                    let skill = pilot.skills.find(e => e.slot == i);
                    let data;

                    if (skill) {
                        data = this.buildPilotSkillDisplay("skill", i, pilot.tier, skill);
                    } else if (i < pilot.level) {
                        data = this.buildPilotSkillDisplay("empty", i);

                        data.onclick = () => {
                            doDarkModeTransition();
                            this.modifyPilotSkill("empty", pilot, i);
                            this.viewPilotInDepth(pilot, isStore, isChanging, slotId);
                        };
                    } else {
                        data = this.buildPilotSkillDisplay("locked", i, pilot.tier);
                    }

                    if (data) this.pilotSkillsDisplay.appendChild(data);
                }
            }

            if (isStore) {
                this.pilotViewEquipButton.style.display = "none";
                this.pilotViewUnequipButton.style.display = "none";
                this.pilotViewUpgradeButton.style.display = "none";
                this.pilotViewBuyButton.style.display = "flex";
                this.pilotViewChangeButton.style.display = "none";
                this.pilotViewBuyMoneyDisplay.innerHTML = UTILS.styleNumberWithComma(pilot.cost);

                this.pilotViewBuyButton.onclick = () => {
                    if (userProfile.bank.gold - pilot.cost >= 0) {
                        doDarkModeTransition();
                        userProfile.changeBank("gold", -pilot.cost);

                        let oldPilot = userProfile.pilots.find(e => e.owner == slotId);
                        if (oldPilot) {
                            oldPilot.owner = null;
                        }

                        storeManager.addItem("pilot", pilot.name, undefined, slotId);
                        elements.pilotViewUI.style.display = "none";

                        let shape = userProfile.shapes.find(e => e.sid == slotId);

                        this.viewInDepth(shape, false, false, shape.slot);
                    }
                };
            } else {
                if (isChanging) {
                    this.pilotViewEquipButton.style.display = "flex";
                    this.pilotViewUnequipButton.style.display = "none";
                    this.pilotViewUpgradeButton.style.display = "none";
                    this.pilotViewBuyButton.style.display = "none";
                    this.pilotViewChangeButton.style.display = "none";

                    this.pilotViewEquipButton.onclick = () => {
                        doDarkModeTransition();
                        elements.pilotViewUI.style.display = "none";
                        
                        let oldPilot = userProfile.pilots.find(e => e.owner == slotId);
                        if (oldPilot) {
                            oldPilot.owner = null;
                        }

                        pilot.owner = slotId;
                        userProfile.saveProfile();

                        let shape = userProfile.shapes.find(e => e.sid == slotId);
                        this.viewInDepth(shape, false, false);
                    };
                } else {
                    this.pilotViewEquipButton.style.display = "none";
                    this.pilotViewUnequipButton.style.display = "flex";
                    this.pilotViewUpgradeButton.style.display = "flex";
                    this.pilotViewBuyButton.style.display = "none";
                    this.pilotViewChangeButton.style.display = "flex";

                    if (pilot.level >= pilot.maxSkills) {
                        this.pilotViewUpgradeButton.style.display = "none";
                    } else {
                        let pilotCost = config.pilotCost[pilot.level];

                        this.pilotViewUpgradeButton.onclick = () => {
                            if (userProfile.bank.gold - pilotCost >= 0) {
                                doDarkModeTransition();
                                userProfile.changeBank("gold", -pilotCost);

                                pilot.level++;
                                userProfile.saveProfile();
                                this.viewPilotInDepth(pilot, isStore, isChanging, slotId);
                            }
                        };

                        this.pilotViewUpgradeMoneyDisplay.innerHTML = UTILS.styleNumberWithComma(pilotCost);
                    }

                    this.pilotViewChangeButton.onclick = () => {
                        doDarkModeTransition();
                        elements.pilotViewUI.style.display = "none";

                        let shape = userProfile.shapes.find(e => e.sid == slotId);

                        this.changeSlot(slotId, shape, "pilot", pilot);
                    };

                    this.pilotViewUnequipButton.onclick = () => {
                        doDarkModeTransition();
                        pilot.owner = null;
                        userProfile.saveProfile();
                        this.pilotViewBackButton.click();
                    };
                }
            }

            this.pilotStoryDisplay.innerHTML = pilot.description;

            this.pilotViewBackButton.onclick = () => {
                elements.pilotViewUI.style.display = "none";

                console.log(isChanging);

                if (isChanging) {
                    doDarkModeTransition();
                    elements.chooseShapesUI.style.display = "block";
                } else {
                    let shape = userProfile.shapes.find(e => e.sid == slotId);
                    this.viewInDepth(shape, false, false);
                }
            };
        }
        needToBeEquippedMessage(buttonPressed) {
            let mainBody = document.createElement("div");
            mainBody.style = "position: absolute; top: 0px; left: 0px; width: 100%; height: 100%;";

            let needToBeEquipped = document.createElement("div");
            needToBeEquipped.style = "position: absolute; display: flex; align-items: center; justify-content: center; flex-direction: column; left: 0px; top: 50%; transform: translateY(-50%); width: 100%; height: 500px;";
            
            mainBody.appendChild(needToBeEquipped);
            document.body.appendChild(mainBody);

            let alertElement = document.createElement("div");
            alertElement.style = "color: white; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-direction: column; width: 550px; height: 325px; border-radius: 4px; background-color: rgb(0, 0, 0, .6);";
            alertElement.innerHTML = `
            <div style="font-size: 24px;">ATTENTION</div>
            <div style="text-align: center;">Shapes have to be equipped in the hanger before you can change ${buttonPressed}.</div>
            <div>Please equip the shape into your hanger.</div>
            `;
            needToBeEquipped.appendChild(alertElement);

            let buttonsHolder = document.createElement("div");
            buttonsHolder.style = "display: flex; align-items: center; margin-top: 10px; width: 550px; height: 75px;";
            needToBeEquipped.appendChild(buttonsHolder);

            let okButton = document.createElement("div");
            okButton.style = "display: flex; align-items: center; justify-content: center; flex-direction: column; font-weight: 700; font-size: 18px; color: white; width: 100%; height: 100%; background-color: #0f0; border-radius: 4px; cursor: pointer;";
            okButton.innerHTML = `<div>OK</div>`;
            buttonsHolder.appendChild(okButton);

            okButton.onmouseover = () => {
                okButton.style.backgroundColor = "#00de00";
            };
            okButton.onmouseout = () => {
                okButton.style.backgroundColor = "#0f0";
            };
            okButton.onclick = () => {
                mainBody.remove();
            };
        }
        viewInDepth(shape, isStore, isChanging, slotId, isModuleData) {
            let isUpgrading = false;

            doDarkModeTransition();
            moneyDisplayManager.displayItems(["powercells", "gold", "silver"]);
            elements.hangerUI.style.display = "none";
            moneyDisplayManager.holderElement.style.top = "5px";

            this.shapeViewUI.style.display = "block";
            this.imageElement.innerHTML = "";
            this.upgradeImageElement.innerHTML = "";
            this.shapeViewInfoImage.innerHTML = "";

            let shapeImage = canvasDrawer.createUIItem(shape);
            shapeImage.style = "width: 100%; height: 100%;";
            this.imageElement.appendChild(shapeImage);

            let shapeImage2 = canvasDrawer.createUIItem(shape);
            shapeImage2.style = "width: 100%; height: 100%;";
            this.upgradeImageElement.appendChild(shapeImage2);

            let shapeImage3 = canvasDrawer.createUIItem(shape);
            shapeImage3.style = "width: 100%; height: 100%;";
            this.shapeViewInfoImage.appendChild(shapeImage3);

            if (shape.level == 25) {
                this.levelDisplay.innerHTML = shape.level - 24;
            } else if (shape.level > 12) {
                this.levelDisplay.innerHTML = shape.level - 12;
            } else {
                this.levelDisplay.innerHTML = shape.level;
            }
            this.levelDisplay.style.backgroundColor = config.tierColors[shape.tier];
            this.nameDisplay.innerHTML = shape.name;
            if (shape.level == 25) {
                this.nameDisplay.innerHTML += `<span style="color: #ffff00;">&nbsp;MK3</span>`;
            } else if (shape.level > 12) {
                this.nameDisplay.innerHTML += `<span style="color: #00ff00;">&nbsp;MK2</span>`;
            }

            let spiltName = shape.name.split(" ");
            let industryName = spiltName[spiltName.length - 1];
            this.industryDisplay.textContent = industryName;
            this.showImageBadge(industryName.toLowerCase());

            this.statsDisplay.innerHTML = "";
            let items = ["healthData", "speedData"];
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                let element = this.showStat("shape", shape, item);
                if (element) {
                    this.statsDisplay.appendChild(element);
                }
            }

            let modules = isStore ? [] : userProfile.modules.filter(e => e.owner == shape.sid);
            let weapons = isStore ? storeManager.setUpStoreWeapons(shape) : userProfile.weapons.filter(e => e.owner == shape.sid).sort((a, b) => a.slot - b.slot);

            this.drawRightDisplay(shape, "weapon", weapons, isStore);

            this.viewModulesButton.style.cursor = "pointer";

            this.viewWeaponsButton.onclick = () => {
                this.drawRightDisplay(shape, "weapon", weapons, isStore);

                this.viewModulesButton.style.color = "#b3b3b3";
                this.viewModulesButton.style.backgroundColor = "rgb(0, 0, 0, .1)";
                this.viewModulesButton.style.cursor = "pointer";
                this.viewWeaponsButton.style.color = "white";
                this.viewWeaponsButton.style.backgroundColor = "rgb(255, 255, 255, .25)";
                this.viewWeaponsButton.style.cursor = "default";
            };
            this.viewModulesButton.onclick = () => {
                this.drawRightDisplay(shape, "module", modules, isStore);

                this.viewModulesButton.style.color = "white";
                this.viewModulesButton.style.backgroundColor = "rgb(255, 255, 255, .25)";
                this.viewModulesButton.style.cursor = "default";
                this.viewWeaponsButton.style.color = "#b3b3b3";
                this.viewWeaponsButton.style.backgroundColor = "rgb(0, 0, 0, .1)";
                this.viewWeaponsButton.style.cursor = "pointer";
            };

            if (isModuleData) {
                if (isModuleData == "Defense" || isModuleData == "Assault" || isModuleData == "Universal" || isModuleData == "Active") {
                    this.viewModulesButton.click();
                } else {
                    this.viewWeaponsButton.click();
                }
            } else {
                this.viewWeaponsButton.click();
            }

            let dynamicElements = [UTILS.getElement("view-pilot-image-holder"), UTILS.getElement("view-drone-image-holder")];
            let otherElements = [UTILS.getElement("view-pilot-image"), UTILS.getElement("view-drone-image")];

            for (let i = 0; i < this.tmpElements.length; i++) {
                this.tmpElements[i].remove(); // removes the useless diagonal-line-pattern element
            }

            this.tmpElements = []; // resets the array

            if (isStore) {
                for (let i = 0; i < otherElements.length; i++) otherElements[i].style.display = "none";
                for (let i = 0; i < dynamicElements.length; i++) {
                    let parentElement = dynamicElements[i];
                    let tmpElement = document.createElement("div");
                    tmpElement.classList.add("diagonal-line-pattern");
                    tmpElement.style = "width: 100%; height: 100%;";
                    parentElement.appendChild(tmpElement);

                    parentElement.style.pointerEvents = "none";

                    this.tmpElements.push(tmpElement);
                }
            } else {
                for (let i = 0; i < dynamicElements.length; i++) dynamicElements[i].style.pointerEvents = "auto";

                for (let i = 0; i < otherElements.length; i++) {
                    otherElements[i].innerHTML = "";
                    otherElements[i].style.display = "flex";
                }

                let pilot = userProfile.pilots.find(e => e.owner == shape.sid);

                dynamicElements[0].onclick = () => {
                    if (shape.slot != null && shape.slot != undefined) {
                        this.shapeViewUI.style.display = "none";
                        if (pilot) {
                            doDarkModeTransition();
                            this.viewPilotInDepth(pilot, false, false, shape.sid);
                        } else {
                            this.changeSlot(shape.sid, shape, "pilot");
                        }
                    } else {
                        this.needToBeEquippedMessage("pilots");
                    }
                };

                let drone = userProfile.drones.find(e => e.owner == shape.sid);

                dynamicElements[1].onclick = () => {
                    if (shape.slot != null && shape.slot != undefined) {
                        this.shapeViewUI.style.display = "none";
                        if (drone) {
                            doDarkModeTransition();
                            this.viewDroneInDepth(drone, false, true, shape.sid);
                        } else {
                            this.changeSlot(shape.sid, shape, "drone");
                        }
                    } else {
                        this.needToBeEquippedMessage("drones");
                    }
                };

                if (drone) {
                    let droneImg = canvasDrawer.createUIItem(drone);
                    droneImg.style = "width: 90%; height: 90%;";
                    otherElements[1].appendChild(droneImg);
                }

                if (pilot) {
                    let pilotImg = imageManager.getImage(pilot.imageSource);
                    pilotImg.style = "width: 90%; height: 90%;";
                    otherElements[0].appendChild(pilotImg);
                }
            }

            this.shapeAbilityViewName.innerHTML = "";
            if (shape.abilities.length) {
                this.shapeAbilityView.classList.remove("diagonal-line-pattern");
                this.shapeAbilityViewImage.style.display = "block";

                if (shape.abilities.length == 1) {
                    let ability = shape.abilities[0];

                    this.shapeAbilityViewImage.innerHTML = "";

                    let abilityImage = imageManager.getImage(ability.imageSource);
                    abilityImage.style = "width: 100%; height: 100%";
                    this.shapeAbilityViewImage.appendChild(abilityImage);

                    this.shapeAbilityViewName.innerHTML = ability.name;
                }
            } else {
                this.shapeAbilityView.classList.add("diagonal-line-pattern");
                this.shapeAbilityViewImage.innerHTML = "";
                this.shapeAbilityViewImage.style.display = "none";
            }

            this.shapeViewBackButton.onclick = () => {
                doDarkModeTransition();

                if (isStore || isChanging) {
                    elements.chooseShapesUI.style.display = "block";
                    this.shapeViewUI.style.display = "none";
                } else {
                    elements.hangerUI.style.display = "block";
                    this.shapeViewUI.style.display = "none";
                    this.updateHanger();
                }
            };

            this.shapeViewMoreInfo.onclick = () => {
                doDarkModeTransition();
                moneyDisplayManager.displayItems([]);
                this.shapeViewInfoMenu.style.display = "block";

                this.shapeViewInfoName.innerHTML = "";
                let levelDisplay = document.createElement("div");
                let nameDisplay = document.createElement("div");
                nameDisplay.style = "margin-left: 40px;"
                levelDisplay.classList.add("shape-view-upgrade-name-level-display");
                if (shape.level == 25) {
                    levelDisplay.innerHTML = shape.level - 24;
                } else if (shape.level > 12) {
                    levelDisplay.innerHTML = shape.level - 12;
                } else {
                    levelDisplay.innerHTML = shape.level;
                }

                if (shape.level == 25) {
                    nameDisplay.innerHTML = `<span style="color: white;">${shape.name}</span> <span style="color: #ffff00">MK3</span>`;
                } else if (shape.level > 12) {
                    nameDisplay.innerHTML = `<span style="color: white;">${shape.name}</span> <span style="color: #00ff00">MK2</span>`;
                } else {
                    nameDisplay.innerHTML = `<span style="color: white;">${shape.name}</span>`;
                }

                levelDisplay.style.backgroundColor = config.tierColors[shape.tier];
                this.shapeViewInfoName.appendChild(levelDisplay);
                this.shapeViewInfoName.appendChild(nameDisplay);

                this.doShapeDescriptionDisplay(shape);

                this.shapeViewInfoBackButton.onclick = () => {
                    doDarkModeTransition();
                    this.shapeViewInfoMenu.style.display = "none";
                    this.viewInDepth(shape, isStore, isChanging, slotId);
                };
            };

            let needMoreSilverIsOn = false;

            this.shapeViewUpgradeButton.onclick = () => {
                doDarkModeTransition();
                moneyDisplayManager.displayItems(["gold", "silver", "platinum", "tokens"]);
                this.shapeUpgradeViewMenu.style.display = "block";

                let items = ["healthData", "speedData"];
                this.shapeViewUpgradeRightDisplay.innerHTML = "";
                for (let i = 0; i < items.length; i++) {
                    let item = items[i];
                    let element = this.showStat("shape", shape, item, true, isUpgrading);
                    if (element) {
                        this.shapeViewUpgradeRightDisplay.appendChild(element);
                    }
                }

                if (shape.level == 24) {
                    this.shapeViewUpgradeMoneyIcon.style.backgroundImage = `url('../src/media-files/money/tokens.png'), none`;
                } else if (shape.level == 12) {
                    this.shapeViewUpgradeMoneyIcon.style.backgroundImage = `url('../src/media-files/money/gold.png'), none`;
                } else {
                    this.shapeViewUpgradeMoneyIcon.style.backgroundImage = `url('../src/media-files/money/silver.png'), none`;
                }

                let amount = config.silverUpgrades[shape.tier]?.shapes[shape.level] || "undefined";
                if (shape.level > 12) {
                    amount = config.silverUpgradesMK2[shape.tier]?.shapes[shape.level - 12] || "undefined";
                }
                if (shape.level == 24) {
                    this.shapeViewUpgradeMoneyDisplay.innerHTML = config.mk3UpgradeCost[shape.tier];
                    this.shapeViewUpgradeText.innerHTML = "ENHANCE";
                } else if (shape.level == 12) {
                    this.shapeViewUpgradeMoneyDisplay.innerHTML = config.mk2UpgradeCost;
                    this.shapeViewUpgradeText.innerHTML = "ENHANCE";
                } else if (amount != "undefined") {
                    this.shapeViewUpgradeText.innerHTML = "UPGRADE";
                    this.shapeViewUpgradeMoneyDisplay.innerHTML = amount >= 1e6 ? UTILS.abbreviateNumber(amount) : UTILS.styleNumberWithComma(amount);
                }

                this.shapeViewUpgradeButton2.onclick = () => {
                    if (needMoreSilverIsOn) return;
                    if (shape.level < 25) {
                        if (shape.level == 12 || shape.level == 24) {
                            if (shape.level == 24) {
                                if (userProfile.bank.tokens - config.mk3UpgradeCost[shape.tier] >= 0) {
                                    isUpgrading = true;
                                    userProfile.changeBank("tokens", -config.mk3UpgradeCost[shape.tier]);
                                    moneyDisplayManager.displayItems(["gold", "silver", "platinum", "tokens"]);
                                    upgraderManager.upgradeShape(shape);
                                    userProfile.saveProfile();
                                    this.shapeViewUpgradeButton.click();
                                }
                            } else {
                                if (userProfile.bank.gold - config.mk2UpgradeCost >= 0) {
                                    isUpgrading = false;
                                    userProfile.changeBank("gold", -config.mk2UpgradeCost);
                                    moneyDisplayManager.displayItems(["gold", "silver", "platinum", "tokens"]);
                                    shape.level++;
                                    userProfile.saveProfile();
                                    this.shapeViewUpgradeButton.click();
                                }
                            }
                        } else if (shape.level < 12 || shape.level > 12) {
                            if (userProfile.bank.silver - amount >= 0) {
                                isUpgrading = true;
                                userProfile.changeBank("silver", -amount);
                                moneyDisplayManager.displayItems(["gold", "silver", "platinum", "tokens"]);
                                upgraderManager.upgradeShape(shape);
                                this.shapeViewUpgradeButton.click();
                            } else {
                                let amountNeed = Math.abs(userProfile.bank.silver - amount);

                                let goldCost = moneyConverter.convertSilverToGold(amountNeed);

                                if (userProfile.bank.gold - goldCost >= 0) {
                                    needMoreSilverIsOn = true;

                                    let goldAndSilverElement = document.createElement("div");
                                    goldAndSilverElement.style = "position: absolute; display: flex; align-items: center; justify-content: center; flex-direction: column; left: 0px; top: 50%; transform: translateY(-50%); width: 100%; height: 500px;";
                                    document.body.appendChild(goldAndSilverElement);

                                    let alertElement = document.createElement("div");
                                    alertElement.style = "color: white; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-direction: column; width: 550px; height: 325px; border-radius: 4px; background-color: rgb(0, 0, 0, .6);";
                                    alertElement.innerHTML = `
                                    <div style="font-size: 24px;">ATTENTION</div>
                                    <div>You are missing <span style="color: yellow;">${UTILS.styleNumberWithComma(amountNeed)}</span> silver to purchase the upgrade.</div>
                                    <div>You can use <span style="color: yellow;">gold</span> as a replacement for the missing silver.</div>
                                    `;
                                    goldAndSilverElement.appendChild(alertElement);

                                    let buttonsHolder = document.createElement("div");
                                    buttonsHolder.style = "display: flex; align-items: center; margin-top: 10px; width: 550px; height: 75px;";
                                    goldAndSilverElement.appendChild(buttonsHolder);

                                    let cancelButton = document.createElement("div");
                                    cancelButton.style = "display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 24px; color: white; width: calc(50% - 5px); height: 100%; background-color: #f00; border-radius: 4px; cursor: pointer;";
                                    cancelButton.innerHTML = "CANCEL";
                                    buttonsHolder.appendChild(cancelButton);

                                    cancelButton.onmouseover = () => {
                                        cancelButton.style.backgroundColor = "#de0000";
                                    };
                                    cancelButton.onmouseout = () => {
                                        cancelButton.style.backgroundColor = "#f00";
                                    };

                                    let confirmButton = document.createElement("div");
                                    confirmButton.style = "display: flex; align-items: center; justify-content: center; flex-direction: column; font-weight: 700; font-size: 18px; color: white; margin-left: 10px; width: calc(50% - 5px); height: 100%; background-color: #0f0; border-radius: 4px; cursor: pointer;";
                                    confirmButton.innerHTML = `
                                    <div>CONFIRM</div>
                                    <div style="display: flex; align-items: center; justify-content: center;">
                                        <div style="width: 20px; height: 20px; background-size: 20px 20px; background-image: url('../src/media-files/money/gold.png');"></div>
                                        <span>${UTILS.styleNumberWithComma(goldCost)}</span>
                                    </div>
                                    `;
                                    buttonsHolder.appendChild(confirmButton);

                                    confirmButton.onmouseover = () => {
                                        confirmButton.style.backgroundColor = "#00de00";
                                    };
                                    confirmButton.onmouseout = () => {
                                        confirmButton.style.backgroundColor = "#0f0";
                                    };

                                    cancelButton.onclick = () => {
                                        goldAndSilverElement.remove();

                                        needMoreSilverIsOn = false;
                                    };
                                    confirmButton.onclick = () => {
                                        isUpgrading = true;
                                        userProfile.changeBank("silver", -userProfile.bank.silver);
                                        userProfile.changeBank("gold", -goldCost);
                                        moneyDisplayManager.displayItems(["gold", "silver", "platinum", "tokens"]);
                                        upgraderManager.upgradeShape(shape);
                                        this.shapeViewUpgradeButton.click();
                                        goldAndSilverElement.remove();

                                        needMoreSilverIsOn = false;
                                    };
                                }
                            }
                        }
                    }
                };

                this.shapeViewUpgradeName.innerHTML = "";
                let levelDisplay = document.createElement("div");
                let nameDisplay = document.createElement("div");
                nameDisplay.style = "margin-left: 40px;"
                levelDisplay.classList.add("shape-view-upgrade-name-level-display");
                if (shape.level == 25) {
                    this.shapeViewUpgradeButton2.style.display = "none";
                    levelDisplay.innerHTML = shape.level - 24;
                } else if (shape.level > 12) {
                    this.shapeViewUpgradeButton2.style.display = "flex";
                    levelDisplay.innerHTML = shape.level - 12;
                } else {
                    this.shapeViewUpgradeButton2.style.display = "flex";
                    levelDisplay.innerHTML = shape.level;
                }

                if (shape.level == 25) {
                    nameDisplay.innerHTML = `<span style="color: white;">${shape.name}</span> <span style="color: #ffff00">MK3</span>`;
                } else if (shape.level == 24) {
                    nameDisplay.innerHTML = `<span style="color: white;">${shape.name}</span> <span style="color: #00ff00">MK2</span> enhance to <span style="color: #ffff00">MK3</span>`;
                } else if (shape.level > 12) {
                    nameDisplay.innerHTML = `<span style="color: white;">${shape.name}</span> <span style="color: #00ff00">MK2</span> upgrade to level ${(shape.level - 12) + 1}`;
                } else if (shape.level == 12) {
                    nameDisplay.innerHTML = `<span style="color: white;">${shape.name}</span> enhance to <span style="color: #00ff00">MK2</span>`;
                } else {
                    nameDisplay.innerHTML = `<span style="color: white;">${shape.name}</span> upgrade to level ${shape.level + 1}`;
                }

                levelDisplay.style.backgroundColor = config.tierColors[shape.tier];
                this.shapeViewUpgradeName.appendChild(levelDisplay);
                this.shapeViewUpgradeName.appendChild(nameDisplay);

                this.shapeViewUpgradeBackButton.onclick = () => {
                    if (needMoreSilverIsOn) return;

                    doDarkModeTransition();
                    moneyDisplayManager.displayItems(["powercells", "gold", "silver"]);
                    this.shapeUpgradeViewMenu.style.display = "none";
                    this.viewInDepth(shape, isStore, isChanging, slotId);
                };
            };

            this.shapeViewChangeButton.onclick = () => {
                this.shapeViewUI.style.display = "none";
                this.changeSlot(shape.slot, shape);
            };

            if (shape.level == 25 || isStore) {
                this.shapeViewUpgradeButton.style.display = "none";
                if (isStore) {
                    this.shapeViewBuyButton.style.display = "flex";
                    this.shapeViewChangeButton.style.display = "none";
                    this.shapeViewBuyButton.onclick = () => {
                        if (userProfile.bank.silver - shape.cost.silver >= 0) {
                            if (userProfile.bank.gold - shape.cost.gold >= 0) {
                                let oldShape = userProfile.shapes.find(e => e.slot == shape.slot);
                                if (oldShape) {
                                    oldShape.slot = null;
                                }

                                userProfile.changeBank("silver", -shape.cost.silver);
                                userProfile.changeBank("gold", -shape.cost.gold);
                                storeManager.addItem("shape", shape.name, shape.slot);

                                doDarkModeTransition();
                                elements.hangerUI.style.display = "block";
                                this.shapeViewUI.style.display = "none";
                                this.updateHanger();
                            }
                        }
                    };
                }
            }

            if (isChanging) {
                this.shapeViewEquipButton.style.display = "flex";
                this.shapeViewEquipButton.onclick = () => {
                    doDarkModeTransition();
                    let oldShape = userProfile.shapes.find(e => e.slot == slotId);

                    if (oldShape) oldShape.slot = undefined;
                    shape.slot = slotId;

                    userProfile.saveProfile();
                    elements.hangerUI.style.display = "block";
                    this.shapeViewUI.style.display = "none";
                    this.updateHanger();
                };
            } else {
                this.shapeViewEquipButton.style.display = "none";
            }

            if (!isStore) {
                this.shapeViewBuyButton.style.display = "none";
                if (isChanging) {
                    this.shapeViewChangeButton.style.display = "none";
                } else {
                    this.shapeViewChangeButton.style.display = "flex";
                }
                if (shape.level < 25) {
                    this.shapeViewUpgradeButton.style.display = "flex";
                }
            }
        }
        drawChooseShapeDisplay(item, statsDisplay, statAmount, type) {
            let data = ["healthData", "speedData"];

            if (type == "drone") {
                for (let i = 0; i < item.abilities.length; i++) {
                    let ability = item.abilities[i];

                    let element = document.createElement("div");
                    let amountDisplay = document.createElement("div");
                    amountDisplay.style.marginLeft = "45px";
                    element.classList.add("store-item-stats-style-display");

                    if (i > 0) element.style.marginTop = "5px"; // droneAbilityImages

                    amountDisplay.innerHTML = UTILS.styleNumberWithComma(ability.stats[0]);

                    let image = imageManager.getImage(config.droneAbilityImages[ability.name]);
                    image.style = "position: absolute; width: 40px; height: 40px;";

                    element.appendChild(image);
                    element.appendChild(amountDisplay);

                    statsDisplay.appendChild(element);
                }
            } else {
                for (let i = 0; i < statAmount; i++) {
                    let displayData = data[i];
                    let element = document.createElement("div");
                    let amountDisplay = document.createElement("div");
                    amountDisplay.style.marginLeft = "45px";
                    element.classList.add("store-item-stats-style-display");
                    if (i > 0) element.style.marginTop = "5px";
                    if (displayData) {
                        let splitData = displayData.split("Data")[0];
                        let multi = displayData == "speedData" ? 1e4 : 1;
                        amountDisplay.innerHTML = UTILS.styleNumberWithComma(item[splitData] * multi);

                        if (displayData == "speedData") {
                            amountDisplay.innerHTML += " px/s";
                        }

                        let image = imageManager.getImage(this.dataToImage[displayData]);
                        image.style = "position: absolute; width: 40px; height: 40px;";
                        element.appendChild(image);
                        element.appendChild(amountDisplay);
                    } else {
                        let ability = item.abilities[i - 2];

                        amountDisplay.innerHTML = ability.name;

                        let image = imageManager.getImage(ability.imageSource);
                        image.style = "position: absolute; width: 40px; height: 40px;";
                        element.appendChild(image);
                        element.appendChild(amountDisplay);
                    }
                    statsDisplay.appendChild(element);
                }
            }
        }
        displayChangeSlot(tmpItems, createObjs, slot, oldShape, type) {
            let items = createObjs ? [] : tmpItems;

            if (createObjs) {
                for (let i = 0; i < tmpItems.length; i++) {
                    let tmp = tmpItems[i];
                    if (type == "drone") {
                        items.push(new drone(tmp, tmpItems.owner));
                    } else if (type == "pilot") {
                        items.push(new pilot(tmp, tmpItems.owner));
                    } else {
                        items.push(new shape(tmp, undefined, true));
                    }
                }
            }


            this.changeShapeDisplay.innerHTML = "";

            this.changeShapeDisplay.onwheel = (event) => {
                let value = event.deltaX || event.deltaY;

                this.changeShapeDisplay.scrollLeft += value;
            };

            let height = window.innerHeight * .72;
            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                if (item) {
                    let element = document.createElement("div");
                    element.classList.add("store-item");
                    element.style = `left: ${height * i}px; width: ${height}px; height: ${height}px;`;

                    let nameDisplay = document.createElement("div");
                    let levelDisplay = document.createElement("div");
                    levelDisplay.classList.add("store-item-level-display");
                    levelDisplay.style.backgroundColor = config.tierColors[item.tier];
                    levelDisplay.innerHTML = (item.level == 25 ? 1 : item.level > 12 ? item.level - 12 : item.level);
                    nameDisplay.classList.add("store-item-name");
                    nameDisplay.appendChild(levelDisplay);
                    nameDisplay.innerHTML += item.name;
                    if (item.level == 25) {
                        nameDisplay.innerHTML += `<span style="color: #ffff00">&nbsp;MK3</span>`;
                    } else if (item.level > 12) {
                        nameDisplay.innerHTML += `<span style="color: #00ff00">&nbsp;MK2</span>`;
                    }
                    element.appendChild(nameDisplay);

                    if (createObjs) {
                        let costDisplay = document.createElement("div");
                        let costAmount = document.createElement("div");
                        let image = imageManager.getImage(`../src/media-files/money/${type == "pilot" ? "gold" : type == "drone" ? "microchips" : "silver"}.png`);
                        image.style = "position: absolute; top: 0px; left: 0px; width: 30px; height: 30px;";
                        costDisplay.classList.add("store-item-cost");
                        costAmount.style.marginLeft = "-5px";
                        costAmount.innerHTML = UTILS.styleNumberWithComma(type == "pilot" ? item.cost : type == "drone" ? item.cost : item.cost.silver);
                        costDisplay.appendChild(image);
                        costDisplay.appendChild(costAmount);
                        element.appendChild(costDisplay);
                    }

                    if (type != "pilot") {
                        let statAmount = item.abilities.length + (type == "drone" ? 0 : 2);

                        let statsDisplay = document.createElement("div");
                        statsDisplay.classList.add("store-stats-display-holder-item");
                        statsDisplay.style.height = `${(statAmount * 40) + (statAmount >= 3 ? (statAmount - 2) * 5 : 0)}px`;

                        this.drawChooseShapeDisplay(item, statsDisplay, statAmount, type);

                        element.appendChild(statsDisplay);
                    }

                    if (type == "pilot") {
                        let image = imageManager.getImage(item.imageSource);
                        image.style = "width: calc(100% - 50px); height: calc(100% - 50px);";
                        element.appendChild(image);
                    } else {
                        let shapeImage = canvasDrawer.createUIItem(item);
                        shapeImage.style = "width: calc(100% - 50px); height: calc(100% - 50px);";
                        element.appendChild(shapeImage);
                    }

                    if (oldShape) {
                        let weapons = userProfile.weapons.filter(e => e.owner == item.sid).sort((a, b) => a.slot - b.slot);
                        for (let t = 0; t < weapons.length; t++) {
                            let wpn = weapons[i];
                            let tmpElement = document.createElement("div");
                            let bottom = 15 + (t * 120);
                            tmpElement.classList.add("inventory-weapon-item");
                            tmpElement.style = `bottom: ${bottom}px; border-color: ${config.tierColors[wpn.tier]}; background-image: url('${wpn.imageSource}');`;
                            element.appendChild(tmpElement);
                        }
                    }

                    element.onclick = () => {
                        elements.chooseShapesUI.style.display = "none";
                        if (createObjs) {
                            if (type == "pilot") {
                                this.viewPilotInDepth(item, true, true, slot);
                            } else if (type == "drone") {
                                this.viewDroneInDepth(item, true, true, slot);
                            } else {
                                this.shapeViewBuyMoneyIcon.style.backgroundImage = `url('../src/media-files/money/silver.png'), none`;
                                this.shapeViewBuyMoneyDisplay.innerHTML = UTILS.styleNumberWithComma(item.cost.silver);
                                item.slot = slot;

                                this.viewInDepth(item, true); // item, isStore, isChanging, slotId
                            }
                        } else {
                            if (type == "pilot") {
                                this.viewPilotInDepth(item, false, true, slot);
                            } else if (type == "drone") {
                                this.viewDroneInDepth(item, false, true, slot);
                            } else {
                                this.viewInDepth(item, false, true, slot);
                            }
                        }
                    };

                    this.changeShapeDisplay.appendChild(element);
                }
            }

            if (!items.length) {
                let element = document.createElement("div");
                element.style = "font-size: 22px; color: white; position: absolute; width: 100%; height: 100%; top: 0px; left: 0px; display: flex; align-items: center; justify-content: center;";
                element.innerHTML = `You have no ${type == "pilot" ? "pilots" : type == "drone" ? "drones" : "shapes"} in your inventory`;

                this.changeShapeDisplay.appendChild(element);
            }
        }
        changeSlot(slot, oldShape, type, nextPG) {
            doDarkModeTransition();
            if (type == "drone") {
                moneyDisplayManager.displayItems(["microchips"]);
            } else if (type == "pilot") {
                moneyDisplayManager.displayItems(["gold", "tokens"]);
            } else {
                moneyDisplayManager.displayItems(["powercells", "gold", "silver"]);
            }

            elements.hangerUI.style.display = "none";
            moneyDisplayManager.holderElement.style.top = "5px";

            let notClickBackground = "rgb(0, 0, 0, .3)";
            let clickBackground = "rgb(255, 255, 255, .3)";

            elements.chooseShapesUI.style.display = "block";

            this.changeShapeStoreButton.onclick = () => {
                this.changeShapeStoreButton.style.backgroundColor = clickBackground;
                this.changeShapeStoreButton.style.pointerEvents = "none";
                this.changeShapeInventoryButton.style.backgroundColor = notClickBackground;
                this.changeShapeInventoryButton.style.pointerEvents = "auto";

                this.displayChangeSlot((type == "pilot" ? items.pilots : type == "drone" ? items.drones : items.shapes).sort((a, b) => a.tier - b.tier), true, slot, null, type);
            };
            this.changeShapeInventoryButton.onclick = () => {
                this.changeShapeInventoryButton.style.backgroundColor = clickBackground;
                this.changeShapeInventoryButton.style.pointerEvents = "none";
                this.changeShapeStoreButton.style.backgroundColor = notClickBackground;
                this.changeShapeStoreButton.style.pointerEvents = "auto";

                let unequipedShapes = type == "pilot" ? userProfile.pilots.filter(e => e.owner == null || e.owner == undefined) : type == "drone" ? userProfile.drones.filter(e => e.owner == null || e.owner == undefined) : userProfile.shapes.filter(e => typeof e.slot != "number");
                this.displayChangeSlot(unequipedShapes, false, slot, oldShape, type);
            };

            this.changeShapeReplacingHolder.innerHTML = "";
            if (oldShape) {
                let replacingText = document.createElement("div");
                replacingText.style = `margin-top: 3px; margin-left: 15px; width: 100%;`;
                replacingText.innerHTML = type == "pilot" ? "Changing pilot" : type == "drone" ? "Changing drone" : "Select another shape";

                let nameHolder = document.createElement("div");
                let levelDisplay = document.createElement("div");
                let nameDisplay = document.createElement("div");
                levelDisplay.style = "position: absolute; color: white; display: flex; align-item: center; justify-content: center; top: 0px; left: 0px; width: 21.5px; height: width: 21.5px; border-radius: 100%;";
                levelDisplay.style.backgroundColor = config.tierColors[oldShape.tier];
                nameHolder.style = `position: relative; width: 100%; margin-left: 15px;`;
                nameDisplay.style.marginLeft = "25px";
                levelDisplay.innerHTML = (oldShape.level == 25 ? 1 : oldShape.level > 12 ? oldShape.level - 12 : oldShape.level);
                nameDisplay.innerHTML = oldShape.name;

                if (oldShape.level == 25) {
                    nameDisplay.innerHTML += `<span style="color: #ffff00;">&nbsp;MK3</span>`;
                } else if (oldShape.level > 12) {
                    nameDisplay.innerHTML += `<span style="color: #00ff00;">&nbsp;MK2</span>`;
                }

                nameHolder.appendChild(levelDisplay);
                nameHolder.appendChild(nameDisplay);
                this.changeShapeReplacingHolder.appendChild(replacingText);
                this.changeShapeReplacingHolder.appendChild(nameHolder);
            }

            let unequipedShapes = type == "pilot" ? userProfile.pilots.filter(e => e.owner == null || e.owner == undefined) : type == "drone" ? userProfile.drones.filter(e => e.owner == null || e.owner == undefined) : userProfile.shapes.filter(e => typeof e.slot != "number");
            if (unequipedShapes.length) {
                this.changeShapeInventoryButton.click();
                this.displayChangeSlot(unequipedShapes, false, slot, oldShape, type);
            } else {
                this.changeShapeStoreButton.click();
                this.displayChangeSlot((type == "pilot" ? items.pilots : type == "drone" ? items.drones : items.shapes).sort((a, b) => a.tier - b.tier), true, slot, null, type);
            }

            this.shapeViewBackButton2.onclick = () => {
                doDarkModeTransition();
                if (nextPG) {
                    if (type == "pilot") {
                        
                        elements.chooseShapesUI.style.display = "none";
                        elements.pilotViewUI.style.display = "block";
    
                        this.viewPilotInDepth(nextPG, false, false, nextPG.owner);
                    } else {
                        elements.chooseShapesUI.style.display = "none";
                        elements.droneViewUI.style.display = "block";
    
                        this.viewDroneInDepth(nextPG, false, false, nextPG.owner);
                    }
                } else if (oldShape) {
                    elements.chooseShapesUI.style.display = "none";
                    this.shapeViewUI.style.display = "block";
                    this.viewInDepth(oldShape);
                } else {
                    elements.hangerUI.style.display = "block";
                    moneyDisplayManager.holderElement.style.top = null;
                    elements.chooseShapesUI.style.display = "none";
                    this.updateHanger();
                }
            };
        }
        updateHanger() {
            elements.hangerUI.innerHTML = "";
            moneyDisplayManager.displayItems(["gold", "silver", "platinum"]);
            moneyDisplayManager.holderElement.style.top = null;
            let containerWidth = window.innerWidth - 200;
            let containerHeight = window.innerHeight;
            let gap = 10;

            let totalGapWidth = gap * 3;
            let totalGapHeight = gap * 1;
            let squareSize = (containerWidth - totalGapWidth) / 4;
            let verticalOffset = (containerHeight - squareSize * 2 - totalGapHeight) / 2;
            let lastestCostIndx = userProfile.slotsData.findIndex(e => e.locked);

            for (let i = 0; i < 8; i++) {
                let row = Math.floor(i / 4);
                let col = i % 4;

                let left = col * (squareSize + gap) + 100;
                let top = row * (squareSize + gap) + verticalOffset;

                let squareItem = document.createElement("div");
                squareItem.classList.add("hanger-item");
                squareItem.style = `position: absolute; top: ${top}px; left: ${left}px; width: ${squareSize}px; height: ${squareSize}px; border-radius: 4px;`;

                let slotData = userProfile.slotsData[i];
                let shape = userProfile.shapes.find(e => e.slot == i);
                if (slotData.locked) {
                    if (lastestCostIndx == i) {
                        let goldImage = imageManager.getImage("../src/media-files/money/gold.png");
                        goldImage.style = "width: 40px";
                        if (userProfile.bank.gold - slotData.cost >= 0) squareItem.style.cursor = "pointer";
                        squareItem.innerHTML = `
                            <div class="hanger-slot-container"><span class="material-symbols-outlined" style="font-size: 96px;">lock</span></div>
                            <div class="hanger-slot-container" style="font-size: 36px;"></div>
                            `;
                        let element = squareItem.querySelectorAll('.hanger-slot-container')[1];
                        element.appendChild(goldImage);
                        element.innerHTML += UTILS.abbreviateNumber(slotData.cost);
                        squareItem.onclick = () => {
                            if (userProfile.bank.gold - slotData.cost >= 0) {
                                userProfile.purchaseSlot(i, slotData.cost);
                            }
                        };
                    } else {
                        squareItem.innerHTML = `<span class="material-symbols-outlined" style="font-size: 96px;">lock</span>`;
                    }
                } else if (shape) {
                    let shapeImage = canvasDrawer.createUIItem(shape);
                    squareItem.style.cursor = "pointer";
                    shapeImage.style = "width: 100%; height: 100%;";
                    squareItem.innerHTML = `
                        <div class="hanger-shape-name" style="color: white;">
                            <div class="hanger-level-style-display" style="background-color: ${config.tierColors[shape.tier]}">
                                ${shape.level - (shape.level == 25 ? 24 : shape.level > 12 ? 12 : 0)}
                            </div>
                            <div style="margin-left: 30px;">
                                ${shape.name} ${shape.level == 25 ? `<span style="color: #ffff00">MK3</span>` : shape.level > 12 ? `<span style="color: #00ff00">MK2</span>` : ""}
                            </div>
                        </div>
                        `;
                    let weapons = userProfile.weapons.filter(e => e.owner == shape.sid).sort((a, b) => a.slot - b.slot);
                    for (let t = 0; t < weapons.length; t++) {
                        let wpn = weapons[t];
                        let tmpElement = document.createElement("div");
                        let bottom = 10 + (t * 70);
                        tmpElement.classList.add("hanger-weapon-item");
                        tmpElement.style = `bottom: ${bottom}px; border-color: ${config.tierColors[wpn.tier]}; background-image: url('${wpn.imageSource}'), none;`;
                        squareItem.appendChild(tmpElement);
                    }
                    squareItem.appendChild(shapeImage);
                    squareItem.onclick = () => {
                        this.viewInDepth(shape);
                    };
                } else {
                    squareItem.style.cursor = "pointer";
                    squareItem.innerHTML = `
                        <span class="material-symbols-outlined" style="font-size: 175px;">
                        add
                        </span>
                        `;
                    squareItem.onclick = () => {
                        this.changeSlot(i, undefined);
                    };
                }

                elements.hangerUI.appendChild(squareItem);
            }
        }
    };

    var moneyDisplayManager = new class {
        constructor() {
            this.holderElement = UTILS.getElement("moneyDisplayHolder");
            this.items = [];
        }
        updateItems() {
            this.displayItems(this.items);
        }
        displayItems(items) {
            this.items = items;
            this.holderElement.innerHTML = "";
            if (!items.length) {
                this.holderElement.style.display = "none";
                return;
            }
            this.holderElement.style.display = "flex";
            for (let i = 0; i < items.length; i++) {
                let amount = userProfile.bank[items[i]];
                let tmpElement = document.createElement("div");
                tmpElement.classList.add("money-display-item");
                if (i > 0) tmpElement.style.marginLeft = "15px";
                let icon = imageManager.getImage(`../src/media-files/money/${items[i]}.png`);
                icon.classList.add("money-display-icon");
                tmpElement.appendChild(icon);
                let amountText = document.createElement("span");
                amountText.textContent = amount >= 1e7 ? UTILS.abbreviateNumber(amount) : UTILS.styleNumberWithComma(amount);
                amountText.style.marginLeft = "30px";
                amountText.style.fontWeight = "600";
                amountText.style.color = "white";
                tmpElement.appendChild(amountText);
                this.holderElement.appendChild(tmpElement);
            }
        }
    };

    var EquipmentBuilder = new class {

        /**
         * compresses the userProfile to a readable array for the Worker to process :)
         * @returns {array}
         */

        player() {
            let shapes = [];

            let equippedShape = userProfile.shapes.filter(e => e.slot >= 0);
            for (let i = 0; i < equippedShape.length; i++) {
                let shape = equippedShape[i];

                shapes.push({
                    name: shape.name,
                    sid: shape.sid,
                    level: shape.level,
                    slot: shape.slot,
                    weapons: [],
                    modules: [],
                    skills: []
                });
            }

            let equippedWeapons = userProfile.weapons.filter(e => e.owner >= 0);
            for (let i = 0; i < equippedWeapons.length; i++) {
                let wpn = equippedWeapons[i];
                let weapon = {
                    name: wpn.name,
                    level: wpn.level,
                    slot: wpn.slot
                };

                let shape = shapes.find(e => e.sid == wpn.owner && e.slot >= 0);
                if (shape) shape.weapons.push(weapon);
            }

            let equippedModules = userProfile.modules.filter(e => e.owner >= 0);
            for (let i = 0; i < equippedModules.length; i++) {
                let mod = equippedModules[i];
                let module = {
                    name: mod.name,
                    level: mod.level
                };

                let shape = shapes.find(e => e.sid == mod.owner && e.slot >= 0);
                if (shape) shape.modules.push(module);
            }

            let equippedPilots = userProfile.pilots.filter(e => e.owner >= 0);
            for (let i = 0; i < equippedPilots.length; i++) {
                let pilot = equippedPilots[i];
                let skills = [];

                pilot.skills.forEach((obj) => {
                    skills.push(obj.name);
                });

                let shape = shapes.find(e => e.sid == pilot.owner && e.slot >= 0);
                if (shape) shape.skills = skills;
            }

            return shapes;
        }
    };

    var keys = {};
    var moveKeys = {
        87: [0, -1],
        38: [0, -1],
        83: [0, 1],
        40: [0, 1],
        65: [-1, 0],
        37: [-1, 0],
        68: [1, 0],
        39: [1, 0]
    };
    var mouseX = 0, mouseY = 0;

    function getAimDir() {
        return Math.atan2(mouseY - (window.innerHeight / 2), mouseX - (window.innerWidth / 2));
    }

    document.addEventListener("mousemove", (event) => {
        mouseX = event.clientX;
        mouseY = event.clientY;
    });
    
    var gameCanvas = document.getElementById("gameCanvas");
    var ctx = gameCanvas.getContext("2d");

    document.addEventListener("keydown", (event) => {
        if (event.isTrusted) {
            let key = event.which || event.keyCode;

            keys[key] = 1;
            if (moveKeys[key]) {
                GameManager.updateMovement();
            } else if (key == 32) {
                GameManager.send("setAttack", 1);
            }
        }
    });
    document.addEventListener("keyup", (event) => {
        if (event.isTrusted) {
            let key = event.which || event.keyCode;

            keys[key] = 0;
            if (moveKeys[key]) {
                GameManager.updateMovement();
            } else if (key == 32) {
                GameManager.send("setAttack", 0);
            } else if (key == 82) {
                GameManager.send("reloadWeapons");
            }
        }
    });

    var renderer = new class {
        constructor() {
            this.lastUpdate = 0;
            this.start = false;
            this.cam = {
                x: 0,
                y: 0
            };

            this.offset = {
                x: 0,
                y: 0
            };

            this.screenSize = {
                x: config.maxScreenWidth,
                y: config.maxScreenHeight
            };

            this.aimSendDate = 100;
        }

        resize() {
            gameCanvas.width = window.innerWidth;
            gameCanvas.height = window.innerHeight;
            // gameCanvas.style.width = `${window.innerWidth}px`;
            // gameCanvas.style.height = `${window.innerHeight}px`;

            let scaleFillNative = Math.max(window.innerWidth / this.screenSize.x, window.innerHeight / this.screenSize.y);
            ctx.setTransform(scaleFillNative, 0, 0, scaleFillNative, (window.innerWidth - (this.screenSize.x * scaleFillNative)) / 2,(window.innerHeight - (this.screenSize.y * scaleFillNative)) / 2);
        }

        renderBorders() {
            ctx.fillStyle = "#000";
            ctx.globalAlpha = 0.18;
            if (this.offset.x <= 0) {
                ctx.fillRect(0, 0, -this.offset.x, this.screenSize.y);
            }

            if (GameManager.map.width - this.offset.x <= this.screenSize.x) {
                let tmpY = Math.max(0, -this.offset.y);
                ctx.fillRect(GameManager.map.width - this.offset.x, tmpY, this.screenSize.x - (GameManager.map.width - this.offset.x), this.screenSize.y - tmpY);
            }

            if (this.offset.y <= 0) {
                ctx.fillRect(-this.offset.x, 0, this.screenSize.x + this.offset.x, -this.offset.y);
            }
            
            if (GameManager.map.height - this.offset.y <= this.screenSize.y) {
                let tmpX = Math.max(0, -this.offset.x);
                let tmpMin = 0;
                if (GameManager.map.width - this.offset.x <= this.screenSize.x) {
                    tmpMin = this.screenSize.x - (GameManager.map.width - this.offset.x);
                }

                ctx.fillRect(tmpX, GameManager.map.height - this.offset.y, (this.screenSize.x - tmpX) - tmpMin, this.screenSize.y - (GameManager.map.height - this.offset.y));
            }
        }

        renderPlayers() {
            ctx.globalAlpha = 1;
            for (let i = 0; i < GameManager.players.length; i++) {
                let tmpObj = GameManager.players[i];

                if (tmpObj && tmpObj.health > 0) {
                    ctx.save();
                    ctx.translate(tmpObj.x - this.offset.x, tmpObj.y - this.offset.y);
                    ctx.strokeStyle = "black";
                    ctx.fillStyle = tmpObj.color;
                    canvasDrawer.drawCircle(0, 0, ctx, tmpObj.scale, false, false);
                    ctx.restore();
                }
            }
        }

        renderGrid() {
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#000";
            ctx.globalAlpha = 0.06;
            ctx.beginPath();

            let x, y; 

            for (x = -this.cam.x; x < this.screenSize.x; x += this.screenSize.y / 4) {
                if (x > 0) {
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, this.screenSize.y);
                }
            }
            for (y = -this.cam.y; y < this.screenSize.y; y += this.screenSize.y / 4) {
                if (x > 0) {
                    ctx.moveTo(0, y);
                    ctx.lineTo(this.screenSize.x, y);
                }
            }
            ctx.stroke();
        }

        renderProjectiles(delta) {
            ctx.globalAlpha = 1;

            for (let i = 0; i < GameManager.projectiles.length; i++) {
                let tmpObj = GameManager.projectiles[i];

                if (tmpObj) {
                    ctx.save();
                    ctx.translate(tmpObj.x - this.offset.x, tmpObj.y - this.offset.y);
                    ctx.rotate(tmpObj.dir);

                    let image = canvasDrawer.getBulletImage(tmpObj);

                    if (image) {
                        let size = 40;
                        ctx.drawImage(image, -size / 2, -size / 2, size, size);
                    }

                    ctx.restore();

                    tmpObj.update([], false, delta);
                }
            }
        }

        renderBuildings(delta) {
            for (let i = 0; i < GameManager.buildings.length; i++) {
                let tmpObj = GameManager.buildings[i];

                if (tmpObj) {
                    ctx.save();
                    ctx.globalAlpha = 1;
                    ctx.translate(tmpObj.x - this.offset.x, tmpObj.y - this.offset.y);

                    if (tmpObj.name == "beacon") {
                        if (tmpObj.capturePoints > 6e3) tmpObj.capturePoints = 6e3;
                        if (tmpObj.capturePoints < -6e3) tmpObj.capturePoints = -6e3;

                        ctx.lineWidth = 7.5;
                        ctx.strokeStyle = "black";
                        ctx.fillStyle = Math.abs(tmpObj.capturePoints) == 6e3 ? tmpObj.capturePoints > 0 ? "blue" : "red" : "white";
                        canvasDrawer.drawCircle(0, 0, ctx, 45, false, false);

                        ctx.lineWidth = 11;
                        ctx.strokeStyle = "white";
                        canvasDrawer.drawCircle(0, 0, ctx, 400, false, true);

                        if (tmpObj.targetCapturePoints != 0) {
                            let difference = Math.abs(tmpObj.targetCapturePoints) - Math.abs(tmpObj.capturePoints);
                            let value = Math.abs(tmpObj.capturePoints) + difference * (tmpObj.deltaTime / 50);
                            tmpObj.deltaTime += delta;
    
                            ctx.strokeStyle = tmpObj.capturePoints > 0 ? "blue" : "red";
                            ctx.beginPath();
                            ctx.arc(0, 0, 400, 0, Math.PI * 2 * (value / 6e3));
                            ctx.stroke();
                        }
                    }

                    ctx.restore();
                }
            }
        }

        render() {
            let delta = Date.now() - this.lastUpdate;
            this.lastUpdate = Date.now();

            if (player) {
                let tmpDist = UTILS.getDistance(this.cam, player);
                let tmpDir = UTILS.getDirection(player, this.cam);
                let camSpd = Math.min(tmpDist * 0.01 * delta, (tmpDist || 0));

                if (tmpDist > 0.05) {
                    this.cam.x += camSpd * Math.cos(tmpDir);
                    this.cam.y += camSpd * Math.sin(tmpDir);
                } else {
                    this.cam.x = player.x;
                    this.cam.y = player.y;
                }
            } else {
                this.cam.x = GameManager.map.width / 2;
                this.cam.y = GameManager.map.height / 2;
            }

            this.offset = {
                x: this.cam.x - (this.screenSize.x / 2),
                y: this.cam.y - (this.screenSize.y / 2)
            };

            if (player) {
                this.aimSendDate -= delta;
                if (this.aimSendDate <= 0) {
                    let x1 = mouseX / window.innerWidth;
                    let y1 = mouseY / window.innerHeight;
                    let x2 = x1 * this.screenSize.x;
                    let y2 = y1 * this.screenSize.y;
                    let x3 = this.screenSize.x / 2;
                    let y3 = this.screenSize.y / 2;

                    let dist = UTILS.getDistance({ x: x3, y: y3}, { x: x2, y: y2 });

                    GameManager.send("aim", getAimDir(), dist);
                    this.aimSendDate = 100;
                }

                document.title = `${player.x.toFixed(0)} | ${player.y.toFixed(0)}`;
            }

            for (let i = 0; i < GameManager.players.length; i++) {
                let tmpObj = GameManager.players[i];

                if (tmpObj) {
                    let tmpDiff = tmpObj.x2 - tmpObj.x1;
                    tmpObj.dt += delta;
                    let tmpRate = tmpObj.dt / 66.5;

                    tmpObj.x = tmpObj.x1 + (tmpDiff * tmpRate);
                    tmpDiff = (tmpObj.y2 - tmpObj.y1);
                    tmpObj.y = tmpObj.y1 + (tmpDiff * tmpRate);
                }
            }

            ctx.globalAlpha = 1;
            ctx.fillStyle = "#b0db51";
            ctx.fillRect(0, 0, this.screenSize.x, this.screenSize.y);

            this.renderBuildings(delta);
            this.renderGrid();

            ctx.lineWidth = 5.5;

            this.renderProjectiles(delta);
            this.renderPlayers();
            this.renderBorders();

            ctx.fillStyle = "rgba(0, 0, 70, 0.35)";
            ctx.fillRect(0, 0, this.screenSize.x, this.screenSize.y);

            if (renderer.start) {
                window.requestAnimationFrame(() => {
                    this.render();
                });
            }
        }
    };

    function resize() {
        if (elements.hangerUI.style.display == "block") {
            hangerDisplay.updateHanger();
        }
        renderer.resize();
    }
    window.addEventListener("resize", resize);
    resize();

    var player;
    let beaconDisplay = document.getElementById("beaconDisplay");
    var beaconLetters = ["A", "B", "C", "D", "E"];

    function updateBeacons() {
        let beacons = GameManager.buildings.filter(e => e.name == "beacon");

        beaconDisplay.innerHTML = "";

        for (let i = 0; i < beacons.length; i++) {
            let element = document.createElement("div");
            element.style = "position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; background-color: rgb(0, 0, 0, .4); border-radius: 4px; margin-right: 10px;";

            let overlay = document.createElement("div");
            overlay.style = "position: absolute; left: 0px; bottom: 0px; width: 100%;";

            overlay.style.height = `${(Math.abs(beacons[i].capturePoints) / 6e3) * 100}%`;

            if (beacons[i].capturePoints < 0) {
                overlay.style.backgroundColor = "#f00";
            } else {
                overlay.style.backgroundColor = "#00f";
            }

            let beaconName = document.createElement("div");
            beaconName.style = "z-index: 1231; font-size: 22px; color: white; font-weight: 600;";
            beaconName.innerHTML = beaconLetters[i];

            if (i == beacons.length - 1) {
                element.style.marginRight = null;
            }

            element.appendChild(beaconName);
            element.appendChild(overlay);
            beaconDisplay.appendChild(element);
        }
    }

    var beaconBarDisplays = ["allyBeaconProgress", "enemyBeaconProgress"];

    var GameManager = new class {
        constructor() {
            this.lastMoveDir;
            this.players = [];
            this.buildings = [];
            this.projectiles = [];
            this.weaponElements = [];
            this.wpnParents = [];
            this.map = {};
            this.pingInterval = null;
            this.pingLastUpdate = 0;

            this.healthText = UTILS.getElement("healthText");
            this.healthBar = UTILS.getElement("healthBar");
            this.grayDamageBar = UTILS.getElement("grayDamageBar");

            this.serverEvents = {
                "init": (map, buildings) => {
                    this.map = map;
                    this.buildings = buildings;
                    
                    this.setUpChooseSlots();
                    this.startRendering();
                    updateBeacons();
                },
                "updatePlayers": (data) => {
                    for (let i = 0; i < data.length;) {
                        let tmpObj = this.players[data[i]];

                        if (!tmpObj) {
                            tmpObj = new shape(items.shapes.find(e => e.name == data[i + 1]), undefined, true);

                            if (data[i] == 0) {
                                player = tmpObj;
                            }

                            tmpObj.x = data[i + 2];
                            tmpObj.y = data[i + 3];
                            this.players.push(tmpObj);
                        }

                        if (tmpObj) {
                            tmpObj.x1 = tmpObj.x;
                            tmpObj.y1 = tmpObj.y;
                            tmpObj.dt = 0;
                            tmpObj.x2 = data[i + 2];
                            tmpObj.y2 = data[i + 3];
                            tmpObj.dir = data[i + 4];
                            tmpObj.health = data[i + 5];
                            tmpObj.maxhealth = data[i + 6];
                            tmpObj.grayDamage = data[i + 7];

                            if (player == tmpObj) {
                                this.updateHealthDisplay();
                            }
                        }

                        i += 8;
                    }

                    // console.log(this.players);
                },
                "pingSocket": () => {
                    elements.pingDisplay.innerText = `${Date.now() - this.pingLastUpdate} ms`;
                },
                "initializeWeapons": (wpns) => {
                    elements.weaponsDisplay.innerHTML = "";
                    this.weaponElements = [];

                    for (let i = 0; i < wpns.length; i++) {
                        let wpn = wpns[i];

                        let element = document.createElement("div");
                        element.style = `position: absolute; bottom: ${(115 * i) + 15}px; left: 15px; width: 105px; height: 100px; background-color: rgba(0, 0, 0, .35);`;

                        let iconDisplay = document.createElement("div");
                        iconDisplay.style = `position: absolute; top: 0px; left: 0px; width: 100px; height; 100px;`;

                        let image = imageManager.getImage(wpn.imageSource);
                        image.style = "width: 100%; height: 100%;";
                        iconDisplay.appendChild(image);
                        element.appendChild(iconDisplay);

                        let ammoHolder = document.createElement("div");
                        ammoHolder.style = "position: absolute; right: 0px; top: 0px; width: 5px; height: 100%; background-color: rgba(0, 0, 0, .15);";

                        let ammoDisplay = document.createElement("div");
                        ammoDisplay.style = "position: absolute; bottom: 0px; left: 0px; background-color: white; width: 100%; height: 100%;";
                        ammoHolder.appendChild(ammoDisplay);

                        element.appendChild(ammoHolder);

                        this.wpnParents.push(element);
                        this.weaponElements.push(ammoDisplay);
                        elements.weaponsDisplay.appendChild(element);
                    }
                },
                "updateWeapons": (Data) => {
                    for (let i = 0; i < Data.length; i++) {
                        let data = Data[i];

                        this.weaponElements[data[0]].style.height = `${data[1] * 100}%`;
                    }
                },
                "reloadWeapon": (id, duration) => {
                    let element = document.createElement("canvas");
                    element.width = element.height = 500;
                    element.style = `position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 100px; height: 100px;`;

                    let ctx = element.getContext("2d");

                    let delta = 0;
                    let lastUpdate = Date.now();

                    let update = () => {
                        let d = Date.now() - lastUpdate;
                        lastUpdate = Date.now();
                        delta += d;

                        ctx.clearRect(0, 0, 500, 500);
                        ctx.shadowBlur = 12.5;
                        ctx.shadowColor = "black";
                        ctx.strokeStyle = "white";
                        ctx.lineWidth = 35;
                        ctx.beginPath();
                        ctx.arc(250, 250, 200, 0, (Math.PI * 2) * (delta / duration));
                        ctx.stroke();

                        if (delta < duration) {
                            window.requestAnimationFrame(update);
                        } else {
                            element.remove();
                        }
                    };
                    window.requestAnimationFrame(update);

                    this.wpnParents[id].appendChild(element);
                },
                "addProjectile": (x, y, dir, owner, data) => {
                    let tmp = new projectile(x, y, data.name, data.projectileId, data.range, dir, owner, data.dmg, true);
                    tmp.sid = data.sid;
                    tmp.speed += data.extraSpeed;

                    this.projectiles.push(tmp);
                },
                "removeProjectile": (sid) => {
                    for (let i = 0; i < this.projectiles.length; i++) {
                        if (this.projectiles[i].sid == sid) {
                            this.projectiles.splice(i, 1);
                            break;
                        }
                    }
                },
                "beaconUpdate": (sid, points) => {
                    let tmpObj = this.buildings[sid];

                    tmpObj.capturePoints = (tmpObj.targetCapturePoints || 0);
                    tmpObj.targetCapturePoints = points;
                    tmpObj.deltaTime = 0;

                    updateBeacons();
                },
                "updateBeaconBars": (indx, points) => {
                    let element = UTILS.getElement(beaconBarDisplays[indx]);
                    element.innerHTML = "";

                    let bar = document.createElement("div");
                    bar.style = "position: absolute; top: 0px; height: 100%;";
                    bar.style.width = `${(points / 300) * 100}%`;

                    let num = document.createElement("div");
                    num.style = "z-index: 213; font-size: 18px; font-weight: 600; color: white;";
                    num.innerHTML = UTILS.styleNumberWithSpace(points);

                    if (indx == 0) {
                        num.style.marginLeft = "6px";
                        num.style.float = "left";
                        bar.style.left = "0px";
                        bar.style.backgroundColor = "#00f";
                    } else {
                        num.style.marginRight = "6px";
                        num.style.float = "right";
                        bar.style.right = "0px";
                        bar.style.backgroundColor = "#f00";
                    }

                    element.appendChild(num);
                    element.appendChild(bar);
                }
            };
        }

        updateHealthDisplay() {
            this.grayDamageBar.style.width = `${(player.grayDamage / player.maxhealth) * 100}%`;
            this.healthBar.style.width = `${(player.health / player.maxhealth) * 100}%`;
            this.healthText.innerText = UTILS.styleNumberWithSpace(player.health);
        }

        updateMovement() {
            let dx = 0;
            let dy = 0;

            for (let key in moveKeys) {
                let tmpDir = moveKeys[key];

                dx += !!keys[key] * tmpDir[0];
                dy += !!keys[key] * tmpDir[1];
            }

            let newMoveDir = (dx == 0 && dy == 0) ? undefined : UTILS.fixTo(Math.atan2(dy, dx), 2);
            if (this.lastMoveDir == undefined || newMoveDir == undefined || Math.abs(newMoveDir - this.lastMoveDir) > 0.3) {
                this.send("updateMovement", newMoveDir);
                this.lastMoveDir = newMoveDir;
            }
        }

        startRendering() {
            renderer.start = true;
            renderer.render();
        }

        setUpChooseSlots() {
            let containerWidth = window.innerWidth - 200;
            let containerHeight = window.innerHeight;
            let gap = 10;

            let totalGapWidth = gap * 3;
            let totalGapHeight = gap * 1;
            let squareSize = (containerWidth - totalGapWidth) / 4;
            let verticalOffset = (containerHeight - squareSize * 2 - totalGapHeight) / 2;

            for (let i = 0; i < 8; i++) {
                let row = Math.floor(i / 4);
                let col = i % 4;

                let left = col * (squareSize + gap) + 100;
                let top = row * (squareSize + gap) + verticalOffset;

                let squareItem = document.createElement("div");
                squareItem.classList.add("hanger-item");
                squareItem.style = `position: absolute; top: ${top}px; left: ${left}px; width: ${squareSize}px; height: ${squareSize}px; border-radius: 4px;`;

                let shape = userProfile.shapes.find(e => e.slot == i);
                if (shape) {
                    let shapeImage = canvasDrawer.createUIItem(shape);
                    squareItem.style.cursor = "pointer";
                    shapeImage.style = "width: 100%; height: 100%;";
                    squareItem.innerHTML = `
                    <div class="hanger-shape-name" style="color: white;">
                        <div class="hanger-level-style-display" style="background-color: ${config.tierColors[shape.tier]}">
                            ${shape.level - (shape.level == 25 ? 24 : shape.level > 12 ? 12 : 0)}
                        </div>
                        <div style="margin-left: 30px;">
                            ${shape.name} ${shape.level == 25 ? `<span style="color: #ffff00">MK3</span>` : shape.level > 12 ? `<span style="color: #00ff00">MK2</span>` : ""}
                        </div>
                    </div>
                    `;
                    let weapons = userProfile.weapons.filter(e => e.owner == shape.sid).sort((a, b) => a.slot - b.slot);
                    for (let t = 0; t < weapons.length; t++) {
                        let wpn = weapons[t];
                        let tmpElement = document.createElement("div");
                        let bottom = 10 + (t * 70);
                        tmpElement.classList.add("hanger-weapon-item");
                        tmpElement.style = `bottom: ${bottom}px; border-color: ${config.tierColors[wpn.tier]}; background-image: url('${wpn.imageSource}'), none;`;
                        squareItem.appendChild(tmpElement);
                    }
                    squareItem.appendChild(shapeImage);
                    squareItem.onclick = () => {
                        renderer.screenSize = {
                            x: config.maxScreenWidth * shape.fovMulti,
                            y: config.maxScreenHeight * shape.fovMulti
                        };
                        renderer.resize();

                        elements.inGameUI.style.display = "block";
                        elements.chooseShapeUI.style.display = "none";
                        this.send("chooseSlot", i);
                    };
                } else {
                    squareItem.style.pointerEvents = "none";
                    squareItem.innerHTML = `
                    <span class="material-symbols-outlined" style="font-size: 175px;">
                    lock
                    </span>
                    `;
                }

                elements.chooseShapeUI.appendChild(squareItem);
            }
        }

        send(type) {
            let data = Array.prototype.slice.call(arguments, 1);
            let binary = msgpack.encode([type, data]);

            this.socket.postMessage(binary);
        }

        start() {
            console.clear();
            let playerData = EquipmentBuilder.player();

            doDarkModeTransition();
            moneyDisplayManager.displayItems([]);
            elements.hangerUI.style.display = "none";
            elements.gameUI.style.display = "block";

            this.socket = new Worker("client/src/main.js", {
                type: "module"
            });

            this.socket.onmessage = (event) => {
                let data = new Uint8Array(event.data);
                let parsed = msgpack.decode(data);
                let type = parsed[0];
                data = parsed[1];

                if (this.serverEvents[type]) {
                    this.serverEvents[type].apply(undefined, data);
                }
            };

            this.pingInterval = setInterval(() => {
                this.send("pingSocket");
                this.pingLastUpdate = Date.now();
            }, 1e3);

            this.send("new", playerData, true);
        }
    };

    elements.toBattleButton.onclick = () => {
        GameManager.start();
    };

    window.onload = () => {
        game.init();
    };

    window.onbeforeunload = function(event) {
        event.preventDefault();
    };
}());