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
}) => {
  return (
    <svg viewBox="0 0 439 158" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text
        fill="#333333"
        xmlSpace="preserve"
        fontFamily="Roboto"
        fontSize="12"
        letterSpacing="0px"
      >
        <tspan x="0.5" y="151.133">
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
        <tspan x="136.719" y="151.133">
          {currentYear}
        </tspan>
      </text>
      <text
        fill="#333333"
        xmlSpace="preserve"
        fontFamily="Roboto"
        fontSize="12"
        letterSpacing="0px"
      >
        <tspan x="408.5" y="151.133">
          {endingYear}
        </tspan>
      </text>
      <path
        d="M1 129.827C1 129.827 151.284 133.33 237.876 108.786C328.364 83.1367 437 2 437 2"
        stroke="#0078FF"
        strokeWidth="4"
      />
      <path
        d="M1 130.796C1 130.796 127.796 133.878 219 116.104C310.204 98.33 437 36 437 36"
        stroke="#333333"
        strokeWidth="2"
      />
      <path d="M436.5 132L0.500013 132" stroke="#E0E0E0" />
      <circle
        cx="8"
        cy="8"
        r="7"
        transform="matrix(1 0 0 -1 142 133)"
        fill="white"
        stroke="#333333"
        strokeWidth="2"
      />
      <rect x="105" y="79" width="87" height="23" rx="4" fill="#333333" />
      <text fill="white" xmlSpace="preserve" fontFamily="Roboto" fontSize="12" letterSpacing="0px">
        <tspan x="113.139" y="94.1328">
          {markerText}
        </tspan>
      </text>
      <line x1="149.5" y1="102" x2="149.5" y2="118" stroke="#333333" strokeWidth="2" />
    </svg>
  );
};

export default PensionGraph;
