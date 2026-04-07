import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Bold, Palette, Plus } from 'lucide-react';

const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const isBlueColor = (rawColor) => {
  const value = String(rawColor || '').replace(/\s+/g, '').toLowerCase();
  return value === '#007aff'
    || value === 'rgb(0,122,255)'
    || value === 'rgba(0,122,255,1)';
};

const serializeLyricsNode = (node) => {
  if (!node) return '';

  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node;
  const tagName = element.tagName.toUpperCase();
  const childrenHtml = Array.from(element.childNodes).map(serializeLyricsNode).join('');

  if (tagName === 'BR') return '<br>';
  if (tagName === 'STRONG' || tagName === 'B') return `<strong>${childrenHtml}</strong>`;
  if (tagName === 'DIV' || tagName === 'P') return `${childrenHtml || '<br>'}<br>`;

  const color = (element.style?.color || '').replace(/\s+/g, '').toLowerCase();
  const fontWeight = (element.style?.fontWeight || '').toLowerCase();
  const isBold = fontWeight === 'bold' || Number(fontWeight) >= 600;

  let wrapped = childrenHtml;
  if (isBold && wrapped.trim()) {
    wrapped = `<strong>${wrapped}</strong>`;
  }
  if (isBlueColor(color) && wrapped.trim()) {
    wrapped = `<span style="color:#007AFF">${wrapped}</span>`;
  }

  return wrapped;
};

const normalizeLyricsHtml = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  const hasHtml = /<[a-z][\s\S]*>/i.test(raw);
  if (!hasHtml) {
    return escapeHtml(raw).replace(/\r\n/g, '\n').replace(/\n/g, '<br>');
  }

  if (typeof document === 'undefined') {
    return raw;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, 'text/html');
  return Array.from(doc.body.childNodes)
    .map(serializeLyricsNode)
    .join('')
    .replace(/(<br>\s*){3,}/gi, '<br><br>')
    .replace(/(<br>\s*)+$/gi, '');
};

const DEFAULT_TAGS = [
  'Fast',
  'Slow',
  'Peaceful',
  'Energetic',
  'Opening',
  'Closing',
  'Bhajan',
  'Aarti',
  'Nemi',
  'Girnar'
];

const SongForm = ({ onSave, onCancel, initialData, existingKeywords = [] }) => {
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

  const [selectedKeywords, setSelectedKeywords] = useState(
    Array.isArray(initialData?.keywords)
      ? initialData.keywords
      : String(formData.keywords || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
  );
  const [keywordInput, setKeywordInput] = useState('');

  const tagSuggestions = Array.from(new Set([
    ...DEFAULT_TAGS,
    ...existingKeywords.filter(Boolean),
    ...selectedKeywords.filter(Boolean)
  ])).sort((a, b) => a.localeCompare(b));

  const addKeyword = (rawValue) => {
    const nextKeyword = String(rawValue || '').trim();
    if (!nextKeyword) return;

    setSelectedKeywords((current) => (
      current.some((item) => item.toLowerCase() === nextKeyword.toLowerCase())
        ? current
        : [...current, nextKeyword]
    ));
    setKeywordInput('');
  };

  const removeKeyword = (keyword) => {
    setSelectedKeywords((current) => current.filter((item) => item !== keyword));
  };

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

    const currentLyrics = lyricsRef.current ? normalizeLyricsHtml(lyricsRef.current.innerHTML) : formData.lyrics;
    onSave({
      ...formData,
      lyrics: currentLyrics,
      keywords: selectedKeywords
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
              <div className="tag-picker">
                <div className="tag-input-row">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addKeyword(keywordInput);
                      }
                    }}
                    placeholder="Add a tag"
                  />
                  <button type="button" className="tag-add-btn" onClick={() => addKeyword(keywordInput)}>
                    <Plus size={16} />
                  </button>
                </div>

                {selectedKeywords.length > 0 && (
                  <div className="selected-tags">
                    {selectedKeywords.map((keyword) => (
                      <button
                        type="button"
                        key={keyword}
                        className="selected-tag"
                        onClick={() => removeKeyword(keyword)}
                      >
                        <span>{keyword}</span>
                        <X size={12} />
                      </button>
                    ))}
                  </div>
                )}

                <div className="tag-suggestions">
                  {tagSuggestions.map((keyword) => (
                    <button
                      type="button"
                      key={keyword}
                      className={`tag-suggestion ${selectedKeywords.includes(keyword) ? 'is-selected' : ''}`}
                      onClick={() => (
                        selectedKeywords.includes(keyword)
                          ? removeKeyword(keyword)
                          : addKeyword(keyword)
                      )}
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              </div>
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
