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
  languages: jsonb("languages"), // array of selected languages
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
  pspMspRegistration: jsonb("psp_msp_registration"), // array of selected grades
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
  facilities: jsonb("facilities"), // array of selected facilities
  otherFacility1: varchar("other_facility_1"),
  otherFacility2: varchar("other_facility_2"),
  otherFacility3: varchar("other_facility_3"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Draft fees information
export const draftFees = pgTable("draft_fees", {
  id: serial("id").primaryKey(),
  schoolCode: varchar("school_code").references(() => draftSchools.schoolCode).unique().notNull(),
  paymentMethod: varchar("payment_method"), // cheque, deposit
  chequeNumber: varchar("cheque_number"),
  chequeDate: timestamp("cheque_date"),
  amount: decimal("amount", { precision: 10, scale: 2 }).default("20000.00"),
  headOfInstitution: varchar("head_of_institution"),
  disclaimerAccepted: boolean("disclaimer_accepted").default(false),
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
  languages: jsonb("languages"),
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
  pspMspRegistration: jsonb("psp_msp_registration"),
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
  facilities: jsonb("facilities"),
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
  amount: decimal("amount", { precision: 10, scale: 2 }).default("20000.00"),
  headOfInstitution: varchar("head_of_institution"),
  disclaimerAccepted: boolean("disclaimer_accepted").default(false),
  headSignature: varchar("head_signature"),
  institutionStamp: varchar("institution_stamp"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

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

export const insertDraftResourcesSchema = createInsertSchema(draftResources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDraftFeesSchema = createInsertSchema(draftFees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
});

export const insertSchoolCredentialsSchema = createInsertSchema(schoolCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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
