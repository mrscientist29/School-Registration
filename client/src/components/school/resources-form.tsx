import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertDraftResourcesSchema, type InsertDraftResources, type DraftResources } from "@shared/schema";
import { z } from "zod";

const formSchema = insertDraftResourcesSchema.extend({
  facilities: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ResourcesFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
  schoolCode?: string;
  isEditMode?: boolean;
}

export default function ResourcesForm({ 
  onNext, 
  onPrevious, 
  schoolCode, 
  isEditMode = false
}: ResourcesFormProps) {
  const { toast } = useToast();

  // Check if school is registered
  const { data: isRegistered } = useQuery<boolean>({
    queryKey: ['school-registered', schoolCode],
    enabled: !!schoolCode,
    queryFn: async () => {
      const response = await fetch(`/api/schools/${schoolCode}`);
      return response.ok;
    }
  });

  // Determine final mode (edit if registered or forced via prop)
  const isFinalized = isRegistered || isEditMode;

  // Load existing data
  const { data: existingData } = useQuery<DraftResources | null>({
    queryKey: [isFinalized ? "schools/resources" : "drafts/resources", schoolCode],
    enabled: !!schoolCode,
    queryFn: async () => {
      const endpoint = isFinalized 
        ? `/api/schools/${schoolCode}/resources`
        : `/api/drafts/resources/${schoolCode}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) return null;
      return await response.json();
    },
    retry: false
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schoolCode: schoolCode || "",
      primaryTeachers: 0,
      middleTeachers: 0,
      undergraduateTeachers: 0,
      graduateTeachers: 0,
      postgraduateTeachers: 0,
      educationDegreeTeachers: 0,
      totalWeeks: 0,
      weeklyPeriods: 0,
      periodDuration: 0,
      maxStudents: 0,
      facilities: [],
      otherFacility1: "",
      otherFacility2: "",
      otherFacility3: "",
    },
  });

  // Initialize form with appropriate data
  useEffect(() => {
    if (existingData) {
      form.reset({
        schoolCode: existingData.schoolCode || schoolCode || "",
        primaryTeachers: existingData.primaryTeachers || 0,
        middleTeachers: existingData.middleTeachers || 0,
        undergraduateTeachers: existingData.undergraduateTeachers || 0,
        graduateTeachers: existingData.graduateTeachers || 0,
        postgraduateTeachers: existingData.postgraduateTeachers || 0,
        educationDegreeTeachers: existingData.educationDegreeTeachers || 0,
        totalWeeks: existingData.totalWeeks || 0,
        weeklyPeriods: existingData.weeklyPeriods || 0,
        periodDuration: existingData.periodDuration || 0,
        maxStudents: existingData.maxStudents || 0,
        facilities: Array.isArray(existingData.facilities) ? existingData.facilities : [],
        otherFacility1: existingData.otherFacility1 || "",
        otherFacility2: existingData.otherFacility2 || "",
        otherFacility3: existingData.otherFacility3 || "",
      });
    } else if (schoolCode) {
      form.setValue("schoolCode", schoolCode);
    }
  }, [existingData, schoolCode, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const endpoint = isFinalized
        ? `/api/schools/${data.schoolCode}/resources`
        : '/api/drafts/resources';
      const method = isFinalized ? 'PATCH' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          schoolCode: schoolCode
        }),
      });

      if (!response.ok) {
        throw new Error(isFinalized ? 'Failed to update resources' : 'Failed to save draft');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isFinalized
          ? "Resources updated successfully"
          : "Resources draft saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit((data) => {
    saveMutation.mutate(data, {
      onSuccess: () => {
        if (isFinalized && onNext) {
          onNext();
        }
      }
    });
  });

  const handleSaveDraft = () => {
    const data = form.getValues();
    saveMutation.mutate(data);
  };

  const handleNext = () => {
    const data = form.getValues();
    if (!data.schoolCode) {
      toast({
        title: "Error",
        description: "School code is required",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(data, {
      onSuccess: () => {
        onNext?.();
      },
    });
  };

  const facilityOptions = [
    { value: "library", label: "Library" },
    { value: "computer-lab", label: "Computer Laboratory" },
    { value: "internet", label: "Internet Connection" },
    { value: "science-labs", label: "Science Laboratories" },
    { value: "staff-room", label: "Staff Room" },
    { value: "playground", label: "Playground" },
    { value: "multimedia", label: "Multimedia/ Audio-Visual Room" },
    { value: "washrooms", label: "Washrooms" },
    { value: "water", label: "Clean Drinking Water" },
  ];

  return (
    <Card>
      <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex items-center">
        <BookOpen className="w-6 h-6 mr-3" />
        <h3 className="text-lg font-semibold">Step 2: Resources and Support</h3>
      </div>

      <CardContent className="p-6">
        <Form {...form}>
          <form className="space-y-6">
            {/* Teacher Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="primaryTeachers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total number of teachers in the Primary School Level</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="middleTeachers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total number of teachers in the Middle School Level</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter number" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Teacher Qualifications */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Highest Qualification of the Teachers</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Qualification</TableHead>
                    <TableHead className="text-center w-32">Number of Teachers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Undergraduate/ Bachelor's</TableCell>
                    <TableCell className="text-center">
                      <FormField
                        control={form.control}
                        name="undergraduateTeachers"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            className="w-20 text-center" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        )}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Graduate/ Master's</TableCell>
                    <TableCell className="text-center">
                      <FormField
                        control={form.control}
                        name="graduateTeachers"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            className="w-20 text-center" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        )}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Postgraduate/ MPhil/ PhD</TableCell>
                    <TableCell className="text-center">
                      <FormField
                        control={form.control}
                        name="postgraduateTeachers"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            className="w-20 text-center" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        )}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Degree in Education (B.Ed., M.Ed., etc.)</TableCell>
                    <TableCell className="text-center">
                      <FormField
                        control={form.control}
                        name="educationDegreeTeachers"
                        render={({ field }) => (
                          <Input 
                            type="number" 
                            className="w-20 text-center" 
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        )}
                      />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            {/* Timetable Structure */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Structure of the Timetable</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="totalWeeks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total weeks of instruction in the school's academic year</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weeklyPeriods"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total instructional periods students receive in a week</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <FormField
                  control={form.control}
                  name="periodDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration of each instructional period (in minutes)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxStudents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum number of students in a class</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter number" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Facilities */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                Facilities available at the school (check all that is applicable)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-3">
                  {facilityOptions.slice(0, 3).map((facility) => (
                    <FormField
                      key={facility.value}
                      control={form.control}
                      name="facilities"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(facility.value)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, facility.value]);
                              } else {
                                field.onChange(current.filter(f => f !== facility.value));
                              }
                            }}
                          />
                          <label className="text-sm">{facility.label}</label>
                        </div>
                      )}
                    />
                  ))}
                  <div className="flex items-center space-x-2">
                    <Checkbox />
                    <span className="text-sm">Other</span>
                    <FormField
                      control={form.control}
                      name="otherFacility1"
                      render={({ field }) => (
                        <Input 
                          className="flex-1 text-xs" 
                          placeholder="Specify" 
                          {...field} 
                        />
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  {facilityOptions.slice(3, 6).map((facility) => (
                    <FormField
                      key={facility.value}
                      control={form.control}
                      name="facilities"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(facility.value)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, facility.value]);
                              } else {
                                field.onChange(current.filter(f => f !== facility.value));
                              }
                            }}
                          />
                          <label className="text-sm">{facility.label}</label>
                        </div>
                      )}
                    />
                  ))}
                  <div className="flex items-center space-x-2">
                    <Checkbox />
                    <span className="text-sm">Other</span>
                    <FormField
                      control={form.control}
                      name="otherFacility2"
                      render={({ field }) => (
                        <Input 
                          className="flex-1 text-xs" 
                          placeholder="Specify" 
                          {...field} 
                        />
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  {facilityOptions.slice(6).map((facility) => (
                    <FormField
                      key={facility.value}
                      control={form.control}
                      name="facilities"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(facility.value)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, facility.value]);
                              } else {
                                field.onChange(current.filter(f => f !== facility.value));
                              }
                            }}
                          />
                          <label className="text-sm">{facility.label}</label>
                        </div>
                      )}
                    />
                  ))}
                  <div className="flex items-center space-x-2">
                    <Checkbox />
                    <span className="text-sm">Other</span>
                    <FormField
                      control={form.control}
                      name="otherFacility3"
                      render={({ field }) => (
                        <Input 
                          className="flex-1 text-xs" 
                          placeholder="Specify" 
                          {...field} 
                        />
                      )}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="secondary"
                onClick={onPrevious}
              >
                Previous: School Registration
              </Button>
              <div className="space-x-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isFinalized}
                  className="mr-2"
                >
                  Save Draft
                </Button>
                <Button 
                  type="button" 
                  onClick={handleNext}
                  disabled={saveMutation.isPending}
                  className="bg-primary-dark hover:bg-primary"
                >
                  Next: Fees
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
