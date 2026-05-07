import "@testing-library/jest-dom";

// Radix `ScrollArea` depends on ResizeObserver; jsdom doesn't provide it.
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).ResizeObserver ??= MockResizeObserver;