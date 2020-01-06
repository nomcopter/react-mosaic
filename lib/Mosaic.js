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
// import { BackendFactory } from 'dnd-core';
var countBy_1 = __importDefault(require("lodash/countBy"));
var keys_1 = __importDefault(require("lodash/keys"));
var pickBy_1 = __importDefault(require("lodash/pickBy"));
var react_1 = __importDefault(require("react"));
var react_dnd_1 = require("react-dnd");
var react_dnd_html5_backend_1 = __importDefault(require("react-dnd-html5-backend"));
var react_dnd_multi_backend_1 = __importDefault(require("react-dnd-multi-backend"));
var uuid_1 = require("uuid");
var contextTypes_1 = require("./contextTypes");
var MosaicRoot_1 = require("./MosaicRoot");
var MosaicZeroState_1 = require("./MosaicZeroState");
var RootDropTargets_1 = require("./RootDropTargets");
var mosaicUpdates_1 = require("./util/mosaicUpdates");
var mosaicUtilities_1 = require("./util/mosaicUtilities");
var DEFAULT_EXPAND_PERCENTAGE = 70;
function isUncontrolled(props) {
    return props.initialValue != null;
}
var MosaicWithoutDragDropContext = /** @class */ (function (_super) {
    __extends(MosaicWithoutDragDropContext, _super);
    function MosaicWithoutDragDropContext() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.state = {
            currentNode: null,
            lastInitialValue: null,
            mosaicId: uuid_1.v4(),
        };
        _this.updateRoot = function (updates, suppressOnRelease) {
            if (suppressOnRelease === void 0) { suppressOnRelease = false; }
            var currentNode = _this.getRoot() || {};
            _this.replaceRoot(mosaicUpdates_1.updateTree(currentNode, updates), suppressOnRelease);
        };
        _this.replaceRoot = function (currentNode, suppressOnRelease) {
            if (suppressOnRelease === void 0) { suppressOnRelease = false; }
            _this.props.onChange(currentNode);
            if (!suppressOnRelease && _this.props.onRelease) {
                _this.props.onRelease(currentNode);
            }
            if (isUncontrolled(_this.props)) {
                _this.setState({ currentNode: currentNode });
            }
        };
        _this.actions = {
            updateTree: _this.updateRoot,
            remove: function (path) {
                if (path.length === 0) {
                    _this.replaceRoot(null);
                }
                else {
                    _this.updateRoot([mosaicUpdates_1.createRemoveUpdate(_this.getRoot(), path)]);
                }
            },
            expand: function (path, percentage) {
                if (percentage === void 0) { percentage = DEFAULT_EXPAND_PERCENTAGE; }
                return _this.updateRoot([mosaicUpdates_1.createExpandUpdate(path, percentage)]);
            },
            getRoot: function () { return _this.getRoot(); },
            hide: function (path) { return _this.updateRoot([mosaicUpdates_1.createHideUpdate(path)]); },
            replaceWith: function (path, newNode) {
                return _this.updateRoot([
                    {
                        path: path,
                        spec: {
                            $set: newNode,
                        },
                    },
                ]);
            },
        };
        _this.childContext = {
            mosaicActions: _this.actions,
            mosaicId: _this.state.mosaicId,
        };
        return _this;
    }
    MosaicWithoutDragDropContext.getDerivedStateFromProps = function (nextProps, prevState) {
        if (isUncontrolled(nextProps) && nextProps.initialValue !== prevState.lastInitialValue) {
            return {
                lastInitialValue: nextProps.initialValue,
                currentNode: nextProps.initialValue,
            };
        }
        return null;
    };
    MosaicWithoutDragDropContext.prototype.render = function () {
        var className = this.props.className;
        var HTML5WithTouch = {
            backends: [
                {
                    backend: react_dnd_html5_backend_1.default,
                },
            ],
        };
        return (react_1.default.createElement(react_dnd_1.DndProvider, { backend: react_dnd_multi_backend_1.default, options: HTML5WithTouch },
            react_1.default.createElement(contextTypes_1.MosaicContext.Provider, { value: this.childContext },
                react_1.default.createElement("div", { className: classnames_1.default(className, 'mosaic mosaic-drop-target') },
                    this.renderTree(),
                    react_1.default.createElement(RootDropTargets_1.RootDropTargets, null)))));
    };
    MosaicWithoutDragDropContext.prototype.getRoot = function () {
        if (isUncontrolled(this.props)) {
            return this.state.currentNode;
        }
        else {
            return this.props.value;
        }
    };
    MosaicWithoutDragDropContext.prototype.renderTree = function () {
        var root = this.getRoot();
        this.validateTree(root);
        if (root === null || root === undefined) {
            return this.props.zeroStateView;
        }
        else {
            var _a = this.props, renderTile = _a.renderTile, resize = _a.resize;
            return react_1.default.createElement(MosaicRoot_1.MosaicRoot, { root: root, renderTile: renderTile, resize: resize });
        }
    };
    MosaicWithoutDragDropContext.prototype.validateTree = function (node) {
        if (process.env.NODE_ENV !== 'production') {
            var duplicates = keys_1.default(pickBy_1.default(countBy_1.default(mosaicUtilities_1.getLeaves(node)), function (n) { return n > 1; }));
            if (duplicates.length > 0) {
                throw new Error("Duplicate IDs [" + duplicates.join(', ') + "] detected. Mosaic does not support leaves with the same ID");
            }
        }
    };
    MosaicWithoutDragDropContext.defaultProps = {
        onChange: function () { return void 0; },
        zeroStateView: react_1.default.createElement(MosaicZeroState_1.MosaicZeroState, null),
        className: 'mosaic-blueprint-theme',
    };
    return MosaicWithoutDragDropContext;
}(react_1.default.PureComponent));
exports.MosaicWithoutDragDropContext = MosaicWithoutDragDropContext;
// @(DragDropContext(MultiBackend(HTML5toTouch) as BackendFactory) as ClassDecorator)
var Mosaic = /** @class */ (function (_super) {
    __extends(Mosaic, _super);
    function Mosaic() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return Mosaic;
}(MosaicWithoutDragDropContext));
exports.Mosaic = Mosaic;
//# sourceMappingURL=Mosaic.js.map