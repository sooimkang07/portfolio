/* Exploration tabs reuse the shared case-study tab presentation. */
document.querySelectorAll("[data-sb-tabs]").forEach((root) => {
  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const show = (index) => {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.classList.toggle("is-active", active);
      tab.classList.toggle("glass", active);
      tab.setAttribute("aria-selected", active);
      tab.tabIndex = active ? 0 : -1;
      panels[i].classList.toggle("is-active", active);
      panels[i].hidden = !active;
    });
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => show(i));
    tab.addEventListener("keydown", (event) => {
      const next = {
        ArrowRight: (i + 1) % tabs.length,
        ArrowLeft: (i + tabs.length - 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      show(next);
      tabs[next].focus();
    });
  });
  show(0);
});

/* Scroll between each exploration’s main flow and remaining screens. */
document.querySelectorAll(".sb-ex-gallery").forEach((gallery) => {
  const track = gallery.querySelector(".igx__track");
  const previous = gallery.querySelector("[data-sb-previous]");
  const more = gallery.querySelector("[data-sb-more]");
  const dots = [...gallery.querySelectorAll(".igx__dots span")];
  const step = () => track.clientWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
  const sync = () => {
    const index = Math.round(track.scrollLeft / step()) || 0;
    previous.disabled = index === 0;
    more.disabled = index === 1;
    dots.forEach((dot, i) => dot.classList.toggle("is-on", i === index));
  };
  const move = (index) =>
    track.scrollTo({
      left: index * step(),
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    });
  previous.addEventListener("click", () => move(0));
  more.addEventListener("click", () => move(1));
  track.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    move(event.key === "ArrowLeft" ? 0 : 1);
  });
  track.addEventListener("scroll", sync, { passive: true });
  new ResizeObserver(sync).observe(track);
  sync();
});
