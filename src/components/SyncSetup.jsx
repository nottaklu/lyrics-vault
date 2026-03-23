import React, { useState } from 'react';
import { githubService } from '../services/githubService';

const SyncSetup = ({ onComplete }) => {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) return;

    setTesting(true);
    setError('');

    try {
      githubService.setToken(token.trim());
      await githubService.getSongs();
      onComplete(token.trim());
    } catch (err) {
      setError('Invalid token. Make sure it has repo access.');
      githubService.setToken('');
    }
    setTesting(false);
  };

  return (
    <div className="sync-setup-overlay">
      <div className="sync-setup-card">
        <h2>Enter the Key</h2>
        <p className="sync-description">
          Paste your GitHub Personal Access Token to sync your lyrics across all devices.
        </p>
        <form className="sync-form" onSubmit={handleSubmit}>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxx"
            autoComplete="off"
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={testing}>
            {testing ? 'Verifying...' : 'Connect'}
          </button>
        </form>
        <a
          href="https://github.com/settings/tokens"
          target="_blank"
          rel="noopener noreferrer"
          className="token-link"
        >
          Generate token on GitHub →
        </a>
      </div>
    </div>
  );
};

export default SyncSetup;
