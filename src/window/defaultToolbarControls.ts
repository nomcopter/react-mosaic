/**
 * @license
 * Copyright 2016 Palantir Technologies, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as classNames from 'classnames';
import * as _ from 'lodash';
import * as React from 'react';
import { MosaicWindowContext } from '../contextTypes';

const { button, div, span } = React.DOM;

export function createDefaultToolbarButton(title: string,
                                           className: string,
                                           onClick: (event: React.MouseEvent<any>) => any,
                                           text?: string): React.ReactElement<any> {
    return button({
            title,
            onClick,
            className: classNames('mosaic-default-control pt-button pt-minimal', className),
        },
        text! && span({ className: 'control-text' }, text!),
    );
}

export interface MosaicButtonProps {
    onClick?: () => void;
}

export class RemoveButton<T> extends React.PureComponent<MosaicButtonProps> {
    static contextTypes = MosaicWindowContext;
    context: MosaicWindowContext<T>;

    render() {
        return createDefaultToolbarButton('Close Window', 'pt-icon-cross', this.remove);
    }

    private remove = () => {
        this.context.mosaicActions.remove(this.context.getMosaicPath());
        if (this.props.onClick) {
            this.props.onClick();
        }
    }
}
export const RemoveButtonFactory = React.createFactory(RemoveButton);

export class SplitButton<T> extends React.PureComponent<MosaicButtonProps> {
    static contextTypes = MosaicWindowContext;
    context: MosaicWindowContext<T>;

    render() {
        return createDefaultToolbarButton('Split Window', 'pt-icon-add-column-right', this.split);
    }

    private split = () => {
        this.context.mosaicWindowActions.split()
            .then(() => {
                if (this.props.onClick) {
                    this.props.onClick();
                }
            })
            .catch(_.noop); // Swallow rejections (i.e. on user cancel)
    }
}
export const SplitButtonFactory = React.createFactory(SplitButton);

export class ReplaceButton<T> extends React.PureComponent<MosaicButtonProps> {
    static contextTypes = MosaicWindowContext;
    context: MosaicWindowContext<T>;

    render() {
        return createDefaultToolbarButton('Replace Window', 'pt-icon-exchange', this.replace);
    }

    private replace = () => {
        this.context.mosaicWindowActions.replaceWithNew()
            .then(() => {
                if (this.props.onClick) {
                    this.props.onClick();
                }
            })
            .catch(_.noop); // Swallow rejections (i.e. on user cancel)
    }
}
export const ReplaceButtonFactory = React.createFactory(ReplaceButton);

export class ExpandButton<T> extends React.PureComponent<MosaicButtonProps> {
    static contextTypes = MosaicWindowContext;
    context: MosaicWindowContext<T>;

    render() {
        return createDefaultToolbarButton('Expand', 'pt-icon-maximize', this.expand);
    }

    private expand = () => {
        this.context.mosaicActions.expand(this.context.getMosaicPath());

        if (this.props.onClick) {
            this.props.onClick();
        }
    }
}
export const ExpandButtonFactory = React.createFactory(ExpandButton);

export class Separator extends React.PureComponent {
    render() {
        return div({ className: 'separator' });
    }
}
export const SeparatorFactory = React.createFactory(Separator);

export const DEFAULT_CONTROLS_WITH_CREATION = [
    ReplaceButtonFactory({ key: 'REPLACE' }),
    SplitButtonFactory({ key: 'SPLIT' }),
    ExpandButtonFactory({ key: 'EXPAND' }),
    RemoveButtonFactory({ key: 'REMOVE' }),
];
export const DEFAULT_CONTROLS_WITHOUT_CREATION = [
    ExpandButtonFactory({ key: 'EXPAND' }),
    RemoveButtonFactory({ key: 'REMOVE' }),
];
