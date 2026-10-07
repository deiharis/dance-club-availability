// Decorative 3D orbit: a glowing sphere with three tilted rings (like an atom) turning at
// different speeds. CSS 3D only (perspective + preserve-3d), no library, no canvas.
//
// Each ring lives in its own tilted plane: rotateZ(--a) rotateX(--rx). The ring spins inside
// that plane, so it passes behind the sphere and comes back in front (the browser sorts depth).
// The glowing dot rides the ring's edge and is "billboarded": it undoes the spin and the tilt
// (orbit-billboard in globals.css), so it always faces you as a round dot instead of a squashed
// sliver. Reduced motion: globals.css stops every animation; the inline transforms below are the
// correct still pose.
const RINGS = [
  { size: "100%", seconds: 38, a: 0, rx: 72 },
  { size: "76%", seconds: 26, a: 58, rx: 70 },
  { size: "52%", seconds: 18, a: -58, rx: 66 },
];

export default function Orbit() {
  return (
    <div
      className="stage-orbit relative mx-auto h-72 w-72 sm:h-80 sm:w-80"
      style={{ perspective: "900px" }}
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.18),transparent_65%)]" />

      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {/* The sphere sits at the centre of the 3D space; ring halves behind it are hidden by it. */}
        <div
          className="absolute left-1/2 top-1/2 -ml-11 -mt-11 h-[5.5rem] w-[5.5rem] rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff3d6,#f59e0b_45%,#7c2d12_100%)] shadow-[0_0_70px_14px_rgba(245,158,11,0.4)]"
          style={{ animation: "stage-float 6s ease-in-out infinite" }}
        />

        {RINGS.map((r, i) => {
          const dir = i % 2 ? "reverse" : "normal";
          const vars = { "--a": `${r.a}deg`, "--rx": `${r.rx}deg` } as React.CSSProperties;
          return (
            // The tilted plane of this ring
            <div
              key={i}
              className="absolute left-1/2 top-1/2"
              style={{
                ...vars,
                width: r.size,
                height: r.size,
                marginLeft: `calc(${r.size} / -2)`,
                marginTop: `calc(${r.size} / -2)`,
                transformStyle: "preserve-3d",
                transform: `rotateZ(${r.a}deg) rotateX(${r.rx}deg)`,
              }}
            >
              {/* The ring itself, spinning in its plane; its 1px border is the line. */}
              <div
                className="absolute inset-0 rounded-full border border-amber-300/30"
                style={{
                  transformStyle: "preserve-3d",
                  animation: `stage-spin ${r.seconds}s linear infinite ${dir}`,
                }}
              >
                {/* The dot: centred on the ring's top edge, always facing the viewer. */}
                <span
                  className="absolute left-1/2 h-2.5 w-2.5 rounded-full bg-amber-200 shadow-[0_0_14px_4px_rgba(251,191,36,0.85)]"
                  style={{
                    ...vars,
                    top: "-0.5px",
                    transform: `translate(-50%, -50%) rotateZ(0deg) rotateX(-${r.rx}deg) rotateZ(-${r.a}deg)`,
                    animation: `orbit-billboard ${r.seconds}s linear infinite ${dir}`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
