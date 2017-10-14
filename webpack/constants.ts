import * as path from 'path';

const DEMO_FOLDER = path.join(__dirname, '..', 'dev/');
export const CONSTANTS = {
  APP_ENTRY: path.join(DEMO_FOLDER, 'index.tsx'),
  HTML_TEMPLATE: path.join(DEMO_FOLDER, 'index-template.html'),
  DOCS_DIR: path.join(__dirname, '..', 'docs/'),
  DEV_SERVER_PORT: 8092,
};
