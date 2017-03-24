# react-mosaic
[![CircleCI](https://circleci.com/gh/palantir/react-mosaic.svg?style=svg&circle-token=86249c5568e6487ca0a01409b9a27e9839664a80)](https://circleci.com/gh/palantir/react-mosaic)
[![npm](NPM_LINKfreact-mosaic.svg)](NPM_LINK/react-mosaic)

react-mosaic is a full-featured React Tiling Window Manager meant to give a user complete control over their workspace.
It provides a simple and flexible API to tile arbitrarily complex react components across a user's view.

The best way to see it is a simple [**Demo**](DEMO_URL).

**Note:** react-mosaic is still in alpha and its API is unstable.

#### Screencast
[![screencast demo](./screencast.gif)](./screencast.gif)

## Usage
The core of react-mosaic's operations revolve around the simple binary tree [specified by `MosaicNode<T>`](./src/types.ts#L22).
`T` is the type of the leaves of the tree and can be anything that can be resolved to a `React.ReactElement` for display.

### Installation
1. `yarn add react-mosaic-component`
1. Make sure `lib/react-mosaic.css` is included on your page.
1. Import the `Mosaic` component and use it in your app.

### Blueprint Theme
Without a theme, Mosaic only loads the styles necessary for it to function - 
making it easier for the consumer to style it to match their own app.

By default, Mosaic renders with the `mosaic-blueprint-theme` class. 
This uses the excellent [Blueprint](http://blueprintjs.com/) React UI Toolkit to provide a good starting state.
It is recommended to at least start developing with this theme. 
To use it install Blueprint `npm install --save @blueprintjs/core` and add its CSS to your page.

See [BlueprintTheme.less](./src/BlueprintTheme.less) for an example of creating a theme.

### Examples

#### Simple tiling of `ReactElement`s
```tsx
export const app = (
  <Mosaic
    elementRetriever={ e => e }
    initialValue={{
      direction: 'row',
      first: <div>Left Window</div>,
      second: {
          direction: 'column',
          first: <div>Top Right Window</div>,
          second: <div>Bottom Right Window</div>
      }
    }}
  />
);
```
`elementRetriever` is a stateless lookup function to convert `T` into a displayable `ReactElement`.
Here `T` is already a `ReactElement`, so `elementRetriever` can simply be the identity function.
This example renders a simple tiled interface with one element on the left half, and two stacked elements on the right half. 
The user can resize these panes but there is no other advanced functionality.

#### Tiling with IDs
```tsx
export type ViewId = string;
const ELEMENT_MAP: { [viewId: string]: React.ReactElement<any> } = {
  a: <div>Left Window</div>,
  b: <div>Top Right Window</div>,
  c: <div>Bottom Right Window</div>
};

export const app = (
  <Mosaic
    elementRetriever={ id => ELEMENT_MAP[id] }
    initialValue={{
      direction: 'row',
      first: 'a',
      second: {
          direction: 'column',
          first: 'b',
          second: 'c'
      }
    }}
  />
);
```
Here `T` is a `ViewId` that can be used to look elements up in `ELEMENT_MAP`. 
This allows for easier view state specification and serialization.
The resulting view looks and functions identically to the previous example.

#### Drag, Drop,  and other advanced functionality with `MosaicWindow`
`MosaicWindow` is a component that renders a toolbar and controls around its children for a tile as well as providing full featured drag and drop functionality.

```typescript
export type ViewId = string;
const TITLE_MAP: { [viewId: string]: string } = {
  a: 'Left Window',
  b: 'Top Right Window',
  c: 'Bottom Right Window',
  new: 'New Window'
};

export const app = (
  <Mosaic
    elementRetriever={ id => (
      <MosaicWindow
        createNode={ () => 'new' }
        title={ TITLE_MAP[id] }
      >
        <div>title</div>
      </MosaicWindow>
    )},
    initialValue={{
      direction: 'row',
      first: 'a',
      second: {
          direction: 'column',
          first: 'b',
          second: 'c'
      }
    }}
  />
);
```
This will render a view that looks very similar to the previous examples, but now each of the windows will have a toolbar with buttons.
These toolbars can be dragged around by a user to rearrange their workspace.
`MosaicWindow` API docs [here](#MosaicWindow).

#### Controlled vs. Uncontrolled
Mosaic views have two modes, similar to `React.DOM` input elements:
* Controlled, where the consumer manages Mosaic's state through callbacks.
Using this API, the consumer can perform any operation upon the tree to change the the view as desired.
* Uncontrolled, where Mosaic manages all of its state internally.

See [Controlled Components](https://facebook.github.io/react/docs/forms.html#controlled-components).

All of the previous examples show use of Mosaic in an Uncontrolled fashion.
See [ExampleApp](./dev/ExampleApp.ts) (the application used in the [Demo](http://il-pg-alpha-466977.usw1.palantir.global:8000/))
for a more interesting example that shows the usage of Mosaic as a controlled component and modifications of the tree structure.

#### TS/JS vs. TSX/JSX
Components export both factories and component classes.
If you are using TS/JS then use the factories; if you are using TSX/JSX then use the exported class but know that you will lose the generics if you aren't careful.
The exported classes are named as the base name of the component (e.g. `MosaicWindow`) while the exported factories
have 'Factory' appended (e.g. `MosaicWindowFactory`).

## API

#### Mosaic Props
```typescript
export interface MosaicBaseProps<T> {
    /**
     * Lookup function to convert `T` to a displayable `ReactElement`
     */
    elementRetriever: ElementRetriever<T>;
    /**
     * Called when a user initiates any change to the tree (removing, adding, moving, resizing, etc.)
     */
    onChange?: (newNode: MosaicNode<T> | null) => void;
    /**
     * Additional classes to affix to the root element
     * Default: 'mosaic-blueprint-theme'
     */
    className?: string;
    /**
     * Whether the panes should be resizeable
     * default: true
     */
    resizeable?: boolean;
    /**
     * View to display when the current value is `null`
     * default: Simple NonIdealState view
     */
    zeroStateView?: React.ReactElement<any>;
}

export interface MosaicControlledProps<T> extends MosaicBaseProps<T> {
    /**
     * The tree to render
     */
    value: MosaicNode<T> | null;
    onChange: (newNode: MosaicNode<T> | null) => void;
}

export interface MosaicUncontrolledProps<T> extends MosaicBaseProps<T> {
    /**
     * The initial tree to render, can be modified by the user
     */
    initialValue: MosaicNode<T> | null;
}

export type MosaicProps<T> = MosaicControlledProps<T> | MosaicUncontrolledProps<T>;
```

#### `MosaicWindow`

```typescript
export interface MosaicWindowProps<T> {
    title: string;
    className?: string;
    /**
    * Controls in the top right of the toolbar
    * default: [Replace, Split, Expand, Remove] if createNode is defined and [Expand, Remove] otherwise
    */
    toolbarControls?: React.ReactElement<any>[];
    /**
    * Additional controls that will be hidden in a drawer beneath the toolbar.
    * default: []
    */
    additionalControls?: React.ReactElement<any>[];
    /**
    * Label for the button that expands the drawer
    */
    additionalControlButtonText?: string;
    draggable?: boolean;
    /**
    * Method called when a new node is required (such as the Split or Replace buttons)
    */
    createNode?: CreateNode<T>;
}
```
The default controls rendered by `MosaicWindow` can be accessed from [`defaultToolbarControls`](./src/window/defaultToolbarControls.ts)

### Advanced API
The above API is good for most consumers, however Mosaic provides functionality on the [Context](https://facebook.github.io/react/docs/context.html) of its children that make it easier to alter the view state.
All leaves rendered by Mosaic will have the following available on React context.
These are used extensively by `MosaicWindow`.

```typescript
export type MosaicBranch = 'first' | 'second';
export type MosaicPath = MosaicBranch[];

export interface MosaicTileContext<T> {
    /**
     * These actions are used to alter the state of the view tree
     */
    mosaicActions: MosaicRootActions<T>;
    /**
     * Returns the path to this tile
     */
    getMosaicPath: () => MosaicPath;
}

export interface MosaicRootActions<T> {
    /**
     * Increases the size of this node and bubbles up the tree
     * @param path Path to node to expand
     * @param percentage Every node in the path up to root will be expanded to this percentage
     */
    expand: (path: MosaicPath, percentage?: number) => void;
    /**
     * Remove the node at `path`
     * @param path
     */
    remove: (path: MosaicPath) => void;
    /**
     * Hide the node at `path` but keep it in the DOM. Used in Drag and Drop
     * @param path
     */
    hide: (path: MosaicPath) => void;
    /**
     * Replace currentNode at `path` with `node`
     * @param path
     * @param node
     */
    replaceWith: (path: MosaicPath, node: MosaicNode<T>) => void;
    /**
     * Atomically applies all updates to the current tree
     * @param updates
     */
    updateTree: (updates: MosaicUpdate<T>[]) => void;
    /**
     * Returns the root of this Mosaic instance
     */
    getRoot: () => MosaicNode<T> | null;
}
```

Children (and toolbar elements) within `MosaicWindow` are passed the following additional functions on context.

```typescript
export interface MosaicWindowContext<T> extends MosaicTileContext<T> {
    mosaicWindowActions: MosaicWindowActions;
}

export interface MosaicWindowActions {
    /**
     * Fails if no `createNode()` is defined
     * Creates a new node and splits the current node.
     * The current node becomes the `first` and the new node the `second` of the result.
     * `direction` is chosen by querying the DOM and splitting along the longer axis
     */
    split: () => Promise<void>;
    /**
     * Fails if no `createNode()` is defined
     * Convenience function to call `createNode()` and replace the current node with it.
     */
    replaceWithNew: () => Promise<void>;
}
```

To access the functions on context simply specify `contextTypes` on your component.

```typescript
class RemoveButton extends React.Component<Props, void> {
    static contextTypes = MosaicWindowContext;
    context: MosaicWindowContext<TileId>;


    render() {
        return button({
            onClick: this.remove
        }, '╳');
    }

    private remove = () =>
        this.context.mosaicActions.remove(this.context.getMosaicPath());
}
```

### Mutating the Tree
Utilities are provided for working with the MosaicNode tree in [`mosaicUtilities`](./src/mosaicUtilities.ts) and
[`mosaicUpdates`](./src/mosaicUpdates.ts)
#### MosaicUpdate
[`MosaicUpdateSpec`](./src/types.ts#L43) is an argument meant to be passed to [`immutability-helper`](https://github.com/kolodny/immutability-helper) 
to modify the state at a path. [`mosaicUpdates`](./src/mosaicUpdates.ts) has examples.

```
/**
 * Used by many utility methods to update the tree.
 * spec will be passed to https://github.com/kolodny/immutability-helper
 */
export interface MosaicUpdateSpec<T> {
    $set?: MosaicNode<T>;
    splitPercentage?: {
        $set: number | null;
    };
    direction?: {
        $set: MosaicDirection;
    }
    first?: MosaicUpdateSpec<T>;
    second?: MosaicUpdateSpec<T>;
}
```

## License
Copyright 2016 Palantir Technologies

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

