/**
 * This file is used by internal tests
 * Not public
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import util from 'node:util';

export function extract(obj: any, iden?: string) {
  const RaI = crypto.randomInt(1, 79019828291);
  const GID = `[${RaI}\\\\${iden || crypto.randomUUID()}]`;
  let _output = `/**\n* Extract Object - ${GID}\n*/\n`;

  const inspectation = util
    .inspect(obj, true, Infinity, false)
    .replace(/\[length\]:\s*\d+/g, '')
    .trim();

  _output += `
// ${iden || 'Extraction'} ; ${GID}
module.exports = ${inspectation}\n\n/** End Of Extraction. */
    `;

  return {
    output: _output,
    RaI,
    GID,
    FiN: `${iden || '&'}-${RaI}`,
  };
}

export function createFile(path: string, content: string) {
  return fs.writeFileSync(path, content, {
    encoding: 'utf-8',
  });
}
