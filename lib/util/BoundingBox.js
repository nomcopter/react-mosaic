"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var assertNever_1 = require("./assertNever");
var BoundingBox;
(function (BoundingBox) {
    function empty() {
        return {
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
        };
    }
    BoundingBox.empty = empty;
    function split(boundingBox, relativeSplitPercentage, direction) {
        var absolutePercentage = getAbsoluteSplitPercentage(boundingBox, relativeSplitPercentage, direction);
        if (direction === 'column') {
            return {
                first: __assign({}, boundingBox, { bottom: 100 - absolutePercentage }),
                second: __assign({}, boundingBox, { top: absolutePercentage }),
            };
        }
        else if (direction === 'row') {
            return {
                first: __assign({}, boundingBox, { right: 100 - absolutePercentage }),
                second: __assign({}, boundingBox, { left: absolutePercentage }),
            };
        }
        else {
            return assertNever_1.assertNever(direction);
        }
    }
    BoundingBox.split = split;
    function getAbsoluteSplitPercentage(boundingBox, relativeSplitPercentage, direction) {
        var top = boundingBox.top, right = boundingBox.right, bottom = boundingBox.bottom, left = boundingBox.left;
        if (direction === 'column') {
            var height = 100 - top - bottom;
            return (height * relativeSplitPercentage) / 100 + top;
        }
        else if (direction === 'row') {
            var width = 100 - right - left;
            return (width * relativeSplitPercentage) / 100 + left;
        }
        else {
            return assertNever_1.assertNever(direction);
        }
    }
    BoundingBox.getAbsoluteSplitPercentage = getAbsoluteSplitPercentage;
    function getRelativeSplitPercentage(boundingBox, absoluteSplitPercentage, direction) {
        var top = boundingBox.top, right = boundingBox.right, bottom = boundingBox.bottom, left = boundingBox.left;
        if (direction === 'column') {
            var height = 100 - top - bottom;
            return ((absoluteSplitPercentage - top) / height) * 100;
        }
        else if (direction === 'row') {
            var width = 100 - right - left;
            return ((absoluteSplitPercentage - left) / width) * 100;
        }
        else {
            return assertNever_1.assertNever(direction);
        }
    }
    BoundingBox.getRelativeSplitPercentage = getRelativeSplitPercentage;
    function asStyles(_a) {
        var top = _a.top, right = _a.right, bottom = _a.bottom, left = _a.left;
        return {
            top: top + "%",
            right: right + "%",
            bottom: bottom + "%",
            left: left + "%",
        };
    }
    BoundingBox.asStyles = asStyles;
})(BoundingBox = exports.BoundingBox || (exports.BoundingBox = {}));
//# sourceMappingURL=BoundingBox.js.map