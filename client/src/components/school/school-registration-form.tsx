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
}

export default function SchoolRegistrationForm({ 
  onNext, 
  onPrevious, 
  schoolCode 
}: SchoolRegistrationFormProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // Load existing draft if schoolCode is provided
  const { data: existingDraft } = useQuery<DraftSchool>({
    queryKey: ["/api/drafts/school", schoolCode],
    enabled: !!schoolCode,
  });

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

  // Load existing data into form
  useEffect(() => {
    if (existingDraft) {
      setIsEditing(true);
      const formData = {
        schoolCode: existingDraft.schoolCode || "",
        schoolName: existingDraft.schoolName || "",
        schoolAddress: existingDraft.schoolAddress || "",
        contactNumbers: existingDraft.contactNumbers || "",
        schoolType: existingDraft.schoolType || "",
        academicYearStart: existingDraft.academicYearStart || "",
        academicYearEnd: existingDraft.academicYearEnd || "",
        gradeLevelFrom: existingDraft.gradeLevelFrom || "",
        gradeLevelTill: existingDraft.gradeLevelTill || "",
        languages: Array.isArray(existingDraft.languages) ? existingDraft.languages : [],
        otherLanguage: existingDraft.otherLanguage || "",
        principalName: existingDraft.principalName || "",
        principalEmail: existingDraft.principalEmail || "",
        principalCell: existingDraft.principalCell || "",
        primaryCoordinatorName: existingDraft.primaryCoordinatorName || "",
        primaryCoordinatorEmail: existingDraft.primaryCoordinatorEmail || "",
        primaryCoordinatorCell: existingDraft.primaryCoordinatorCell || "",
        middleCoordinatorName: existingDraft.middleCoordinatorName || "",
        middleCoordinatorEmail: existingDraft.middleCoordinatorEmail || "",
        middleCoordinatorCell: existingDraft.middleCoordinatorCell || "",
        gradeIV: existingDraft.gradeIV || 0,
        gradeV: existingDraft.gradeV || 0,
        gradeVI: existingDraft.gradeVI || 0,
        gradeVII: existingDraft.gradeVII || 0,
        gradeVIII: existingDraft.gradeVIII || 0,
        pspMspRegistration: Array.isArray(existingDraft.pspMspRegistration) ? existingDraft.pspMspRegistration : [],
      };
      form.reset(formData);
    }
  }, [existingDraft, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/drafts/school", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "School draft saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save school draft",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    const data = form.getValues();
    saveMutation.mutate(data);
  };

  const handleNext = () => {
    const data = form.getValues();
    if (!data.schoolCode || !data.schoolName) {
      toast({
        title: "Error",
        description: "Please fill in at least School Code and School Name",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate(data, {
      onSuccess: () => {
        onNext?.(data.schoolCode);
      },
    });
  };

  const languageOptions = ["english", "urdu", "other"];
  const gradeOptions = ["gradeIV", "gradeV", "gradeVI", "gradeVII", "gradeVIII"];

  return (
    <Card>
      <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex items-center">
        <BookOpen className="w-6 h-6 mr-3" />
        <h3 className="text-lg font-semibold">
          Step 1: {isEditing ? "Edit" : "Register New"} School
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
                      <Input placeholder="Enter school code" {...field} />
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
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={saveMutation.isPending}
                >
                  Save Draft
                </Button>
                <Button 
                  type="button" 
                  onClick={handleNext}
                  disabled={saveMutation.isPending}
                  className="bg-primary-dark hover:bg-primary"
                >
                  Next: Resources and Support
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
