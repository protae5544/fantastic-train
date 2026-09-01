export interface FolderMonitorConfig {
  enabled: boolean;
  prefix?: string; // 4 ตัว เช่น "ABC1"
  uploadAll: boolean; // true = upload ทั้งหมด, false = ตาม prefix
  checkInterval: number; // milliseconds (default 24 hours)
}

export interface MonitoredFile {
  name: string;
  path: string;
  size: number;
  uploadedAt?: number;
  uploaded: boolean;
}

let monitorInterval: NodeJS.Timeout | null = null;
let dirHandle: FileSystemDirectoryHandle | null = null;

export async function startFolderMonitor(
  folder: FileSystemDirectoryHandle,
  config: FolderMonitorConfig,
  onFilesFound: (files: MonitoredFile[]) => Promise<void>
): Promise<void> {
  if (!config.enabled) return;

  dirHandle = folder;
  const uploadedFiles = new Set<string>();

  const checkFolder = async () => {
    try {
      const filesToUpload: MonitoredFile[] = [];

      for await (const entry of dirHandle!.values()) {
        if (entry.kind !== "file") continue;

        const file = await entry.getFile();
        const fileName = entry.name;

        // Skip if already uploaded
        if (uploadedFiles.has(fileName)) continue;

        // Filter by prefix หรือ upload ทั้งหมด
        let shouldInclude = false;
        if (config.uploadAll) {
          shouldInclude = true;
        } else if (config.prefix && fileName.startsWith(config.prefix)) {
          shouldInclude = true;
        }

        if (shouldInclude) {
          filesToUpload.push({
            name: fileName,
            path: `${dirHandle!.name}/${fileName}`,
            size: file.size,
            uploaded: false,
          });
        }
      }

      if (filesToUpload.length > 0) {
        await onFilesFound(filesToUpload);
        // Mark as uploaded
        filesToUpload.forEach((f) => uploadedFiles.add(f.name));
      }
    } catch (err) {
      console.error("Folder monitor error:", err);
    }
  };

  // Check ครั้งแรกทันที
  await checkFolder();

  // Set interval สำหรับ check ซ้ำ
  monitorInterval = setInterval(checkFolder, config.checkInterval || 24 * 60 * 60 * 1000);
}

export function stopFolderMonitor(): void {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
  dirHandle = null;
}

export function isMonitoring(): boolean {
  return monitorInterval !== null;
}
