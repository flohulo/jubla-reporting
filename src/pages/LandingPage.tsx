import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AUTH } from '../api/client';
import styles from './LandingPage.module.css';

const LandingPage: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const session = AUTH.getSession();
    if (session) {
      setUserName(session.name);
    }
  }, []);

  return (
    <div className={styles.landingContainer}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>Reporting <span className={styles.highlight}>einfach</span> gemacht.</h1>
          <p className={styles.subtitle}>
            Das effiziente Tool zur Erfassung von Gruppenstunden-Berichten und zur Qualitätssicherung für Jubla-Scharen – optimiert für das Smartphone.
          </p>
          <div className={styles.actions}>
            <Link to="/reporting" className="btn btn-primary glass-panel">
              {userName ? `Hoi ${userName}! Zum Tool ➔` : 'Zum Login ➔'}
            </Link>
            <a href="https://github.com/flohulo/jubla-reporting" target="_blank" rel="noreferrer" className="btn btn-outline glass-panel">
              GitHub Repo
            </a>
          </div>
          <div className={styles.loginNote}>
            Login nur für autorisierte Leitende unserer Schar.
          </div>
        </div>
        <div className={styles.heroImage}>
          <img src="/assets/images/hero.png" alt="Jubla Reporting App Vorschau" />
        </div>
      </header>

      <section className={styles.features}>
        <div className={styles.sectionHeader}>
          <h2>Alles, was du brauchst.</h2>
          <p>Wir haben das Tool von Leitern für Leiter entwickelt. Fokus auf das Wesentliche, damit mehr Zeit für die Kinder bleibt.</p>
        </div>
        <div className={styles.featuresGrid}>
          <div className={`${styles.featureCard} glass-panel`}>
            <h3>📱 Mobile First</h3>
            <p>Berichte sind in weniger als 2 Minuten erfasst – direkt nach dem Höck oder im Bus auf dem Smartphone.</p>
          </div>
          <div className={`${styles.featureCard} glass-panel`}>
            <h3>📊 Google Sheets</h3>
            <p>Keine Datenbank-Administration nötig. Deine Google Tabelle ist dein Backend – sicher und transparent.</p>
          </div>
          <div className={`${styles.featureCard} glass-panel`}>
            <h3>🔔 Alarm-Funktion</h3>
            <p>Automatische Benachrichtigung der Scharleitung bei kritischen Vorfällen wie Unfällen oder Konflikten.</p>
          </div>
        </div>
      </section>

      <section className={styles.benefits}>
        <div className={styles.benefitRow}>
          <div className={styles.benefitContent}>
            <h3>Qualitätssicherung ohne Papierkram.</h3>
            <p>Vergiss verlorene Zettel oder mühsame Excel-Listen am Ende des Jahres. Mit Jubla Reporting hast du jederzeit den Überblick.</p>
            <ul>
              <li>✅ Alle Berichte an einem zentralen Ort</li>
              <li>✅ Automatische Archivierung als PDF</li>
              <li>✅ Einfacher Export für J+S oder die Pfarrei</li>
            </ul>
          </div>
          <div className={styles.benefitImage}>
            <img src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800" alt="Zusammenarbeit" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
