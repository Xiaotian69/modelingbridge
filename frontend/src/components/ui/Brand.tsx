export function Brand() {
  return (
    <>
      <svg
        className="brand-mark"
        width="34"
        height="34"
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 27V10l14 12L32 10v17M4 10l14 17L32 10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="18" cy="8" r="2" fill="currentColor" />
      </svg>
      <span className="brand-word">
        模桥<span>ModelingBridge</span>
      </span>
    </>
  );
}
