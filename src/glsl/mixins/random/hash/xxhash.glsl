// #part /glsl/mixins/random/hash/xxhash

uint hash(uint x) {
    x = x + 374761393u;
    x =  668265263u * ((x << 17) | (x >> 15));
    x = 2246822519u * (x ^ (x >> 15));
    x = 3266489917u * (x ^ (x >> 13));
    return x ^ (x >> 16);
}
