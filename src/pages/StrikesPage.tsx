import React, { useState, useEffect } from 'react';
import { apiClient, AUTH } from '../api/client';
import styles from './StrikesPage.module.css';
import pkg from '../../package.json';

interface Kid {
  id: string;
  name: string;
  strikes: number;
}

const StrikesPage: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [pin, setPin] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOverlay, setSuccessOverlay] = useState(false);

  const [kids, setKids] = useState<Kid[]>([]);
  const [newKidName, setNewKidName] = useState('');

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
      await apiClient.post('strikes', { action: 'verifyPin', pin });
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

  const addKid = () => {
    const name = newKidName.trim();
    if (!name) return;
    if (kids.find(k => k.name.toLowerCase() === name.toLowerCase())) {
      setError('Dieses Kind existiert bereits in der Liste.');
      return;
    }
    
    const newKid: Kid = {
      id: Date.now().toString(),
      name,
      strikes: 0
    };
    
    setKids([...kids, newKid]);
    setNewKidName('');
    setError(null);
  };

  const updateStrikes = (id: string, delta: number) => {
    setKids(kids.map(kid => {
      if (kid.id === id) {
        let newStrikes = kid.strikes + delta;
        if (newStrikes < 0) newStrikes = 0;
        if (newStrikes > 3) newStrikes = 3;
        return { ...kid, strikes: newStrikes };
      }
      return kid;
    }));
  };

  const saveDay = async () => {
    if (kids.length === 0) {
      setError('Bitte füge mindestens ein Kind hinzu.');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('strikes', {
        action: 'saveStrikeDay',
        pin,
        datum: new Date().toISOString().split("T")[0],
        leiterName: userName,
        timestamp: new Date().toISOString(),
        version: pkg.version,
        kids: kids.map(k => ({ name: k.name, strikes: k.strikes }))
      });
      
      setSuccessOverlay(true);
    } catch (err: any) {
      setError('Fehler beim Speichern: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setKids([]);
    setSuccessOverlay(false);
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

  const stats = {
    total: kids.length,
    oneStrike: kids.filter(k => k.strikes === 1).length,
    twoStrikes: kids.filter(k => k.strikes === 2).length,
    banned: kids.filter(k => k.strikes >= 3).length
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 className={styles.pageTitle} style={{ margin: 0 }}>Strike-System</h1>
        <button onClick={handleLogout} className="btn" style={{ padding: '0.5rem 1rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <i className="fa-solid fa-right-from-bracket" style={{ marginRight: '0.5rem' }}></i> Abmelden
        </button>
      </div>

      <div className={styles.statsStrip}>
        <div className={styles.statPill}>
          <div className={styles.statNum}>{stats.total}</div>
          <div className={styles.statLabel}>Kinder</div>
        </div>
        <div className={`${styles.statPill} ${stats.oneStrike > 0 ? styles.pillWarn : ''}`}>
          <div className={`${styles.statNum} ${styles.cWarn}`}>{stats.oneStrike}</div>
          <div className={styles.statLabel}>1 Strike</div>
        </div>
        <div className={`${styles.statPill} ${stats.twoStrikes > 0 ? styles.pillWarn : ''}`}>
          <div className={`${styles.statNum} ${styles.cWarn}`}>{stats.twoStrikes}</div>
          <div className={styles.statLabel}>2 Strikes</div>
        </div>
        <div className={`${styles.statPill} ${stats.banned > 0 ? styles.pillRed : ''}`}>
          <div className={`${styles.statNum} ${styles.cRed}`}>{stats.banned}</div>
          <div className={styles.statLabel}>Banned</div>
        </div>
      </div>

      <div className={`glass-panel ${styles.mainPanel}`}>
        <div className={styles.addRow}>
          <input 
            type="text" 
            value={newKidName} 
            onChange={e => setNewKidName(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && addKid()}
            placeholder="Name des Kindes..." 
            className={styles.input}
          />
          <button className={styles.btnAdd} onClick={addKid}>+</button>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.kidsList}>
          {kids.map(kid => (
            <div key={kid.id} className={`${styles.kidRow} ${kid.strikes >= 3 ? styles.rowBanned : kid.strikes > 0 ? styles.rowWarn : ''}`}>
              <div className={styles.kidInfo}>
                <span className={styles.kidName}>{kid.name}</span>
                <span className={styles.kidStrikes}>{kid.strikes} Strikes</span>
              </div>
              <div className={styles.kidActions}>
                <button className={styles.btnMinus} onClick={() => updateStrikes(kid.id, -1)} disabled={kid.strikes <= 0}>-</button>
                <div className={styles.strikeDots}>
                  {[1, 2, 3].map(s => (
                    <div key={s} className={`${styles.dot} ${kid.strikes >= s ? styles.dotActive : ''} ${kid.strikes >= 3 ? styles.dotRed : ''}`}></div>
                  ))}
                </div>
                <button className={styles.btnPlus} onClick={() => updateStrikes(kid.id, 1)} disabled={kid.strikes >= 3}>+</button>
              </div>
            </div>
          ))}
          
          {kids.length === 0 && (
            <div className={styles.emptyState}>Keine Kinder erfasst. Bitte füge ein Kind hinzu.</div>
          )}
        </div>

        <button className="btn btn-primary" onClick={saveDay} disabled={loading || kids.length === 0} style={{ width: '100%', marginTop: '2rem' }}>
          {loading ? 'Wird gespeichert...' : 'GruStu abschliessen & speichern'}
        </button>
      </div>

      {successOverlay && (
        <div className={styles.overlay}>
          <div className={`glass-panel ${styles.overlayCard}`}>
            <h2>GruStu gespeichert!</h2>
            <p>Alle Strikes wurden erfolgreich in Google Sheets übertragen.</p>
            
            <div className={styles.summaryList}>
              {kids.filter(k => k.strikes > 0).map(k => (
                <div key={k.id} className={styles.summaryItem}>
                  <span>{k.name}</span>
                  <strong>{k.strikes} Strikes</strong>
                </div>
              ))}
              {kids.filter(k => k.strikes > 0).length === 0 && (
                <div className={styles.summaryItem}>Alle Kinder waren brav! 🎉</div>
              )}
            </div>

            <button className="btn btn-primary" onClick={resetAll} style={{ width: '100%', marginTop: '1rem' }}>
              Neue GruStu starten
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StrikesPage;
