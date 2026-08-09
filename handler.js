import chalk from 'chalk';

if (typeof global.botStatus === 'undefined') {
    global.botStatus = {};
}

export const handler = async (sock, rawM) => {

    const { serialize } = await import(
        `./serialize.js?update=${Date.now()}`
    );

    const m = serialize(sock, rawM);

    if (!m || !m.message) return;

    const conn = sock;
    const from = m.chat;
    const sender = m.sender;

    let body = m.text || '';

    if (
        m.message.interactiveResponseMessage
            ?.nativeFlowResponseMessage
            ?.paramsJson
    ) {
        try {
            const params = JSON.parse(
                m.message.interactiveResponseMessage
                    .nativeFlowResponseMessage.paramsJson
            );

            body = params.id || body;
        } catch {}
    }

    if (m.message.buttonsResponseMessage?.selectedButtonId) {
        body = m.message.buttonsResponseMessage.selectedButtonId;
    }

    if (m.message.templateButtonReplyMessage?.selectedId) {
        body = m.message.templateButtonReplyMessage.selectedId;
    }

    const usedPrefix = '#';

    if (!body.startsWith(usedPrefix)) return;

    const [cmdName, ...args] = body
        .slice(usedPrefix.length)
        .trim()
        .split(/\s+/);

    if (!cmdName) return;

    const command = cmdName.toLowerCase();

    const plugin = Object.values(global.plugins).find(p => {
        if (!p?.command) return false;

        return Array.isArray(p.command)
            ? p.command.map(x => x.toLowerCase()).includes(command)
            : p.command.toLowerCase() === command;
    });

    if (!plugin) {
        console.log(chalk.yellow(`[PLUGIN] No encontrado: ${command}`));
        return;
    }

    try {
        if (typeof plugin.handler !== 'function') {
            console.error(
                chalk.red(`[PLUGIN] ${command} no tiene handler válido`)
            );
            return;
        }

        await plugin.handler(m, {
            conn,
            from,
            sender,
            usedPrefix,
            args,
            command
        });

    } catch (e) {
        console.error(
            chalk.red(`[ERROR EN ${command.toUpperCase()}]`),
            e
        );

        await m.reply('Ocurrió un error al ejecutar el comando.');
    }
};