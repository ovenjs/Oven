import { FmtDebugArray, FmtPackage } from '@ovendjs/utils';

declare module '@ovendjs/utils' {
  function fmt(meta: FmtPackage): {
    debug(input: string | FmtDebugArray): string;
  };
  
  function fmtDebug(options: any): string;
}