"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var React = __importStar(require("react"));
var OptionalBlueprint;
(function (OptionalBlueprint) {
    var _a;
    var Classes;
    var IconNames;
    try {
        // Webpack is quieter about these errors
        // https://github.com/nomcopter/react-mosaic/issues/109
        require.resolve('@blueprintjs/core');
        require.resolve('@blueprintjs/icons');
        (_a = require('@blueprintjs/core'), Classes = _a.Classes, OptionalBlueprint.Icon = _a.Icon);
        (IconNames = require('@blueprintjs/icons').IconNames);
    }
    catch (_b) {
        OptionalBlueprint.Icon = function (_a) {
            var icon = _a.icon;
            return React.createElement("span", null, icon);
        };
    }
    function getClasses() {
        var names = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            names[_i] = arguments[_i];
        }
        if (Classes) {
            return names.map(function (name) { return Classes[name]; }).join(' ');
        }
        return '';
    }
    OptionalBlueprint.getClasses = getClasses;
    function getIconClass(iconName) {
        if (Classes && IconNames) {
            return Classes.iconClass(IconNames[iconName]);
        }
        return '';
    }
    OptionalBlueprint.getIconClass = getIconClass;
})(OptionalBlueprint = exports.OptionalBlueprint || (exports.OptionalBlueprint = {}));
//# sourceMappingURL=OptionalBlueprint.js.map