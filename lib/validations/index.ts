import { z } from "zod";

// ── Auth Schemas ────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().min(1, "กรุณากรอกชื่อผู้ใช้งานหรืออีเมล"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const registerSchema = z
  .object({
    full_name: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล"),
    email: z.string().email("กรุณากรอกอีเมลให้ถูกต้อง"),
    password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirm_password"],
  });

// ── Area Evaluation Schemas ────────────────────────────────────

export const areaEvaluationSchema = z.object({
  responsible_area_id: z.string().uuid("กรุณาเลือกพื้นที่รับผิดชอบ"),
  semester_id: z.string().uuid("กรุณาเลือกภาคเรียน"),
  evaluator_notes: z.string().optional(),
  items: z
    .array(
      z.object({
        criteria_id: z.string().uuid(),
        score: z.number().min(0).max(10),
        notes: z.string().optional(),
      })
    )
    .min(1, "กรุณาประเมินอย่างน้อย 1 หัวข้อ"),
});

export const approveEvaluationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  approver_notes: z.string().optional(),
});

// ── Classroom Evaluation Schemas ───────────────────────────────

export const classroomEvaluationSchema = z.object({
  room_id: z.string().uuid("กรุณาเลือกห้องเรียน"),
  semester_id: z.string().uuid("กรุณาเลือกภาคเรียน"),
  evaluator_notes: z.string().optional(),
  items: z
    .array(
      z.object({
        criteria_id: z.string().uuid(),
        score: z.number().min(0).max(10),
        notes: z.string().optional(),
      })
    )
    .min(1, "กรุณาประเมินอย่างน้อย 1 หัวข้อ"),
});

// ── Water Bottle Schemas ───────────────────────────────────────

export const waterBottleRecordSchema = z.object({
  homeroom_id: z.string().uuid("กรุณาเลือกห้องเรียน"),
  semester_id: z.string().uuid("กรุณาเลือกภาคเรียน"),
  check_date: z.string().min(1, "กรุณาเลือกวันที่"),
  total_students: z.number().min(1, "จำนวนนักเรียนต้องมากกว่า 0"),
  students_with_bottle: z.number().min(0),
  teacher_notes: z.string().optional(),
  student_statuses: z
    .array(
      z.object({
        student_id: z.string().uuid(),
        has_bottle: z.boolean(),
      })
    )
    .optional(),
});

// ── Settings Schemas ───────────────────────────────────────────

export const profileSchema = z.object({
  full_name: z.string().min(2, "กรุณากรอกชื่อ-นามสกุล"),
  phone: z
    .string()
    .regex(/^0[0-9]{8,9}$/, "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง")
    .optional()
    .or(z.literal("")),
});

export const buildingSchema = z.object({
  name: z.string().min(1, "กรุณากรอกชื่ออาคาร"),
  code: z
    .string()
    .min(1, "กรุณากรอกรหัสอาคาร")
    .max(10, "รหัสอาคารต้องไม่เกิน 10 ตัวอักษร"),
  description: z.string().optional(),
});

export const academicYearSchema = z.object({
  year: z.number().min(2560).max(2580),
  year_ce: z.number().min(2017).max(2037),
});

export const semesterSchema = z.object({
  academic_year_id: z.string().uuid(),
  semester: z.enum(["1", "2"]),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
});

export const criteriaSchema = z.object({
  module: z.enum(["area", "classroom"]),
  name: z.string().min(1, "กรุณากรอกชื่อเกณฑ์"),
  description: z.string().optional(),
  max_score: z.number().min(1).max(100),
  order: z.number().min(1),
});

export const userRoleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum([
    "administrator",
    "director",
    "deputy_director",
    "building_supervisor",
    "grade_supervisor",
    "homeroom_teacher",
    "student_council",
    "class_representative",
    "student",
    "guest",
  ]),
  homeroom_id: z.string().uuid().optional(),
  building_id: z.string().uuid().optional(),
  grade_level: z.number().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type AreaEvaluationInput = z.infer<typeof areaEvaluationSchema>;
export type ApproveEvaluationInput = z.infer<typeof approveEvaluationSchema>;
export type ClassroomEvaluationInput = z.infer<typeof classroomEvaluationSchema>;
export type WaterBottleRecordInput = z.infer<typeof waterBottleRecordSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type BuildingInput = z.infer<typeof buildingSchema>;
export type CriteriaInput = z.infer<typeof criteriaSchema>;
export type UserRoleInput = z.infer<typeof userRoleSchema>;
