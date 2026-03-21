import React from 'react';

const SongCard = ({ song, onClick }) => {
  return (
    <div className="song-card" onClick={onClick}>
      {song.imageUrl && <img src={song.imageUrl} alt={song.title} loading="lazy" />}
      <div className="song-card-overlay">
        <h3 className="song-card-title">{song.title}</h3>
      </div>
    </div>
  );
};

export default SongCard;
