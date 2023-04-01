const GetObjectCommand = require("@aws-sdk/client-s3").GetObjectCommand;
const S3Client = require("@aws-sdk/client-s3").S3Client;
const PutObjectCommand = require("@aws-sdk/client-s3").PutObjectCommand;

const AmazonS3DocumentStore = function (options) {
    this.expire = options.expire;
    this.bucket = options.bucket;
    // this.client = new AWS.S3({ region: options.region });
    this.client = new S3Client({region: options.region});
};

AmazonS3DocumentStore.prototype.get = async function (key, callback, skipExpire) {
    const _this = this;

    const command = new GetObjectCommand({
        Bucket: _this.bucket,
        Key: key
    });
    try {
        const respones = await this.client.send(command);
        // callback(respones.Body.toString('utf-8'));
        return respones.Body.toString('utf-8');
    } catch (err) {
        callback(false);
    }
};

AmazonS3DocumentStore.prototype.set = async function (key, data, callback, skipExpire) {
    const _this = this;

    const command = new PutObjectCommand({
        Bucket: _this.bucket,
        Key: key,
        Body: data,
        ContentType: 'text/plain'
    });

    try {
        const response = await this.client.send(command);
        // callback(true);
        return true;
    } catch (err) {
        return false;
        // callback(false);
    }

    // _this.client.putObject(req, function (err, data) {
    //     if (err) {
    //         callback(false);
    //     }
    //     else {
    //         callback(true);
    //         if (_this.expire && !skipExpire) {
    //             winston.warn('amazon s3 store cannot set expirations on keys');
    //         }
    //     }
    // });
};

module.exports = AmazonS3DocumentStore;

// import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// const client = new S3Client({});

// export const main = async () => {
//     const command = new PutObjectCommand({
//         Bucket: "test-bucket",
//         Key: "hello-s3.txt",
//         Body: "Hello S3!",
//     });

//     try {
//         const response = await client.send(command);
//         console.log(response);
//     } catch (err) {
//         console.error(err);
//     }
// };

