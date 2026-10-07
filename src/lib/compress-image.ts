// Phone photos are often 5-12 MB, but Vercel refuses request bodies over 4.5 MB (the upload then
// fails before reaching our code). So proof images are shrunk in the browser first: longest side
// 1600 px, JPEG at 80%, which keeps text in a screenshot or photo readable. If the browser cannot
// read the file (e.g. HEIC on Chrome/Windows) the original is used, and the caller checks its size.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

export async function compressImage(file: File, maxSide = 1600): Promise<File> {
  if (file.size < 500 * 1024) return file; // already small
  try {
    const bitmap = await createImageBitmap(file); // applies the photo's rotation (EXIF)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
