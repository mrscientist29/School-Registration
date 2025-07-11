import { useQuery } from "@tanstack/react-query";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import EditStudentDialog from "@/components/EditStudentDialog";

export function StudentsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 15;
  
  const { data: students, isLoading, error, refetch } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const res = await fetch(`/api/students`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  const handleStudentUpdated = () => {
    refetch();
  };

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!students || !searchTerm.trim()) return students || [];
    
    const term = searchTerm.toLowerCase().trim();
    return students.filter((student: any) => 
      student.studentId?.toLowerCase().includes(term) ||
      student.studentName?.toLowerCase().includes(term) ||
      student.fatherName?.toLowerCase().includes(term) ||
      student.schoolCode?.toLowerCase().includes(term) ||
      student.schoolName?.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  // Calculate pagination
  const totalStudents = filteredStudents.length;
  const totalPages = Math.ceil(totalStudents / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const endIndex = startIndex + studentsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isLoading) return <div>Loading students...</div>;
  if (error) return <div className="text-red-500">Failed to load students.</div>;
  if (!students || students.length === 0) return <div className="text-gray-500">No students found.</div>;

  return (
    <div className="space-y-4">
      <div className="w-full max-w-md">
        <Input
          type="text"
          placeholder="Search by Student ID, Name, Father Name, or School..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      {filteredStudents.length === 0 && searchTerm ? (
        <div className="text-gray-500 text-center py-8">No students found matching "{searchTerm}"</div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing {startIndex + 1} to {Math.min(endIndex, totalStudents)} of {totalStudents} students
            </span>
            {totalPages > 1 && (
              <span>Page {currentPage} of {totalPages}</span>
            )}
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student ID</TableHead>
                <TableHead>School Code</TableHead>
                <TableHead>School Name</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Father Name</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell className="font-mono text-sm">{s.studentId || <span className="text-gray-400 italic">N/A</span>}</TableCell>
                  <TableCell>{s.schoolCode}</TableCell>
                  <TableCell>{s.schoolName || <span className="text-gray-400 italic">Unknown</span>}</TableCell>
                  <TableCell>{s.studentName}</TableCell>
                  <TableCell>{s.fatherName}</TableCell>
                  <TableCell>{s.gender}</TableCell>
                  <TableCell>{s.grade || <span className="text-gray-400 italic">N/A</span>}</TableCell>
                  <TableCell>{new Date(s.dateOfBirth).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <EditStudentDialog 
                      student={s} 
                      onStudentUpdated={handleStudentUpdated}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {totalPages > 1 && (
            <Pagination className="justify-center">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  // Show first page, last page, current page, and pages around current page
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  // Show ellipsis
                  if (
                    (page === currentPage - 2 && currentPage > 3) ||
                    (page === currentPage + 2 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <span className="flex h-9 w-9 items-center justify-center text-sm">...</span>
                      </PaginationItem>
                    );
                  }
                  
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
