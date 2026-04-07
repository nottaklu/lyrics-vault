import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';

const SongModal = ({ song, onClose, onScaleClick }) => {
  if (!song) return null;

  const bodyRef = useRef(null);
  const pointerStateRef = useRef({
    pointerId: null,
    startY: 0,
    startScrollTop: 0,
    draggingSheet: false
  });
  const [sheetOffsetY, setSheetOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const dismissThreshold = useMemo(() => (
    typeof window === 'undefined' ? 180 : window.innerHeight * 0.22
  ), []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const resetSheetPosition = () => {
    setIsDragging(false);
    setSheetOffsetY(0);
    pointerStateRef.current.draggingSheet = false;
    pointerStateRef.current.pointerId = null;
  };

  const requestClose = () => {
    if (isClosing) return;
    setIsDragging(false);
    setIsClosing(true);
    setSheetOffsetY(window.innerHeight * 0.38);
  };

  const handlePointerDown = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    pointerStateRef.current.pointerId = event.pointerId;
    pointerStateRef.current.startY = event.clientY;
    pointerStateRef.current.startScrollTop = bodyRef.current?.scrollTop || 0;
    pointerStateRef.current.draggingSheet = false;
  };

  const handlePointerMove = (event) => {
    if (pointerStateRef.current.pointerId !== event.pointerId) return;

    const deltaY = event.clientY - pointerStateRef.current.startY;
    const scrollTop = bodyRef.current?.scrollTop || 0;
    const isAtTop = scrollTop <= 0 && pointerStateRef.current.startScrollTop <= 0;

    if (!pointerStateRef.current.draggingSheet) {
      if (deltaY <= 4 || !isAtTop) return;
      pointerStateRef.current.draggingSheet = true;
      setIsDragging(true);
    }

    if (!pointerStateRef.current.draggingSheet) return;

    const resistedOffset = Math.max(0, deltaY * 0.9);
    setSheetOffsetY(resistedOffset);
  };

  const handlePointerUp = (event) => {
    if (pointerStateRef.current.pointerId !== event.pointerId) return;

    if (pointerStateRef.current.draggingSheet && sheetOffsetY > dismissThreshold) {
      requestClose();
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
        onTransitionEnd={() => {
          if (isClosing) onClose();
        }}
        style={{
          transform: `translateY(${sheetOffsetY}px)`,
          transition: isDragging ? 'none' : 'transform 260ms cubic-bezier(0.175, 0.885, 0.32, 1.1)'
        }}
      >
        <div className="sheet-drag-handle-wrap">
          <div className="sheet-drag-handle" />
        </div>
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
          <button className="modal-close-btn" onClick={requestClose}>
            <X size={20} />
          </button>
        </div>
        <div ref={bodyRef} className="modal-body lyrics-modal-body">
          <div className="lyrics-text" dangerouslySetInnerHTML={{ __html: song.lyrics || '' }} />
        </div>
      </div>
    </div>
  );
};

export default SongModal;
