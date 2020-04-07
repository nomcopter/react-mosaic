import React from 'react';
import { MosaicWindowContext } from '../contextTypes';
import { MosaicButtonProps } from './MosaicButton';
export declare class ExpandButton extends React.PureComponent<MosaicButtonProps> {
    static contextType: React.Context<MosaicWindowContext>;
    context: MosaicWindowContext;
    render(): JSX.Element;
    private createExpand;
}
