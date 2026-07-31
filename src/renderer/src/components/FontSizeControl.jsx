import { useState } from 'react';
import { applyScale, clampScale, getStoredScale, MIN_SCALE, MAX_SCALE, SCALE_STEP } from '../fontScale.js';

export default function FontSizeControl() {
  const [scale, setScale] = useState(getStoredScale);

  function change(delta) {
    const next = clampScale(scale + delta);
    setScale(next);
    applyScale(next);
  }

  return (
    <div className="font-size-control">
      <button
        className="icon-btn"
        title="Diminuir fonte das notícias"
        disabled={scale <= MIN_SCALE}
        onClick={() => change(-SCALE_STEP)}
      >
        A-
      </button>
      <button
        className="icon-btn"
        title="Aumentar fonte das notícias"
        disabled={scale >= MAX_SCALE}
        onClick={() => change(SCALE_STEP)}
      >
        A+
      </button>
    </div>
  );
}
