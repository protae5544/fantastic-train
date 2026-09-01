/**
 * Upload to Backblaze B2 Cloud Storage
 */

export interface BackblazeConfig {
  accountId: string;
  appKey: string;
  bucketName: string;
  bucketId?: string;
}

export async function uploadToBackblaze(
  file: File,
  fileName: string,
  config: BackblazeConfig,
  signal?: AbortSignal
): Promise<{ ok: boolean; fileUrl?: string; reason?: string }> {
  try {
    // Step 1: Authorize
    const authResponse = await fetch("https://api.backblazeb2.com/b2api/v2/b2_authorize_account", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${config.accountId}:${config.appKey}`)}`,
      },
      signal,
    });

    if (!authResponse.ok) {
      return { ok: false, reason: `Auth failed: ${authResponse.status}` };
    }

    const authData = (await authResponse.json()) as any;
    const uploadUrl = authData.uploadUrl;
    const uploadToken = authData.authorizationToken;
    const downloadUrl = authData.downloadUrl;

    // Step 2: Upload file
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: uploadToken,
        "X-Bz-File-Name": encodeURI(fileName),
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
      signal,
    });

    if (!uploadResponse.ok) {
      return { ok: false, reason: `Upload failed: ${uploadResponse.status}` };
    }

    const uploadResult = (await uploadResponse.json()) as any;
    const fileUrl = `${downloadUrl}/file/${config.bucketName}/${uploadResult.fileName}`;

    return { ok: true, fileUrl };
  } catch (err: any) {
    if (err?.name === "AbortError") throw err;
    return { ok: false, reason: `Upload error: ${err?.message}` };
  }
}

export async function uploadMultipleFiles(
  files: File[],
  config: BackblazeConfig,
  onProgress?: (current: number, total: number) => void,
  signal?: AbortSignal
): Promise<{ ok: boolean; results: Array<{ fileName: string; fileUrl?: string; error?: string }>; reason?: string }> {
  const results: Array<{ fileName: string; fileUrl?: string; error?: string }> = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadToBackblaze(file, file.name, config, signal);

    if (result.ok) {
      results.push({ fileName: file.name, fileUrl: result.fileUrl });
    } else {
      results.push({ fileName: file.name, error: result.reason });
    }

    onProgress?.(i + 1, files.length);
  }

  return { ok: true, results };
}
