export interface FmtPackage {
    name: string;
    version: string;
}

export interface FmtDebugArray {
    input: Array<string>;
    spacing?: "as-is" | "lined-up";
}

export interface FmtDebugOptions {
    package: FmtPackage;
    string?: string;
    array?: FmtDebugArray;
}