// A template (unlike a layout) remounts on every navigation, so each page fades up as it opens.
export default function DanceTemplate({ children }: { children: React.ReactNode }) {
  return <div className="anim-fade-up">{children}</div>;
}
