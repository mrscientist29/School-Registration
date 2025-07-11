import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal
} from "drizzle-orm/pg-core";

import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("admin"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Draft school registrations
export const draftSchools = pgTable("draft_schools", {
  id: serial("id").primaryKey(),
  schoolCode: varchar("school_code").unique().notNull(),
  schoolName: varchar("school_name").notNull(),
  schoolAddress: text("school_address"),
  contactNumbers: varchar("contact_numbers"),
  schoolType: varchar("school_type"), // boys, girls, coeducational
  academicYearStart: varchar("academic_year_start"),
  academicYearEnd: varchar("academic_year_end"),
  gradeLevelFrom: varchar("grade_level_from"),
  gradeLevelTill: varchar("grade_level_till"),
  languages: jsonb("languages").$type<unknown[]>(), // array of selected languages
  otherLanguage: varchar("other_language"),
  principalName: varchar("principal_name"),
  principalEmail: varchar("principal_email"),
  principalCell: varchar("principal_cell"),
  primaryCoordinatorName: varchar("primary_coordinator_name"),
  primaryCoordinatorEmail: varchar("primary_coordinator_email"),
  primaryCoordinatorCell: varchar("primary_coordinator_cell"),
  middleCoordinatorName: varchar("middle_coordinator_name"),
  middleCoordinatorEmail: varchar("middle_coordinator_email"),
  middleCoordinatorCell: varchar("middle_coordinator_cell"),
  gradeIV: integer("grade_iv").default(0),
  gradeV: integer("grade_v").default(0),
  gradeVI: integer("grade_vi").default(0),
  gradeVII: integer("grade_vii").default(0),
  gradeVIII: integer("grade_viii").default(0),
  pspMspRegistration: jsonb("psp_msp_registration").$type<unknown[]>(), // array of selected grades
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Draft resources and support
export const draftResources = pgTable("draft_resources", {
  id: serial("id").primaryKey(),
  schoolCode: varchar("school_code").references(() => draftSchools.schoolCode).unique().notNull(),
  primaryTeachers: integer("primary_teachers"),
  middleTeachers: integer("middle_teachers"),
  undergraduateTeachers: integer("undergraduate_teachers").default(0),
  graduateTeachers: integer("graduate_teachers").default(0),
  postgraduateTeachers: integer("postgraduate_teachers").default(0),
  educationDegreeTeachers: integer("education_degree_teachers").default(0),
  totalWeeks: integer("total_weeks"),
  weeklyPeriods: integer("weekly_periods"),
  periodDuration: integer("period_duration"),
  maxStudents: integer("max_students"),
  facilities: jsonb("facilities").$type<unknown[]>(), // array of selected facilities
  otherFacility1: varchar("other_facility_1"),
  otherFacility2: varchar("other_facility_2"),
  otherFacility3: varchar("other_facility_3"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Draft fees information
export const draftFees = pgTable("draft_fees", {
  id: serial("id").primaryKey(),
  schoolCode: varchar("school_code").unique().references(() => draftSchools.schoolCode).notNull(),
  paymentMethod: varchar("payment_method"), // cheque, deposit
  chequeNumber: varchar("cheque_number"),
  chequeDate: timestamp("cheque_date"),
  depositSlipNumber: varchar("deposit_slip_number"),
  depositDate: timestamp("deposit_date"),
  depositPayOrderNumber: varchar("deposit_pay_order_number"),
  amount: decimal("amount", { precision: 10, scale: 2 }).default("20000.00"),
  headOfInstitution: varchar("head_of_institution"),
  disclaimerAccepted: boolean("disclaimer_accepted").notNull().default(false),
  headSignature: varchar("head_signature"),
  institutionStamp: varchar("institution_stamp"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Final registered schools
export const schools = pgTable("schools", {
  id: serial("id").primaryKey(),
  schoolCode: varchar("school_code").unique().notNull(),
  schoolName: varchar("school_name").notNull(),
  schoolAddress: text("school_address"),
  contactNumbers: varchar("contact_numbers"),
  schoolType: varchar("school_type"),
  academicYearStart: varchar("academic_year_start"),
  academicYearEnd: varchar("academic_year_end"),
  gradeLevelFrom: varchar("grade_level_from"),
  gradeLevelTill: varchar("grade_level_till"),
  languages: jsonb("languages").$type<unknown[]>(),
  otherLanguage: varchar("other_language"),
  principalName: varchar("principal_name"),
  principalEmail: varchar("principal_email"),
  principalCell: varchar("principal_cell"),
  primaryCoordinatorName: varchar("primary_coordinator_name"),
  primaryCoordinatorEmail: varchar("primary_coordinator_email"),
  primaryCoordinatorCell: varchar("primary_coordinator_cell"),
  middleCoordinatorName: varchar("middle_coordinator_name"),
  middleCoordinatorEmail: varchar("middle_coordinator_email"),
  middleCoordinatorCell: varchar("middle_coordinator_cell"),
  gradeIV: integer("grade_iv").default(0),
  gradeV: integer("grade_v").default(0),
  gradeVI: integer("grade_vi").default(0),
  gradeVII: integer("grade_vii").default(0),
  gradeVIII: integer("grade_viii").default(0),
  pspMspRegistration: jsonb("psp_msp_registration").$type<unknown[]>(),
  isActive: boolean("is_active").default(true),
  registrationCompletedAt: timestamp("registration_completed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Final resources and support
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  schoolCode: varchar("school_code").references(() => schools.schoolCode).notNull(),
  primaryTeachers: integer("primary_teachers"),
  middleTeachers: integer("middle_teachers"),
  undergraduateTeachers: integer("undergraduate_teachers").default(0),
  graduateTeachers: integer("graduate_teachers").default(0),
  postgraduateTeachers: integer("postgraduate_teachers").default(0),
  educationDegreeTeachers: integer("education_degree_teachers").default(0),
  totalWeeks: integer("total_weeks"),
  weeklyPeriods: integer("weekly_periods"),
  periodDuration: integer("period_duration"),
  maxStudents: integer("max_students"),
  facilities: jsonb("facilities").$type<unknown[]>(),
  otherFacility1: varchar("other_facility_1"),
  otherFacility2: varchar("other_facility_2"),
  otherFacility3: varchar("other_facility_3"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Final fees information
export const fees = pgTable("fees", {
  id: serial("id").primaryKey(),
  schoolCode: varchar("school_code").references(() => schools.schoolCode).notNull(),
  paymentMethod: varchar("payment_method"),
  chequeNumber: varchar("cheque_number"),
  chequeDate: timestamp("cheque_date"),
  depositSlipNumber: varchar("deposit_slip_number"),
  depositDate: timestamp("deposit_date"),
  depositPayOrderNumber: varchar("deposit_pay_order_number"),
  amount: decimal("amount", { precision: 10, scale: 2 }).default("20000.00"),
  headOfInstitution: varchar("head_of_institution"),
  disclaimerAccepted: boolean("disclaimer_accepted").notNull().default(false),
  headSignature: varchar("head_signature"),
  institutionStamp: varchar("institution_stamp"),
  paymentScreenshot: varchar("payment_screenshot"), // Store file path/URL for payment screenshot
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: varchar("student_id").unique().notNull(), // Format: 0026-04-01 (schoolCode-grade-studentNo)
  schoolCode: varchar("school_code").notNull().references(() => schools.schoolCode),
  studentName: varchar("student_name").notNull(),
  fatherName: varchar("father_name").notNull(),
  gender: varchar("gender").notNull(), // 'M' | 'F'
  dateOfBirth: timestamp("date_of_birth").notNull(),
  grade: varchar("grade").notNull(), // 'IV', 'V', 'VI', 'VII', 'VIII'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Student fees information
export const studentFees = pgTable("student_fees", {
  id: serial("id").primaryKey(),
  schoolCode: varchar("school_code").references(() => schools.schoolCode).notNull(),
  paymentMethod: varchar("payment_method"), // cheque, deposit
  chequeNumber: varchar("cheque_number"),
  chequeDate: timestamp("cheque_date"),
  depositSlipNumber: varchar("deposit_slip_number"),
  depositDate: timestamp("deposit_date"),
  depositPayOrderNumber: varchar("deposit_pay_order_number"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
  primaryAmount: decimal("primary_amount", { precision: 10, scale: 2 }).default("0.00"),
  middleAmount: decimal("middle_amount", { precision: 10, scale: 2 }).default("0.00"),
  primaryCandidates: integer("primary_candidates").default(0),
  middleCandidates: integer("middle_candidates").default(0),
  headOfInstitution: varchar("head_of_institution"),
  disclaimerAccepted: boolean("disclaimer_accepted").notNull().default(false),
  headSignature: varchar("head_signature"),
  institutionStamp: varchar("institution_stamp"),
  paymentScreenshot: varchar("payment_screenshot"), // Store file path/URL for payment screenshot
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: varchar("action").notNull(), // ActionType enum value
  userId: varchar("user_id"),
  username: varchar("username"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  resource: varchar("resource"), // e.g., 'Student', 'School', 'Fees'
  resourceId: varchar("resource_id"), // ID of the affected resource
  oldData: jsonb("old_data"), // Previous state of the resource
  newData: jsonb("new_data"), // New state of the resource
  details: text("details"), // Description of the action
  success: boolean("success").notNull().default(true),
  errorMessage: text("error_message"), // Error message if action failed
  sessionId: varchar("session_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schema for validation
export const insertStudentSchema = createInsertSchema(students).extend({
  gender: z.enum(["M", "F"]),
  dateOfBirth: z.coerce.date(),
  grade: z.enum(["IV", "V", "VI", "VII", "VIII"]),
});

// Schema for importing students (excludes studentId since it's generated server-side)
export const importStudentSchema = insertStudentSchema.omit({
  id: true,
  studentId: true,
  createdAt: true,
  updatedAt: true,
}).transform((data) => {
  // Remove any extra fields that might come from CSV import (like 'level')
  const { level, ...validData } = data as any;
  return validData;
});

// Schema for placeholder students (only requires schoolCode, grade, and level)
export const placeholderStudentSchema = z.object({
  schoolCode: z.string(),
  grade: z.enum(["IV", "V", "VI", "VII", "VIII"]),
  level: z.string().optional(), // 'primary' | 'middle'
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type ImportStudent = z.infer<typeof importStudentSchema>;
export type PlaceholderStudent = z.infer<typeof placeholderStudentSchema>;
export type Student = z.infer<typeof insertStudentSchema>;

// School credentials for login
export const schoolCredentials = pgTable("school_credentials", {
  id: serial("id").primaryKey(),
  schoolCode: varchar("school_code").references(() => schools.schoolCode).notNull(),
  username: varchar("username").unique().notNull(),
  password: varchar("password").notNull(), // hashed
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Zod schemas for validation
export const insertDraftSchoolSchema = createInsertSchema(draftSchools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDraftFeesSchema = createInsertSchema(draftFees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  chequeDate: z.union([z.string(), z.date()]).nullable().optional().transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  depositDate: z.union([z.string(), z.date()]).nullable().optional().transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  amount: z.string().optional(),
  disclaimerAccepted: z.boolean().nullable().optional().transform((val) => val ?? false),
});

export const insertDraftResourcesSchema = createInsertSchema(draftResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  chequeDate: z.date().nullable().optional(),
  depositDate: z.date().nullable().optional(),
  amount: z.string().optional(),
  disclaimerAccepted: z.boolean().nullable().optional().transform((val) => val ?? false),
});

export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  registrationCompletedAt: true,
});

export const insertResourcesSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeesSchema = createInsertSchema(fees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  chequeDate: z.union([z.string(), z.date()]).nullable().optional().transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  depositDate: z.union([z.string(), z.date()]).nullable().optional().transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  amount: z.string().optional(),
  disclaimerAccepted: z.boolean().nullable().optional().transform((val) => val ?? false),
});

export const insertSchoolCredentialsSchema = createInsertSchema(schoolCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for updating only grade counts in school registration
export const updateSchoolGradesSchema = z.object({
  gradeIV: z.number().int().min(0).optional(),
  gradeV: z.number().int().min(0).optional(),
  gradeVI: z.number().int().min(0).optional(),
  gradeVII: z.number().int().min(0).optional(),
  gradeVIII: z.number().int().min(0).optional(),
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertDraftSchool = z.infer<typeof insertDraftSchoolSchema>;
export type DraftSchool = typeof draftSchools.$inferSelect;

export type InsertDraftResources = z.infer<typeof insertDraftResourcesSchema>;
export type DraftResources = typeof draftResources.$inferSelect;

export type InsertDraftFees = z.infer<typeof insertDraftFeesSchema>;
export type DraftFees = typeof draftFees.$inferSelect;

export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type School = typeof schools.$inferSelect;

export type InsertResources = z.infer<typeof insertResourcesSchema>;
export type Resources = typeof resources.$inferSelect;

export type InsertFees = z.infer<typeof insertFeesSchema>;
export type Fees = typeof fees.$inferSelect;

export type InsertSchoolCredentials = z.infer<typeof insertSchoolCredentialsSchema>;
export type SchoolCredentials = typeof schoolCredentials.$inferSelect;

export const insertStudentFeesSchema = createInsertSchema(studentFees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  chequeDate: z.union([z.string(), z.date()]).nullable().optional().transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  depositDate: z.union([z.string(), z.date()]).nullable().optional().transform((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
  totalAmount: z.string().optional(),
  primaryAmount: z.string().optional(),
  middleAmount: z.string().optional(),
  disclaimerAccepted: z.boolean().nullable().optional().transform((val) => val ?? false),
});

export type InsertStudentFees = z.infer<typeof insertStudentFeesSchema>;
export type StudentFees = typeof studentFees.$inferSelect;

// Audit logs schema
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export interface SchoolFees {
  id: number;
  schoolCode: string;
  paymentMethod: string | null;
  chequeNumber: string | null;
  chequeDate: Date | null;
  depositSlipNumber: string | null;
  depositDate: Date | null;
  depositPayOrderNumber: string | null;
  amount: string | null;
  headOfInstitution: string | null;
  disclaimerAccepted: boolean;
  headSignature: string | null;
  institutionStamp: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface StudentFeesInterface {
  id: number;
  schoolCode: string;
  paymentMethod: string | null;
  chequeNumber: string | null;
  chequeDate: Date | null;
  depositSlipNumber: string | null;
  depositDate: Date | null;
  depositPayOrderNumber: string | null;
  totalAmount: string | null;
  primaryAmount: string | null;
  middleAmount: string | null;
  primaryCandidates: number;
  middleCandidates: number;
  headOfInstitution: string | null;
  disclaimerAccepted: boolean;
  headSignature: string | null;
  institutionStamp: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}
