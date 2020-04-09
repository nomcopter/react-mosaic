import React from 'react';
import { MosaicWindowContext } from '../contextTypes';
import { MosaicButtonProps } from './MosaicButton';
export declare class ReplaceButton extends React.PureComponent<MosaicButtonProps> {
    static contextType: React.Context<MosaicWindowContext>;
    context: MosaicWindowContext;
    render(): React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)> | null) | (new (props: any) => React.Component<any, any, any>)>;
    private replace;
}
