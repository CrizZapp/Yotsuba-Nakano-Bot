import config from '../../config.js';

const menu = async (m, { usedPrefix }) => {

    // ==========================================
    // 📂 GENERAR CATEGORÍAS AUTOMÁTICAMENTE
    // ==========================================

    const categorias = {};

    for (const [filePath, plugin] of Object.entries(global.plugins || {})) {

        if (!plugin) continue;
        if (!plugin.command) continue;

        // Obtener categoría real del plugin
        const categoria =
            global.pluginCategories?.[filePath] || 'general';

        if (!categorias[categoria]) {
            categorias[categoria] = [];
        }

        const comandos = Array.isArray(plugin.command)
            ? plugin.command
            : [plugin.command];

        for (const comando of comandos) {

            if (typeof comando !== 'string') continue;

            // Evitar comandos repetidos
            if (categorias[categoria].some(x => x.command === comando)) {
                continue;
            }

            categorias[categoria].push({
                command: comando,
                description:
                    plugin.description ||
                    `Ejecuta el comando ${usedPrefix}${comando}`
            });
        }
    }

    // ==========================================
    // 🔘 CREAR SECTIONS DINÁMICAMENTE
    // ==========================================

    const sections = [];

    for (const [categoria, comandos] of Object.entries(categorias)) {

        if (!comandos.length) continue;

        // Nombre de la categoría
        const nombreCategoria =
            categoria.charAt(0).toUpperCase() +
            categoria.slice(1);

        // Crear las rows de ESTA categoría
        const rows = comandos.map(({ command, description }) => ({
            title: command,
            description: description,
            id: `${usedPrefix}${command}`
        }));

        // Crear automáticamente una section
        sections.push({
            title: nombreCategoria,
            rows: rows
        });
    }

    // ==========================================
    // 📍 ESTADO FALSO
    // ==========================================

    const estadoFalso = {
        key: {
            remoteJid: 'status@broadcast',
            fromMe: false,
            id: 'ADVERT',
            participant: '0@s.whatsapp.net'
        },
        message: {
            locationMessage: {
                degreesLatitude: -12.046374,
                degreesLongitude: -77.042793,
                name: 'WhatsApp ✔️ • Estado',
                address: `📍 ${config.botName}`
            }
        }
    };

    // ==========================================
    // 🔘 MENÚ INTERACTIVO
    // ==========================================

    const buttons = [
        {
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
                title: '📂 𝕸𝖊𝖓𝖚́ 𝕯𝖊 𝕮𝖔𝖒𝖆𝖓𝖉𝖔𝖘',

                // 👇 TODAS LAS CATEGORÍAS SE CREAN SOLAS
                sections: sections
            })
        }
    ];

    // ==========================================
    // 📝 TEXTO PRINCIPAL
    // ==========================================

    const texto =
`ֺ ˳ּ✿ ׁ ׅHola, Soy ${config.botName}, Este es mi menu o(^o^)o 𝟹𝟹 ✿

ֺ ˳ּ 🏵 〫࣫🌼┄─ׁ┉─ׁ┉ׁ─ׁ┄🌼 ׁ🌞 ׁ ׅ

🌟˚₊· ͟͟͞͞➳❥ Prefijo : [ # ]
⭐️˚₊· ͟͟͞͞➳❥ Creador/a: ${config.ownerName}\n`;

    // ==========================================
    // 🖼️ IMAGEN
    // ==========================================

    const footer = config.botName;

    const imgUrl =
        'https://yoru-box.onrender.com/1786211034776';

    // ==========================================
    // 📤 ENVIAR
    // ==========================================

    await m.sendButton(
        texto,
        footer,
        buttons,
        imgUrl,
        estadoFalso
    );
};

menu.command = ['menu', 'help'];

export default menu;