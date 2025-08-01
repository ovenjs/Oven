import { FmtDebugOptions } from './types';

export const fmtColors = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  NC: '\x1b[0m',
};

export function fmtDebug(options: FmtDebugOptions): string | Error {
  if (options.string) {
    const prepre_point = ` _`.repeat(10);
    const pre_point = `\n|\n`;

    const starting_point = `| ${fmtColors.GREEN}@ovenjs${fmtColors.NC}/${fmtColors.RED}${options.package.name}${fmtColors.NC} ~ v${fmtColors.YELLOW}${options.package.version}${fmtColors.NC} \n|`;

    let middle_point = `[${options.package.name.toUpperCase()}]: ${options.string}\n|`;

    if (options.string.includes('\n')) {
      const lines = options.string.split('\n');
      middle_point = ``;
      for (let i = 0; i < lines.length; i++) {
        middle_point += `[${options.package.name.toUpperCase()}]: ${lines[i]}\n|`;
      }
    }

    const ending_point = ` _`.repeat(10).trimStart();

    const combined =
      prepre_point + pre_point + starting_point + middle_point + ending_point;
    const combined_lines = combined.split('\n');
    const combined_nl = combined_lines.map(line => `- ${line}`);
    const combined_clean = combined_nl.join('\n');
    return combined_clean;
  }

  if (options.array) {
    options.array.formatted ??= 'exclusive';

    const top = ' _'.repeat(10);
    const empty_space = '\n|\n';
    const starting_point = `| ${fmtColors.GREEN}@ovenjs${fmtColors.NC}/${fmtColors.RED}${options.package.name}${fmtColors.NC} ~ v${fmtColors.YELLOW}${options.package.version}${fmtColors.NC}\n`;
    let lines = '';
    if (options.array.formatted === 'exclusive')
      lines = `| [${options.package.name.toUpperCase()}]:\n`;

    for (let i = 0; i < options.array.input.length; i++) {
      if (options.array.formatted === 'exclusive') {
        lines += `|       [${i}]: ${options.array.input[i]}\n`;
      } else {
        lines += `| [${options.package.name.toUpperCase()}]: ${options.array.input[i]}\n`;
      }
    }

    const bottom = ' _'.repeat(10);
    const combined_all = top + empty_space + starting_point + lines + bottom;
    const combined_clean = combined_all
      .split('\n')
      .map(line => `- ${line}`)
      .join('\n');

    const combined = combined_clean;
    return combined;
  }

  throw new Error('Unknown Input. Must be either a String or an Array');
}

export function fmtGroup(group: Array<string>) {
  return {
    _: group.length,
    add: (text: string) => group.push(text),
    fmt: () => group.join('\n'),
    fmtArray: () => group,
  };
}
