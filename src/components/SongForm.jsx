import React, { useState } from 'react';
import { X, Save } from 'lucide-react';

const SongForm = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState(initialData || {
    title: '',
    scale: '',
    keywords: '',
    lyrics: ''
  });

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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 style={{ fontSize: '24px' }}>{initialData ? 'Edit Song' : 'New Song'}</h2>
          <button className="modal-close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Song title"
                required
              />
            </div>
            <div className="form-group">
              <label>Scale</label>
              <input 
                type="text" 
                value={formData.scale}
                onChange={e => setFormData({...formData, scale: e.target.value})}
                placeholder="e.g. D Minor"
              />
            </div>
            <div className="form-group">
              <label>Keywords</label>
              <input 
                type="text" 
                value={keywordsDisplay}
                onChange={e => setKeywordsDisplay(e.target.value)}
                placeholder="fast, hits, energetic"
              />
            </div>
            <div className="form-group">
              <label>Lyrics</label>
              <textarea 
                value={formData.lyrics}
                onChange={e => setFormData({...formData, lyrics: e.target.value})}
                placeholder="Paste lyrics here..."
              ></textarea>
            </div>
            <button type="submit" className="save-btn">
              <Save size={20} />
              <span>{initialData ? 'Update Song' : 'Save Song'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SongForm;
