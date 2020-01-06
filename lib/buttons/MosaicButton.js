"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var classnames_1 = __importDefault(require("classnames"));
var react_1 = __importDefault(require("react"));
var OptionalBlueprint_1 = require("../util/OptionalBlueprint");
function createDefaultToolbarButton(title, className, onClick, text) {
    return (react_1.default.createElement("button", { title: title, onClick: onClick, className: classnames_1.default('mosaic-default-control', OptionalBlueprint_1.OptionalBlueprint.getClasses('BUTTON', 'MINIMAL'), className) }, text && react_1.default.createElement("span", { className: "control-text" }, text)));
}
exports.createDefaultToolbarButton = createDefaultToolbarButton;
//# sourceMappingURL=MosaicButton.js.map