"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var flatten_1 = __importDefault(require("lodash/flatten"));
var react_1 = __importDefault(require("react"));
var contextTypes_1 = require("./contextTypes");
var Split_1 = require("./Split");
var BoundingBox_1 = require("./util/BoundingBox");
var mosaicUtilities_1 = require("./util/mosaicUtilities");
var MosaicRoot = /** @class */ (function (_super) {
    __extends(MosaicRoot, _super);
    function MosaicRoot() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.onResize = function (percentage, path, suppressOnRelease) {
            _this.context.mosaicActions.updateTree([
                {
                    path: path,
                    spec: {
                        splitPercentage: {
                            $set: percentage,
                        },
                    },
                },
            ], suppressOnRelease);
        };
        return _this;
    }
    MosaicRoot.prototype.render = function () {
        var root = this.props.root;
        return react_1.default.createElement("div", { className: "mosaic-root" }, this.renderRecursively(root, BoundingBox_1.BoundingBox.empty(), []));
    };
    MosaicRoot.prototype.renderRecursively = function (node, boundingBox, path) {
        if (mosaicUtilities_1.isParent(node)) {
            var splitPercentage = node.splitPercentage == null ? 50 : node.splitPercentage;
            var _a = BoundingBox_1.BoundingBox.split(boundingBox, splitPercentage, node.direction), first = _a.first, second = _a.second;
            return flatten_1.default([
                this.renderRecursively(node.first, first, path.concat('first')),
                this.renderSplit(node.direction, boundingBox, splitPercentage, path),
                this.renderRecursively(node.second, second, path.concat('second')),
            ].filter(nonNullElement));
        }
        else {
            return (react_1.default.createElement("div", { key: node, className: "mosaic-tile", style: __assign({}, BoundingBox_1.BoundingBox.asStyles(boundingBox)) }, this.props.renderTile(node, path)));
        }
    };
    MosaicRoot.prototype.renderSplit = function (direction, boundingBox, splitPercentage, path) {
        var _this = this;
        var resize = this.props.resize;
        if (resize !== 'DISABLED') {
            return (react_1.default.createElement(Split_1.Split, __assign({ key: path.join(',') + 'splitter' }, resize, { boundingBox: boundingBox, splitPercentage: splitPercentage, direction: direction, onChange: function (percentage) { return _this.onResize(percentage, path, true); }, onRelease: function (percentage) { return _this.onResize(percentage, path, false); } })));
        }
        else {
            return null;
        }
    };
    MosaicRoot.contextType = contextTypes_1.MosaicContext;
    return MosaicRoot;
}(react_1.default.PureComponent));
exports.MosaicRoot = MosaicRoot;
function nonNullElement(x) {
    return x !== null;
}
//# sourceMappingURL=MosaicRoot.js.map