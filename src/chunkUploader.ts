/**
 * Resilient Chunked Video Uploader for CineFact AI
 * Uploads large video assets (such as 45MB+ Mars Rover footage) in 4MB chunks
 * to bypass Cloud Run / Nginx 32MB request limits and avoid browser memory freezing.
 */

export interface ChunkUploadProgress {
  uploadedBytes: number;
  totalBytes: number;
  percent: number;
  currentChunk: number;
  totalChunks: number;
  message: string;
}

export interface ChunkUploadResult {
  success: boolean;
  serverFilePath: string;
  uploadId: string;
  size: number;
}

const CHUNK_SIZE = 4 * 1024 * 1024; // 4MB per chunk (well within Cloud Run / Nginx limits)

export async function uploadVideoInChunks(
  file: File,
  onProgress?: (progress: ChunkUploadProgress) => void,
  signal?: AbortSignal
): Promise<ChunkUploadResult> {
  const totalBytes = file.size;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / CHUNK_SIZE));
  const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  let uploadedBytes = 0;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    if (signal?.aborted) {
      throw new Error("Upload aborted by user.");
    }

    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalBytes);
    const chunkBlob = file.slice(start, end);

    const chunkMb = (chunkBlob.size / (1024 * 1024)).toFixed(1);
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
    const currentUploadedMb = ((uploadedBytes + chunkBlob.size) / (1024 * 1024)).toFixed(1);
    const percent = Math.min(99, Math.round(((uploadedBytes + chunkBlob.size) / totalBytes) * 100));

    if (onProgress) {
      onProgress({
        uploadedBytes: uploadedBytes + chunkBlob.size,
        totalBytes,
        percent,
        currentChunk: chunkIndex + 1,
        totalChunks,
        message: `Uploading video chunks: ${percent}% (${currentUploadedMb} / ${totalMb} MB)`
      });
    }

    // Attempt upload with up to 3 retries per chunk
    let attempts = 0;
    let success = false;
    let lastError: Error | null = null;
    let responseData: any = null;

    while (attempts < 3 && !success) {
      if (signal?.aborted) {
        throw new Error("Upload aborted by user.");
      }

      try {
        attempts++;
        const res = await fetch("/api/upload-video-chunk", {
          method: "POST",
          headers: {
            "Content-Type": "application/octet-stream",
            "x-upload-id": uploadId,
            "x-chunk-index": String(chunkIndex),
            "x-total-chunks": String(totalChunks),
            "x-file-name": encodeURIComponent(file.name),
            "x-file-size": String(totalBytes)
          },
          body: chunkBlob,
          signal
        });

        const text = await res.text();
        try {
          responseData = JSON.parse(text);
        } catch (e) {
          if (res.status === 413) {
            throw new Error("Chunk payload rejected by proxy. Reducing chunk size.");
          }
          throw new Error(`Upload server error (HTTP ${res.status}): ${text.slice(0, 100)}`);
        }

        if (!res.ok || responseData?.error) {
          throw new Error(responseData?.error || `Chunk ${chunkIndex} upload failed.`);
        }

        success = true;
      } catch (err: any) {
        lastError = err;
        console.warn(`[CHUNK UPLOAD] Chunk ${chunkIndex + 1}/${totalChunks} attempt ${attempts} failed:`, err);
        if (attempts < 3) {
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        }
      }
    }

    if (!success) {
      throw lastError || new Error(`Failed to upload chunk ${chunkIndex + 1} after 3 attempts.`);
    }

    uploadedBytes += chunkBlob.size;

    // Check if finished on the final chunk
    if (chunkIndex === totalChunks - 1 && responseData?.completed) {
      if (onProgress) {
        onProgress({
          uploadedBytes: totalBytes,
          totalBytes,
          percent: 100,
          currentChunk: totalChunks,
          totalChunks,
          message: `Upload complete (100%) - ready for AI highlight analysis`
        });
      }

      return {
        success: true,
        serverFilePath: responseData.serverFilePath,
        uploadId: responseData.uploadId,
        size: responseData.size
      };
    }
  }

  throw new Error("Upload ended unexpectedly without server confirmation.");
}
