import * as path from 'path';

const DEMO_FOLDER = path.join(__dirname, '..', 'demo/');
export const CONSTANTS = {
  APP_ENTRY: path.join(DEMO_FOLDER, 'index.tsx'),
  HTML_TEMPLATE: path.join(__dirname, 'index-template.html'),
  DOCS_DIR: path.join(__dirname, '..', 'docs/'),
  DEV_SERVER_PORT: 8092,
};
