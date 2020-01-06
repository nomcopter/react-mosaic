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
var classnames_1 = __importDefault(require("classnames"));
var clamp_1 = __importDefault(require("lodash/clamp"));
var throttle_1 = __importDefault(require("lodash/throttle"));
var react_1 = __importDefault(require("react"));
var BoundingBox_1 = require("./util/BoundingBox");
var RESIZE_THROTTLE_MS = 1000 / 30; // 30 fps
var TOUCH_EVENT_OPTIONS = {
    capture: true,
    passive: false,
};
var Split = /** @class */ (function (_super) {
    __extends(Split, _super);
    function Split() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.rootElement = react_1.default.createRef();
        _this.listenersBound = false;
        _this.onMouseDown = function (event) {
            if (!isTouchEvent(event)) {
                if (event.button !== 0) {
                    return;
                }
            }
            event.preventDefault();
            _this.bindListeners();
        };
        _this.onMouseUp = function (event) {
            _this.unbindListeners();
            var percentage = _this.calculateRelativePercentage(event);
            _this.props.onRelease(percentage);
        };
        _this.onMouseMove = function (event) {
            event.preventDefault();
            event.stopPropagation();
            _this.throttledUpdatePercentage(event);
        };
        _this.throttledUpdatePercentage = throttle_1.default(function (event) {
            var percentage = _this.calculateRelativePercentage(event);
            if (percentage !== _this.props.splitPercentage) {
                _this.props.onChange(percentage);
            }
        }, RESIZE_THROTTLE_MS);
        return _this;
    }
    Split.prototype.render = function () {
        var direction = this.props.direction;
        return (react_1.default.createElement("div", { className: classnames_1.default('mosaic-split', {
                '-row': direction === 'row',
                '-column': direction === 'column',
            }), ref: this.rootElement, onMouseDown: this.onMouseDown, style: this.computeStyle() },
            react_1.default.createElement("div", { className: "mosaic-split-line" })));
    };
    Split.prototype.componentDidMount = function () {
        this.rootElement.current.addEventListener('touchstart', this.onMouseDown, TOUCH_EVENT_OPTIONS);
    };
    Split.prototype.componentWillUnmount = function () {
        this.unbindListeners();
        if (this.rootElement.current) {
            this.rootElement.current.ownerDocument.removeEventListener('touchstart', this.onMouseDown, TOUCH_EVENT_OPTIONS);
        }
    };
    Split.prototype.bindListeners = function () {
        if (!this.listenersBound) {
            this.rootElement.current.ownerDocument.addEventListener('mousemove', this.onMouseMove, true);
            this.rootElement.current.ownerDocument.addEventListener('touchmove', this.onMouseMove, TOUCH_EVENT_OPTIONS);
            this.rootElement.current.ownerDocument.addEventListener('mouseup', this.onMouseUp, true);
            this.rootElement.current.ownerDocument.addEventListener('touchend', this.onMouseUp, true);
            this.listenersBound = true;
        }
    };
    Split.prototype.unbindListeners = function () {
        if (this.rootElement.current) {
            this.rootElement.current.ownerDocument.removeEventListener('mousemove', this.onMouseMove, true);
            this.rootElement.current.ownerDocument.removeEventListener('touchmove', this.onMouseMove, TOUCH_EVENT_OPTIONS);
            this.rootElement.current.ownerDocument.removeEventListener('mouseup', this.onMouseUp, true);
            this.rootElement.current.ownerDocument.removeEventListener('touchend', this.onMouseUp, true);
            this.listenersBound = false;
        }
    };
    Split.prototype.computeStyle = function () {
        var _a;
        var _b = this.props, boundingBox = _b.boundingBox, direction = _b.direction, splitPercentage = _b.splitPercentage;
        var positionStyle = direction === 'column' ? 'top' : 'left';
        var absolutePercentage = BoundingBox_1.BoundingBox.getAbsoluteSplitPercentage(boundingBox, splitPercentage, direction);
        return __assign({}, BoundingBox_1.BoundingBox.asStyles(boundingBox), (_a = {}, _a[positionStyle] = absolutePercentage + "%", _a));
    };
    Split.prototype.calculateRelativePercentage = function (event) {
        var _a = this.props, minimumPaneSizePercentage = _a.minimumPaneSizePercentage, direction = _a.direction, boundingBox = _a.boundingBox;
        var parentBBox = this.rootElement.current.parentElement.getBoundingClientRect();
        var location = isTouchEvent(event) ? event.changedTouches[0] : event;
        var absolutePercentage;
        if (direction === 'column') {
            absolutePercentage = ((location.clientY - parentBBox.top) / parentBBox.height) * 100.0;
        }
        else {
            absolutePercentage = ((location.clientX - parentBBox.left) / parentBBox.width) * 100.0;
        }
        var relativePercentage = BoundingBox_1.BoundingBox.getRelativeSplitPercentage(boundingBox, absolutePercentage, direction);
        return clamp_1.default(relativePercentage, minimumPaneSizePercentage, 100 - minimumPaneSizePercentage);
    };
    Split.defaultProps = {
        onChange: function () { return void 0; },
        onRelease: function () { return void 0; },
        minimumPaneSizePercentage: 20,
    };
    return Split;
}(react_1.default.PureComponent));
exports.Split = Split;
function isTouchEvent(event) {
    return event.changedTouches != null;
}
//# sourceMappingURL=Split.js.map