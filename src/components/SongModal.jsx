import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const SongModal = ({
  song,
  onClose,
  onScaleClick,
  onNextSong,
  onPrevSong,
  hasNextSong = false,
  hasPrevSong = false
}) => {
  if (!song) return null;

  const bodyRef = useRef(null);
  const dragStateRef = useRef({
    pointerId: null,
    startX: 0,
    startY: 0,
    startScrollTop: 0,
    mode: null
  });
  const [sheetOffsetY, setSheetOffsetY] = useState(0);
  const [sheetOffsetX, setSheetOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);
  const [frameKey, setFrameKey] = useState(0);

  const dismissThreshold = useMemo(() => (
    typeof window === 'undefined' ? 160 : window.innerHeight * 0.16
  ), []);
  const horizontalThreshold = useMemo(() => (
    typeof window === 'undefined' ? 90 : window.innerWidth * 0.18
  ), []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!isClosing) return undefined;
    const timer = window.setTimeout(() => {
      onClose();
    }, 280);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isClosing, onClose]);

  useEffect(() => {
    setSheetOffsetX(0);
    setSheetOffsetY(0);
    setIsDragging(false);
    setIsClosing(false);
  }, [song.id]);

  const resetSheetPosition = () => {
    setIsDragging(false);
    setSheetOffsetX(0);
    setSheetOffsetY(0);
    dragStateRef.current.pointerId = null;
    dragStateRef.current.mode = null;
  };

  const requestClose = () => {
    if (isClosing) return;
    setIsDragging(false);
    setIsClosing(true);
    setSheetOffsetY(window.innerHeight);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select')) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragStateRef.current.pointerId = event.pointerId;
    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.startY = event.clientY;
    dragStateRef.current.startScrollTop = bodyRef.current?.scrollTop || 0;
    dragStateRef.current.mode = null;
  };

  const handlePointerMove = (event) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const scrollTop = bodyRef.current?.scrollTop || 0;
    const isAtTop = scrollTop <= 0 && dragStateRef.current.startScrollTop <= 0;

    if (!dragStateRef.current.mode) {
      if (absX < 8 && absY < 8) return;

      if (absX > absY * 1.15) {
        dragStateRef.current.mode = 'x';
        setIsDragging(true);
      } else if (deltaY > 0 && isAtTop && absY > absX * 1.05) {
        dragStateRef.current.mode = 'y';
        setIsDragging(true);
      } else {
        return;
      }
    }

    if (dragStateRef.current.mode === 'x') {
      event.preventDefault();
      const resisted = Math.sign(deltaX) * Math.min(Math.abs(deltaX) * 0.92, window.innerWidth * 0.82);
      setSheetOffsetX(resisted);
      return;
    }

    if (dragStateRef.current.mode === 'y') {
      event.preventDefault();
      const resistedOffset = Math.max(0, deltaY * 0.92);
      setSheetOffsetY(resistedOffset);
    }
  };

  const handlePointerUp = (event) => {
    if (dragStateRef.current.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);

    if (dragStateRef.current.mode === 'y') {
      if (sheetOffsetY > dismissThreshold) {
        requestClose();
        return;
      }
      resetSheetPosition();
      return;
    }

    if (dragStateRef.current.mode === 'x') {
      if (sheetOffsetX < -horizontalThreshold && hasNextSong) {
        setSlideDirection('next');
        setFrameKey((current) => current + 1);
        onNextSong?.();
      } else if (sheetOffsetX > horizontalThreshold && hasPrevSong) {
        setSlideDirection('prev');
        setFrameKey((current) => current + 1);
        onPrevSong?.();
      }
      window.setTimeout(() => setSlideDirection(null), 320);
      resetSheetPosition();
      return;
    }

    resetSheetPosition();
  };

  return (
    <div className={`modal-overlay ${isClosing ? 'is-closing' : ''}`} onClick={requestClose}>
      <div
        className={`modal-content lyrics-sheet ${isDragging ? 'is-dragging' : ''} ${isClosing ? 'is-closing' : ''}`}
        onClick={e => e.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translate3d(${sheetOffsetX}px, ${sheetOffsetY}px, 0)`,
          transition: isDragging ? 'none' : 'transform 360ms cubic-bezier(0.22, 1, 0.36, 1)'
        }}
      >
        <div className="sheet-drag-handle-wrap">
          <div className="sheet-drag-handle" />
        </div>
        <div key={`${song.id}-${frameKey}`} className={`lyrics-song-frame ${slideDirection ? `is-sliding-${slideDirection}` : ''}`}>
          <div className="modal-header">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                {song.scale && (
                  <button
                    type="button"
                    className="modal-scale-link"
                    onClick={() => onScaleClick?.(song.scale)}
                  >
                    {song.scale}
                  </button>
                )}
                {song.chords && <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>{song.chords}</span>}
              </div>
              <h2 style={{ marginTop: '4px', fontSize: '24px' }}>{song.title}</h2>
            </div>
            <div className="modal-header-actions">
              <button className="modal-close-btn" onClick={requestClose} aria-label="Close lyrics sheet">
                <X size={20} />
              </button>
              <div className="modal-nav-buttons">
                <button
                  type="button"
                  className="modal-nav-btn"
                  data-no-swipe="true"
                  onClick={onPrevSong}
                  disabled={!hasPrevSong}
                  aria-label="Previous song"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  className="modal-nav-btn"
                  data-no-swipe="true"
                  onClick={onNextSong}
                  disabled={!hasNextSong}
                  aria-label="Next song"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
          <div ref={bodyRef} className="modal-body lyrics-modal-body">
            <div className="lyrics-text" dangerouslySetInnerHTML={{ __html: song.lyrics || '' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SongModal;
