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

import React from 'react';

export class BlueprintCoreMock {
  public static Classes = {
    ACTIVE: '',
    ALIGN_LEFT: '',
    ALIGN_RIGHT: '',
    CONDENSED: '',
    DARK: '',
    DISABLED: '',
    FILL: '',
    FIXED: '',
    FIXED_TOP: '',
    INLINE: '',
    INTERACTIVE: '',
    LARGE: '',
    LOADING: '',
    MINIMAL: '',
    MULTILINE: '',
    ROUND: '',
    SMALL: '',
    VERTICAL: '',

    ELEVATION_0: '',
    ELEVATION_1: '',
    ELEVATION_2: '',
    ELEVATION_3: '',
    ELEVATION_4: '',

    INTENT_PRIMARY: '',
    INTENT_SUCCESS: '',
    INTENT_WARNING: '',
    INTENT_DANGER: '',

    FOCUS_DISABLED: '',

    // text utilities
    UI_TEXT: '',
    RUNNING_TEXT: '',
    MONOSPACE_TEXT: '',
    TEXT_LARGE: '',
    TEXT_SMALL: '',
    TEXT_MUTED: '',
    TEXT_DISABLED: '',
    TEXT_OVERFLOW_ELLIPSIS: '',

    // textual elements
    BLOCKQUOTE: '',
    CODE: '',
    CODE_BLOCK: '',
    HEADING: '',
    LIST: '',
    LIST_UNSTYLED: '',
    RTL: '',

    // components
    ALERT: '',
    ALERT_BODY: '',
    ALERT_CONTENTS: '',
    ALERT_FOOTER: '',

    BREADCRUMB: '',
    BREADCRUMB_CURRENT: '',
    BREADCRUMBS: '',
    BREADCRUMBS_COLLAPSED: '',

    BUTTON: '',
    BUTTON_GROUP: '',
    BUTTON_SPINNER: '',
    BUTTON_TEXT: '',

    CALLOUT: '',
    CALLOUT_ICON: '',

    CARD: '',

    COLLAPSE: '',
    COLLAPSE_BODY: '',

    COLLAPSIBLE_LIST: '',

    CONTEXT_MENU: '',
    CONTEXT_MENU_POPOVER_TARGET: '',

    CONTROL_GROUP: '',

    DIALOG: '',
    DIALOG_CONTAINER: '',
    DIALOG_BODY: '',
    DIALOG_CLOSE_BUTTON: '',
    DIALOG_FOOTER: '',
    DIALOG_FOOTER_ACTIONS: '',
    DIALOG_HEADER: '',

    DIVIDER: '',

    EDITABLE_TEXT: '',
    EDITABLE_TEXT_CONTENT: '',
    EDITABLE_TEXT_EDITING: '',
    EDITABLE_TEXT_INPUT: '',
    EDITABLE_TEXT_PLACEHOLDER: '',

    FLEX_EXPANDER: '',

    HTML_SELECT: '',
    /** @deprecated prefer `<HTMLSelect>` component */
    SELECT: '',

    HTML_TABLE: '',
    HTML_TABLE_STRIPED: '',
    HTML_TABLE_BORDERED: '',

    INPUT: '',
    INPUT_GHOST: '',
    INPUT_GROUP: '',
    INPUT_ACTION: '',

    CONTROL: '',
    CONTROL_INDICATOR: '',
    CHECKBOX: '',
    RADIO: '',
    SWITCH: '',
    FILE_INPUT: '',
    FILE_UPLOAD_INPUT: '',

    KEY: '',
    KEY_COMBO: '',
    MODIFIER_KEY: '',

    HOTKEY: '',
    HOTKEY_LABEL: '',
    HOTKEY_COLUMN: '',
    HOTKEY_DIALOG: '',

    LABEL: '',
    FORM_GROUP: '',
    FORM_CONTENT: '',
    FORM_HELPER_TEXT: '',

    MENU: '',
    MENU_ITEM: '',
    MENU_ITEM_LABEL: '',
    MENU_SUBMENU: '',
    MENU_DIVIDER: '',
    MENU_HEADER: '',

    NAVBAR: '',
    NAVBAR_GROUP: '',
    NAVBAR_HEADING: '',
    NAVBAR_DIVIDER: '',

    NON_IDEAL_STATE: '',
    NON_IDEAL_STATE_VISUAL: '',

    NUMERIC_INPUT: '',

    OVERFLOW_LIST: '',
    OVERFLOW_LIST_SPACER: '',

    OVERLAY: '',
    OVERLAY_BACKDROP: '',
    OVERLAY_CONTENT: '',
    OVERLAY_INLINE: '',
    OVERLAY_OPEN: '',
    OVERLAY_SCROLL_CONTAINER: '',

    PANEL_STACK: '',
    PANEL_STACK_HEADER: '',
    PANEL_STACK_HEADER_BACK: '',
    PANEL_STACK_VIEW: '',

    POPOVER: '',
    POPOVER_ARROW: '',
    POPOVER_BACKDROP: '',
    POPOVER_CONTENT: '',
    POPOVER_CONTENT_SIZING: '',
    POPOVER_DISMISS: '',
    POPOVER_DISMISS_OVERRIDE: '',
    POPOVER_OPEN: '',
    POPOVER_TARGET: '',
    POPOVER_WRAPPER: '',
    TRANSITION_CONTAINER: '',

    PROGRESS_BAR: '',
    PROGRESS_METER: '',
    PROGRESS_NO_STRIPES: '',
    PROGRESS_NO_ANIMATION: '',

    PORTAL: '',

    SKELETON: '',

    SLIDER: '',
    SLIDER_AXIS: '',
    SLIDER_HANDLE: '',
    SLIDER_LABEL: '',
    SLIDER_TRACK: '',
    SLIDER_PROGRESS: '',
    START: '',
    END: '',

    SPINNER: '',
    SPINNER_ANIMATION: '',
    SPINNER_HEAD: '',
    SPINNER_NO_SPIN: '',
    SPINNER_TRACK: '',

    TAB: '',
    TAB_INDICATOR: '',
    TAB_INDICATOR_WRAPPER: '',
    TAB_LIST: '',
    TAB_PANEL: '',
    TABS: '',

    TAG: '',
    TAG_REMOVE: '',

    TAG_INPUT: '',
    TAG_INPUT_ICON: '',
    TAG_INPUT_VALUES: '',

    TOAST: '',
    TOAST_CONTAINER: '',
    TOAST_MESSAGE: '',

    TOOLTIP: '',
    TOOLTIP_INDICATOR: '',

    TREE: '',
    TREE_NODE: '',
    TREE_NODE_CARET: '',
    TREE_NODE_CARET_CLOSED: '',
    TREE_NODE_CARET_NONE: '',
    TREE_NODE_CARET_OPEN: '',
    TREE_NODE_CONTENT: '',
    TREE_NODE_EXPANDED: '',
    TREE_NODE_ICON: '',
    TREE_NODE_LABEL: '',
    TREE_NODE_LIST: '',
    TREE_NODE_SECONDARY_LABEL: '',
    TREE_NODE_SELECTED: '',
    TREE_ROOT: '',

    ICON: '',
    ICON_STANDARD: '',
    ICON_LARGE: '',

    getClassNamespace(): string {
      return '';
    },

    alignmentClass(_alignment: 'center' | 'left' | 'right'): string {
      return '';
    },

    elevationClass(_elevation: 0 | 1 | 2 | 3 | 4): string {
      return '';
    },

    iconClass(_iconName?: string): string {
      return '';
    },

    intentClass(_intent?: 'none' | 'primary' | 'warning' | 'success' | 'danger'): string {
      return '';
    },
  };

  public static IconNames = {
    ADD: '',
  };

  public static Icon = class extends React.PureComponent<IconProps & React.DOMAttributes<HTMLElement>> {
    public render(): React.ReactNode {
      return <span />;
    }
  };
}

const Intent = {
  NONE: 'none' as 'none',
  PRIMARY: 'primary' as 'primary',
  SUCCESS: 'success' as 'success',
  WARNING: 'warning' as 'warning',
  DANGER: 'danger' as 'danger',
};

type Intent = typeof Intent[keyof typeof Intent];

// tslint:disable-next-line:interface-name
interface IProps {
  className?: string;
}

// tslint:disable-next-line:interface-name
interface IIntentProps {
  intent?: Intent;
}

interface IconProps extends IIntentProps, IProps {
  children?: never;
  color?: string;
  icon: string | JSX.Element | false | null | undefined;
  iconSize?: number;
  style?: React.CSSProperties;
  tagName?: keyof JSX.IntrinsicElements;
  title?: string | false | null;
}
