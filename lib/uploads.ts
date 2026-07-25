/**
 * Whitelist de arquivos do pedido personalizado — CLAUDE.md, seção 6.
 * Compartilhada entre cliente e servidor; o servidor é que decide.
 */

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const MAX_FILES = 5;

/**
 * Os formatos de CAD não têm mime registrado: o navegador manda
 * `application/octet-stream` ou string vazia. Por isso a extensão manda, e o
 * mime só serve para pegar incoerências óbvias.
 */
const ALLOWED: Record<string, readonly string[]> = {
  stl: [
    "model/stl",
    "application/sla",
    "application/vnd.ms-pki.stl",
    "application/octet-stream",
    "",
  ],
  "3mf": [
    "model/3mf",
    "application/vnd.ms-package.3dmanufacturing-3dmodel+xml",
    "application/octet-stream",
    "",
  ],
  obj: ["model/obj", "text/plain", "application/octet-stream", ""],
  step: ["model/step", "application/step", "application/octet-stream", "text/plain", ""],
  stp: ["model/step", "application/step", "application/octet-stream", "text/plain", ""],
  svg: ["image/svg+xml", "text/plain", ""],
  dxf: ["image/vnd.dxf", "application/dxf", "application/octet-stream", "text/plain", ""],
  ai: [
    "application/postscript",
    "application/pdf",
    "application/illustrator",
    "application/octet-stream",
    "",
  ],
  pdf: ["application/pdf", "application/octet-stream", ""],
  png: ["image/png"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  webp: ["image/webp"],
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED);

/** Para o atributo `accept` do input de arquivos. */
export const ACCEPT_ATTRIBUTE = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  if (dot < 1) return "";
  return filename.slice(dot + 1).toLowerCase();
}

export type FileRejection = { reason: string };

/** Validação por metadados. Roda no cliente e outra vez no servidor. */
export function validateFileMeta(input: {
  filename: string;
  mime: string;
  sizeBytes: number;
}): FileRejection | null {
  const ext = extensionOf(input.filename);

  if (!ext) return { reason: "O arquivo não tem extensão." };

  const mimes = ALLOWED[ext];
  if (!mimes) {
    return { reason: `Extensão .${ext} não é aceite. Aceites: ${ALLOWED_EXTENSIONS.join(", ")}.` };
  }

  const mime = input.mime.toLowerCase().split(";")[0]?.trim() ?? "";
  if (!mimes.includes(mime)) {
    return { reason: `O tipo do arquivo (${mime || "desconhecido"}) não bate certo com .${ext}.` };
  }

  if (!Number.isInteger(input.sizeBytes) || input.sizeBytes <= 0) {
    return { reason: "Tamanho de arquivo inválido." };
  }

  if (input.sizeBytes > MAX_FILE_BYTES) {
    return { reason: `Máximo ${MAX_FILE_BYTES / 1024 / 1024} MB por arquivo.` };
  }

  return null;
}

/**
 * Assinaturas de executáveis. O navegador deduz o mime da extensão, por isso um
 * `.exe` renomeado para `.stl` passa a validação de metadados — só o conteúdo o
 * denuncia. Verificado no servidor, depois do upload, lendo os primeiros bytes.
 */
const EXECUTABLE_SIGNATURES: ReadonlyArray<{ bytes: readonly number[]; label: string }> = [
  { bytes: [0x4d, 0x5a], label: "executável do Windows (PE/DOS)" },
  { bytes: [0x7f, 0x45, 0x4c, 0x46], label: "executável Linux (ELF)" },
  { bytes: [0xfe, 0xed, 0xfa, 0xce], label: "executável macOS (Mach-O)" },
  { bytes: [0xfe, 0xed, 0xfa, 0xcf], label: "executável macOS (Mach-O)" },
  { bytes: [0xce, 0xfa, 0xed, 0xfe], label: "executável macOS (Mach-O)" },
  { bytes: [0xcf, 0xfa, 0xed, 0xfe], label: "executável macOS (Mach-O)" },
  { bytes: [0xca, 0xfe, 0xba, 0xbe], label: "binário universal ou classe Java" },
  { bytes: [0x23, 0x21], label: "script com shebang" },
];

/** Assinaturas exigidas, para os formatos que têm uma fiável. */
const REQUIRED_SIGNATURES: Record<string, ReadonlyArray<readonly number[]>> = {
  pdf: [[0x25, 0x50, 0x44, 0x46]], // %PDF
  png: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  jpg: [[0xff, 0xd8, 0xff]],
  jpeg: [[0xff, 0xd8, 0xff]],
  webp: [[0x52, 0x49, 0x46, 0x46]], // RIFF
  "3mf": [[0x50, 0x4b, 0x03, 0x04]], // zip
  ai: [
    [0x25, 0x50, 0x44, 0x46], // %PDF
    [0x25, 0x21, 0x50, 0x53], // %!PS
  ],
};

function startsWith(head: Uint8Array, signature: readonly number[]): boolean {
  if (head.length < signature.length) return false;
  return signature.every((byte, i) => head[i] === byte);
}

/**
 * Verifica os primeiros bytes já no bucket. Retorna o motivo da recusa, ou null.
 */
export function inspectFileHead(filename: string, head: Uint8Array): FileRejection | null {
  for (const { bytes, label } of EXECUTABLE_SIGNATURES) {
    if (startsWith(head, bytes)) {
      return { reason: `O conteúdo de "${filename}" é um ${label}, não o formato indicado.` };
    }
  }

  const ext = extensionOf(filename);
  const required = REQUIRED_SIGNATURES[ext];

  if (required && !required.some((signature) => startsWith(head, signature))) {
    return { reason: `O conteúdo de "${filename}" não corresponde a um arquivo .${ext}.` };
  }

  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
