export class Exponential {

    constructor({
        random = Math.random,
        rate = 1,
    } = {}) {
        this.random = random;
        this.rate = rate;
    }

    q(x) {
        return -Math.log(1 - x) / this.rate;
    }

    sample() {
        return -Math.log(1 - this.random()) / this.rate;
    }

    pdf(x) {
        if (x < 0) {
            return 0;
        } else {
            return this.rate * Math.exp(-this.rate * x);
        }
    }

    cdf(x) {
        if (x < 0) {
            return 0;
        } else {
            return 1 - Math.exp(-this.rate * x);
        }
    }

}
