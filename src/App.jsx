import React, { useState, useEffect } from 'react';
import { Library, PlusCircle, Settings, Github, Key } from 'lucide-react';
import SearchBar from './components/SearchBar';
import SongCard from './components/SongCard';
import SongModal from './components/SongModal';
import SongForm from './components/SongForm';
import SongList from './components/SongList';
import Toast from './components/Toast';
import { githubService } from './services/githubService';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('library');
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [editingSong, setEditingSong] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [token, setToken] = useState(githubService.getToken() || '');
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!githubService.getToken());

  // Fetch songs on load
  useEffect(() => {
    if (isLoggedIn) {
      loadSongs();
    }
  }, [isLoggedIn]);

  const loadSongs = async () => {
    setLoading(true);
    try {
      const allSongs = await githubService.getSongs();
      setSongs(allSongs);
    } catch (error) {
      console.error(error);
      showToast('Error syncing with GitHub');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (token.trim()) {
      githubService.setToken(token);
      setIsLoggedIn(true);
      showToast('GitHub Sync Active ✓');
    }
  };

  const handleLogout = () => {
    githubService.setToken('');
    setToken('');
    setIsLoggedIn(false);
    setSongs([]);
  };

  const handleAddSong = async (songData) => {
    try {
      const newSong = await githubService.saveSong(songData, songData.imageBlob);
      setSongs([newSong, ...songs]);
      showToast('Song saved to GitHub ✓');
      setActiveTab('library');
    } catch (error) {
      console.error(error);
      showToast('Error saving song');
    }
  };

  const handleUpdateSong = async (songData) => {
    try {
      await githubService.updateSong(editingSong.id, songData, songData.imageBlob);
      await loadSongs();
      showToast('Song updated on GitHub ✓');
      setEditingSong(null);
      setActiveTab('library');
    } catch (error) {
      console.error(error);
      showToast('Error updating song');
    }
  };

  const handleDeleteSong = async (id) => {
    try {
      await githubService.deleteSong(id);
      setSongs(songs.filter(s => s.id !== id));
      showToast('Song deleted');
    } catch (error) {
      console.error(error);
      showToast('Error deleting song');
    }
  };

  const filteredSongs = songs.filter(song => 
    song.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (song.keywords && song.keywords.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  if (!isLoggedIn) {
    return (
      <div className="app-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Github size={64} style={{ marginBottom: 20 }} />
          <h1>Lyrics Vault</h1>
          <p style={{ color: '#888', marginTop: 12 }}>Connect your GitHub to sync lyrics across all your devices.</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Personal Access Token</label>
            <div style={{ position: 'relative' }}>
              <Key size={18} style={{ position: 'absolute', left: 14, top: 14, color: '#888' }} />
              <input
                type="password"
                className="input-field"
                style={{ paddingLeft: 42 }}
                placeholder="Paste your token here..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                required
              />
            </div>
            <p style={{ fontSize: 12, color: '#888', marginTop: 12 }}>
              Your token stays in this browser and is only used to save your lyrics to your repository.
            </p>
          </div>
          <button type="submit" className="save-btn">Connect & Sync</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app-container">
      {activeTab === 'library' ? (
        <div className="page-library">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          
          {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner /></div>}
          
          <div className="song-grid">
            {filteredSongs.map(song => (
              <SongCard 
                key={song.id} 
                song={song} 
                onClick={() => setSelectedSong(song)} 
              />
            ))}
          </div>

          {!loading && filteredSongs.length === 0 && (
            <div style={{ padding: '80px 20px', textAlign: 'center', color: '#888' }}>
              <p>No songs found in your library.</p>
            </div>
          )}
        </div>
      ) : activeTab === 'manage' ? (
        <div className="page-manage content-section">
          <h2 style={{ marginBottom: 24 }}>{editingSong ? 'Edit Song' : 'Add New Song'}</h2>
          
          <SongForm 
            onSubmit={editingSong ? handleUpdateSong : handleAddSong} 
            initialData={editingSong}
            isUpdating={!!editingSong}
          />

          <h2 style={{ marginTop: 48, marginBottom: 16 }}>Your Songs</h2>
          <SongList 
            songs={songs} 
            onEdit={(song) => {
              setEditingSong(song);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDelete={handleDeleteSong}
          />
        </div>
      ) : (
        <div className="page-settings content-section">
          <h2 style={{ marginBottom: 24 }}>Settings</h2>
          <div className="form-group">
            <label className="label-caps">Syncing with GitHub</label>
            <div style={{ background: 'white', padding: 16, borderRadius: 12, border: '1px solid var(--border-color)', marginTop: 8 }}>
              <div style={{ fontWeight: 600 }}>nottaklu / lyrics-vault</div>
              <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>You are signed in with a Personal Access Token.</div>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            style={{ color: '#FF3B30', fontWeight: 600, padding: '16px 0' }}
          >
            Disconnect Account & Wipe Local Token
          </button>
        </div>
      )}

      {/* Tabs */}
      <nav className="tab-bar">
        <button 
          className={`tab-item ${activeTab === 'library' ? 'active' : ''}`}
          onClick={() => setActiveTab('library')}
        >
          <Library size={24} />
          <span>Library</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'manage' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('manage');
            if (activeTab === 'manage') setEditingSong(null);
          }}
        >
          <PlusCircle size={24} />
          <span>Add / Edit</span>
        </button>
        <button 
          className={`tab-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={24} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Modal */}
      {selectedSong && (
        <SongModal 
          song={selectedSong} 
          onClose={() => setSelectedSong(null)} 
        />
      )}

      {/* Toast */}
      <Toast message={toastMessage} />
    </div>
  );
}

// Inline Spinner and Icon
const Spinner = () => <div className="spinner"></div>;

export default App;
