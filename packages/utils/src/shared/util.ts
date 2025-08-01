import { fmtDebug } from './fmt';
import { FmtDebugArray, FmtPackage } from './types';

export function fmt(meta: FmtPackage) {
  return {
    debug: (input: FmtDebugArray | string) => {
      return fmtDebug({
        package: meta,
        [isString(input) ? 'string' : 'array']: input,
      });
    },
  };
}

export function isString(type: any) {
  return typeof type === 'string';
}
