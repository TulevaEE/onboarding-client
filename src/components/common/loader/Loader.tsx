import './Loader.scss';

export const Loader = ({
  className = '',
  label = 'Loading...',
}: {
  className?: string;
  label?: string;
}) => (
  <div className={`loader ${className}`} role="progressbar" aria-label={label}>
    <svg className="circular" viewBox="25 25 50 50">
      <circle
        className="path"
        cx="50"
        cy="50"
        r="20"
        fill="none"
        strokeWidth="3"
        strokeMiterlimit="10"
      />
    </svg>
  </div>
);
