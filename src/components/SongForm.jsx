import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

const SongForm = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    scale: '',
    chords: '',
    keywords: '',
    lyrics: ''
  });

  // If initialData keywords is an array, join it for the input field
  const keywordsInitial = Array.isArray(initialData?.keywords) 
    ? initialData.keywords.join(', ') 
    : (formData.keywords || '');

  const [keywordsDisplay, setKeywordsDisplay] = useState(keywordsInitial);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return;
    
    const keywordsArray = keywordsDisplay
      ? keywordsDisplay.split(',').map(k => k.trim()).filter(k => k !== '')
      : [];

    onSave({
      ...formData,
      keywords: keywordsArray
    });
  };

  return (
    <div className="modal-overlay form-modal" onClick={onCancel}>
      <div className="modal-content glass-morphism form-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initialData ? 'Edit Song' : 'New Song'}</h2>
          <button className="modal-close-btn" onClick={onCancel}>
            <X size={24} />
          </button>
        </div>
        
        <form className="modal-body song-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label-caps">Title</label>
            <input 
              type="text" 
              placeholder="Song title"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="label-caps">Scale</label>
              <input 
                type="text" 
                placeholder="e.g. D Minor"
                value={formData.scale}
                onChange={e => setFormData({...formData, scale: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label className="label-caps">Keywords (comma separated)</label>
              <input 
                type="text" 
                placeholder="fast, wedding, hits"
                value={keywordsDisplay}
                onChange={e => setKeywordsDisplay(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="label-caps">Chords</label>
            <input 
              type="text" 
              placeholder="e.g. Dm, G, C"
              value={formData.chords}
              onChange={e => setFormData({...formData, chords: e.target.value})}
            />
          </div>

          <div className="form-group flex-grow">
            <label className="label-caps">Lyrics</label>
            <textarea 
              placeholder="Paste lyrics here..."
              value={formData.lyrics}
              onChange={e => setFormData({...formData, lyrics: e.target.value})}
            />
          </div>

          <button type="submit" className="save-btn blur-bg">
            <Save size={20} />
            <span>{initialData ? 'Update Song' : 'Save Song'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default SongForm;
