﻿/*
 * this is only for JSDOC, Intellisense, AutoComplete!
 * Do not use / include it in the code!
 */
class BComputer {
    constructor() { }

    /**
     * Log to the Minecraft Log
     * @param {string} msg The Message to Log
     */
    print(msg) { }

    /**
     * Invoke a Method on a Component
     * @param {string} addr The Address to call the method on
     * @param {string} method The Method to be called
     * @param {any[]} options Options in Array
     * @param {function} cb Normal Callback
     * @param {function} [errcb] Error Callback
     */
    invoke(addr, method, options, cb, errcb) { }

    /**
     * Get ALL Components Connected
     * @returns {object}
     */
    list() { }

    /**
     * Set the time where the next normal Tick is called
     * (Currently not known what it is, it is ms or seconds?)
     * @param {number} time
     */
    sleep(time) { }

    /**
     * Crashes the Computer with a Supplied Message
     * @param {string} msg
     */
    error(msg) { }

    /**
     * Shutdown / Reboot the Computer
     * @param {boolean} [reboot] Should it reboot?
     */
    shutdown(reboot) { }
}

var computer = new BComputer();