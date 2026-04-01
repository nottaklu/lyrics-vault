import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Bold, Palette } from 'lucide-react';

const normalizeLyricsHtml = (value) => String(value || '')
  .replace(/color:\s*(?!#007aff|#007AFF|rgb\(0,\s*122,\s*255\)|rgba\(0,\s*122,\s*255,\s*1\))[^;"']+;?/gi, '');

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

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
      lyricsRef.current.innerHTML = normalizeLyricsHtml(lyricsHtml);
    }
  }, []);

  const keywordsInitial = Array.isArray(initialData?.keywords) 
    ? initialData.keywords.join(', ') 
    : (formData.keywords || '');

  const [keywordsDisplay, setKeywordsDisplay] = useState(keywordsInitial);

  const handlePasteLyrics = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData('text/plain') || '';
    const normalizedText = pastedText.replace(/\r\n/g, '\n');
    const html = escapeHtml(normalizedText).replace(/\n/g, '<br>');

    lyricsRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    setLyricsHtml(normalizeLyricsHtml(lyricsRef.current?.innerHTML || ''));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title) return;
    
    const keywordsArray = keywordsDisplay
      ? keywordsDisplay.split(',').map(k => k.trim()).filter(k => k !== '')
      : [];

    const currentLyrics = lyricsRef.current ? normalizeLyricsHtml(lyricsRef.current.innerHTML) : formData.lyrics;
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
                  lyricsRef.current?.focus();
                  document.execCommand('styleWithCSS', false, true);
                  document.execCommand('foreColor', false, '#007AFF');
                  setLyricsHtml(normalizeLyricsHtml(lyricsRef.current?.innerHTML || ''));
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
                onPaste={handlePasteLyrics}
                onInput={() => setLyricsHtml(normalizeLyricsHtml(lyricsRef.current.innerHTML))}
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
