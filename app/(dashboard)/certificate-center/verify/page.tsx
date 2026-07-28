import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ตรวจสอบเกียรติบัตร - Certificate Center",
};

export default function VerifyCertificatePage() {
  return (
    <div className="p-8 text-center space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">ตรวจสอบเกียรติบัตร</h1>
      <p className="text-gray-500">ฟีเจอร์นี้อยู่ระหว่างการพัฒนาตามแผน (Certificate Center)</p>
    </div>
  );
}
