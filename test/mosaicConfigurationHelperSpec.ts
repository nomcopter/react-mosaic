import { expect } from 'chai';
import React from 'react';

import { MosaicConfigurationHelper } from '../src/configuration/mosaicConfigurationHelper';
import { MosaicConfiguration } from '../src/configuration/types';

const CONFIG: MosaicConfiguration = {
  key: 'test',
  defaultViewKey: 'default',
  components: {
    panel1: { title: 'Panel 1', component: React.createElement('div', null, 'p1') },
    panel2: { title: 'Panel 2', component: React.createElement('div', null, 'p2') },
    panel3: { title: 'Panel 3', component: React.createElement('div', null, 'p3') },
  },
  views: {
    default: { layout: { direction: 'row', first: 'panel1', second: 'panel2' } },
    locked: {
      layout: { direction: 'row', first: 'panel1', second: 'panel2' },
      lockComponents: ['panel1'],
    },
    multiLocked: {
      layout: 'panel1',
      lockComponents: ['panel1', 'panel2'],
    },
  },
};

describe('MosaicConfigurationHelper', () => {
  describe('isComponentLocked', () => {
    it('should return false when view has no lockComponents', () => {
      expect(MosaicConfigurationHelper.isComponentLocked('panel1', 'default', CONFIG)).to.equal(false);
    });

    it('should return true for a locked component', () => {
      expect(MosaicConfigurationHelper.isComponentLocked('panel1', 'locked', CONFIG)).to.equal(true);
    });

    it('should return false for an unlocked component in a view with other locks', () => {
      expect(MosaicConfigurationHelper.isComponentLocked('panel2', 'locked', CONFIG)).to.equal(false);
    });

    it('should return true for all locked components in multiLocked view', () => {
      expect(MosaicConfigurationHelper.isComponentLocked('panel1', 'multiLocked', CONFIG)).to.equal(true);
      expect(MosaicConfigurationHelper.isComponentLocked('panel2', 'multiLocked', CONFIG)).to.equal(true);
    });

    it('should return false for unlocked component in multiLocked view', () => {
      expect(MosaicConfigurationHelper.isComponentLocked('panel3', 'multiLocked', CONFIG)).to.equal(false);
    });

    it('should return false when viewKey does not exist', () => {
      expect(MosaicConfigurationHelper.isComponentLocked('panel1', 'nonexistent', CONFIG)).to.equal(false);
    });
  });

  describe('getLockedComponents', () => {
    it('should return empty array for view without lockComponents', () => {
      expect(MosaicConfigurationHelper.getLockedComponents('default', CONFIG)).to.deep.equal([]);
    });

    it('should return locked components for a view with locks', () => {
      expect(MosaicConfigurationHelper.getLockedComponents('locked', CONFIG)).to.deep.equal(['panel1']);
    });

    it('should return all locked components for multiLocked view', () => {
      expect(MosaicConfigurationHelper.getLockedComponents('multiLocked', CONFIG)).to.deep.equal(['panel1', 'panel2']);
    });

    it('should return empty array for a non-existent view', () => {
      expect(MosaicConfigurationHelper.getLockedComponents('ghost', CONFIG)).to.deep.equal([]);
    });
  });

  describe('componentExists', () => {
    it('should return true for existing component', () => {
      expect(MosaicConfigurationHelper.componentExists('panel1', CONFIG)).to.equal(true);
    });

    it('should return false for missing component', () => {
      expect(MosaicConfigurationHelper.componentExists('missing', CONFIG)).to.equal(false);
    });
  });

  describe('getComponentTitle', () => {
    it('should return title for existing component', () => {
      expect(MosaicConfigurationHelper.getComponentTitle('panel1', CONFIG)).to.equal('Panel 1');
    });

    it('should return undefined for missing component', () => {
      expect(MosaicConfigurationHelper.getComponentTitle('missing', CONFIG)).to.equal(undefined);
    });
  });

  describe('getAllComponentKeys', () => {
    it('should return all component keys', () => {
      const keys = MosaicConfigurationHelper.getAllComponentKeys(CONFIG);
      expect(keys).to.have.members(['panel1', 'panel2', 'panel3']);
    });

    it('should return empty array for empty components map', () => {
      const empty: MosaicConfiguration = { ...CONFIG, components: {} };
      expect(MosaicConfigurationHelper.getAllComponentKeys(empty)).to.deep.equal([]);
    });
  });
});
