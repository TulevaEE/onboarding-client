import React from 'react';
import styles from './Slider.module.scss';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
}

const Slider: React.FC<SliderProps> = ({ value, onChange, min, max, step }) => (
  <input
    type="range"
    className={`form-range ${styles.customRangePayout}`}
    value={value}
    onChange={(event) => onChange(event.target.valueAsNumber)}
    min={min}
    max={max}
    step={step}
    style={{
      background: `linear-gradient(to right, #FF4800 0%, #FF4800 ${(value / max) * 100}%, #E0E6EC ${
        (value / max) * 100
      }%, #E0E6EC 100%)`,
    }}
  />
);

export default Slider;
