const chalk = require("chalk");
// Modul ini tetap di-require agar tidak error jika ada file lain yang memanggilnya
const gradient = require("gradient-string"); 
const figlet = require("figlet");
const timeHelper = require("./timeHelper");

const theme = {
  primary: chalk.hex("#00FF88"),
  secondary: chalk.hex("#7B68EE"),
  text: chalk.white,
  dim: chalk.gray,
  muted: chalk.hex("#4B5563"),
  success: chalk.green,
  error: chalk.red,
  warning: chalk.yellow,
  info: chalk.cyan,
  debug: chalk.gray,
  border: chalk.gray,
  tag: chalk.magenta,
};

function timestamp() {
  return chalk.gray(`[${timeHelper.formatTime("HH:mm:ss")}]`);
}

function tag(label) {
  return chalk.cyan(`[${label.toUpperCase()}]`);
}

const logger = {
  info: (label, detail = "") => console.log(`${timestamp()} ${tag(label)} ${detail}`),
  success: (label, detail = "") => console.log(`${timestamp()} ${chalk.green(`[${label.toUpperCase()}]`)} ${detail}`),
  warn: (label, detail = "") => console.log(`${timestamp()} ${chalk.yellow(`[${label.toUpperCase()}]`)} ${detail}`),
  error: (label, detail = "") => console.log(`${timestamp()} ${chalk.red(`[${label.toUpperCase()}]`)} ${detail}`),
  system: (label, detail = "") => console.log(`${timestamp()} ${chalk.gray(`[${label.toUpperCase()}]`)} ${detail}`),
  debug: (label, detail = "") => console.log(`${timestamp()} ${chalk.gray(`[${label.toUpperCase()}]`)} ${detail}`),
  tag: (label, msg, detail = "") => console.log(`${timestamp()} ${tag(label)} ${msg} ${chalk.gray(detail)}`),
};

function logMessage(info) {
  if (typeof info === "string") {
    const [chatType, sender, message] = arguments;
    info = {
      chatType,
      sender,
      message,
      pushName: sender,
      groupName: chatType === "group" ? "Unknown" : "Private",
    };
  }

  const { chatType, groupName, pushName, message } = info;
  if (!message || message.trim() === "" || !pushName) return;

  const isGroup = chatType === "group";
  const cleanMsg = message.replace(/\n/g, " ").substring(0, 100) + (message.length > 100 ? "..." : "");
  
  const header = isGroup 
    ? chalk.yellow(`[${groupName}]`) 
    : chalk.green(`[Private]`);

  // Format 1 Baris: [14:30:12] [MSG] [Grup Mabar] Nando: Halo semua
  console.log(`${timestamp()} ${chalk.blue("[MSG]")} ${header} ${chalk.cyan(pushName)}: ${cleanMsg}`);
}

function logCommand(command, user, chatType) {
  const isGroup = chatType === "group";
  const type = isGroup ? chalk.magenta("[GRUP]") : chalk.green("[PRIVAT]");
  
  // Format 1 Baris: [14:30:12] [CMD] [GRUP] Nando > .menu
  console.log(`${timestamp()} ${chalk.magentaBright("[CMD]")} ${type} ${chalk.cyan(user)} > ${chalk.greenBright(command)}`);
}

function logPlugin(name, category) {
  console.log(`  ${chalk.gray("├─")} ${chalk.green(name)} ${chalk.gray(`[${category}]`)}`);
}

function logConnection(status, info = "") {
  const label =
    status === "connected" ? chalk.green("● TERHUBUNG")
    : status === "connecting" ? chalk.yellow("◐ MENGHUBUNGKAN")
    : chalk.red("○ TERPUTUS");

  console.log(`${timestamp()} ${chalk.cyan("[SYS]")} ${label} - ${info}`);
}

function logErrorBox(title, message) {
  console.log(`${timestamp()} ${chalk.bgRed.white(" ERROR ")} ${chalk.red(title)}`);
  console.log(`           ↳ ${chalk.gray(message)}`);
}

function printBanner(mini = false) {
  console.clear();
  if (mini) {
    console.log(chalk.cyan.bold("ARCELZAI • WhatsApp Bot Engine"));
    console.log("");
    return;
  }
  
  console.log("");
  console.log(chalk.cyan.bold("  ARCELZAI MULTI DEVICE"));
  console.log(chalk.gray("  --------------------------------------"));
  console.log(`  WhatsApp Bot Engine | Powered by ${chalk.green("Nando Dev")}`);
  console.log(chalk.gray("  --------------------------------------"));
  console.log("");
}

function printStartup(info = {}) {
  const { name, version, mode } = info;
  console.log(`  Bot: ${chalk.green(name)} | v${version} | Mode: ${mode} | Prefix: Multi`);
  console.log("");
}

const CODES = {
  reset: "", bold: "", dim: "", italic: "", underline: "",
  green: "", purple: "", white: "", gray: "", phantom: "",
  lime: "", silver: "", red: "", yellow: "", blue: "",
  cyan: "", magenta: "", bgBlack: "", bgGray: "",
};

const c = {
  green: chalk.green,
  purple: chalk.hex("#9B30FF"),
  white: chalk.white,
  gray: chalk.gray,
  bold: chalk.bold,
  dim: chalk.dim,
  greenBold: (t) => chalk.green.bold(t),
  purpleBold: (t) => chalk.hex("#9B30FF").bold(t),
  whiteBold: (t) => chalk.white.bold(t),
  grayDim: (t) => chalk.gray.dim(t),
  red: chalk.red,
  yellow: chalk.yellow,
  cyan: chalk.cyan,
  blue: chalk.blue,
  magenta: chalk.magenta,
};

function divider() {
  console.log(chalk.gray("----------------------------------------------"));
}

function createBanner(lines, color = "green") {
  // Banner simpel untuk hal penting seperti Pairing Code
  let res = chalk.gray("┌" + "─".repeat(40) + "┐\n");
  for (const line of lines) {
    if (line.trim() === "") {
      res += chalk.gray("│" + " ".repeat(40) + "│\n");
    } else {
      const padLeft = Math.floor((40 - line.replace(/\x1B\[\d+m/g, '').length) / 2);
      const padRight = 40 - line.replace(/\x1B\[\d+m/g, '').length - padLeft;
      res += chalk.gray("│") + " ".repeat(padLeft) + line + " ".repeat(padRight) + chalk.gray("│\n");
    }
  }
  res += chalk.gray("└" + "─".repeat(40) + "┘");
  return res;
}

function getTimestamp() {
  return chalk.gray(timeHelper.formatTime("HH:mm:ss"));
}

module.exports = {
  c,
  CODES,
  logger,
  logMessage,
  logCommand,
  logPlugin,
  logConnection,
  logErrorBox,
  printBanner,
  printStartup,
  createBanner,
  getTimestamp,
  divider,
  theme,
  chalk,
  gradient,
};
