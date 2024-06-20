import React from 'react';

interface PensionGraphProps {
  startingYear: number | string;
  currentYear: number | string;
  endingYear: number | string;
  markerText: string;
}
const PensionGraph: React.FC<PensionGraphProps> = ({
  startingYear,
  currentYear,
  endingYear,
  markerText,
}) => (
  <svg viewBox="0 0 439 193" fill="none" xmlns="http://www.w3.org/2000/svg">
    <text fill="#333333" xmlSpace="preserve" fontFamily="Roboto" fontSize="12" letterSpacing="0px">
      <tspan x="0.5" y="186.133">
        {startingYear}
      </tspan>
    </text>
    <text
      fill="#333333"
      xmlSpace="preserve"
      fontFamily="Roboto"
      fontSize="12"
      fontWeight="bold"
      letterSpacing="0px"
    >
      <tspan x="136.719" y="186.133">
        {currentYear}
      </tspan>
    </text>
    <text fill="#333333" xmlSpace="preserve" fontFamily="Roboto" fontSize="12" letterSpacing="0px">
      <tspan x="408.5" y="186.133">
        {endingYear}
      </tspan>
    </text>
    <path
      opacity="0.1"
      d="M1 166.842C1 166.842 145.273 164.939 230.5 141.227C316.944 117.175 437 0.5 437 0.5V166.842H227H1Z"
      fill="#0078FF"
    />
    <path
      d="M1 164.827C1 164.827 151.284 168.33 237.876 143.786C328.364 118.137 437 37 437 37"
      stroke="#0078FF"
      strokeWidth="4"
    />
    <path
      d="M1 165.796C1 165.796 127.796 168.878 219 151.104C310.204 133.33 437 71 437 71"
      stroke="#333333"
      strokeWidth="2"
    />
    <path d="M436.5 167L0.500013 167" stroke="#E0E0E0" />
    <circle
      cx="8"
      cy="8"
      r="7"
      transform="matrix(1 0 0 -1 142 168)"
      fill="white"
      stroke="#333333"
      strokeWidth="2"
    />
    <rect x="105" y="114" width="87" height="23" rx="4" fill="#333333" />
    <text fill="white" xmlSpace="preserve" fontFamily="Roboto" fontSize="12" letterSpacing="0px">
      <tspan x="113.139" y="129.133">
        {markerText}
      </tspan>
    </text>
    <line x1="149.5" y1="137" x2="149.5" y2="153" stroke="#333333" strokeWidth="2" />
  </svg>
);

export default PensionGraph;
