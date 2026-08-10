import axios from 'axios';
import yts from 'yt-search';
import config from '../../config.js';

const play = async (m, { conn, from, args, usedPrefix, command }) => {
    if (!args[0]) {
        return m.reply(`*⚠️ Uso correcto:*\n${usedPrefix + command} <búsqueda>`);
    }

    const query = args.join(' ');
    const apikey = 'AETHER-a33ab1e6b9649a3d876571ad';
    const apiBaseUrl = 'https://aetherapi-i7fc.onrender.com';

    try {
        // --- FASE 1: BÚSQUEDA Y MENÚ DE BOTONES ---
        if (command === 'play') {
            await m.reply('⏳ _Buscando..._');
            
            const search = await yts(query);
            if (!search.videos || search.videos.length === 0) {
                return m.reply('❌ No se encontraron resultados.');
            }

            const video = search.videos[0]; 

            const texto = `*🎵 REPRODUCTOR DE YOUTUBE 🎵*\n\n` +
                          `> 📌 *Título:* ${video.title}\n` +
                          `> ⏱️ *Duración:* ${video.timestamp}\n` +
                          `> 👤 *Canal:* ${video.author.name}\n` +
                          `> 👀 *Vistas:* ${video.views}`;
            
            const footer = `${config.botName}`;

            const buttons = [
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🎵 Descargar Audio",
                        id: `${usedPrefix}playaudio ${video.url}`
                    })
                },
                {
                    name: "quick_reply",
                    buttonParamsJson: JSON.stringify({
                        display_text: "🎥 Descargar Video",
                        id: `${usedPrefix}ytmp4 ${video.url}`
                    })
                }
            ];

            // ⚠️ AQUÍ ESTÁ LA CORRECCIÓN ⚠️
            // Cambiamos el orden a: texto, footer, botones, imagen
            await m.sendButton(texto, footer, buttons, video.thumbnail);
            
            return;
        }

        // --- FASE 2: DESCARGA AUTOMÁTICA ---
        const audioCommands = ['playaudio', 'mp3', 'ytmp3'];
        const isAudio = audioCommands.includes(command);
        const endpoint = isAudio ? '/api/ytmp3' : '/api/ytmp4';
        
        await m.reply(isAudio ? '⏳ _Descargando tu audio..._' : '⏳ _Descargando tu video..._');

        const response = await axios.get(`${apiBaseUrl}${endpoint}`, {
            params: { query: query, apikey: apikey }
        });

        const data = response.data;

        if (!data.status) {
            return m.reply(`❌ Error al descargar el archivo.`);
        }

        const chatId = from || m.chat;

        if (isAudio) {
            await conn.sendMessage(chatId, { 
                audio: { url: data.download_url }, 
                mimetype: 'audio/mp4',
                fileName: `${data.title}.mp3`
            }, { quoted: m });
        } else {
            await conn.sendMessage(chatId, { 
                video: { url: data.download_url }, 
                mimetype: 'video/mp4',
                fileName: `${data.title}.mp4`
            }, { quoted: m });
        }

    } catch (error) {
        console.error(`Error en el comando ${command}:`, error);
        m.reply('❌ Ocurrió un error al procesar tu solicitud.');
    }
};

play.command = ['play', 'playaudio', 'mp3', 'ytmp3', 'mp4', 'ytmp4'];
export default play;
