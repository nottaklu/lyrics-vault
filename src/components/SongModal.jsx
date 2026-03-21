import React from 'react';
import { X, Music, Guitar } from 'lucide-react';

const SongModal = ({ song, onClose }) => {
  if (!song) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-header">
        <h2 style={{ fontWeight: 400 }}>{song.title}</h2>
        <button onClick={onClose} aria-label="Close">
          <X size={24} />
        </button>
      </div>
      
      {song.imageUrl && <img src={song.imageUrl} className="lyrics-image" alt="Lyrics" />}
      
      <div className="song-info">
        {(song.scale || song.chords) && (
          <div style={{ marginBottom: 24 }}>
            {song.scale && (
              <div className="info-row">
                <span className="label-caps" style={{ display: 'flex', alignItems: 'center gap: 8px' }}>
                  <Music size={14} /> Scale
                </span>
                <span style={{ fontWeight: 500 }}>{song.scale}</span>
              </div>
            )}
            {song.chords && (
              <div className="info-row">
                <span className="label-caps" style={{ display: 'flex', alignItems: 'center gap: 8px' }}>
                  <Guitar size={14} /> Chords
                </span>
                <span style={{ fontWeight: 500 }}>{song.chords}</span>
              </div>
            )}
          </div>
        )}
        
        {song.keywords && song.keywords.length > 0 && (
          <div>
            <span className="label-caps">Keywords</span>
            <div className="pill-container" style={{ marginTop: 8 }}>
              {song.keywords.map((kw, i) => (
                <span key={i} className="pill">{kw}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SongModal;
