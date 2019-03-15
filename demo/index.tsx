import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { ExampleApp } from './ExampleApp';

const APP_ELEMENT = document.getElementById('app')!;
const render = (Component: React.ComponentClass<any>) => {
  ReactDOM.render(
    <AppContainer>
      <Component />
    </AppContainer>,
    APP_ELEMENT,
  );
};

render(ExampleApp);

declare var module: any;
if (module.hot) {
  module.hot.accept('./ExampleApp', () => {
    render(require('./ExampleApp').ExampleApp);
  });
}
