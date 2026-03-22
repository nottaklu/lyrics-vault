import React, { useState } from 'react';
import { Shield, Delete } from 'lucide-react';

const SYMBOLS = ['ᚦ', 'ᛝ', 'ᛟ', 'ᚴ', 'ᚼ', 'ᛘ', 'ᛚ', 'ᛒ', 'ᛞ', 'ᛑ'];
const CORRECT_SEQUENCE = ['ᚦ', 'ᛝ', 'ᛟ', 'ᚴ']; // The secret sequence

const PinOverlay = ({ onVerify, onCancel }) => {
  const [sequence, setSequence] = useState([]);
  const [error, setError] = useState(false);

  const handleTap = (symbol) => {
    if (sequence.length < 4) {
      const newSeq = [...sequence, symbol];
      setSequence(newSeq);
      setError(false);

      if (newSeq.length === 4) {
        if (JSON.stringify(newSeq) === JSON.stringify(CORRECT_SEQUENCE)) {
          onVerify();
        } else {
          setError(true);
          setTimeout(() => setSequence([]), 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setSequence(sequence.slice(0, -1));
  };

  return (
    <div className="pin-overlay fade-in">
      <div className="pin-content glass-morphism dystopian-pad">
        <div className="pin-header">
          <div className="pin-icon-circle">
            <Shield size={24} className={error ? 'text-red-500' : 'text-primary'} />
          </div>
          <h2 className="dystopian-text">ACCESS RESTRICTED</h2>
          <p>Trace the sacred sequence to proceed.</p>
        </div>

        <div className="pin-dots">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pin-dot ${sequence.length > i ? 'active' : ''} ${error ? 'error' : ''}`} />
          ))}
        </div>

        <div className="runic-grid">
          {SYMBOLS.map((s, i) => (
            <button key={i} className="runic-btn" onClick={() => handleTap(s)}>
              {s}
            </button>
          ))}
          <button className="runic-btn backspace" onClick={handleBackspace}>
            <Delete size={20} />
          </button>
        </div>

        <button className="pin-cancel-btn" onClick={onCancel}>
          ABORT ACCESS
        </button>
      </div>
    </div>
  );
};

export default PinOverlay;
