import React, { useState, useEffect } from 'react';
import { apiClient, AUTH } from '../api/client';
import styles from './ReportingPage.module.css';
import pkg from '../../package.json';

const ReportingPage: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [pin, setPin] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'form' | 'request' | 'info'>('form');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form State
  const [datum, setDatum] = useState('');
  const [fuerAndere, setFuerAndere] = useState(false);
  const [rolle, setRolle] = useState('Hauptleitung');
  const [partner, setPartner] = useState('');
  const [hl, setHl] = useState('');
  const [hilfs, setHilfs] = useState('');
  const [anzahl, setAnzahl] = useState('');
  const [leiter, setLeiter] = useState('');
  const [dynamik, setDynamik] = useState('Normal');
  const [bemerkungen, setBemerkungen] = useState('');

  // Request State
  const [reqEmail, setReqEmail] = useState('');
  const [reqVon, setReqVon] = useState('');
  const [reqBis, setReqBis] = useState('');
  const [reqGrund, setReqGrund] = useState('');
  const [reqPin, setReqPin] = useState('');
  const [reqStep, setReqStep] = useState(1);

  useEffect(() => {
    const session = AUTH.getSession();
    if (session) {
      setUserName(session.name);
      setPin(session.pin);
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName || !pin) {
      setError('Bitte Name und PIN eingeben.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('sheets', { action: 'verifyPin', pin });
      AUTH.saveSession(userName, pin);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError('Falscher PIN oder Serverfehler.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    AUTH.clearSession();
    setUserName(null);
    setPin('');
    setIsAuthenticated(false);
  };

  const submitReport = async () => {
    if (!datum || !anzahl || !leiter || !dynamik) {
      setError('Bitte alle benötigten Felder ausfüllen.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const payload = {
        action: 'appendRow',
        pin,
        timestamp: new Date().toISOString(),
        datum,
        leiterName: userName,
        hl: fuerAndere ? hl : (rolle === 'Hauptleitung' ? userName : partner),
        hilfs: fuerAndere ? hilfs : (rolle === 'Hilfsleitung' ? userName : partner),
        anzahl: parseInt(anzahl) || 0,
        leiterCount: parseInt(leiter) || 0,
        dynamik,
        bemerkungen,
        version: pkg.version
      };
      await apiClient.post('sheets', payload);
      setSuccess('Bericht erfolgreich gesendet!');
      setTimeout(() => setSuccess(null), 3000);
      
      // Reset form
      setDatum('');
      setPartner('');
      setHl('');
      setHilfs('');
      setAnzahl('');
      setLeiter('');
      setBemerkungen('');
      setDynamik('Normal');
    } catch (err: any) {
      setError('Fehler beim Senden: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestCode = async () => {
    if (!reqEmail || !reqVon || !reqBis) {
      setError('Bitte E-Mail und Datum ausfüllen.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('sheets', { action: 'requestToken', email: reqEmail, von: reqVon, bis: reqBis, grund: reqGrund });
      setReqStep(2);
      setSuccess('Code gesendet! Bitte E-Mails prüfen.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Fehler: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async () => {
    if (!reqPin) {
      setError('Bitte Code eingeben.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('sheets', { action: 'requestHistory', tokenCode: reqPin, email: reqEmail, startDate: reqVon, endDate: reqBis, grund: reqGrund });
      setSuccess('Auszug wird gesendet!');
      setTimeout(() => setSuccess(null), 3000);
      setReqStep(1);
      setReqEmail('');
    } catch (err: any) {
      setError('Fehler: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={`glass-panel ${styles.loginCard}`}>
          <h2><i className="fa-solid fa-lock"></i> Anmelden</h2>
          <form onSubmit={handleLogin}>
            <div className={styles.formGroup}>
              <label>Dein Name</label>
              <input type="text" value={userName || ''} onChange={e => setUserName(e.target.value)} className={styles.input} placeholder="Vorname" required />
            </div>
            <div className={styles.formGroup}>
              <label>Schar-PIN</label>
              <input type="password" value={pin} onChange={e => setPin(e.target.value)} className={styles.input} placeholder="••••" required />
            </div>
            {error && <p className={styles.error}>{error}</p>}
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Anmelden
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Reporting Tool</h1>
        <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${activeTab === 'form' ? styles.active : ''}`} onClick={() => setActiveTab('form')}>Bericht</button>
        <button className={`${styles.tabBtn} ${activeTab === 'request' ? styles.active : ''}`} onClick={() => setActiveTab('request')}>Auszug</button>
        <button className={`${styles.tabBtn} ${activeTab === 'info' ? styles.active : ''}`} onClick={() => setActiveTab('info')}>Info</button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}
      {success && <div className={styles.successBanner}>{success}</div>}

      <div className={`glass-panel ${styles.tabContent}`}>
        {activeTab === 'form' && (
          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label>Datum</label>
              <input type="date" value={datum} onChange={e => setDatum(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label>
                <input type="checkbox" checked={fuerAndere} onChange={e => setFuerAndere(e.target.checked)} />
                {' '}Report für andere
              </label>
            </div>
            
            {!fuerAndere && (
              <>
                <div className={styles.formGroup}>
                  <label>Meine Rolle</label>
                  <select value={rolle} onChange={e => setRolle(e.target.value)} className={styles.input}>
                    <option>Hauptleitung</option>
                    <option>Hilfsleitung</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Partner/in</label>
                  <input type="text" value={partner} onChange={e => setPartner(e.target.value)} className={styles.input} />
                </div>
              </>
            )}

            {fuerAndere && (
              <>
                <div className={styles.formGroup}>
                  <label>Hauptleitung</label>
                  <input type="text" value={hl} onChange={e => setHl(e.target.value)} className={styles.input} />
                </div>
                <div className={styles.formGroup}>
                  <label>Hilfsleitung</label>
                  <input type="text" value={hilfs} onChange={e => setHilfs(e.target.value)} className={styles.input} />
                </div>
              </>
            )}

            <div className={styles.formGroup}>
              <label>Anzahl Kinder</label>
              <input type="number" value={anzahl} onChange={e => setAnzahl(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label>Zusätzliche Leiter</label>
              <input type="number" value={leiter} onChange={e => setLeiter(e.target.value)} className={styles.input} />
            </div>
            
            <div className={styles.formGroup}>
              <label>Gruppendynamik</label>
              <select value={dynamik} onChange={e => setDynamik(e.target.value)} className={styles.input}>
                <option>Sehr gut</option>
                <option>Gut</option>
                <option>Normal</option>
                <option>Problematisch</option>
                <option>Kritisch</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Bemerkungen</label>
              <textarea value={bemerkungen} onChange={e => setBemerkungen(e.target.value)} className={styles.input} rows={4} />
            </div>

            <button className="btn btn-primary" onClick={submitReport} disabled={loading}>
              {loading ? 'Wird gesendet...' : 'Report absenden'}
            </button>
          </div>
        )}

        {activeTab === 'request' && (
          <div className={styles.form}>
            <div className={styles.formGroup}>
              <label>Deine E-Mail</label>
              <input type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label>Startdatum</label>
              <input type="date" value={reqVon} onChange={e => setReqVon(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label>Enddatum</label>
              <input type="date" value={reqBis} onChange={e => setReqBis(e.target.value)} className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label>Grund der Anforderung</label>
              <textarea value={reqGrund} onChange={e => setReqGrund(e.target.value)} className={styles.input} rows={2} />
            </div>

            {reqStep === 1 ? (
              <button className="btn btn-secondary" onClick={requestCode} disabled={loading}>
                {loading ? 'Anfrage läuft...' : 'Verifizierungs-Code anfordern'}
              </button>
            ) : (
              <div className={styles.verificationBox}>
                <p>Bitte gib den 6-stelligen Code aus deiner E-Mail ein:</p>
                <input type="text" value={reqPin} onChange={e => setReqPin(e.target.value)} className={styles.input} placeholder="123456" maxLength={6} />
                <button className="btn btn-primary" onClick={submitRequest} disabled={loading} style={{ marginTop: '1rem' }}>
                  Berichte anzeigen
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div className={styles.infoContent}>
            <h3>Kontakt</h3>
            <p>Die Kontaktinformationen findest du in der config.js.</p>
            <br />
            <h3>Allgemeines</h3>
            <p>Willkommen beim Jubla Reporting Tool!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportingPage;
