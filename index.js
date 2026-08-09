import * as baileys from "@whiskeysockets/baileys";
import pino from "pino";
import { Boom } from "@hapi/boom";
import figlet from "figlet";
import chalk from "chalk";
import { exec } from "child_process";
import readline from "readline";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

const {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason
} = baileys;

const makeWASocket = baileys.default;

// Almacenamiento seguro para plugins y sus categorías mapeadas
global.plugins = {};
global.pluginCategories = {};

const pluginsDir = path.resolve("./plugins");

const question = (text) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(text, ans => {
    rl.close();
    resolve(ans);
  }));
};

function getFiles(dir, filesList = []) {
    if (!fs.existsSync(dir)) return filesList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            getFiles(fullPath, filesList);
        } else if (file.endsWith(".js")) {
            filesList.push(fullPath);
        }
    }
    return filesList;
}

async function loadPlugin(filePath) {
    try {
        const pluginPath = pathToFileURL(filePath).href;
        const module = await import(`${pluginPath}?update=${Date.now()}`);

        const handler = module.default;

        if (typeof handler !== "function") {
            console.error(
                chalk.red(`[ERROR] ${filePath} no exporta una función por default`)
            );
            return;
        }

        const folderName = path.basename(path.dirname(filePath));

        const category =
            folderName === "plugins"
                ? "general"
                : folderName;

        global.plugins[filePath] = {
            handler,
            command: handler.command,
            category
        };

        global.pluginCategories[filePath] = category;

        console.log(
            chalk.green(`[PLUGIN] Cargado: ${filePath}`)
        );

        console.log(
            chalk.gray(
                `Categoría: ${category} | Comandos: ${
                    Array.isArray(handler.command)
                        ? handler.command.join(", ")
                        : handler.command || "sin comando"
                }`
            )
        );

    } catch (e) {
        console.error(
            chalk.red(`[ERROR] Fallo al cargar plugin: ${filePath}`),
            e
        );
    }
}

async function loadPlugins() {
    if (!fs.existsSync(pluginsDir)) {
        fs.mkdirSync(pluginsDir);
        return;
    }
    const files = getFiles(pluginsDir);
    for (const file of files) {
        await loadPlugin(file);
    }
}

function watchPlugins() {
    fs.watch(pluginsDir, { recursive: true }, async (eventType, filename) => {
        if (filename && filename.endsWith(".js")) {
            const filePath = path.join(pluginsDir, filename);
            if (fs.existsSync(filePath)) {
                await loadPlugin(filePath);
                console.log(chalk.blue(`[SISTEMA] Plugin recargado: ${filename}`));
            } else {
                delete global.plugins[filePath];
                delete global.pluginCategories[filePath];
                console.log(chalk.yellow(`[SISTEMA] Plugin eliminado: ${filename}`));
            }
        }
    });
}

async function startBot() {
  console.clear();
  const logo = figlet.textSync("Fieren-bot", { font: "Standard" });
  console.log(chalk.cyan(logo));

  await loadPlugins();
console.log('\n===== PLUGINS CARGADOS =====');

for (const [file, plugin] of Object.entries(global.plugins)) {
    console.log(
        file,
        '=>',
        global.pluginCategories[file],
        '=>',
        plugin.command
    );
}

console.log('============================\n');
  watchPlugins();

  const { state, saveCreds } = await useMultiFileAuthState("./session");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    browser: ["Ubuntu", "Chrome", "20.0.0"],
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }))
    },
    markOnlineOnConnect: true,
    syncFullHistory: false,
  });

  if (!sock.authState.creds.registered) {
    const number = "527531282211";

    console.log(chalk.cyan("\n[VINCULACIÓN WHATSAPP]"));
    console.log(
        chalk.yellow(`🏵 Número: ${number}`)
    );

    console.log(chalk.yellow("\nGenerando código...\n"));

    const code = await sock.requestPairingCode(number);

    console.log(
        chalk.green("[CÓDIGO GENERADO] ➜ ") +
        chalk.bold.white(code) +
        "\n"
    );
  }

  sock.ev.on("messages.upsert", async (chatUpdate) => {
    const rawM = chatUpdate.messages[0];
    if (!rawM.message) return;

    try {
        const { handler } = await import(`./handler.js?update=${Date.now()}`);
        await handler(sock, rawM);
    } catch (error) {
        console.error(chalk.red("[ERROR EN HANDLER]"), error);
    }
  });

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "close") {
        const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) {
            console.log(chalk.yellow("[SISTEMA] Reconectando..."));
            setTimeout(() => startBot(), 3000); // Pequeña pausa para evitar saturar el socket al reconectar
        } else {
            process.exit(0);
        }
    }
    if (connection === "open") {
        console.log(chalk.green("[SISTEMA] Bot conectado correctamente."));
        exec("rm -rf tmp && mkdir tmp");
    }
  });

  sock.ev.on("creds.update", saveCreds);
}

startBot();
