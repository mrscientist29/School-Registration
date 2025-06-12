import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, Eye, Edit, Trash2, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { School } from "@shared/schema";

interface SchoolsListProps {
  onNext?: (schoolCode?: string) => void;
}

export default function SchoolsList({ onNext }: SchoolsListProps) {
  const { toast } = useToast();

  const { data: schools, isLoading } = useQuery<School[]>({
    queryKey: ["/api/schools"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (schoolCode: string) => {
      await apiRequest("DELETE", `/api/schools/${schoolCode}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
      toast({
        title: "Success",
        description: "School deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete school",
        variant: "destructive",
      });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (schoolCode: string) => {
      await apiRequest("PATCH", `/api/schools/${schoolCode}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
      toast({
        title: "Success",
        description: "School status updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update school status",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (schoolCode: string) => {
    if (confirm("Are you sure you want to delete this school?")) {
      deleteMutation.mutate(schoolCode);
    }
  };

  const handleToggleStatus = (schoolCode: string) => {
    toggleMutation.mutate(schoolCode);
  };

  const handleEdit = (schoolCode: string) => {
    onNext?.(schoolCode);
  };

  const handleNewRegistration = () => {
    onNext?.();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center">
          <BookOpen className="w-6 h-6 mr-3" />
          <h3 className="text-lg font-semibold">School Setup</h3>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            size="sm"
            className="bg-white text-primary hover:bg-gray-50"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="bg-primary-dark text-white hover:bg-primary"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to Excel
          </Button>
        </div>
      </div>

      <CardContent className="p-6">
        {/* Guidelines Section */}
        <div className="mb-6 border-b border-gray-200 pb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Important Guidelines:</h4>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
            <li>Schools can register for the AKU-EB Primary and Middle School Programmes (PSP/MSP) by submitting a completed School Registration Form along with the required fee mentioned below.</li>
            <li>Once registered, schools must submit a Candidate Registration Form, including details for each student, accompanied by the applicable fees.</li>
            <li>Registered schools will receive an Orientation Pack, which includes:
              <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                <li>Student Booklets for each student</li>
                <li>Classroom Implementation Guide for Teachers</li>
                <li>Assessment Tools and other supporting materials</li>
              </ul>
            </li>
            <li>Students must complete a minimum of three projects at the Middle School level and two projects at the Primary School level within one academic year. They are also required to develop a personal portfolio showcasing their work.</li>
            <li>Teachers will assess students based on their demonstration of 21st-century competencies using a standardised rubric. Schools must submit the rubric scores to AKU-EB using the Excel Score Sheet provided.</li>
            <li>At the end of the academic session, schools will participate in an Annual Teachers Meeting, where a representative sample of student portfolios, identified by AKU-EB, will be reviewed.</li>
            <li>Upon successful completion of the PSP/MSP academic session, AKU-EB will issue a Personal Accomplishment Record for each student.</li>
          </ul>
        </div>

        {/* Schools Table */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Schools</h4>
          {schools && schools.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Code</TableHead>
                  <TableHead>School Name</TableHead>
                  <TableHead>Contact Numbers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => (
                  <TableRow key={school.schoolCode}>
                    <TableCell className="font-medium">{school.schoolCode}</TableCell>
                    <TableCell>{school.schoolName}</TableCell>
                    <TableCell>{school.contactNumbers}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          school.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {school.isActive ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-600 hover:text-green-900"
                          onClick={() => handleEdit(school.schoolCode)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(school.schoolCode)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(school.schoolCode)}
                        >
                          {school.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No schools registered yet.</p>
              <p className="text-sm mb-4">Start by registering a new school.</p>
              <Button 
                onClick={handleNewRegistration}
                className="bg-primary hover:bg-primary-dark text-white"
              >
                Start School Registration
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
