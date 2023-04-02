const fs = require('fs');
const crypto = require('crypto');

module.exports = class HashedKeyGenerator {

    // Initialize a new generator with the given keySpace
    constructor(options = {}) {
        this.hasher = crypto.createHash('sha256');
        // this.keyspace = options.keyspace || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    }

    // Generate a key of the given length
    createKey(keyLength, hash) {
        this.hasher.update(hash);
        return this.hasher.digest('hex').slice(0, keyLength);
    }

};
