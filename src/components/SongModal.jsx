import React from 'react';
import { X, Guitar, Music } from 'lucide-react';

const SongModal = ({ song, onClose }) => {
  if (!song) return null;

  return (
    <div className="modal-overlay lyrics-modal" onClick={onClose}>
      <div className="modal-content glass-morphism" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <span className="modal-scale-badge">{song.scale}</span>
            <h2 className="modal-title">{song.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="modal-body lyrics-body">
          <div className="lyrics-container">
            <pre className="lyrics-text">{song.lyrics}</pre>
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-item">
            <Guitar size={18} />
            <span>{song.chords || 'No chords'}</span>
          </div>
          <div className="footer-item">
            <Music size={18} />
            <span>{song.keywords?.join(', ')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongModal;
