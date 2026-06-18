import { MosaicNode } from '../types';

import { MosaicSchema } from '../configuration/types';

/**
 * Pure operations for building and manipulating string-keyed mosaic trees.
 */
export class MosaicTree {
  /**
   * Creates a nested mosaic tree from an array of component keys,
   * alternating between row and column directions based on depth.
   */
  static createDefault(depth: number, values: string[], splitPercentage?: number): MosaicNode<string> {
    if (depth <= 1) {
      if (values.length > 1) {
        return {
          direction: 'row',
          first: values[depth],
          second: values[depth - 1],
          splitPercentage,
        };
      }

      return values[depth];
    }

    return {
      direction: depth % 2 === 0 ? 'row' : 'column',
      first: values[depth],
      second: MosaicTree.createDefault(depth - 1, values),
    };
  }

  /**
   * Adds a component to the tree. If the tree is empty the component becomes
   * the root, otherwise it is added as a new row split on the right.
   */
  static add(tree: MosaicSchema, componentKey: string): MosaicSchema {
    if (!tree) {
      return componentKey;
    }

    return {
      direction: 'row',
      first: tree,
      second: componentKey,
      splitPercentage: 50,
    };
  }

  /**
   * Removes a component from the tree, collapsing empty branches.
   */
  static remove(tree: MosaicSchema, componentKey: string): MosaicSchema {
    if (!tree) {
      return null;
    }

    if (typeof tree === 'string') {
      return tree === componentKey ? null : tree;
    }

    const newFirst = MosaicTree.remove(tree.first, componentKey);
    const newSecond = MosaicTree.remove(tree.second, componentKey);

    if (!newFirst) {
      return newSecond;
    }
    if (!newSecond) {
      return newFirst;
    }

    return { ...tree, first: newFirst, second: newSecond };
  }

  /** Checks whether a component exists in the tree. */
  static contains(tree: MosaicSchema, componentKey: string): boolean {
    if (!tree) {
      return false;
    }

    if (typeof tree === 'string') {
      return tree === componentKey;
    }

    return MosaicTree.contains(tree.first, componentKey) || MosaicTree.contains(tree.second, componentKey);
  }

  /** Returns all component keys present in the tree as a flat array. */
  static getComponentKeys(tree: MosaicSchema): string[] {
    if (!tree) {
      return [];
    }

    if (typeof tree === 'string') {
      return [tree];
    }

    return [...MosaicTree.getComponentKeys(tree.first), ...MosaicTree.getComponentKeys(tree.second)];
  }

  /** Counts the number of components in the tree. */
  static count(tree: MosaicSchema): number {
    return MosaicTree.getComponentKeys(tree).length;
  }

  /** True when the tree contains exactly one leaf (a single component). */
  static isSingleLeaf(tree: MosaicSchema): boolean {
    return typeof tree === 'string';
  }
}
