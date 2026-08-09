import config from '../../config.js';

const miid = async (m, { usedPrefix }) => {

    const id = m.sender;

    const buttons = [
        {
            name: "cta_copy",
            buttonParamsJson: JSON.stringify({
                display_text: "📋 Copiar ID",
                copy_code: id
            })
        }
    ];

    const texto = `🆔 *Tu ID de WhatsApp*\n\n> ${id}`;

    const footer = `${config.botName}`;

    await m.sendButton(
        texto,
        footer,
        buttons
    );
};

miid.command = ["miid", "id"];

export default miid;
