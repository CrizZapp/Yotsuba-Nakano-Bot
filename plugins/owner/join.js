const join = async (m, { conn, args }) => {

    // ==========================================
    // 🔐 SOLO EL DUEÑO AUTORIZADO
    // ==========================================

    const owner = '584263900946@s.whatsapp.net';

    if (m.sender !== owner) {
        return m.reply('❌ No tienes permiso para usar este comando.');
    }

    // ==========================================
    // 🔗 COMPROBAR LINK
    // ==========================================

    if (!args || !args[0]) {
        return m.reply(
            '❌ Debes proporcionar el enlace del grupo.\n\n' +
            'Ejemplo:\n' +
            '#join https://chat.whatsapp.com/XXXXXXXXXXXX'
        );
    }

    const link = args[0].trim();

    // Acepta links normales de invitación de WhatsApp
    const match = link.match(
        /(?:https?:\/\/)?chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/
    );

    if (!match) {
        return m.reply(
            '❌ El enlace no parece ser un enlace válido de invitación de WhatsApp.'
        );
    }

    const inviteCode = match[1];

    // ==========================================
    // 🚀 UNIRSE AL GRUPO
    // ==========================================

    try {

        await m.reply('⏳ Intentando unirme al grupo...');

        const groupId = await conn.groupAcceptInvite(inviteCode);

        await m.reply(
            '✅ *Me uní correctamente al grupo.*\n\n' +
            `🆔 ${groupId}`
        );

    } catch (error) {

        console.error('[JOIN] Error:', error);

        await m.reply(
            '❌ No pude unirme al grupo.\n\n' +
            'Puede que el enlace haya expirado, sea inválido o que el bot no pueda aceptar la invitación.'
        );
    }
};

join.command = ['join'];

join.description =
    'Une el bot a un grupo mediante un enlace de invitación.';

export default join;
