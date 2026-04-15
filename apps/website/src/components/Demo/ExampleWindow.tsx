import React, { useMemo } from 'react';
import { Button } from '@blueprintjs/core';
import {
  MosaicWindow,
  MosaicWindowContext,
  AddTabButton,
  RemoveButton,
} from 'react-mosaic-component';
import type { ExampleWindowProps } from './demo-types';
import { createNode } from './demo-utils';
import { CloseAdditionalControlsButton } from './toolbars';

type Status = 'Active' | 'On Leave' | 'Remote' | 'Part-time';

interface Row {
  id: number;
  name: string;
  email: string;
  department: string;
  position: string;
  salary: string;
  startDate: string;
  status: Status;
}

const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
];
const POSITIONS = [
  'Manager',
  'Senior',
  'Junior',
  'Lead',
  'Director',
  'Analyst',
];
const STATUSES: Status[] = ['Active', 'On Leave', 'Remote', 'Part-time'];

const STATUS_CLASS: Record<Status, string> = {
  Active: 'example-window__status--active',
  Remote: 'example-window__status--remote',
  'On Leave': 'example-window__status--on-leave',
  'Part-time': 'example-window__status--part-time',
};

const ADDITIONAL_CONTROLS = React.Children.toArray([
  <CloseAdditionalControlsButton />,
]);

function buildRows(panelId: string): Row[] {
  const panelOffset = Number.isFinite(parseInt(panelId, 10))
    ? parseInt(panelId, 10)
    : 0;
  return Array.from({ length: 100 }, (_, index) => {
    const id = index + 1 + panelOffset * 100;
    return {
      id,
      name: `User ${id} Panel${panelId}`,
      email: `user${id}@company.com`,
      department: DEPARTMENTS[index % DEPARTMENTS.length],
      position: POSITIONS[index % POSITIONS.length],
      salary: `$${(50000 + index * 1000 + panelOffset * 5000).toLocaleString()}`,
      startDate: new Date(
        2020 + (index % 4),
        index % 12,
        (index % 28) + 1,
      ).toLocaleDateString(),
      status: STATUSES[index % STATUSES.length],
    };
  });
}

export const ExampleWindow: React.FC<ExampleWindowProps> = ({
  panelId,
  path,
  title,
}) => {
  const rows = useMemo(() => buildRows(panelId), [panelId]);

  return (
    <MosaicWindow<string>
      title={title}
      path={path}
      createNode={createNode}
      additionalControls={panelId === '3' ? ADDITIONAL_CONTROLS : []}
      renderToolbar={
        panelId === '2'
          ? () => (
              <div className="toolbar-example">
                <MosaicWindowContext.Consumer key="split">
                  {({ mosaicWindowActions }) => (
                    <Button
                      variant="minimal"
                      size="small"
                      icon="split-columns"
                      title="Split"
                      onClick={() => mosaicWindowActions.split()}
                    />
                  )}
                </MosaicWindowContext.Consumer>
                <MosaicWindowContext.Consumer key="add-tab">
                  {() => <AddTabButton />}
                </MosaicWindowContext.Consumer>
                <MosaicWindowContext.Consumer key="close">
                  {() => <RemoveButton />}
                </MosaicWindowContext.Consumer>
              </div>
            )
          : null
      }
    >
      <div className="example-window">
        <h1 className="example-window__heading">{`${title} — Data Table`}</h1>
        <div className="example-window__table-wrapper">
          <table className="example-window__table">
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Name</th>
                <th scope="col">Email</th>
                <th scope="col">Department</th>
                <th scope="col">Position</th>
                <th scope="col">Salary</th>
                <th scope="col">Start Date</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.department}</td>
                  <td>{row.position}</td>
                  <td>{row.salary}</td>
                  <td>{row.startDate}</td>
                  <td>
                    <span
                      className={`example-window__status ${STATUS_CLASS[row.status]}`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MosaicWindow>
  );
};
