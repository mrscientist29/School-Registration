import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Edit } from "lucide-react";

interface EditStudentDialogProps {
  student: {
    id: number;
    studentId: string;
    schoolCode: string;
    studentName: string;
    fatherName: string;
    gender: string;
    grade: string;
    dateOfBirth: string;
  };
  onStudentUpdated?: () => void;
}

export default function EditStudentDialog({ student, onStudentUpdated }: EditStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      studentName: student.studentName,
      fatherName: student.fatherName,
      gender: student.gender,
      grade: student.grade,
      dateOfBirth: new Date(student.dateOfBirth).toISOString().split('T')[0], // Format for date input
    }
  });

  // Reset form when student changes
  useEffect(() => {
    reset({
      studentName: student.studentName,
      fatherName: student.fatherName,
      gender: student.gender,
      grade: student.grade,
      dateOfBirth: new Date(student.dateOfBirth).toISOString().split('T')[0],
    });
  }, [student, reset]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/students/${student.studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: data.studentName,
          fatherName: data.fatherName,
          gender: data.gender,
          grade: data.grade,
          dateOfBirth: data.dateOfBirth,
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Student Updated",
          description: `Successfully updated ${data.studentName}'s information.`,
        });
        setOpen(false);
        onStudentUpdated?.();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast({
          title: "Failed to Update Student",
          description: errorData.message || `Failed to update student. Please check the form and try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Error",
        description: `An error occurred while updating the student: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold text-sm">Student ID</label>
              <Input value={student.studentId} readOnly className="bg-gray-50" />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">School Code</label>
              <Input value={student.schoolCode} readOnly className="bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-sm">Full Name of Student</label>
            <Controller
              name="studentName"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Input {...field} placeholder="Full Name of Student" required />
              )}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold text-sm">Full Name of Father</label>
            <Controller
              name="fatherName"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Input {...field} placeholder="Full Name of Father" required />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-semibold text-sm">Gender</label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <select {...field} className="w-full border rounded p-2">
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                )}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm">Grade</label>
              <Controller
                name="grade"
                control={control}
                render={({ field }) => (
                  <select {...field} className="w-full border rounded p-2">
                    <option value="IV">Grade IV</option>
                    <option value="V">Grade V</option>
                    <option value="VI">Grade VI</option>
                    <option value="VII">Grade VII</option>
                    <option value="VIII">Grade VIII</option>
                  </select>
                )}
              />
            </div>
          </div>
          <div>
            <label className="block mb-1 font-semibold text-sm">Date of Birth</label>
            <Controller
              name="dateOfBirth"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Input {...field} type="date" required />
              )}
            />
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost">Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary text-white" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
