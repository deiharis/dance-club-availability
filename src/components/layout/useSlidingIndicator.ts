"use client";

import { useLayoutEffect, useRef, useState } from "react";

// Sidebar "you are here" marker that GLIDES to the active link instead of jumping.
// Put ref={navRef} on a position:relative container, data-active="true" on the active link,
// and render one absolutely positioned indicator with style={indicator}. The first placement
// is instant (no slide in from the top); after that it animates with the app's motion tokens.
// Reduced motion: globals.css turns the transition off (.nav-indicator).
export function useSlidingIndicator(key: string) {
  const navRef = useRef<HTMLElement>(null);
  const [indicator, setIndicator] = useState<React.CSSProperties>({ opacity: 0 });
  const placed = useRef(false);

  useLayoutEffect(() => {
    const place = () => {
      const nav = navRef.current;
      const active = nav?.querySelector<HTMLElement>('[data-active="true"]');
      if (!nav || !active) return setIndicator({ opacity: 0 });
      setIndicator({
        opacity: 1,
        transform: `translateY(${active.offsetTop}px)`,
        height: active.offsetHeight,
        transition: placed.current ? undefined : "none",
      });
      placed.current = true;
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [key]);

  return { navRef, indicator };
}
