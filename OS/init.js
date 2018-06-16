/* This is the JSDOC Version
 * 
 * This is the ES6 Version of the Basic "init.js"
 * convert it with babel cli 
 * `npx babel .\init_ES6.js --watch --presets babel-preset-env --out-file ./init.js`
 * install: `npm i -g babel-cli`
 * and (for each folder, idk why) `npm i -D babel-preset-env`
 */

/**@type {string}*/
var mainFS = '';
scaninit((addr) => {
    mainFS = addr;
});

/**
 * Basic Computer Class (to keep it sorted)
 */
class CComputer {
    constructor() {
        
    }

    /**
     * Log to the Minecraft Log
     * @param {string} msg The Message to Log
     */
    printToLog(msg) {
        if (typeof msg == 'object') msg = JSON.stringify(msg);
        if (typeof msg != 'string') {
            throw new TypeError('"' + msg + '" is not an Object or String!');
        } else {
            computer.print(msg);
        }
    }

    /**
     * Default Invoke with JSDOC
     * @param {string} addr The Address to call the method on
     * @param {string} method The Method to be called
     * @param {any[]} options Options in Array
     * @param {function} cb Normal Callback
     * @param {function} [errcb] Error Callback
     */
    invoke(addr, method, options, cb, errcb) {
        if (!errcb) errcb = () => { };
        computer.invoke(addr, method, options, cb, errcb);
    }

    /**
     * Get a List of Component Addresses
     * @returns {string[]}
     */
    compList() {
        var allComp = computer.list();
        var results = [];
        for (var comp in allComp) {
            results.push({ // its an object to make it better for JS usage
                "type": allComp[comp],
                "address": comp
            });
        }
        return results;
    }

    /**
     * Get All Components of Type
     * @param {string} type The Type to filter for
     * @returns {string[]} Array of Addresses
     */
    compListOfType(type) {
        return this.compList() // get a list
            .filter((v) => v.type == type) // filter for type
            .map((v) => v.address); // return only the addresses
    }

    /**
     * Crash the PC with an Error
     * @param {string | Error} err
     */
    crash(err) {
        computer.error(err);
    }
}
var extComputer = new CComputer(); // init the Class

class CTerm {
    constructor() {
        this.x = 1;
        this.y = 1;
    }

    /**
     * Write something to the screen
     * @param {string | object} msg Text to write
     * @param {boolean} [wrap] Line wrap?
     */
    write(msg, wrap = true) {
        if (typeof msg == 'object') msg = JSON.stringify(msg);
        if (typeof msg != 'string' && msg.toString) msg = msg.toString();
        if (typeof msg != 'string' && !msg.toString) throw new Error('(term.write) msg.toString is not a function!');

        var gpu = extComputer.compListOfType('gpu')[0];
        extComputer.invoke(gpu, 'set', [this.x, this.y, msg], () => {
            if (wrap) {
                extComputer.invoke(gpu, 'getResolution', [], (x, y) => {
                    this.x = 1;
                    if (this.y + 1 > y) {
                        extComputer.invoke(gpu, 'copy', [1, 1, x, y, 0, -1], () => {
                            extComputer.invoke(gpu, 'fill', [1, y, x, 1, " "], () => {
                                this.y = y;
                            }, (err) => {
                                extComputer.crash(err);
                            });
                        }, (err) => {
                            extComputer.crash(err);
                        });
                    } else this.y += 1
                }, (err) => {
                    extComputer.crash(err);
                });
            }
        }, function (err) {
            extComputer.crash(err);
        });
    }
}
var term = new CTerm(); // init the term Class

class FileHandler {
    /**
     * 
     * @param {string} file Path + File
     * @param {string} [fileSystem] wich FileSystem to use. default: mainFS
     */
    constructor(file, fileSystem = mainFS) {
        if (typeof file != 'string') throw new TypeError('file must always be a string (path)');
        if (typeof fileSystem != 'string') throw new TypeError('fileSystem must always be a string (address)');
        this.file = file;
        this.fileSystem = fileSystem;
        this.handle = 0;
    }

    /**
     * Reads the File
     * @param {function} cb Callback
     */
    read(cb) {
        if (!this.handle) throw new Error('Cannot read a file that is not open!');
        var buffer = '';
        function readData(results) {
            if (results) {
                buffer += decodeRead(results);
                extComputer.invoke(this.fileSystem, "read", [this.handle, Number.MAX_VALUE], (res) => {
                    readData.call(this, res);
                });
            } else {
                cb(buffer);
            }
        }
        extComputer.invoke(this.fileSystem, "read", [this.handle, Number.MAX_VALUE], (res) => {
            readData.call(this, res);
        });
    }

    write(cb) {
        if (!this.handle) throw new Error('Cannot write to a file that is not open!');
        //not done yet
    }

    /**
     * Open a FileHandler
     * @param {function} cb Callback
     */
    open(cb) {
        extComputer.invoke(this.fileSystem, 'exists', [this.file], (b) => {
            if (b) {
                extComputer.invoke(this.fileSystem, "open", [this.file], (handle) => {
                    this.handle = handle;
                    cb();
                });
            } else throw new Error(`"${this.file}" does not exists on "${this.fileSystem}"`);
        }, (err) => {
            throw err;
        });
    }

    /**
     * Closes a FileHandler
     * @param {function} cb Callback
     */
    close(cb) {
        if (!this.handle) throw new Error('Cannot close a FileHandler that is not Open!');
        extComputer.invoke(this.fileSystem, 'close', [this.handle], () => {
            cb();
        }, (err) => {
            throw err;
        });
    }
}

var eventfile = new FileHandler('/EventEmitter.js');
eventfile.open(() => {
    eventfile.read((v) => {
        var EventEmitter = eval(v);
        var t = new EventEmitter();

        t.on('hello', (msg) => {
            term.write(msg);
        });

        t.emit('hello', 'www');
    });
});

term.write('Basic Implementation Finished');
//onSignal = function () {
//    write('GOT SIGNAL ' + JSON.stringify(arguments));
//}
//onSignal('key_down', function (addr, char, code, pn) {
//    write('KEYDOWN');
//});
