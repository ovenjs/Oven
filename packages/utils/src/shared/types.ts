export interface FmtPackage {
  name: string;
  version: string;
}

export interface FmtDebugArray {
  input: Array<string>;
  formatted?: 'unique' | 'exclusive';
}

export interface FmtDebugOptions {
  package: FmtPackage;
  string?: string;
  array?: FmtDebugArray;
}
