import React, { useState, useRef, useEffect } from 'react';
import Tesseract from 'tesseract.js';
import { apiClient, AUTH } from '../api/client';
import styles from './ExpensesPage.module.css';

const ExpensesPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Step 1 State
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');

  // Step 2 State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string>('');

  // Step 3 State
  const [datum, setDatum] = useState('');
  const [betrag, setBetrag] = useState('');
  const [bereich, setBereich] = useState('');
  const [kategorie, setKategorie] = useState('');
  const [beschreibung, setBeschreibung] = useState('');
  const [zahlung, setZahlung] = useState('Privat bezahlt');
  const [notiz, setNotiz] = useState('');

  useEffect(() => {
    const session = AUTH.getSession();
    if (session) {
      setName(session.name);
      setPin(session.pin);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleNextStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !pin) {
      setError('Bitte Name und PIN eingeben.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // Dummy validation call (similar to original)
      // await apiClient.post('spesen', { action: 'verify', pin });
      AUTH.saveSession(name, pin);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Der Schar-PIN ist falsch.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Bitte ein Bild auswählen.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        const url = ev.target.result as string;
        setImageDataUrl(url);
        analyzeWithOCR(url);
      }
    };
    reader.readAsDataURL(file);
  };

  const analyzeWithOCR = async (url: string) => {
    setOcrStatus('Analysiere Beleg...');
    setLoading(true);
    try {
      const worker = await Tesseract.createWorker(['deu', 'eng']);
      const { data: { text } } = await worker.recognize(url);
      await worker.terminate();

      const filled = parseOCRText(text);
      if (filled.length > 0) {
        setOcrStatus(`Belegdaten erkannt: ${filled.join(', ')}`);
      } else {
        setOcrStatus('Daten konnten nicht vollständig gelesen werden.');
      }
    } catch (err: any) {
      setOcrStatus('Analyse-Fehler: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const parseOCRText = (text: string) => {
    const filled: string[] = [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    
    // Date parsing
    const datumPatterns = [/\b(\d{1,2})[.\-\/](\d{1,2})[.\-\/](20\d{2})\b/, /\b(20\d{2})[.\-\/](\d{1,2})[.\-\/](\d{1,2})\b/];
    for (const line of lines) {
      for (const p of datumPatterns) {
        const m = line.match(p);
        if (m) {
          const d = p === datumPatterns[0] 
            ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` 
            : `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
          setDatum(d);
          filled.push('Datum');
          break;
        }
      }
      if (filled.includes('Datum')) break;
    }

    // Amount parsing
    const betragsPattern = /(\d{1,6}[.,]\d{2})/g;
    const allBetraege = [...text.matchAll(betragsPattern)].map(m => parseFloat(m[1].replace(',', '.'))).filter(v => !isNaN(v) && v > 0);
    if (allBetraege.length) {
      setBetrag(Math.max(...allBetraege).toFixed(2));
      filled.push('Betrag');
    }

    // Description parsing
    for (const line of lines) {
      if (line.length >= 5 && !/^\d+([.,]\d+)?$/.test(line)) {
        setBeschreibung(line.substring(0, 40));
        filled.push('Beschreibung');
        break;
      }
    }
    return filled;
  };

  const handleNextStep2 = () => {
    if (!imageDataUrl) {
      setError('Bitte zuerst ein Foto des Belegs hochladen.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const getSubCategories = () => {
    const subs: Record<string, string[]> = {
      'Lager': ['Verpflegung', 'Material / Programm', 'Miete / Platz', 'Transport', 'Diverses Lager'],
      'Leitung': ['Höck / Verpflegung', 'Weekend / Ausflug', 'Weiterbildung', 'Diverses Leitung'],
      'Gruppenstunde': ['Bastelmaterial', 'Verpflegung GS', 'Programm GS', 'Diverses Gruppenstunde']
    };
    return bereich ? subs[bereich] || [] : [];
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!datum || !betrag || !bereich || !kategorie) {
      setError('Bitte alle Pflichtfelder (*) ausfüllen.');
      return;
    }

    setError(null);
    setLoading(true);
    showToast('Wird übertragen...');

    try {
      const entry = {
        datum,
        kategorie: `${bereich}: ${kategorie}`,
        beschreibung,
        zahlung,
        notiz,
        betrag: parseFloat(betrag),
        kostenstelle: 'Schar-Rechnung 8730',
        bild: imageDataUrl
      };

      await apiClient.post('spesen', { action: 'saveExpenses', pin, entries: [entry], metadata: { name } });
      
      showToast('Erfolgreich gespeichert!');
      // Reset form
      setStep(1);
      setImageDataUrl(null);
      setDatum('');
      setBetrag('');
      setBereich('');
      setKategorie('');
      setBeschreibung('');
      setNotiz('');
    } catch (err: any) {
      setError('Fehler: ' + err.message);
      showToast('Fehler aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Spesen-Assistent</h1>

      <div className={styles.stepper}>
        <div className={`${styles.step} ${step >= 1 ? styles.active : ''}`}>1. Leiter</div>
        <div className={`${styles.step} ${step >= 2 ? styles.active : ''}`}>2. Beleg</div>
        <div className={`${styles.step} ${step >= 3 ? styles.active : ''}`}>3. Daten</div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {step === 1 && (
          <form onSubmit={handleNextStep1} className={styles.form}>
            <div className={styles.formGroup}>
              <label>Leiter/in *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} required className={styles.input} />
            </div>
            <div className={styles.formGroup}>
              <label>Schar-PIN *</label>
              <input type="password" value={pin} onChange={e => setPin(e.target.value)} required className={styles.input} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Prüfe...' : 'Weiter zu Beleg'}
            </button>
          </form>
        )}

        {step === 2 && (
          <div className={styles.form}>
            {!imageDataUrl ? (
              <div className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                <div className={styles.uploadIcon}>📷</div>
                <h3>Beleg fotografieren</h3>
                <p>Das Formular wird automatisch ausgefüllt</p>
              </div>
            ) : (
              <div className={styles.previewZone}>
                <img src={imageDataUrl} alt="Beleg Vorschau" className={styles.previewImage} />
                <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current?.click()} style={{ width: '100%', marginTop: '1rem' }}>
                  Anderes Foto aufnehmen
                </button>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
              </div>
            )}

            {ocrStatus && (
              <div className={styles.ocrStatus}>
                {loading && <span className={styles.spinner}></span>}
                {ocrStatus}
              </div>
            )}

            <div className={styles.btnRow}>
              <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>Zurück</button>
              <button type="button" className="btn btn-primary" onClick={handleNextStep2} disabled={loading || !imageDataUrl}>
                Daten prüfen
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <form onSubmit={handleSave} className={styles.form}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Datum *</label>
                <input type="date" value={datum} onChange={e => setDatum(e.target.value)} required className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label>Betrag (CHF) *</label>
                <input type="number" step="0.01" value={betrag} onChange={e => setBetrag(e.target.value)} required className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label>Bereich *</label>
                <select value={bereich} onChange={e => { setBereich(e.target.value); setKategorie(''); }} required className={styles.input}>
                  <option value="">Auswählen...</option>
                  <option value="Lager">Lager</option>
                  <option value="Leitung">Leitung / Höck</option>
                  <option value="Gruppenstunde">Gruppenstunde</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Kategorie *</label>
                <select value={kategorie} onChange={e => setKategorie(e.target.value)} required className={styles.input}>
                  <option value="">{bereich ? 'Kategorie wählen...' : 'Zuerst Bereich wählen'}</option>
                  {getSubCategories().map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                <label>Beschreibung</label>
                <input type="text" value={beschreibung} onChange={e => setBeschreibung(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <label>Zahlungsart</label>
                <select value={zahlung} onChange={e => setZahlung(e.target.value)} className={styles.input}>
                  <option>Privat bezahlt</option>
                  <option>Schar-Karte</option>
                  <option>Rechnung an Schar</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Notiz (optional)</label>
                <input type="text" value={notiz} onChange={e => setNotiz(e.target.value)} className={styles.input} />
              </div>
            </div>

            <div className={styles.btnRow}>
              <button type="button" className="btn btn-outline" onClick={() => setStep(2)}>Zurück</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Wird gesendet...' : 'An Google senden'}
              </button>
            </div>
          </form>
        )}
      </div>

      {toastMsg && <div className={styles.toast}>{toastMsg}</div>}
    </div>
  );
};

export default ExpensesPage;
