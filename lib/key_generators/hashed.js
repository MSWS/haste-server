const fs = require('fs');
const crypto = require('crypto');

module.exports = class HashedKeyGenerator {

    // Initialize a new generator with the given keySpace
    constructor(options = {}) {
        this.algorithm = options.algorithm || 'sha256';
        this.hasher = crypto.createHash(this.algorithm);
        this.encoding = options.encoding || 'base64';
        // this.keyspace = options.keyspace || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    }

    // Generate a key of the given length
    createKey(keyLength, hash) {
        this.hasher.update(hash);
        return this.hasher.digest(this.encoding).slice(0, keyLength);
    }

};
