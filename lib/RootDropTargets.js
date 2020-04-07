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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var classnames_1 = __importDefault(require("classnames"));
var values_1 = __importDefault(require("lodash/values"));
var react_1 = __importDefault(require("react"));
var react_dnd_1 = require("react-dnd");
var internalTypes_1 = require("./internalTypes");
var MosaicDropTarget_1 = require("./MosaicDropTarget");
var types_1 = require("./types");
var RootDropTargetsClass = /** @class */ (function (_super) {
    __extends(RootDropTargetsClass, _super);
    function RootDropTargetsClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RootDropTargetsClass.prototype.render = function () {
        return (react_1.default.createElement("div", { className: classnames_1.default('drop-target-container', {
                '-dragging': this.props.isDragging,
            }) }, values_1.default(internalTypes_1.MosaicDropTargetPosition).map(function (position) { return (react_1.default.createElement(MosaicDropTarget_1.MosaicDropTarget, { position: position, path: [], key: position })); })));
    };
    return RootDropTargetsClass;
}(react_1.default.PureComponent));
var dropTarget = {};
exports.RootDropTargets = react_dnd_1.DropTarget(types_1.MosaicDragType.WINDOW, dropTarget, function (_connect, monitor) { return ({
    isDragging: monitor.getItem() !== null && monitor.getItemType() === types_1.MosaicDragType.WINDOW,
}); })(RootDropTargetsClass);
//# sourceMappingURL=RootDropTargets.js.map