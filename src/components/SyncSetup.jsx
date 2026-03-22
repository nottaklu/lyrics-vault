import React, { useState } from 'react';
import { githubService } from '../services/githubService';
import { Cloud, Key, ShieldCheck } from 'lucide-react';

const SyncSetup = ({ onComplete }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Test the token
      githubService.setToken(token);
      await githubService.getSongs();
      onComplete(token);
    } catch (err) {
      setError('Invalid token or no access to repository. Please verify permissions.');
      githubService.setToken('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sync-setup-overlay fade-in">
      <div className="sync-setup-card glass-morphism">
        <div className="sync-icon-row">
          <Cloud size={48} className="cloud-icon" />
        </div>
        <h2>Enable Multi-Device Sync</h2>
        <p className="sync-description">
          Enter your GitHub Personal Access Token to sync your lyrics and images across all your devices.
        </p>
        
        <form onSubmit={handleSubmit} className="sync-form">
          <div className="input-group">
            <Key size={18} className="input-icon" />
            <input 
              type="password" 
              placeholder="GitHub Token (fine-grained)" 
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
          </div>
          
          {error && <p className="error-text">{error}</p>}
          
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Enable Sync & Recover Data'}
          </button>
        </form>
        
        <div className="security-note">
          <ShieldCheck size={14} />
          <span>Your token is stored locally and never leaves your browser except to talk to GitHub.</span>
        </div>
        
        <a 
          href="https://github.com/settings/tokens" 
          target="_blank" 
          rel="noopener noreferrer"
          className="token-link"
        >
          Create token on GitHub &rarr;
        </a>
      </div>
    </div>
  );
};

export default SyncSetup;
