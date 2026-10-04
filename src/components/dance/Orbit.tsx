// Decorative orbit: a glowing sphere with rings that turn at different speeds. CSS only.
const RINGS = [
  { size: "100%", seconds: 38, dot: "top-0 left-1/2" },
  { size: "74%", seconds: 26, dot: "bottom-0 left-1/2" },
  { size: "48%", seconds: 18, dot: "top-1/2 right-0" },
];

export default function Orbit() {
  return (
    <div
      className="stage-orbit relative mx-auto h-72 w-72 sm:h-80 sm:w-80"
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.18),transparent_65%)]" />
      {RINGS.map((r, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border border-amber-300/20"
          style={{
            width: r.size,
            height: r.size,
            marginLeft: `calc(${r.size} / -2)`,
            marginTop: `calc(${r.size} / -2)`,
            animation: `stage-spin ${r.seconds}s linear infinite${i % 2 ? " reverse" : ""}`,
          }}
        >
          <span
            className={`absolute ${r.dot} h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow-[0_0_12px_3px_rgba(251,191,36,0.8)]`}
          />
        </div>
      ))}
      <div
        className="absolute left-1/2 top-1/2 -ml-10 -mt-10 h-20 w-20 rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3d6,#f59e0b_45%,#7c2d12_100%)] shadow-[0_0_70px_14px_rgba(245,158,11,0.4)]"
        style={{ animation: "stage-float 6s ease-in-out infinite" }}
      />
    </div>
  );
}
