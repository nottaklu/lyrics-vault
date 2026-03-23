import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Bold, Palette } from 'lucide-react';

const SongForm = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    scale: initialData?.scale || '',
    chords: initialData?.chords || '',
    keywords: initialData?.keywords || '',
    lyrics: initialData?.lyrics || ''
  });

  const lyricsRef = useRef(null);
  const [lyricsHtml, setLyricsHtml] = useState(initialData?.lyrics || '');

  useEffect(() => {
    if (lyricsRef.current && lyricsHtml) {
      lyricsRef.current.innerHTML = lyricsHtml;
    }
  }, []);

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

    const currentLyrics = lyricsRef.current ? lyricsRef.current.innerHTML : formData.lyrics;
    onSave({
      ...formData,
      lyrics: currentLyrics,
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
              <label>Chords</label>
              <input 
                type="text" 
                value={formData.chords}
                onChange={e => setFormData({...formData, chords: e.target.value})}
                placeholder="e.g. A# - A C Em D"
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
              <div className="lyrics-toolbar">
                <button type="button" title="Bold" onMouseDown={e => { e.preventDefault(); document.execCommand('bold'); }}>
                  <Bold size={16} />
                </button>
                <button type="button" title="Blue" onMouseDown={e => {
                  e.preventDefault();
                  const sel = window.getSelection();
                  if (!sel.rangeCount || sel.isCollapsed) return;
                  const range = sel.getRangeAt(0);
                  const span = document.createElement('span');
                  span.style.color = '#007AFF';
                  range.surroundContents(span);
                }}>
                  <Palette size={16} />
                </button>
              </div>
              <div
                ref={lyricsRef}
                className="lyrics-editable"
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Paste lyrics here..."
                onInput={() => setLyricsHtml(lyricsRef.current.innerHTML)}
              />
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
