import fetch from 'node-fetch';
import config from '../../config.js';
import {
    generateWAMessageFromContent,
    prepareWAMessageMedia,
    proto
} from '@whiskeysockets/baileys';

const pinterestPlugin = async (m, { conn, from, args, command, usedPrefix }) => {

    if (!args || args.length === 0) {
        return m.reply(
            'Por favor, ingresa un término de búsqueda.\n' +
            'Ejemplo: ' + usedPrefix + command + ' momasos'
        );
    }

    let limit = 5;
    let queryArgs = args.slice();

    const lastArg = args[args.length - 1];

    if (!isNaN(lastArg)) {
        limit = parseInt(lastArg);

        if (limit < 1) limit = 1;
        if (limit > 10) limit = 10;

        queryArgs.pop();
    }

    const query = queryArgs.join(' ').trim();

    if (!query) {
        return m.reply(
            'Por favor, ingresa algo para buscar.\n' +
            'Ejemplo: ' + usedPrefix + command + ' gatos'
        );
    }

    await m.reply('🔎 Buscando "' + query + '"...');

    try {

        const apiUrl =
            'https://tester-web.onrender.com/api/pinterest?query=' +
            encodeURIComponent(query) +
            '&limit=' +
            limit;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }

        const data = await response.json();

        if (
            !data ||
            !data.status ||
            !Array.isArray(data.results) ||
            data.results.length === 0
        ) {
            return m.reply(
                '❌ No se encontraron resultados para "' + query + '".'
            );
        }

        const imagenes = [];
        const videos = [];

        for (const result of data.results) {

            if (!result || !result.descarga) continue;

            if (result.tipo === 'imagen') {
                imagenes.push(result);
            }

            if (result.tipo === 'video') {
                videos.push(result);
            }
        }

        // ==========================================
        // 🖼️ CARRUSEL DE IMÁGENES
        // ==========================================

        if (imagenes.length > 0) {

            const cards = [];

            for (const result of imagenes) {

                try {

                    const media = await prepareWAMessageMedia(
                        {
                            image: {
                                url: result.descarga
                            }
                        },
                        {
                            upload: conn.waUploadToServer
                        }
                    );

                    const titulo =
                        result.titulo || 'Imagen de Pinterest';

                    const autor =
                        result.autor || 'Desconocido';

                    const likes =
                        result.likes || 0;

                    cards.push({
                        header: {
                            title: titulo,
                            hasMediaAttachment: true,
                            imageMessage: media.imageMessage
                        },

                        body: {
                            text:
                                '👤 ' + autor +
                                '\n❤️ ' + likes + ' likes'
                        },

                        footer: {
                            text: config.botName
                        },

                        nativeFlowMessage: {
                            buttons: []
                        }
                    });

                } catch (imageError) {

                    console.error(
                        '[PINTEREST] Error preparando imagen:',
                        imageError
                    );
                }
            }

            if (cards.length > 0) {

                const carouselMessage =
                    proto.Message.InteractiveMessage.CarouselMessage.create({
                        cards: cards
                    });

                const interactiveMessage =
                    proto.Message.InteractiveMessage.create({
                        body:
                            proto.Message.InteractiveMessage.Body.create({
                                text:
                                    '📌 *Resultados de Pinterest*\n\n' +
                                    '🔎 Búsqueda: *' + query + '*\n' +
                                    '🖼️ Imágenes: ' + cards.length
                            }),

                        footer:
                            proto.Message.InteractiveMessage.Footer.create({
                                text: config.botName
                            }),

                        carouselMessage: carouselMessage
                    });

                const message =
                    proto.Message.create({
                        interactiveMessage: interactiveMessage
                    });

                const generated =
                    generateWAMessageFromContent(
                        from,
                        message,
                        {
                            userJid: conn.user.id,
                            quoted: m
                        }
                    );

                await conn.relayMessage(
                    from,
                    generated.message,
                    {
                        messageId: generated.key.id
                    }
                );
            }
        }

        // ==========================================
        // 🎥 VIDEOS
        // ==========================================

        for (const result of videos) {

            const caption =
                '📌 *Pinterest*\n\n' +
                '✦ *Título:* ' +
                (result.titulo || 'Sin título') +
                '\n' +
                '✦ *Autor:* ' +
                (result.autor || 'Desconocido') +
                '\n' +
                '✦ *Likes:* ' +
                (result.likes || 0) +
                '\n\n' +
                '◈ ' +
                config.botName;

            await conn.sendMessage(
                from,
                {
                    video: {
                        url: result.descarga
                    },
                    caption: caption
                },
                {
                    quoted: m
                }
            );
        }

    } catch (error) {

        console.error(
            '[ERROR EN PLUGIN ' +
            command.toUpperCase() +
            ']',
            error
        );

        await m.reply(
            '❌ Ocurrió un error al obtener los resultados de Pinterest.'
        );
    }
};

// ==========================================
// ⚙️ COMANDOS
// ==========================================

pinterestPlugin.command = [
    'pin',
    'pinterest'
];

pinterestPlugin.description =
    'Busca y descarga contenido de Pinterest.';

export default pinterestPlugin;
