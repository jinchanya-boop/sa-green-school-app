"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Camera, Save, MapPin, School } from "lucide-react";
import imageCompression from 'browser-image-compression';
import { submitClassroomEvaluation, submitClassroomReport } from "@/app/(dashboard)/classroom-eval/actions";
import type { EvaluationCriteria, Room, SemesterRecord } from "@/types";

interface ClassroomEvalFormProps {
  rooms: Room[];
  semesters: SemesterRecord[];
  criteria: EvaluationCriteria[];
  userRole?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ClassroomEvalForm({ rooms, semesters, criteria, userRole, onCancel, onSuccess }: ClassroomEvalFormProps) {
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
    
    if (compressedPhotos[0]) {
      formData.append("photo_1", compressedPhotos[0], compressedPhotos[0].name);
    }
    if (compressedPhotos[1]) {
      formData.append("photo_2", compressedPhotos[1], compressedPhotos[1].name);
    }

    const result = await submitClassroomEvaluation(formData);

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
          <School className="w-5 h-5 text-indigo-600" />
          บันทึกการประเมินความสะอาดห้องเรียน
        </h2>
        <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <input type="hidden" name="semester_id" value={activeSemester?.id || ""} />

        {/* Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ห้องเรียนที่ประเมิน</label>
            <select 
              name="room_id" 
              required
              defaultValue={rooms.length === 1 ? rooms[0].id : ""}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              {rooms.length !== 1 && <option value="">-- เลือกห้องเรียน --</option>}
              {rooms.map(r => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">วันที่ประเมิน</label>
            <input 
              type="date"
              name="eval_date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Criteria */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800">
              เกณฑ์การประเมิน
            </h3>
            <div className="space-y-3">
              {criteria.map((c, i) => (
                <div key={c.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col md:flex-row md:items-start gap-4">
                  <input type="hidden" name="criteria_id[]" value={c.id} />
                  <input type="hidden" name="max_score[]" value={c.max_score} />
                  
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white text-sm">
                      {i + 1}. {c.name}
                    </div>
                    {c.description && (
                      <div className="text-xs text-gray-500 mt-1">{c.description}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto mt-3 md:mt-0">
                    <div className="w-24">
                      <input 
                        type="number"
                        name="score[]"
                        min="0"
                        max={c.max_score}
                        step="0.5"
                        required
                        placeholder={`0-${c.max_score}`}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-bold"
                      />
                    </div>
                    <div className="flex-1">
                      <input 
                        type="text"
                        name="item_notes[]"
                        placeholder="หมายเหตุ (ถ้ามี)"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        {/* Photo Uploads */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white pb-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-500" />
            ภาพถ่ายประกอบ (สูงสุด 2 ภาพ)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Photo 1 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ภาพถ่ายที่ 1
              </label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  name="photo_1" 
                  accept="image/*" 
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

            {/* Photo 2 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ภาพถ่ายที่ 2
              </label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  name="photo_2" 
                  accept="image/*" 
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

        {/* General Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">ข้อเสนอแนะเพิ่มเติม</label>
          <textarea 
            name="evaluator_notes" 
            rows={3}
            placeholder="คำแนะนำเพื่อให้ปรับปรุง..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button 
            type="button" 
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            ยกเลิก
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/30 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {loading ? "กำลังบันทึก..." : (userRole === "class_representative" ? "ส่งรายงานห้องเรียน" : "บันทึกผลการประเมิน")}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
