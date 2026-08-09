import fetch from 'node-fetch';
import config from '../../config.js';

const upload = async (m, { conn, from }) => {

    const msg = m.quoted || m;
    const mime = msg.mimetype || msg.mediaType || '';

    if (!/image/.test(mime)) {
        return m.reply(
            '❌ Responde a una imagen o envíala junto al comando.'
        );
    }

    try {

        const buffer = await msg.download();

        if (!buffer) {
            return m.reply('❌ No pude descargar la imagen.');
        }

        const base64 =
            `data:${mime};base64,${buffer.toString('base64')}`;

        const response = await fetch(
            'https://yoru-box.onrender.com/upload',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: base64,
                    name: `img_${Date.now()}.png`
                })
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const json = await response.json();

        if (!json.url) {
            throw new Error('La API no devolvió una URL.');
        }

        // ==========================================
        // 🔘 BOTÓN PARA COPIAR
        // ==========================================

        const buttons = [
            {
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: '📋 Copiar enlace',
                    copy_code: json.url
                })
            }
        ];

        // ==========================================
        // 📝 MENSAJE
        // ==========================================

        const texto =
            `✅ *Imagen subida correctamente.*\n\n` +
            `🔗 *Enlace:*\n${json.url}`;

        const footer = config.botName;

        // ==========================================
        // 🖼️ ENVIAR
        // ==========================================

        await m.sendButton(
            texto,
            footer,
            buttons,
            json.url
        );

    } catch (error) {

        console.error(
            '[ERROR EN TOURl]',
            error
        );

        await m.reply(
            '❌ Ocurrió un error al subir la imagen.'
        );
    }
};

// ==========================================
// ⚙️ COMANDOS
// ==========================================

upload.command = [
    'tourl',
    'imgurl',
    'upload'
];

upload.description =
    'Sube una imagen y obtiene un enlace directo.';

export default upload;