import { useForm, Controller } from "react-hook-form";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import type { School } from "@shared/schema";
import { useState } from "react";

interface AddStudentDialogProps {
  onStudentAdded?: () => void;
}

export default function AddStudentDialog({ onStudentAdded }: AddStudentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { data: schools, isLoading } = useQuery<School[]>({ queryKey: ["/api/schools"] });
  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      schoolCode: "",
      studentName: "",
      fatherName: "",
      gender: "M",
      grade: "IV",
      dateOfBirth: "",
    }
  });

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/schools/${data.schoolCode}/students`, {
        method: "POST",
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
          title: "Student Added",
          description: `Successfully added ${data.studentName} to the system.`,
        });
        setOpen(false);
        reset();
        onStudentAdded?.();
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        toast({
          title: "Failed to Add Student",
          description: errorData.message || `Failed to add student. Please check the form and try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error adding student:', error);
      toast({
        title: "Error",
        description: `An error occurred while adding the student: ${error}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add Student</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Select School</label>
            <Controller
              name="schoolCode"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <select {...field} className="w-full border rounded p-2" required>
                  <option value="" disabled>Select a school</option>
                  {schools?.map(s => (
                    <option key={s.schoolCode} value={s.schoolCode}>{s.schoolName}</option>
                  ))}
                </select>
              )}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Full Name of Student</label>
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
            <label className="block mb-1 font-semibold">Full Name of Father</label>
            <Controller
              name="fatherName"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Input {...field} placeholder="Full Name of Father" required />
              )}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Gender</label>
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
            <label className="block mb-1 font-semibold">Grade</label>
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
          <div>
            <label className="block mb-1 font-semibold">Date of Birth</label>
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
              {isSubmitting ? "Adding..." : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
