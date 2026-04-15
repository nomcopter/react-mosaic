import React, { Suspense } from 'react';
import Layout from '@theme/Layout';
import BrowserOnly from '@docusaurus/BrowserOnly';

import styles from './demo.module.css';

// The demo app pulls in Blueprint JS plus the full example window code.
// Loading it via React.lazy lets webpack put it in its own chunk so the rest
// of the docs site doesn't pay the cost. Blueprint CSS is loaded globally via
// `stylesheets` in docusaurus.config.ts (needed by docs live examples too).
const DemoApp = React.lazy(() => import('../components/Demo'));

function DemoFallback() {
  return <div className={styles.fallback}>Loading demo…</div>;
}

export default function Demo(): React.ReactElement {
  return (
    <Layout
      title="Demo"
      description="Interactive react-mosaic demo app"
      noFooter
    >
      <div className={styles.wrapper}>
        <BrowserOnly fallback={<DemoFallback />}>
          {() => (
            <Suspense fallback={<DemoFallback />}>
              <DemoApp />
            </Suspense>
          )}
        </BrowserOnly>
      </div>
    </Layout>
  );
}
