import React, { useState, useEffect } from 'react';
import { Library, Plus, Search as SearchIcon, Database as DbIcon, Edit2, Trash2, GripVertical } from 'lucide-react';
import SongCard from './components/SongCard';
import SongModal from './components/SongModal';
import SongForm from './components/SongForm';
import { githubService } from './services/githubService';
import SyncSetup from './components/SyncSetup';
import './App.css';

function App() {
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [activeTab, setActiveTab] = useState('library');
  const [ghToken, setGhToken] = useState(githubService.getToken());
  const [loading, setLoading] = useState(true);

  // Load songs from GitHub only
  const loadSongs = async () => {
    if (!ghToken) { setLoading(false); return; }
    setLoading(true);
    try {
      const ghSongs = await githubService.getSongs();
      const sorted = (ghSongs || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setSongs(sorted);
    } catch (err) {
      console.error("Failed to load from GitHub:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSongs();
  }, [ghToken]);

  // Save: update songs.json on GitHub directly
  const handleSaveSong = async (data) => {
    try {
      // Always fetch fresh to get latest SHA
      const songsFile = await githubService.fetchFile('data/songs.json');
      const currentSongs = songsFile ? songsFile.content : [];

      let updatedSongs;
      if (editingSong) {
        updatedSongs = currentSongs.map(s =>
          s.id === editingSong.id ? { ...s, ...data, keywords: data.keywords } : s
        );
      } else {
        const maxOrder = currentSongs.length > 0 ? Math.max(...currentSongs.map(s => s.order || 0)) : -1;
        const newSong = {
          ...data,
          id: Date.now(),
          order: maxOrder + 1,
          createdAt: new Date().toISOString()
        };
        updatedSongs = [...currentSongs, newSong];
      }

      await githubService.uploadFile(
        'data/songs.json',
        JSON.stringify(updatedSongs, null, 2),
        editingSong ? `Update: ${data.title}` : `Add: ${data.title}`,
        songsFile?.sha
      );

      await loadSongs();
      setShowAddForm(false);
      setEditingSong(null);
      setActiveTab('database');
    } catch (err) {
      console.error("Save failed:", err);
      // Show the REAL API error so we can debug
      alert("Save failed: " + err.message);
    }
  };

  // Delete: remove from songs.json on GitHub
  const deleteSong = async (id) => {
    const song = songs.find(s => s.id === id);
    const title = song ? song.title : 'this song';
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      const songsFile = await githubService.fetchFile('data/songs.json');
      if (!songsFile) return;
      const updatedSongs = songsFile.content.filter(s => s.id !== id);
      await githubService.uploadFile(
        'data/songs.json',
        JSON.stringify(updatedSongs, null, 2),
        `Delete: ${title}`,
        songsFile.sha
      );
      await loadSongs();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete. Check your connection.");
    }
  };

  // Drag & drop reorder: save new order to GitHub
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('id', String(id));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetId) => {
    const sourceId = parseInt(e.dataTransfer.getData('id'));
    if (sourceId === targetId) return;

    const sourceIndex = songs.findIndex(s => s.id === sourceId);
    const targetIndex = songs.findIndex(s => s.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newSongs = [...songs];
    const [movedSong] = newSongs.splice(sourceIndex, 1);
    newSongs.splice(targetIndex, 0, movedSong);

    // Assign new orders
    const reordered = newSongs.map((s, i) => ({ ...s, order: i }));
    setSongs(reordered); // Instant UI update

    // Push reordered list to GitHub
    try {
      const songsFile = await githubService.fetchFile('data/songs.json');
      await githubService.uploadFile(
        'data/songs.json',
        JSON.stringify(reordered, null, 2),
        'Reorder songs',
        songsFile?.sha
      );
    } catch (err) {
      console.error("Reorder sync failed:", err);
    }
  };

  const filtered = songs.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.keywords && s.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())))
  ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // If no token, show sync setup
  if (!ghToken) {
    return <SyncSetup onComplete={(token) => {
      setGhToken(token);
    }} />;
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>{activeTab === 'database' ? 'Database' : 'Lyrics'}</h1>
      </header>

      <main className="content-area">
        {loading && <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>Loading from cloud...</p>}

        {!loading && activeTab === 'library' && (
          <div className="library-view fade-in">
            <div className="search-bar-container">
              <div className="search-pill">
                <SearchIcon size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search songs or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="song-grid">
              {filtered.map(s => (
                <SongCard key={s.id} song={s} onClick={() => setSelectedSong(s)} />
              ))}
            </div>
          </div>
        )}

        {!loading && activeTab === 'database' && (
          <div className="database-view fade-in">
            <div className="db-list">
              {songs.map((s) => (
                <div
                  key={s.id}
                  className="db-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, s.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, s.id)}
                >
                  <div className="db-item-content">
                    <div className="drag-handle">
                      <GripVertical size={18} />
                    </div>
                    <div className="db-info">
                      <h3>{s.title}</h3>
                      <span>{s.scale}</span>
                    </div>
                  </div>
                  <div className="db-item-actions">
                    <button className="icon-btn edit-btn" onClick={() => { setEditingSong(s); setShowAddForm(true); }}>
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn delete-btn" onClick={() => deleteSong(s.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <nav className="floating-dock-container">
        <div className="floating-dock">
          <button className={`dock-item ${activeTab === 'library' ? 'active' : ''}`} onClick={() => { setActiveTab('library'); setShowAddForm(false); }}>
            <Library size={20} />
          </button>
          <button className="dock-item" onClick={() => { setEditingSong(null); setShowAddForm(true); }}>
            <Plus size={20} />
          </button>
          <button className={`dock-item ${activeTab === 'database' ? 'active' : ''}`} onClick={() => { setActiveTab('database'); setShowAddForm(false); }}>
            <DbIcon size={20} />
          </button>
        </div>
      </nav>

      {showAddForm && (
        <SongForm
          onSave={handleSaveSong}
          initialData={editingSong}
          onCancel={() => { setShowAddForm(false); setEditingSong(null); }}
        />
      )}

      {selectedSong && (
        <SongModal song={selectedSong} onClose={() => setSelectedSong(null)} />
      )}
    </div>
  );
}

export default App;
