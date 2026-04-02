import React from 'react';

const SongCard = ({ song, onClick, index = 0 }) => {
  return (
    <div
      className="song-card tile-animate"
      style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
      onClick={onClick}
    >
      <span className="song-card-scale">{song.scale}</span>
      <h3 className="song-card-title">{song.title}</h3>
      <div className="mini-pill-row">
        {(song.keywords || []).slice(0, 2).map((k, i) => (
          <span key={i} className="mini-pill">{k}</span>
        ))}
      </div>
    </div>
  );
};

export default SongCard;
