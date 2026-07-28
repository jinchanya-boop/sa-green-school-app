import { createClient as createAdminClient } from "@supabase/supabase-js";
import { CheckCircle, XCircle, Search, Award } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "ตรวจสอบเกียรติบัตร | โรงเรียนสา",
};

export default async function VerifyPage({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams.id;
  
  let certificate = null;
  let errorMsg = null;

  if (id) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createAdminClient(supabaseUrl!, supabaseKey!);

    const { data, error } = await supabase
      .from("cert_center_issued")
      .select("*")
      .eq("id", id)
      .single();
      
    if (error || !data) {
      errorMsg = "ไม่พบข้อมูลเกียรติบัตรในระบบ หรือรหัสไม่ถูกต้อง";
    } else {
      certificate = data;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
              SA
            </div>
            <div>
              <h1 className="font-bold text-gray-900">โรงเรียนสา (Sa Green School)</h1>
              <p className="text-xs text-gray-500">ระบบตรวจสอบความถูกต้องของเกียรติบัตร</p>
            </div>
          </div>
          <Link href="/" className="text-sm text-emerald-600 hover:underline">
            กลับสู่หน้าหลัก
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          
          <div className="p-8 md:p-10 text-center">
            <Award className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ตรวจสอบเกียรติบัตรออนไลน์</h2>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              กรุณากรอกรหัสอ้างอิงที่อยู่มุมล่างของเกียรติบัตร หรือสแกน QR Code เพื่อตรวจสอบว่าเกียรติบัตรนี้เป็นของแท้และออกโดยโรงเรียน
            </p>

            <form className="flex gap-2 max-w-md mx-auto mb-10">
              <input 
                type="text" 
                name="id"
                defaultValue={id || ""}
                placeholder="กรอกรหัสอ้างอิง (เช่น cert-170...)" 
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-500 transition-colors"
                required
              />
              <button 
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                ตรวจสอบ
              </button>
            </form>

            {id && certificate && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-left animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-800">เกียรติบัตรนี้เป็นของจริง</h3>
                    <p className="text-emerald-600 text-sm">ออกโดยระบบอัตโนมัติของโรงเรียนสา</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 space-y-4 border border-emerald-100">
                  <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-3">
                    <span className="text-gray-500 text-sm col-span-1">ชื่อผู้รับ:</span>
                    <span className="font-bold text-gray-900 col-span-2">{certificate.student_name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-3">
                    <span className="text-gray-500 text-sm col-span-1">รางวัลที่ได้รับ:</span>
                    <span className="font-bold text-gray-900 col-span-2">{certificate.award_name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-3">
                    <span className="text-gray-500 text-sm col-span-1">เลขที่เกียรติบัตร:</span>
                    <span className="font-bold text-gray-900 col-span-2">{certificate.cert_no}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 border-b border-gray-50 pb-3">
                    <span className="text-gray-500 text-sm col-span-1">ปีการศึกษา:</span>
                    <span className="font-bold text-gray-900 col-span-2">{certificate.academic_year} / {certificate.semester}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500 text-sm col-span-1">รหัสอ้างอิง:</span>
                    <span className="text-gray-500 text-sm col-span-2 break-all">{certificate.id}</span>
                  </div>
                </div>
              </div>
            )}

            {id && errorMsg && (
              <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-left animate-in fade-in slide-in-from-bottom-4 flex items-start gap-4">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800">ไม่พบข้อมูล</h3>
                  <p className="text-red-600 text-sm">{errorMsg}</p>
                </div>
              </div>
            )}
          </div>
          
        </div>
      </main>
    </div>
  );
}
