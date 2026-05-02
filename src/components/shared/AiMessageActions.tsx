'use client';

import { useState } from 'react';
import {
  Copy, ThumbsUp, ThumbsDown, RotateCcw, Share2, Download, Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  text: string;
  onRetry?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  downloadFilename?: string;
  lang?: string;
}

const COPY_LABELS: Record<string, string> = {
  uz: 'Nusxa olindi', ru: 'Скопировано', en: 'Copied',
  kk: 'Kopirlandi', uz_cyrillic: 'Nusxa olindi',
};
const SHARE_LABELS: Record<string, string> = {
  uz: 'Ulashildi', ru: 'Поделились', en: 'Shared',
  kk: 'Bólistirildi', uz_cyrillic: 'Ulashildi',
};
const LIKE_LABELS: Record<string, string> = {
  uz: 'Baholandi', ru: 'Оценено', en: 'Rated',
  kk: 'Bahalandi', uz_cyrillic: 'Baholandi',
};
const DOWNLOAD_LABELS: Record<string, string> = {
  uz: "Yuklab olindi", ru: 'Скачано', en: 'Downloaded',
  kk: 'Yukletildi', uz_cyrillic: 'Yuklab olindi',
};

export function AiMessageActions({ text, onRetry, onLike, onDislike, downloadFilename, lang = 'uz' }: Props) {
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(COPY_LABELS[lang] ?? 'Copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy failed');
    }
  };

  const handleLike = () => {
    setLiked('up');
    onLike?.();
    toast.success(LIKE_LABELS[lang] ?? 'Rated');
  };

  const handleDislike = () => {
    setLiked('down');
    onDislike?.();
    toast.success(LIKE_LABELS[lang] ?? 'Rated');
  };

  const handleShare = async () => {
    const shareData = { title: 'AI Maslahatchi', text: text.slice(0, 300) + (text.length > 300 ? '...' : '') };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
      }
      setShared(true);
      toast.success(SHARE_LABELS[lang] ?? 'Shared');
      setTimeout(() => setShared(false), 2000);
    } catch { /* user cancelled */ }
  };

  const handleDownloadPdf = () => {
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${downloadFilename ?? 'AI Javob'}</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1e293b; line-height: 1.7; font-size: 13px; }
  h1 { font-size: 22px; color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; }
  h2 { font-size: 16px; color: #1e293b; margin-top: 24px; }
  h3 { font-size: 14px; color: #334155; margin-top: 18px; }
  strong { color: #0f172a; }
  .meta { font-size: 11px; color: #94a3b8; margin-bottom: 30px; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
<h1>${downloadFilename ?? 'AI Maslahatchi Javobi'}</h1>
<div class="meta">Smart Medical Association Platform &nbsp;·&nbsp; ${new Date().toLocaleDateString('uz-UZ')}</div>
<div style="white-space:pre-wrap">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/^### (.+)$/gm, '<h3>$1</h3>').replace(/^## (.+)$/gm, '<h2>$1</h2>').replace(/^# (.+)$/gm, '<h1>$1</h1>')}</div>
</body>
</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, '_blank');
    if (w) {
      w.onload = () => { w.focus(); w.print(); };
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    toast.success(DOWNLOAD_LABELS[lang] ?? 'Downloaded');
  };

  const handleDownloadDoc = () => {
    // Convert markdown to basic HTML for proper Word rendering
    const bodyHtml = text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    // Word-compatible HTML with proper namespace and UTF-8 BOM
    const wordHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office'
xmlns:w='urn:schemas-microsoft-com:office:word'
xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>${downloadFilename ?? 'AI Javob'}</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml>
<![endif]-->
<style>
  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; margin: 2cm; color: #000; }
  h1 { font-size: 16pt; font-weight: bold; margin: 16pt 0 8pt; }
  h2 { font-size: 14pt; font-weight: bold; margin: 14pt 0 6pt; }
  h3 { font-size: 12pt; font-weight: bold; margin: 12pt 0 4pt; }
  h4 { font-size: 11pt; font-weight: bold; }
  li { margin: 3pt 0; }
  p { margin: 6pt 0; }
  .meta { font-size: 10pt; color: #666; border-bottom: 1pt solid #ccc; padding-bottom: 6pt; margin-bottom: 16pt; }
</style>
</head>
<body>
<div class="meta">${downloadFilename ?? 'AI Maslahatchi Javobi'} &nbsp;·&nbsp; Smart Medical Association &nbsp;·&nbsp; ${new Date().toLocaleDateString('uz-UZ')}</div>
<p>${bodyHtml}</p>
</body>
</html>`;

    // UTF-8 BOM is required for Word to open without encoding dialog
    const bom = '﻿';
    const blob = new Blob([bom + wordHtml], { type: 'application/vnd.ms-word;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${downloadFilename ?? 'ai-javob'}.doc`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.success(DOWNLOAD_LABELS[lang] ?? 'Downloaded');
  };

  const BTN = 'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all';
  const BASE = `${BTN} text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-transparent hover:border-slate-200`;
  const ACTIVE = `${BTN} bg-slate-100 border border-slate-200 text-slate-700`;

  return (
    <div className="flex flex-wrap items-center gap-1 pt-2 mt-2 border-t border-slate-100">
      {/* Copy */}
      <button onClick={handleCopy} className={copied ? ACTIVE : BASE} title="Copy">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        <span className="hidden sm:inline">{copied ? (COPY_LABELS[lang] ?? 'Copied') : 'Copy'}</span>
      </button>

      {/* Like */}
      <button onClick={handleLike} className={liked === 'up' ? `${ACTIVE} text-emerald-600` : BASE} title="Like">
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>

      {/* Dislike */}
      <button onClick={handleDislike} className={liked === 'down' ? `${ACTIVE} text-red-500` : BASE} title="Dislike">
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>

      {/* Retry */}
      {onRetry && (
        <button onClick={onRetry} className={BASE} title="Retry">
          <RotateCcw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Retry</span>
        </button>
      )}

      {/* Share */}
      <button onClick={handleShare} className={shared ? ACTIVE : BASE} title="Share">
        <Share2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {/* Download PDF */}
      <button onClick={handleDownloadPdf} className={BASE} title="Download PDF">
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">PDF</span>
      </button>

      {/* Download DOC */}
      <button onClick={handleDownloadDoc} className={BASE} title="Download DOC">
        <Download className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">DOC</span>
      </button>
    </div>
  );
}
