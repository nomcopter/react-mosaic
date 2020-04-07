import React from 'react';
import { ConnectDragPreview, ConnectDragSource } from 'react-dnd';
import { MosaicContext } from './contextTypes';
import { CreateNode, MosaicBranch, MosaicKey } from './types';
export interface MosaicDumbWindowProps<T extends MosaicKey> {
    title: string;
    path: MosaicBranch[];
    className?: string;
    toolbarControls?: React.ReactNode;
    additionalControls?: React.ReactNode;
    additionalControlButtonText?: string;
    draggable?: boolean;
    createNode?: CreateNode<T>;
    renderPreview?: (props: MosaicDumbWindowProps<T>) => JSX.Element;
    renderToolbar?: ((props: MosaicDumbWindowProps<T>, draggable: boolean | undefined) => JSX.Element) | null;
    onDragStart?: () => void;
    onDragEnd?: (type: 'drop' | 'reset') => void;
}
export interface InternalNestedDragSourceProps {
    connectDragSource: ConnectDragSource;
    connectDragPreview: ConnectDragPreview;
}
export declare type InternalMosaicDumbWindowProps<T extends MosaicKey> = MosaicDumbWindowProps<T> & InternalNestedDragSourceProps;
export interface InternalMosaicDumbWindowState {
    additionalControlsOpen: boolean;
}
export declare class InternalMosaicDumbWindow<T extends MosaicKey> extends React.Component<InternalMosaicDumbWindowProps<T>, InternalMosaicDumbWindowState> {
    static defaultProps: Partial<InternalMosaicDumbWindowProps<any>>;
    static contextType: React.Context<MosaicContext<string | number>>;
    context: MosaicContext<T>;
    state: InternalMosaicDumbWindowState;
    private rootElement;
    render(): JSX.Element;
    private getToolbarControls;
    private renderToolbar;
    private checkCreateNode;
    private split;
    private swap;
    private setAdditionalControlsOpen;
    private getPath;
    private connectDragSource;
    private readonly childContext;
}
export declare const SourceConnectedInternalMosaicDumbWindow: import("react-dnd").DndComponentClass<typeof InternalMosaicDumbWindow, Pick<InternalMosaicDumbWindowProps<any> | InternalMosaicDumbWindowProps<string | number>, "title" | "path" | "className" | "draggable" | "onDragEnd" | "onDragStart" | "createNode" | "toolbarControls" | "additionalControls" | "additionalControlButtonText" | "renderPreview" | "renderToolbar">>;
export declare class MosaicDumbWindow<T extends MosaicKey = string> extends React.PureComponent<MosaicDumbWindowProps<T>> {
    render(): JSX.Element;
}
