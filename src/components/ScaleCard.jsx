import React from 'react';
import { AudioLines } from 'lucide-react';

const ScaleCard = ({ scale, isPlaying, onAudioToggle, onTransposeOpen }) => {
  return (
    <div id={`scale-card-${scale.id}`} className="song-card scale-card">
      <div className="scale-card-top">
        <span className="song-card-scale">{scale.type}</span>
        <span className="scale-root-pill">{scale.root}</span>
      </div>

      <div className="scale-card-body">
        <h3 className="song-card-title">{scale.shortLabel}</h3>
        <p className="scale-note-label">{scale.noteLabel}</p>
      </div>

      <div className="scale-card-actions">
        <button
          type="button"
          className="mini-pill scale-audio-pill scale-transpose-button"
          onClick={onTransposeOpen}
        >
          <span>Transpose</span>
        </button>

        {scale.audioUrl ? (
          <button
            type="button"
            className={`mini-pill scale-audio-pill scale-audio-button ${isPlaying ? 'is-playing' : ''}`}
            onClick={onAudioToggle}
          >
            <AudioLines size={12} />
            <span>{isPlaying ? 'Stop' : 'Play'}</span>
          </button>
        ) : (
          <span className="mini-pill scale-audio-pill">
            <AudioLines size={12} />
            <span>Soon</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default ScaleCard;
