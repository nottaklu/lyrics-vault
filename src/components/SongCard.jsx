import React from 'react';

const SongCard = ({ song, onClick }) => {
  return (
    <div className="song-card text-card" onClick={onClick}>
      <div className="song-card-content">
        <span className="song-card-scale">{song.scale || 'Standard'}</span>
        <h3 className="song-card-title">{song.title}</h3>
        <div className="song-card-keywords">
          {song.keywords?.slice(0, 2).map((kw, i) => (
            <span key={i} className="mini-pill">{kw}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SongCard;
