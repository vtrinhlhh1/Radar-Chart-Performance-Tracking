import React, { useState, useEffect } from 'react';
import { Download, X, FileText, Palette, Check, Image as ImageIcon, Archive, Layers, Maximize2 } from 'lucide-react';
import { PaperSize, PaperOrientation } from '../types';
import { PAPER_DIMENSIONS } from '../utils/exportCharts';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (exportOptions: {
    filename: string;
    bgColor: string;
    format: 'png' | 'jpeg';
    isBatchExport: boolean;
    includePerformanceScores: boolean;
    paperSize: PaperSize;
    orientation: PaperOrientation;
  }) => void;
  singleDefaultFilename: string;
  batchDefaultFilename: string;
  isExporting: boolean;
  exportProgress: { current: number; total: number } | null;
}

const COLOR_PRESETS = [
  { name: 'Pure White', hex: '#ffffff', border: true },
  { name: 'Soft Light Gray', hex: '#f8fafc', border: true },
  { name: 'Light Slate', hex: '#f1f5f9', border: true },
  { name: 'Soft Blue', hex: '#eff6ff', border: false },
  { name: 'Dark Navy', hex: '#0f172a', border: false },
];

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  singleDefaultFilename,
  batchDefaultFilename,
  isExporting,
  exportProgress,
}) => {
  const [isBatch, setIsBatch] = useState(false);
  const [filename, setFilename] = useState(singleDefaultFilename);
  const [bgType, setBgType] = useState<'transparent' | 'solid'>('transparent');
  const [solidColor, setSolidColor] = useState('#ffffff');
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [includePerformanceScores, setIncludePerformanceScores] = useState(true);
  const [paperSize, setPaperSize] = useState<PaperSize>('a4');
  const [orientation, setOrientation] = useState<PaperOrientation>('landscape');

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setIsBatch(false);
      setFilename(singleDefaultFilename);
      setFormat('png');
      setBgType('transparent');
      setSolidColor('#ffffff');
      setIncludePerformanceScores(true);
      setPaperSize('a4');
      setOrientation('landscape');
    }
  }, [isOpen, singleDefaultFilename]);

  if (!isOpen) return null;

  const handleToggleBatch = (batch: boolean) => {
    setIsBatch(batch);
    if (batch) {
      setFilename(batchDefaultFilename);
    } else {
      setFilename(singleDefaultFilename);
    }
  };

  const effectiveBgColor = bgType === 'transparent' ? 'transparent' : solidColor;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fallbackDefault = isBatch ? batchDefaultFilename : singleDefaultFilename;
    const finalName = filename.trim() || fallbackDefault;
    onConfirmExport({
      filename: finalName,
      bgColor: format === 'jpeg' ? (bgType === 'transparent' ? '#ffffff' : solidColor) : effectiveBgColor,
      format,
      isBatchExport: isBatch,
      includePerformanceScores,
      paperSize,
      orientation: paperSize === 'square' ? 'portrait' : orientation,
    });
  };

  const currentDims = PAPER_DIMENSIONS[paperSize][paperSize === 'square' ? 'portrait' : orientation];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {isBatch ? 'Export All Charts in Mini-Tab (ZIP)' : 'Export Chart Image'}
              </h3>
              <p className="text-xs text-slate-500">Configure layout size, orientation &amp; format</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL FORM */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* EXPORT SCOPE SELECTOR */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Export Scope</span>
            </label>

            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => handleToggleBatch(false)}
                disabled={isExporting}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  !isBatch
                    ? 'bg-white text-blue-600 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Single Chart</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleBatch(true)}
                disabled={isExporting}
                className={`py-2 px-3 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  isBatch
                    ? 'bg-white text-blue-600 shadow-xs ring-1 ring-slate-200'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>All Charts (ZIP)</span>
              </button>
            </div>

            {/* CHECKBOX ALTERNATIVE TOGGLE */}
            <label className="flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer transition-colors mt-2">
              <input
                type="checkbox"
                checked={isBatch}
                onChange={(e) => handleToggleBatch(e.target.checked)}
                disabled={isExporting}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
              />
              <span>Download all charts in this mini-tab as a ZIP archive</span>
            </label>
          </div>

          {/* PAPER SIZE & ORIENTATION SELECTION */}
          <div className="space-y-2 p-3 bg-slate-50/90 border border-slate-200/80 rounded-2xl">
            <label className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <Maximize2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Paper Size &amp; Orientation</span>
              </span>
              <span className="text-[10px] text-blue-700 font-bold bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
                {currentDims.width} × {currentDims.height} px
              </span>
            </label>

            {/* PAPER SIZE OPTIONS */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'a4', label: 'A4', desc: '210×297mm' },
                { id: 'letter', label: 'Letter', desc: '8.5×11in' },
                { id: 'a5', label: 'A5', desc: '148×210mm' },
                { id: 'a3', label: 'A3', desc: '297×420mm' },
                { id: 'legal', label: 'Legal', desc: '8.5×14in' },
                { id: 'square', label: 'Square', desc: '1:1 Frame' },
              ].map((paper) => (
                <button
                  key={paper.id}
                  type="button"
                  onClick={() => setPaperSize(paper.id as PaperSize)}
                  disabled={isExporting}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    paperSize === paper.id
                      ? 'border-blue-500 bg-white text-blue-700 shadow-xs ring-2 ring-blue-100'
                      : 'border-slate-200 bg-white/60 text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <div className="font-bold text-xs">{paper.label}</div>
                  <div className="text-[9.5px] opacity-75 font-medium">{paper.desc}</div>
                </button>
              ))}
            </div>

            {/* ORIENTATION OPTIONS (IF NOT SQUARE) */}
            {paperSize !== 'square' ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  disabled={isExporting}
                  className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    orientation === 'landscape'
                      ? 'border-blue-500 bg-white text-blue-700 shadow-xs ring-2 ring-blue-100'
                      : 'border-slate-200 bg-white/60 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="w-4 h-3 rounded border-2 border-current" />
                  <span>Landscape</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  disabled={isExporting}
                  className={`flex items-center justify-center gap-2 p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    orientation === 'portrait'
                      ? 'border-blue-500 bg-white text-blue-700 shadow-xs ring-2 ring-blue-100'
                      : 'border-slate-200 bg-white/60 text-slate-600 hover:bg-white'
                  }`}
                >
                  <div className="w-3 h-4 rounded border-2 border-current" />
                  <span>Portrait</span>
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 font-medium italic text-center pt-0.5">
                Square layout maintains a 1:1 balanced aspect ratio.
              </p>
            )}
          </div>

          {/* INCLUDE PERFORMANCE SCORES TICK-BOX */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-2.5 p-2.5 bg-blue-50/50 hover:bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs font-semibold text-slate-800 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={includePerformanceScores}
                onChange={(e) => setIncludePerformanceScores(e.target.checked)}
                disabled={isExporting}
                className="w-4 h-4 accent-blue-600 rounded cursor-pointer shrink-0"
              />
              <div className="flex flex-col">
                <span className="font-bold text-slate-800">Include Performance Scores</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  Append criteria &amp; performance score breakdown in adapted layout
                </span>
              </div>
            </label>
          </div>

          {/* FILENAME INPUT */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>{isBatch ? 'ZIP Archive Name' : 'File Name'}</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Editable</span>
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter custom file name..."
                disabled={isExporting}
                className="w-full pl-3 pr-16 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-slate-800"
              />
              <span className="absolute right-3 text-xs font-bold text-slate-400 uppercase pointer-events-none">
                .{isBatch ? 'zip' : format}
              </span>
            </div>
          </div>

          {/* FORMAT SELECTION */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Image Format</span>
              </span>
              {isBatch && (
                <span className="text-[10px] text-slate-400 font-normal">(Applied to all charts in ZIP)</span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
              <button
                type="button"
                onClick={() => setFormat('png')}
                disabled={isExporting}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  format === 'png'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                PNG (Transparent)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormat('jpeg');
                  if (bgType === 'transparent') setBgType('solid');
                }}
                disabled={isExporting}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  format === 'jpeg'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                JPEG (Solid Background)
              </button>
            </div>
          </div>

          {/* BACKGROUND COLOR OPTIONS */}
          <div className="space-y-2.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Palette className="w-3.5 h-3.5 text-blue-600" />
              <span>Background Style</span>
            </label>

            {/* BG TYPE SELECTOR: TRANSPARENT VS SOLID */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBgType('transparent')}
                disabled={isExporting || format === 'jpeg'}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  bgType === 'transparent' && format !== 'jpeg'
                    ? 'border-blue-500 bg-blue-50/60 text-blue-700 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                } ${format === 'jpeg' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="w-4 h-4 rounded border border-slate-300 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:4px_4px]" />
                <span>Transparent</span>
              </button>

              <button
                type="button"
                onClick={() => setBgType('solid')}
                disabled={isExporting}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  bgType === 'solid'
                    ? 'border-blue-500 bg-blue-50/60 text-blue-700 ring-2 ring-blue-100'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div
                  className="w-4 h-4 rounded border border-slate-300 shadow-2xs"
                  style={{ backgroundColor: solidColor }}
                />
                <span>Solid Color</span>
              </button>
            </div>

            {/* SOLID COLOR CHOOSER */}
            {bgType === 'solid' && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2.5 animate-in fade-in duration-100">
                <span className="text-[11px] font-bold text-slate-600 block">Choose Solid Color:</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setSolidColor(preset.hex)}
                      disabled={isExporting}
                      className={`w-7 h-7 rounded-lg transition-transform flex items-center justify-center relative cursor-pointer ${
                        preset.border ? 'border border-slate-300' : ''
                      } ${
                        solidColor.toLowerCase() === preset.hex.toLowerCase()
                          ? 'scale-110 ring-2 ring-blue-500 ring-offset-1'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                      title={preset.name}
                    >
                      {solidColor.toLowerCase() === preset.hex.toLowerCase() && (
                        <Check
                          className={`w-3.5 h-3.5 ${
                            preset.hex === '#0f172a' ? 'text-white' : 'text-slate-800'
                          }`}
                        />
                      )}
                    </button>
                  ))}

                  {/* CUSTOM COLOR PICKER */}
                  <label
                    className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-300 rounded-lg text-[11px] font-semibold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                    title="Custom Color"
                  >
                    <input
                      type="color"
                      value={solidColor}
                      onChange={(e) => setSolidColor(e.target.value)}
                      disabled={isExporting}
                      className="w-4 h-4 p-0 border-0 rounded cursor-pointer"
                    />
                    <span>Custom</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isExporting}
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isExporting
                  ? exportProgress
                    ? `Exporting ${exportProgress.current}/${exportProgress.total}...`
                    : 'Exporting...'
                  : isBatch
                  ? 'Download ZIP Archive'
                  : 'Download Chart Image'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
