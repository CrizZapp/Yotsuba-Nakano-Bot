const leave = async (m, { conn, from }) => {

    // ==========================================
    // 🔐 OWNER AUTORIZADO
    // ==========================================

    const owner = '584263900946@s.whatsapp.net';

    // ==========================================
    // 🤖 CUENTA QUE TIENE EL BOT VINCULADO
    // ==========================================

    let botJid = conn.user && conn.user.id
        ? conn.user.id
        : '';

    // Baileys puede devolver algo como:
    // 1234567890:12@s.whatsapp.net
    // Nos quedamos solamente con el número.
    botJid = botJid
        .split(':')[0]
        .split('@')[0];

    const botNumber = botJid
        ? botJid + '@s.whatsapp.net'
        : '';

    // ==========================================
    // 🔎 COMPROBAR QUIÉN EJECUTA EL COMANDO
    // ==========================================

    const sender = m.sender
        ? m.sender.split(':')[0]
        : '';

    const senderJid = sender.includes('@')
        ? sender
        : sender + '@s.whatsapp.net';

    const autorizado =
        senderJid === owner ||
        senderJid === botNumber;

    if (!autorizado) {
        return m.reply(
            '❌ No tienes permiso para usar este comando.'
        );
    }

    // ==========================================
    // 👥 COMPROBAR QUE SEA UN GRUPO
    // ==========================================

    if (!from || !from.endsWith('@g.us')) {
        return m.reply(
            '❌ Este comando solamente puede utilizarse en grupos.'
        );
    }

    // ==========================================
    // 🚪 SALIR DEL GRUPO
    // ==========================================

    try {

        await m.reply('👋 Saliendo del grupo...');

        await conn.groupLeave(from);

    } catch (error) {

        console.error('[LEAVE] Error:', error);

        await m.reply(
            '❌ No pude salir del grupo.'
        );
    }
};

leave.command = ['leave'];

leave.description =
    'Hace que el bot abandone el grupo.';

export default leave;