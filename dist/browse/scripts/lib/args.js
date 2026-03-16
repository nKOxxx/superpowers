/**
 * Argument parser for browse skill
 */
export function parseArgs(args) {
    const parsed = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (!arg)
            continue;
        if (arg.startsWith('--')) {
            const key = arg.replace(/^--/, '');
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('-')) {
                parsed[key] = nextArg;
                i++;
            }
            else {
                parsed[key] = true;
            }
        }
        else if (arg.startsWith('-')) {
            const key = arg.replace(/^-/, '');
            const nextArg = args[i + 1];
            if (nextArg && !nextArg.startsWith('-')) {
                parsed[key] = nextArg;
                i++;
            }
            else {
                parsed[key] = true;
            }
        }
    }
    return parsed;
}
//# sourceMappingURL=args.js.map