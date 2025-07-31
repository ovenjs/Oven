import { FmtDebugOptions } from "./types";

export const fmtColors = {
    RED: '\x1b[31m',
    GREEN: '\x1b[32m',
    YELLOW: '\x1b[33m',
    BLUE: '\x1b[34m',
    NC: '\x1b[0m',
};


export function fmtDebug(options: FmtDebugOptions): string {
    if (options.string) {
        const prepre_point = ` _`.repeat(10);
        const pre_point = `\n|\n`
        const starting_point = `| ${fmtColors.GREEN}@ovenjs${fmtColors.NC}/${fmtColors.RED}${options.package.name}${fmtColors.NC} ~ v${fmtColors.YELLOW}${options.package.version}${fmtColors.NC}`;
        const middle_point = `\n| [${options.package.name.toUpperCase()}]: ${options.string}\n|`;
        const ending_point = ` _`.repeat(10).trimStart();
        const combined = prepre_point + pre_point + starting_point + middle_point + ending_point;
        const combined_lines = combined.split("\n");
        const combined_nl = combined_lines.map(line => `- ${line}`);
        const combined_clean = combined_nl.join("\n")
        return combined_clean;
    }

    return "not-impl"
}