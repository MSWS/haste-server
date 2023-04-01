const winston = require('winston');

const GetObjectCommand = require("@aws-sdk/client-s3").GetObjectCommand;
const S3Client = require("@aws-sdk/client-s3").S3Client;
const PutObjectCommand = require("@aws-sdk/client-s3").PutObjectCommand;

const AmazonS3DocumentStore = function (options) {
    this.expire = options.expire;
    this.bucket = options.bucket;
    // this.client = new AWS.S3({ region: options.region });
    this.client = new S3Client({ region: options.region });
};

AmazonS3DocumentStore.prototype.get = async function (key, callback, skipExpire) {
    const _this = this;

    const command = new GetObjectCommand({
        Bucket: _this.bucket,
        Key: 'pastes/' + key
    });
    try {
        const respones = await this.client.send(command);
        return respones.Body.transformToString();
    } catch (err) {
        winston.error(err);
        return false;
    }
};

AmazonS3DocumentStore.prototype.set = async function (key, data, callback, skipExpire) {
    const _this = this;

    const command = new PutObjectCommand({
        Bucket: _this.bucket,
        Key: 'pastes/' + key,
        Body: data,
        ContentType: 'text/plain'
    });

    try {
        await this.client.send(command);
        return true;
    } catch (err) {
        winston.error(err);
        return false;
    }
};

module.exports = AmazonS3DocumentStore;
