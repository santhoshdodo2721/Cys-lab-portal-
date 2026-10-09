export const defaultEdits = { rotation: 0, flip: false, crop: 'original', horizontal: 50, vertical: 50, brightness: 100, maxSize: 2400, quality: 90 };
export const formatSize = bytes => bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export async function readImage(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = () => reject(new Error('This image could not be opened. Choose another image.')); image.src = url; });
    if (image.naturalWidth * image.naturalHeight > 50000000) throw new Error('This image is too large to edit. Choose an image under 50 megapixels.');
    return image;
  } finally { URL.revokeObjectURL(url); }
}

export function renderImage(image, edits) {
  // Bound intermediate canvases as well as the final upload.
  const scale = Math.min(1, Number(edits.maxSize) / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const turned = edits.rotation % 180 !== 0;
  const rotated = document.createElement('canvas');
  rotated.width = turned ? height : width; rotated.height = turned ? width : height;
  const ctx = rotated.getContext('2d');
  if (!ctx) throw new Error('Image editing is unavailable in this browser.');
  ctx.translate(rotated.width / 2, rotated.height / 2);
  ctx.rotate(edits.rotation * Math.PI / 180);
  ctx.scale(edits.flip ? -1 : 1, 1);
  ctx.filter = `brightness(${edits.brightness}%)`;
  ctx.drawImage(image, -width / 2, -height / 2, width, height);
  const ratios = { square: 1, landscape: 4 / 3, portrait: 3 / 4 };
  const ratio = ratios[edits.crop];
  let cropWidth = rotated.width, cropHeight = rotated.height;
  if (ratio) {
    if (cropWidth / cropHeight > ratio) cropWidth = cropHeight * ratio;
    else cropHeight = cropWidth / ratio;
  }
  const left = (rotated.width - cropWidth) * edits.horizontal / 100;
  const top = (rotated.height - cropHeight) * edits.vertical / 100;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(cropWidth)); canvas.height = Math.max(1, Math.round(cropHeight));
  const output = canvas.getContext('2d');
  if (!output) throw new Error('Image editing is unavailable in this browser.');
  output.drawImage(rotated, left, top, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export const encodeImage = (canvas, quality) => new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('The image could not be prepared.')), 'image/webp', quality / 100));
