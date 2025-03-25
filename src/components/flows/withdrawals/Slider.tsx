import React from 'react';
import styles from './Slider.module.scss';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  color?: 'RED' | 'BLUE';
}

const Slider: React.FC<SliderProps> = ({
  value,
  onChange,
  min,
  max,
  step,
  color = 'RED',
}: SliderProps) => (
  <input
    type="range"
    className={`form-range ${styles.customRangePayout}`}
    value={value}
    onChange={(event) => onChange(event.target.valueAsNumber)}
    min={min}
    max={max}
    step={step}
    style={{
      background: `linear-gradient(to right, ${colorToGradientMap[color]} ${
        (value / max) * 100
      }%, #E0E6EC ${(value / max) * 100}%, #E0E6EC 100%)`,
    }}
  />
);

const colorToGradientMap = {
  RED: '#FF4800 0%, #FF4800',
  BLUE: '#0072EC 0%, #0072EC',
} as const;

export default Slider;
