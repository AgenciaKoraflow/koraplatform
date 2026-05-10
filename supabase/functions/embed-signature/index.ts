// Edge Function to embed signatures into PDF documents and send via email
// Uses pdf-lib to manipulate PDFs and add signature images

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

// @ts-ignore: Deno imports
import { PDFDocument, PDFImage, rgb, StandardFonts, drawLine } from "https://esm.sh/pdf-lib@1.17.1";

interface SignatureRequest {
  pdfBase64: string;
  contractTitle: string;
  koraflowSignature?: {
    imageData: string; // base64 PNG
    signerName: string;
    signerEmail: string;
    signedAt: string;
  };
  clientSignature?: {
    imageData: string; // base64 PNG
    signerName: string;
    signerEmail: string;
    signedAt: string;
    cpf?: string;
  };
  sendEmail?: {
    to: string;
    fromAlias: string; // e.g., "contratos@koraflow.com.br"
  };
}

interface SignatureBox {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

// Default signature box positions (can be customized)
const DEFAULT_KORAFLOW_BOX: SignatureBox = {
  x: 50,
  y: 80,
  width: 230,
  height: 120,
  page: 0, // Last page
};

const DEFAULT_CLIENT_BOX: SignatureBox = {
  x: 300,
  y: 80,
  width: 230,
  height: 120,
  page: 0, // Last page
};

async function embedSignatureBox(
  pdfDoc: PDFDocument,
  signatureData: string,
  box: SignatureBox,
  signerName: string,
  signerEmail: string,
  signedAt: string,
  label: string,
  cpf?: string
): Promise<void> {
  // Get the page (use last page if position.page is 0 or out of bounds)
  const pages = pdfDoc.getPages();
  const pageIndex = box.page === 0 ? pages.length - 1 : Math.min(box.page, pages.length - 1);
  const page = pages[pageIndex];
  
  // Load fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Colors
  const blackColor = rgb(0, 0, 0);
  const grayColor = rgb(0.3, 0.3, 0.3);
  const lightGrayColor = rgb(0.5, 0.5, 0.5);
  
  // Draw the signature box border
  page.drawRectangle({
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    borderColor: grayColor,
    borderWidth: 1,
    color: rgb(1, 1, 1),
  });
  
  // Draw label (CONTRATANTE or CONTRATADO)
  const labelFontSize = 9;
  const labelWidth = helveticaBold.widthOfTextAtSize(label, labelFontSize);
  page.drawText(label, {
    x: box.x + (box.width - labelWidth) / 2,
    y: box.y + box.height - 15,
    size: labelFontSize,
    font: helveticaBold,
    color: blackColor,
  });
  
  // Embed the signature image
  let signatureImage: PDFImage;
  
  // Remove data URL prefix if present
  const base64Data = signatureData.replace(/^data:image\/\w+;base64,/, "");
  const binaryString = atob(base64Data);
  const imageBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    imageBytes[i] = binaryString.charCodeAt(i);
  }
  
  // Try to detect image format (PNG or JPEG)
  try {
    // PNG signature: 89 50 4E 47
    if (imageBytes[0] === 0x89 && imageBytes[1] === 0x50) {
      signatureImage = await pdfDoc.embedPng(imageBytes);
    } else {
      // Assume JPEG
      signatureImage = await pdfDoc.embedJpg(imageBytes);
    }
  } catch (e) {
    // If PNG fails, try JPEG
    try {
      signatureImage = await pdfDoc.embedJpg(imageBytes);
    } catch (e2) {
      console.error("Failed to embed signature image:", e2);
      return;
    }
  }
  
  // Calculate signature dimensions (fit within the signature area)
  const signatureMaxWidth = box.width - 30;
  const signatureMaxHeight = 35;
  const imgWidth = signatureImage.width;
  const imgHeight = signatureImage.height;
  const aspectRatio = imgWidth / imgHeight;
  
  let finalWidth = signatureMaxWidth;
  let finalHeight = signatureMaxHeight;
  
  if (aspectRatio > signatureMaxWidth / signatureMaxHeight) {
    finalHeight = signatureMaxWidth / aspectRatio;
  } else {
    finalWidth = signatureMaxHeight * aspectRatio;
  }
  
  // Draw signature image (centered in the signature area)
  const signatureX = box.x + 15 + (signatureMaxWidth - finalWidth) / 2;
  const signatureY = box.y + box.height - 55;
  
  page.drawImage(signatureImage, {
    x: signatureX,
    y: signatureY,
    width: finalWidth,
    height: finalHeight,
  });
  
  // Draw signature line
  const lineY = box.y + box.height - 60;
  page.drawLine({
    start: { x: box.x + 15, y: lineY },
    end: { x: box.x + box.width - 15, y: lineY },
    thickness: 0.5,
    color: grayColor,
  });
  
  // Draw signer name
  const nameFontSize = 9;
  const nameText = signerName.toUpperCase();
  const nameWidth = helveticaBold.widthOfTextAtSize(nameText, nameFontSize);
  page.drawText(nameText, {
    x: box.x + (box.width - nameWidth) / 2,
    y: lineY - 15,
    size: nameFontSize,
    font: helveticaBold,
    color: blackColor,
  });
  
  // Draw CPF if provided (for client)
  let infoY = lineY - 28;
  if (cpf) {
    const cpfFontSize = 8;
    const cpfText = `CPF: ${formatCPF(cpf)}`;
    const cpfWidth = helvetica.widthOfTextAtSize(cpfText, cpfFontSize);
    page.drawText(cpfText, {
      x: box.x + (box.width - cpfWidth) / 2,
      y: infoY,
      size: cpfFontSize,
      font: helvetica,
      color: grayColor,
    });
    infoY -= 12;
  }
  
  // Draw date
  const dateFontSize = 8;
  const dateText = `Data: ${formatDate(signedAt)}`;
  const dateWidth = helvetica.widthOfTextAtSize(dateText, dateFontSize);
  page.drawText(dateText, {
    x: box.x + (box.width - dateWidth) / 2,
    y: infoY,
    size: dateFontSize,
    font: helvetica,
    color: grayColor,
  });
  
  // Draw email
  const emailFontSize = 7;
  const emailWidth = helvetica.widthOfTextAtSize(signerEmail, emailFontSize);
  page.drawText(signerEmail, {
    x: box.x + (box.width - emailWidth) / 2,
    y: infoY - 12,
    size: emailFontSize,
    font: helvetica,
    color: lightGrayColor,
  });
}

function formatCPF(cpf: string): string {
  // Remove non-digits
  const numbers = cpf.replace(/\D/g, '');
  if (numbers.length !== 11) return cpf;
  return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
}

function formatDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

async function sendSignedContractEmail(
  pdfBase64: string,
  contractTitle: string,
  toEmail: string,
  fromAlias: string,
  koraflowSignerName: string,
  clientSignerName: string
): Promise<boolean> {
  // Get RESEND_API_KEY from environment
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }
  
  // Create email with PDF attachment
  const emailData = {
    from: fromAlias,
    to: toEmail,
    subject: `Contrato Assinado: ${contractTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">✅ Contrato Assinado</h1>
          </div>
          
          <!-- Content -->
          <div style="padding: 30px;">
            <p style="color: #1e293b; font-size: 16px; margin-bottom: 20px;">
              O contrato <strong>"${contractTitle}"</strong> foi assinado por todas as partes.
            </p>
            
            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <h3 style="color: #166534; margin: 0 0 10px 0; font-size: 14px;">Signatários</h3>
              <p style="margin: 5px 0; color: #15803d; font-size: 14px;">
                <strong>Koraflow:</strong> ${koraflowSignerName}
              </p>
              <p style="margin: 5px 0; color: #15803d; font-size: 14px;">
                <strong>Cliente:</strong> ${clientSignerName}
              </p>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">
              O documento assinado está anexado a este e-mail. Guarde-o em local seguro para seus registros.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #94a3b8; font-size: 12px;">
                Este é um e-mail automático. Por favor, não responda.
              </p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Koraflow. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: `${contractTitle.replace(/[^a-zA-Z0-9]/g, '_')}_assinado.pdf`,
        content: pdfBase64,
        type: 'application/pdf',
      }
    ]
  };
  
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to send email:', error);
      return false;
    }
    
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body: SignatureRequest = await req.json();
    
    if (!body.pdfBase64) {
      return new Response(
        JSON.stringify({ error: 'PDF base64 is required' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      );
    }
    
    // Load the PDF
    const binaryString = atob(body.pdfBase64);
    const pdfBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      pdfBytes[i] = binaryString.charCodeAt(i);
    }
    
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Embed Koraflow signature if provided
    if (body.koraflowSignature?.imageData) {
      await embedSignatureBox(
        pdfDoc,
        body.koraflowSignature.imageData,
        DEFAULT_KORAFLOW_BOX,
        body.koraflowSignature.signerName,
        body.koraflowSignature.signerEmail,
        body.koraflowSignature.signedAt,
        'CONTRATADO'
      );
    }
    
    // Embed client signature if provided
    if (body.clientSignature?.imageData) {
      await embedSignatureBox(
        pdfDoc,
        body.clientSignature.imageData,
        DEFAULT_CLIENT_BOX,
        body.clientSignature.signerName,
        body.clientSignature.signerEmail,
        body.clientSignature.signedAt,
        'CONTRATANTE',
        body.clientSignature.cpf
      );
    }
    
    // Save the modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    
    // Convert to base64
    let binary = '';
    const len = modifiedPdfBytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(modifiedPdfBytes[i]);
    }
    const modifiedPdfBase64 = btoa(binary);
    
    // Send email if requested (when both signatures are complete)
    let emailSent = false;
    if (body.sendEmail && body.koraflowSignature && body.clientSignature) {
      emailSent = await sendSignedContractEmail(
        modifiedPdfBase64,
        body.contractTitle,
        body.sendEmail.to,
        body.sendEmail.fromAlias,
        body.koraflowSignature.signerName,
        body.clientSignature.signerName
      );
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        signedPdfBase64: modifiedPdfBase64,
        emailSent,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
    
  } catch (error) {
    console.error('Error embedding signatures:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to embed signatures',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
