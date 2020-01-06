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
var react_1 = __importDefault(require("react"));
var react_dnd_1 = require("react-dnd");
var contextTypes_1 = require("./contextTypes");
var types_1 = require("./types");
var dropTarget = {
    drop: function (props, monitor, component) {
        if (component.context.mosaicId === (monitor.getItem() || {}).mosaicId) {
            return {
                path: props.path,
                position: props.position,
            };
        }
        else {
            return {};
        }
    },
};
var MosaicDropTargetClass = /** @class */ (function (_super) {
    __extends(MosaicDropTargetClass, _super);
    function MosaicDropTargetClass() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MosaicDropTargetClass.prototype.render = function () {
        var _a = this.props, position = _a.position, isOver = _a.isOver, connectDropTarget = _a.connectDropTarget, draggedMosaicId = _a.draggedMosaicId;
        return connectDropTarget(react_1.default.createElement("div", { className: classnames_1.default('drop-target', position, {
                'drop-target-hover': isOver && draggedMosaicId === this.context.mosaicId,
            }) }));
    };
    MosaicDropTargetClass.contextType = contextTypes_1.MosaicContext;
    return MosaicDropTargetClass;
}(react_1.default.PureComponent));
exports.MosaicDropTarget = react_dnd_1.DropTarget(types_1.MosaicDragType.WINDOW, dropTarget, function (connect, monitor) { return ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    draggedMosaicId: (monitor.getItem() || {}).mosaicId,
}); })(MosaicDropTargetClass);
//# sourceMappingURL=MosaicDropTarget.js.map