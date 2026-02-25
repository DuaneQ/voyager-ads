// Ambient types used for tests and SDK stubs
// eslint-disable-next-line no-var
declare var google: any

declare module '@googlemaps/js-api-loader' {
  export class Loader {
    constructor(opts?: any)
    load(): Promise<any>
  }
  export interface APIOptions {
    key?: string
    v?: string
    libraries?: string[]
    [key: string]: any
  }
  export function setOptions(options: APIOptions): void
  export function importLibrary(libraryName: string): Promise<any>
}
