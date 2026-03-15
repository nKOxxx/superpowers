"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.error = error;
exports.warning = warning;
exports.info = info;
exports.step = step;
exports.divider = divider;
exports.header = header;
exports.formatDuration = formatDuration;
exports.formatBytes = formatBytes;
const chalk_1 = __importDefault(require("chalk"));
function success(message) {
    console.log(chalk_1.default.green('✓'), message);
}
function error(message) {
    console.error(chalk_1.default.red('✗'), message);
}
function warning(message) {
    console.warn(chalk_1.default.yellow('⚠'), message);
}
function info(message) {
    console.log(chalk_1.default.blue('ℹ'), message);
}
function step(message) {
    console.log(chalk_1.default.cyan('→'), message);
}
function divider() {
    console.log(chalk_1.default.gray('─'.repeat(50)));
}
function header(title) {
    console.log();
    console.log(chalk_1.default.bold.white(title));
    divider();
}
function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
}
function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes}B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}
//# sourceMappingURL=format.js.map