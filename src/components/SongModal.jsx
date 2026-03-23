import React from 'react';
import { X } from 'lucide-react';

const SongModal = ({ song, onClose }) => {
  if (!song) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {song.scale && <span style={{ fontSize: '12px', color: 'var(--accent)', fontWeight: '700' }}>{song.scale}</span>}
              {song.chords && <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>{song.chords}</span>}
            </div>
            <h2 style={{ marginTop: '4px', fontSize: '24px' }}>{song.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <pre className="lyrics-text" dangerouslySetInnerHTML={{ __html: song.lyrics }} />
        </div>
      </div>
    </div>
  );
};

export default SongModal;
