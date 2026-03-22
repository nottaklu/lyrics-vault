import React, { useState, useEffect } from 'react';
import { Library, Plus, Music, Search as SearchIcon, Database as DbIcon, Edit2, Trash2 } from 'lucide-react';
import SongCard from './components/SongCard';
import SongModal from './components/SongModal';
import SongForm from './components/SongForm';
import { db } from './db';
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

  const loadSongs = async () => {
    const all = await db.songs.toArray();
    if (all.length === 0) {
      await db.songs.bulkAdd(DEFAULT_SONGS);
      setSongs(await db.songs.toArray());
    } else {
      setSongs(all);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const handleSaveSong = async (data) => {
    if (editingSong) {
      await db.songs.update(editingSong.id, data);
    } else {
      await db.songs.add(data);
    }
    await loadSongs();
    setShowAddForm(false);
    setEditingSong(null);
    setActiveTab('database');
  };

  const deleteSong = async (id) => {
    if (window.confirm('Delete?')) {
      await db.songs.delete(id);
      await loadSongs();
    }
  };

  const filtered = songs.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.keywords && s.keywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>{activeTab === 'database' ? 'Database' : 'Lyrics'}</h1>
        <Music size={24} style={{ color: 'var(--accent)' }} />
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
              {songs.map(s => (
                <div key={s.id} className="db-item">
                  <div className="db-info">
                    <h3>{s.title}</h3>
                    <span>{s.scale}</span>
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
