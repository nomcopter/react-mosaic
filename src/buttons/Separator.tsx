import React from 'react';

export class Separator extends React.PureComponent {
  render() {
    return <div className="separator" />;
  }
}

export const SeparatorFactory = React.createFactory(Separator);
