import React from 'react';
import { ConnectDragPreview, ConnectDragSource, ConnectDropTarget } from 'react-dnd';
import { MosaicContext } from './contextTypes';
import { CreateNode, MosaicBranch, MosaicKey } from './types';
export interface MosaicWindowProps<T extends MosaicKey> {
    title: string;
    path: MosaicBranch[];
    className?: string;
    toolbarControls?: React.ReactNode;
    additionalControls?: React.ReactNode;
    additionalControlButtonText?: string;
    draggable?: boolean;
    createNode?: CreateNode<T>;
    renderPreview?: (props: MosaicWindowProps<T>) => JSX.Element;
    renderToolbar?: ((props: MosaicWindowProps<T>, draggable: boolean | undefined) => JSX.Element) | null;
    onDragStart?: () => void;
    onDragEnd?: (type: 'drop' | 'reset') => void;
}
export interface InternalDragSourceProps {
    connectDragSource: ConnectDragSource;
    connectDragPreview: ConnectDragPreview;
}
export interface InternalDropTargetProps {
    connectDropTarget: ConnectDropTarget;
    isOver: boolean;
    draggedMosaicId: string | undefined;
}
export declare type InternalMosaicWindowProps<T extends MosaicKey> = MosaicWindowProps<T> & InternalDropTargetProps & InternalDragSourceProps;
export interface InternalMosaicWindowState {
    additionalControlsOpen: boolean;
}
export declare class InternalMosaicWindow<T extends MosaicKey> extends React.Component<InternalMosaicWindowProps<T>, InternalMosaicWindowState> {
    static defaultProps: Partial<InternalMosaicWindowProps<any>>;
    static contextType: React.Context<MosaicContext<string | number>>;
    context: MosaicContext<T>;
    state: InternalMosaicWindowState;
    private rootElement;
    render(): JSX.Element;
    private getToolbarControls;
    private renderToolbar;
    private renderDropTarget;
    private checkCreateNode;
    private split;
    private swap;
    private setAdditionalControlsOpen;
    private getPath;
    private connectDragSource;
    private readonly childContext;
}
export declare const SourceConnectedInternalMosaicWindow: import("react-dnd").DndComponentClass<typeof InternalMosaicWindow, Pick<InternalMosaicWindowProps<any> | InternalMosaicWindowProps<string | number>, "title" | "path" | "className" | "draggable" | "onDragEnd" | "onDragStart" | "createNode" | "connectDropTarget" | "isOver" | "draggedMosaicId" | "toolbarControls" | "additionalControls" | "additionalControlButtonText" | "renderPreview" | "renderToolbar">>;
export declare const SourceDropConnectedInternalMosaicWindow: import("react-dnd").DndComponentClass<any, Pick<unknown, never>>;
export declare class MosaicWindow<T extends MosaicKey = string> extends React.PureComponent<MosaicWindowProps<T>> {
    render(): JSX.Element;
}
