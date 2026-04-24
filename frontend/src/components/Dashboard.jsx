import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBot, getBots } from '../services/api';
import './Dashboard.css';

const initialForm = {
  nom: '',
  description: '',
  specialite_domaine: '',
  numero_telephone: '',
};

function Dashboard() {
  const navigate = useNavigate();
  const [bots, setBots] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  const fetchBots = async () => {
    try {
      setFetching(true);
      setError('');
      const { data } = await getBots();
      setBots(data.data || []);
    } catch (requestError) {
      const status = requestError.response?.status;
      if (status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
        return;
      }
      setError('Impossible de charger les bots pour le moment.');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createBot(form);
      setForm(initialForm);
      await fetchBots();
    } catch (requestError) {
      const status = requestError.response?.status;
      if (status === 401) {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
        return;
      }
      setError(requestError.response?.data?.message || 'La création du bot a échoué.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="db-root">
      <div className="db-page-header">
        <div>
          <h2 className="db-title">Mes Bots</h2>
          <p className="db-subtitle">Créez et supervisez vos chatbots WhatsApp.</p>
        </div>
        <button className="db-refresh-btn" type="button" onClick={fetchBots} disabled={fetching}>
          {fetching ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>

      {error ? <div className="db-error">{error}</div> : null}

      <section className="db-grid">
        <section className="db-panel">
          <div className="panel-header-inline">
            <div>
              <h2>Nouveau bot</h2>
              <p>Créez un agent WhatsApp prêt à être configuré.</p>
            </div>
            <span className="badge inactif">Admin</span>
          </div>

          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="nom">Nom du bot</label>
              <input
                id="nom"
                name="nom"
                type="text"
                placeholder="Ex: AssistBot Logistics"
                value={form.nom}
                onChange={handleChange}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="specialite_domaine">Domaine</label>
              <input
                id="specialite_domaine"
                name="specialite_domaine"
                type="text"
                placeholder="Ex: Logistique, Support, Tracking..."
                value={form.specialite_domaine}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Décrivez le rôle métier du bot..."
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="numero_telephone">Numéro WhatsApp</label>
              <input
                id="numero_telephone"
                name="numero_telephone"
                type="text"
                placeholder="Ex: +212600000000"
                value={form.numero_telephone}
                onChange={handleChange}
              />
            </div>

            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le bot'}
            </button>
          </form>
        </section>

        <section className="db-panel db-bots-panel">
          <div>
            <h2>Liste des bots</h2>
            <p>{bots.length} bot{bots.length > 1 ? 's' : ''} enregistré{bots.length > 1 ? 's' : ''} dans la plateforme.</p>
          </div>

          {fetching ? (
            <div className="empty-state">Chargement des bots en cours...</div>
          ) : bots.length === 0 ? (
            <div className="empty-state">Aucun bot disponible. Créez le premier depuis le panneau de gauche.</div>
          ) : (
            <div className="bots-grid">
              {bots.map((bot) => (
                <article key={bot.id} className="bot-card">
                  <div className="bot-card-header">
                    <span className="bot-name">{bot.nom}</span>
                    <span className={`badge ${bot.statut}`}>{bot.statut}</span>
                  </div>

                  {bot.description ? <p className="bot-desc">{bot.description}</p> : null}

                  <div className="bot-meta">
                    <span>Domaine: {bot.specialite_domaine || 'Non renseigné'}</span>
                    <span>WhatsApp: {bot.numero_telephone || 'Non renseigné'}</span>
                  </div>

                  <div className="bot-date">
                    Créé le {new Date(bot.date_creation).toLocaleDateString('fr-FR')}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}

export default Dashboard;
