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
var noop_1 = __importDefault(require("lodash/noop"));
var react_1 = __importDefault(require("react"));
var contextTypes_1 = require("./contextTypes");
var OptionalBlueprint_1 = require("./util/OptionalBlueprint");
var MosaicZeroState = /** @class */ (function (_super) {
    __extends(MosaicZeroState, _super);
    function MosaicZeroState() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.replace = function () {
            return Promise.resolve(_this.props.createNode())
                .then(function (node) { return _this.context.mosaicActions.replaceWith([], node); })
                .catch(noop_1.default);
        }; // Swallow rejections (i.e. on user cancel)
        return _this;
    }
    MosaicZeroState.prototype.render = function () {
        return (react_1.default.createElement("div", { className: classnames_1.default('mosaic-zero-state', OptionalBlueprint_1.OptionalBlueprint.getClasses('NON_IDEAL_STATE')) },
            react_1.default.createElement("div", { className: OptionalBlueprint_1.OptionalBlueprint.getClasses('NON_IDEAL_STATE_VISUAL') },
                react_1.default.createElement(OptionalBlueprint_1.OptionalBlueprint.Icon, { iconSize: 120, icon: "applications" })),
            react_1.default.createElement("h4", { className: OptionalBlueprint_1.OptionalBlueprint.getClasses('HEADING') }, "No Windows Present"),
            react_1.default.createElement("div", null, this.props.createNode && (react_1.default.createElement("button", { className: classnames_1.default(OptionalBlueprint_1.OptionalBlueprint.getClasses('BUTTON'), OptionalBlueprint_1.OptionalBlueprint.getIconClass('ADD')), onClick: this.replace }, "Add New Window")))));
    };
    MosaicZeroState.contextType = contextTypes_1.MosaicContext;
    return MosaicZeroState;
}(react_1.default.PureComponent));
exports.MosaicZeroState = MosaicZeroState;
//# sourceMappingURL=MosaicZeroState.js.map