import { readFile } from 'node:fs/promises'
import nodemailer, { type SendMailOptions } from 'nodemailer'

import { env } from '../config/env'
import { prisma } from '../config/prisma'

export type RegistrationEmailData = {
  firstName: string
  lastName: string
  email: string
  phone: string | null
  courseName: string
  amount: string
  registrationId: string
  paymentMethod?: string
  paymentReference?: string | null
  invoiceNumber?: string
}

type EmailMessage = {
  to: string
  subject: string
  html: string
  attachments?: {
    filename: string
    content: string
    encoding?: string
  }[]
}

/**
 * Transporteur Gmail SMTP
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: env.emailUser,
    pass: env.emailAppPassword,
  },
})

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')

const money = (value: string) =>
  `${Number(value).toLocaleString('fr-FR')} XAF`

const layout = (title: string, content: string) => `
<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033">

  <div style="border-bottom:4px solid #159447;padding:24px 0">

    <strong style="font-size:24px;color:#123d2b">
      VISTO<span style="color:#d93b3b">AFRIKA</span>
    </strong>

  </div>

  <h1 style="color:#123d2b;font-size:24px">
    ${title}
  </h1>

  ${content}

  <p style="margin-top:32px;color:#718096;font-size:12px">
    VISTOAFRIKA · Apprendre, préparer, réussir
  </p>

</div>
`

const getSettings = async () => {
  const rows = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: [
          'payment_mtn_number',
          'payment_mtn_holder',
          'payment_orange_number',
          'payment_orange_holder',
          'payment_whatsapp',
          'contact_email',
          'contact_phone',
          'contact_address',
        ],
      },
    },
  })

  return Object.fromEntries(
    rows.map((row) => [row.key, row.value]),
  )
}

class EmailService {
  /**
   * Envoi principal
   */
  private async send(message: EmailMessage) {
    const mailOptions: SendMailOptions = {
      from: env.emailFrom,
      to: message.to,
      subject: message.subject,
      html: message.html,

      ...(message.attachments
        ? {
            attachments: message.attachments.map((attachment) => ({
              filename: attachment.filename,
              content: attachment.content,
              encoding: attachment.encoding ?? 'base64',
            })),
          }
        : {}),
    }

    const info = await transporter.sendMail(mailOptions)

    console.info(
      `[EmailService] Email envoyé: ${info.messageId} -> ${message.to}`,
    )

    return info
  }

  /**
   * Envoi sécurisé :
   * une erreur email ne bloque pas l'opération principale.
   */
  private async sendSafely(message: EmailMessage) {
    try {
      await this.send(message)
    } catch (error) {
      console.error(
        `[EmailService] Échec d’envoi vers ${message.to} (${message.subject}):`,
        error,
      )
    }
  }

  /**
   * Email après inscription
   */
  async registrationRecorded(data: RegistrationEmailData) {
    await this.sendSafely({
      to: data.email,

      subject: 'Votre inscription VISTOAFRIKA est enregistrée',

      html: layout(
        'Inscription enregistrée',
        `
        <p>
          Bonjour
          <strong>
            ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}
          </strong>,
        </p>

        <p>
          Votre inscription à la formation
          <strong>${escapeHtml(data.courseName)}</strong>
          a bien été enregistrée.
        </p>

        <p>
          Montant du dossier :
          <strong>${money(data.amount)}</strong>.
        </p>

        <p>
          Votre numéro d'inscription est
          <strong>${escapeHtml(data.registrationId)}</strong>.
        </p>
        `,
      ),
    })
  }

  /**
   * Instructions de paiement
   */
  async paymentInstructions(data: RegistrationEmailData) {
    const settings = await getSettings()

    await this.sendSafely({
      to: data.email,

      subject: 'Instructions de paiement VISTOAFRIKA',

      html: layout(
        'Instructions de paiement',
        `
        <p>
          Bonjour
          <strong>
            ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}
          </strong>,
        </p>

        <p>
          Merci d’avoir réservé avec VISTOAFRIKA !
        </p>

        <p>
          Votre réservation a été enregistrée.
        </p>

        <p>
          <strong>MTN Mobile Money :</strong><br>
          ${escapeHtml(settings.payment_mtn_number ?? '')}<br>
          Titulaire :
          ${escapeHtml(settings.payment_mtn_holder ?? '')}
        </p>

        <p>
          <strong>Orange Money :</strong><br>
          ${escapeHtml(settings.payment_orange_number ?? '')}<br>
          Titulaire :
          ${escapeHtml(settings.payment_orange_holder ?? '')}
        </p>

        <p>
          <strong>Montant :</strong>
          ${money(data.amount)}
        </p>

        <p>
          Après paiement, envoyez votre reçu sur WhatsApp :
          <strong>
            ${escapeHtml(settings.payment_whatsapp ?? '')}
          </strong>.
        </p>

        <p>
          La confirmation finale intervient après vérification
          par l'équipe VISTOAFRIKA.
        </p>

        <p>
          <strong>Coordonnées :</strong><br>
          ${escapeHtml(settings.contact_email ?? '')}<br>
          Téléphone :
          ${escapeHtml(settings.contact_phone ?? '')}<br>
          Adresse :
          ${escapeHtml(settings.contact_address ?? '')}<br>
          WhatsApp :
          ${escapeHtml(settings.payment_whatsapp ?? '')}
        </p>
        `,
      ),
    })
  }

  /**
   * Paiement déclaré
   */
  async paymentDeclared(data: RegistrationEmailData) {
    const settings = await getSettings()

    await this.sendSafely({
      to: data.email,

      subject: 'Paiement déclaré - vérification en cours',

      html: layout(
        'Paiement déclaré',
        `
        <p>
          Bonjour
          <strong>
            ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}
          </strong>,
        </p>

        <p>
          Merci d’avoir réservé avec VISTOAFRIKA !
        </p>

        <p>
          Votre paiement a été déclaré et est actuellement
          en attente de vérification par notre équipe.
        </p>

        <p>
          <strong>Montant :</strong>
          ${money(data.amount)}
        </p>

        ${
          data.paymentMethod
            ? `
              <p>
                <strong>Moyen de paiement :</strong>
                ${escapeHtml(data.paymentMethod)}
              </p>
            `
            : ''
        }

        ${
          data.paymentReference
            ? `
              <p>
                <strong>Référence :</strong>
                ${escapeHtml(data.paymentReference)}
              </p>
            `
            : ''
        }

        <p>
          La confirmation finale intervient après vérification
          par l'équipe VISTOAFRIKA.
        </p>

        <p>
          Pour toute question, contactez-nous :
          <br>
          ${escapeHtml(settings.contact_email ?? '')}
          <br>
          ${escapeHtml(settings.contact_phone ?? '')}
        </p>
        `,
      ),
    })
  }

  /**
   * Paiement confirmé
   */
  async paymentConfirmed(data: RegistrationEmailData) {
    await this.sendSafely({
      to: data.email,

      subject: 'Paiement confirmé par VISTOAFRIKA',

      html: layout(
        'Paiement confirmé',
        `
        <p>
          Bonjour
          <strong>
            ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}
          </strong>,
        </p>

        <p>
          Votre paiement de
          <strong>${money(data.amount)}</strong>
          a été vérifié et votre inscription est confirmée.
        </p>

        <p>
          Formation :
          <strong>${escapeHtml(data.courseName)}</strong>.
        </p>

        <p>
          Merci pour votre confiance et bienvenue chez VISTOAFRIKA.
        </p>
        `,
      ),
    })
  }

  /**
   * Paiement rejeté
   */
  async paymentRejected(
    data: RegistrationEmailData,
    comment?: string,
  ) {
    await this.sendSafely({
      to: data.email,

      subject: 'Action requise concernant votre paiement',

      html: layout(
        'Paiement rejeté',
        `
        <p>
          Bonjour
          <strong>
            ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}
          </strong>,
        </p>

        <p>
          Votre paiement de
          <strong>${money(data.amount)}</strong>
          n’a pas pu être validé.
        </p>

        ${
          comment
            ? `
              <p>
                <strong>Commentaire :</strong>
                ${escapeHtml(comment)}
              </p>
            `
            : ''
        }

        <p>
          Veuillez contacter l'équipe VISTOAFRIKA
          pour régulariser votre dossier.
        </p>
        `,
      ),
    })
  }

  /**
   * Facture PDF
   */
  async invoiceAvailable(
    data: RegistrationEmailData,
    storagePath: string,
  ) {
    const content = (await readFile(storagePath)).toString('base64')

    await this.sendSafely({
      to: data.email,

      subject:
        `Votre facture VISTOAFRIKA ${data.invoiceNumber ?? ''}`.trim(),

      html: layout(
        'Facture disponible',
        `
        <p>
          Bonjour
          <strong>
            ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}
          </strong>,
        </p>

        <p>
          Votre facture est disponible en pièce jointe.
        </p>

        <p>
          Numéro de facture :
          <strong>
            ${escapeHtml(data.invoiceNumber ?? '')}
          </strong>.
        </p>

        <p>
          Merci pour votre confiance.
        </p>
        `,
      ),

      attachments: [
        {
          filename: `${data.invoiceNumber ?? 'facture'}.pdf`,
          content,
          encoding: 'base64',
        },
      ],
    })
  }
}

export const emailService = new EmailService()