"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Calendar, Award, Users, Eye, FileSignature, Loader2, ChevronRight, ChevronLeft, Printer } from "lucide-react";
import { issueCertificates } from "@/app/(dashboard)/certificate-center/actions";
import { useRouter } from "next/navigation";
import Link from "next/link";

const steps = [
  { id: 1, title: "เลือกแม่แบบ", icon: Award },
  { id: 2, title: "ระบุชื่อรางวัล", icon: FileSignature },
  { id: 3, title: "ข้อมูลเกียรติบัตร", icon: Calendar },
  { id: 4, title: "เลือกผู้รับ", icon: Users },
  { id: 5, title: "ตรวจสอบ", icon: Eye },
];

function toThaiNumber(numStr: string) {
  const thaiNums = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return numStr.toString().replace(/[0-9]/g, (match) => thaiNums[parseInt(match)]);
}

export function IssueCertificateWizard({ initialTemplates = [] }: { initialTemplates?: any[] }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    templateId: "",
    awardType: "",
    academicYear: "2569",
    semester: "1",
    startCertNo: "1",
    students: [] as string[],
  });
  
  const [isIssuing, setIsIssuing] = useState(false);
  const router = useRouter();

  const [awardBuilder, setAwardBuilder] = useState({
    category: "",
    medal: "",
    level: ""
  });

  const handleIssue = async () => {
    if (!selectedTemplate) return;
    
    setIsIssuing(true);
    
    // Generate records for each selected student
    const recordsToInsert = formData.students.map((studentId, idx) => {
      // Calculate actual cert string (for DB)
      let certNo = formData.startCertNo || "1";
      if (!isNaN(Number(certNo))) {
        certNo = String(Number(certNo) + idx);
      }
      const certNoThai = toThaiNumber(certNo);
      const yearThai = toThaiNumber(formData.academicYear);
      const finalCertNo = `${certNoThai} / ${yearThai}`;
      
      let studentName = studentId.startsWith('class-') ? "ชั้นมัธยมศึกษาปีที่ ๑/๒" : "เด็กชาย สมชาย ใจดี"; // This should be queried from real users, but for mock:
      
      // UUID generation mock (in real app, let DB handle or use crypto.randomUUID)
      const uniqueId = `cert-${Date.now()}-${idx}-${Math.floor(Math.random()*1000)}`;
      
      return {
        id: uniqueId,
        cert_no: finalCertNo,
        student_id: studentId,
        student_name: studentName,
        template_id: formData.templateId,
        award_name: formData.awardType,
        academic_year: formData.academicYear,
        semester: formData.semester,
        layout_config: selectedTemplate.layout_config, // Snapshot of layout at issue time
        background_url: selectedTemplate.background_url // Snapshot of bg
      };
    });
    
    try {
      const res = await issueCertificates(recordsToInsert);
      if (res.success) {
        alert(`ออกเกียรติบัตรสำเร็จ ${formData.students.length} ใบ!`);
        // Navigate back to certificate center or my certificates
        router.push("/certificate-center/my-certificates");
      } else {
        alert("เกิดข้อผิดพลาด: " + res.error);
      }
    } catch (e: any) {
      alert("เกิดข้อผิดพลาด: " + e.message);
    } finally {
      setIsIssuing(false);
    }
  };

  // Function to auto-generate award text
  const generateAwardText = (cat: string, med: string, lvl: string) => {
    let text = "";
    if (cat) text += `รางวัล${cat}`;
    if (med) text += ` ${med}`;
    if (lvl) text += ` ${lvl}`;
    if (text.trim() !== "") {
      text += `\nประจำปีการศึกษา ${toThaiNumber(formData.academicYear)}`;
    }
    setFormData(prev => ({ ...prev, awardType: text.trim() }));
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));
  const selectedTemplate = initialTemplates.find(t => t.id === formData.templateId);

  // Auto-fill award type from template when selected
  if (selectedTemplate && !formData.awardType && selectedTemplate.layout_config) {
    const awardEl = selectedTemplate.layout_config.find((el: any) => el.id === 'award_name');
    if (awardEl && awardEl.text) {
      setFormData(prev => ({ ...prev, awardType: awardEl.text }));
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <FileSignature className="w-5 h-5" />
            </div>
            ออกเกียรติบัตร (Issue Certificate)
          </h1>
          <p className="text-gray-500 mt-1 ml-13">สร้างและออกเกียรติบัตรอัตโนมัติ 5 ขั้นตอน</p>
        </div>
        <Link 
          href="/certificate-center"
          className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors"
        >
          กลับสู่ศูนย์เกียรติบัตร
        </Link>
      </div>

      {/* Stepper Progress */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500"
              initial={{ width: "0%" }}
              animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                    ${isActive ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none ring-4 ring-emerald-50 dark:ring-emerald-900/30" : 
                      isCompleted ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50" : 
                      "bg-white dark:bg-gray-800 text-gray-400 border-2 border-gray-100 dark:border-gray-700"}
                  `}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.id}
                </div>
                <span className={`text-xs font-semibold ${isActive || isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-gray-400"}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        <div className="p-8 flex-1">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">1. เลือกแม่แบบเกียรติบัตร</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {initialTemplates.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                      ยังไม่มีแม่แบบเกียรติบัตร กรุณาสร้างแม่แบบในเมนู "จัดการแม่แบบ" ก่อนครับ
                    </div>
                  )}
                  {initialTemplates.map((template) => (
                    <div 
                      key={template.id}
                      onClick={() => setFormData({...formData, templateId: template.id})}
                      className={`border-2 rounded-2xl p-4 cursor-pointer transition-all duration-200
                        ${formData.templateId === template.id 
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                          : "border-gray-100 dark:border-gray-800 hover:border-emerald-200"}
                      `}
                    >
                      <div className="aspect-[1.414] bg-gray-100 dark:bg-gray-800 rounded-xl mb-4 flex items-center justify-center overflow-hidden relative">
                        <img src={template.background_url} alt={template.name} className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                      <p className="font-semibold text-center text-gray-900 dark:text-white truncate">{template.name}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">2. ระบุข้อความรางวัล / ชื่อเกียรติบัตร</h2>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300">ตัวช่วยสร้างข้อความอัตโนมัติ</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <select 
                      value={awardBuilder.category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setAwardBuilder(prev => ({ ...prev, category: newCat }));
                        generateAwardText(newCat, awardBuilder.medal, awardBuilder.level);
                      }}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm"
                    >
                      <option value="">-- เลือกประเภท --</option>
                      <option value="เขตพื้นที่รับผิดชอบดีเด่น">เขตพื้นที่รับผิดชอบ</option>
                      <option value="ห้องเรียนสะอาดดีเด่น">ความสะอาดห้องเรียน</option>
                      <option value="แก้วน้ำส่วนตัวดีเด่น">ติดตามแก้วน้ำส่วนตัว</option>
                    </select>

                    <select 
                      value={awardBuilder.medal}
                      onChange={(e) => {
                        const newMedal = e.target.value;
                        setAwardBuilder(prev => ({ ...prev, medal: newMedal }));
                        generateAwardText(awardBuilder.category, newMedal, awardBuilder.level);
                      }}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm"
                    >
                      <option value="">-- เลือกระดับเหรียญ --</option>
                      <option value="ระดับเหรียญทอง">ระดับเหรียญทอง</option>
                      <option value="ระดับเหรียญเงิน">ระดับเหรียญเงิน</option>
                      <option value="ระดับเหรียญทองแดง">ระดับเหรียญทองแดง</option>
                      {awardBuilder.category === "แก้วน้ำส่วนตัวดีเด่น" && (
                        <option value="สถิติพกแก้วน้ำสูงสุด">สถิติพกแก้วน้ำสูงสุด</option>
                      )}
                    </select>

                    <select 
                      value={awardBuilder.level}
                      onChange={(e) => {
                        const newLvl = e.target.value;
                        setAwardBuilder(prev => ({ ...prev, level: newLvl }));
                        generateAwardText(awardBuilder.category, awardBuilder.medal, newLvl);
                      }}
                      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 outline-none focus:border-emerald-500 text-sm"
                    >
                      <option value="">-- เลือกระดับชั้น --</option>
                      <option value="ชั้นมัธยมศึกษาตอนต้น">ชั้นมัธยมศึกษาตอนต้น</option>
                      <option value="ชั้นมัธยมศึกษาตอนปลาย">ชั้นมัธยมศึกษาตอนปลาย</option>
                    </select>
                  </div>
                </div>

                <div className="max-w-2xl mt-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ข้อความที่จะปรากฏในตำแหน่ง "ชื่อรางวัล"</label>
                  <textarea
                    value={formData.awardType}
                    onChange={(e) => setFormData({...formData, awardType: e.target.value})}
                    placeholder="เช่น รางวัลเขตพื้นที่รับผิดชอบดีเด่น ระดับเหรียญทอง ชั้นมัธยมศึกษาตอนต้น"
                    rows={4}
                    className="w-full bg-white dark:bg-gray-800 border-2 border-emerald-100 dark:border-emerald-900/50 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-gray-900 dark:text-white resize-none"
                  />
                  <p className="text-sm text-gray-500 mt-2">หมายเหตุ: คุณสามารถแก้ไขหรือพิมพ์ข้อความใหม่ในกล่องนี้ได้เลย ข้อความในกล่องนี้จะเป็นสิ่งพิมพ์ลงไปในเกียรติบัตร</p>
                </div>
              </motion.div>
            )}

            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">3. ข้อมูลเกียรติบัตรและปีการศึกษา</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">เลขที่เริ่มต้นเกียรติบัตร</label>
                    <input 
                      type="number"
                      value={formData.startCertNo}
                      onChange={(e) => setFormData({...formData, startCertNo: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-gray-900 dark:text-white"
                      placeholder="เช่น 1 หรือ 9772"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">ปีการศึกษา</label>
                    <select 
                      value={formData.academicYear}
                      onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                      className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors text-gray-900 dark:text-white"
                    >
                      <option value="2569">2569</option>
                      <option value="2568">2568</option>
                      <option value="2567">2567</option>
                      <option value="2566">2566</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">ภาคเรียน</label>
                    <div className="flex gap-4">
                      {["1", "2"].map((term) => (
                        <button
                          key={term}
                          onClick={() => setFormData({...formData, semester: term})}
                          className={`flex-1 py-3 rounded-xl font-semibold border-2 transition-colors
                            ${formData.semester === term 
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" 
                              : "border-gray-100 dark:border-gray-800 text-gray-500 hover:border-emerald-200"}
                          `}
                        >
                          เทอม {term}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 h-full flex flex-col"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">4. เลือกนักเรียน</h2>
                  <div className="text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded-full">
                    เลือกแล้ว {formData.students.length} คน
                  </div>
                </div>
                
                <div className="flex-1 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col">
                  {/* Mock search/filter */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 flex flex-col sm:flex-row gap-4">
                    <input 
                      type="text" 
                      placeholder="ค้นหาชื่อนักเรียน หรือ ชั้นเรียน (เช่น ม.1/2)..." 
                      className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 text-gray-900 dark:text-white"
                    />
                    <select className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500 text-gray-900 dark:text-white">
                      <option value="">ทุกระดับชั้น</option>
                      <option>ม.1</option>
                      <option>ม.2</option>
                    </select>
                  </div>
                  
                  {/* Mock student/class list */}
                  <div className="p-4 flex-1 overflow-y-auto space-y-2 max-h-[300px]">
                    {/* Mock Class Option */}
                    <div 
                      onClick={() => {
                        const isSelected = formData.students.includes('class-m12');
                        if (isSelected) {
                          setFormData({...formData, students: formData.students.filter(s => s !== 'class-m12')});
                        } else {
                          setFormData({...formData, students: [...formData.students, 'class-m12']});
                        }
                      }}
                      className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-colors
                        ${formData.students.includes('class-m12')
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                          : "border-gray-100 dark:border-gray-800 hover:border-emerald-200"}
                      `}
                    >
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center border
                        ${formData.students.includes('class-m12') ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 dark:border-gray-600"}
                      `}>
                        {formData.students.includes('class-m12') && <Check className="w-4 h-4" />}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        C
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">ชั้นมัธยมศึกษาปีที่ 1/2</p>
                        <p className="text-xs text-gray-500">ออกเกียรติบัตรแบบกลุ่ม (ทั้งห้อง)</p>
                      </div>
                    </div>

                    {[1, 2, 3, 4, 5].map((id) => {
                      const strId = String(id);
                      const isSelected = formData.students.includes(strId);
                      return (
                        <div 
                          key={id}
                          onClick={() => {
                            if (isSelected) {
                              setFormData({...formData, students: formData.students.filter(s => s !== strId)});
                            } else {
                              setFormData({...formData, students: [...formData.students, strId]});
                            }
                          }}
                          className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-colors
                            ${isSelected 
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                              : "border-gray-100 dark:border-gray-800 hover:border-emerald-200"}
                          `}
                        >
                          <div className={`w-6 h-6 rounded-md flex items-center justify-center border
                            ${isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-300 dark:border-gray-600"}
                          `}>
                            {isSelected && <Check className="w-4 h-4" />}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-bold">
                            N{id}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">เด็กชาย สมชาย ใจดี {id}</p>
                            <p className="text-xs text-gray-500">ม.1/1 • เลขประจำตัว 1234{id}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {currentStep === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">5. ตรวจสอบข้อมูลก่อนออกเกียรติบัตร</h2>
                </div>
                
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-6">
                  <div className="grid grid-cols-2 gap-y-4">
                    <div>
                      <p className="text-sm text-gray-500">แม่แบบ</p>
                      <p className="font-semibold">{selectedTemplate?.name || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">รางวัล</p>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">{formData.awardType || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ปีการศึกษา/ภาคเรียน</p>
                      <p className="font-semibold">{formData.academicYear} / {formData.semester}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">จำนวนนักเรียนที่ได้รับ</p>
                      <p className="font-semibold text-emerald-700 dark:text-emerald-400">{formData.students.length} คน</p>
                    </div>
                  </div>
                </div>
                
                <div className="aspect-[1.414] w-full max-w-4xl mx-auto bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center relative overflow-hidden shadow-sm">
                  {selectedTemplate ? (
                    <>
                      <img src={selectedTemplate.background_url} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 w-full h-full">
                        {selectedTemplate.layout_config?.map((el: any) => {
                          let mockText = el.text || "";
                          
                          if (el.id === 'cert_no') {
                            const certBaseStr = mockText.includes('/') ? mockText.split('/')[0].trim() : `เลขที่ ${formData.startCertNo || 1}`;
                            mockText = `${toThaiNumber(certBaseStr.replace(/[^0-9]/g, '') ? certBaseStr.replace(/[0-9]/g, (match: string) => toThaiNumber(match)) : `เลขที่ ${toThaiNumber(formData.startCertNo || '1')}`)} / ${toThaiNumber(formData.academicYear)}`;
                          }
                          
                          if (el.id === 'student_name') {
                            const isClassSelected = formData.students.some(s => s.startsWith('class-'));
                            if (isClassSelected) {
                              mockText = "ชั้นมัธยมศึกษาปีที่ ๑/๒"; // Using class name
                            } else {
                              mockText = "เด็กชาย สมชาย ใจดี"; // Using generic student name
                            }
                          }
                          
                          if (el.id === 'award_name') {
                            mockText = formData.awardType || "รางวัลดีเด่น";
                          }
                          
                          if (el.id === 'issue_date') {
                            mockText = `ให้ไว้ ณ วันที่ ๑๒ ตุลาคม ${toThaiNumber(formData.academicYear)}`;
                          }
                          
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
                    </>
                  ) : (
                    <div className="text-center">
                      <Eye className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 font-medium">กรุณาเลือกแม่แบบ</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-6 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all
              ${currentStep === 1 
                ? "text-gray-400 bg-gray-100 dark:bg-gray-800 cursor-not-allowed" 
                : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700"}
            `}
          >
            <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
          </button>
          
          <button
            onClick={currentStep === steps.length ? handleIssue : nextStep}
            disabled={isIssuing || (currentStep === steps.length && formData.students.length === 0)}
            className="px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {currentStep === steps.length ? (
              isIssuing ? (
                <>กำลังออกเกียรติบัตร... <Loader2 className="w-4 h-4 animate-spin" /></>
              ) : (
                <>สร้างเกียรติบัตร <Check className="w-4 h-4" /></>
              )
            ) : (
              <>ถัดไป <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
