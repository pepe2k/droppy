"use strict";

var color = {
    red     : "\u001b[31m",
    green   : "\u001b[32m",
    yellow  : "\u001b[33m",
    blue    : "\u001b[34m",
    reset   : "\u001b[0m"
};

var highlights = {
    connected     : color.green,
    disconnected  : color.red,
    authenticated : color.green,
    unauthorized  : color.red
};

var useTimestamp = true;

Object.defineProperty(exports, "useTimestamp", {
    get: function () {
        return useTimestamp;
    },
    set: function (value) {
        useTimestamp = value;
    }
});

exports.log       = log;
exports.simple    = simple;
exports.error     = error;
exports.response  = response;
exports.timestamp = timestamp;

function log() {
    var args = Array.prototype.slice.call(arguments, 0);
    if (useTimestamp) args.unshift(timestamp());
    for (var i = 1, len = args.length; i < len; i++) {
        var argStr = String(args[i]);
        if (typeof args[i] === "number" && [200, 301, 304, 307, 401, 404, 405, 500].indexOf(args[i]) > -1) {
            switch (argStr.charAt(0)) {
            case "2":
                argStr = "[" + color.green + argStr + color.reset + "]";
                break;
            case "3":
                argStr = "[" + color.yellow + argStr + color.reset + "]";
                break;
            case "4":
            case "5":
                argStr = "[" + color.red + argStr + color.reset + "]";
                break;
            }
        } else if (argStr === "GET" || argStr === "POST") {
            argStr = color.yellow + argStr + color.reset;
        } else if (highlights[argStr]) {
            argStr = "[" + highlights[argStr] + argStr + color.reset + "]";
        }
        args[i] = argStr;
    }
    args.push(color.reset);
    console.log(args.join(""));
}


function response(req, res) {
    log(req.socket.remoteAddress, ":", req.socket.remotePort, " ", req.method.toUpperCase(), " ", decodeURIComponent(req.url), " ", res.statusCode);
}

function error(err) {
    if (typeof error === "object") {
        if (error.stack) {
            error(String(err.stack));
        }
        if (error.message) {
            error(String(err.message));
        }
    } else {
        var args = Array.prototype.slice.call(arguments, 0);
        args.unshift(color.red);
        args.push(color.reset);
        console.log(args.join(""));
    }
}

function simple() {
    var args = Array.prototype.slice.call(arguments, 0);
    console.log(args.join(""));
}

function timestamp() {
    var now   = new Date(),
        day   = now.getDate(),
        month = now.getMonth() + 1,
        year  = now.getFullYear(),
        hrs   = now.getHours(),
        mins  = now.getMinutes(),
        secs  = now.getSeconds();

    month  < 10 && (month  = "0" + month);
    day    < 10 && (day    = "0" + day);
    hrs    < 10 && (hrs    = "0" + hrs);
    mins   < 10 && (mins   = "0" + mins);
    secs   < 10 && (secs   = "0" + secs);

    return year + "-"  + month + "-" + day + " " + hrs + ":" + mins + ":" + secs + " ";
}