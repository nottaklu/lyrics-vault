import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';

const SongList = ({ songs, onEdit, onDelete }) => {
  return (
    <div className="song-list">
      {songs.map((song) => (
        <div key={song.id} className="song-list-item">
          <img 
            src={song.imageUrl} 
            className="thumb-small" 
            alt={song.title} 
          />
          <div className="item-main">
            <div style={{ fontWeight: 600, fontSize: 14 }}>{song.title}</div>
            <div className="pill-container" style={{ marginTop: 4 }}>
              {song.keywords && song.keywords.slice(0, 3).map((kw, i) => (
                <span key={i} className="pill" style={{ padding: '2px 8px', fontSize: 10 }}>{kw}</span>
              ))}
            </div>
          </div>
          <div className="item-actions">
            <button onClick={() => onEdit(song)} style={{ color: '#888' }}>
              <Edit2 size={18} />
            </button>
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this song?')) {
                  onDelete(song.id);
                }
              }} 
              style={{ color: '#888' }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
      {songs.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#888' }}>
          No songs found.
        </div>
      )}
    </div>
  );
};

export default SongList;
