/**
 * Comprime uma imagem do dispositivo para data URL JPEG (redimensionada),
 * para caber no Firestore (limite de ~1MB por documento).
 * Aceita JPG/PNG/WebP. iPhone (HEIC) não é suportado pelo <img> — filtrado
 * pelo tipo MIME antes de chamar aqui.
 */
export async function fileToDataUrl(file: File, maxW = 900, quality = 0.72): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('imagem inválida'));
      img.src = url;
    });
    const scale = Math.min(1, maxW / img.width);
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas indisponível');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(file.type);
}