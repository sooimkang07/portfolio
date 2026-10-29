/* Shared logical-property and length normalization for generated inline styles. */
const DIMENSIONS = {
  width: "inline-size",
  height: "block-size",
  "min-width": "min-inline-size",
  "max-width": "max-inline-size",
  "min-height": "min-block-size",
  "max-height": "max-block-size",
  top: "inset-block-start",
  bottom: "inset-block-end",
  left: "inset-inline-start",
  right: "inset-inline-end",
  "margin-top": "margin-block-start",
  "margin-bottom": "margin-block-end",
  "margin-left": "margin-inline-start",
  "margin-right": "margin-inline-end",
  "padding-top": "padding-block-start",
  "padding-bottom": "padding-block-end",
  "padding-left": "padding-inline-start",
  "padding-right": "padding-inline-end",
  "border-top": "border-block-start",
  "border-bottom": "border-block-end",
  "border-left": "border-inline-start",
  "border-right": "border-inline-end",
  "border-top-width": "border-block-start-width",
  "border-bottom-width": "border-block-end-width",
  "border-left-width": "border-inline-start-width",
  "border-right-width": "border-inline-end-width",
  "border-top-color": "border-block-start-color",
  "border-bottom-color": "border-block-end-color",
  "border-left-color": "border-inline-start-color",
  "border-right-color": "border-inline-end-color",
  "border-top-style": "border-block-start-style",
  "border-bottom-style": "border-block-end-style",
  "border-left-style": "border-inline-start-style",
  "border-right-style": "border-inline-end-style",
  "border-top-left-radius": "border-start-start-radius",
  "border-top-right-radius": "border-start-end-radius",
  "border-bottom-left-radius": "border-end-start-radius",
  "border-bottom-right-radius": "border-end-end-radius",
  "scroll-margin-top": "scroll-margin-block-start",
  "scroll-padding-top": "scroll-padding-block-start",
  "scroll-padding-bottom": "scroll-padding-block-end",
};
const SPACING = {
  4: "--s-1",
  8: "--s-2",
  12: "--s-3",
  16: "--s-4",
  20: "--s-5",
  24: "--s-6",
  32: "--s-7",
  40: "--s-8",
  48: "--s-9",
  64: "--s-10",
  96: "--s-11",
};
function lengths(value, prop, isToken) {
  // Quoted URLs, content and embedded SVGs are opaque data, never stylesheet dimensions.
  return value.replace(
    /url\((?:[^)(]|\([^)]*\))*\)|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|(-?(?:\d*\.)?\d+)px\b/g,
    (all, num) => {
      if (num === undefined) return all;
      const n = Number(num);
      if (!isToken && /^(?:margin|padding|(?:row-|column-)?gap)/.test(prop) && SPACING[Math.abs(n)])
        return n < 0 ? `calc(var(${SPACING[-n]}) * -1)` : `var(${SPACING[n]})`;
      return `${Number((n / 16).toFixed(8))}rem`;
    },
  );
}

module.exports = { DIMENSIONS, lengths };
