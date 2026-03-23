import React, { useState } from 'react';
import { Delete } from 'lucide-react';

const PinLock = ({ onCorrect, title = "Siddh's Lyrics", subtitle = "Enter PIN" }) => {
  const [pin, setPin] = useState('');
  const CORRECT_PIN = '9900';

  const handleKeyClick = (num) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === CORRECT_PIN) {
          onCorrect();
        } else {
          // Vibrate or shake effect could go here
          setTimeout(() => setPin(''), 400);
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  return (
    <div className="pin-overlay">
      <div className="pin-container">
        <div className="pin-header">
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>{title}</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>{subtitle}</p>
        </div>

        <div className="pin-dots">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pin-dot ${pin.length > i ? 'active' : ''} ${pin.length === 4 && pin !== CORRECT_PIN ? 'error' : ''}`} />
          ))}
        </div>

        <div className="pin-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} className="pin-key" onClick={() => handleKeyClick(num.toString())}>
              {num}
            </button>
          ))}
          <div className="pin-key empty"></div>
          <button className="pin-key" onClick={() => handleKeyClick('0')}>0</button>
          <button className="pin-key delete" onClick={handleDelete}>
            <Delete size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinLock;
