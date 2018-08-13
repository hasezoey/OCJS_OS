/* global scaninit:false decodeRead:false saw:false */
/* This is the JSDOC Version
 * 
 * This is the ES6 Version of the Basic "init.js"
 * convert it with babel cli 
 * look into the README to get the commands
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
    constructor() {}

    /**
     * Log to the Minecraft Log
     * @param {string} msg The Message to Log
     * @returns {void}
     */
    printToLog(msg) {
        if (typeof msg == 'object') msg = JSON.stringify(msg);
        if (typeof msg != 'string')
            throw new TypeError('"' + msg + '" is not an Object or String!');
        else
            computer.print(msg);
    }

    /**
     * Default Invoke with JSDOC
     * @param {string} addr The Address to call the method on
     * @param {string} method The Method to be called
     * @param {any[]} options Options in Array
     * @param {function} cb Normal Callback
     * @param {function} [errcb] Error Callback
     * @returns {void}
     */
    invoke(addr, method, options, cb, errcb) {
        if (!errcb) errcb = () => {};
        computer.invoke(addr, method, options, cb, errcb);
    }

    /**
     * Get a List of Component Addresses
     * @returns {string[]} Returns the Results
     */
    compList() {
        var allComp = computer.list();
        var results = [];
        for (var comp in allComp) {
            results.push({ // its an object to make it better for JS usage
                'type': allComp[comp],
                'address': comp
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
     * @returns {void}
     */
    crash(err) {
        computer.error(err);
    }
}

class CTerm {
    constructor() {
        /**@type {number} */
        this.x = 1;
        /**@type {number} */
        this.y = 1;

        /** Listen for "key_down" signals? */
        this.key_down = false;
        /** This Buffer buffers all key inputes (when this.key_down is true) */
        this.writeingBuffer = '';
    }

    /**
     * Write something to the screen
     * @param {string} msg Text to write
     * @param {boolean} [wrap] Line wrap?
     * @returns {void}
     */
    write(msg, wrap = true) {
        if (typeof msg != 'string' && msg.toString) msg = msg.toString();
        if (typeof msg == 'object') msg = JSON.stringify(msg);
        if (typeof msg != 'string' && !msg.toString) throw new Error('(term.write) msg.toString is not a function!');

        var gpu = extComputer.compListOfType('gpu')[0];
        extComputer.invoke(gpu, 'getResolution', [], (maxx, maxy) => {
            if (this.x > maxx) this.y += 1;

            /**
             * Execute a copy & fill (bott line clear and move text one up)
             * @param {function} cb
             * @returns {void}
             */
            function copyfill(cb) {
                if (this.y > maxy) {
                    extComputer.invoke(gpu, 'copy', [1, 1, maxx, maxy, 0, -1], () => {
                        extComputer.invoke(gpu, 'fill', [1, maxy, maxx, 1, ' '], () => {
                            this.y = maxy;
                            cb();
                        }, (err) => {
                            extComputer.crash(err);
                        });
                    }, (err) => {
                        extComputer.crash(err);
                    });
                } else cb();
            }

            /** 
             * Set it to the screen 
             * @returns {void}
             */
            function set() {
                var amsg = [msg];
                if (this.x + msg.length > maxx) {
                    let index = -1;
                    while (msg.length > 0) {
                        index++;
                        amsg[index] = msg.substring(0, maxx - this.x + 1);
                        msg = msg.substring(maxx - this.x + 1);
                    }
                }
                extComputer.printToLog(amsg);
                let index = -1;
                saw((cb) => {
                    index++;
                    if (index <= amsg.length - 1) {
                        copyfill.call(this, () => {
                            var v = amsg[index];
                            extComputer.invoke(gpu, 'set', [this.x, this.y, v], () => {
                                if (wrap || this.x + 1 > maxx) {
                                    this.x = 1;
                                    this.y += 1;
                                } else this.x += v.length;
                                cb(true);
                            }, (err) => {
                                extComputer.crash(err);
                            });
                        });
                    } else cb(false);
                }, () => {});
            }

            if (this.y > maxy) {
                copyfill.call(this, () => {
                    set.call(this);
                });
            } else set.call(this);
        }, (err) => {
            extComputer.crash(err);
        });
    }

    /**
     * Setup the "key_down" Listener (to write commands and so)
     * -> call this only when storage & storage.signal is already defined (otherwise it will do nothing)
     * @returns {void}
     */
    setupKey_downListener() {
        if (storage && storage.signal) {
            storage.signal.on('key_down', (obj) => {
                if (this.key_down) {
                    switch (obj[1]) {
                        case 13: // Enter

                            break;
                        case 8: // Back
                            var gpu = extComputer.compListOfType('gpu')[0];
                            extComputer.invoke(gpu, 'set', [this.x - 1, this.y, ' '], () => {
                                this.x = this.x - 1 < 1 ? 1 : this.x - 1;
                            });
                            break;
                        default:
                            var key = String.fromCharCode(obj[1]);
                            this.writeingBuffer += key;
                            term.write(key, false);
                            break;
                    }
                }
            });
        }
    }
}

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
     * @returns {void}
     */
    read(cb) {
        if (!this.handle) throw new Error('Cannot read a file that is not open!');
        var buffer = '';

        function readData(results) {
            if (results) {
                buffer += decodeRead(results);
                extComputer.invoke(this.fileSystem, 'read', [this.handle, Number.MAX_VALUE], (res) => {
                    readData.call(this, res);
                });
            } else {
                cb(buffer);
            }
        }
        extComputer.invoke(this.fileSystem, 'read', [this.handle, Number.MAX_VALUE], (res) => {
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
     * @returns {void}
     */
    open(cb) {
        extComputer.invoke(this.fileSystem, 'exists', [this.file], (b) => {
            if (b) {
                extComputer.invoke(this.fileSystem, 'open', [this.file], (handle) => {
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
     * @returns {void}
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

var extComputer = new CComputer();
var term = new CTerm();

/* start Intellisense hacks */
// can be deleted when the space is needed
if (false) { // eslint-disable-line
    var EventEmitter = require('./EventEmitter_ES6'); // eslint-disable-line
}
/* end Intellisense hacks */

/**Set this to true to set the sleep to non-init mode */
var initFinished = false;
var tickCount = -1;
/** This is needed as storage between ticks / calls */
var storage = { // can be deleted when the space is needed (can be replaced to `var storage = {}`)
    /**@type {EventEmitter}*/
    EventEmitter: null,
    /**@type {EventEmitter}*/
    signal: null,
    /**@type {string} */
    pcName: 'dev'
};

/**
 * the onSignal Function
 * @returns {void}
 */
function onSignal() {
    /**@type {object} */
    let signal;
    if (arguments.length > 0) {
        signal = JSON.stringify(arguments || {});
        extComputer.printToLog('GOT SIGNAL ' + signal); // DEBUG
    }
    if (!initFinished) tickCount++;
    computer.sleep(initFinished ? 2 : 0);
    if (!storage.signal && storage.EventEmitter) storage.signal = new storage.EventEmitter();
    if (arguments.length > 0 && storage.EventEmitter)
        storage.signal.emit(
            arguments[0],
            Object.keys(arguments).slice(1).map((v) => arguments[v]));

    if (!initFinished) {
        switch (tickCount) {
            case 0:
                var gpu = extComputer.compListOfType('gpu')[0];
                extComputer.invoke(gpu, 'setDepth', [8], () => {

                }, (err) => {
                    extComputer.crash(err);
                });
                break;
            case 1: // init the EventEmitter Class
                term.write('init storage.EventEmitter ... ');
                setupEventEmitter();
                break;
            case 2: // init basic cli terminal
                term.write('init term.KeyDownListener ... ', false);
                term.setupKey_downListener();
                term.key_down = true;
                term.write('finished');
                break;
            case 3:
                term.write('');
                term.write('Basic Implementation Finished');
                term.write('');

                // var gpu = extComputer.compListOfType('gpu')[0];
                // extComputer.invoke(gpu, 'setForeground', [0xFF0000], () => {

                // }, (err) => {
                //     extComputer.crash(err);
                // });
                term.write(`player@${storage.pcName}:/home$ `, false); // the template
                initFinished = true;
                break;
        }
    } else {
        if (signal)
            storage.signal.emit('signal', signal);
        else
            storage.signal.emit('tick', {});
    }

    // TODO: autostart programms
}

/**
 * Setup for the Events
 * @returns {void}
 */
function setupEventEmitter() {
    var eventfile = new FileHandler('/build/EventEmitter_ES6.js');
    try {
        term.write('-> loading /build/EventEmitter_ES6.js ... ', false);
        eventfile.open(() => {
            eventfile.read((v) => {
                storage.EventEmitter = eval(v);
                term.write('loaded');
            });
        });
    } catch (err) {
        computer.error(err);
    }
}

onSignal; // return it to the eval in the EEPROM