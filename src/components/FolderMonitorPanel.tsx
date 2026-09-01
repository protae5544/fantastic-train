import { useState } from "react";
import { FolderOpen, Play, Square } from "lucide-react";
import type { FolderMonitorConfig } from "../lib/folderMonitor";

interface Props {
  onStartMonitor: (dirHandle: FileSystemDirectoryHandle, config: FolderMonitorConfig) => void;
  onStopMonitor: () => void;
  isMonitoring: boolean;
}

export default function FolderMonitorPanel({ onStartMonitor, onStopMonitor, isMonitoring }: Props) {
  const [prefix, setPrefix] = useState("");
  const [uploadAll, setUploadAll] = useState(false);
  const [checkInterval, setCheckInterval] = useState(24); // hours

  const handleStart = async () => {
    try {
      const dirHandle = await (window as any).showDirectoryPicker();
      if (!dirHandle) return;

      onStartMonitor(dirHandle, {
        enabled: true,
        prefix: prefix.toUpperCase().slice(0, 4) || undefined,
        uploadAll: uploadAll || !prefix,
        checkInterval: checkInterval * 60 * 60 * 1000, // convert hours to ms
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        alert(`เลือกโฟลเดอร์ไม่ได้: ${err?.message}`);
      }
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <FolderOpen className="h-5 w-5" />
        </div>
        <h2 className="text-sm font-semibold text-slate-900">ตรวจสอบโฟลเดอร์อัตโนมัติ</h2>
      </div>

      <div className="space-y-4">
        {/* Layer Selection */}
        <div>
          <label className="text-xs font-medium text-slate-700">เลือก Layer</label>
          <div className="mt-2 space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={!prefix && !uploadAll}
                onChange={() => {
                  setPrefix("");
                  setUploadAll(false);
                }}
                className="h-4 w-4"
              />
              <span className="text-sm text-slate-600">Layer 1: ตามชื่อไฟล์ (Prefix 4 ตัว)</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={uploadAll}
                onChange={() => setUploadAll(true)}
                className="h-4 w-4"
              />
              <span className="text-sm text-slate-600">Layer 2: อัพโหลดทั้งหมด</span>
            </label>
          </div>
        </div>

        {/* Prefix Input (Layer 1) */}
        {!uploadAll && (
          <div>
            <label className="text-xs font-medium text-slate-700">กำหนด Prefix (4 ตัว)</label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.slice(0, 4).toUpperCase())}
              placeholder="เช่น ABC1"
              maxLength={4}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              ตัวอย่าง: ABC1_photo.jpg, ABC1_doc.pdf
            </p>
          </div>
        )}

        {/* Check Interval */}
        <div>
          <label className="text-xs font-medium text-slate-700">ตรวจสอบทุก (ชั่วโมง)</label>
          <input
            type="number"
            value={checkInterval}
            onChange={(e) => setCheckInterval(Math.max(1, parseInt(e.target.value) || 24))}
            min="1"
            max="168"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">ค่าเริ่มต้น: 24 ชั่วโมง</p>
        </div>

        {/* Status */}
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs text-slate-600">
            {isMonitoring ? (
              <span className="text-emerald-600">🟢 ตรวจสอบอยู่</span>
            ) : (
              <span className="text-slate-500">⚪ ไม่ได้ตรวจสอบ</span>
            )}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          {!isMonitoring ? (
            <button
              onClick={handleStart}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              เริ่มตรวจสอบ
            </button>
          ) : (
            <button
              onClick={onStopMonitor}
              className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              <Square className="h-4 w-4" />
              หยุด
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
