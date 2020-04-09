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
var contextTypes_1 = require("../contextTypes");
var OptionalBlueprint_1 = require("../util/OptionalBlueprint");
var MosaicButton_1 = require("./MosaicButton");
var ReplaceButton = /** @class */ (function (_super) {
    __extends(ReplaceButton, _super);
    function ReplaceButton() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.replace = function () {
            _this.context.mosaicWindowActions
                .replaceWithNew()
                .then(function () {
                if (_this.props.onClick) {
                    _this.props.onClick();
                }
            })
                .catch(noop_1.default); // Swallow rejections (i.e. on user cancel)
        };
        return _this;
    }
    ReplaceButton.prototype.render = function () {
        return MosaicButton_1.createDefaultToolbarButton('Replace Window', classnames_1.default('replace-button', OptionalBlueprint_1.OptionalBlueprint.getIconClass('EXCHANGE')), this.replace);
    };
    ReplaceButton.contextType = contextTypes_1.MosaicWindowContext;
    return ReplaceButton;
}(react_1.default.PureComponent));
exports.ReplaceButton = ReplaceButton;
//# sourceMappingURL=ReplaceButton.js.map