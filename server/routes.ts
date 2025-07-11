import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import PDFDocument from 'pdfkit';
import formidable from 'formidable';
import { auditService, ActionType } from "./auditLogger";

import {
  insertDraftSchoolSchema,
  insertDraftResourcesSchema,
  insertDraftFeesSchema,
  insertStudentSchema,
  importStudentSchema,
  insertStudentFeesSchema,
  placeholderStudentSchema,
  updateSchoolGradesSchema
} from "@shared/schema";
import type { InsertStudent } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Login route
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }
    // Find credentials using storage method
    let credential;
    // Try to find credentials by username (schoolCode or admin)
    const schoolCodesToTry = [username, "admin_school"];
    for (const schoolCode of schoolCodesToTry) {
      const cred = await storage.getSchoolCredentials(schoolCode);
      if (cred && cred.username === username) {
        credential = cred;
        break;
      }
    }
    if (!credential || credential.password !== password) {
      // Log failed login attempt
      auditService.logAuthAction(ActionType.USER_LOGIN, username, false, req, "Invalid credentials");
      return res.status(401).json({ message: "Invalid username or password" });
    }
    // Log successful login
    auditService.logAuthAction(ActionType.USER_LOGIN, username, true, req);
    // Optionally: set a cookie or session here
    return res.json({ success: true, schoolCode: credential.schoolCode });
  });

  // Logout route
  app.post("/api/logout", async (req, res) => {
    try {
      // Log logout action
      auditService.logAuthAction(ActionType.USER_LOGOUT, req.body.username || 'unknown', true, req);
      // Clear any server-side session data if implemented
      // For now, just return success as authentication is handled client-side
      res.json({ success: true, message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Error during logout" });
    }
  });
  // Public Schools management routes
  app.get("/api/schools", async (req, res) => {
    try {
      const schools = await storage.getAllSchools();
      res.json(schools);
    } catch (error) {
      console.error("Error fetching schools:", error);
      res.status(500).json({ message: "Failed to fetch schools" });
    }
  });

  app.get("/api/schools/:schoolCode", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const school = await storage.getSchool(schoolCode);
      
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      res.json(school);
    } catch (error) {
      console.error("Error fetching school:", error);
      res.status(500).json({ message: "Failed to fetch school" });
    }
  });

  app.delete("/api/schools/:schoolCode", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      await storage.deleteSchool(schoolCode);
      res.json({ message: "School deleted successfully" });
    } catch (error) {
      console.error("Error deleting school:", error);
      res.status(500).json({ message: "Failed to delete school" });
    }
  });

  app.patch("/api/schools/:schoolCode/toggle", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const school = await storage.getSchool(schoolCode);
      
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      
      const updatedSchool = await storage.updateSchool(schoolCode, {
        isActive: !school.isActive,
      });
      
      res.json(updatedSchool);
    } catch (error) {
      console.error("Error toggling school status:", error);
      res.status(500).json({ message: "Failed to toggle school status" });
    }
  });

  app.patch("/api/schools/:schoolCode", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      
      // Check if this is a grade-only update (only contains grade fields)
      const isGradeUpdate = Object.keys(req.body).every(key => 
        ['gradeIV', 'gradeV', 'gradeVI', 'gradeVII', 'gradeVIII'].includes(key)
      );
      
      let validatedData;
      if (isGradeUpdate) {
        // Use the grade-specific schema for partial updates
        validatedData = updateSchoolGradesSchema.parse(req.body);
      } else {
        // Use the full school schema for complete updates
        validatedData = insertDraftSchoolSchema.parse(req.body);
      }
      
      // Verify school exists
      const existingSchool = await storage.getSchool(schoolCode);
      if (!existingSchool) {
        return res.status(404).json({ message: "School not found" });
      }
      
      const updatedSchool = await storage.updateSchool(schoolCode, validatedData);
      res.json(updatedSchool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating school:", error);
      res.status(500).json({ message: "Failed to update school" });
    }
  });

  // School Resources routes
  app.get('/api/schools/:schoolCode/resources', async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const resources = await storage.getSchoolResources(schoolCode);
      console.log("Fetched resources for", schoolCode, resources);
      if (!resources) {
        return res.status(404).json({ message: "Resources not found" });
      }
      
      res.json(resources);
    } catch (error) {
      console.error("Error fetching school resources:", error);
      res.status(500).json({ message: "Failed to fetch school resources" });
    }
  });

  app.patch('/api/schools/:schoolCode/resources', async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const validatedData = insertDraftResourcesSchema.parse(req.body);
      
      const updatedResources = await storage.updateSchoolResources(schoolCode, validatedData);
      res.json(updatedResources);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating school resources:", error);
      res.status(500).json({ message: "Failed to update school resources" });
    }
  });

  // School Fees routes
  app.get('/api/schools/:schoolCode/fees', async (req, res) => {
    try {
      const { schoolCode } = req.params;
      console.log(`Fetching fees for school code: ${schoolCode}`);
      const fees = await storage.getSchoolFees(schoolCode);
      console.log('Fees data from storage:', fees);
      
      if (!fees) {
        console.log(`No fees found for school code: ${schoolCode}`);
        return res.status(404).json({ message: "Fees not found" });
      }
      
      res.json(fees);
    } catch (error) {
      console.error("Error fetching school fees:", error);
      res.status(500).json({ message: "Failed to fetch school fees" });
    }
  });

  app.patch('/api/schools/:schoolCode/fees', async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const validatedData = insertDraftFeesSchema.parse(req.body);
      
      const updatedFees = await storage.updateSchoolFees(schoolCode, validatedData);
      res.json(updatedFees);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error updating school fees:", error);
      res.status(500).json({ message: "Failed to update school fees" });
    }
  });

  // Draft school routes
  app.post("/api/drafts/school", async (req, res) => {
    try {
      const validatedData = insertDraftSchoolSchema.parse(req.body);
      
      // The createDraftSchool method handles both creation and updates (upsert)
      const draft = await storage.createDraftSchool(validatedData);
      
      res.json(draft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error saving draft school:", error);
      res.status(500).json({ message: "Failed to save draft school" });
    }
  });

  app.get("/api/drafts/school/:schoolCode", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const draft = await storage.getDraftSchool(schoolCode);
      
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      
      res.json(draft);
    } catch (error) {
      console.error("Error fetching draft school:", error);
      res.status(500).json({ message: "Failed to fetch draft school" });
    }
  });

  app.get("/api/drafts/schools", async (req, res) => {
    try {
      const drafts = await storage.getAllDraftSchools();
      res.json(drafts);
    } catch (error) {
      console.error("Error fetching draft schools:", error);
      res.status(500).json({ message: "Failed to fetch draft schools" });
    }
  });

  app.get("/api/drafts/schools/:schoolCode", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const draftSchool = await storage.getDraftSchool(schoolCode);
      
      if (!draftSchool) {
        return res.status(404).json({ error: 'Draft school not found' });
      }
      
      res.json(draftSchool);
    } catch (error) {
      console.error('Error fetching draft school:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete("/api/drafts/school/:schoolCode", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      await storage.deleteDraftSchool(schoolCode);
      res.json({ message: "Draft deleted successfully" });
    } catch (error) {
      console.error("Error deleting draft school:", error);
      res.status(500).json({ message: "Failed to delete draft school" });
    }
  });

  // Draft resources routes
  app.post("/api/drafts/resources", async (req, res) => {
    try {
      const validatedData = insertDraftResourcesSchema.parse(req.body);
      
      // The createDraftResources method handles both creation and updates (upsert)
      const draft = await storage.createDraftResources(validatedData);
      
      res.json(draft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error saving draft resources:", error);
      res.status(500).json({ message: "Failed to save draft resources" });
    }
  });

  app.get("/api/drafts/resources/:schoolCode", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const draft = await storage.getDraftResources(schoolCode);
      
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      
      res.json(draft);
    } catch (error) {
      console.error("Error fetching draft resources:", error);
      res.status(500).json({ message: "Failed to fetch draft resources" });
    }
  });

  // Draft fees routes
  app.post("/api/drafts/fees", async (req, res) => {
    try {
      const validatedData = insertDraftFeesSchema.parse(req.body);
      console.log("Received draft fees data:", validatedData);
      
      // The createDraftFees method handles both creation and updates (upsert)
      const draft = await storage.createDraftFees(validatedData);
      
      res.json(draft);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error saving draft fees:", error);
      res.status(500).json({ message: "Failed to save draft fees" });
    }
  });

  app.get("/api/drafts/fees/:schoolCode", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const draft = await storage.getDraftFees(schoolCode);
      
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      
      res.json(draft);
    } catch (error) {
      console.error("Error fetching draft fees:", error);
      res.status(500).json({ message: "Failed to fetch draft fees" });
    }
  });

  // Student routes
  app.get('/api/students', async (req, res) => {
  try {
    const students = await storage.getAllStudents();
    res.json(students);
  } catch (error) {
    console.error('Error fetching all students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

app.get('/api/schools/:schoolCode/students', async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const students = await storage.getStudentsBySchool(schoolCode);
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Failed to fetch students' });
    }
  });

  app.post('/api/schools/:schoolCode/students', async (req, res) => {
    try {
      const { schoolCode } = req.params;
      // Use importStudentSchema for individual student creation (excludes studentId which is generated server-side)
      const studentData = importStudentSchema.parse({ ...req.body, schoolCode });
      console.log('Creating student:', studentData);
      const student = await storage.createStudent(schoolCode, studentData);
      
      // Log student creation
      auditService.logStudentAction(ActionType.STUDENT_CREATED, student, req);
      
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating student:', error);
      auditService.logError(error as Error, 'Student creation', req);
      res.status(500).json({ message: 'Failed to create student' });
    }
  });

  app.get('/api/students/:studentId', async (req, res) => {
    try {
      const { studentId } = req.params;
      const student = await storage.getStudentById(studentId);
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ message: 'Failed to fetch student' });
    }
  });

  app.patch('/api/students/:studentId', async (req, res) => {
    try {
      const { studentId } = req.params;
      
      // Check if student exists
      const existingStudent = await storage.getStudentById(studentId);
      if (!existingStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      // Create a schema for updating student (exclude schoolCode and other generated fields)
      const updateStudentSchema = z.object({
        studentName: z.string().min(1),
        fatherName: z.string().min(1),
        gender: z.enum(["M", "F"]),
        grade: z.enum(["IV", "V", "VI", "VII", "VIII"]),
        dateOfBirth: z.coerce.date(),
      });
      
      const studentData = updateStudentSchema.parse(req.body);
      
      const updatedStudent = await storage.updateStudent(studentId, studentData);
      
      // Log student update
      auditService.logStudentAction(ActionType.STUDENT_UPDATED, updatedStudent, req, existingStudent);
      
      res.json(updatedStudent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error updating student:', error);
      auditService.logError(error as Error, 'Student update', req);
      res.status(500).json({ message: 'Failed to update student' });
    }
  });

  app.post('/api/schools/:schoolCode/students/import', async (req, res) => {
    try {
      const studentsArr = Array.isArray(req.body) ? req.body : [];
      if (!studentsArr.length) return res.status(400).json({ message: 'No students to import' });
      // Group students by schoolCode in data
      const studentsBySchool: Record<string, any[]> = {};
      const failedRows: any[] = [];
      for (const s of studentsArr) {
        let code = s.schoolCode || s["schoolCode"] || s["School Code"];
        if (typeof code === 'number') code = String(code);
        let dob = s.dateOfBirth;
        // Convert Excel serial date to JS date if needed
        if (typeof dob === 'number') {
          // Excel serial date: days since 1899-12-31
          const jsDate = new Date(Math.round((dob - 25569) * 86400 * 1000));
          dob = jsDate.toISOString().slice(0, 10); // YYYY-MM-DD
          console.log('Converted Excel serial date:', s.dateOfBirth, '->', dob);
        } else if (typeof dob === 'string') {
          // Try to parse various date formats
          const parts = dob.match(/(\d{1,4})[\/-](\d{1,2})[\/-](\d{2,4})/);
          if (parts) {
            // Try DD/MM/YYYY or DD-MM-YYYY
            let [_, d1, d2, d3] = parts;
            if (d1.length === 4) {
              // YYYY-MM-DD
              dob = `${d1.padStart(4, '0')}-${d2.padStart(2, '0')}-${d3.padStart(2, '0')}`;
            } else if (d3.length === 4) {
              // DD/MM/YYYY or DD-MM-YYYY
              dob = `${d3.padStart(4, '0')}-${d2.padStart(2, '0')}-${d1.padStart(2, '0')}`;
            }
            // else leave as is
          }
        }
        console.log('Raw row:', s);
        console.log('Extracted schoolCode:', code);
        if (!code) {
          failedRows.push({ row: s, error: 'Missing schoolCode' });
          continue;
        }
        try {
          const validated = importStudentSchema.parse({ ...s, schoolCode: code, dateOfBirth: dob });
          if (!studentsBySchool[code]) studentsBySchool[code] = [];
          studentsBySchool[code].push(validated);
        } catch (err) {
          console.log('Validation error for row:', s, err);
          failedRows.push({ row: s, error: err.errors || err.message });
        }
      }
      let totalImported = 0;
      let totalDuplicates = 0;
      const unregisteredSchools: string[] = [];
      
      for (const [schoolCode, group] of Object.entries(studentsBySchool)) {
        console.log(`Checking if school ${schoolCode} is registered...`);
        
        // Validate that the school code exists in the registered schools
        try {
          const school = await storage.getSchool(schoolCode);
          if (!school) {
            console.log(`School ${schoolCode} is not registered, skipping ${group.length} students`);
            unregisteredSchools.push(schoolCode);
            // Move all students from this school to failed rows
            for (const student of group) {
              failedRows.push({ 
                row: student, 
                error: `School code '${schoolCode}' is not registered. Please register the school first.` 
              });
            }
            continue;
          }
          
          console.log(`School ${schoolCode} is registered, importing ${group.length} students`);
          const originalCount = group.length;
          const importedCount = await storage.importStudents(schoolCode, group);
          totalImported += importedCount;
          totalDuplicates += (originalCount - importedCount);
        } catch (error) {
          console.error(`Error checking school ${schoolCode}:`, error);
          unregisteredSchools.push(schoolCode);
          // Move all students from this school to failed rows
          for (const student of group) {
            failedRows.push({ 
              row: student, 
              error: `Error validating school code '${schoolCode}': ${error.message}` 
            });
          }
        }
      }
      
      let message;
      let statusCode = 201;
      
      if (totalImported > 0 && totalDuplicates > 0) {
        message = `Successfully imported ${totalImported} students. ${totalDuplicates} duplicates were skipped.`;
      } else if (totalImported > 0 && totalDuplicates === 0) {
        message = `Successfully imported ${totalImported} students.`;
      } else if (totalImported === 0 && totalDuplicates > 0) {
        message = `No new students imported. ${totalDuplicates} duplicates were skipped.`;
      } else {
        message = 'No students were imported.';
        statusCode = 400;
      }
      
      // Add information about unregistered schools
      if (unregisteredSchools.length > 0) {
        const schoolsMessage = `${unregisteredSchools.length} school(s) were not registered: ${unregisteredSchools.join(', ')}`;
        message += ` ${schoolsMessage}`;
      }
        
      if (totalImported === 0 && totalDuplicates === 0 && failedRows.length > 0) {
        return res.status(400).json({ 
          message: 'No valid students to import', 
          failedRows,
          count: 0,
          duplicates: 0
        });
      }
      
      res.status(statusCode).json({ 
        count: totalImported, 
        duplicates: totalDuplicates,
        message,
        failedRows,
        success: totalImported > 0 || totalDuplicates > 0
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error importing students:', error);
      res.status(500).json({ message: 'Failed to import students' });
    }
  });

  // Placeholder students route (for form-based student data)
  app.post('/api/schools/:schoolCode/students/placeholders', async (req, res) => {
    try {
      const studentsArr = Array.isArray(req.body) ? req.body : [];
      if (!studentsArr.length) {
        return res.status(400).json({ message: 'No students to process' });
      }

      const { schoolCode } = req.params;
      const validatedStudents = [];
      const failedRows = [];

      for (const student of studentsArr) {
        try {
          const validated = placeholderStudentSchema.parse({ ...student, schoolCode });
          validatedStudents.push(validated);
        } catch (err) {
          console.log('Validation error for placeholder student:', student, err);
          failedRows.push({ row: student, error: err.errors || err.message });
        }
      }

      if (validatedStudents.length === 0) {
        return res.status(400).json({ 
          message: 'No valid placeholder students to process', 
          failedRows
        });
      }

      // For now, just return the validated data
      // In the future, you might want to store these placeholders or use them for calculations
      res.status(200).json({ 
        message: `Successfully processed ${validatedStudents.length} placeholder students`,
        students: validatedStudents,
        failedRows
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error processing placeholder students:', error);
      res.status(500).json({ message: 'Failed to process placeholder students' });
    }
  });

  // Student fees routes
  app.get('/api/schools/:schoolCode/student-fees', async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const studentFees = await storage.getStudentFees(schoolCode);
      
      if (!studentFees) {
        return res.status(404).json({ message: "Student fees not found" });
      }
      
      res.json(studentFees);
    } catch (error) {
      console.error('Error fetching student fees:', error);
      res.status(500).json({ message: 'Failed to fetch student fees' });
    }
  });

  app.post('/api/schools/:schoolCode/student-fees', async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const validatedData = insertStudentFeesSchema.parse({ ...req.body, schoolCode });
      
      const studentFees = await storage.createStudentFees(schoolCode, validatedData);
      res.status(201).json(studentFees);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error creating student fees:', error);
      res.status(500).json({ message: 'Failed to create student fees' });
    }
  });

  app.patch('/api/schools/:schoolCode/student-fees', async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const validatedData = insertStudentFeesSchema.parse({ ...req.body, schoolCode });
      
      const studentFees = await storage.updateStudentFees(schoolCode, validatedData);
      res.json(studentFees);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      console.error('Error updating student fees:', error);
      res.status(500).json({ message: 'Failed to update student fees' });
    }
  });

  // Complete registration route
  app.post("/api/schools/:schoolCode/complete", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const school = await storage.completeRegistration(schoolCode);
      res.json(school);
    } catch (error) {
      console.error("Error completing registration:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to complete registration" 
      });
    }
  });

  // Get school credentials
  app.get("/api/schools/:schoolCode/credentials", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const credentials = await storage.getSchoolCredentials(schoolCode);
      
      if (!credentials) {
        return res.status(404).json({ message: "Credentials not found" });
      }
      
      // Don't return the actual password
      const { password, ...safeCredentials } = credentials;
      res.json(safeCredentials);
    } catch (error) {
      console.error("Error fetching credentials:", error);
      res.status(500).json({ message: "Failed to fetch credentials" });
    }
  });

  // Update school fees endpoint
  app.patch("/api/schools/:schoolCode/fees", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const data = req.body;
      
      // Convert ISO string dates back to Date objects
      const processedData = {
        ...data,
        chequeDate: data.chequeDate ? new Date(data.chequeDate) : null,
        depositDate: data.depositDate ? new Date(data.depositDate) : null,
        disclaimerAccepted: data.disclaimerAccepted ?? false
      };
      
      const updatedFees = await storage.updateSchoolFees(schoolCode, processedData);
      res.json(updatedFees);
    } catch (error) {
      console.error("Error updating fees:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update fees" 
      });
    }
  });

  app.get("/api/schools/:schoolCode/fees", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const fees = await storage.getSchoolFees(schoolCode);
      
      if (!fees) {
        return res.status(404).json({ message: "Fees not found" });
      }
      
      res.json(fees);
    } catch (error) {
      console.error("Error fetching fees:", error);
      res.status(500).json({ message: "Failed to fetch fees" });
    }
  });

    // PDF export endpoint
  app.get("/api/schools/:schoolCode/pdf", async (req, res) => {
    try {
      const { schoolCode } = req.params;
      const school = await storage.getSchool(schoolCode);
      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }
      const resources = await storage.getSchoolResources(schoolCode);
      const fees = await storage.getSchoolFees(schoolCode);

      // setup PDF document
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${schoolCode}.pdf`);
      doc.pipe(res);

      // Title
      doc.fontSize(20).text('School Registration Form', { align: 'center' });
      doc.moveDown();

      // School Details
      doc.fontSize(12).text(`School Code: ${school.schoolCode}`);
      doc.text(`School Name: ${school.schoolName}`);
      doc.text(`Address: ${school.schoolAddress}`);
      doc.text(`Contact Numbers: ${school.contactNumbers}`);
      doc.text(`School Type: ${school.schoolType}`);
      doc.text(`Academic Year: ${school.academicYearStart} - ${school.academicYearEnd}`);
      doc.text(`Grades Offered: ${school.gradeLevelFrom} to ${school.gradeLevelTill}`);
      doc.text(`Languages: ${(school.languages || []).join(', ')}${school.otherLanguage ? `, Other: ${school.otherLanguage}` : ''}`);
      doc.moveDown();

      // Coordinator Details
      doc.fontSize(14).text('Coordinator Details');
      doc.fontSize(12).text(`Principal: ${school.principalName} (${school.principalEmail}, ${school.principalCell})`);
      doc.text(`Primary Coordinator: ${school.primaryCoordinatorName} (${school.primaryCoordinatorEmail}, ${school.primaryCoordinatorCell})`);
      doc.text(`Middle Coordinator: ${school.middleCoordinatorName} (${school.middleCoordinatorEmail}, ${school.middleCoordinatorCell})`);
      doc.moveDown();

      // Enrollment Numbers
      doc.fontSize(14).text('Enrollment Numbers');
      doc.fontSize(12).text(`Grade IV: ${school.gradeIV}`);
      doc.text(`Grade V: ${school.gradeV}`);
      doc.text(`Grade VI: ${school.gradeVI}`);
      doc.text(`Grade VII: ${school.gradeVII}`);
      doc.text(`Grade VIII: ${school.gradeVIII}`);
      doc.moveDown();

      // PSP/MSP Registration
      doc.fontSize(14).text('PSP/MSP Registration');
      doc.fontSize(12).text((school.pspMspRegistration || []).join(', '));
      doc.moveDown();

      // Resources and Support
      doc.fontSize(14).text('Resources and Support');
      doc.fontSize(12).text(`Primary Teachers: ${resources?.primaryTeachers ?? ''}`);
      doc.text(`Middle Teachers: ${resources?.middleTeachers ?? ''}`);
      doc.text(`Undergraduate: ${resources?.undergraduateTeachers ?? ''}`);
      doc.text(`Graduate: ${resources?.graduateTeachers ?? ''}`);
      doc.text(`Postgraduate: ${resources?.postgraduateTeachers ?? ''}`);
      doc.text(`Education Degree: ${resources?.educationDegreeTeachers ?? ''}`);
      doc.text(`Total Weeks: ${resources?.totalWeeks ?? ''}`);
      doc.text(`Weekly Periods: ${resources?.weeklyPeriods ?? ''}`);
      doc.text(`Period Duration (mins): ${resources?.periodDuration ?? ''}`);
      doc.text(`Max Students per Class: ${resources?.maxStudents ?? ''}`);
      // Consolidate facilities
      const facilitiesList = [
        ...(resources?.facilities || []),
        resources?.otherFacility1,
        resources?.otherFacility2,
        resources?.otherFacility3,
      ].filter(Boolean);
      doc.text(`Facilities: ${facilitiesList.join(', ')}`);
      doc.moveDown();

      // Fees Details
      doc.fontSize(14).text('Fees Details');
      doc.fontSize(12).text(`Payment Method: ${fees?.paymentMethod ?? ''}`);
      doc.text(`Cheque #: ${fees?.chequeNumber ?? ''}`);
      doc.text(`Cheque Date: ${fees?.chequeDate ? fees.chequeDate.toLocaleDateString() : ''}`);
      doc.text(`Deposit Slip #: ${fees?.depositSlipNumber ?? ''}`);
      doc.text(`Deposit Date: ${fees?.depositDate ? fees.depositDate.toLocaleDateString() : ''}`);
      doc.text(`Pay Order #: ${fees?.depositPayOrderNumber ?? ''}`);
      doc.text(`Amount: ${fees?.amount ?? ''}`);
      doc.text(`Head of Institution: ${fees?.headOfInstitution ?? ''}`);
      doc.text(`Disclaimer Accepted: ${fees?.disclaimerAccepted ? 'Yes' : 'No'}`);
      doc.text(`Signature: ${fees?.headSignature ?? ''}`);
      doc.text(`Stamp: ${fees?.institutionStamp ?? ''}`);
      doc.moveDown();

      // Footer
      doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'right' });

      doc.end();
    } catch (error) {
      console.error('Error generating PDF', error);
      res.status(500).json({ message: 'Failed to generate PDF' });
    }
  });

  // File upload for deposit slip endpoint
  app.post('/api/upload/deposit-slip', (req, res) => {
    const form = formidable({
      uploadDir: 'public/uploads/deposit-slips',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10 MB
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Error uploading file:', err);
        return res.status(500).json({ message: 'File upload failed' });
      }

      const file = files.file;
      const fileUrl = "/uploads/deposit-slips/" + file.newFilename;
      res.json({ fileUrl });
    });
  });

  // Audit logs endpoint
  app.get('/api/audit-logs', async (req, res) => {
    try {
      const { action, userId, resource, limit } = req.query;
      
      const filters = {
        action: action as string,
        userId: userId as string,
        resource: resource as string,
        limit: limit ? parseInt(limit as string) : 100
      };
      
      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
