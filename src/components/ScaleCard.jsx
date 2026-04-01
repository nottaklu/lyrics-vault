import React from 'react';
import { AudioLines } from 'lucide-react';

const ScaleCard = ({ scale, isPlaying, onAudioToggle }) => {
  return (
    <div className="song-card scale-card">
      <div className="scale-card-top">
        <span className="song-card-scale">{scale.type}</span>
        <span className="scale-root-pill">{scale.root}</span>
      </div>

      <div className="scale-card-body">
        <h3 className="song-card-title">{scale.label}</h3>
        <p className="scale-card-subtitle">Base note reference</p>
      </div>

      <div className="mini-pill-row">
        {scale.audioUrl ? (
          <button
            type="button"
            className={`mini-pill scale-audio-pill scale-audio-button ${isPlaying ? 'is-playing' : ''}`}
            onClick={onAudioToggle}
          >
            <AudioLines size={12} />
            <span>{isPlaying ? 'Stop audio' : 'Play audio'}</span>
          </button>
        ) : (
          <span className="mini-pill scale-audio-pill">
            <AudioLines size={12} />
            <span>Audio soon</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default ScaleCard;
