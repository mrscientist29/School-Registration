import { useState, useEffect } from "react";
import AddStudentDialog from "@/components/AddStudentDialog";
import { StudentsTable } from "@/components/student/StudentsTable";
import StudentFeesForm from "@/components/student/StudentFeesForm";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
// @ts-ignore
import * as XLSX from "xlsx";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// --- Student Registration Form Component ---
interface StudentRegistrationFormProps {
  schoolCode: string;
  schoolName?: string;
  onFeesDataChange?: (data: { primaryAmount: number; middleAmount: number; totalFee: number; primaryCount: number; middleCount: number }) => void;
  onNavigateToFees?: () => void;
}

const GRADES = [
  { key: "IV", label: "IV", level: "primary" },
  { key: "V", label: "V", level: "primary" },
  { key: "VI", label: "VI", level: "middle" },
  { key: "VII", label: "VII", level: "middle" },
  { key: "VIII", label: "VIII", level: "middle" },
];

const FEE_PER_CANDIDATE = { primary: 2000, middle: 2250 };

function StudentRegistrationForm({ schoolCode, schoolName, onFeesDataChange, onNavigateToFees }: StudentRegistrationFormProps) {
  const { toast } = useToast();
  const [schools, setSchools] = useState<Array<{schoolCode: string, schoolName: string}>>([]);
  const [selectedSchoolCode, setSelectedSchoolCode] = useState(schoolCode || "");
  
  // Query to fetch school registration data
  const { data: schoolData, refetch: refetchSchoolData } = useQuery({
    queryKey: ["school-data", selectedSchoolCode],
    queryFn: async () => {
      if (!selectedSchoolCode) return null;
      const response = await fetch(`/api/schools/${selectedSchoolCode}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch school data');
      }
      return await response.json();
    },
    enabled: !!selectedSchoolCode
  });
  
  const { handleSubmit, control, reset, watch, setValue } = useForm({
    defaultValues: {
      schoolName: schoolName || "",
      schoolCode: schoolCode || "",
      grades: [] as string[],
      candidates: { IV: 0, V: 0, VI: 0, VII: 0, VIII: 0 },
    }
  });

  // Fetch schools for dropdown
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch('/api/schools');
        const schoolsData = await response.json();
        setSchools(schoolsData);
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };
    fetchSchools();
  }, []);

  // Auto-populate school name when school is selected
  useEffect(() => {
    if (selectedSchoolCode) {
      const selectedSchool = schools.find(s => s.schoolCode === selectedSchoolCode);
      if (selectedSchool) {
        setValue('schoolName', selectedSchool.schoolName);
      }
      setValue('schoolCode', selectedSchoolCode);
    }
  }, [selectedSchoolCode, schools, setValue]);

  const grades = watch("grades");
  const candidates = watch("candidates");

  // Fee calculation logic
  const primaryCount = (candidates.IV || 0) + (candidates.V || 0);
  const middleCount = (candidates.VI || 0) + (candidates.VII || 0) + (candidates.VIII || 0);
  const primaryAmount = primaryCount * FEE_PER_CANDIDATE.primary;
  const middleAmount = middleCount * FEE_PER_CANDIDATE.middle;
  const totalFee = primaryAmount + middleAmount;

  // Notify parent component about fees data changes
  useEffect(() => {
    if (onFeesDataChange) {
      onFeesDataChange({ primaryAmount, middleAmount, totalFee, primaryCount, middleCount });
    }
  }, [primaryAmount, middleAmount, totalFee, primaryCount, middleCount, onFeesDataChange]);

  const onSubmit = async (data: any) => {
    // Save registration counts for each selected grade
    const registrationCounts = GRADES.reduce((acc, { key }) => {
      const count = data.candidates[key] || 0;
      if (count > 0) {
        acc[key] = count;
      }
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(registrationCounts).length === 0) {
      toast({
        title: "Error",
        description: "Please select grades and enter candidate numbers",
        variant: "destructive",
      });
      return;
    }
    
    // Save registration data (just the counts, not individual student records)
    try {
      // Update the school record with grade counts
      const response = await fetch(`/api/schools/${data.schoolCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeIV: registrationCounts.IV || 0,
          gradeV: registrationCounts.V || 0,
          gradeVI: registrationCounts.VI || 0,
          gradeVII: registrationCounts.VII || 0,
          gradeVIII: registrationCounts.VIII || 0,
        })
      });
      
      if (response.ok) {
        const totalStudents = Object.values(registrationCounts).reduce((sum, count) => sum + count, 0);
        toast({
          title: "Success",
          description: `Successfully saved registration for ${totalStudents} students!`,
        });
        
        // Refetch school data to update the display
        refetchSchoolData();
        
        // Navigate to fees tab
        if (onNavigateToFees) {
          onNavigateToFees();
        }
        
        reset();
      } else {
        const error = await response.text();
        toast({
          title: "Error",
          description: `Failed to save registration: ${error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to save registration: ${error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" />
            Student Registration Form
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* School Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select School</label>
                <Select value={selectedSchoolCode} onValueChange={setSelectedSchoolCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.schoolCode} value={school.schoolCode}>
                        {school.schoolCode} - {school.schoolName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">School Name</label>
                <Controller
                  name="schoolName"
                  control={control}
                  render={({ field }) => (
                    <Input {...field} placeholder="School name will auto-populate" readOnly className="bg-gray-50" />
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">School Code</label>
              <Controller
                name="schoolCode"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="School code will auto-populate" readOnly className="bg-gray-50" />
                )}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Programmes Opted for Grade(s)</label>
              <div className="flex gap-4 flex-wrap">
                {GRADES.map(g => (
                  <label key={g.key} className="flex items-center gap-2 p-2 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <Controller
                      name="grades"
                      control={control}
                      render={({ field }) => (
                        <input
                          type="checkbox"
                          checked={field.value.includes(g.key)}
                          onChange={e => {
                            const checked = e.target.checked;
                            const value = [...field.value];
                            if (checked) value.push(g.key);
                            else value.splice(value.indexOf(g.key), 1);
                            field.onChange(value);
                          }}
                          className="rounded"
                        />
                      )}
                    />
                    <span className="text-sm">Grade {g.label}</span>
                    <Badge variant={g.level === 'primary' ? 'default' : 'secondary'} className="text-xs">
                      {g.level}
                    </Badge>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-sm font-medium">Number of candidates registering for Programmes</label>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">Primary Level</TableHead>
                      <TableHead className="text-center">Middle Level</TableHead>
                      <TableHead className="text-center">Total Candidates</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="space-y-2">
                        <div className="flex gap-2 justify-center">
                          <div className="text-center">
                            <label className="text-xs text-gray-500">Grade IV</label>
                            <Controller
                              name="candidates.IV"
                              control={control}
                              render={({ field }) => (
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min={0} 
                                  disabled={!grades.includes("IV")}
                                  onChange={e => setValue("candidates.IV", parseInt(e.target.value) || 0)}
                                  value={field.value}
                                  className="w-20 text-center"
                                />
                              )}
                            />
                          </div>
                          <div className="text-center">
                            <label className="text-xs text-gray-500">Grade V</label>
                            <Controller
                              name="candidates.V"
                              control={control}
                              render={({ field }) => (
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min={0} 
                                  disabled={!grades.includes("V")}
                                  onChange={e => setValue("candidates.V", parseInt(e.target.value) || 0)}
                                  value={field.value}
                                  className="w-20 text-center"
                                />
                              )}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="space-y-2">
                        <div className="flex gap-2 justify-center">
                          <div className="text-center">
                            <label className="text-xs text-gray-500">Grade VI</label>
                            <Controller
                              name="candidates.VI"
                              control={control}
                              render={({ field }) => (
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min={0} 
                                  disabled={!grades.includes("VI")}
                                  onChange={e => setValue("candidates.VI", parseInt(e.target.value) || 0)}
                                  value={field.value}
                                  className="w-20 text-center"
                                />
                              )}
                            />
                          </div>
                          <div className="text-center">
                            <label className="text-xs text-gray-500">Grade VII</label>
                            <Controller
                              name="candidates.VII"
                              control={control}
                              render={({ field }) => (
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min={0} 
                                  disabled={!grades.includes("VII")}
                                  onChange={e => setValue("candidates.VII", parseInt(e.target.value) || 0)}
                                  value={field.value}
                                  className="w-20 text-center"
                                />
                              )}
                            />
                          </div>
                          <div className="text-center">
                            <label className="text-xs text-gray-500">Grade VIII</label>
                            <Controller
                              name="candidates.VIII"
                              control={control}
                              render={({ field }) => (
                                <Input 
                                  {...field} 
                                  type="number" 
                                  min={0} 
                                  disabled={!grades.includes("VIII")}
                                  onChange={e => setValue("candidates.VIII", parseInt(e.target.value) || 0)}
                                  value={field.value}
                                  className="w-20 text-center"
                                />
                              )}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {primaryCount + middleCount}
                        </div>
                        <div className="text-xs text-gray-500">Total</div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            {/* Fee Detail Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Fee Details</h3>
              
              {/* Primary Level Fees */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Fee slot applicable to <strong>primary level</strong> according to the total number of candidates.</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee per candidate</TableHead>
                      <TableHead>Number of candidates enrolled</TableHead>
                      <TableHead>Applicable amount in PKR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>PKR 2,000</TableCell>
                      <TableCell>{primaryCount}</TableCell>
                      <TableCell className="font-semibold">PKR {primaryAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Middle Level Fees */}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Fee slot applicable to <strong>middle level</strong> according to the total number of candidates.</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee per candidate</TableHead>
                      <TableHead>Number of candidates enrolled</TableHead>
                      <TableHead>Applicable amount in PKR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>PKR 2,250</TableCell>
                      <TableCell>{middleCount}</TableCell>
                      <TableCell className="font-semibold">PKR {middleAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Total Fee */}
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="text-xl font-bold text-primary">Total Fee: PKR {totalFee.toLocaleString()}</div>
                <div className="text-sm text-gray-600 mt-1">(Total Fee = Amount applicable for primary level + Amount applicable for middle level)</div>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={!selectedSchoolCode}>
              Save Details
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Current Registration Preview */}
      {(primaryCount > 0 || middleCount > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Current Registration Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Grade-wise Registration Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Number of Candidates</TableHead>
                      <TableHead>Fee per Candidate</TableHead>
                      <TableHead>Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.IV > 0 && (
                      <TableRow>
                        <TableCell><Badge variant="default">Grade IV</Badge></TableCell>
                        <TableCell>Primary</TableCell>
                        <TableCell>{candidates.IV}</TableCell>
                        <TableCell>PKR 2,000</TableCell>
                        <TableCell className="font-semibold">PKR {(candidates.IV * 2000).toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                    {candidates.V > 0 && (
                      <TableRow>
                        <TableCell><Badge variant="default">Grade V</Badge></TableCell>
                        <TableCell>Primary</TableCell>
                        <TableCell>{candidates.V}</TableCell>
                        <TableCell>PKR 2,000</TableCell>
                        <TableCell className="font-semibold">PKR {(candidates.V * 2000).toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                    {candidates.VI > 0 && (
                      <TableRow>
                        <TableCell><Badge variant="secondary">Grade VI</Badge></TableCell>
                        <TableCell>Middle</TableCell>
                        <TableCell>{candidates.VI}</TableCell>
                        <TableCell>PKR 2,250</TableCell>
                        <TableCell className="font-semibold">PKR {(candidates.VI * 2250).toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                    {candidates.VII > 0 && (
                      <TableRow>
                        <TableCell><Badge variant="secondary">Grade VII</Badge></TableCell>
                        <TableCell>Middle</TableCell>
                        <TableCell>{candidates.VII}</TableCell>
                        <TableCell>PKR 2,250</TableCell>
                        <TableCell className="font-semibold">PKR {(candidates.VII * 2250).toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                    {candidates.VIII > 0 && (
                      <TableRow>
                        <TableCell><Badge variant="secondary">Grade VIII</Badge></TableCell>
                        <TableCell>Middle</TableCell>
                        <TableCell>{candidates.VIII}</TableCell>
                        <TableCell>PKR 2,250</TableCell>
                        <TableCell className="font-semibold">PKR {(candidates.VIII * 2250).toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Primary Level</div>
                  <div className="text-lg font-bold text-blue-600">
                    {primaryCount} candidates
                  </div>
                  <div className="text-sm text-gray-500">PKR {primaryAmount.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Middle Level</div>
                  <div className="text-lg font-bold text-green-600">
                    {middleCount} candidates
                  </div>
                  <div className="text-sm text-gray-500">PKR {middleAmount.toLocaleString()}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Total Candidates</div>
                  <div className="text-lg font-bold text-purple-600">
                    {primaryCount + middleCount} candidates
                  </div>
                  <div className="text-sm text-gray-500">PKR {totalFee.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Saved Registration Summary (if exists and different from current) */}
      {schoolData && (schoolData.gradeIV > 0 || schoolData.gradeV > 0 || schoolData.gradeVI > 0 || schoolData.gradeVII > 0 || schoolData.gradeVIII > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Previously Saved Registration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Grade-wise Registration Table */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Grade</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Number of Candidates</TableHead>
                      <TableHead>Fee per Candidate</TableHead>
                      <TableHead>Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schoolData.gradeIV > 0 && (
                      <TableRow>
                        <TableCell><Badge variant="default">Grade IV</Badge></TableCell>
                        <TableCell>Primary</TableCell>
                        <TableCell>{schoolData.gradeIV}</TableCell>
                        <TableCell>PKR 2,000</TableCell>
                        <TableCell className="font-semibold">PKR {(schoolData.gradeIV * 2000).toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                    {schoolData.gradeV > 0 && (
                      <TableRow>
                        <TableCell><Badge variant="default">Grade V</Badge></TableCell>
                        <TableCell>Primary</TableCell>
                        <TableCell>{schoolData.gradeV}</TableCell>
                        <TableCell>PKR 2,000</TableCell>
                        <TableCell className="font-semibold">PKR {(schoolData.gradeV * 2000).toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                    {schoolData.gradeVI > 0 && (
                      <TableRow>
                        <TableCell><Badge variant="secondary">Grade VI</Badge></TableCell>
                        <TableCell>Middle</TableCell>
                        <TableCell>{schoolData.gradeVI}</TableCell>
                        <TableCell>PKR 2,250</TableCell>
                        <TableCell className="font-semibold">PKR {(schoolData.gradeVI * 2250).toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                    {schoolData.gradeVII > 0 && (
                      <TableRow>
                        <TableCell><Badge variant="secondary">Grade VII</Badge></TableCell>
                        <TableCell>Middle</TableCell>
                        <TableCell>{schoolData.gradeVII}</TableCell>
                        <TableCell>PKR 2,250</TableCell>
                        <TableCell className="font-semibold">PKR {(schoolData.gradeVII * 2250).toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                    {schoolData.gradeVIII > 0 && (
                      <TableRow>
                        <TableCell><Badge variant="secondary">Grade VIII</Badge></TableCell>
                        <TableCell>Middle</TableCell>
                        <TableCell>{schoolData.gradeVIII}</TableCell>
                        <TableCell>PKR 2,250</TableCell>
                        <TableCell className="font-semibold">PKR {(schoolData.gradeVIII * 2250).toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              
              {/* Summary Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Primary Level</div>
                  <div className="text-lg font-bold text-blue-600">
                    {(schoolData.gradeIV || 0) + (schoolData.gradeV || 0)} candidates
                  </div>
                  <div className="text-sm text-gray-500">PKR {(((schoolData.gradeIV || 0) + (schoolData.gradeV || 0)) * 2000).toLocaleString()}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Middle Level</div>
                  <div className="text-lg font-bold text-green-600">
                    {(schoolData.gradeVI || 0) + (schoolData.gradeVII || 0) + (schoolData.gradeVIII || 0)} candidates
                  </div>
                  <div className="text-sm text-gray-500">PKR {(((schoolData.gradeVI || 0) + (schoolData.gradeVII || 0) + (schoolData.gradeVIII || 0)) * 2250).toLocaleString()}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm text-gray-600">Total Candidates</div>
                  <div className="text-lg font-bold text-purple-600">
                    {(schoolData.gradeIV || 0) + (schoolData.gradeV || 0) + (schoolData.gradeVI || 0) + (schoolData.gradeVII || 0) + (schoolData.gradeVIII || 0)} candidates
                  </div>
                  <div className="text-sm text-gray-500">PKR {(
                    ((schoolData.gradeIV || 0) + (schoolData.gradeV || 0)) * 2000 +
                    ((schoolData.gradeVI || 0) + (schoolData.gradeVII || 0) + (schoolData.gradeVIII || 0)) * 2250
                  ).toLocaleString()}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}

// --- Import Students Button Component ---
interface ImportStudentsButtonProps {
  schoolCode: string;
}

function ImportStudentsButton({ schoolCode }: ImportStudentsButtonProps) {
  const { toast } = useToast();
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const data = evt.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      let allStudents: any[] = [];
      
      // First try to extract school code from filename
      console.log("Filename:", file.name); // Debug log
      let extractedSchoolCode: string | undefined;
      
      // Extract school code from filename (e.g., "0405 - KMA Boys Secondary School...")
      const filenameCodeMatch = file.name.match(/^(\d{4})/);
      if (filenameCodeMatch) {
        extractedSchoolCode = filenameCodeMatch[1];
        console.log("School code extracted from filename:", extractedSchoolCode); // Debug log
      }
      
      // Get school code from Grade sheets (Grade 4, Grade 5, etc.) A1 cell as fallback
      console.log("Available sheets:", workbook.SheetNames); // Debug log
      
      // If filename extraction failed, try to find a Grade sheet that has the school code in A1
      const gradeSheets = workbook.SheetNames.filter(name => name.startsWith('Grade '));
      
      console.log("Grade sheets found:", gradeSheets); // Debug log
      
      if (gradeSheets.length > 0 && !extractedSchoolCode) {
        // Try each Grade sheet until we find one with a valid school code
        for (const gradeSheetName of gradeSheets) {
          const gradeSheet = workbook.Sheets[gradeSheetName];
          console.log("Checking grade sheet:", gradeSheetName); // Debug log
          
          // Check if A1 cell exists
          const schoolCodeCell = gradeSheet["A1"];
          console.log("A1 cell exists:", !!schoolCodeCell); // Debug log
          console.log("A1 cell content:", schoolCodeCell); // Debug log
          
          if (schoolCodeCell) {
            let rawValue: string = "";
            
            // Log all available properties
            console.log("Cell properties:", Object.keys(schoolCodeCell)); // Debug log
            
            // Try multiple approaches to get the cell value
            if (schoolCodeCell.w !== undefined) {
              rawValue = schoolCodeCell.w.toString();
              console.log("Using .w property:", rawValue); // Debug log
            } else if (schoolCodeCell.v !== undefined) {
              rawValue = schoolCodeCell.v.toString();
              console.log("Using .v property:", rawValue); // Debug log
            } else if (schoolCodeCell.r !== undefined) {
              rawValue = schoolCodeCell.r.toString();
              console.log("Using .r property:", rawValue); // Debug log
            } else if (schoolCodeCell.h !== undefined) {
              rawValue = schoolCodeCell.h.toString();
              console.log("Using .h property:", rawValue); // Debug log
            }
            
            console.log("Raw value before cleaning:", rawValue); // Debug log
            
            // Clean up the value
            if (rawValue && rawValue !== "undefined" && rawValue !== "") {
              // Remove leading apostrophe if present
              if (rawValue.startsWith("'")) {
                rawValue = rawValue.substring(1);
                console.log("Removed apostrophe:", rawValue); // Debug log
              }
              
              // Remove any whitespace
              rawValue = rawValue.trim();
              console.log("After trim:", rawValue); // Debug log
              
              // Extract only the first 4 digits from the cell content
              const matchedCode = rawValue.match(/^(\d{4})/);
              if (matchedCode && matchedCode[1] !== "0000") {
                extractedSchoolCode = matchedCode[1];
                console.log("Found valid school code from Grade sheet:", gradeSheetName, "Code:", extractedSchoolCode); // Debug log
                break; // Stop looking once we find a valid code
              } else {
                console.log("Invalid or default code (0000) found in sheet:", gradeSheetName, "Code:", matchedCode?.[1]); // Debug log
              }
            }
          }
        }
      }
      
      // If no school code found in Grade sheets, try the first sheet's A1
      if (!extractedSchoolCode) {
        console.log("No school code found in Grade sheets, trying first sheet..."); // Debug log
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const schoolCodeCell = firstSheet["A1"];
        
        if (schoolCodeCell && schoolCodeCell.v !== undefined) {
          extractedSchoolCode = schoolCodeCell.v.toString().trim();
          console.log("Found school code in first sheet:", extractedSchoolCode); // Debug log
        }
      }
      
      console.log("Final extracted school code:", extractedSchoolCode); // Debug log
      
      if (!extractedSchoolCode || extractedSchoolCode === "" || extractedSchoolCode === "undefined") {
        toast({
          title: "School Code Not Found",
          description: `School code not found in cell A1 of the first sheet. Please ensure the school code is properly entered in cell A1. Current value: ${extractedSchoolCode || "empty"}. Check browser console for detailed debugging information.`,
          variant: "destructive",
        });
        return;
      }
      
      // Grade mapping from sheet names to grade values
      const gradeMapping: Record<string, string> = {
        "Grade 4": "IV",
        "Grade 5": "V", 
        "Grade 6": "VI",
        "Grade 7": "VII",
        "Grade 8": "VIII",
        "IV": "IV",
        "V": "V",
        "VI": "VI", 
        "VII": "VII",
        "VIII": "VIII"
      };
      
      // Process each sheet
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) return;
        
        // Determine grade from sheet name
        const grade = gradeMapping[sheetName];
        if (!grade) {
          console.warn(`Unknown grade sheet: ${sheetName}`);
          return;
        }
        
        // Determine level based on grade
        const level = (grade === "IV" || grade === "V") ? "primary" : "middle";
        
        // Convert sheet to array of arrays
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
        if (rows.length < 2) return; // Skip if no data rows
        
        // Find the header row (should be row 1, index 0)
        const headers = rows[0].map((h: any) => 
          h ? h.toString().toLowerCase().replace(/[^a-z]/g, "") : ""
        );
        
        // Find column indices based on your Excel structure
        const columnIndices = {
          studentName: headers.findIndex((h: string) => 
            h.includes("fullstudentname") || h.includes("studentname") || h.includes("nameofthestudent")
          ),
          fatherName: headers.findIndex((h: string) => 
            h.includes("fullfathername") || h.includes("fathername")
          ),
          gender: headers.findIndex((h: string) => 
            h.includes("gender") || h.includes("gendermf")
          ),
          dateOfBirth: headers.findIndex((h: string) => 
            h.includes("dateofbirth") || h.includes("dob") || h.includes("dateofbirthddmmyyyy")
          ),
        };
        
        // Validate that all required columns are found
        const missingColumns = [];
        if (columnIndices.studentName === -1) missingColumns.push("Full Student Name");
        if (columnIndices.fatherName === -1) missingColumns.push("Full Father Name");
        if (columnIndices.gender === -1) missingColumns.push("Gender");
        if (columnIndices.dateOfBirth === -1) missingColumns.push("Date of Birth");
        
        if (missingColumns.length > 0) {
          console.warn(`Missing columns in ${sheetName}: ${missingColumns.join(", ")}`);
          return;
        }
        
        // Process data rows (skip header row)
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          
          // Skip empty rows
          if (!row || row.length === 0) continue;
          
          const studentName = row[columnIndices.studentName];
          const fatherName = row[columnIndices.fatherName];
          const gender = row[columnIndices.gender];
          const dateOfBirth = row[columnIndices.dateOfBirth];
          
          console.log(`Processing row ${i}:`, { studentName, fatherName, gender, dateOfBirth }); // Debug log
          
          // Skip rows with missing essential data
          if (!studentName || !fatherName || !gender || !dateOfBirth) {
            continue;
          }
          
          // Format date if it's an Excel date number
          let formattedDate = dateOfBirth;
          if (typeof dateOfBirth === 'number') {
            // Excel date to JavaScript date conversion
            const excelDate = new Date((dateOfBirth - 25569) * 86400 * 1000);
            formattedDate = excelDate.toISOString().split('T')[0]; // YYYY-MM-DD format for database
          } else if (typeof dateOfBirth === 'string') {
            // Parse DD/MM/YYYY format to YYYY-MM-DD
            const parts = dateOfBirth.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (parts) {
              const [_, day, month, year] = parts;
              formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          }
          
          console.log(`Date conversion: ${dateOfBirth} -> ${formattedDate}`); // Debug log
          
          allStudents.push({
            schoolCode: extractedSchoolCode,
            studentName: studentName.toString().trim(),
            fatherName: fatherName.toString().trim(),
            gender: gender.toString().trim().toUpperCase(),
            dateOfBirth: formattedDate.toString(),
            grade,
            level
          });
        }
      });
      
      if (allStudents.length === 0) {
        toast({
          title: "No Data Found",
          description: "No valid student data found in the Excel file. Please check the file format and try again.",
          variant: "destructive",
        });
        return;
      }
      
      console.log(`Found ${allStudents.length} students for school ${extractedSchoolCode}`); // Debug log
      
      // Import students to the API
      try {
        const response = await fetch(`/api/schools/${extractedSchoolCode}/students/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(allStudents)
        });
        
        if (response.ok) {
          const result = await response.json();
          const message = result.message || `Successfully imported ${result.count || 0} students from school ${extractedSchoolCode}!`;
          
          // Check for unregistered schools and show notifications
          if (result.unregisteredSchools && result.unregisteredSchools.length > 0) {
            result.unregisteredSchools.forEach((school: { schoolCode: string; skippedCount: number }) => {
              toast({
                title: "Unregistered School Detected",
                description: `School ${school.schoolCode} is not registered. ${school.skippedCount} students were skipped.`,
                variant: "destructive",
              });
            });
          }
          
          // Show success or info toast based on result
          if (result.count > 0) {
            toast({
              title: "Import Successful",
              description: message,
            });
          } else {
            toast({
              title: "Import Complete",
              description: message,
              variant: "default",
            });
          }
          
          // Refresh the students table if query client is available
          if (window && (window as any).queryClient) {
            (window as any).queryClient.invalidateQueries(["students"]);
          }
        } else {
          const error = await response.text();
          toast({
            title: "Import Failed",
            description: `Error importing students: ${error}`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Import error:", error);
        toast({
          title: "Import Error",
          description: `Error importing students: ${error}`,
          variant: "destructive",
        });
      }
    };
    
    reader.readAsBinaryString(file);
  };
  
  return (
    <label className="cursor-pointer inline-block bg-primary text-white px-4 py-2 rounded hover:bg-primary/90 transition-colors">
      Import Students from Excel
      <input 
        type="file" 
        accept=".xlsx,.xls" 
        className="hidden" 
        onChange={handleImport} 
      />
    </label>
  );
}

export default function StudentSetup() {
  // Use state to track the currently selected school code (from SchoolSetup or user input)
  const [activeSchoolCode, setActiveSchoolCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "registered" | "register" | "fees"
  >("registered");

  // State to store fees data from registration form
  const [feesData, setFeesData] = useState({
    primaryAmount: 0,
    middleAmount: 0,
    totalFee: 0,
    primaryCount: 0,
    middleCount: 0
  });

  // Function to update fees data (will be passed to StudentRegistrationForm)
  const updateFeesData = (data: typeof feesData) => {
    setFeesData(data);
  };
  
  // Function to navigate to fees tab
  const navigateToFeesTab = () => {
    setActiveTab("fees");
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-64">
        <Header />
        <main className="p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "registered" | "register" | "fees")}>
            <TabsList>
              <TabsTrigger value="registered">
                Registered Students
              </TabsTrigger>
              <TabsTrigger value="register">
                Student Registration Form
              </TabsTrigger>
              <TabsTrigger value="fees">Student Fees</TabsTrigger>
            </TabsList>
            <TabsContent value="registered">
              <div className="flex justify-between mb-4">
                <ImportStudentsButton schoolCode={activeSchoolCode} />
                <AddStudentDialog onStudentAdded={() => {
                  if (window && (window as any).queryClient) {
                    (window as any).queryClient.invalidateQueries(["students"]);
                  }
                }} />
              </div>
              <StudentsTable />
            </TabsContent>
            <TabsContent value="register">
              <StudentRegistrationForm 
                schoolCode={activeSchoolCode} 
                onFeesDataChange={updateFeesData}
                onNavigateToFees={navigateToFeesTab}
              />
            </TabsContent>
            <TabsContent value="fees">
              <StudentFeesForm 
                schoolCode={activeSchoolCode} 
                feesData={feesData}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}