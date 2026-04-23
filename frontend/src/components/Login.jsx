import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import logo from '../assets/Marsamaroc-logo.png';
import './Login.css';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (requestError) {
      const message =
        requestError.response?.data?.message ||
        'Connexion impossible. Vérifiez vos identifiants.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="lp-root">
      <div className="lp-card">
        <div className="lp-logo-wrap">
          <img src={logo} alt="Marsa Maroc" className="lp-logo" />
        </div>

        <h1 className="lp-title">MarsaBot Factory</h1>

        <form className="lp-form" onSubmit={handleSubmit} noValidate>
          <div className="lp-field">
            <label htmlFor="lp-email">Adresse email</label>
            <input
              id="lp-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@marsamaroc.ma"
              required
              autoComplete="email"
            />
          </div>

          <div className="lp-field">
            <label htmlFor="lp-password">Mot de passe</label>
            <input
              id="lp-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p className="lp-error">{error}</p>}

          <button className="lp-btn" type="submit" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default Login;
