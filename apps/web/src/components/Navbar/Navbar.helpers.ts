import { useState, useRef } from "react";
import { useScroll, useMotionValueEvent } from "motion/react";

/**
 * Encapsulates the scroll-based hide/show logic for the Navbar.
 * Returns `hidden` boolean: true when scrolling down past 150px.
 */
export function useNavbarScroll() {
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = lastScrollY.current;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    lastScrollY.current = latest;
  });

  return { hidden };
}
