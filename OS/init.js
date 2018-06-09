/* init */
var global = {
    /** Current Postitions */
    pos: {
        /** Current x */
        x: 0,
        /** Current y */
        y: 0,
    },
}

function getComponentList(type) { // copyed out the ROM
    var allComp = computer.list();
    var results = []
    for (comp in allComp) {
        /* disabled because of spam, let it in for debug */
        //computer.print(comp);
        //computer.print(allComp[comp]);
        if (allComp[comp] == type) {
            results.push(comp);
        }
    }
    //computer.print(JSON.stringify(results));
    return results;
}

// object because a class must be "new"ed
var fs = {
    /**
    * Returns how much space has the filesystem
    * give a type like mb, kb, none for bytes
    * (if no parameter is given it uses filesystem 0)
    * @param {string} t
    * @param {number} system
    */
    spaceTotal: (t = 'b', system = 0) => {
        var b = computer.invokeSync(getComponentList('filesystem')[system], 'spaceTotal', [])[0];
        switch (t) {
            case 'mb':
                return b / 2000;
                break;
            case 'kb':
                return b / 1000;
                break;
            case 'b':
            default:
                return b;
                break;
        }
    },
    /**
    * Returns if a FileSystem is ReadOnly
    * (if no parameter is given it uses filesystem 0)
    * @param {number} system
    * @returns {boolean}
    */
    isReadOnly: (system = 0) => {
        return computer.invokeSync(getComponentList('filesystem')[system], 'isReadOnly', [])[0]
    },
    /**
    * Gets the Label of a FileSystem
    * (if no parameter is given it uses filesystem 0)
    * @param {number} system
    * @returns {boolean}
    */
    getLabel: (system = 0) => {
        return computer.invokeSync(getComponentList('filesystem')[system], 'getLabel', [])[0]
    },
    /**
    * List the Content in the path
    * (if no system-parameter is given it uses filesystem 0)
    * (Not Function)
    * @param {string} path
    * @param {number} system
    */
    ls: (path, system) => {
        if (typeof path !== 'string') path = JSON.stringify(path);
        if (path.length <= 0) return false;
        try {
            return computer.invokeSync(getComponentList('filesystem')[system], 'list', [path])[0];
        }
        catch (err) {
            return err;
        }
    },
}

var term = {
    /**
    * write text to screen with pos
    * "\n" not handeled
    * @param {number} x
    * @param {number} y
    * @param {string} text
    * @param {function} cb
     */
    write: (x, y, text, cb) => {
        if (typeof cb !== 'function') cb = () => { };
        if (typeof text !== 'string') text = JSON.stringify(text);
        if (/*typeof text !== 'string' || */text.length == 0) {
            cb(false);
            return;
        }

        var gpu = getComponentList('gpu')[0];
        var gpu_res = computer.invokeSync(gpu, 'maxResolution', []);
        var max = {
            x: gpu_res[0],
            y: gpu_res[1],
        }

        if (x > max.x || y > max.y) {
            computer.invokeSync(gpu, 'set', [1, 1, 'Input was to high, max Resolution is ' + x + 'x' + y + 'y']);
            cb(false);
        }
        if (x < 1 || y < 1) {
            computer.invokeSync(gpu, 'set', [1, 1, 'Input was to low, min Input is 1, 1']);
            cb(false);
        }
        if (text.length > max.x) {
            text = text.substring(0, max.x);
        }
        computer.invoke(gpu, 'set', [x, y, text.toString()], () => {
            cb(true);
        }, (err) => {
            cb(false);
        });
    },

    /**
    * Write text to screen to the next line
    * "\n" handeled
    * @param {string} text
    * @param {function} cb
     */
    print: (text, cb) => {
        var gpu = getComponentList('gpu')[0];
        var gpu_res = computer.invokeSync(gpu, 'maxResolution', []);
        var max = {
            x: gpu_res[0],
            y: gpu_res[1],
        }
        if (typeof text !== 'string') text = JSON.stringify(text);
        var text_arr = text.trim().split('\n');

        text_arr.forEach((item) => {
            if (global.pos.y + 1 > max.y) {
                computer.invokeSync(gpu, 'copy', [1, 2, max.x, max.y - 1, 0, -1]);
                computer.invokeSync(gpu, 'fill', [0, max.y, max.x, max.y, " "]);
                global.pos.y = max.y;
            } else {
                global.pos.y += 1; //+1 line
            }
            global.pos.x = 1; //set to char 1
            computer.invokeSync(gpu, 'fill', [global.pos.x, global.pos.y, max.x, 1, " "]);
            term.write(global.pos.x, global.pos.y, item);
            //term.write(1, max.y - 1, 'global: ' + global.pos.x + 'x, ' + global.pos.y + 'y');
            //term.write(1, max.y, 'max.x: '+max.x+' max.y: '+max.y);
        });
        // copy from line 2, char 1 until (max x&y) to line 1, char 0
    },

    /**
    * Clears the Screen
    * @param {function} cb
     */
    clear: (cb) => {
        if (typeof cb !== 'function') cb = () => { };
        var gpu = getComponentList('gpu')[0];
        var gpu_res = computer.invokeSync(gpu, 'maxResolution', []);
        var max = {
            x: gpu_res[0],
            y: gpu_res[1],
        }
        global.pos = {
            x: 0,
            y: 0,
        }

        computer.invoke(gpu, 'fill', [1, 1, max.x, max.y, " "], () => {
            cb(true);
        }, () => {
            cb(false);
        });
    }
}
var t = 0;
/**
 * This Function is only for computer.next,
 * to not re-execute this script, onyl this function
 */
function simEventLoop() { // will be called often
    /* at the moment it is only an empty function,
     because the other code should be executet async
     and needs global values, and nothing at the moment
     to be every tick...
    */

    /* spam test - gpu copy and so */
    //if (t <= 100) {
    //    term.print('t: ' + t);
    //    t++;
    //}
}
computer.next(simEventLoop);
/* init end */

// here only for testing some gpu functions
//var gpu = getComponentList('gpu')[0];
//var gpu_res = computer.invokeSync(gpu, 'maxResolution', []);
//var max = {
//    x: gpu_res[0],
//    y: gpu_res[1],
//}
//term.print('test');
//term.print('test2');

//term.write(1, max.y, 'looooooooooooooooooooooooooooooong test'); //override test

/* keyboard testing */
//var s = computer.pullSignal();
//term.print(s);
//term.print('fs ls: ' + fs.ls('/').toString());

//term.write(1, 15, Math.random());
