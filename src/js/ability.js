export default class Ability {
    constructor(data) {
        this.name = data.name;
        this.description = (data.description || "No description.");
        this.imageSource = (data.imageSource || "");
        this.duration = (data.duration || 0);
        this.reload = (data.reload || 0);

        this.reloadTimer = 0;
        this.durationTimer = 0;
    }

    init() {
        // For abilities where it enables shields and stuff
    }

    deinit() {
        // Remove the shields and stuff when ability ends
    }
}