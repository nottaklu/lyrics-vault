import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const SongPane = React.memo(({
  song,
  active,
  onScaleClick,
  onClose,
  onPrevSong,
  onNextSong,
  hasPrevSong,
  hasNextSong,
  bodyRef
}) => (
  <div className="lyrics-page">
    <div className="modal-header">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {song?.scale && (
            <button
              type="button"
              className="modal-scale-link"
              onClick={() => active && onScaleClick?.(song.scale)}
              disabled={!active}
            >
              {song.scale}
            </button>
          )}
          {song?.chords && <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>{song.chords}</span>}
        </div>
        <h2 style={{ marginTop: '4px', fontSize: '24px' }}>{song?.title || ''}</h2>
      </div>
      {active ? (
        <div className="modal-header-actions">
          <button className="modal-close-btn" onClick={onClose} aria-label="Close lyrics sheet">
            <X size={20} />
          </button>
          <div className="modal-nav-buttons">
            <button
              type="button"
              className="modal-nav-btn"
              onClick={onPrevSong}
              disabled={!hasPrevSong}
              aria-label="Previous song"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className="modal-nav-btn"
              onClick={onNextSong}
              disabled={!hasNextSong}
              aria-label="Next song"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      ) : <div className="modal-header-actions ghost" />}
    </div>

    <div ref={active ? bodyRef : null} className="modal-body lyrics-modal-body">
      <div className="lyrics-text" dangerouslySetInnerHTML={{ __html: song?.lyrics || '' }} />
    </div>
  </div>
));

const SongModal = ({ songs = [], initialSongId, onClose, onScaleClick }) => {
  const bodyRef = useRef(null);
  const pagerRef = useRef(null);
  const scrollEndTimerRef = useRef(null);
  const suppressScrollCommitRef = useRef(false);
  const closeDragRef = useRef({
    pointerId: null,
    startY: 0,
    startScrollTop: 0,
    dragging: false
  });

  const initialIndex = Math.max(0, songs.findIndex((s) => s.id === initialSongId));
  const [settledIndex, setSettledIndex] = useState(initialIndex);
  const [sheetOffsetY, setSheetOffsetY] = useState(0);
  const [isDraggingClose, setIsDraggingClose] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const dismissThreshold = useMemo(() => (
    typeof window === 'undefined' ? 160 : window.innerHeight * 0.16
  ), []);

  useEffect(() => {
    const nextIndex = songs.findIndex((s) => s.id === initialSongId);
    if (nextIndex >= 0) setSettledIndex(nextIndex);
  }, [initialSongId, songs]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!isClosing) return undefined;
    const timer = window.setTimeout(() => onClose(), 240);
    return () => window.clearTimeout(timer);
  }, [isClosing, onClose]);

  const windowStart = Math.max(0, settledIndex - 2);
  const windowEnd = Math.min(songs.length - 1, settledIndex + 2);
  const visibleSongs = songs.slice(windowStart, windowEnd + 1);
  const localPageIndex = settledIndex - windowStart;

  useLayoutEffect(() => {
    const pager = pagerRef.current;
    if (!pager) return;
    const width = pager.clientWidth || window.innerWidth || 1;
    suppressScrollCommitRef.current = true;
    pager.scrollTo({ left: localPageIndex * width, behavior: 'auto' });
    window.setTimeout(() => {
      suppressScrollCommitRef.current = false;
    }, 0);
    if (bodyRef.current) bodyRef.current.scrollTop = 0;
  }, [localPageIndex, settledIndex]);

  const requestClose = () => {
    if (isClosing) return;
    setIsDraggingClose(false);
    setIsClosing(true);
    setSheetOffsetY(window.innerHeight);
  };

  const resetCloseDrag = () => {
    closeDragRef.current.pointerId = null;
    closeDragRef.current.dragging = false;
    setIsDraggingClose(false);
    setSheetOffsetY(0);
  };

  const goToIndex = (nextIndex) => {
    const clamped = Math.max(0, Math.min(songs.length - 1, nextIndex));
    const pager = pagerRef.current;
    if (!pager) {
      setSettledIndex(clamped);
      return;
    }
    const width = pager.clientWidth || window.innerWidth || 1;
    const localTarget = clamped - windowStart;
    suppressScrollCommitRef.current = true;
    pager.scrollTo({ left: localTarget * width, behavior: 'smooth' });
    window.setTimeout(() => {
      suppressScrollCommitRef.current = false;
      commitScrollIndex();
    }, 280);
  };

  const commitScrollIndex = () => {
    const pager = pagerRef.current;
    if (!pager) return;
    const width = pager.clientWidth || window.innerWidth || 1;
    const localIndex = Math.round(pager.scrollLeft / width);
    const nextGlobal = Math.max(0, Math.min(songs.length - 1, windowStart + localIndex));
    if (nextGlobal !== settledIndex) {
      setSettledIndex(nextGlobal);
    }
  };

  const goPrev = () => goToIndex(settledIndex - 1);
  const goNext = () => goToIndex(settledIndex + 1);

  const handlePagerScroll = () => {
    if (suppressScrollCommitRef.current) return;
    if (scrollEndTimerRef.current) {
      window.clearTimeout(scrollEndTimerRef.current);
    }
    scrollEndTimerRef.current = window.setTimeout(() => {
      commitScrollIndex();
    }, 90);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select')) return;

    closeDragRef.current.pointerId = event.pointerId;
    closeDragRef.current.startY = event.clientY;
    closeDragRef.current.startScrollTop = bodyRef.current?.scrollTop || 0;
    closeDragRef.current.dragging = false;
  };

  const handlePointerMove = (event) => {
    if (closeDragRef.current.pointerId !== event.pointerId) return;
    const deltaY = event.clientY - closeDragRef.current.startY;
    const scrollTop = bodyRef.current?.scrollTop || 0;
    const isAtTop = scrollTop <= 0 && closeDragRef.current.startScrollTop <= 0;

    if (!closeDragRef.current.dragging) {
      if (deltaY <= 6 || !isAtTop) return;
      closeDragRef.current.dragging = true;
      setIsDraggingClose(true);
    }

    if (!closeDragRef.current.dragging) return;
    event.preventDefault();
    setSheetOffsetY(Math.max(0, deltaY * 0.92));
  };

  const handlePointerUp = (event) => {
    if (closeDragRef.current.pointerId !== event.pointerId) return;
    if (closeDragRef.current.dragging && sheetOffsetY > dismissThreshold) {
      requestClose();
      return;
    }
    resetCloseDrag();
    window.setTimeout(() => {
      commitScrollIndex();
    }, 20);
  };

  if (!songs.length) return null;

  return (
    <div className={`modal-overlay ${isClosing ? 'is-closing' : ''}`} onClick={requestClose}>
      <div
        className={`modal-content lyrics-sheet ${isDraggingClose ? 'is-dragging' : ''} ${isClosing ? 'is-closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translate3d(0, ${sheetOffsetY}px, 0)`,
          transition: isDraggingClose ? 'none' : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        <div className="sheet-drag-handle-wrap">
          <div className="sheet-drag-handle" />
        </div>

        <div ref={pagerRef} className="lyrics-pager" onScroll={handlePagerScroll}>
          {visibleSongs.map((song, index) => (
            <div key={song.id} className="lyrics-page-wrap">
              <SongPane
                song={song}
                active={index === localPageIndex}
                onScaleClick={onScaleClick}
                onClose={requestClose}
                onPrevSong={goPrev}
                onNextSong={goNext}
                hasPrevSong={settledIndex > 0}
                hasNextSong={settledIndex < songs.length - 1}
                bodyRef={bodyRef}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SongModal;
