import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Edit, Trash2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DraftSchool } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface DraftsListProps {
  onEdit?: (schoolCode: string) => void;
}

export default function DraftsList({ onEdit }: DraftsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schools, isLoading } = useQuery<DraftSchool[]>({
    queryKey: ["/api/drafts/schools"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (schoolCode: string) => {
      await apiRequest("DELETE", `/api/drafts/school/${schoolCode}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/drafts/schools"] });
      toast({
        title: "Success",
        description: "Draft deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (schoolCode: string) => {
    onEdit?.(schoolCode);
  };

  const handleDelete = (schoolCode: string) => {
    if (confirm("Are you sure you want to delete this draft?")) {
      deleteMutation.mutate(schoolCode);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const totalPages = schools ? Math.ceil(schools.length / itemsPerPage) : 0;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentSchools = schools ? schools.slice(indexOfFirstItem, indexOfLastItem) : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="bg-amber-50 border-b">
        <CardTitle className="flex items-center text-amber-800">
          <FileText className="w-5 h-5 mr-2" />
          Draft Registrations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {schools && schools.length > 0 ? (
          <div>
            <div className="flex items-center mb-4 p-3 bg-blue-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-sm text-blue-700">
                You have {schools.length} draft registration{schools.length > 1 ? 's' : ''} in progress. 
                Click "Continue" to resume editing or complete the registration.
              </p>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Code</TableHead>
                  <TableHead>School Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSchools.map((school) => (
                  <TableRow key={school.schoolCode}>
                    <TableCell className="font-medium">{school.schoolCode}</TableCell>
                    <TableCell>{school.schoolName}</TableCell>
                    <TableCell>
                      {new Date(school.createdAt!).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                        Draft
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handleEdit(school.schoolCode)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Continue
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-900"
                          onClick={() => handleDelete(school.schoolCode)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4 flex justify-between items-center">
              <Button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1} variant="outline" size="sm">
                Previous
              </Button>
              <span>Page {currentPage} of {totalPages}</span>
              <Button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No draft registrations found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}