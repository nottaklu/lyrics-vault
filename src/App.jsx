import React, { useState, useEffect } from 'react';
import { Library, Plus, X, Music, Search as SearchIcon, Database as DbIcon, Edit2, Trash2 } from 'lucide-react';
import SongCard from './components/SongCard';
import SongModal from './components/SongModal';
import SearchBar from './components/SearchBar';
import SongForm from './components/SongForm';
import { db } from './db';
import './App.css';

const DEFAULT_SONGS = [
  {
    title: "Prem Ni Aa Season",
    scale: "D Minor",
    chords: "Dm, G, C",
    keywords: ["festive", "energetic", "hits"],
    lyrics: `[Verse 1]\nPrem ni aa season che\nHraday ma mara kevi che\nTara vina kem karvani\nPrem ni aa season che\n\n[Chorus]\nAavi ja tu pase mara\nDil ni vaato karvi che\nPrem ni aa season ma\nTari sathe revu che`
  },
  {
    title: "Tu Hi Re",
    scale: "G Major",
    chords: "G, D, Em, C",
    keywords: ["romantic", "bollywood", "soulful"],
    lyrics: `[Verse 1]\nTu hi re, tu hi re tere bina main kaise jiyu\nAaja re, aaja re, yu hi tadpa na tu mujhko\nJaan re, jaan re, in saanso mein bas ja tu\nChandani raat mein, teri yaad aaye...\n\n[Chorus]\nSadiyon se lambi hai raate\nSadiyon se soye nahi hum\nAa jao ki aankhein khuli hai\nTere hi intezaar mein...`
  }
];

function App() {
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSong, setSelectedSong] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [activeTab, setActiveTab] = useState('library');

  // Load songs from DB
  const loadSongs = async () => {
    try {
      const allSongs = await db.songs.toArray();
      if (allSongs.length === 0) {
        await db.songs.bulkAdd(DEFAULT_SONGS);
        setSongs(await db.songs.toArray());
      } else {
        setSongs(allSongs);
      }
    } catch (err) {
      console.error("Failed to load songs:", err);
    }
  };

  useEffect(() => {
    loadSongs();
  }, []);

  const handleSaveSong = async (songData) => {
    try {
      if (editingSong) {
        await db.songs.update(editingSong.id, songData);
      } else {
        await db.songs.add(songData);
      }
      await loadSongs();
      setShowAddForm(false);
      setEditingSong(null);
      setActiveTab('database');
    } catch (err) {
      console.error("Failed to save song:", err);
    }
  };

  const handleDeleteSong = async (id) => {
    if (window.confirm('Delete this song permanently from database?')) {
      await db.songs.delete(id);
      await loadSongs();
    }
  };

  const filteredSongs = songs.filter(song => 
    song.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    song.keywords?.some(kw => kw.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-top">
          <h1>{activeTab === 'library' ? 'Lyrics' : activeTab === 'add' ? 'Add Song' : 'Database'}</h1>
          <div className="header-icon">
            <Music size={24} color="#007AFF" />
          </div>
        </div>
      </header>

      <main className="content-area">
        {activeTab === 'library' && (
          <div className="library-view fade-in">
            <div className="top-search-container">
              <div className="search-pill glass-morphism">
                <SearchIcon size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search songs or tags..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="top-search-input"
                />
                {searchQuery && (
                  <button className="clear-search" onClick={() => setSearchQuery('')}>
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="song-grid">
              {filteredSongs.map(song => (
                <SongCard 
                  key={song.id} 
                  song={song} 
                  onClick={() => setSelectedSong(song)} 
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'database' && (
          <div className="database-view fade-in">
            {songs.map(song => (
              <div key={song.id} className="db-list-item glass-morphism">
                <div className="db-item-info">
                  <h3>{song.title}</h3>
                  <span>{song.scale}</span>
                </div>
                <div className="db-item-actions">
                  <button className="icon-btn edit-btn" onClick={() => {
                    setEditingSong(song);
                    setShowAddForm(true);
                  }}>
                    <Edit2 size={18} />
                  </button>
                  <button className="icon-btn delete-btn" onClick={() => handleDeleteSong(song.id)}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="add-view fade-in" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <p style={{ color: '#888' }}>Ready to add a new song to your collection?</p>
            <p style={{ color: '#555', fontSize: '14px', marginTop: '10px' }}>Use the Add button in the dock below.</p>
          </div>
        )}
      </main>

      {/* Floating Bottom Nav - Compact Icons */}
      <nav className="floating-dock-container">
        <div className="floating-dock shadow-lg">
          <button 
            className={`dock-item ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => { setActiveTab('library'); setShowAddForm(false); }}
          >
            <Library size={22} />
          </button>
          
          <button 
            className={`dock-item ${activeTab === 'add' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('add');
              setEditingSong(null);
              setShowAddForm(true);
            }}
          >
            <Plus size={22} />
          </button>
          
          <button 
            className={`dock-item ${activeTab === 'database' ? 'active' : ''}`}
            onClick={() => { setActiveTab('database'); setShowAddForm(false); }}
          >
            <DbIcon size={22} />
          </button>
        </div>
      </nav>

      {/* Search Overlay */}
      {showSearch && (
        <div className="search-overlay">
          <div className="search-overlay-header">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <button className="close-overlay" onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
              <X size={24} />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Form Overlay */}
      {showAddForm && (
        <SongForm 
          onSave={handleSaveSong} 
          initialData={editingSong}
          onCancel={() => {
            setShowAddForm(false);
            setEditingSong(null);
            if (activeTab === 'add') setActiveTab('library');
          }} 
        />
      )}

      {/* Lyrics Modal */}
      {selectedSong && (
        <SongModal 
          song={selectedSong} 
          onClose={() => setSelectedSong(null)} 
        />
      )}
    </div>
  );
}

export default App;
