import React from 'react';
import { EnabledResizeOptions, MosaicDirection } from './types';
import { BoundingBox } from './util/BoundingBox';
export interface SplitProps extends EnabledResizeOptions {
    direction: MosaicDirection;
    boundingBox: BoundingBox;
    splitPercentage: number;
    onChange?: (percentOfParent: number) => void;
    onRelease?: (percentOfParent: number) => void;
}
export declare class Split extends React.PureComponent<SplitProps> {
    private rootElement;
    private listenersBound;
    static defaultProps: {
        onChange: () => undefined;
        onRelease: () => undefined;
        minimumPaneSizePercentage: number;
    };
    render(): JSX.Element;
    componentDidMount(): void;
    componentWillUnmount(): void;
    private bindListeners;
    private unbindListeners;
    private computeStyle;
    private onMouseDown;
    private onMouseUp;
    private onMouseMove;
    private throttledUpdatePercentage;
    private calculateRelativePercentage;
}
