import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { BookOpen, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { insertDraftFeesSchema, type InsertDraftFees, type DraftFees } from "@shared/schema";
import { z } from "zod";

const formSchema = insertDraftFeesSchema.extend({
  chequeDate: z.date().nullable().optional(),
});

const completionSchema = formSchema.extend({
  disclaimerAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the disclaimer to complete registration",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface FeesFormProps {
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => void;
  schoolCode?: string;
}

export default function FeesForm({ 
  onNext, 
  onPrevious, 
  onComplete,
  schoolCode 
}: FeesFormProps) {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);

  // Load existing draft if schoolCode is provided
  const { data: existingDraft } = useQuery<DraftFees>({
    queryKey: ["/api/drafts/fees", schoolCode],
    enabled: !!schoolCode,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      schoolCode: schoolCode || "",
      paymentMethod: "cheque",
      chequeNumber: "",
      chequeDate: null,
      amount: "20000.00",
      headOfInstitution: "",
      disclaimerAccepted: false,
      headSignature: "",
      institutionStamp: "",
    },
  });

  // Load existing data into form
  useEffect(() => {
    if (existingDraft) {
      const formData = {
        schoolCode: existingDraft.schoolCode,
        paymentMethod: existingDraft.paymentMethod || "cheque",
        chequeNumber: existingDraft.chequeNumber || "",
        chequeDate: existingDraft.chequeDate ? new Date(existingDraft.chequeDate) : null,
        amount: existingDraft.amount?.toString() || "20000.00",
        headOfInstitution: existingDraft.headOfInstitution || "",
        disclaimerAccepted: Boolean(existingDraft.disclaimerAccepted),
        headSignature: existingDraft.headSignature || "",
        institutionStamp: existingDraft.institutionStamp || "",
      };
      form.reset(formData);
    } else if (schoolCode) {
      form.setValue("schoolCode", schoolCode);
    }
  }, [existingDraft, schoolCode, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("POST", "/api/drafts/fees", {
        ...data,
        chequeDate: data.chequeDate ? data.chequeDate.toISOString() : null,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Fees draft saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save fees draft",
        variant: "destructive",
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!schoolCode) throw new Error("School code is required");
      return await apiRequest("POST", `/api/schools/${schoolCode}/complete`);
    },
    onSuccess: () => {
      setShowSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["/api/schools"] });
      toast({
        title: "Registration Completed!",
        description: "School has been successfully registered and moved from draft to active status.",
      });
      
      // Auto-redirect after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        onComplete?.();
      }, 3000);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to complete registration. Please ensure all required information is provided.",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = () => {
    const data = form.getValues();
    saveMutation.mutate(data);
  };

  const handleCompleteRegistration = () => {
    const data = form.getValues();
    
    if (!data.schoolCode) {
      toast({
        title: "Error",
        description: "School code is required",
        variant: "destructive",
      });
      return;
    }

    if (!data.disclaimerAccepted) {
      toast({
        title: "Error",
        description: "You must accept the disclaimer to complete registration",
        variant: "destructive",
      });
      return;
    }

    // Save the fees data first, then complete registration
    saveMutation.mutate(data, {
      onSuccess: () => {
        completeMutation.mutate();
      },
    });
  };

  // Success message component
  if (showSuccess) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Registration Completed Successfully!</h3>
              <p className="text-green-700 mt-1">School has been successfully registered and moved from draft to active status.</p>
              <p className="text-green-600 text-sm mt-2">Redirecting to schools list...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex items-center">
        <BookOpen className="w-6 h-6 mr-3" />
        <h3 className="text-lg font-semibold">Step 3: Fees</h3>
      </div>

      <CardContent className="p-6">
        <Form {...form}>
          <form className="space-y-6">
            {/* Fee Information */}
            <div className="mb-6">
              <p className="text-gray-700">
                <span className="font-semibold">Annual School Registration fee is</span>{" "}
                <span className="text-primary font-bold text-lg">PKR 20,000.</span>
              </p>
            </div>

            {/* Payment Methods */}
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold text-gray-900">Methods of Payment</FormLabel>
                  <FormControl>
                    <RadioGroup value={field.value} onValueChange={field.onChange} className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cheque" id="cheque" />
                        <label htmlFor="cheque" className="text-sm text-gray-700">Pay Order/Banker's Cheque</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="deposit" id="deposit" />
                        <label htmlFor="deposit" className="text-sm text-gray-700">Cash deposit at any HBL branch</label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Beneficiary Information */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold text-gray-900 mb-2">Beneficiary Name:</h5>
              <p className="text-gray-700">The Aga Khan University</p>
              <h5 className="font-semibold text-gray-900 mb-2 mt-3">NTN #:</h5>
              <p className="text-gray-700">3206240-5</p>
              <p className="text-sm text-gray-600 mt-2">
                Pay order/ banker's cheque must be in favour of "The Aga Khan University" else your application will not be processed.
              </p>
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="chequeNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pay Order/Banker's Cheque Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter cheque number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="chequeDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dated</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          field.onChange(date);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input {...field} value="20000" readOnly className="bg-gray-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submission Details */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Submission</h4>
              <p className="text-gray-700 mb-4">
                Send the completed Registration Form along with Pay Order/ Bankers Cheque or HBL's Original Deposit Slip to the following address:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700">
                <p className="font-semibold">The Aga Khan University Examination Board</p>
                <p>Block - C, IED-PDC, 1-5/B-VII</p>
                <p>Federal B. Area, Karimabad, P.O. Box: 13688</p>
                <p>Karachi-75950, Pakistan</p>
                <p className="mt-2">Tel: +92 21 3662 7011-8</p>
                <p>Email: msp.support@aku.edu  cc: examination.board@aku.edu</p>
              </div>
            </div>

            {/* Declaration */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Disclaimer</h4>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="mb-3">
                  <span className="font-medium">I,</span>
                  <FormField
                    control={form.control}
                    name="headOfInstitution"
                    render={({ field }) => (
                      <Input 
                        className="mx-2 inline-block w-auto border-b border-gray-300 border-t-0 border-l-0 border-r-0 rounded-none bg-transparent px-2 py-1 focus:border-primary"
                        placeholder="Head of Institution Name"
                        {...field}
                      />
                    )}
                  />
                  <span>have read and understood the information in this form, and confirm that all details provided are truthful and accurate.</span>
                </div>
                <FormField
                  control={form.control}
                  name="disclaimerAccepted"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox 
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <label className="text-sm text-gray-700">I confirm the above statement.</label>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Signature Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="headSignature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head of the Institution's Signature</FormLabel>
                    <FormControl>
                      <Input placeholder="Signature (type name)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="institutionStamp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution's Stamp</FormLabel>
                    <FormControl>
                      <Input placeholder="Stamp (type or leave blank)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              <Button 
                type="button" 
                variant="secondary"
                onClick={onPrevious}
              >
                Previous: Resources and Support
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
                  onClick={handleCompleteRegistration}
                  disabled={saveMutation.isPending || completeMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {completeMutation.isPending ? "Completing..." : "Complete Registration"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
