import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertDraftSchoolSchema, type InsertDraftSchool, type DraftSchool } from "@shared/schema";
import { z } from "zod";

const formSchema = insertDraftSchoolSchema.extend({
  languages: z.array(z.string()).optional(),
  pspMspRegistration: z.array(z.string()).optional(),
});

type FormData = z.infer<typeof formSchema>;

interface SchoolRegistrationFormProps {
  onNext?: (schoolCode?: string) => void;
  onPrevious?: () => void;
  schoolCode?: string;
  isEditMode?: boolean;
}

export default function SchoolRegistrationForm({ 
  onNext, 
  onPrevious, 
  schoolCode,
  isEditMode = false
}: SchoolRegistrationFormProps) {
  console.log('Form mode:', {isEditMode, schoolCode});
  
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isRegisteredSchool, setIsRegisteredSchool] = useState(false);

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

  // Initialize form with defaults
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schoolCode: "",
      schoolName: "",
      schoolAddress: "",
      contactNumbers: "",
      schoolType: "",
      academicYearStart: "",
      academicYearEnd: "",
      gradeLevelFrom: "",
      gradeLevelTill: "",
      languages: [],
      otherLanguage: "",
      principalName: "",
      principalEmail: "",
      principalCell: "",
      primaryCoordinatorName: "",
      primaryCoordinatorEmail: "",
      primaryCoordinatorCell: "",
      middleCoordinatorName: "",
      middleCoordinatorEmail: "",
      middleCoordinatorCell: "",
      gradeIV: 0,
      gradeV: 0,
      gradeVI: 0,
      gradeVII: 0,
      gradeVIII: 0,
      pspMspRegistration: [],
    },
  });

  // Edit Mode: Fetch from /api/schools
  const { data: schoolData, isLoading: isSchoolLoading } = useQuery<DraftSchool | null>({
    queryKey: ['school', schoolCode],
    enabled: isFinalized && !!schoolCode,
    queryFn: async () => {
      const response = await fetch(`/api/schools/${schoolCode}`);
      if (!response.ok) throw new Error('School not found');
      return await response.json();
    },
    retry: false
  });

  // Draft Mode: Fetch from /api/drafts
  const { data: draftData, isLoading: isDraftLoading } = useQuery<DraftSchool | null>({
    queryKey: ['draft', schoolCode],
    enabled: !isFinalized && !!schoolCode,
    queryFn: async () => {
      try {
        const response = await fetch(`/api/drafts/school/${schoolCode}`);
        return response.ok ? await response.json() : null;
      } catch {
        return null;
      }
    },
    retry: false
  });

  // Initialize form with appropriate data
  useEffect(() => {
    if (isFinalized && schoolData) {
      form.reset(schoolData);
    } else if (!isFinalized && draftData) {
      form.reset(draftData);
    } else if (schoolCode) {
      form.setValue('schoolCode', schoolCode);
    }
  }, [schoolData, draftData, schoolCode, isFinalized, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('Saving data:', data, 'isFinalized:', isFinalized);
      
      if (isFinalized) {
        // Edit mode: PATCH to /api/schools
        const response = await fetch(`/api/schools/${data.schoolCode}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to update school');
        return await response.json();
      } else {
        // Draft mode: POST to /api/drafts/school
        const payload = {
          ...data,
          schoolCode: schoolCode || data.schoolCode // Ensure schoolCode is included
        };
        console.log('Draft payload:', payload);
        
        const response = await fetch(`/api/drafts/school`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Draft save failed:', response.status, errorText);
          throw new Error(`Failed to save draft: ${response.status}`);
        }
        return await response.json();
      }
    },
    onSuccess: (result, variables) => {
      console.log('Save successful:', result);
      toast({
        title: "Success",
        description: isFinalized 
          ? "School updated successfully" 
          : "School draft saved successfully",
      });
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await saveMutation.mutateAsync(data);
      if (isFinalized) {
        // In edit mode, navigate to resources after successful update
        onNext?.();
      } else {
        // In draft mode, show success and optionally proceed
        toast({ 
          title: "Success", 
          description: "Draft values saved successfully" 
        });
        onNext?.(data.schoolCode);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Operation failed",
        variant: "destructive"
      });
    }
  });

  const handleSaveDraft = async () => {
    const data = form.getValues();
    console.log('Saving draft with data:', data);
    
    // Basic validation for draft
    if (!data.schoolCode && !schoolCode) {
      toast({
        title: "Error",
        description: "School Code is required to save draft",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await saveMutation.mutateAsync(data);
    } catch (error) {
      // Error handling is done in the mutation
    }
  };

  if (isSchoolLoading || isDraftLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  const languageOptions = ["english", "urdu", "other"];
  const gradeOptions = ["gradeIV", "gradeV", "gradeVI", "gradeVII", "gradeVIII"];

  return (
    <Card>
      <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex items-center">
        <BookOpen className="w-6 h-6 mr-3" />
        <h3 className="text-lg font-semibold">
          Step 1: {isFinalized ? "Edit" : "Register New"} School
        </h3>
      </div>

      <CardContent className="p-6">
        <Form {...form}>
          <form className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="schoolName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter school name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="schoolCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Code</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter school code" 
                        {...field} 
                        disabled={!!schoolCode} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="schoolAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>School Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter school address" rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactNumbers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Numbers</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter contact numbers" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* School Type and Academic Year */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="schoolType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of School</FormLabel>
                    <FormControl>
                      <RadioGroup value={field.value} onValueChange={field.onChange}>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="boys" id="boys" />
                          <label htmlFor="boys" className="text-sm">Boys</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="girls" id="girls" />
                          <label htmlFor="girls" className="text-sm">Girls</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="coeducational" id="coed" />
                          <label htmlFor="coed" className="text-sm">Co-educational</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="academicYearStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year Start (Month)</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "january", "february", "march", "april", "may", "june",
                            "july", "august", "september", "october", "november", "december"
                          ].map(month => (
                            <SelectItem key={month} value={month}>
                              {month.charAt(0).toUpperCase() + month.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="academicYearEnd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year End (Month)</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "january", "february", "march", "april", "may", "june",
                            "july", "august", "september", "october", "november", "december"
                          ].map(month => (
                            <SelectItem key={month} value={month}>
                              {month.charAt(0).toUpperCase() + month.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Grade Levels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="gradeLevelFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level From</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nursery">Nursery</SelectItem>
                          <SelectItem value="kg">KG</SelectItem>
                          <SelectItem value="1">Grade 1</SelectItem>
                          <SelectItem value="2">Grade 2</SelectItem>
                          <SelectItem value="3">Grade 3</SelectItem>
                          <SelectItem value="4">Grade 4</SelectItem>
                          <SelectItem value="5">Grade 5</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gradeLevelTill"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade Level Till</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select grade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">Grade 5</SelectItem>
                          <SelectItem value="6">Grade 6</SelectItem>
                          <SelectItem value="7">Grade 7</SelectItem>
                          <SelectItem value="8">Grade 8</SelectItem>
                          <SelectItem value="9">Grade 9</SelectItem>
                          <SelectItem value="10">Grade 10</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Languages */}
            <FormField
              control={form.control}
              name="languages"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Languages of Instruction</FormLabel>
                  <div className="space-y-2">
                    {languageOptions.map((language) => (
                      <div key={language} className="flex items-center space-x-2">
                        <Checkbox
                          checked={field.value?.includes(language)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            if (checked) {
                              field.onChange([...current, language]);
                            } else {
                              field.onChange(current.filter(l => l !== language));
                            }
                          }}
                        />
                        <label className="text-sm capitalize">{language}</label>
                      </div>
                    ))}
                  </div>
                  <FormField
                    control={form.control}
                    name="otherLanguage"
                    render={({ field: otherField }) => (
                      <FormControl>
                        <Input 
                          placeholder="If other, specify" 
                          className="mt-2"
                          {...otherField} 
                        />
                      </FormControl>
                    )}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contact Information */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="principalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter principal name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="principalEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter principal email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <FormField
                  control={form.control}
                  name="principalCell"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Principal Cell No</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter principal cell number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryCoordinatorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary School Coordinator Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter coordinator name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <FormField
                  control={form.control}
                  name="primaryCoordinatorEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary School Coordinator Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter coordinator email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="primaryCoordinatorCell"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary School Coordinator Cell No</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter coordinator cell number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <FormField
                  control={form.control}
                  name="middleCoordinatorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle School Coordinator Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter coordinator name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="middleCoordinatorEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle School Coordinator Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter coordinator email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="middleCoordinatorCell"
                  render={({ field }) => (
                    <FormItem className="md:w-1/2">
                      <FormLabel>Middle School Coordinator Cell No</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Enter coordinator cell number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Student Enrollment */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Number of Students Enrolled</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { name: "gradeIV", label: "Grade IV" },
                  { name: "gradeV", label: "Grade V" },
                  { name: "gradeVI", label: "Grade VI" },
                  { name: "gradeVII", label: "Grade VII" },
                  { name: "gradeVIII", label: "Grade VIII" },
                ].map((grade) => (
                  <FormField
                    key={grade.name}
                    control={form.control}
                    name={grade.name as keyof FormData}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{grade.label}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            {/* PSP/MSP Registration */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">PSP/MSP Registration (select all that apply)</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {gradeOptions.map((grade) => {
                  const label = grade.replace("grade", "Grade ");
                  return (
                    <FormField
                      key={grade}
                      control={form.control}
                      name="pspMspRegistration"
                      render={({ field }) => (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={field.value?.includes(grade)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, grade]);
                              } else {
                                field.onChange(current.filter(g => g !== grade));
                              }
                            }}
                          />
                          <label className="text-sm">{label}</label>
                        </div>
                      )}
                    />
                  );
                })}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="secondary"
                onClick={onPrevious}
                disabled={!onPrevious}
              >
                Previous: School Registration
              </Button>
              <div className="space-x-3">
                {!isFinalized && (
                  <Button 
                    type="button" 
                    variant="outline"
                    disabled={saveMutation.isPending}
                    onClick={handleSaveDraft}
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save Draft'}
                  </Button>
                )}
                <Button 
                  type="submit"
                  disabled={saveMutation.isPending}
                  onClick={handleSubmit}
                  className="bg-primary-dark hover:bg-primary"
                >
                  {isFinalized ? (saveMutation.isPending ? 'Updating...' : 'Update School') : (saveMutation.isPending ? 'Submitting...' : 'Next: Resources')}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}