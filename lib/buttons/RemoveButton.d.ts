import React from 'react';
import { MosaicWindowContext } from '../contextTypes';
import { MosaicButtonProps } from './MosaicButton';
export declare class RemoveButton extends React.PureComponent<MosaicButtonProps> {
    static contextType: React.Context<MosaicWindowContext>;
    context: MosaicWindowContext;
    render(): JSX.Element;
    private createRemove;
}
