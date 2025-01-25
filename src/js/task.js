export default class Task {
    constructor(data) {
        this.label = data.label;
        this.description = data.description;
        this.requirement = { ...data.requirement };
        this.reward = { ...data.reward };
        this.current = 0;
    }
}