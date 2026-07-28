"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { FileImage, Plus, Edit, Trash2, Save, Move, Loader2 } from "lucide-react";
import Link from "next/link";
import { uploadTemplate, deleteTemplate } from "@/app/(dashboard)/certificate-center/actions";

export function TemplatesManager({ initialTemplates = [] }: { initialTemplates?: any[] }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [templates, setTemplates] = useState(initialTemplates);
  const [templateName, setTemplateName] = useState("");
  const [bgImage, setBgImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [elements, setElements] = useState([
    { id: 'cert_no', label: 'เลขที่เกียรติบัตร', text: 'เลขที่ ๙๗๗๒ / ๒๕๖๙', top: 8, left: 80, fontSize: 24, multiline: false },
    { id: 'student_name', label: 'ชื่อนักเรียน / ห้องเรียน', text: 'ชั้นมัธยมศึกษาปีที่ ๑/๒', top: 40, left: 50, fontSize: 42, multiline: false },
    { id: 'award_name', label: 'ชื่อรางวัล', text: 'ได้รับรางวัลเขตพื้นที่ดีเด่น ระดับชั้นมัธยมศึกษาตอนต้น\nประจำปีการศึกษา ๒๕๖๙', top: 52, left: 50, fontSize: 36, multiline: true },
    { id: 'date', label: 'วันที่ออกเกียรติบัตร', text: 'ให้ไว้ ณ วันที่ ๓๑ มีนาคม ๒๕๖๙', top: 72, left: 50, fontSize: 32, multiline: false },
  ]);

  const updateElement = (index: number, key: string, value: any) => {
    const newElements = [...elements];
    newElements[index] = { ...newElements[index], [key]: value };
    setElements(newElements);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setBgImage(url);
    }
  };

  const handleSave = async () => {
    if (!templateName) {
      alert("กรุณาตั้งชื่อแม่แบบ");
      return;
    }
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      alert("กรุณาแนบไฟล์รูปภาพแม่แบบ");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", templateName);
    
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    // Calculate actual layout config from DOM positions (center of element)
    const layoutConfig = elements.map(el => {
      const domEl = document.getElementById(`element-${el.id}`);
      if (domEl) {
        const rect = domEl.getBoundingClientRect();
        // x, y as center percentage
        const x = ((rect.left - containerRect.left + (rect.width / 2)) / containerRect.width) * 100;
        const y = ((rect.top - containerRect.top + (rect.height / 2)) / containerRect.height) * 100;
        return {
          id: el.id,
          x,
          y,
          fontSize: el.fontSize,
          text: el.text
        };
      }
      return {
        id: el.id,
        x: el.left,
        y: el.top,
        fontSize: el.fontSize,
        text: el.text
      };
    });
    
    formData.append("layoutConfig", JSON.stringify(layoutConfig));

    const result = await uploadTemplate(formData);
    setIsUploading(false);

    if (result.success) {
      alert("บันทึกแม่แบบสำเร็จ!");
      setIsEditing(false);
      setTemplateName("");
      setBgImage(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      alert("เกิดข้อผิดพลาด: " + result.error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
              <FileImage className="w-5 h-5" />
            </div>
            จัดการแม่แบบเกียรติบัตร
          </h1>
          <p className="text-gray-500 mt-1 ml-13">เพิ่มและกำหนดตำแหน่งข้อความบนเกียรติบัตร (Certificate Templates)</p>
        </div>
        <Link 
          href="/certificate-center"
          className="text-sm font-medium text-gray-500 hover:text-purple-600 transition-colors"
        >
          กลับสู่ศูนย์เกียรติบัตร
        </Link>
      </div>

      <div className="flex justify-between items-center bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h2 className="font-bold text-lg text-gray-900 dark:text-white">รายการแม่แบบที่มีอยู่</h2>
        <button 
          onClick={() => setIsEditing(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" /> สร้างแม่แบบใหม่
        </button>
      </div>

      {isEditing ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-6"
        >
          <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-800 pb-4">
            <h3 className="text-xl font-bold">สร้าง/แก้ไข แม่แบบ</h3>
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl font-semibold">ยกเลิก</button>
              <button 
                onClick={handleSave} 
                disabled={isUploading}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-semibold flex items-center gap-2"
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isUploading ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">ชื่อแม่แบบ</label>
                <input 
                  type="text" 
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-2 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-purple-500 outline-none" 
                  placeholder="เช่น เกียรติบัตรนักเรียนดีเด่น 2567" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">อัปโหลดภาพพื้นหลัง (Background)</label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 dark:file:bg-purple-900/30 dark:file:text-purple-400" 
                />
              </div>
              
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h4 className="font-semibold mb-3">คุณสมบัติข้อความ (ปรับขนาดได้)</h4>
                <div className="space-y-3">
                  {elements.map((el, index) => (
                    <div key={el.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Move className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{el.label}</span>
                      </div>
                      <div className="flex items-center justify-between pl-6">
                        <span className="text-xs text-gray-500">ขนาดฟอนต์ (px)</span>
                        <input 
                          type="number" 
                          value={el.fontSize}
                          onChange={(e) => updateElement(index, 'fontSize', Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-purple-500 outline-none text-center font-bold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div ref={containerRef} className="aspect-[1.414] w-full bg-gray-100 dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center relative overflow-hidden group">
                {bgImage ? (
                  <img src={bgImage} alt="Template Preview" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <p className="text-gray-400 font-medium z-10">ภาพตัวอย่าง (Preview)</p>
                )}
                
                {/* Draggable Elements */}
                {bgImage && elements.map((el, index) => (
                  <motion.div 
                    key={el.id}
                    id={`element-${el.id}`}
                    drag 
                    dragMomentum={false}
                    className="absolute cursor-move text-gray-900 group-hover:outline group-hover:outline-1 group-hover:outline-dashed group-hover:outline-purple-400 p-2"
                    style={{ 
                      fontFamily: "'TH Krub', 'TH Sarabun New', 'Sarabun', sans-serif",
                      top: `${el.top}%`,
                      left: `${el.left}%`,
                      x: el.id === 'cert_no' ? 0 : "-50%",
                      y: el.id === 'cert_no' ? 0 : "-50%",
                    }}
                  >
                    {el.multiline ? (
                      <textarea 
                        value={el.text}
                        onChange={(e) => updateElement(index, 'text', e.target.value)}
                        className="font-bold bg-transparent border-none outline-none text-center resize-none overflow-hidden block"
                        style={{ fontSize: `${el.fontSize}px`, width: `800px`, height: `${el.fontSize * 3}px`, lineHeight: 1.2 }}
                        onPointerDown={(e) => e.stopPropagation()} 
                      />
                    ) : (
                      <input 
                        type="text" 
                        value={el.text}
                        onChange={(e) => updateElement(index, 'text', e.target.value)}
                        className="font-bold bg-transparent border-none outline-none text-center block"
                        style={{ fontSize: `${el.fontSize}px`, width: `800px` }}
                        onPointerDown={(e) => e.stopPropagation()} 
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialTemplates.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              ยังไม่มีแม่แบบเกียรติบัตร กรุณาสร้างแม่แบบใหม่
            </div>
          )}
          {initialTemplates.map((template) => (
            <div key={template.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm group">
              <div className="aspect-[1.414] bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                 <img src={template.background_url} alt={template.name} className="absolute inset-0 w-full h-full object-cover" />
                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <button 
                      onClick={async () => {
                        if (confirm("ต้องการลบแม่แบบนี้ใช่หรือไม่?")) {
                          await deleteTemplate(template.id);
                          alert("ลบสำเร็จ!");
                        }
                      }} 
                      className="p-2 bg-white rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                 </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 dark:text-white truncate">{template.name}</h3>
                <p className="text-sm text-gray-500 mt-1">อัปเดตเมื่อ: {new Date(template.created_at).toLocaleDateString('th-TH')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
