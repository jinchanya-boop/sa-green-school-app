"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Camera, Save, MapPin, Calendar, UploadCloud } from "lucide-react";
import imageCompression from "browser-image-compression";
import { submitAreaEvaluation } from "@/app/(dashboard)/area-evaluation/actions";
import type { EvaluationCriteria, ResponsibleArea, SemesterRecord } from "@/types";

interface AreaEvaluationFormProps {
  areas: ResponsibleArea[];
  semesters: SemesterRecord[];
  criteria: EvaluationCriteria[];
  userRole?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function AreaEvaluationForm({ areas, semesters, criteria, userRole, onCancel, onSuccess }: AreaEvaluationFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [generalPreviews, setGeneralPreviews] = useState<string[]>([]);
  const [compressedPhotos, setCompressedPhotos] = useState<(File | null)[]>([null, null]);

  const activeSemester = semesters.find(s => s.is_active);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.delete("photo_1");
    formData.delete("photo_2");

    // Validate photos
    if (!compressedPhotos[0] || !compressedPhotos[1]) {
      setError("กรุณาอัปโหลดภาพถ่ายยืนยันทั้ง 2 ภาพ");
      setLoading(false);
      return;
    }

    // Append compressed photos to FormData (same as classroom-eval)
    formData.append("photo_1", compressedPhotos[0], compressedPhotos[0].name);
    formData.append("photo_2", compressedPhotos[1], compressedPhotos[1].name);

    // Determine which button was clicked
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement;
    if (submitter?.name === "action_draft") {
      formData.set("status", "draft");
    } else {
      formData.set("status", "submitted");
    }

    const result = await submitAreaEvaluation(formData);

    setLoading(false);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || "เกิดข้อผิดพลาดในการบันทึก");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-600" />
          บันทึกการประเมินพื้นที่รับผิดชอบ
        </h2>
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900 text-sm flex items-start gap-2">
          <span className="font-semibold text-red-700 dark:text-red-300">ข้อผิดพลาด:</span>
          <span className="flex-1">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} encType="multipart/form-data" className="space-y-6">
        {/* Academic Year and Semester (Read-only since it takes the active one) */}
        <input type="hidden" name="semester_id" value={activeSemester?.id || ""} />

        {/* Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">วันที่ประเมิน <span className="text-red-500">*</span></label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="date"
                name="evaluated_at"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
            </div>
          </div>
          
          {userRole === "class_representative" && areas.length === 1 ? (
            <input type="hidden" name="responsible_area_id" value={areas[0].id} />
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ห้องเรียน / พื้นที่รับผิดชอบ <span className="text-red-500">*</span></label>
              <select 
                name="responsible_area_id" 
                required
                defaultValue={areas.length === 1 ? areas[0].id : ""}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              >
                {areas.length !== 1 && <option value="">-- เลือกพื้นที่รับผิดชอบ --</option>}
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.name} {a.location_description ? `(${a.location_description})` : ''}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Display Area Map */}
        <div className="w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
          <img src="/images/area.jpg" alt="แผนผังเขตพื้นที่" className="w-full h-auto object-cover max-h-[300px]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-4 pointer-events-none">
            <p className="text-white font-medium text-sm drop-shadow-md">แผนผังอาคารสถานที่ และพื้นที่รับผิดชอบ</p>
          </div>
        </div>

        {/* Criteria List */}
        <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
              หัวข้อการประเมิน (คะแนนเต็ม {criteria.reduce((sum, c) => sum + Number(c.max_score), 0)} คะแนน)
            </h3>
            
            <div className="space-y-4">
            {criteria.map((c, i) => (
              <div key={c.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row md:items-center gap-4">
                <input type="hidden" name="criteria_id[]" value={c.id} />
                <input type="hidden" name="max_score[]" value={c.max_score} />
                
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {i + 1}. {c.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {c.description}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      name="score[]" 
                      min="0" 
                      max={c.max_score} 
                      step="0.5" 
                      required
                      placeholder="0"
                      className="w-20 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-center font-medium"
                    />
                    <span className="text-gray-400 text-sm">/ {c.max_score}</span>
                  </div>
                </div>
                
                <div className="md:w-1/3">
                  <input 
                    type="text" 
                    name="item_notes[]" 
                    placeholder="หมายเหตุ (ถ้ามี)"
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            ))}
            </div>
          </div>
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-500" />
            ภาพถ่ายยืนยัน (จำเป็นต้องระบุ 2 ภาพ)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ภาพถ่ายที่ 1 <span className="text-red-500">*</span>
              </label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  name="photo_1" 
                  accept="image/*" 
                  required={!compressedPhotos[0]}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const compressedFile = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true });
                        setGeneralPreviews(prev => {
                          const newPreviews = [...prev];
                          newPreviews[0] = URL.createObjectURL(compressedFile);
                          return newPreviews;
                        });
                        setCompressedPhotos(prev => {
                          const newPhotos = [...prev];
                          newPhotos[0] = compressedFile;
                          return newPhotos;
                        });
                      } catch (err) {
                        console.error('Error compressing image:', err);
                      }
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:border-indigo-300 transition-colors">
                  {generalPreviews[0] ? (
                    <div className="flex justify-center pointer-events-none">
                      <img src={generalPreviews[0]} alt="Preview 1" className="h-32 w-full object-cover rounded-lg border border-gray-200" />
                    </div>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-indigo-500 transition-colors" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">คลิก หรือ ลากไฟล์มาวาง</p>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ภาพถ่ายที่ 2 <span className="text-red-500">*</span>
              </label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  name="photo_2" 
                  accept="image/*" 
                  required={!compressedPhotos[1]}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const compressedFile = await imageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true });
                        setGeneralPreviews(prev => {
                          const newPreviews = [...prev];
                          newPreviews[1] = URL.createObjectURL(compressedFile);
                          return newPreviews;
                        });
                        setCompressedPhotos(prev => {
                          const newPhotos = [...prev];
                          newPhotos[1] = compressedFile;
                          return newPhotos;
                        });
                      } catch (err) {
                        console.error('Error compressing image:', err);
                      }
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                />
                <div className="w-full p-6 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:border-indigo-300 transition-colors">
                  {generalPreviews[1] ? (
                    <div className="flex justify-center pointer-events-none">
                      <img src={generalPreviews[1]} alt="Preview 2" className="h-32 w-full object-cover rounded-lg border border-gray-200" />
                    </div>
                  ) : (
                    <>
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-indigo-500 transition-colors" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">คลิก หรือ ลากไฟล์มาวาง</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes (Description of what they did) */}
        {userRole === "class_representative" ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              รายละเอียดสิ่งที่ดำเนินการ <span className="text-red-500">*</span>
            </label>
            <textarea
              name="evaluator_notes"
              required
              placeholder="เขียนบรรยายสิ่งที่นักเรียนทำ (เช่น กวาดพื้น, ทิ้งขยะ, จัดโต๊ะ...)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              rows={3}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ข้อเสนอแนะเพิ่มเติม / หมายเหตุ (ถ้ามี)</label>
            <textarea 
              name="evaluator_notes" 
              rows={2}
              placeholder="คำอธิบายหรือเหตุผลเพิ่มเติม..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
          <button 
            type="button" 
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            ยกเลิก
          </button>
          
          {userRole !== "class_representative" && (
            <button 
              type="submit" 
              name="action_draft"
              value="draft"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-800 transition-colors"
            >
              บันทึกแบบร่าง (Save Draft)
            </button>
          )}

          <button 
            type="submit" 
            name="action_submit"
            value="submit"
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50 ${
              userRole === "class_representative" ? "bg-blue-600 hover:bg-blue-700" : "gradient-green hover:opacity-90"
            }`}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-5 h-5" />
            )}
            {loading ? "กำลังบันทึก..." : (userRole === "class_representative" ? "ส่งรายงานความสะอาด" : "ส่งผลการประเมิน (Submit)")}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
