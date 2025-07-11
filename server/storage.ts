import {
  users,
  draftSchools,
  draftResources,
  draftFees,
  schools,
  resources,
  fees,
  schoolCredentials,
  students,
  studentFees,
  auditLogs,
} from "@shared/schema";
import type {
  User,
  UpsertUser,
  DraftSchool,
  InsertDraftSchool,
  DraftResources,
  InsertDraftResources,
  DraftFees,
  InsertDraftFees,
  School,
  InsertSchool,
  Resources,
  InsertResources,
  Fees,
  InsertFees,
  SchoolCredentials,
  InsertSchoolCredentials,
  Student,
  InsertStudent,
  ImportStudent,
  SchoolFees,
  StudentFees,
  InsertStudentFees,
  StudentFeesInterface,
  InsertAuditLog,
  AuditLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getAllStudents(): Promise<Student[]>;
  // Student operations
  createStudent(schoolCode: string, student: ImportStudent): Promise<Student>;
  getStudentsBySchool(schoolCode: string): Promise<Student[]>;
  getStudentById(studentId: string): Promise<Student | undefined>;
  updateStudent(studentId: string, student: Partial<ImportStudent>): Promise<Student>;
  importStudents(schoolCode: string, students: ImportStudent[]): Promise<number>; // returns count

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
  
  // School fees operations
  getSchoolFees(schoolCode: string): Promise<SchoolFees | null>;
  updateSchoolFees(schoolCode: string, data: Partial<SchoolFees>): Promise<SchoolFees>;
  
  // Complete registration (move from draft to final)
  completeRegistration(schoolCode: string): Promise<School>;
  
  // School resources operations
  getSchoolResources(schoolCode: string): Promise<Resources | null>;
  updateSchoolResources(schoolCode: string, data: Partial<Resources>): Promise<Resources>;
  
  // Student fees operations
  getStudentFees(schoolCode: string): Promise<StudentFeesInterface | null>;
  createStudentFees(schoolCode: string, data: InsertStudentFees): Promise<StudentFeesInterface>;
  updateStudentFees(schoolCode: string, data: Partial<InsertStudentFees>): Promise<StudentFeesInterface>;
  
  // Audit logs operations
  createAuditLog(auditData: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: {
    action?: string;
    userId?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Helper function to generate student ID
  private generateStudentId(schoolCode: string, grade: string, studentNo: number): string {
    const gradeMap: Record<string, string> = {
      'IV': '04',
      'V': '05', 
      'VI': '06',
      'VII': '07',
      'VIII': '08'
    };
    const gradeCode = gradeMap[grade] || '00';
    const studentNumber = studentNo.toString().padStart(2, '0');
    return `${schoolCode}-${gradeCode}-${studentNumber}`;
  }

  // Helper function to get next student number for a grade in a school
  private async getNextStudentNumber(schoolCode: string, grade: string): Promise<number> {
    const existingStudents = await db
      .select({ studentId: students.studentId })
      .from(students)
      .where(eq(students.schoolCode, schoolCode))
      .orderBy(desc(students.studentId));
    
    const gradeMap: Record<string, string> = {
      'IV': '04',
      'V': '05', 
      'VI': '06',
      'VII': '07',
      'VIII': '08'
    };
    const gradeCode = gradeMap[grade] || '00';
    const prefix = `${schoolCode}-${gradeCode}-`;
    
    let maxNumber = 0;
    for (const student of existingStudents) {
      if (student.studentId && student.studentId.startsWith(prefix)) {
        const numberPart = student.studentId.split('-')[2];
        if (numberPart) {
          const num = parseInt(numberPart, 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }
    }
    
    return maxNumber + 1;
  }

  async getAllStudents(): Promise<any[]> {
    // Join students with schools to get schoolName
    return await db
      .select({
        id: students.id,
        studentId: students.studentId,
        schoolCode: students.schoolCode,
        schoolName: schools.schoolName,
        studentName: students.studentName,
        fatherName: students.fatherName,
        gender: students.gender,
        grade: students.grade,
        dateOfBirth: students.dateOfBirth,
        createdAt: students.createdAt,
        updatedAt: students.updatedAt,
      })
      .from(students)
      .leftJoin(schools, eq(students.schoolCode, schools.schoolCode))
      .orderBy(desc(students.createdAt));
  }
  // --- Student operations ---
  async createStudent(schoolCode: string, student: ImportStudent): Promise<Student> {
    const studentNo = await this.getNextStudentNumber(schoolCode, student.grade);
    const studentId = this.generateStudentId(schoolCode, student.grade, studentNo);
    const [created] = await db.insert(students).values({ 
      ...student, 
      schoolCode, 
      studentId 
    }).returning();
    return created;
  }
  async getStudentsBySchool(schoolCode: string): Promise<Student[]> {
    return await db.select().from(students).where(eq(students.schoolCode, schoolCode));
  }
  async importStudents(schoolCode: string, studentsArr: ImportStudent[]): Promise<number> {
    if (!studentsArr.length) return 0;

    // Get all existing students for this school ONCE for efficiency
    const existingStudents = await db
      .select({ 
        id: students.id,
        studentName: students.studentName,
        fatherName: students.fatherName,
        dateOfBirth: students.dateOfBirth,
        grade: students.grade
      })
      .from(students)
      .where(eq(students.schoolCode, schoolCode));
    
    // Create a more efficient lookup for duplicates
    const existingStudentKeys = new Set(
      existingStudents.map(student => {
        const dateStr = new Date(student.dateOfBirth).toDateString();
        return `${student.studentName.toLowerCase().trim()}|${student.fatherName.toLowerCase().trim()}|${dateStr}`;
      })
    );

    // Group students by grade for efficient ID generation
    const studentsByGrade: Record<string, ImportStudent[]> = {};
    const duplicateStudents: ImportStudent[] = [];
    const validStudents: ImportStudent[] = [];
    
    // First pass: separate duplicates from valid students
    for (const student of studentsArr) {
      const studentDateStr = new Date(student.dateOfBirth).toDateString();
      const studentKey = `${student.studentName.toLowerCase().trim()}|${student.fatherName.toLowerCase().trim()}|${studentDateStr}`;
      
      if (existingStudentKeys.has(studentKey)) {
        duplicateStudents.push(student);
        console.log(`Duplicate found: ${student.studentName} (${student.fatherName}) - skipping`);
      } else {
        validStudents.push(student);
        if (!studentsByGrade[student.grade]) {
          studentsByGrade[student.grade] = [];
        }
        studentsByGrade[student.grade].push(student);
      }
    }
    
    console.log(`Processing ${validStudents.length} new students, found ${duplicateStudents.length} duplicates`);

    const studentsToInsert: (ImportStudent & { studentId: string; schoolCode: string })[] = [];
    
    // Generate student IDs for each grade
    for (const [grade, gradeStudents] of Object.entries(studentsByGrade)) {
      let currentStudentNo = await this.getNextStudentNumber(schoolCode, grade);
      
      for (const student of gradeStudents) {
        const studentId = this.generateStudentId(schoolCode, grade, currentStudentNo);
        
        studentsToInsert.push({
          ...student,
          studentId,
          schoolCode
        });
        currentStudentNo++;
      }
    }

    if (studentsToInsert.length > 0) {
      try {
        await db.insert(students).values(studentsToInsert as any).returning();
        console.log(`Successfully inserted ${studentsToInsert.length} students`);
      } catch (error) {
        console.error('Error inserting students:', error);
        throw error;
      }
    }
    
    return studentsToInsert.length;
  }
// Get student by ID
async getStudentById(studentId: string): Promise<Student | undefined> {
  const [student] = await db.select().from(students).where(eq(students.studentId, studentId));
  return student;
}

// Update student
async updateStudent(studentId: string, student: Partial<ImportStudent>): Promise<Student> {
  const [updatedStudent] = await db
    .update(students)
    .set({ ...student, updatedAt: new Date() })
    .where(eq(students.studentId, studentId))
    .returning();
  return updatedStudent;
}

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
    try {
      // First try to get existing draft
      const existing = await this.getDraftSchool(draft.schoolCode);
      
      if (existing) {
        // Update existing record
        return await this.updateDraftSchool(draft.schoolCode, draft);
      } else {
        // Create new record
        const [draftSchool] = await db
          .insert(draftSchools)
          .values(draft)
          .returning();
        return draftSchool;
      }
    } catch (error) {
      console.error('Error creating draft school:', error);
      throw error;
    }
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
    try {
      // First try to get existing draft
      const existing = await this.getDraftResources(draft.schoolCode);
      
      if (existing) {
        // Update existing record
        return await this.updateDraftResources(draft.schoolCode, draft);
      } else {
        // Create new record
        const [draftResource] = await db
          .insert(draftResources)
          .values(draft)
          .returning();
        return draftResource;
      }
    } catch (error) {
      console.error('Error creating draft resources:', error);
      throw error;
    }
  }

  async updateDraftResources(schoolCode: string, draft: Partial<InsertDraftResources>): Promise<DraftResources> {
    console.log(`Attempting to update draft resources for schoolCode: ${schoolCode} with data:`, draft);
    try {
      const [draftResource] = await db
        .update(draftResources)
        .set({ ...draft, updatedAt: new Date() })
        .where(eq(draftResources.schoolCode, schoolCode))
        .returning();
      console.log(`Draft resources updated successfully for schoolCode: ${schoolCode}`);
      return draftResource;
    } catch (error) {
      console.error(`Error updating draft resources for schoolCode: ${schoolCode}`, error);
      throw error; // Ensure errors are propagated
    }
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
    console.log("Creating draft fees with data:", draft);
    try {
      // First try to get existing draft
      const existing = await this.getDraftFees(draft.schoolCode);
      
      if (existing) {
        // Update existing record
        return await this.updateDraftFees(draft.schoolCode, draft);
      } else {
        // Create new record
        const [draftFee] = await db
          .insert(draftFees)
          .values(draft)
          .returning();
        return draftFee;
      }
    } catch (error) {
      console.error('Error creating draft fees:', error);
      throw error;
    }
  }

  async updateDraftFees(schoolCode: string, draft: Partial<InsertDraftFees>): Promise<DraftFees> {
    console.log("Updating draft fees for schoolCode:", schoolCode, "with data:", draft);
    try {
      const [draftFee] = await db
        .update(draftFees)
        .set({ ...draft, updatedAt: new Date() })
        .where(eq(draftFees.schoolCode, schoolCode))
        .returning();
      console.log(`Draft fees updated successfully for schoolCode: ${schoolCode}`);
      return draftFee;
    } catch (error) {
      console.error(`Error updating draft fees for schoolCode: ${schoolCode}`, error);
      throw error; // Ensure errors are propagated
    }
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

  async getSchoolResources(schoolCode: string): Promise<Resources | null> {
    const [resourcesData] = await db
      .select()
      .from(resources)
      .where(eq(resources.schoolCode, schoolCode));
    return resourcesData || null;
  }

  async updateSchoolResources(schoolCode: string, data: Resources): Promise<Resources> {
    const [updatedResources] = await db
      .update(resources)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(resources.schoolCode, schoolCode))
      .returning();
    return updatedResources;
  }

  // Fees operations
  async createFees(feesData: InsertFees): Promise<Fees> {
    console.log("Attempting to create final fees entry with data:", feesData);
    try {
      const [newFees] = await db
        .insert(fees)
        .values(feesData)
        .returning();
      console.log("Successfully created final fees entry:", newFees);
      return newFees;
    } catch (error) {
      console.error("Error creating final fees entry:", error);
      throw error;
    }
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

  // School fees operations
  async getSchoolFees(schoolCode: string): Promise<SchoolFees | null> {
    const result = await db.select({
      id: fees.id,
      schoolCode: fees.schoolCode,
      paymentMethod: fees.paymentMethod,
      chequeNumber: fees.chequeNumber,
      chequeDate: fees.chequeDate,
      depositSlipNumber: fees.depositSlipNumber,
      depositDate: fees.depositDate,
      depositPayOrderNumber: fees.depositPayOrderNumber,
      amount: fees.amount,
      headOfInstitution: fees.headOfInstitution,
      disclaimerAccepted: fees.disclaimerAccepted,
      headSignature: fees.headSignature,
      institutionStamp: fees.institutionStamp,
      createdAt: fees.createdAt,
      updatedAt: fees.updatedAt
    })
    .from(fees)
    .where(eq(fees.schoolCode, schoolCode))
    .limit(1);
    
    if (!result[0]) return null;
    
    return {
      id: result[0].id,
      schoolCode: result[0].schoolCode,
      paymentMethod: result[0].paymentMethod || null,
      chequeNumber: result[0].chequeNumber || null,
      chequeDate: result[0].chequeDate || null,
      depositSlipNumber: result[0].depositSlipNumber || null,
      depositDate: result[0].depositDate || null,
      depositPayOrderNumber: result[0].depositPayOrderNumber || null,
      amount: result[0].amount || null,
      headOfInstitution: result[0].headOfInstitution || null,
      disclaimerAccepted: result[0].disclaimerAccepted ?? false,
      headSignature: result[0].headSignature || null,
      institutionStamp: result[0].institutionStamp || null,
      createdAt: result[0].createdAt || null,
      updatedAt: result[0].updatedAt || null
    };
  }

  async updateSchoolFees(schoolCode: string, data: Partial<SchoolFees>): Promise<SchoolFees> {
    const existing = await this.getSchoolFees(schoolCode);
    
    if (!existing) {
      const [result] = await db.insert(fees).values({
        ...data,
        schoolCode,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return result;
    }
    
    const [result] = await db.update(fees)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(fees.schoolCode, schoolCode))
      .returning();
    
    return result;
  }

  // Complete registration (move from draft to final)
  async completeRegistration(schoolCode: string): Promise<School> {
    try {
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
          otherFacility1: draftResourcesData.otherFacility1 ?? undefined,
          otherFacility2: draftResourcesData.otherFacility2 ?? undefined,
          otherFacility3: draftResourcesData.otherFacility3 ?? undefined,
        });
      }

      // Create final fees record
      if (draftFeesData) {
        console.log("Draft fees data found in completeRegistration, attempting to create final fees entry:", draftFeesData);
        await this.createFees({
          schoolCode: draftFeesData.schoolCode,
          paymentMethod: draftFeesData.paymentMethod,
          chequeNumber: draftFeesData.chequeNumber,
          chequeDate: draftFeesData.chequeDate,
          depositSlipNumber: draftFeesData.depositSlipNumber,
          depositDate: draftFeesData.depositDate,
          depositPayOrderNumber: draftFeesData.depositPayOrderNumber,
          amount: draftFeesData.amount,
          headOfInstitution: draftFeesData.headOfInstitution,
          disclaimerAccepted: draftFeesData.disclaimerAccepted,
          headSignature: draftFeesData.headSignature,
          institutionStamp: draftFeesData.institutionStamp,
        });
        console.log("Finished attempting to create final fees entry from completeRegistration.");
      } else {
        console.log("No draft fees data found in completeRegistration for schoolCode:", schoolCode);
      }

      // Create school credentials (username: schoolCode, password: auto-generated)
      const generatedPassword = `${schoolCode}_${Date.now()}`;
      await this.createSchoolCredentials({
        schoolCode,
        username: schoolCode,
        password: generatedPassword, // In production, this should be hashed
        isActive: true,
      });

      // Delete draft data in proper order (children first)
      await db.delete(draftFees).where(eq(draftFees.schoolCode, schoolCode));
      await db.delete(draftResources).where(eq(draftResources.schoolCode, schoolCode));
      await db.delete(draftSchools).where(eq(draftSchools.schoolCode, schoolCode));

      return finalSchool;
    } catch (error) {
      throw error;
    }
  }

  // Student fees operations
  async getStudentFees(schoolCode: string): Promise<StudentFeesInterface | null> {
    try {
      const [studentFeesData] = await db
        .select()
        .from(studentFees)
        .where(eq(studentFees.schoolCode, schoolCode));
      
      if (!studentFeesData) {
        return null;
      }
      
      return studentFeesData as StudentFeesInterface;
    } catch (error) {
      console.error('Error fetching student fees:', error);
      throw error;
    }
  }

  async createStudentFees(schoolCode: string, data: InsertStudentFees): Promise<StudentFeesInterface> {
    try {
      const [createdStudentFees] = await db
        .insert(studentFees)
        .values({
          ...data,
          schoolCode,
        })
        .returning();
      
      return createdStudentFees as StudentFeesInterface;
    } catch (error) {
      console.error('Error creating student fees:', error);
      throw error;
    }
  }

  async updateStudentFees(schoolCode: string, data: Partial<InsertStudentFees>): Promise<StudentFeesInterface> {
    try {
      const [updatedStudentFees] = await db
        .update(studentFees)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(studentFees.schoolCode, schoolCode))
        .returning();
      
      if (!updatedStudentFees) {
        throw new Error(`Student fees not found for school code: ${schoolCode}`);
      }
      
      return updatedStudentFees as StudentFeesInterface;
    } catch (error) {
      console.error('Error updating student fees:', error);
      throw error;
    }
  }
  
  // Audit logs operations
  async createAuditLog(auditData: InsertAuditLog): Promise<AuditLog> {
    try {
      const [auditLog] = await db
        .insert(auditLogs)
        .values(auditData)
        .returning();
      
      return auditLog;
    } catch (error) {
      console.error('Error creating audit log:', error);
      throw error;
    }
  }
  
  async getAuditLogs(filters?: {
    action?: string;
    userId?: string;
    resource?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    try {
      let query = db.select().from(auditLogs);
      
      if (filters?.action) {
        query = query.where(eq(auditLogs.action, filters.action));
      }
      
      if (filters?.userId) {
        query = query.where(eq(auditLogs.userId, filters.userId));
      }
      
      if (filters?.resource) {
        query = query.where(eq(auditLogs.resource, filters.resource));
      }
      
      // Add date range filtering if needed
      // if (filters?.startDate && filters?.endDate) {
      //   query = query.where(
      //     and(
      //       gte(auditLogs.createdAt, filters.startDate),
      //       lte(auditLogs.createdAt, filters.endDate)
      //     )
      //   );
      // }
      
      const logs = await query
        .orderBy(desc(auditLogs.createdAt))
        .limit(filters?.limit || 100);
      
      return logs;
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
}



export const storage = new DatabaseStorage();
