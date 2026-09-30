import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Remitente configurable por env: con la cuenta de Resend en modo
// "sandbox" (sin dominio propio verificado), `onboarding@resend.dev`
// SOLO entrega al correo con el que se creó la cuenta de Resend -- para
// mandar a cualquier cliente real hace falta verificar un dominio propio
// en Resend y apuntar RESEND_FROM_EMAIL a una dirección de ese dominio.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'XInversor <onboarding@resend.dev>';

class EmailDeliveryError extends Error {
  constructor(cause) {
    super('No se pudo enviar el correo de verificación');
    this.name = 'EmailDeliveryError';
    this.statusCode = 502;
    this.cause = cause;
  }
}

const COPY = {
  REGISTER: {
    subject: 'Verifica tu correo para crear tu cuenta',
    heading: 'Confirma tu correo electrónico',
    intro:
      'Usa este código para terminar de crear tu cuenta en XInversor. Nadie más que tú debe conocerlo.',
  },
  CHANGE_PASSWORD: {
    subject: 'Confirma el cambio de tu contraseña',
    heading: 'Confirma tu nueva contraseña',
    intro:
      'Usa este código para confirmar el cambio de contraseña de tu cuenta. Si no fuiste tú, ignora este correo y tu contraseña seguirá igual.',
  },
};

// Tabla en vez de <div>/flex a propósito: es lo único que renderiza
// consistente entre clientes de correo (Gmail, Outlook...), que no
// respetan CSS moderno. Todo el estilo va inline por el mismo motivo.
const buildHtml = ({ heading, intro, code }) => `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fb;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#102b4a;padding:20px 32px;">
            <span style="color:#ffffff;font-size:18px;font-weight:700;">XInversor</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 12px;font-size:20px;color:#173456;">${heading}</h1>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#55657a;">${intro}</p>
            <div style="text-align:center;margin:0 0 24px;">
              <span style="display:inline-block;padding:14px 28px;border-radius:8px;background:#edf4ff;color:#2364d2;font-size:32px;font-weight:700;letter-spacing:8px;">${code}</span>
            </div>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#72839a;">
              Este código vence en 15 minutos y solo puede usarse una vez.
              Si tú no lo solicitaste, puedes ignorar este correo.
            </p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
`;

// `purpose` decide el asunto y el texto; `code` es el de 6 dígitos ya
// generado por verification.service.js (aquí no se genera ni se guarda
// nada, solo se manda).
const sendVerificationEmail = async ({ to, code, purpose }) => {
  const copy = COPY[purpose];

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: copy.subject,
    html: buildHtml({ heading: copy.heading, intro: copy.intro, code }),
  });

  if (error) {
    console.error('Error al enviar correo con Resend:', error);
    throw new EmailDeliveryError(error);
  }
};

export { sendVerificationEmail, EmailDeliveryError };
