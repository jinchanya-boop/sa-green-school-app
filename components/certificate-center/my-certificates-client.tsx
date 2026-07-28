"use client";

import { useState, useRef } from "react";
import { Download, CheckCircle, Search, Eye, Award, Loader2 } from "lucide-react";
import Link from "next/link";
import { toJpeg } from 'html-to-image';

export function MyCertificatesClient({ 
  initialCertificates,
  hideTitle = false
}: { 
  initialCertificates: any[],
  hideTitle?: boolean
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Filter certificates based on search term
  const filteredCertificates = initialCertificates.filter((cert) => {
    const term = searchTerm.toLowerCase();
    return (
      cert.student_name.toLowerCase().includes(term) ||
      cert.award_name.toLowerCase().includes(term) ||
      cert.cert_no.toLowerCase().includes(term) ||
      cert.id.toLowerCase().includes(term)
    );
  });

  const handleDownload = async (cert: any) => {
    try {
      setDownloadingId(cert.id);
      
      const node = document.getElementById(`cert-render-${cert.id}`);
      if (!node) throw new Error("Certificate node not found");
      
      // Temporarily expand to full A4 resolution for capture
      const originalStyle = node.getAttribute("style");
      node.style.transform = "scale(1)";
      node.style.width = "1123px";
      node.style.height = "794px";
      node.style.position = "absolute";
      node.style.top = "0";
      node.style.left = "0";
      node.style.zIndex = "50";
      
      // Let React/DOM settle
      await new Promise(r => setTimeout(r, 100));

      const dataUrl = await toJpeg(node, { 
        quality: 0.95,
        backgroundColor: "#ffffff",
        pixelRatio: 2 // High resolution
      });
      
      // Restore styles
      if (originalStyle) {
        node.setAttribute("style", originalStyle);
      }
      
      const link = document.createElement('a');
      link.download = `Certificate_${cert.cert_no.replace(/\//g, '-')}_${cert.student_name}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download image", err);
      alert("เกิดข้อผิดพลาดในการดาวน์โหลด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">เกียรติบัตรของฉัน</h1>
            <p className="text-gray-500">รวมผลงานแห่งความภาคภูมิใจของคุณ</p>
          </div>
          
          <div className="relative w-full sm:w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ, รางวัล, หรือรหัส..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>
        </div>
      )}

      {hideTitle && (
        <div className="flex justify-end mb-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="ค้นหาชื่อ, รางวัล, หรือรหัส..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm"
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
        {filteredCertificates.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">ไม่พบเกียรติบัตรที่ค้นหา</p>
          </div>
        ) : (
          filteredCertificates.map((cert: any) => (
            <div key={cert.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col">
              
              {/* Thumbnail Container */}
              <div className="aspect-[1.414] bg-gray-100 dark:bg-gray-700 relative border-b border-gray-100 dark:border-gray-700 overflow-hidden">
                
                {/* The actual node we render for downloading / previewing */}
                <div 
                  id={`cert-render-${cert.id}`} 
                  className="bg-white overflow-hidden origin-top-left"
                  style={{ transform: 'scale(0.3)', width: '333.33%', height: '333.33%' }}
                >
                  <img src={cert.background_url} alt="Certificate" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
                  <div className="absolute inset-0 w-full h-full pointer-events-none">
                    {cert.layout_config?.map((el: any) => {
                      let mockText = el.text || "";
                      if (el.id === 'cert_no') mockText = `เลขที่ ${cert.cert_no}`;
                      if (el.id === 'student_name') mockText = cert.student_name;
                      if (el.id === 'award_name') mockText = cert.award_name;
                      if (el.id === 'issue_date') mockText = `ให้ไว้ ณ วันที่ ๑๒ ตุลาคม ${cert.academic_year}`;
                      
                      return (
                        <div 
                          key={el.id} 
                          className="absolute whitespace-pre font-bold text-center"
                          style={{ 
                            left: `${el.x}%`, 
                            top: `${el.y}%`, 
                            fontSize: `${el.fontSize}px`, 
                            transform: 'translate(-50%, -50%)',
                            fontFamily: '"TH Krub", "Sarabun", "TH Sarabun New", sans-serif',
                            color: '#111',
                            lineHeight: '1.2'
                          }}
                        >
                          {mockText}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 z-10">
                  <button 
                    onClick={() => handleDownload(cert)}
                    disabled={downloadingId === cert.id}
                    className="bg-emerald-500 text-white p-3 rounded-full hover:scale-110 hover:bg-emerald-600 transition-transform shadow-lg disabled:opacity-50 disabled:scale-100"
                    title="ดาวน์โหลดเป็นรูปภาพ"
                  >
                    {downloadingId === cert.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {/* Certificate Metadata */}
              <div className="p-4 space-y-2 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white line-clamp-2 text-sm">
                    {cert.award_name}
                  </h3>
                  <span className="flex-shrink-0 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs px-2 py-1 rounded font-medium">
                    {cert.academic_year}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                  <p>เลขที่ {cert.cert_no}</p>
                </div>
                <div className="text-xs text-gray-500 mt-1 pb-2 flex-1">
                  <p className="line-clamp-1">{cert.student_name}</p>
                </div>
                
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                  <Link 
                    href={`/verify?id=${cert.id}`}
                    target="_blank"
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    ตรวจสอบความถูกต้อง
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
