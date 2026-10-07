// A template (unlike a layout) remounts on every navigation, so each page gets a short fade +
// tiny rise (.page-enter in globals.css: 320 ms, brand easing, off for reduced motion).
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
