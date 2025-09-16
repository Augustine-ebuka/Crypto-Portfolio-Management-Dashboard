import "@testing-library/jest-dom";
import ResizeObserver from "resize-observer-polyfill";

// Mock ResizeObserver for recharts
(global as any).ResizeObserver = ResizeObserver;

// Mock element sizes so ResponsiveContainer works
Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
  configurable: true,
  value: 800,
});
Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
  configurable: true,
  value: 600,
});
