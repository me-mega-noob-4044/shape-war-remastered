export default class {
    constructor(data) {
        this.name = data.name;
        this.description = (data.description || "No description.");
        this.imageSource = (data.imageSource || "");
        this.duration = (data.duration || 0);
        this.reload = (data.reload || 0);
    }
}