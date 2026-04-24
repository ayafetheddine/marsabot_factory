import { useEffect, useRef, useState } from 'react';
import { addBotApiSource, deleteBotApiSource, deleteBotDocument, getBotApiSources, getBotDocuments, getBots, uploadKnowledgeFile } from '../services/api';
import './KnowledgeBase.css';

/* ── Icône nuage upload ── */
function IconUpload() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

/* ── Icône fichier PDF ── */
function IconFilePdf() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="15" x2="15" y2="15" />
      <line x1="9" y1="11" x2="15" y2="11" />
    </svg>
  );
}

/* ── Icône fichier CSV/Excel ── */
function IconFileSheet() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

/* ── Icône corbeille ── */
function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

/* ── Icône globe (source API) ── */
function IconGlobe() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

/* ── Utilitaires ── */
function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${Math.round(bytes / 1024)} Ko`;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt') return 'txt';
  if (ext === 'csv') return 'csv';
  return 'xlsx';
}

function DocIcon({ type }) {
  const cls = `kb-doc-icon ${type === 'pdf' ? 'pdf' : type === 'txt' ? 'csv' : 'xlsx'}`;
  return (
    <div className={cls}>
      {type === 'pdf' ? <IconFilePdf /> : <IconFileSheet />}
    </div>
  );
}

function KnowledgeBase() {
  const [bots, setBots] = useState([]);
  const [selectedBotId, setSelectedBotId] = useState('');
  const [activeTab, setActiveTab] = useState('files');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [apiSources, setApiSources] = useState([]);
  const [apiUrl, setApiUrl] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    getBots()
      .then(({ data }) => setBots(data.data || []))
      .catch(() => setBots([]));
  }, []);

  const fetchDocuments = () => {
    if (!selectedBotId) { setDocuments([]); setApiSources([]); return; }
    getBotDocuments(selectedBotId)
      .then(({ data }) => setDocuments(data.data || []))
      .catch(() => setDocuments([]));
    getBotApiSources(selectedBotId)
      .then(({ data }) => setApiSources(data.data || []))
      .catch(() => setApiSources([]));
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedBotId]);

  const handleDelete = async (docId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.')) return;
    try {
      await deleteBotDocument(selectedBotId, docId);
      fetchDocuments();
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la suppression.';
      alert(message);
    }
  };

  const handleAddApiSource = async () => {
    if (!selectedBotId) { alert('Veuillez sélectionner un bot.'); return; }
    if (!apiUrl.trim()) { alert('Veuillez entrer une URL.'); return; }
    try {
      await addBotApiSource(selectedBotId, apiUrl.trim());
      alert('Source API connectée avec succès !');
      setApiUrl('');
      fetchDocuments();
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la connexion.';
      alert(message);
    }
  };

  const handleDeleteApiSource = async (sourceId) => {
    if (!window.confirm('Supprimer cette source API ? Cette action est irréversible.')) return;
    try {
      await deleteBotApiSource(selectedBotId, sourceId);
      fetchDocuments();
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de la suppression.';
      alert(message);
    }
  };

  const sendFile = async (file) => {
    setIsUploading(true);
    try {
      await uploadKnowledgeFile(selectedBotId, file);
      alert('Fichier envoyé avec succès !');
      fetchDocuments();
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur lors de l\'envoi du fichier.';
      alert(message);
    } finally {
      setIsUploading(false);
    }
  };

  /* ── Handlers fichiers ── */
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    files.forEach((file) => sendFile(file));
    event.target.value = '';
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragOver(false);
    if (!selectedBotId || isUploading) return;
    const files = Array.from(event.dataTransfer.files);
    files.forEach((file) => sendFile(file));
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    if (selectedBotId && !isUploading) setIsDragOver(true);
  };
  const handleDragLeave = () => setIsDragOver(false);

  return (
    <div className="kb-root">
      {/* ── En-tête ── */}
      <div className="kb-page-header">
        <h1 className="kb-title">Base de Connaissances</h1>
        <p className="kb-subtitle">
          Importez les documents (PDF, TXT, Excel, CSV) qui serviront de base de données à vos agents IA.
        </p>
      </div>

      {/* ── Sélecteur de bot ── */}
      <div className="kb-bot-selector">
        <label htmlFor="kb-bot-select" className="kb-bot-label">Bot cible</label>
        <select
          id="kb-bot-select"
          className="kb-bot-select"
          value={selectedBotId}
          onChange={(e) => setSelectedBotId(e.target.value)}
        >
          <option value="">— Sélectionnez le bot à configurer —</option>
          {bots.map((bot) => (
            <option key={bot.id} value={bot.id}>{bot.nom}</option>
          ))}
        </select>
      </div>

      {/* ── Onglets ── */}
      <div className="kb-tabs">
        <button
          type="button"
          className={`kb-tab${activeTab === 'files' ? ' kb-tab--active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          Fichiers Locaux
        </button>
        <button
          type="button"
          className={`kb-tab${activeTab === 'api' ? ' kb-tab--active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          Connexion API
        </button>
      </div>

      {/* ── Contenu onglet Fichiers ── */}
      {activeTab === 'files' && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.xlsx,.csv"
            multiple
            hidden
            onChange={handleFileSelect}
          />
          <div
            className={`kb-dropzone${isDragOver ? ' kb-dropzone--over' : ''}${!selectedBotId || isUploading ? ' kb-dropzone--locked' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="kb-dropzone-icon"><IconUpload /></div>
            {isUploading ? (
              <p className="kb-dropzone-text">⏳ Envoi en cours...</p>
            ) : selectedBotId ? (
              <p className="kb-dropzone-text">Glissez et déposez vos fichiers ici</p>
            ) : (
              <p className="kb-dropzone-warning">⚠️ Veuillez d'abord sélectionner un bot à configurer</p>
            )}
            <p className="kb-dropzone-hint">PDF, TXT, Excel, CSV — 20 Mo max par fichier</p>
            <button
              type="button"
              className="kb-browse-btn"
              disabled={!selectedBotId || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? 'Envoi...' : 'Parcourir les fichiers'}
            </button>
          </div>
        </>
      )}

      {/* ── Contenu onglet API ── */}
      {activeTab === 'api' && (
        <div className="kb-api-form">
          <div className="kb-api-field">
            <label htmlFor="kb-api-url" className="kb-api-label">URL de l'API externe</label>
            <input
              id="kb-api-url"
              type="url"
              className="kb-api-input"
              placeholder="https://api.marsamaroc.ma/tracking..."
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
            />
          </div>
          <button type="button" className="kb-browse-btn" onClick={handleAddApiSource}>
            Connecter la source
          </button>
        </div>
      )}

      {/* ── Sources de connaissances ── */}
      <div className="kb-docs-section">
        <h2 className="kb-docs-title">Sources de connaissances</h2>
        {!selectedBotId ? (
          <div className="kb-empty">Sélectionnez un bot pour voir ses sources.</div>
        ) : documents.length === 0 && apiSources.length === 0 ? (
          <div className="kb-empty">Aucune source indexée pour le moment.</div>
        ) : (
          <ul className="kb-docs-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {documents.map((doc) => {
              const type = getFileType(doc.nom_original);
              return (
                <li key={`doc-${doc.id}`} className="kb-doc-card">
                  <DocIcon type={type} />
                  <div className="kb-doc-info">
                    <p className="kb-doc-name">{doc.nom_original}</p>
                    <p className="kb-doc-meta">Ajouté le {formatDate(doc.date_ajout)} · {formatSize(doc.taille)}</p>
                  </div>
                  <button
                    type="button"
                    className="kb-doc-delete"
                    title="Supprimer le document"
                    aria-label={`Supprimer ${doc.nom_original}`}
                    onClick={() => handleDelete(doc.id)}
                  >
                    <IconTrash />
                  </button>
                </li>
              );
            })}
            {apiSources.map((source) => (
              <li key={`api-${source.id}`} className="kb-doc-card">
                <div className="kb-doc-icon api">
                  <IconGlobe />
                </div>
                <div className="kb-doc-info">
                  <p className="kb-doc-name">{source.url}</p>
                  <p className="kb-doc-meta">Connectée le {formatDate(source.date_ajout)}</p>
                </div>
                <button
                  type="button"
                  className="kb-doc-delete"
                  title="Supprimer la source API"
                  aria-label={`Supprimer ${source.url}`}
                  onClick={() => handleDeleteApiSource(source.id)}
                >
                  <IconTrash />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default KnowledgeBase;
