import React, { useState, useEffect } from 'react';
import { Upload, X } from 'lucide-react';
import Spinner from './Spinner';

const SongForm = ({ onSubmit, initialData, isUpdating }) => {
  const [title, setTitle] = useState('');
  const [scale, setScale] = useState('');
  const [chords, setChords] = useState('');
  const [keywords, setKeywords] = useState('');
  const [imageBlob, setImageBlob] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setScale(initialData.scale || '');
      setChords(initialData.chords || '');
      setKeywords(initialData.keywords ? initialData.keywords.join(', ') : '');
      setImageBlob(initialData.imageBlob || null);
      if (initialData.imageBlob) {
        setPreviewUrl(URL.createObjectURL(initialData.imageBlob));
      }
    } else {
      resetForm();
    }
  }, [initialData]);

  const resetForm = () => {
    setTitle('');
    setScale('');
    setChords('');
    setKeywords('');
    setImageBlob(null);
    setPreviewUrl('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageBlob(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !imageBlob) {
      alert('Please provide at least a title and an image.');
      return;
    }

    setLoading(true);
    const keywordArray = keywords
      .split(',')
      .map((kw) => kw.trim())
      .filter((kw) => kw !== '');

    const songData = {
      title,
      scale,
      chords,
      keywords: keywordArray,
      imageBlob,
    };

    try {
      await onSubmit(songData);
      if (!isUpdating) resetForm();
    } catch (error) {
      console.error('Error saving song:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="song-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Song Title</label>
        <input
          type="text"
          className="input-field"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Prem Ni Aa Season"
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Lyrics Image</label>
        <div 
          className="image-upload-zone" 
          onClick={() => document.getElementById('imageInput').click()}
          style={{
            border: '1px dashed #E0E0E0',
            borderRadius: '12px',
            height: '200px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'pointer',
            overflow: 'hidden',
            background: '#FFF'
          }}
        >
          {previewUrl ? (
            <img src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
          ) : (
            <>
              <Upload size={32} color="#888" />
              <span style={{ color: '#888', marginTop: 8, fontSize: 13 }}>Tap to upload (Photograph of Lyrics)</span>
            </>
          )}
        </div>
        <input
          id="imageInput"
          type="file"
          accept="image/*"
          hidden
          onChange={handleImageChange}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="form-group">
          <label className="form-label">Scale</label>
          <input
            type="text"
            className="input-field"
            value={scale}
            onChange={(e) => setScale(e.target.value)}
            placeholder="e.g. D Minor"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Chords</label>
          <input
            type="text"
            className="input-field"
            value={chords}
            onChange={(e) => setChords(e.target.value)}
            placeholder="e.g. Dm, G, C"
          />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Keywords (comma separated)</label>
        <input
          type="text"
          className="input-field"
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          placeholder="e.g. energetic, wedding, slow"
        />
        {keywords && (
          <div className="pill-container">
            {keywords.split(',').map((kw, i) => kw.trim() && (
              <span key={i} className="pill">{kw.trim()}</span>
            ))}
          </div>
        )}
      </div>

      <button type="submit" className="save-btn" disabled={loading}>
        {loading ? <div style={{ display: 'flex', justifyContent: 'center' }}><Spinner /></div> : (isUpdating ? 'Update Song' : 'Save Song')}
      </button>
    </form>
  );
};

export default SongForm;
