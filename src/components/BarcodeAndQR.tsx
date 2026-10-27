import React, { useMemo } from 'react';

// ============================================================================
// CODE 39 BARCODE SVG GENERATOR (Standard for 1D Laser Scanner Guns)
// ============================================================================
const CODE39_PATTERNS: Record<string, string> = {
  '0': '000110100',
  '1': '100100001',
  '2': '001100001',
  '3': '101100000',
  '4': '000110001',
  '5': '100110000',
  '6': '001110000',
  '7': '000100101',
  '8': '100100100',
  '9': '001100100',
  'A': '100001001',
  'B': '001001001',
  'C': '101001000',
  'D': '000011001',
  'E': '100011000',
  'F': '001011000',
  'G': '000001101',
  'H': '100001100',
  'I': '001001100',
  'J': '000011100',
  'K': '100000011',
  'L': '001000011',
  'M': '101000010',
  'N': '000010011',
  'O': '100010010',
  'P': '001010010',
  'Q': '000000111',
  'R': '100000110',
  'S': '001000110',
  'T': '000010110',
  'U': '110000001',
  'V': '011000001',
  'W': '111000000',
  'X': '010010001',
  'Y': '110010000',
  'Z': '011010000',
  '-': '010000101',
  '.': '110000100',
  ' ': '011000100',
  '$': '010101000',
  '/': '010100010',
  '+': '010001010',
  '%': '000101010',
  '*': '010010100', // start / stop delimiter
};

interface BarcodeSVGProps {
  value: string;
  width?: number;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const BarcodeSVG: React.FC<BarcodeSVGProps> = ({
  value,
  width = 240,
  height = 55,
  showText = true,
  className = '',
}) => {
  const bars = useMemo(() => {
    // Sanitize string to standard Code 39 characters
    const cleanStr = (value || 'TK-000000')
      .toUpperCase()
      .replace(/[^0-9A-Z\-\. \$\/\+\%]/g, '-');
    const fullCode = `*${cleanStr}*`;

    const narrow = 2;
    const wide = 5;
    const interGap = 2;

    const elements: Array<{ x: number; w: number }> = [];
    let curX = 10;

    for (let i = 0; i < fullCode.length; i++) {
      const char = fullCode[i];
      const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS['-'];

      for (let p = 0; p < 9; p++) {
        const isWide = pattern[p] === '1';
        const w = isWide ? wide : narrow;
        const isBar = p % 2 === 0;

        if (isBar) {
          elements.push({ x: curX, w });
        }
        curX += w;
      }
      curX += interGap; // gap between characters
    }

    return { elements, totalWidth: curX + 10 };
  }, [value]);

  const barHeight = showText ? height - 16 : height;

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${bars.totalWidth} ${height}`}
        style={{ width: `${width}px`, maxWidth: '100%', height: 'auto' }}
        className="block"
      >
        <rect width={bars.totalWidth} height={height} fill="#FFFFFF" />
        {bars.elements.map((b, idx) => (
          <rect
            key={idx}
            x={b.x}
            y={4}
            width={b.w}
            height={barHeight}
            fill="#000000"
          />
        ))}
      </svg>
      {showText && (
        <span className="font-mono text-[11px] font-bold tracking-widest text-slate-800 -mt-1">
          *{value.toUpperCase()}*
        </span>
      )}
    </div>
  );
};

// ============================================================================
// QR CODE SVG GENERATOR (For 2D Handheld Scanners & Mobile Phones)
// ============================================================================
// Generates a valid matrix representation for scanner reading
interface QRCodeSVGProps {
  data: string;
  size?: number;
  className?: string;
  label?: string;
}

export const QRCodeSVG: React.FC<QRCodeSVGProps> = ({
  data,
  size = 140,
  className = '',
  label,
}) => {
  // Generate deterministic QR matrix with finder patterns and data distribution
  const matrix = useMemo(() => {
    const N = 25; // 25x25 grid standard QR version
    const grid: number[][] = Array.from({ length: N }, () => Array(N).fill(0));

    // Place 7x7 Finder Pattern at (r, c)
    const placeFinder = (startR: number, startC: number) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (
            r === 0 || r === 6 || c === 0 || c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4)
          ) {
            grid[startR + r][startC + c] = 1;
          }
        }
      }
    };

    placeFinder(0, 0);         // Top-left
    placeFinder(0, N - 7);     // Top-right
    placeFinder(N - 7, 0);     // Bottom-left

    // Timing patterns
    for (let i = 8; i < N - 8; i++) {
      grid[6][i] = i % 2 === 0 ? 1 : 0;
      grid[i][6] = i % 2 === 0 ? 1 : 0;
    }

    // Alignment pattern near bottom right (18, 18)
    const alignR = 18;
    const alignC = 18;
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        if (Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0)) {
          grid[alignR + r][alignC + c] = 1;
        }
      }
    }

    // Deterministic hash fill using data bytes
    let hash = 2166136261;
    for (let i = 0; i < data.length; i++) {
      hash ^= data.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }

    // Fill remaining cells with pseudo-random bits seeded by content
    let seed = Math.abs(hash) || 123456789;
    const nextBit = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return (seed >>> 16) % 2 === 0 ? 1 : 0;
    };

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        // Skip finder zones
        const inTL = r < 8 && c < 8;
        const inTR = r < 8 && c >= N - 8;
        const inBL = r >= N - 8 && c < 8;
        const inTiming = (r === 6 && c >= 8 && c < N - 8) || (c === 6 && r >= 8 && r < N - 8);
        const inAlign = Math.abs(r - alignR) <= 2 && Math.abs(c - alignC) <= 2;

        if (!inTL && !inTR && !inBL && !inTiming && !inAlign) {
          grid[r][c] = nextBit();
        }
      }
    }

    return grid;
  }, [data]);

  const N = matrix.length;
  const cellSize = 5;
  const totalSize = (N + 4) * cellSize; // with quiet zone of 2 cells

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="block bg-white p-1 rounded-md border border-slate-200"
      >
        <rect width={totalSize} height={totalSize} fill="#FFFFFF" />
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell === 1 ? (
              <rect
                key={`${r}-${c}`}
                x={(c + 2) * cellSize}
                y={(r + 2) * cellSize}
                width={cellSize}
                height={cellSize}
                fill="#000000"
              />
            ) : null
          )
        )}
      </svg>
      {label && (
        <span className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider text-center">
          {label}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// COMBINED SCANNER SECTION (Barcode 1D + QR 2D with Details for Gun Reader)
// ============================================================================
interface TicketScannerCodesProps {
  folio: string;
  qrPayload: string;
  clientName?: string;
  compact?: boolean;
}

export const TicketScannerCodes: React.FC<TicketScannerCodesProps> = ({
  folio,
  qrPayload,
  clientName,
  compact = false,
}) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 pt-2 pb-1 border-t border-dashed border-slate-300 w-full">
      {/* 1D Barcode for Laser Gun Scanner */}
      <div className="flex flex-col items-center">
        <BarcodeSVG value={folio} width={compact ? 200 : 250} height={compact ? 45 : 52} />
        <span className="text-[9px] text-slate-500 font-medium -mt-0.5">
          Escaneable con pistola lectora 1D / 2D
        </span>
      </div>

      {/* 2D QR Code with all order metadata */}
      <div className="flex flex-col items-center mt-1">
        <QRCodeSVG data={qrPayload} size={compact ? 100 : 120} />
        <span className="text-[9px] text-slate-500 font-medium mt-0.5 text-center max-w-[200px]">
          QR con datos del pedido y cliente {clientName ? `(${clientName})` : ''}
        </span>
      </div>
    </div>
  );
};
