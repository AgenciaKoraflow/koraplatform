// Builds the signed document: the original file with the signatures stamped on
// its signature block. Once both parties signed, a signature certificate page is appended.

import { PDFDocument, PDFFont, PDFImage, PDFPage, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import { getDocumentProxy } from "npm:unpdf@0.12.1";

export interface SignerInfo {
  role: "Contratada" | "Contratante";
  name: string;
  email?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  /** How the signer was authenticated, e.g. "Link exclusivo enviado ao signatário". */
  method?: string | null;
  signedAt: string;
  signatureData?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export interface SignedPdfInput {
  original: Uint8Array | null;
  originalType: string;
  documentName: string;
  contractId: string;
  contractTitle: string;
  createdAt?: string | null;
  contractor: SignerInfo;
  /** null while only the contractor has signed: no client stamp and no report page yet. */
  client: SignerInfo | null;
}

const A4: [number, number] = [595.28, 841.89];
const ORANGE = rgb(1, 0.467, 0);
const INK = rgb(0.1, 0.1, 0.12);
const MUTED = rgb(0.42, 0.44, 0.48);
const BORDER = rgb(0.85, 0.86, 0.88);
const GREEN = rgb(0.09, 0.55, 0.33);

// Labels that mark each party's signature slot in the contract.
const SLOT_LABELS = { contractor: "CONTRATADA", client: "CONTRATANTE" } as const;

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d).replace(",", "");
}

function formatCpf(cpf?: string | null): string {
  const n = (cpf || "").replace(/\D/g, "");
  if (n.length !== 11) return cpf || "—";
  return `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}`;
}

// Standard PDF fonts only encode WinAnsi; drop anything else instead of throwing.
function safe(text: string | null | undefined, font: PDFFont): string {
  const value = (text ?? "").replace(/\s+/g, " ").trim();
  let out = "";
  for (const ch of value) {
    try {
      font.encodeText(ch);
      out += ch;
    } catch {
      // unsupported glyph (emoji etc.)
    }
  }
  return out.trim();
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    let piece = word;
    // Break words longer than the line (hashes, user agents)
    while (font.widthOfTextAtSize(piece, size) > maxWidth) {
      let cut = piece.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(piece.slice(0, cut), size) > maxWidth) cut--;
      if (line) lines.push(line);
      lines.push(piece.slice(0, cut));
      line = "";
      piece = piece.slice(cut);
    }
    const candidate = line ? `${line} ${piece}` : piece;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
      lines.push(line);
      line = piece;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function embedSignature(doc: PDFDocument, dataUrl?: string | null): Promise<PDFImage | null> {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) return null;
  const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));
  try {
    return match[1].toLowerCase().includes("png") ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  } catch {
    return null;
  }
}

interface Slot {
  pageIndex: number;
  x: number;
  y: number;
  height: number;
}

/**
 * Finds the signature slots: a line made only of the party labels
 * (e.g. "CONTRATADA    CONTRATANTE"). Body text mentioning the parties is ignored.
 */
async function findSlots(original: Uint8Array): Promise<Partial<Record<keyof typeof SLOT_LABELS, Slot>>> {
  const slots: Partial<Record<keyof typeof SLOT_LABELS, Slot>> = {};
  const pdf = await getDocumentProxy(new Uint8Array(original));

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const lines = new Map<number, { str: string; x: number; y: number; width: number; height: number }[]>();

    for (const raw of content.items as Array<Record<string, unknown>>) {
      const str = raw.str as string | undefined;
      const transform = raw.transform as number[] | undefined;
      if (!str || !str.trim() || !transform) continue;
      const item = {
        str,
        x: transform[4],
        y: transform[5],
        width: (raw.width as number) || 0,
        height: (raw.height as number) || Math.abs(transform[3]) || 10,
      };
      const key = [...lines.keys()].find((k) => Math.abs(k - item.y) < 2) ?? item.y;
      lines.set(key, [...(lines.get(key) ?? []), item]);
    }

    for (const items of lines.values()) {
      items.sort((a, b) => a.x - b.x);
      // Letter-spaced labels can arrive split into several items, so match on the joined line.
      const chars: { ch: string; x: number }[] = [];
      for (const it of items) {
        const step = it.str.length ? it.width / it.str.length : 0;
        [...it.str].forEach((ch, i) => {
          if (ch.trim()) chars.push({ ch: ch.toUpperCase(), x: it.x + step * i });
        });
      }
      const joined = chars.map((c) => c.ch).join("");
      if (!/^((CONTRATADA|CONTRATANTE):?)+$/.test(joined)) continue;

      for (const [party, label] of Object.entries(SLOT_LABELS) as [keyof typeof SLOT_LABELS, string][]) {
        const at = joined.indexOf(label);
        if (at === -1) continue;
        // Later matches win: the signature block sits at the end of the contract.
        slots[party] = { pageIndex: p - 1, x: chars[at].x, y: items[0].y, height: items[0].height };
      }
    }
  }
  return slots;
}

function stampSignature(page: PDFPage, slot: Slot, image: PDFImage) {
  const maxWidth = 150;
  const maxHeight = 38;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
  const width = image.width * scale;
  const height = image.height * scale;
  // Sits right above the signature line, which is drawn just over the label.
  const y = slot.y + slot.height + 8;
  page.drawRectangle({ x: slot.x - 4, y: y - 3, width: width + 8, height: height + 6, color: rgb(1, 1, 1) });
  page.drawImage(image, { x: slot.x, y, width, height });
}

function drawReportPage(
  doc: PDFDocument,
  fonts: { regular: PDFFont; bold: PDFFont },
  input: SignedPdfInput & { client: SignerInfo },
  hash: string | null,
  images: { contractor: PDFImage | null; client: PDFImage | null },
) {
  const page = doc.addPage(A4);
  const { regular, bold } = fonts;
  const margin = 40;
  const right = A4[0] - margin;
  const contentWidth = right - margin;
  let y = A4[1] - 48;

  const text = (value: string, x: number, yy: number, size: number, font = regular, color = INK) =>
    page.drawText(safe(value, font), { x, y: yy, size, font, color });
  const rule = (yy: number) =>
    page.drawLine({ start: { x: margin, y: yy }, end: { x: right, y: yy }, thickness: 0.7, color: BORDER });

  text("Certificado de Assinatura", margin, y, 16, bold);
  const brand = "Koraflow";
  text(brand, right - bold.widthOfTextAtSize(brand, 18), y - 2, 18, bold, ORANGE);
  y -= 16;
  text("Datas e horários em UTC-0300 (America/Sao_Paulo)", margin, y, 8, regular, MUTED);
  y -= 11;
  text(`Última atualização em ${formatDateTime(new Date().toISOString())}`, margin, y, 8, regular, MUTED);
  y -= 12;
  rule(y);
  y -= 18;

  const field = (label: string, value: string) => {
    const labelText = `${label}: `;
    const labelWidth = bold.widthOfTextAtSize(labelText, 9);
    text(labelText, margin, y, 9, bold);
    const lines = wrap(safe(value, regular), regular, 9, contentWidth - labelWidth);
    lines.forEach((line, i) => text(line, margin + labelWidth, y - i * 12, 9));
    y -= 12 * Math.max(lines.length, 1) + 2;
  };

  field("Status", "Assinado");
  field("Documento", input.documentName || input.contractTitle);
  field("Contrato", input.contractTitle);
  field("Número", input.contractId);
  field("Data da criação", formatDateTime(input.createdAt));
  field("Hash do documento original (SHA256)", hash ?? "—");

  y -= 6;
  rule(y);
  y -= 20;
  text("Assinaturas", margin, y, 12, bold);
  const counter = "2 de 2 Assinaturas";
  text(counter, right - regular.widthOfTextAtSize(counter, 8), y, 8, regular, MUTED);
  y -= 14;

  const signers: [SignerInfo, PDFImage | null][] = [
    [input.contractor, images.contractor],
    [input.client, images.client],
  ];

  for (const [signer, image] of signers) {
    const boxHeight = 190;
    const top = y;
    const bottom = top - boxHeight;
    page.drawRectangle({
      x: margin, y: bottom, width: contentWidth, height: boxHeight,
      borderColor: BORDER, borderWidth: 0.8,
    });

    // Signature panel on the right of the header row
    const panelX = right - 190;
    page.drawLine({ start: { x: panelX, y: top }, end: { x: panelX, y: top - 78 }, thickness: 0.7, color: BORDER });
    text("Assinatura", panelX + 8, top - 14, 7, regular, MUTED);
    if (image) {
      const scale = Math.min(160 / image.width, 44 / image.height);
      page.drawImage(image, {
        x: panelX + 15 + (160 - image.width * scale) / 2,
        y: top - 66,
        width: image.width * scale,
        height: image.height * scale,
      });
    }

    const badge = "Assinado";
    const badgeWidth = bold.widthOfTextAtSize(badge, 7) + 10;
    page.drawRectangle({ x: margin + 10, y: top - 22, width: badgeWidth, height: 12, color: rgb(0.88, 0.96, 0.91) });
    text(badge, margin + 15, top - 19, 7, bold, GREEN);
    text(`${signer.role} · via Koraflow`, margin + 16 + badgeWidth, top - 19, 7, regular, MUTED);

    text(wrap(safe(signer.name.toUpperCase(), bold), bold, 11, panelX - margin - 24)[0] ?? "", margin + 10, top - 40, 11, bold);
    text(`Data e hora da assinatura: ${formatDateTime(signer.signedAt)}`, margin + 10, top - 54, 8, regular, MUTED);

    page.drawLine({ start: { x: margin, y: top - 78 }, end: { x: right, y: top - 78 }, thickness: 0.7, color: BORDER });

    text("Pontos de autenticação:", margin + 10, top - 94, 9, bold);
    const points: string[] = [];
    if (signer.email) points.push(`E-mail: ${signer.email}`);
    if (signer.cpf) points.push(`CPF: ${formatCpf(signer.cpf)}`);
    if (signer.cnpj) points.push(`CNPJ: ${signer.cnpj}`);
    if (signer.method) points.push(`Autenticação: ${signer.method}`);
    points.push(`IP: ${signer.ip || "não registrado"}`);
    points.push(`Dispositivo: ${signer.userAgent || "não registrado"}`);

    let py = top - 108;
    for (const point of points) {
      for (const line of wrap(safe(point, regular), regular, 8, contentWidth - 20).slice(0, 2)) {
        text(line, margin + 10, py, 8);
        py -= 11;
      }
    }
    y = bottom - 12;
  }

  // Footer
  let fy = 86;
  rule(fy + 14);
  text("VALIDADE JURÍDICA", margin, fy, 9, bold);
  fy -= 13;
  const legal = [
    "Assinaturas eletrônicas têm validade legal, conforme MP 2.200-2/2001 e Lei 14.063/2020.",
    `Este certificado é parte integrante do documento número ${input.contractId}. ` +
      "A integridade do documento original pode ser conferida pelo hash SHA256 informado acima.",
  ];
  for (const paragraph of legal) {
    for (const line of wrap(safe(paragraph, regular), regular, 8, contentWidth)) {
      text(line, margin, fy, 8, regular, MUTED);
      fy -= 10;
    }
  }
  text(`Koraflow - ${input.contractId} | Documento assinado eletronicamente`, margin, 24, 7, regular, MUTED);
}

export async function buildSignedPdf(input: SignedPdfInput): Promise<{ pdf: Uint8Array; hash: string | null }> {
  const { original } = input;
  const type = input.originalType.toLowerCase();
  const name = input.documentName.toLowerCase();
  const isPdf = !!original && (type.includes("pdf") || name.endsWith(".pdf"));
  const isImage = !!original && (type.includes("image") || /\.(png|jpe?g)$/.test(name));

  let doc: PDFDocument;
  if (isPdf) {
    doc = await PDFDocument.load(original!, { ignoreEncryption: true });
  } else {
    doc = await PDFDocument.create();
    if (isImage) {
      const image = type.includes("png") || name.endsWith(".png")
        ? await doc.embedPng(original!)
        : await doc.embedJpg(original!);
      const scale = Math.min((A4[0] - 60) / image.width, (A4[1] - 60) / image.height, 1);
      const page = doc.addPage(A4);
      page.drawImage(image, {
        x: (A4[0] - image.width * scale) / 2,
        y: A4[1] - 30 - image.height * scale,
        width: image.width * scale,
        height: image.height * scale,
      });
    }
  }

  const images = {
    contractor: await embedSignature(doc, input.contractor.signatureData),
    client: input.client ? await embedSignature(doc, input.client.signatureData) : null,
  };

  if (isPdf) {
    try {
      const slots = await findSlots(original!);
      const pages = doc.getPages();
      for (const party of ["contractor", "client"] as const) {
        const slot = slots[party];
        const image = images[party];
        if (slot && image && pages[slot.pageIndex]) stampSignature(pages[slot.pageIndex], slot, image);
      }
    } catch (e) {
      // The report page still carries both signatures.
      console.error("Could not locate signature slots:", e);
    }
  }

  const hash = original ? await sha256Hex(original) : null;
  if (input.client) {
    const fonts = {
      regular: await doc.embedFont(StandardFonts.Helvetica),
      bold: await doc.embedFont(StandardFonts.HelveticaBold),
    };
    drawReportPage(doc, fonts, { ...input, client: input.client }, hash, images);
  }

  return { pdf: await doc.save(), hash };
}
