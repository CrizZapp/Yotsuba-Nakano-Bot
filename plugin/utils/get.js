import fetch from 'node-fetch';
import config from '../../config.js';

const get = async (m, { conn, from, args }) => {

    if (!args || !args[0]) {
        return m.reply(
            '❌ Debes proporcionar una URL.\n\n' +
            'Ejemplo:\n' +
            '#get https://ejemplo.com/api'
        );
    }

    const url = args.join(' ').trim();

    let parsedUrl;

    try {
        parsedUrl = new URL(url);
    } catch {
        return m.reply('❌ La URL no es válida.');
    }

    await m.reply('⏳ Consultando API...');

    try {

        const response = await fetch(parsedUrl.href, {
            method: 'GET',
            headers: {
                'User-Agent': 'Fieren-Bot/API-Tester'
            }
        });

        const contentType =
            response.headers.get('content-type') || '';

        // ==========================================
        // 🖼️ IMAGEN
        // ==========================================

        if (contentType.startsWith('image/')) {

            const buffer = Buffer.from(
                await response.arrayBuffer()
            );

            return await conn.sendMessage(
                from,
                {
                    image: buffer,
                    caption:
                        `⭐️ *Respuesta de ${parsedUrl.origin} ⭐️*\n\n` +
                        `HTTP: ${response.status}\n` +
                        `Tipo: ${contentType}\n\n` +
                        `${config.botName}`
                },
                {
                    quoted: m
                }
            );
        }

        // ==========================================
        // 🎵 AUDIO
        // ==========================================

        if (contentType.startsWith('audio/')) {

            const buffer = Buffer.from(
                await response.arrayBuffer()
            );

            return await conn.sendMessage(
                from,
                {
                    audio: buffer,
                    mimetype: contentType,
                    ptt: false
                },
                {
                    quoted: m
                }
            );
        }

        // ==========================================
        // 🎥 VIDEO
        // ==========================================

        if (contentType.startsWith('video/')) {

            const buffer = Buffer.from(
                await response.arrayBuffer()
            );

            return await conn.sendMessage(
                from,
                {
                    video: buffer,
                    caption:
                        `⭐️ *Respuesta de ${parsedUrl.origin} ⭐️*\n\n` +
                        `HTTP: ${response.status}\n` +
                        `Tipo: ${contentType}\n\n` +
                        `${config.botName}`
                },
                {
                    quoted: m
                }
            );
        }

        // ==========================================
        // 📄 JSON / TEXTO
        // ==========================================

        const rawText = await response.text();

        let data = null;

        try {
            data = JSON.parse(rawText);
        } catch {}

        // ==========================================
        // 🔎 BUSCAR MULTIMEDIA DENTRO DEL JSON
        // ==========================================

        if (data !== null) {

            const mediaUrl = findMediaUrl(data);

            if (mediaUrl) {

                try {

                    const mediaResponse = await fetch(mediaUrl);

                    const mediaType =
                        mediaResponse.headers.get('content-type') || '';

                    const mediaBuffer = Buffer.from(
                        await mediaResponse.arrayBuffer()
                    );

                    const caption =
                        `⭐️ *Respuesta de ${parsedUrl.origin} ⭐️*\n\n` +
                        `HTTP: ${response.status}\n\n` +
                        `${config.botName}`;

                    if (mediaType.startsWith('image/')) {

                        return await conn.sendMessage(
                            from,
                            {
                                image: mediaBuffer,
                                caption
                            },
                            {
                                quoted: m
                            }
                        );
                    }

                    if (mediaType.startsWith('audio/')) {

                        return await conn.sendMessage(
                            from,
                            {
                                audio: mediaBuffer,
                                mimetype: mediaType,
                                ptt: false
                            },
                            {
                                quoted: m
                            }
                        );
                    }

                    if (mediaType.startsWith('video/')) {

                        return await conn.sendMessage(
                            from,
                            {
                                video: mediaBuffer,
                                caption
                            },
                            {
                                quoted: m
                            }
                        );
                    }

                } catch (mediaError) {

                    console.error(
                        '[GET] Error obteniendo multimedia:',
                        mediaError
                    );
                }
            }
        }

        // ==========================================
        // 📝 RESPUESTA DE TEXTO / JSON
        // ==========================================

        let respuesta;

        if (data !== null) {

            respuesta = JSON.stringify(data, null, 2);

        } else {

            respuesta = rawText || 'Sin respuesta.';
        }

        if (respuesta.length > 12000) {
            respuesta =
                respuesta.slice(0, 11900) +
                '\n\n... [respuesta recortada]';
        }

        const texto =
            `⭐️ *Respuesta de ${parsedUrl.origin} ⭐️*\n\n` +
            `\`\`\`\n${respuesta}\n\`\`\`\n\n` +
            `HTTP: ${response.status}\n\n` +
            `${config.botName}`;

        const buttons = [
            {
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: '📋 Copiar respuesta',
                    copy_code: respuesta
                })
            }
        ];

        return await m.sendButton(
            texto,
            config.botName,
            buttons
        );

    } catch (error) {

        console.error('[GET] Error:', error);

        return m.reply(
            `❌ *Error al consultar la API.*\n\n` +
            `${error.message}`
        );
    }
};


// ==========================================
// 🔎 BUSCAR URL MULTIMEDIA EN JSON
// ==========================================

function findMediaUrl(value) {

    if (typeof value === 'string') {

        if (
            /^https?:\/\/.+/i.test(value) &&
            /\.(jpg|jpeg|png|gif|webp|bmp|mp3|wav|ogg|m4a|aac|mp4|mov|webm)(\?.*)?$/i.test(value)
        ) {
            return value;
        }

        return null;
    }

    if (Array.isArray(value)) {

        for (const item of value) {

            const found = findMediaUrl(item);

            if (found) return found;
        }

        return null;
    }

    if (value && typeof value === 'object') {

        const priorityKeys = [
            'url',
            'download',
            'downloadUrl',
            'download_url',
            'media',
            'mediaUrl',
            'media_url',
            'image',
            'imageUrl',
            'image_url',
            'audio',
            'audioUrl',
            'audio_url',
            'video',
            'videoUrl',
            'video_url'
        ];

        for (const key of priorityKeys) {

            if (value[key]) {

                const found = findMediaUrl(value[key]);

                if (found) return found;
            }
        }

        for (const key of Object.keys(value)) {

            const found = findMediaUrl(value[key]);

            if (found) return found;
        }
    }

    return null;
}


// ==========================================
// ⚙️ COMANDO
// ==========================================

get.command = ['get'];

get.description =
    'Realiza una petición GET y muestra o envía su respuesta.';

export default get;