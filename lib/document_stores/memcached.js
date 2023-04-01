const memcached = require('memcached');
const winston = require('winston');

class MemcachedDocumentStore {

    // Create a new store with options
    constructor(options){
        this.expire = options.expire;

        const host = options.host || '127.0.0.1';
        const port = options.port || 11211;
        const url = `${host}:${port}`;
        this.connect(url);
    }

    // Create a connection
    connect(url){
        this.client = new memcached(url);

        winston.info(`connecting to memcached on ${url}`);

        this.client.on('failure', function(error){
            winston.info('error connecting to memcached', {error});
        });
    }

    // Save file in a key
    async set(key, data, callback, skipExpire){
        await this.client.set(key, data, skipExpire ? 0 : this.expire, (error) => {
            return !!error;
        });
    }

    // Get a file from a key
    async get(key, callback, skipExpire){
        await this.client.get(key, (error, data) => {
            // callback(error ? false : data);
            
            // Update the key so that the expiration is pushed forward
            if (!skipExpire){
                this.set(key, data, (updateSucceeded) => {
                    if (!updateSucceeded){
                        winston.error('failed to update expiration on GET', {key});
                    }
                }, skipExpire);
            }
            return error ? false : data;
        });
    }

}

module.exports = MemcachedDocumentStore;
