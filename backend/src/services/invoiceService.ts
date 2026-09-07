import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { env } from '../config/env'

export type InvoiceDocument = {
  invoiceNumber: string
  registrationNumber: string
  firstName: string
  lastName: string
  phone: string | null
  email: string
  courseName: string
  amount: string
  paymentMethod: string
  paymentDate: Date
  paymentStatus: string
  paymentReference: string | null
}

const storageDirectory = path.resolve(process.cwd(), env.pdfStoragePath)

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const invoiceTemplate = (document: InvoiceDocument) => `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><title>Facture ${escapeHtml(document.invoiceNumber)}</title>
<style>
  * { box-sizing: border-box; } body { margin: 0; color: #172033; font-family: Arial, sans-serif; background: #f4f7f6; }
  .page { width: 794px; min-height: 1123px; margin: 0 auto; padding: 52px 58px; background: white; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #159447; padding-bottom: 26px; }
  .brand { color: #123d2b; font-size: 25px; font-weight: 800; letter-spacing: 1.5px; } .brand span { color: #d93b3b; }
  .eyebrow { margin: 7px 0 0; color: #718096; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; }
  .invoice-title { margin: 0; color: #159447; font-size: 30px; text-align: right; } .number { margin-top: 8px; color: #536174; font-size: 12px; text-align: right; }
  .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin: 42px 0 30px; }
  .label { color: #718096; font-size: 10px; font-weight: bold; letter-spacing: 1.2px; text-transform: uppercase; } .value { margin-top: 8px; font-size: 14px; line-height: 1.55; }
  table { width: 100%; border-collapse: collapse; margin-top: 34px; } th { padding: 13px 14px; color: white; background: #123d2b; font-size: 11px; text-align: left; text-transform: uppercase; } td { padding: 17px 14px; border-bottom: 1px solid #e5e9ee; font-size: 13px; } td:last-child, th:last-child { text-align: right; }
  .total { display: flex; justify-content: flex-end; margin-top: 28px; } .total-box { width: 260px; padding: 18px; background: #ecf8f0; border-left: 4px solid #159447; } .total-label { color: #536174; font-size: 11px; } .total-value { margin-top: 8px; color: #123d2b; font-size: 24px; font-weight: bold; }
  .footer { margin-top: 92px; padding-top: 18px; border-top: 1px solid #dfe5e9; color: #718096; font-size: 10px; line-height: 1.6; }
</style></head>
<body><main class="page">
  <header class="header"><div><div class="brand">VISTO<span>AFRIKA</span></div><p class="eyebrow">Formation et accompagnement</p></div><div><h1 class="invoice-title">FACTURE</h1><div class="number">N° ${escapeHtml(document.invoiceNumber)}</div></div></header>
  <section class="summary"><div><div class="label">Facturé à</div><div class="value"><strong>${escapeHtml(document.firstName)} ${escapeHtml(document.lastName)}</strong><br>${escapeHtml(document.phone ?? 'Téléphone non renseigné')}<br>${escapeHtml(document.email)}</div></div><div><div class="label">Références</div><div class="value">Inscription : <strong>${escapeHtml(document.registrationNumber)}</strong><br>Date : ${escapeHtml(document.paymentDate.toLocaleDateString('fr-FR'))}<br>Statut : <strong>${escapeHtml(document.paymentStatus)}</strong></div></div></section>
  <table><thead><tr><th>Formation</th><th>Moyen de paiement</th><th>Référence</th><th>Montant</th></tr></thead><tbody><tr><td>${escapeHtml(document.courseName)}</td><td>${escapeHtml(document.paymentMethod)}</td><td>${escapeHtml(document.paymentReference ?? 'Non renseignée')}</td><td>${escapeHtml(document.amount)} FCFA</td></tr></tbody></table>
  <div class="total"><div class="total-box"><div class="total-label">TOTAL RÉGLÉ</div><div class="total-value">${escapeHtml(document.amount)} FCFA</div></div></div>
  <footer class="footer">Merci pour votre confiance. Cette facture a été générée électroniquement par VISTOAFRIKA.</footer>
</main></body></html>`

export const generateInvoicePdf = async (document: InvoiceDocument, storageKey: string) => {
  await mkdir(storageDirectory, { recursive: true })
  const { default: puppeteer } = await import('puppeteer')
  const safeStorageKey = path.basename(storageKey)
  const filePath = path.join(storageDirectory, safeStorageKey)
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
  try {
    const page = await browser.newPage()
    await page.setContent(invoiceTemplate(document), { waitUntil: 'load' })
    await page.pdf({ path: filePath, format: 'A4', printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } })
  } finally {
    await browser.close()
  }
  return filePath
}

export const readInvoicePdf = async (storageKey: string) => readFile(path.join(storageDirectory, path.basename(storageKey)))
export const removeInvoicePdf = async (storageKey: string) => unlink(path.join(storageDirectory, path.basename(storageKey))).catch(() => undefined)
export const invoiceStorageKey = (invoiceNumber: string) => `${invoiceNumber}.pdf`
