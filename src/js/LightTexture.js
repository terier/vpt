// #package js/main

// #include WebGL.js

class LightTexture {

    static resetLight(gl, x, y, z, dimensions, texture, type) {
        switch(type) {
            case 'distant':
                return this.resetDistantLight(gl, x, y, z, dimensions, texture);
            case 'point':
                return this.resetPointLight(gl, x, y, z, dimensions, texture);
        }
    }

    static resetDistantLight(gl, x, y, z, dimensions, texture) {
        console.log("Reseting distant light");
        // const gl = this._gl;
        // const dimensions = this._dimensions;
        // const unitVector = this.toUnitVector([this._x, this._y, this._z]);
        const unitVector = this.toUnitVector([x, y, z]);
        const dirX = x = unitVector[0];
        const dirY = y = unitVector[1];
        const dirZ = z = unitVector[2];

        gl.bindTexture(gl.TEXTURE_3D, texture);
        for (let z = 0; z < dimensions.depth; z++) {
            let energyDensityArray = [];
            for (let y = 0; y < dimensions.height; y++) {
                for (let x = 0; x < dimensions.width; x++) {
                    if (this.lightHitsBoundary(x, y, z, dirX, dirY, dirZ, dimensions)) {
                        energyDensityArray.push(1);
                    } else {
                        energyDensityArray.push(0);
                    }
                }
            }
            gl.texSubImage3D(gl.TEXTURE_3D, 0,
                0, 0, z, dimensions.width, dimensions.height, 1,
                gl.RED, gl.FLOAT, new Float32Array(energyDensityArray));
        }

        return [x, y, z];
    }

    static resetPointLight(gl, x, y, z, dimensions, texture) {
        let posX = x = Math.floor(x * dimensions.width);
        let posY = y = Math.floor(y * dimensions.height);
        let posZ = z = Math.floor(z * dimensions.depth);
        if (posX === 0)
            posX = x = 1;
        if (posY === 0)
            posY = y = 1;
        if (posZ === 0)
            posZ = z = 1;
        // Energy density
        gl.bindTexture(gl.TEXTURE_3D, texture);

        if (this.lightOutsideVolume(x, y, z, dimensions)) {
            console.log("Creating point light - outside");
            for (let z = 0; z < dimensions.depth; z++) {
                let energyDensityArray = [];
                for (let y = 0; y < dimensions.height; y++) {
                    for (let x = 0; x < dimensions.width; x++) {
                        let dx = x - posX;
                        let dy = y - posY;
                        let dz = z - posZ;
                        if (this.lightHitsBoundary(x, y, z, dx, dy, dz, dimensions)) {
                            energyDensityArray.push(1);
                        } else {
                            energyDensityArray.push(0);
                        }
                    }
                }
                gl.texSubImage3D(gl.TEXTURE_3D, 0,
                    0, 0, z, dimensions.width, dimensions.height, 1,
                    gl.RED, gl.FLOAT, new Float32Array(energyDensityArray));
            }
        } else {
            console.log("Creating point light - inside");
            for (let z = 0; z < dimensions.depth; z++) {
                let energyDensityArray = [];
                for (let y = 0; y < dimensions.height; y++) {
                    for (let x = 0; x < dimensions.width; x++) {
                        if (Math.abs(x - posX) < 2 &&
                            Math.abs(y - posY) < 2 &&
                            Math.abs(z - posZ) < 2)
                        {
                            energyDensityArray.push(1);
                        } else {
                            energyDensityArray.push(0);
                        }
                    }
                }
                gl.texSubImage3D(gl.TEXTURE_3D, 0,
                    0, 0, z, dimensions.width, dimensions.height, 1,
                    gl.RED, gl.FLOAT, new Float32Array(energyDensityArray));
            }
        }

        return [x, y, z];
    }

    static toUnitVector(vector) {
        const vectorLength = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1] + vector[2] * vector[2]);
        return [vector[0] / vectorLength, vector[1] / vectorLength, vector[2] / vectorLength];
    }

    static lightOutsideVolume(x, y, z, dimensions) {
        return  x < 0 || x >= dimensions.width ||
                y < 0 || y >= dimensions.height ||
                z < 0 || z >= dimensions.depth;
    }

    static lightHitsBoundary(x, y, z, dx, dy, dz, dimensions) {
        return x === 0 && dx > 0 ||
        x === dimensions.width - 1 && dx < 0 ||
        y === 0 && dy > 0 ||
        y === dimensions.height - 1 && dy < 0 ||
        z === 0 && dz > 0 ||
        z === dimensions.depth - 1 && dz < 0;
    }
}
