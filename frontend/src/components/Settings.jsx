import { useEffect, useState } from 'react';
import { getSystemSettings, updateSystemSettings } from '../services/api';
import './Settings.css';

function IconServer() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}

function Settings() {
  const [ollamaUrl, setOllamaUrl] = useState('');
  const [ollamaModel, setOllamaModel] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => {
    getSystemSettings()
      .then(({ data }) => {
        const s = data.data || {};
        setOllamaUrl(s.ollama_url || 'http://localhost:11434');
        setOllamaModel(s.ollama_default_model || 'phi3');
      })
      .catch(() => {
        setOllamaUrl('http://localhost:11434');
        setOllamaModel('phi3');
      });
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setSavedAt(null);
    try {
      await updateSystemSettings({
        ollama_url: ollamaUrl.trim(),
        ollama_default_model: ollamaModel.trim(),
      });
      setSavedAt(new Date());
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la sauvegarde.';
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="st-root">
      {/* ── En-tête ── */}
      <div className="st-page-header">
        <h1 className="st-title">Configuration du Moteur IA (Local)</h1>
        <p className="st-subtitle">
          Tous les traitements sont effectués localement via Ollama. Aucune donnée ne quitte votre infrastructure.
        </p>
      </div>

      {/* ── Badge souveraineté ── */}
      <div className="st-security-badge">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        100% On-Premise · Souveraineté des données garantie
      </div>

      {/* ── Section Ollama ── */}
      <form className="st-card" onSubmit={handleSave}>
        <h2 className="st-card-title">
          <IconServer />
          Serveur Ollama
        </h2>
        <p className="st-card-desc">
          Ollama doit être installé et en cours d'exécution sur ce serveur.
          Les bots utiliseront ce moteur pour générer leurs réponses.
        </p>

        <div className="st-field">
          <label htmlFor="st-ollama-url" className="st-label">URL de l'API Ollama</label>
          <input
            id="st-ollama-url"
            type="url"
            className="st-input"
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            placeholder="http://localhost:11434"
            required
          />
          <p className="st-input-hint">Adresse locale du serveur Ollama (ex : http://localhost:11434)</p>
        </div>

        <div className="st-field">
          <label htmlFor="st-ollama-model" className="st-label">Modèle par défaut</label>
          <input
            id="st-ollama-model"
            type="text"
            className="st-input"
            value={ollamaModel}
            onChange={(e) => setOllamaModel(e.target.value)}
            placeholder="phi3"
            required
          />
          <p className="st-input-hint">Nom du modèle tel qu'affiché par <code>ollama list</code> (ex : phi3, llama3, mistral)</p>
        </div>

        <div className="st-actions">
          <button type="submit" className="st-save-btn" disabled={isSaving}>
            {isSaving ? 'Sauvegarde…' : 'Sauvegarder'}
          </button>
          {savedAt && (
            <span className="st-feedback">
              ✓ Paramètres sauvegardés
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

export default Settings;
