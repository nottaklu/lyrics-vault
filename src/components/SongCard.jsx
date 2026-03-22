import React from 'react';

const SongCard = ({ song, onClick }) => {
  return (
    <div className="song-card" onClick={onClick}>
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
