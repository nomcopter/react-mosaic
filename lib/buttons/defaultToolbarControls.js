"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = __importDefault(require("react"));
var ExpandButton_1 = require("./ExpandButton");
var RemoveButton_1 = require("./RemoveButton");
var ReplaceButton_1 = require("./ReplaceButton");
var SplitButton_1 = require("./SplitButton");
exports.DEFAULT_CONTROLS_WITH_CREATION = react_1.default.Children.toArray([
    react_1.default.createElement(ReplaceButton_1.ReplaceButton, null),
    react_1.default.createElement(SplitButton_1.SplitButton, null),
    react_1.default.createElement(ExpandButton_1.ExpandButton, null),
    react_1.default.createElement(RemoveButton_1.RemoveButton, null),
]);
exports.DEFAULT_CONTROLS_WITHOUT_CREATION = react_1.default.Children.toArray([react_1.default.createElement(ExpandButton_1.ExpandButton, null), react_1.default.createElement(RemoveButton_1.RemoveButton, null)]);
//# sourceMappingURL=defaultToolbarControls.js.map