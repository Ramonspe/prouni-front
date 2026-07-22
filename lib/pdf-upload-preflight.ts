/**
 * Detecta a paleta Indexed RGB gerada pelo PDFium que já causou falso positivo
 * no WAF durante uploads. A assinatura é o bloco DEFLATE "stored" de 768 bytes
 * que contém a rampa RGB 00 00 00 até FF FF FF.
 *
 * A checagem é deliberadamente estrita: não tenta classificar PDFs em geral e
 * não altera o arquivo do candidato.
 */
export function hasPdfiumWafTrigger(bytes: Uint8Array): boolean {
  const paletteLength = 256 * 3;

  for (let paletteStart = bytes.indexOf(0); paletteStart !== -1; paletteStart = bytes.indexOf(0, paletteStart + 1)) {
    const deflateStart = paletteStart - 7;
    if (
      deflateStart < 0 ||
      bytes[deflateStart] !== 0x78 ||
      ![0x01, 0x5e, 0x9c, 0xda].includes(bytes[deflateStart + 1]) ||
      bytes[deflateStart + 2] !== 0x01 ||
      bytes[deflateStart + 3] !== 0x00 ||
      bytes[deflateStart + 4] !== 0x03 ||
      bytes[deflateStart + 5] !== 0xff ||
      bytes[deflateStart + 6] !== 0xfc ||
      paletteStart + paletteLength > bytes.length
    ) {
      continue;
    }

    let isPalette = true;
    for (let tone = 0; tone < 256 && isPalette; tone += 1) {
      const offset = paletteStart + tone * 3;
      isPalette = bytes[offset] === tone && bytes[offset + 1] === tone && bytes[offset + 2] === tone;
    }
    if (isPalette) return true;
  }

  return false;
}

export async function needsPdfRegeneration(file: File): Promise<boolean> {
  if (file.type !== "application/pdf") return false;
  return hasPdfiumWafTrigger(new Uint8Array(await file.arrayBuffer()));
}

export const PDF_REGENERATION_MESSAGE =
  "Este PDF tem uma estrutura interna que pode ser bloqueada pela proteção de upload. Para manter o documento inalterado, gere uma nova cópia em Imprimir > Salvar como PDF e envie essa cópia.";
