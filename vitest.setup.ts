import '@testing-library/jest-dom'

// jsdom does not implement HTMLMediaElement.prototype.play / pause / load.
// Stub them globally so any component that calls video.play() doesn't throw.
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  configurable: true,
  value: () => Promise.resolve(),
})

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  value: () => {},
})

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  configurable: true,
  value: () => {},
})
