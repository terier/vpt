export class Exponential {

    constructor({
        random = Math.random,
        mean = 0,
        std = 1,
    } = {}) {
        this.random = random;
        this.mean = mean;
        this.std = std;
    }

    sample() {
        const radius = Math.sqrt(-2 * Math.log(this.random()));
        const angle = 2 * Math.PI * this.random();
        return this.mean + this.std * radius * Math.cos(angle);
    }

    pdf(x) {
        return Math.exp(-0.5 * ((x - this.mean) / this.std) ** 2) / (this.std * Math.sqrt(2 * Math.PI));
    }

}
