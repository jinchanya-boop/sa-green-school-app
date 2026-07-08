"use client";

import { useState, useRef } from "react";
import { Users, ShieldCheck, Power, UserPlus, Upload, FileUp } from "lucide-react";
import { updateUserRole, updateUserHomeroom, toggleUserActive, addUser, bulkImportUsers } from "@/app/(dashboard)/settings/actions";
import * as XLSX from "xlsx";

const ROLES = [
  { value: "guest", label: "ผู้เยี่ยมชม (Guest)" },
  { value: "student", label: "นักเรียน" },
  { value: "class_representative", label: "หัวหน้าห้อง/เวร" },
  { value: "student_council", label: "สภานักเรียน" },
  { value: "homeroom_teacher", label: "ครูประจำชั้น" },
  { value: "grade_supervisor", label: "หัวหน้าระดับ" },
  { value: "building_supervisor", label: "หัวหน้าอาคาร" },
  { value: "deputy_director", label: "รองผู้อำนวยการ" },
  { value: "director", label: "ผู้อำนวยการ" },
  { value: "administrator", label: "ผู้ดูแลระบบ (Admin)" },
];

export function UsersTab({ data }: { data: any }) {
  const [loading, setLoading] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoading(true);
    const res = await updateUserRole(userId, newRole);
    if (!res.success) alert(res.error);
    setLoading(false);
  };

  const handleHomeroomChange = async (userId: string, homeroomId: string) => {
    setLoading(true);
    const res = await updateUserHomeroom(userId, homeroomId || null);
    if (!res.success) alert(res.error);
    setLoading(false);
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    if (!confirm(`ต้องการ${currentStatus ? 'ระงับ' : 'เปิดใช้งาน'}บัญชีนี้ใช่หรือไม่?`)) return;
    setLoading(true);
    const res = await toggleUserActive(userId, !currentStatus);
    if (!res.success) alert(res.error);
    setLoading(false);
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const res = await addUser({
      email: formData.get("email") as string,
      full_name: formData.get("full_name") as string,
      role: formData.get("role") as string,
    });

    if (!res.success) alert(res.error);
    else {
      setIsAddingUser(false);
      form.reset();
    }
    setLoading(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        setLoading(true);
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        // Map Excel data to our format
        // Expected Excel columns: Email, Name, Role (optional), Password (optional)
        const usersToImport = data.map((row: any) => ({
          email: row.Email || row.email || row["อีเมล"],
          full_name: row.Name || row.name || row["ชื่อ-นามสกุล"],
          role: row.Role || row.role || row["บทบาท"] || "guest",
          password: row.Password || row.password || row["รหัสผ่าน"] || "123456"
        })).filter(u => u.email && u.full_name);

        if (usersToImport.length === 0) {
          alert("ไม่พบข้อมูลที่สามารถนำเข้าได้ กรุณาตรวจสอบไฟล์ Excel (ต้องมีคอลัมน์ Email และ Name)");
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        const res = await bulkImportUsers(usersToImport);
        if (!res.success) alert(res.error);
        else alert(res.message || "นำเข้าสำเร็จ");
      } catch (error) {
        console.error(error);
        alert("เกิดข้อผิดพลาดในการอ่านไฟล์");
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <>
      <div className="stat-card space-y-4 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            จัดการผู้ใช้งานระบบ
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsAddingUser(true)} disabled={loading} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
              <UserPlus className="w-4 h-4" /> เพิ่มผู้ใช้
            </button>
            <a 
              href="/templates/user_import_template.csv" 
              download
              className="px-3 py-1.5 bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              โหลดไฟล์ต้นแบบ
            </a>
            <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="px-3 py-1.5 bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg text-sm font-medium transition-colors flex items-center gap-1">
              <FileUp className="w-4 h-4" /> นำเข้า Excel/CSV
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls, .csv" className="hidden" />
          </div>
        </div>

      <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium whitespace-nowrap">
            <tr>
              <th className="px-4 py-3 font-medium">ชื่อ-นามสกุล</th>
              <th className="px-4 py-3 font-medium">อีเมล</th>
              <th className="px-4 py-3 font-medium">ห้องประจำชั้น</th>
              <th className="px-4 py-3 font-medium">บทบาท</th>
              <th className="px-4 py-3 text-center">สถานะ</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {data.profiles.map((user: any) => (
              <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!user.is_active ? "opacity-60" : ""}`}>
                <td className="px-4 py-3 font-medium whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                        {user.full_name?.[0]}
                      </div>
                    )}
                    {user.full_name}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{user.email}</td>
                <td className="px-4 py-3">
                  <select 
                    value={user.homeroom_id || data.homeroomTeachers?.find((ht: any) => ht.teacher_id === user.id)?.homeroom_id || ""} 
                    onChange={(e) => handleHomeroomChange(user.id, e.target.value)}
                    disabled={loading}
                    className="w-full min-w-[120px] px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">-- ไม่ระบุ --</option>
                    {data.homerooms.map((hr: any) => (
                      <option key={hr.id} value={hr.id}>{hr.class_name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    disabled={loading}
                    className="w-full min-w-[150px] px-2 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500"
                  >
                    {ROLES.map(r => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-center">
                  {user.is_active ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                      ปกติ
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                      ถูกระงับ
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button 
                    onClick={() => handleToggleActive(user.id, user.is_active)}
                    disabled={loading}
                    className={`p-1.5 rounded-lg transition-colors ${user.is_active ? "text-red-500 hover:bg-red-50" : "text-emerald-500 hover:bg-emerald-50"}`}
                    title={user.is_active ? "ระงับบัญชี" : "เปิดใช้งาน"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {data.profiles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  ไม่พบผู้ใช้งานในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

      {isAddingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddUser} className="bg-white dark:bg-gray-900 p-6 rounded-2xl max-w-sm w-full space-y-4">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white">เพิ่มผู้ใช้งาน</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ชื่อ-นามสกุล</label>
                <input type="text" name="full_name" required placeholder="ชื่อ-นามสกุล" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">อีเมล</label>
                <input type="email" name="email" required placeholder="อีเมล" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">บทบาท</label>
                <select name="role" required className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm">
                  {ROLES.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gray-500 italic">รหัสผ่านเริ่มต้นคือ 123456</p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setIsAddingUser(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">ยกเลิก</button>
              <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg">เพิ่ม</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
