require('jsdom-global/register');
require('ts-node').register({
  transpileOnly: true,
});

const mock = require('mock-require');
mock('rdndmb-html5-to-touch', {});
mock('react-dnd', {});
mock('react-dnd-multi-backend', {});

module.exports = {
  spec: 'test/*.ts',
};
