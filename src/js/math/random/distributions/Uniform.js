export class Uniform {

    constructor({
        random = Math.random,
        min = 0,
        max = 1,
    } = {}) {
        this.random = random;
        this.min = min;
        this.max = max;
    }

    q(x) {
        return this.min + (this.max - this.min) * x;
    }

    sample() {
        return this.min + (this.max - this.min) * this.random();
    }

    pdf(x) {
        if (x >= this.min && x <= this.max) {
            return 1 / (this.max - this.min);
        } else {
            return 0;
        }
    }

    cdf(x) {
        if (x < this.min) {
            return 0;
        } else if (x > this.max) {
            return 1;
        } else {
            return (x - this.min) / (this.max - this.min);
        }
    }

}
