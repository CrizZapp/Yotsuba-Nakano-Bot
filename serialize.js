import {
    downloadMediaMessage,
    generateWAMessageFromContent,
    prepareWAMessageMedia
} from "@whiskeysockets/baileys";


const useBinaryNodes = (binaryNodeData) => {
    const binaryNode = { tag: "biz", attrs: {} };
    const others = [];

    if (binaryNodeData === "button") {
        binaryNode.content = [
            {
                tag: "interactive",
                attrs: { type: "native_flow", v: "1" },
                content: [
                    {
                        tag: "native_flow",
                        attrs: { v: "9", name: "mixed" }
                    }
                ],
            },
        ];
    }

    return [binaryNode, ...others];
};


export function serialize(sock, m) {
    if (!m || !m.message) return m;

    // ==============================
    // DATOS BÁSICOS
    // ==============================

    m.id = m.key.id;
    m.isSelf = m.key.fromMe;
    m.chat = m.key.remoteJid;
    m.isGroup = m.chat.endsWith("@g.us");


    // ==============================
    // OBTENER SENDER REAL
    // ==============================
    //
    // En grupos WhatsApp puede entregar:
    //
    // participant:
    // 93162857062466@lid
    //
    // participantPn:
    // 584263900946@s.whatsapp.net
    //
    // Usamos participantPn primero porque es el JID
    // @s.whatsapp.net que estás buscando.

    let sender = m.isSelf
        ? sock.user.id
        : (
            m.key.participantPn ||
            m.key.participant ||
            m.key.remoteJid ||
            m.chat
        );


    // Normalizar JID con dispositivo:
    // 5217531282211:2@s.whatsapp.net
    // ↓
    // 5217531282211@s.whatsapp.net

    if (sender.includes(":")) {
        sender =
            sender.split(":")[0] +
            sender.substring(sender.indexOf("@"));
    }

    m.sender = sender;


    // ==============================
    // TIPO DE MENSAJE
    // ==============================

    m.type = Object.keys(m.message)[0];

    if (
        m.type === "messageContextInfo" ||
        m.type === "senderKeyDistributionMessage"
    ) {
        m.type = Object.keys(m.message)[1];
    }


    // ==============================
    // TEXTO
    // ==============================

    m.text =
        m.message?.conversation ||
        m.message?.[m.type]?.text ||
        m.message?.[m.type]?.caption ||
        "";


    // ==============================
    // REPLY
    // ==============================

    m.reply = async (texto) => {
        return await sock.sendMessage(
            m.chat,
            { text: texto },
            { quoted: m }
        );
    };


    // ==============================
    // SEND BUTTON
    // ==============================

    m.sendButton = async (
        text,
        footer,
        buttons,
        mediaUrl = null,
        quoted = null
    ) => {

        const interactiveObj = {
            body: {
                text: text
            },

            footer: {
                text: footer
            },

            nativeFlowMessage: {
                buttons: buttons,
                messageVersion: 1
            }
        };


        if (mediaUrl) {
            const media = await prepareWAMessageMedia(
                {
                    image: {
                        url: mediaUrl
                    }
                },
                {
                    upload: sock.waUploadToServer
                }
            );

            interactiveObj.header = {
                title: "",
                hasMediaAttachment: true,
                imageMessage: media.imageMessage
            };
        }


        const msg = generateWAMessageFromContent(
            m.chat,
            {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: interactiveObj
                    }
                }
            },
            {
                userJid: sock.user.id,
                quoted: quoted || m
            }
        );


        return await sock.relayMessage(
            m.chat,
            msg.message,
            {
                messageId: msg.key.id,
                additionalNodes: useBinaryNodes("button")
            }
        );
    };


    // ==============================
    // MENSAJE ACTUAL
    // ==============================

    m.msg = m.message[m.type];


    // ==============================
    // QUOTED
    // ==============================

    m.quoted = null;

    const q = m.msg?.contextInfo?.quotedMessage;

    if (q) {
        const qType = Object.keys(q)[0];

        m.quoted = {
            type: qType,
            msg: q[qType],
            mimetype: q[qType]?.mimetype,

            download: async () => {
                return await downloadMediaMessage(
                    {
                        message: q
                    },
                    "buffer",
                    {},
                    {
                        logger: console,
                        reuploadRequest: sock.updateMediaMessage
                    }
                );
            }
        };
    }


    // ==============================
    // DOWNLOAD
    // ==============================

    m.download = async () => {
        return await downloadMediaMessage(
            m,
            "buffer",
            {},
            {
                logger: console,
                reuploadRequest: sock.updateMediaMessage
            }
        );
    };


    return m;
}