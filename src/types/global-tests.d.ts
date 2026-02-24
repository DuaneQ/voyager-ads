// Ambient types used for tests and SDK stubs
declare const google: any

declare namespace google {
  const maps: any
}

declare module '@googlemaps/js-api-loader' {
  export class Loader {
    constructor(opts?: any)
    load(): Promise<any>
  }
}

// Allow jest-dom matcher ambient types in tests if not picked up automatically
declare namespace ViTestMatchers {
  // empty placeholder — types are provided by @testing-library/jest-dom
}
