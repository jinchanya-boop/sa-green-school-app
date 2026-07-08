import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  // 1. Delete old classroom criteria
  await supabase.from("evaluation_criteria").delete().eq("module", "classroom");

  // 2. Insert new 10 criteria
  const newCriteria = [
    { module: "classroom", name: "ความเป็นระเบียบเรียบร้อยของห้องเรียนโดยรวม", description: "แบ่งมุมห้องชัดเจนเช่น โต๊ะครู/โต๊ะนักเรียน/มุมทิ้งขยะ/มุมเก็บของ", max_score: 3, sort_order: 1 },
    { module: "classroom", name: "การจัดโต๊ะ/เก้าอี้/โต๊ะครู", description: "", max_score: 3, sort_order: 2 },
    { module: "classroom", name: "ความสะอาดใต้โต๊ะ/เก้าอี้", description: "", max_score: 3, sort_order: 3 },
    { module: "classroom", name: "ความสะอาดของพื้นห้องเรียน", description: "", max_score: 3, sort_order: 4 },
    { module: "classroom", name: "ความสะอาดของผนัง/ฝ้าเพดาน/การกำจัดหยากไย่", description: "", max_score: 3, sort_order: 5 },
    { module: "classroom", name: "การทิ้งขยะในห้องเรียน/ไม่มีกลิ่นเหม็นขยะ", description: "", max_score: 3, sort_order: 6 },
    { module: "classroom", name: "ความสะอาดของกระดาน", description: "", max_score: 3, sort_order: 7 },
    { module: "classroom", name: "จัดเก็บอุปกรณ์ทำความสะอาดเป็นระเบียบ", description: "", max_score: 3, sort_order: 8 },
    { module: "classroom", name: "ปิดหน้าต่างทุกบาน", description: "", max_score: 3, sort_order: 9 },
    { module: "classroom", name: "การเก็บรักษาอุปกรณ์และเครื่องใช้ไฟฟ้าในห้องเรียน", description: "(TV / สายHDMI / รีโมท TV / พัดลม / แอร์ / เครื่องฟอกอากาศ)", max_score: 3, sort_order: 10 },
  ];

  const { error } = await supabase.from("evaluation_criteria").insert(newCriteria);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Classroom criteria updated!" });
}
