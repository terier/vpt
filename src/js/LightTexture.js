// #package js/main

// #include WebGL.js

class LightTexture {

    static resetLight(gl, lights, dimensions, texture) {
        let lightArrays = []
        for (let i = 0; i < lights.length; i++) {
            let lightDefinition = lights[i];
            switch(lightDefinition.type) {
                case 'distant':
                    lightArrays.push(this.getDistantLightArray(gl, lightDefinition, dimensions)); break;
                case 'point':
                    lightArrays.push(this.getPointLightArray(gl, lightDefinition, dimensions)); break;
            }
        }
        this.fillTexture(gl, lightArrays, dimensions, texture);
    }

    static fillTexture(gl, lightArrays, dimensions, texture) {
        let format = gl.RED
        if (lightArrays.length >= 3) {
            format = gl.RGBA
        } else if (lightArrays.length === 2) {
            format = gl.RG
        }
        console.log(lightArrays.length)
        gl.bindTexture(gl.TEXTURE_3D, texture);
        let energyDensityArray = [];
        for (let z = 0; z < dimensions.depth; z++) {
            for (let y = 0; y < dimensions.height; y++) {
                for (let x = 0; x < dimensions.width; x++) {
                    for (let i = 0; i < lightArrays.length; i++) {
                        let val = lightArrays[i][z * dimensions.depth + y * dimensions.height + x]
                        energyDensityArray.push(val);
                    }
                    if (lightArrays.length === 3) {
                        energyDensityArray.push(0);
                    }
                }
            }
            gl.texSubImage3D(gl.TEXTURE_3D, 0,
                0, 0, z, dimensions.width, dimensions.height, 1,
                format, gl.FLOAT, new Float32Array(energyDensityArray));
        }
    }

    static getDistantLightArray(gl, lightDefinition, dimensions) {
        console.log("Reseting distant light");
        // const gl = this._gl;
        // const dimensions = this._dimensions;
        // const unitVector = this.toUnitVector([this._x, this._y, this._z]);
        const unitVector = this.toUnitVector(lightDefinition.getLightArr());
        const dirX = unitVector[0];
        const dirY = unitVector[1];
        const dirZ = unitVector[2];

        // gl.bindTexture(gl.TEXTURE_3D, texture);
        let energyDensityArray = [];
        for (let z = 0; z < dimensions.depth; z++) {
            for (let y = 0; y < dimensions.height; y++) {
                for (let x = 0; x < dimensions.width; x++) {
                    if (this.lightHitsBoundary(x, y, z, dirX, dirY, dirZ, dimensions)) {
                        energyDensityArray.push(1);
                    }
                    else {
                        energyDensityArray.push(0);
                    }
                }
            }
            // gl.texSubImage3D(gl.TEXTURE_3D, 0,
            //     0, 0, z, dimensions.width, dimensions.height, 1,
            //     gl.RED, gl.FLOAT, new Float32Array(energyDensityArray));
        }

        return energyDensityArray;
    }

    static getPointLightArray(gl, lightDefinition, dimensions) {
        let posX = Math.floor(lightDefinition.light[0] * dimensions.width);
        let posY = Math.floor(lightDefinition.light[1] * dimensions.height);
        let posZ = Math.floor(lightDefinition.light[2] * dimensions.depth);
        if (posX === 0)
            posX = 1;
        if (posY === 0)
            posY = 1;
        if (posZ === 0)
            posZ = 1;
        // Energy density
        // gl.bindTexture(gl.TEXTURE_3D, texture);
        let energyDensityArray = [];
        if (this.lightOutsideVolume(posX, posY, posZ, dimensions)) {
            console.log("Creating point light - outside");
            for (let z = 0; z < dimensions.depth; z++) {

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
                // gl.texSubImage3D(gl.TEXTURE_3D, 0,
                //     0, 0, z, dimensions.width, dimensions.height, 1,
                //     gl.RED, gl.FLOAT, new Float32Array(energyDensityArray));
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
                // gl.texSubImage3D(gl.TEXTURE_3D, 0,
                //     0, 0, z, dimensions.width, dimensions.height, 1,
                //     gl.RED, gl.FLOAT, new Float32Array(energyDensityArray));
            }
        }
        return energyDensityArray;
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
