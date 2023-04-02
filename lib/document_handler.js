const winston = require('winston');
const Busboy = require('busboy');

// For handling serving stored documents

const DocumentHandler = function (options) {
    if (!options) options = new Object;
    this.keyLength = options.keyLength || DocumentHandler.defaultKeyLength;
    this.maxLength = options.maxLength; // none by default
    this.store = options.store;
    this.keyGenerator = options.keyGenerator;
};

const cache = new Map();

DocumentHandler.defaultKeyLength = 10;

DocumentHandler.prototype.tryCached = function (key, skipExpire) {
    const cached = cache.get(key);
    if (cached) {
        if (!skipExpire) {
            cache.set(key, cached);
        }
        return cached;
    }
}

// Handle retrieving a document
DocumentHandler.prototype.handleGet = async function (key, res, skipExpire) {
    const data = await this.store.get(key, skipExpire);

    //when data is null it means there was either no data or an error
    if (!data) {
        winston.warn('document not found', { key: key });
        res.status(404).json({ message: 'Document not found.' });
        return;
    }
    winston.verbose('retrieved document', { key: key });
    res.status(200).json({ data: data, key: key });
    return;
};

// Handle retrieving the raw version of a document
DocumentHandler.prototype.handleGetRaw = async function (key, res, skipExpire) {
    const data = await this.store.get(key, skipExpire);

    if (!data) {
        winston.warn('raw document not found', { key: key });
        res.status(404).json({ message: 'Document not found.' });
        return;
    }
    winston.verbose('retrieved raw document', { key: key });
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(data);
};

// Handle adding a new Document
DocumentHandler.prototype.handlePost = function (req, res) {
    let _this = this;
    let buffer = '';
    let cancelled = false;

    //parse a form to grab the data
    let ct = req.headers['content-type'];
    if (ct && ct.split(';')[0] == 'multipart/form-data') {
        winston.debug('okayge');
        let busboy = new Busboy({ headers: req.headers });
        busboy.on('field', (fieldname, val) => {
            if (fieldname == 'data') {
                buffer = val;
            }
        });
        busboy.on('finish', async function () {
            await onSuccess();
        });
        req.pipe(busboy);
        //otherwise, grab flat data from POST body
    }
    else {
        req.on('data', data => {
            buffer += data.toString();
        });
        req.on('end', async () => {
            if (cancelled) return;
            await onSuccess();
        });
        req.on('error', error => {
            winston.error(`busboy connection error: ${error.message}`);
            res.status(500).json({ message: 'Internal server error occured while adding document.' });
            cancelled = true;
        });
    }

    let onSuccess = async function () {
        //check length
        if (!buffer.length) {
            cancelled = true;
            winston.warn('document with no length was POSTed');
            res.status(411).json({ message: 'Length required.' });
            return;
        }
        if (_this.maxLength && buffer.length > _this.maxLength) {
            cancelled = true;
            winston.warn('document >maxLength', { maxLength: _this.maxLength });
            res.status(413).json({ message: 'Document exceeds maximum length.' });
            return;
        }
        //and save
        const key = await _this.chooseKey(buffer);
        const success = await _this.store.set(key, buffer);
        if (!success) {
            winston.verbose('error adding document');
            res.status(500).json({ message: 'Internal server error occured while adding document.' });
            return;
        }
        winston.verbose('added document', { key: key });
        res.status(200).json({ key: key });
    };
};

function bumpBase64(str) {
    // convert the string to a character array
    const arr = str.split('');

    // iterate over the characters in reverse order
    for (let i = arr.length - 1; i >= 0; i--) {
        // get the char code of the current character
        const charCode = arr[i].charCodeAt(0);

        // "bump" the char code up by one
        const newCharCode = charCode + 1;

        // if the new char code is greater than 'z' (122), reset to 'A' (65)
        if (newCharCode > 122) {
            arr[i] = 'A';
        }
        // if the new char code is greater than 'Z' (90) but less than 'a' (97),
        // reset to 'a' (97)
        else if (newCharCode > 90 && newCharCode < 97) {
            arr[i] = 'a';
        }
        // otherwise, replace the current character with the bumped character
        else {
            arr[i] = String.fromCharCode(newCharCode);
            break;
        }
    }

    // convert the character array back to a string and return it
    return arr.join('');
}


//keep choosing keys until one isn't taken
DocumentHandler.prototype.chooseKey = async function (hash) {
    let key = this.acceptableKey(hash);
    let data = await this.store.get(key);
    if (data) {
        do {
            key = bumpBase64(key);
        } while (await this.store.get(key));
    }
    // let data = await this.store.get(key, true); //don't bump expirations on key searching
    // if (data) return this.chooseKey();
    return key;
};

DocumentHandler.prototype.acceptableKey = function (hash) {
    return this.keyGenerator.createKey(this.keyLength, hash);
};

module.exports = DocumentHandler;
