import {
  users,
  draftSchools,
  draftResources,
  draftFees,
  schools,
  resources,
  fees,
  schoolCredentials,
  type User,
  type UpsertUser,
  type DraftSchool,
  type InsertDraftSchool,
  type DraftResources,
  type InsertDraftResources,
  type DraftFees,
  type InsertDraftFees,
  type School,
  type InsertSchool,
  type Resources,
  type InsertResources,
  type Fees,
  type InsertFees,
  type SchoolCredentials,
  type InsertSchoolCredentials,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Draft school operations
  createDraftSchool(draft: InsertDraftSchool): Promise<DraftSchool>;
  updateDraftSchool(schoolCode: string, draft: Partial<InsertDraftSchool>): Promise<DraftSchool>;
  getDraftSchool(schoolCode: string): Promise<DraftSchool | undefined>;
  getAllDraftSchools(): Promise<DraftSchool[]>;
  deleteDraftSchool(schoolCode: string): Promise<void>;
  
  // Draft resources operations
  createDraftResources(draft: InsertDraftResources): Promise<DraftResources>;
  updateDraftResources(schoolCode: string, draft: Partial<InsertDraftResources>): Promise<DraftResources>;
  getDraftResources(schoolCode: string): Promise<DraftResources | undefined>;
  
  // Draft fees operations
  createDraftFees(draft: InsertDraftFees): Promise<DraftFees>;
  updateDraftFees(schoolCode: string, draft: Partial<InsertDraftFees>): Promise<DraftFees>;
  getDraftFees(schoolCode: string): Promise<DraftFees | undefined>;
  
  // Final school operations
  getAllSchools(): Promise<School[]>;
  getSchool(schoolCode: string): Promise<School | undefined>;
  createSchool(school: InsertSchool): Promise<School>;
  updateSchool(schoolCode: string, school: Partial<InsertSchool>): Promise<School>;
  deleteSchool(schoolCode: string): Promise<void>;
  
  // Resources operations
  createResources(resourcesData: InsertResources): Promise<Resources>;
  getResources(schoolCode: string): Promise<Resources | undefined>;
  
  // Fees operations
  createFees(feesData: InsertFees): Promise<Fees>;
  getFees(schoolCode: string): Promise<Fees | undefined>;
  
  // School credentials operations
  createSchoolCredentials(credentials: InsertSchoolCredentials): Promise<SchoolCredentials>;
  getSchoolCredentials(schoolCode: string): Promise<SchoolCredentials | undefined>;
  
  // Complete registration (move from draft to final)
  completeRegistration(schoolCode: string): Promise<School>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Draft school operations
  async createDraftSchool(draft: InsertDraftSchool): Promise<DraftSchool> {
    const [draftSchool] = await db
      .insert(draftSchools)
      .values(draft)
      .returning();
    return draftSchool;
  }

  async updateDraftSchool(schoolCode: string, draft: Partial<InsertDraftSchool>): Promise<DraftSchool> {
    const [draftSchool] = await db
      .update(draftSchools)
      .set({ ...draft, updatedAt: new Date() })
      .where(eq(draftSchools.schoolCode, schoolCode))
      .returning();
    return draftSchool;
  }

  async getDraftSchool(schoolCode: string): Promise<DraftSchool | undefined> {
    const [draftSchool] = await db
      .select()
      .from(draftSchools)
      .where(eq(draftSchools.schoolCode, schoolCode));
    return draftSchool;
  }

  async getAllDraftSchools(): Promise<DraftSchool[]> {
    return await db
      .select()
      .from(draftSchools)
      .orderBy(desc(draftSchools.createdAt));
  }

  async deleteDraftSchool(schoolCode: string): Promise<void> {
    await db.delete(draftSchools).where(eq(draftSchools.schoolCode, schoolCode));
  }

  // Draft resources operations
  async createDraftResources(draft: InsertDraftResources): Promise<DraftResources> {
    const [draftResource] = await db
      .insert(draftResources)
      .values(draft)
      .onConflictDoUpdate({
        target: draftResources.schoolCode,
        set: { ...draft, updatedAt: new Date() },
      })
      .returning();
    return draftResource;
  }

  async updateDraftResources(schoolCode: string, draft: Partial<InsertDraftResources>): Promise<DraftResources> {
    const [draftResource] = await db
      .update(draftResources)
      .set({ ...draft, updatedAt: new Date() })
      .where(eq(draftResources.schoolCode, schoolCode))
      .returning();
    return draftResource;
  }

  async getDraftResources(schoolCode: string): Promise<DraftResources | undefined> {
    const [draftResource] = await db
      .select()
      .from(draftResources)
      .where(eq(draftResources.schoolCode, schoolCode));
    return draftResource;
  }

  // Draft fees operations
  async createDraftFees(draft: InsertDraftFees): Promise<DraftFees> {
    const [draftFee] = await db
      .insert(draftFees)
      .values(draft)
      .onConflictDoUpdate({
        target: draftFees.schoolCode,
        set: { ...draft, updatedAt: new Date() },
      })
      .returning();
    return draftFee;
  }

  async updateDraftFees(schoolCode: string, draft: Partial<InsertDraftFees>): Promise<DraftFees> {
    const [draftFee] = await db
      .update(draftFees)
      .set({ ...draft, updatedAt: new Date() })
      .where(eq(draftFees.schoolCode, schoolCode))
      .returning();
    return draftFee;
  }

  async getDraftFees(schoolCode: string): Promise<DraftFees | undefined> {
    const [draftFee] = await db
      .select()
      .from(draftFees)
      .where(eq(draftFees.schoolCode, schoolCode));
    return draftFee;
  }

  // Final school operations
  async getAllSchools(): Promise<School[]> {
    return await db
      .select()
      .from(schools)
      .orderBy(desc(schools.createdAt));
  }

  async getSchool(schoolCode: string): Promise<School | undefined> {
    const [school] = await db
      .select()
      .from(schools)
      .where(eq(schools.schoolCode, schoolCode));
    return school;
  }

  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db
      .insert(schools)
      .values(school)
      .returning();
    return newSchool;
  }

  async updateSchool(schoolCode: string, school: Partial<InsertSchool>): Promise<School> {
    const [updatedSchool] = await db
      .update(schools)
      .set({ ...school, updatedAt: new Date() })
      .where(eq(schools.schoolCode, schoolCode))
      .returning();
    return updatedSchool;
  }

  async deleteSchool(schoolCode: string): Promise<void> {
    await db.delete(schools).where(eq(schools.schoolCode, schoolCode));
  }

  // Resources operations
  async createResources(resourcesData: InsertResources): Promise<Resources> {
    const [newResources] = await db
      .insert(resources)
      .values(resourcesData)
      .returning();
    return newResources;
  }

  async getResources(schoolCode: string): Promise<Resources | undefined> {
    const [resourcesData] = await db
      .select()
      .from(resources)
      .where(eq(resources.schoolCode, schoolCode));
    return resourcesData;
  }

  // Fees operations
  async createFees(feesData: InsertFees): Promise<Fees> {
    const [newFees] = await db
      .insert(fees)
      .values(feesData)
      .returning();
    return newFees;
  }

  async getFees(schoolCode: string): Promise<Fees | undefined> {
    const [feesData] = await db
      .select()
      .from(fees)
      .where(eq(fees.schoolCode, schoolCode));
    return feesData;
  }

  // School credentials operations
  async createSchoolCredentials(credentials: InsertSchoolCredentials): Promise<SchoolCredentials> {
    const [newCredentials] = await db
      .insert(schoolCredentials)
      .values(credentials)
      .returning();
    return newCredentials;
  }

  async getSchoolCredentials(schoolCode: string): Promise<SchoolCredentials | undefined> {
    const [credentials] = await db
      .select()
      .from(schoolCredentials)
      .where(eq(schoolCredentials.schoolCode, schoolCode));
    return credentials;
  }

  // Complete registration (move from draft to final)
  async completeRegistration(schoolCode: string): Promise<School> {
    // Get all draft data
    const draftSchool = await this.getDraftSchool(schoolCode);
    const draftResourcesData = await this.getDraftResources(schoolCode);
    const draftFeesData = await this.getDraftFees(schoolCode);

    if (!draftSchool || !draftFeesData?.disclaimerAccepted) {
      throw new Error("Cannot complete registration: missing required draft data or disclaimer not accepted");
    }

    // Create final school record
    const finalSchool = await this.createSchool({
      schoolCode: draftSchool.schoolCode,
      schoolName: draftSchool.schoolName,
      schoolAddress: draftSchool.schoolAddress,
      contactNumbers: draftSchool.contactNumbers,
      schoolType: draftSchool.schoolType,
      academicYearStart: draftSchool.academicYearStart,
      academicYearEnd: draftSchool.academicYearEnd,
      gradeLevelFrom: draftSchool.gradeLevelFrom,
      gradeLevelTill: draftSchool.gradeLevelTill,
      languages: draftSchool.languages,
      otherLanguage: draftSchool.otherLanguage,
      principalName: draftSchool.principalName,
      principalEmail: draftSchool.principalEmail,
      principalCell: draftSchool.principalCell,
      primaryCoordinatorName: draftSchool.primaryCoordinatorName,
      primaryCoordinatorEmail: draftSchool.primaryCoordinatorEmail,
      primaryCoordinatorCell: draftSchool.primaryCoordinatorCell,
      middleCoordinatorName: draftSchool.middleCoordinatorName,
      middleCoordinatorEmail: draftSchool.middleCoordinatorEmail,
      middleCoordinatorCell: draftSchool.middleCoordinatorCell,
      gradeIV: draftSchool.gradeIV,
      gradeV: draftSchool.gradeV,
      gradeVI: draftSchool.gradeVI,
      gradeVII: draftSchool.gradeVII,
      gradeVIII: draftSchool.gradeVIII,
      pspMspRegistration: draftSchool.pspMspRegistration,
      isActive: true,
    });

    // Create final resources record if draft exists
    if (draftResourcesData) {
      await this.createResources({
        schoolCode: draftResourcesData.schoolCode,
        primaryTeachers: draftResourcesData.primaryTeachers,
        middleTeachers: draftResourcesData.middleTeachers,
        undergraduateTeachers: draftResourcesData.undergraduateTeachers,
        graduateTeachers: draftResourcesData.graduateTeachers,
        postgraduateTeachers: draftResourcesData.postgraduateTeachers,
        educationDegreeTeachers: draftResourcesData.educationDegreeTeachers,
        totalWeeks: draftResourcesData.totalWeeks,
        weeklyPeriods: draftResourcesData.weeklyPeriods,
        periodDuration: draftResourcesData.periodDuration,
        maxStudents: draftResourcesData.maxStudents,
        facilities: draftResourcesData.facilities,
        otherFacility1: draftResourcesData.otherFacility1,
        otherFacility2: draftResourcesData.otherFacility2,
        otherFacility3: draftResourcesData.otherFacility3,
      });
    }

    // Create final fees record
    await this.createFees({
      schoolCode: draftFeesData.schoolCode,
      paymentMethod: draftFeesData.paymentMethod,
      chequeNumber: draftFeesData.chequeNumber,
      chequeDate: draftFeesData.chequeDate,
      amount: draftFeesData.amount,
      headOfInstitution: draftFeesData.headOfInstitution,
      disclaimerAccepted: draftFeesData.disclaimerAccepted,
      headSignature: draftFeesData.headSignature,
      institutionStamp: draftFeesData.institutionStamp,
    });

    // Create school credentials (username: schoolCode, password: auto-generated)
    const generatedPassword = `${schoolCode}_${Date.now()}`;
    await this.createSchoolCredentials({
      schoolCode,
      username: schoolCode,
      password: generatedPassword, // In production, this should be hashed
      isActive: true,
    });

    // Clean up draft data
    await this.deleteDraftSchool(schoolCode);

    return finalSchool;
  }
}

export const storage = new DatabaseStorage();
