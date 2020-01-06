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
var defer_1 = __importDefault(require("lodash/defer"));
var dropRight_1 = __importDefault(require("lodash/dropRight"));
var isEmpty_1 = __importDefault(require("lodash/isEmpty"));
var isEqual_1 = __importDefault(require("lodash/isEqual"));
var values_1 = __importDefault(require("lodash/values"));
var react_1 = __importDefault(require("react"));
var react_dnd_1 = require("react-dnd");
var defaultToolbarControls_1 = require("./buttons/defaultToolbarControls");
var Separator_1 = require("./buttons/Separator");
var contextTypes_1 = require("./contextTypes");
var internalTypes_1 = require("./internalTypes");
var MosaicDropTarget_1 = require("./MosaicDropTarget");
var types_1 = require("./types");
var mosaicUpdates_1 = require("./util/mosaicUpdates");
var mosaicUtilities_1 = require("./util/mosaicUtilities");
var OptionalBlueprint_1 = require("./util/OptionalBlueprint");
var InternalMosaicWindow = /** @class */ (function (_super) {
    __extends(InternalMosaicWindow, _super);
    function InternalMosaicWindow() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            additionalControlsOpen: false,
        };
        _this.rootElement = null;
        _this.renderDropTarget = function (position) {
            var path = _this.props.path;
            return react_1.default.createElement(MosaicDropTarget_1.MosaicDropTarget, { position: position, path: path, key: position });
        };
        _this.split = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _this.checkCreateNode();
            var _a = _this.props, createNode = _a.createNode, path = _a.path;
            var mosaicActions = _this.context.mosaicActions;
            var root = mosaicActions.getRoot();
            var direction = _this.rootElement.offsetWidth > _this.rootElement.offsetHeight ? 'row' : 'column';
            return Promise.resolve(createNode.apply(void 0, args)).then(function (second) {
                return mosaicActions.replaceWith(path, {
                    direction: direction,
                    second: second,
                    first: mosaicUtilities_1.getAndAssertNodeAtPathExists(root, path),
                });
            });
        };
        _this.swap = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _this.checkCreateNode();
            var mosaicActions = _this.context.mosaicActions;
            var _a = _this.props, createNode = _a.createNode, path = _a.path;
            return Promise.resolve(createNode.apply(void 0, args)).then(function (node) { return mosaicActions.replaceWith(path, node); });
        };
        _this.setAdditionalControlsOpen = function (additionalControlsOpen) {
            _this.setState({ additionalControlsOpen: additionalControlsOpen });
        };
        _this.getPath = function () { return _this.props.path; };
        _this.connectDragSource = function (connectedElements) {
            var connectDragSource = _this.props.connectDragSource;
            return connectDragSource(connectedElements);
        };
        _this.childContext = {
            mosaicWindowActions: {
                split: _this.split,
                replaceWithNew: _this.swap,
                setAdditionalControlsOpen: _this.setAdditionalControlsOpen,
                getPath: _this.getPath,
                connectDragSource: _this.connectDragSource,
            },
        };
        return _this;
    }
    InternalMosaicWindow.prototype.render = function () {
        var _this = this;
        var _a = this.props, className = _a.className, isOver = _a.isOver, renderPreview = _a.renderPreview, additionalControls = _a.additionalControls, connectDropTarget = _a.connectDropTarget, connectDragPreview = _a.connectDragPreview, draggedMosaicId = _a.draggedMosaicId;
        return (react_1.default.createElement(contextTypes_1.MosaicWindowContext.Provider, { value: this.childContext }, connectDropTarget(react_1.default.createElement("div", { className: classnames_1.default('mosaic-window mosaic-drop-target', className, {
                'drop-target-hover': isOver && draggedMosaicId === this.context.mosaicId,
                'additional-controls-open': this.state.additionalControlsOpen,
            }), ref: function (element) { return (_this.rootElement = element); } },
            this.renderToolbar(),
            react_1.default.createElement("div", { className: "mosaic-window-body" }, this.props.children),
            react_1.default.createElement("div", { className: "mosaic-window-body-overlay", onClick: function () { return _this.setAdditionalControlsOpen(false); } }),
            react_1.default.createElement("div", { className: "mosaic-window-additional-actions-bar" }, additionalControls),
            connectDragPreview(renderPreview(this.props)),
            react_1.default.createElement("div", { className: "drop-target-container" }, values_1.default(internalTypes_1.MosaicDropTargetPosition).map(this.renderDropTarget))))));
    };
    InternalMosaicWindow.prototype.getToolbarControls = function () {
        var _a = this.props, toolbarControls = _a.toolbarControls, createNode = _a.createNode;
        if (toolbarControls) {
            return toolbarControls;
        }
        else if (createNode) {
            return defaultToolbarControls_1.DEFAULT_CONTROLS_WITH_CREATION;
        }
        else {
            return defaultToolbarControls_1.DEFAULT_CONTROLS_WITHOUT_CREATION;
        }
    };
    InternalMosaicWindow.prototype.renderToolbar = function () {
        var _a;
        var _this = this;
        var _b = this.props, title = _b.title, draggable = _b.draggable, additionalControls = _b.additionalControls, additionalControlButtonText = _b.additionalControlButtonText, path = _b.path, renderToolbar = _b.renderToolbar;
        var additionalControlsOpen = this.state.additionalControlsOpen;
        var toolbarControls = this.getToolbarControls();
        var draggableAndNotRoot = draggable && path.length > 0;
        var connectIfDraggable = draggableAndNotRoot ? this.props.connectDragSource : function (el) { return el; };
        if (renderToolbar) {
            var connectedToolbar = connectIfDraggable(renderToolbar(this.props, draggable));
            return (react_1.default.createElement("div", { className: classnames_1.default('mosaic-window-toolbar', { draggable: draggableAndNotRoot }) }, connectedToolbar));
        }
        var titleDiv = connectIfDraggable(react_1.default.createElement("div", { title: title, className: "mosaic-window-title" }, title));
        var hasAdditionalControls = !isEmpty_1.default(additionalControls);
        return (react_1.default.createElement("div", { className: classnames_1.default('mosaic-window-toolbar', { draggable: draggableAndNotRoot }) },
            titleDiv,
            react_1.default.createElement("div", { className: classnames_1.default('mosaic-window-controls', OptionalBlueprint_1.OptionalBlueprint.getClasses('BUTTON_GROUP')) },
                hasAdditionalControls && (react_1.default.createElement("button", { onClick: function () { return _this.setAdditionalControlsOpen(!additionalControlsOpen); }, className: classnames_1.default(OptionalBlueprint_1.OptionalBlueprint.getClasses('BUTTON', 'MINIMAL'), OptionalBlueprint_1.OptionalBlueprint.getIconClass('MORE'), (_a = {},
                        _a[OptionalBlueprint_1.OptionalBlueprint.getClasses('ACTIVE')] = additionalControlsOpen,
                        _a)) },
                    react_1.default.createElement("span", { className: "control-text" }, additionalControlButtonText))),
                hasAdditionalControls && react_1.default.createElement(Separator_1.Separator, null),
                toolbarControls)));
    };
    InternalMosaicWindow.prototype.checkCreateNode = function () {
        if (this.props.createNode == null) {
            throw new Error('Operation invalid unless `createNode` is defined');
        }
    };
    InternalMosaicWindow.defaultProps = {
        additionalControlButtonText: 'More',
        draggable: true,
        renderPreview: function (_a) {
            var title = _a.title;
            return (react_1.default.createElement("div", { className: "mosaic-preview" },
                react_1.default.createElement("div", { className: "mosaic-window-toolbar" },
                    react_1.default.createElement("div", { className: "mosaic-window-title" }, title)),
                react_1.default.createElement("div", { className: "mosaic-window-body" },
                    react_1.default.createElement("h4", null, title),
                    react_1.default.createElement(OptionalBlueprint_1.OptionalBlueprint.Icon, { iconSize: 72, icon: "application" }))));
        },
        renderToolbar: null,
    };
    InternalMosaicWindow.contextType = contextTypes_1.MosaicContext;
    return InternalMosaicWindow;
}(react_1.default.Component));
exports.InternalMosaicWindow = InternalMosaicWindow;
var dragSource = {
    beginDrag: function (props, _monitor, component) {
        if (props.onDragStart) {
            props.onDragStart();
        }
        // TODO: Actually just delete instead of hiding
        // The defer is necessary as the element must be present on start for HTML DnD to not cry
        var hideTimer = defer_1.default(function () { return component.context.mosaicActions.hide(component.props.path); });
        return {
            mosaicId: component.context.mosaicId,
            hideTimer: hideTimer,
        };
    },
    endDrag: function (props, monitor, component) {
        var hideTimer = monitor.getItem().hideTimer;
        // If the hide call hasn't happened yet, cancel it
        window.clearTimeout(hideTimer);
        var ownPath = component.props.path;
        var dropResult = (monitor.getDropResult() || {});
        var mosaicActions = component.context.mosaicActions;
        var position = dropResult.position, destinationPath = dropResult.path;
        if (position != null && destinationPath != null && !isEqual_1.default(destinationPath, ownPath)) {
            mosaicActions.updateTree(mosaicUpdates_1.createDragToUpdates(mosaicActions.getRoot(), ownPath, destinationPath, position));
            if (props.onDragEnd) {
                props.onDragEnd('drop');
            }
        }
        else {
            // TODO: restore node from captured state
            mosaicActions.updateTree([
                {
                    path: dropRight_1.default(ownPath),
                    spec: {
                        splitPercentage: {
                            $set: null,
                        },
                    },
                },
            ]);
            if (props.onDragEnd) {
                props.onDragEnd('reset');
            }
        }
    },
};
var dropTarget = {};
// Each step exported here just to keep react-hot-loader happy
exports.SourceConnectedInternalMosaicWindow = react_dnd_1.DragSource(types_1.MosaicDragType.WINDOW, dragSource, function (connect, _monitor) { return ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
}); })(InternalMosaicWindow);
exports.SourceDropConnectedInternalMosaicWindow = react_dnd_1.DropTarget(types_1.MosaicDragType.WINDOW, dropTarget, function (connect, monitor) { return ({
    connectDropTarget: connect.dropTarget(),
    isOver: monitor.isOver(),
    draggedMosaicId: (monitor.getItem() || {}).mosaicId,
}); })(exports.SourceConnectedInternalMosaicWindow);
var MosaicWindow = /** @class */ (function (_super) {
    __extends(MosaicWindow, _super);
    function MosaicWindow() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MosaicWindow.prototype.render = function () {
        return react_1.default.createElement(exports.SourceDropConnectedInternalMosaicWindow, __assign({}, this.props));
    };
    return MosaicWindow;
}(react_1.default.PureComponent));
exports.MosaicWindow = MosaicWindow;
//# sourceMappingURL=MosaicWindow.js.map