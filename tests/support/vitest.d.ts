declare module "vitest" {
  export interface ProvidedContext {
    siteArtifact: { root: string; base: string; doneFile: string };
  }
}

export {};
