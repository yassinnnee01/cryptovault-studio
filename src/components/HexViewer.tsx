import React, { useMemo } from 'react';
import { hexToBuffer } from '../utils/pemUtils';
import { Binary, Eye } from 'lucide-react';

interface HexViewerProps {
  hexData: string;
  ivHex?: string;
  tagHex?: string;
  maxBytesToShow?: number;
}

export const HexViewer: React.FC<HexViewerProps> = ({
  hexData,
  ivHex,
  tagHex,
  maxBytesToShow = 256,
}) => {
  const parsedData = useMemo(() => {
    if (!hexData) return null;
    const cleanHex = hexData.replace(/\s+/g, '');
    try {
      const buffer = hexToBuffer(cleanHex.substring(0, maxBytesToShow * 2));
      const totalByteCount = Math.floor(cleanHex.length / 2);
      
      const rows: Array<{
        offset: string;
        bytes: Array<{ hex: string; isIV: boolean; isTag: boolean; char: string }>;
      }> = [];

      const ivByteLength = ivHex ? Math.floor(ivHex.length / 2) : 0;
      const tagByteLength = tagHex ? Math.floor(tagHex.length / 2) : 0;
      const tagStartByteIndex = totalByteCount - tagByteLength;

      for (let i = 0; i < buffer.length; i += 16) {
        const offsetHex = i.toString(16).padStart(4, '0').toUpperCase();
        const chunk = buffer.slice(i, i + 16);
        const bytes = Array.from(chunk).map((byte, idx) => {
          const globalIdx = i + idx;
          const hex = byte.toString(16).padStart(2, '0').toUpperCase();
          const char = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
          
          const isIV = globalIdx < ivByteLength;
          const isTag = tagByteLength > 0 && globalIdx >= tagStartByteIndex;

          return { hex, isIV, isTag, char };
        });

        rows.push({ offset: offsetHex, bytes });
      }

      return { rows, totalByteCount, truncated: totalByteCount > maxBytesToShow };
    } catch {
      return null;
    }
  }, [hexData, ivHex, tagHex, maxBytesToShow]);

  if (!parsedData) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 font-mono bg-slate-950/60 rounded-lg border border-slate-800">
        No valid hex binary payload to display.
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-950 rounded-xl border border-slate-800 p-3.5 font-mono text-xs overflow-x-auto">
      
      {/* Header Legend */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center space-x-2">
          <Binary className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-slate-300">Raw Binary Hex Inspector</span>
          <span className="text-slate-500">({parsedData.totalByteCount} Bytes Total)</span>
        </div>
        <div className="flex items-center space-x-3">
          {ivHex && (
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block"></span>
              <span className="text-sky-300">IV (12B)</span>
            </span>
          )}
          {tagHex && (
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              <span className="text-rose-400">GCM Tag (16B)</span>
            </span>
          )}
          <span className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block"></span>
            <span className="text-purple-300">Ciphertext Payload</span>
          </span>
        </div>
      </div>

      {/* Hex Table */}
      <div className="space-y-1">
        {parsedData.rows.map((row, idx) => (
          <div key={idx} className="flex items-center space-x-4 hover:bg-slate-900/80 px-1 py-0.5 rounded transition-colors">
            
            {/* Address Offset */}
            <span className="text-slate-600 font-bold select-none w-12 text-right">
              0x{row.offset}
            </span>

            {/* 16 Hex Bytes */}
            <div className="flex items-center space-x-1.5 flex-1">
              {row.bytes.map((b, bIdx) => {
                let badgeClass = 'text-purple-300 bg-purple-950/20 border-purple-900/30';
                if (b.isIV) badgeClass = 'text-sky-300 bg-sky-950/40 font-bold border-sky-800/50';
                if (b.isTag) badgeClass = 'text-rose-400 bg-rose-950/40 font-bold border-rose-800/50';

                return (
                  <span
                    key={bIdx}
                    className={`px-1 py-0.5 rounded border text-center text-[11px] ${badgeClass}`}
                  >
                    {b.hex}
                  </span>
                );
              })}
            </div>

            {/* ASCII Column */}
            <span className="text-slate-500 border-l border-slate-800 pl-3 tracking-widest text-[11px]">
              {row.bytes.map((b) => b.char).join('')}
            </span>

          </div>
        ))}
      </div>

      {parsedData.truncated && (
        <div className="mt-2 text-center text-[10px] text-slate-500 italic">
          Showing first {maxBytesToShow} bytes. Full binary payload truncated for view performance.
        </div>
      )}

    </div>
  );
};
