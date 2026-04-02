import React, { useState, useEffect, useRef } from 'react';
import { Library, Search as SearchIcon, Database as DbIcon, Edit2, Trash2, GripVertical, Sun, Moon, Music2, Check, Bold, Palette, Heading2, ListTodo, Link2 } from 'lucide-react';
import SongCard from './components/SongCard';
import ScaleCard from './components/ScaleCard';
import SongModal from './components/SongModal';
import SongForm from './components/SongForm';
import { githubService } from './services/githubService';
import SyncSetup from './components/SyncSetup';
import PinLock from './components/PinLock';
import './App.css';

const normalizeSearchText = (value) => String(value || '').toLowerCase().trim();

const stripHtml = (value) => String(value || '').replace(/<[^>]*>/g, ' ');
const escapeHtml = (value) => String(value || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const normalizeNotesHtml = (value) => {
  const raw = String(value || '');
  if (!raw.trim()) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) return raw;
  return escapeHtml(raw).replace(/\r\n/g, '\n').replace(/\n/g, '<br>');
};

const BLOCK_NOTE_TAGS = new Set(['DIV', 'P', 'LI', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

const serializeNotesNode = (node) => {
  if (!node) return '';

  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent || '');
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const element = node;
  const tagName = element.tagName.toUpperCase();

  if (tagName === 'BR') {
    return '<br>';
  }

  if (tagName === 'SPAN' && element.classList.contains('notes-song-link')) {
    const title = escapeHtml(element.getAttribute('data-song-title') || element.textContent || '');
    const label = Array.from(element.childNodes).map(serializeNotesNode).join('') || escapeHtml(element.textContent || '');
    return `<span class="notes-song-link" data-song-title="${title}" contenteditable="false">${label}</span>`;
  }

  const childrenHtml = Array.from(element.childNodes).map(serializeNotesNode).join('');

  if (tagName === 'STRONG' || tagName === 'B') return `<strong>${childrenHtml}</strong>`;
  if (tagName === 'EM' || tagName === 'I') return `<em>${childrenHtml}</em>`;
  if (tagName === 'U') return `<u>${childrenHtml}</u>`;
  if (tagName === 'H2') return `<h2>${childrenHtml}</h2>`;

  if (tagName === 'SPAN') {
    const color = (element.style?.color || '').replace(/\s+/g, '').toLowerCase();
    if (color === 'rgb(0,122,255)' || color === '#007aff') {
      return `<span style="color:#007AFF">${childrenHtml}</span>`;
    }
    return childrenHtml;
  }

  if (BLOCK_NOTE_TAGS.has(tagName)) {
    if (!childrenHtml.trim()) return '<br>';
    return `${childrenHtml}<br>`;
  }

  return childrenHtml;
};

const extractNotesHtml = (element) => {
  if (!element) return '';

  const html = Array.from(element.childNodes)
    .map(serializeNotesNode)
    .join('')
    .replace(/(<br>\s*){3,}/gi, '<br><br>')
    .replace(/(<br>\s*)+$/gi, '');

  return normalizeNotesHtml(html);
};

const SCALE_ALIASES = {
  'a sharp': 'A#',
  'a#': 'A#',
  'bb': 'Bb',
  'b flat': 'Bb',
  'c sharp': 'C#',
  'c#': 'C#',
  'd sharp': 'Eb',
  'd#': 'Eb',
  'e flat': 'Eb',
  'eb': 'Eb',
  'f sharp': 'F#',
  'f#': 'F#',
  'g sharp': 'Ab',
  'g#': 'Ab',
  'a flat': 'Ab',
  'ab': 'Ab'
};

const SCALE_ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const SCALE_NOTE_NAMES = {
  C: 'Safed 1',
  'C#': 'Kali 1',
  D: 'Safed 2',
  Eb: 'Kali 2',
  E: 'Safed 3',
  F: 'Safed 4',
  'F#': 'Kali 3',
  G: 'Safed 5',
  Ab: 'Kali 4',
  A: 'Safed 6',
  Bb: 'Kali 5',
  B: 'Safed 7'
};
const CHROMATIC_NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const MAJOR_PATTERN = [0, 2, 4, 5, 7, 9, 11];
const TRANSPOSE_ROWS = [
  { label: 'Open', shift: 0 },
  { label: 'Capo 1', shift: -1 },
  { label: 'Capo 2', shift: -2 },
  { label: 'Capo 3', shift: -3 },
  { label: 'Capo 4', shift: -4 },
  { label: 'Capo 5', shift: -5 },
  { label: 'Capo 6', shift: -6 },
  { label: 'Capo 7', shift: -7 },
  { label: 'Capo 8', shift: -8 }
];

const SCALE_AUDIO_MAP = {
  'A-major': '/lyrics-vault/audio/scales/A-major.mp3',
  'C-major': '/lyrics-vault/audio/scales/C-major.mp3',
  'D-major': '/lyrics-vault/audio/scales/D-major.mp3',
  'G-major': '/lyrics-vault/audio/scales/G-major.mp3',
  'D-minor': '/lyrics-vault/audio/scales/D-minor.mp3',
  'F-minor': '/lyrics-vault/audio/scales/F-minor.mp3'
};

function getNoteSearchTerms(noteLabel) {
  const normalized = String(noteLabel || '').trim();
  if (!normalized) return [];

  const withKaali = normalized.replace(/\bkali\b/gi, 'Kaali');
  const compact = normalized.replace(/\s+/g, '');
  const compactKaali = withKaali.replace(/\s+/g, '');

  return Array.from(new Set([normalized, withKaali, compact, compactKaali]));
}

function getScaleChords(root) {
  const rootIndex = CHROMATIC_NOTES.indexOf(root);
  if (rootIndex === -1) return [];

  return MAJOR_PATTERN.map((step, index) => {
    const note = CHROMATIC_NOTES[(rootIndex + step + CHROMATIC_NOTES.length) % CHROMATIC_NOTES.length];
    if (index === 1 || index === 2 || index === 5) return `${note}m`;
    if (index === 6) return `${note}dim`;
    return note;
  });
}

const SCALES = SCALE_ROOTS.flatMap((root) => ([
  {
    id: `${root}-major`,
    root,
    type: 'Major',
    label: `${root} Major / ${SCALE_NOTE_NAMES[root]}`,
    shortLabel: `${root} Major`,
    noteLabel: SCALE_NOTE_NAMES[root],
    transposeRoot: root,
    searchTerms: [
      root,
      'major',
      `${root} major scale`,
      `${root} ionian`,
      SCALE_NOTE_NAMES[root],
      ...getNoteSearchTerms(SCALE_NOTE_NAMES[root]),
      ...getScaleChords(root),
      getScaleChords(root).join(' ')
    ],
    audioUrl: SCALE_AUDIO_MAP[`${root}-major`] || null
  },
  {
    id: `${root}-minor`,
    root,
    type: 'Minor',
    label: `${root} Minor / ${SCALE_NOTE_NAMES[CHROMATIC_NOTES[(CHROMATIC_NOTES.indexOf(root) + 3) % CHROMATIC_NOTES.length]]}`,
    shortLabel: `${root} Minor`,
    noteLabel: SCALE_NOTE_NAMES[CHROMATIC_NOTES[(CHROMATIC_NOTES.indexOf(root) + 3) % CHROMATIC_NOTES.length]],
    transposeRoot: CHROMATIC_NOTES[(CHROMATIC_NOTES.indexOf(root) + 3) % CHROMATIC_NOTES.length],
    searchTerms: [
      root,
      'minor',
      `${root} minor scale`,
      `${root} aeolian`,
      SCALE_NOTE_NAMES[CHROMATIC_NOTES[(CHROMATIC_NOTES.indexOf(root) + 3) % CHROMATIC_NOTES.length]],
      ...getNoteSearchTerms(SCALE_NOTE_NAMES[CHROMATIC_NOTES[(CHROMATIC_NOTES.indexOf(root) + 3) % CHROMATIC_NOTES.length]]),
      ...getScaleChords(CHROMATIC_NOTES[(CHROMATIC_NOTES.indexOf(root) + 3) % CHROMATIC_NOTES.length]),
      getScaleChords(CHROMATIC_NOTES[(CHROMATIC_NOTES.indexOf(root) + 3) % CHROMATIC_NOTES.length]).join(' ')
    ],
    audioUrl: SCALE_AUDIO_MAP[`${root}-minor`] || null
  }
]));

const C_FAMILY_SIGNATURE = getScaleChords('C').join(' ');

const normalizeScaleId = (scaleText) => {
  const normalized = normalizeSearchText(scaleText).replace(/\s+/g, ' ');
  if (!normalized) return null;

  const type = normalized.includes('minor') ? 'minor' : 'major';
  const rootText = normalized
    .replace('major', '')
    .replace('minor', '')
    .trim();

  const root = SCALE_ALIASES[rootText] || rootText
    .split(' ')
    .map((part) => part ? part[0].toUpperCase() + part.slice(1) : part)
    .join(' ');

  return `${root}-${type}`;
};

function App() {
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scaleSearchQuery, setScaleSearchQuery] = useState('');
  const [transposeScale, setTransposeScale] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSong, setEditingSong] = useState(null);
  const [activeTab, setActiveTab] = useState('library');
  const [ghToken, setGhToken] = useState(githubService.getToken());
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinTarget, setPinTarget] = useState(null);
  const [playingScaleId, setPlayingScaleId] = useState(null);
  const [pendingScaleId, setPendingScaleId] = useState(null);
  const [notesContent, setNotesContent] = useState(normalizeNotesHtml(localStorage.getItem('notes_content') || ''));
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const audioRef = useRef(null);
  const notesEditorRef = useRef(null);
  const notesViewRef = useRef(null);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
  };

  // Load songs from GitHub only
  const loadSongs = async () => {
    if (!ghToken) { setLoading(false); return; }
    setLoading(true);
    try {
      const ghSongs = await githubService.getSongs();
      const sorted = (ghSongs || []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setSongs(sorted);
    } catch (err) {
      console.error("Failed to load from GitHub:", err);
      // If token is expired/invalid, clear it and show re-auth
      if (err.message && err.message.includes('Bad credentials')) {
        localStorage.removeItem('gh_token');
        setGhToken(null);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSongs();
  }, [ghToken]);

  useEffect(() => {
    const loadNotes = async () => {
      if (!ghToken) return;

      try {
        const notesFile = await githubService.getNotes();
        if (notesFile?.content) {
          setNotesContent(normalizeNotesHtml(notesFile.content));
          localStorage.setItem('notes_content', normalizeNotesHtml(notesFile.content));
        }
      } catch (err) {
        console.error('Failed to load notes:', err);
      }
    };

    loadNotes();
  }, [ghToken]);

  useEffect(() => {
    if (!ghToken) {
      setIsUnlocked(false);
      setPinTarget(null);
    }
  }, [ghToken]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopScaleAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlayingScaleId(null);
  };

  useEffect(() => {
    if (activeTab !== 'scales') {
      stopScaleAudio();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'notes') {
      setIsEditingNotes(false);
      notesEditorRef.current?.blur();
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('notes_content', notesContent);
  }, [notesContent]);

  useEffect(() => {
    if (activeTab === 'notes' && isEditingNotes) {
      notesEditorRef.current?.focus();
    }
  }, [activeTab, isEditingNotes]);

  useEffect(() => {
    if (activeTab === 'notes' && !isEditingNotes && notesViewRef.current) {
      notesViewRef.current.scrollTop = 0;
      notesViewRef.current.scrollLeft = 0;
    }
  }, [activeTab, isEditingNotes, notesContent]);

  useEffect(() => {
    if (notesEditorRef.current && notesEditorRef.current.innerHTML !== normalizeNotesHtml(notesContent) && isEditingNotes) {
      notesEditorRef.current.innerHTML = normalizeNotesHtml(notesContent);
    }
  }, [notesContent, isEditingNotes]);

  // Save: update songs.json on GitHub directly
  const handleSaveSong = async (data) => {
    try {
      // Always fetch fresh to get latest SHA
      const songsFile = await githubService.fetchFile('data/songs.json');
      const currentSongs = songsFile ? songsFile.content : [];

      let updatedSongs;
      if (editingSong) {
        updatedSongs = currentSongs.map(s =>
          s.id === editingSong.id ? { ...s, ...data, keywords: data.keywords } : s
        );
      } else {
        const maxOrder = currentSongs.length > 0 ? Math.max(...currentSongs.map(s => s.order || 0)) : -1;
        const newSong = {
          ...data,
          id: Date.now(),
          order: maxOrder + 1,
          createdAt: new Date().toISOString()
        };
        updatedSongs = [...currentSongs, newSong];
      }

      await githubService.uploadFile(
        'data/songs.json',
        JSON.stringify(updatedSongs, null, 2),
        editingSong ? `Update: ${data.title}` : `Add: ${data.title}`,
        songsFile?.sha
      );

      await loadSongs();
      setShowAddForm(false);
      setEditingSong(null);
      setActiveTab('database');
    } catch (err) {
      console.error("Save failed:", err);
      // Show the REAL API error so we can debug
      alert("Save failed: " + err.message);
    }
  };

  // Delete: remove from songs.json on GitHub
  const deleteSong = async (id) => {
    const song = songs.find(s => s.id === id);
    const title = song ? song.title : 'this song';
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    try {
      const songsFile = await githubService.fetchFile('data/songs.json');
      if (!songsFile) return;
      const updatedSongs = songsFile.content.filter(s => s.id !== id);
      await githubService.uploadFile(
        'data/songs.json',
        JSON.stringify(updatedSongs, null, 2),
        `Delete: ${title}`,
        songsFile.sha
      );
      await loadSongs();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete. Check your connection.");
    }
  };

  // Drag & drop reorder: save new order to GitHub
  const handleDragStart = (e, id) => {
    e.dataTransfer.setData('id', String(id));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetId) => {
    const sourceId = parseInt(e.dataTransfer.getData('id'));
    if (sourceId === targetId) return;

    const sourceIndex = songs.findIndex(s => s.id === sourceId);
    const targetIndex = songs.findIndex(s => s.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newSongs = [...songs];
    const [movedSong] = newSongs.splice(sourceIndex, 1);
    newSongs.splice(targetIndex, 0, movedSong);

    // Assign new orders
    const reordered = newSongs.map((s, i) => ({ ...s, order: i }));
    setSongs(reordered); // Instant UI update

    // Push reordered list to GitHub
    try {
      const songsFile = await githubService.fetchFile('data/songs.json');
      await githubService.uploadFile(
        'data/songs.json',
        JSON.stringify(reordered, null, 2),
        'Reorder songs',
        songsFile?.sha
      );
    } catch (err) {
      console.error("Reorder sync failed:", err);
    }
  };

  const normalizedQuery = normalizeSearchText(searchQuery);

  const filtered = songs.filter((song) => {
    if (!normalizedQuery) return true;

    const searchFields = [
      song.title,
      song.scale,
      song.chords,
      stripHtml(song.lyrics),
      ...(Array.isArray(song.keywords) ? song.keywords : [])
    ];

    return searchFields.some((field) => normalizeSearchText(field).includes(normalizedQuery));
  }).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const normalizedScaleQuery = normalizeSearchText(scaleSearchQuery);

  const filteredScales = SCALES.filter((scale) => {
    if (!normalizedScaleQuery) return true;

    return scale.searchTerms.some((term) => normalizeSearchText(term).includes(normalizedScaleQuery));
  });

  const transposeRows = TRANSPOSE_ROWS.map((row) => {
    const selectedRoot = transposeScale?.transposeRoot || 'C';
    const rootIndex = CHROMATIC_NOTES.indexOf(selectedRoot);
    const transposedRoot = CHROMATIC_NOTES[(rootIndex + row.shift + CHROMATIC_NOTES.length * 10) % CHROMATIC_NOTES.length];
    const chords = getScaleChords(transposedRoot);
    return {
      ...row,
      chords,
      isMatch: chords.join(' ') === C_FAMILY_SIGNATURE
    };
  });

  const dockActiveTab = pinTarget === 'database' || pinTarget === 'database-add'
    ? 'database'
    : pinTarget === 'notes'
      ? 'notes'
      : activeTab;

  const handleNotesDone = () => {
    const nextNotes = extractNotesHtml(notesEditorRef.current);
    setNotesContent(nextNotes);
    setIsEditingNotes(false);
    notesEditorRef.current?.blur();

    if (!ghToken) return;

    setSavingNotes(true);
    githubService.saveNotes(nextNotes)
      .then(() => {
        localStorage.setItem('notes_content', nextNotes);
      })
      .catch((err) => {
        console.error('Failed to sync notes:', err);
        alert('Notes saved locally, but sync failed.');
      })
      .finally(() => {
        setSavingNotes(false);
      });
  };

  const handleNotesInput = () => {
    setNotesContent(extractNotesHtml(notesEditorRef.current));
  };

  const handleNotesPaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData('text/plain') || '';
    const html = escapeHtml(pastedText).replace(/\r\n/g, '\n').replace(/\n/g, '<br>');
    notesEditorRef.current?.focus();
    document.execCommand('insertHTML', false, html);
    handleNotesInput();
  };

  const applyNotesCommand = (command, value = null) => {
    notesEditorRef.current?.focus();
    if (command === 'foreColor') {
      document.execCommand('styleWithCSS', false, true);
    }
    document.execCommand(command, false, value);
    handleNotesInput();
  };

  const insertNotesChecklist = () => {
    notesEditorRef.current?.focus();
    document.execCommand('insertHTML', false, '<div>☐ Checklist item</div>');
    handleNotesInput();
  };

  const insertSongLink = () => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';
    const promptValue = selectedText || '';
    const songTitle = window.prompt('Enter the song title to link', promptValue);
    if (!songTitle) return;

    const label = escapeHtml(selectedText || songTitle);
    const safeTitle = escapeHtml(songTitle);
    notesEditorRef.current?.focus();
    document.execCommand(
      'insertHTML',
      false,
      `<span class="notes-song-link" data-song-title="${safeTitle}" contenteditable="false">${label}</span>`
    );
    handleNotesInput();
  };

  const findSongByTitle = (title) => {
    const normalized = normalizeSearchText(title);
    return songs.find((song) => normalizeSearchText(song.title) === normalized)
      || songs.find((song) => normalizeSearchText(song.title).includes(normalized));
  };

  const handleNotesLinkClick = (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest('.notes-song-link');
    if (!link) return;

    const song = findSongByTitle(link.dataset.songTitle || link.textContent);
    if (!song) {
      alert('Linked song not found in your library yet.');
      return;
    }

    setSelectedSong(song);
  };

  const getNotesPreviewHtml = (html) => normalizeNotesHtml(html)
    .replace(/<span class="notes-song-link" data-song-title="([^"]+)" contenteditable="false">([\s\S]*?)<\/span>/g, '<button type="button" class="notes-song-link" data-song-title="$1">$2</button>');

  const handleScaleAudioToggle = (scale, { forcePlay = false } = {}) => {
    if (!scale.audioUrl) return;

    if (!forcePlay && playingScaleId === scale.id && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setPlayingScaleId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(scale.audioUrl);
    audio.loop = true;
    audioRef.current = audio;
    setPlayingScaleId(scale.id);

    audio.play().catch(() => {
      if (audioRef.current === audio) {
        audioRef.current = null;
      }
      setPlayingScaleId(null);
    });
  };

  useEffect(() => {
    if (activeTab !== 'scales' || !pendingScaleId) return;

    const scale = SCALES.find((item) => item.id === pendingScaleId);
    const element = document.getElementById(`scale-card-${pendingScaleId}`);

    if (!scale || !element) return;

    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    handleScaleAudioToggle(scale, { forcePlay: true });
    setPendingScaleId(null);
  }, [activeTab, pendingScaleId]);

  const handleSongScaleClick = (scaleText) => {
    const scaleId = normalizeScaleId(scaleText);
    if (!scaleId) return;

    setSelectedSong(null);
    setScaleSearchQuery('');
    setActiveTab('scales');
    setPendingScaleId(scaleId);
  };

  // If no token, show sync setup
  if (!ghToken) {
    return <SyncSetup onComplete={(token) => {
      setGhToken(token);
    }} />;
  }

  return (
    <div className="app-container" data-theme={theme}>
      <main className={`content-area ${activeTab === 'notes' ? 'notes-mode' : ''}`}>
        {(loading || savingNotes) && <div className="top-loader-bar"></div>}
        <header className="app-header">
          <div className="header-copy">
            <h1>{activeTab === 'database' ? 'Database' : activeTab === 'scales' ? 'Scales' : activeTab === 'notes' ? 'Notes' : 'Lyrics'}</h1>
          </div>
          {activeTab === 'notes' ? (
            isEditingNotes ? (
              <button className="theme-toggle" onClick={handleNotesDone} aria-label="Done editing notes">
                <Check size={18} />
              </button>
            ) : (
              <button className="theme-toggle" onClick={() => setIsEditingNotes(true)} aria-label="Edit notes">
                <Edit2 size={16} />
              </button>
            )
          ) : (
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )} 
        </header>

        <div style={{ display: (activeTab === 'library') ? 'block' : 'none' }}>
          <div className="search-bar-container">
            <div className="search-pill hero-pill">
              <SearchIcon size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search title, scale, chords, keywords, or lyrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="song-grid">
            {filtered.map(s => (
              <SongCard key={s.id} song={s} onClick={() => setSelectedSong(s)} />
            ))}
          </div>
        </div>

        <div style={{ display: (activeTab === 'scales') ? 'block' : 'none' }}>
          <div className="search-bar-container">
            <div className="search-pill hero-pill">
              <SearchIcon size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search scales, Safed/Kaali notes, or chord family..."
                value={scaleSearchQuery}
                onChange={(e) => setScaleSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="song-grid">
            {filteredScales.map((scale) => (
              <ScaleCard
                key={scale.id}
                scale={scale}
                isPlaying={playingScaleId === scale.id}
                onAudioToggle={() => handleScaleAudioToggle(scale)}
                onTransposeOpen={() => setTransposeScale(scale)}
              />
            ))}
          </div>
        </div>

        <div className="db-view" style={{ display: (activeTab === 'database') ? 'flex' : 'none' }}>
          <div className="db-toolbar">
            <button
              className="db-add-song-btn"
              onClick={() => {
                if (isUnlocked) {
                  setEditingSong(null);
                  setShowAddForm(true);
                  setPinTarget(null);
                  return;
                }
                setPinTarget('database-add');
              }}
            >
              Add a New Song
            </button>
          </div>
          <div className="db-list">
          {songs.map((s) => (
            <div
              key={s.id}
              className="db-item"
              draggable
              onDragStart={(e) => handleDragStart(e, s.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, s.id)}
            >
              <div className="db-item-content">
                <div className="drag-handle">
                  <GripVertical size={18} />
                </div>
                <div className="db-info">
                  <h3>{s.title}</h3>
                  <span>{s.scale}</span>
                </div>
              </div>
              <div className="db-item-actions">
                <button className="icon-btn edit-btn" onClick={() => { setEditingSong(s); setShowAddForm(true); }}>
                  <Edit2 size={16} />
                </button>
                <button className="icon-btn delete-btn" onClick={() => deleteSong(s.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>

        <div className="notes-screen" style={{ display: (activeTab === 'notes') ? 'flex' : 'none' }}>
          <div className={`notes-sheet ${isEditingNotes ? 'is-editing' : ''}`}>
            {isEditingNotes && (
              <div className="notes-toolbar">
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyNotesCommand('bold'); }}>
                  <Bold size={16} />
                </button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyNotesCommand('foreColor', '#007AFF'); }}>
                  <Palette size={16} />
                </button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); applyNotesCommand('formatBlock', 'h2'); }}>
                  <Heading2 size={16} />
                </button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); insertNotesChecklist(); }}>
                  <ListTodo size={16} />
                </button>
                <button type="button" onMouseDown={(e) => { e.preventDefault(); insertSongLink(); }}>
                  <Link2 size={16} />
                </button>
              </div>
            )}

            {isEditingNotes ? (
              <div
                ref={notesEditorRef}
                className="notes-editor rich-notes-editor"
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Write your flow, headings, checklists, and linked songs here..."
                onInput={handleNotesInput}
                onPaste={handleNotesPaste}
              />
            ) : (
              <div key={`notes-preview-${notesContent.length}`} className="notes-view" onClick={handleNotesLinkClick}>
                <div
                  ref={notesViewRef}
                  className="notes-renderer"
                  dangerouslySetInnerHTML={{ __html: getNotesPreviewHtml(notesContent || '<p class="notes-empty">Tap anywhere to start writing your flow.</p>') }}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      <nav className="floating-dock-container">
        <div className="floating-dock">
          <button className={`dock-item ${dockActiveTab === 'library' ? 'active' : ''}`} onClick={() => { setPinTarget(null); setActiveTab('library'); setShowAddForm(false); }}>
            <Library size={20} />
          </button>
          <button className={`dock-item ${dockActiveTab === 'scales' ? 'active' : ''}`} onClick={() => { setPinTarget(null); setActiveTab('scales'); setShowAddForm(false); }}>
            <Music2 size={20} />
          </button>
          <button
            className={`dock-item ${dockActiveTab === 'database' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('database');
              setShowAddForm(false);
              if (isUnlocked) {
                setPinTarget(null);
                return;
              }
              setPinTarget('database');
            }}
          >
            <DbIcon size={20} />
          </button>
          <button
            className={`dock-item ${dockActiveTab === 'notes' ? 'active' : ''}`}
            onClick={() => {
              setShowAddForm(false);
              if (isUnlocked) {
                setPinTarget(null);
                setActiveTab('notes');
                return;
              }
              setPinTarget('notes');
            }}
          >
            <Edit2 size={20} />
          </button>
        </div>
      </nav>

      {showAddForm && (
        <SongForm
          onSave={handleSaveSong}
          initialData={editingSong}
          existingKeywords={songs.flatMap((song) => Array.isArray(song.keywords) ? song.keywords : [])}
          onCancel={() => { setShowAddForm(false); setEditingSong(null); }}
        />
      )}

      {selectedSong && (
        <SongModal song={selectedSong} onClose={() => setSelectedSong(null)} onScaleClick={handleSongScaleClick} />
      )}

      {transposeScale && (
        <div className="modal-overlay" onClick={() => setTransposeScale(null)}>
          <div className="modal-content transpose-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="song-card-scale">Transpose</span>
                <h2 style={{ marginTop: '4px', fontSize: '24px' }}>
                  {transposeScale.shortLabel} / {SCALE_NOTE_NAMES[transposeScale.transposeRoot]}
                </h2>
              </div>
              <button className="modal-close-btn" onClick={() => setTransposeScale(null)}>Close</button>
            </div>
            <div className="modal-body">
              <div className="transpose-table">
                {transposeRows.map((row) => (
                  <div key={row.label} className={`transpose-row ${row.isMatch ? 'is-match' : ''}`}>
                    <div className="transpose-label">{row.label}</div>
                    <div className="transpose-chords">{row.chords.join(' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {pinTarget && (
        <PinLock onCorrect={() => {
          setIsUnlocked(true);
          if (pinTarget === 'database') {
            setActiveTab('database');
            setShowAddForm(false);
          } else if (pinTarget === 'database-add') {
            setActiveTab('database');
            setEditingSong(null);
            setShowAddForm(true);
          } else if (pinTarget === 'notes') {
            setActiveTab('notes');
            setShowAddForm(false);
          }
          setPinTarget(null);
        }}
          title={pinTarget === 'notes' ? 'Private Notes' : "Siddh's Lyrics"}
          subtitle={pinTarget === 'notes' ? 'Unlock your notes' : 'Enter PIN'}
        />
      )}
    </div>
  );
}

export default App;
