import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

function Hero() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro"
          >
            Get started
          </Link>
          <Link
            className="button button--outline button--lg"
            style={{ marginLeft: '1rem' }}
            to="/demo"
          >
            Open demo
          </Link>
        </div>
      </div>
    </header>
  );
}

const FEATURES: Array<{ title: string; body: string }> = [
  {
    title: 'Drag, drop, resize',
    body: 'End users rearrange panels by dragging title bars, resize with a grab on any split, and split panels in two with a button. All without wiring up a single event handler.',
  },
  {
    title: 'Splits and tabs',
    body: 'Any split can hold any number of children, and tab groups are a first-class node type — not a workaround layered on top of splits.',
  },
  {
    title: 'Easy theming',
    body: 'Ships with a neutral default plus a Blueprint-integrated theme. Writing your own is one className on <Mosaic> and CSS overrides scoped to it — no runtime theme API to learn.',
  },
  {
    title: 'Serializable layouts',
    body: 'The layout is a plain JSON tree. JSON.stringify it to localStorage, a URL, or your backend — restore it by passing it straight back to value. Persistence is a one-liner.',
  },
  {
    title: 'Controlled or uncontrolled',
    body: 'Pass initialValue for a zero-config layout, or take control with value + onChange + onRelease when you need to persist, undo, or drive the tree programmatically.',
  },
  {
    title: 'Small surface, broad support',
    body: 'Apache 2.0, a handful of public exports, and React 16 through 19. TypeScript-first, with generics for your panel identifiers.',
  },
];

function Features() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FEATURES.map((f) => (
            <div key={f.title} className={clsx('col col--4')}>
              <div className="padding-horiz--md padding-vert--md">
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description="React tiling window manager">
      <Hero />
      <main>
        <Features />
      </main>
    </Layout>
  );
}
