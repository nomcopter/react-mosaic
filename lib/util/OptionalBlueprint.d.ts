import { Classes as ClassesImport, IIconProps } from '@blueprintjs/core';
import { IconNames as IconNamesTypeImport } from '@blueprintjs/icons';
import * as React from 'react';
export declare namespace OptionalBlueprint {
    type Classes = typeof ClassesImport;
    let Classes: Classes | undefined;
    let Icon: React.ReactType<IIconProps>;
    type IconNames = typeof IconNamesTypeImport;
    let IconNames: IconNames | undefined;
    type BlueprintClass = {
        [K in keyof Classes]: Classes[K] extends string ? K : never;
    }[keyof Classes];
    function getClasses(...names: BlueprintClass[]): string;
    function getIconClass(iconName: keyof IconNames): string;
}
