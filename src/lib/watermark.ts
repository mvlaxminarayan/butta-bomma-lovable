/** Burns a "© Buttabomma Crafts" stamp into an image before upload. Returns a JPEG blob. */
export async function watermarkImage(file: File | Blob): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0);

    const w = canvas.width, h = canvas.height;
    const size = Math.max(14, Math.round(Math.min(w, h) * 0.04));
    const pad = Math.round(size * 0.8);
    ctx.font = `600 ${size}px Georgia, serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = "rgba(0,0,0,0.55)";
    ctx.shadowBlur = Math.round(size * 0.3);
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.fillText("© Buttabomma Crafts", w - pad, h - pad - size * 0.9);
    ctx.font = `400 ${Math.round(size * 0.6)}px Georgia, serif`;
    ctx.fillText("buttabommacrafts.com", w - pad, h - pad);

    // Faint centered stamp so cropping the corner doesn't remove the mark
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(-Math.PI / 8);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 0;
    ctx.font = `600 ${Math.round(size * 1.6)}px Georgia, serif`;
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillText("Buttabomma Crafts", 0, 0);
    ctx.restore();

    return await new Promise<Blob>((resolve) =>
      canvas.toBlob((b) => resolve(b || file), "image/jpeg", 0.9)
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
