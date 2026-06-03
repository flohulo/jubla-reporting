import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import styles from './Layout.module.css';

const Layout: React.FC = () => {
  return (
    <div className={styles.container}>
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.logo}>
          <Link to="/">Jubla Reporting</Link>
        </div>
        <nav className={styles.nav}>
          <Link to="/spesen" className={styles.navLink}>Spesen</Link>
          <Link to="/reporting" className={styles.navLink}>Reporting</Link>
          <Link to="/strikes" className={styles.navLink}>Strikes</Link>
        </nav>
      </header>
      
      <main className={styles.main}>
        <Outlet />
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Jubla Wald ZH. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
