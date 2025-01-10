export default class Ability {
    constructor(data) {
        this.name = data.name;
        this.description = (data.description || "No description.");
        this.imageSource = (data.imageSource || "");
        this.duration = (data.duration || 0);
        this.reload = (data.reload || 0);

        this.boostSpeed = data.boostSpeed;
        this.avoidBuildings = data.avoidBuildings;

        this.reloadTimer = 0;
        this.durationTimer = 0;
    }

    init(player, shape) {
        if (this.avoidBuildings) shape.avoidBuildings = true;

        if (this.boostSpeed) {
            let dir = (player.moveDir !== undefined && player.moveDir !== null) ? player.moveDir : player.targetDir;

            shape.vel.x += Math.cos(dir) * this.boostSpeed;
            shape.vel.y += Math.sin(dir) * this.boostSpeed;
        }
    }

    logic() {
        // ABILITY LOGIC
    }

    update(player, shape, delta) {
        if (this.durationTimer > 0) {
            this.durationTimer -= delta;

            this.logic(shape);

            if (this.durationTimer <= 0) {
                this.durationTimer = 0;
                this.reloadTimer = this.reload;
                this.deinit(player, shape);
            }
        } else if (this.reloadTimer > 0) {
            this.reloadTimer -= delta;
            if (this.reloadTimer <= 0) this.reloadTimer = 0;
        }
    }

    deinit(player, shape) {
        if (this.avoidBuildings) shape.avoidBuildings = false;
    }
}