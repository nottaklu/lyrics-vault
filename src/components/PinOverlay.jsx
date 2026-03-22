import React, { useState } from 'react';
import { Lock, Check, X } from 'lucide-react';

const PinOverlay = ({ onVerify, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const CORRECT_PIN = '1234'; // Default PIN

  const handleInput = (val) => {
    if (val.length <= 4) {
      setPin(val);
      setError(false);
      
      if (val === CORRECT_PIN) {
        onVerify();
      } else if (val.length === 4) {
        setError(true);
        setTimeout(() => setPin(''), 500);
      }
    }
  };

  return (
    <div className="pin-overlay fade-in">
      <div className="pin-content glass-morphism">
        <div className="pin-header">
          <div className="pin-icon-circle">
            <Lock size={24} className={error ? 'text-red-500' : 'text-primary'} />
          </div>
          <h2>Security Verification</h2>
          <p>Please enter your 4-digit PIN to access lyrics management.</p>
        </div>

        <div className="pin-input-container">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`pin-dot ${pin.length > i ? 'active' : ''} ${error ? 'error' : ''}`} />
          ))}
        </div>

        <input 
          type="number" 
          autoFocus 
          className="hidden-pin-input"
          value={pin}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={(e) => e.target.focus()}
        />

        <button className="pin-cancel-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default PinOverlay;
