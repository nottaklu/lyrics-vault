import React, { useState, useEffect } from 'react';
import { Library, Plus, Music, Search as SearchIcon, Database as DbIcon, Edit2, Trash2, GripVertical } from 'lucide-react';
import SongCard from './components/SongCard';
import SongModal from './components/SongModal';
import SongForm from './components/SongForm';
import { db } from './db';
import { githubService } from './services/githubService';
import SyncSetup from './components/SyncSetup';
import './App.css';

const DEFAULT_SONGS = [
  {
    title: "Prem Ni Aa Season",
    scale: "D Minor",
    keywords: ["fast", "wedding"],
    lyrics: `[Verse 1]\nPrem ni aa season che\nHraday ma mara kevi che\nTara vina kem karvani\nPrem ni aa season che\n\n[Chorus]\nAavi ja tu pase mara\nDil ni vaato karvi che\nPrem ni aa season ma\nTari sathe revu che`
  },
  {
    title: "Tu Hi Re",
    scale: "G Major",
    keywords: ["romantic", "bollywood"],
    lyrics: `[Verse 1]\nTu hi re, tu hi re tere bina main kaise jiyu\nAaja re, aaja re, yu hi tadpa na tu mujhko\nJaan re, jaan re, in saanso mein bas ja tu\nChandani raat mein, teri yaad aaye...\n\n[Chorus]\nSadiyon se lambi hai raate\nSadiyon se soye nahi hum\nAa jao ki aankhein khuli hai\nTere hi intezaar mein...`
  }
];

function App() {
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [activeTab, setActiveTab] = useState('library');
  const [showSyncSetup, setShowSyncSetup] = useState(false);
  const [ghToken, setGhToken] = useState(githubService.getToken());

  const loadSongs = async () => {
    // 1. Load local DB first
    let localSongs = await db.songs.toArray();

    // 2. If empty, seed with defaults
    if (localSongs.length === 0) {
      const initial = DEFAULT_SONGS.map((s, i) => ({ ...s, order: i }));
      await db.songs.bulkAdd(initial);
      localSongs = await db.songs.toArray();
    }

    // 3. If GitHub token exists, MERGE GitHub songs into local
    if (ghToken) {
      try {
        const ghSongs = await githubService.getSongs();
        if (ghSongs && ghSongs.length > 0) {
          // Merge: add any GitHub songs that don't already exist locally (by title)
          const localTitles = new Set(localSongs.map(s => s.title.toLowerCase()));
          const newFromGH = ghSongs.filter(s => !localTitles.has(s.title.toLowerCase()));
          if (newFromGH.length > 0) {
            const maxOrder = localSongs.length > 0 ? Math.max(...localSongs.map(s => s.order || 0)) : -1;
            const toAdd = newFromGH.map((s, i) => ({ ...s, order: maxOrder + 1 + i }));
            await db.songs.bulkAdd(toAdd);
            localSongs = await db.songs.toArray();
          }
        }
      } catch (err) {
        console.error("GitHub sync failed, using local data:", err);
      }
    }

    // 4. Sort by order and display
    const sorted = localSongs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setSongs(sorted);
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const handleSaveSong = async (data) => {
    if (editingSong) {
      await db.songs.update(editingSong.id, data);
    } else {
      const all = await db.songs.toArray();
      const nextOrder = all.length > 0 ? Math.max(...all.map(s => s.order || 0)) + 1 : 0;
      await db.songs.add({ ...data, order: nextOrder });
    }

    // Try to sync to GitHub in the background (non-blocking)
    if (ghToken) {
      try {
        await githubService.saveSong({ ...data, id: editingSong?.id || Date.now() }, data.imageBlob);
      } catch (err) {
        console.error("GitHub push failed (saved locally):", err);
      }
    }

    await loadSongs();
    setShowAddForm(false);
    setEditingSong(null);
    setActiveTab('database');
  };

  const deleteSong = async (id) => {
    const song = songs.find(s => s.id === id);
    const title = song ? song.title : 'this song';
    if (window.confirm(`Delete "${title}"?`)) {
      await db.songs.delete(id);
      // Try to sync delete to GitHub
      if (ghToken) {
        try { await githubService.deleteSong(id); } catch (e) { console.error(e); }
      }
      await loadSongs();
    }
  };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('id', id);
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

    const updates = newSongs.map((s, i) => ({
      key: s.id,
      changes: { order: i }
    }));

    await Promise.all(updates.map(u => db.songs.update(u.key, u.changes)));
    setSongs(newSongs);
  };

  const filtered = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.keywords && s.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())))
  ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>{activeTab === 'database' ? 'Database' : 'Lyrics'}</h1>
      </header>

      <main className="content-area">
        {activeTab === 'library' && (
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

        {activeTab === 'database' && (
          <div className="database-view fade-in">
            <div className="db-list">
              {songs.map((s, index) => (
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

      {showSyncSetup && (
        <SyncSetup onComplete={(token) => {
          setGhToken(token);
          setShowSyncSetup(false);
          loadSongs();
        }} />
      )}
    </div>
  );
}

export default App;
