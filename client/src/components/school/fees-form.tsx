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
import { BookOpen, CheckCircle, Upload, X, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { SchoolFees, DraftFees } from '@shared/schema';
import { insertDraftFeesSchema } from '@shared/schema';
import { useNavigate } from "react-router-dom";

const formSchema = insertDraftFeesSchema.extend({
  depositSlipUrl: z.string().optional(),
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
  isEditMode?: boolean;
}

export default function FeesForm({ 
  onNext, 
  onPrevious, 
  onComplete,
  schoolCode,
  isEditMode = true
}: FeesFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [previousPaymentMethod, setPreviousPaymentMethod] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedDepositSlipUrl, setUploadedDepositSlipUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  // Load existing draft if schoolCode is provided
  const { data: existingDraft } = useQuery<DraftFees>({
    queryKey: ["drafts/fees", schoolCode],
    enabled: !!schoolCode && !isEditMode,
    queryFn: async () => {
      const response = await fetch(`/api/drafts/fees/${schoolCode}`);
      if (!response.ok) throw new Error('Failed to fetch fees draft');
      return await response.json();
    }
  });

  // Load registered school fees in edit mode
  const { data: registeredFees } = useQuery<SchoolFees>({
    queryKey: ["schools/fees", schoolCode],
    enabled: !!schoolCode && isEditMode,
    queryFn: async () => {
      const response = await fetch(`/api/schools/${schoolCode}/fees`);
      if (!response.ok) throw new Error('Failed to fetch school fees');
      return await response.json();
    }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      schoolCode: schoolCode || "",
      paymentMethod: "cheque",
      chequeNumber: "",
      chequeDate: null,
      depositSlipNumber: "",
      depositDate: null,
      depositPayOrderNumber: "",
      amount: "20000.00",
      headOfInstitution: "",
      disclaimerAccepted: false,
      headSignature: "",
      institutionStamp: "",
    },
  });

  // Watch payment method to conditionally show fields
  const paymentMethod = form.watch("paymentMethod");
  
  // Handle payment method changes - FIXED VERSION
  useEffect(() => {
    if (paymentMethod && paymentMethod !== previousPaymentMethod) {
      // Clear payment-specific fields when switching methods
      if (paymentMethod === 'cheque') {
        form.setValue('depositSlipNumber', '', { shouldValidate: false });
        form.setValue('depositPayOrderNumber', '', { shouldValidate: false });
        form.setValue('depositDate', null, { shouldValidate: false });
      } else if (paymentMethod === 'deposit') {
        form.setValue('chequeNumber', '', { shouldValidate: false });
        form.setValue('chequeDate', null, { shouldValidate: false });
      }
      setPreviousPaymentMethod(paymentMethod);
    }
  }, [paymentMethod, previousPaymentMethod, form]);
  
  // Load existing data into form
  useEffect(() => {
    if (existingDraft) {
      console.log('Loading fees draft data:', existingDraft);
      const formData = {
        schoolCode: existingDraft.schoolCode || "",
        paymentMethod: existingDraft.paymentMethod || "cheque",
        chequeNumber: existingDraft.chequeNumber || "",
        chequeDate: existingDraft.chequeDate 
          ? (new Date(existingDraft.chequeDate).toString() === 'Invalid Date' ? null : new Date(existingDraft.chequeDate)) 
          : null,
        depositSlipNumber: existingDraft.depositSlipNumber || "",
        depositDate: existingDraft.depositDate 
          ? (new Date(existingDraft.depositDate).toString() === 'Invalid Date' ? null : new Date(existingDraft.depositDate)) 
          : null,
        depositPayOrderNumber: existingDraft.depositPayOrderNumber || "",
        amount: existingDraft.amount?.toString() || "20000.00",
        headOfInstitution: existingDraft.headOfInstitution || "",
        disclaimerAccepted: Boolean(existingDraft.disclaimerAccepted),
        headSignature: existingDraft.headSignature || "",
        institutionStamp: existingDraft.institutionStamp || "",
      };
      // Clear irrelevant fields based on the loaded payment method
      if (formData.paymentMethod === 'cheque') {
        formData.depositSlipNumber = null;
        formData.depositDate = null;
        formData.depositPayOrderNumber = null;
      } else if (formData.paymentMethod === 'deposit') {
        formData.chequeNumber = null;
        formData.chequeDate = null;
      }

      form.reset(formData);
      setPreviousPaymentMethod(formData.paymentMethod);
    } else if (registeredFees) {
      console.log('Loading registered school fees:', registeredFees);
      const formData = {
        schoolCode: registeredFees.schoolCode || "",
        paymentMethod: registeredFees.paymentMethod || "cheque",
        chequeNumber: registeredFees.chequeNumber || "",
        chequeDate: registeredFees.chequeDate 
          ? (new Date(registeredFees.chequeDate).toString() === 'Invalid Date' ? null : new Date(registeredFees.chequeDate)) 
          : null,
        depositSlipNumber: registeredFees.depositSlipNumber || "",
        depositDate: registeredFees.depositDate 
          ? (new Date(registeredFees.depositDate).toString() === 'Invalid Date' ? null : new Date(registeredFees.depositDate)) 
          : null,
        depositPayOrderNumber: registeredFees.depositPayOrderNumber || "",
        amount: registeredFees.amount?.toString() || "20000.00",
        headOfInstitution: registeredFees.headOfInstitution || "",
        disclaimerAccepted: Boolean(registeredFees.disclaimerAccepted),
        headSignature: registeredFees.headSignature || "",
        institutionStamp: registeredFees.institutionStamp || "",
      };

      // Clear irrelevant fields based on the loaded payment method
      if (formData.paymentMethod === 'cheque') {
        formData.depositSlipNumber = null;
        formData.depositDate = null;
        formData.depositPayOrderNumber = null;
      } else if (formData.paymentMethod === 'deposit') {
        formData.chequeNumber = null;
        formData.chequeDate = null;
      }

      form.reset(formData);
      setPreviousPaymentMethod(formData.paymentMethod);
    } else if (schoolCode) {
      form.setValue("schoolCode", schoolCode);
      setPreviousPaymentMethod("cheque"); // Set initial value
    }
  }, [existingDraft, registeredFees, schoolCode, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('Saving data:', data);
      
      // Prepare data for submission
      const submitData = {
        ...data,
        amount: data.amount || "20000.00", // Ensure amount is a string
        chequeDate: data.chequeDate ? data.chequeDate.toISOString() : null,
        depositDate: data.depositDate ? data.depositDate.toISOString() : null,
      };
      
      console.log('Submit data:', submitData);
      
      if (isEditMode) {
        const response = await fetch(`/api/schools/${data.schoolCode}/fees`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Update failed:', errorText);
          throw new Error(`Failed to update fees: ${response.status}`);
        }
        return await response.json();
      } else {
        const response = await fetch('/api/drafts/fees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(submitData)
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Save draft failed:', errorText);
          throw new Error(`Failed to save draft: ${response.status}`);
        }
        return await response.json();
      }
    },
    onSuccess: (data) => {
      console.log('Save success:', data);
      // Invalidate and refetch the fees data
      queryClient.invalidateQueries({ queryKey: ["schools/fees", schoolCode] });
      queryClient.invalidateQueries({ queryKey: ["drafts/fees", schoolCode] });
      
      toast({
        title: "Success",
        description: isEditMode 
          ? "Fees updated successfully" 
          : "Fees draft saved successfully",
      });
      if (isEditMode) {
        navigate("/school-setup");
      }
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: isEditMode 
          ? `Failed to update fees: ${error.message}` 
          : `Failed to save fees draft: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/deposit-slip', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload deposit slip');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setUploadedDepositSlipUrl(data.url);
      setIsUploading(false);
      toast({
        title: "Success",
        description: "Deposit slip uploaded successfully",
      });
    },
    onError: (error) => {
      setIsUploading(false);
      toast({
        title: "Upload Error",
        description: `Failed to upload deposit slip: ${error.message}`,
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
      console.error('Complete registration error:', error);
      toast({
        title: "Error",
        description: "Failed to complete registration. Please ensure all required information is provided.",
        variant: "destructive",
      });
    },
  });

  const handleSaveDraft = async () => {
    // Validate form first
    const isValid = form.trigger();
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before saving",
        variant: "destructive",
      });
      return;
    }
    
    let depositSlipUrl = uploadedDepositSlipUrl;
    
    // Upload file if one is selected and not already uploaded
    if (selectedFile && !uploadedDepositSlipUrl) {
      depositSlipUrl = await uploadFile();
      if (!depositSlipUrl) {
        return; // Upload failed, don't proceed
      }
    }
    
    const data = form.getValues();
    const submitData = {
      ...data,
      depositSlipUrl,
    };
    
    console.log('Saving draft with data:', submitData);
    saveMutation.mutate(submitData);
  };

  const handleCompleteRegistration = async () => {
    // Validate form with completion schema
    const data = form.getValues();
    
    // Manual validation for completion
    const validationResult = completionSchema.safeParse(data);
    if (!validationResult.success) {
      console.log('Validation errors:', validationResult.error.errors);
      toast({
        title: "Validation Error",
        description: validationResult.error.errors[0]?.message || "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }
    
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

    let depositSlipUrl = uploadedDepositSlipUrl;
    
    // Upload file if one is selected and not already uploaded
    if (selectedFile && !uploadedDepositSlipUrl) {
      depositSlipUrl = await uploadFile();
      if (!depositSlipUrl) {
        return; // Upload failed, don't proceed
      }
    }

    const submitData = {
      ...data,
      depositSlipUrl,
    };

    console.log('Completing registration with data:', submitData);
    
    // Save the fees data first, then complete registration
    saveMutation.mutate(submitData, {
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
                    <RadioGroup
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value === "cheque") {
                          form.setValue("depositSlipNumber", null);
                          form.setValue("depositDate", null);
                          form.setValue("depositPayOrderNumber", null);
                        } else if (value === "deposit") {
                          form.setValue("chequeNumber", null);
                          form.setValue("chequeDate", null);
                        }
                      }}
                      className="space-y-3"
                    >
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

            {/* Beneficiary Information - Updated based on payment method */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h5 className="font-semibold text-gray-900 mb-2">Beneficiary Information:</h5>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-medium text-gray-700 w-32">Account Title:</span>
                  <span className="text-gray-700">The Aga Khan University</span>
                </div>
                <div className="flex">
                  <span className="font-medium text-gray-700 w-32">NTN #:</span>
                  <span className="text-gray-700">1206240-5</span>
                </div>
              </div>
              
              {paymentMethod === "cheque" ? (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Pay order/banker's cheque must be in favour of "The Aga Khan University", otherwise your application will not be processed.
                  </p>
                </div>
              ) : (
                <div className="mt-4">
                  <h6 className="font-semibold text-gray-900 mb-3">Bank Details for Cash Deposit:</h6>
                  <div className="bg-white p-3 rounded-md border text-sm space-y-2">
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Account Title:</span>
                      <span className="text-gray-700">The Aga Khan University</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Account #:</span>
                      <span className="text-gray-700">0896-79006003-01</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Branch Code:</span>
                      <span className="text-gray-700">0896</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Bank Name:</span>
                      <span className="text-gray-700">Habib Bank Limited</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium text-gray-700 w-32">Branch Name:</span>
                      <span className="text-gray-700">KARSAZ, Karachi</span>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-green-800">
                      <strong>Note:</strong> School can deposit amount in (PKR only) at any of the branches of Habib Bank Limited (HBL) through online banking facility.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Details - Conditional fields based on payment method */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paymentMethod === "cheque" ? (
                <>
                  <FormField
                    key={paymentMethod === "cheque" ? "chequeNumber-cheque" : "chequeNumber-deposit"}
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
                    key={paymentMethod === "cheque" ? "chequeDate-cheque" : "chequeDate-deposit"}
                    control={form.control}
                    name="chequeDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cheque Date</FormLabel>
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
                </>
              ) : (
                <>
                  <FormField
                    key="depositSlipNumber"
                    control={form.control}
                    name="depositSlipNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Slip Number</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter deposit slip number"
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    key="depositPayOrderNumber"
                    control={form.control}
                    name="depositPayOrderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pay Order Number</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter pay order number" 
                            value={field.value || ''}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    key="depositDate"
                    control={form.control}
                    name="depositDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Date</FormLabel>
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
                </>
              )}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (PKR)</FormLabel>
                    <FormControl>
                      <Input {...field} value="20,000" readOnly className="bg-gray-50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Screenshot Upload */}
            {paymentMethod === "deposit" && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-semibold text-gray-900 mb-3">Upload Payment Screenshot</h5>
                <p className="text-sm text-gray-600 mb-4">
                  Please upload a clear screenshot or photo of your deposit slip for verification.
                </p>
                
                <div className="space-y-4">
                  {/* File Input */}
                  <div className="flex items-center justify-center w-full">
                    <label 
                      htmlFor="deposit-slip-upload" 
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB</p>
                      </div>
                      <input 
                        id="deposit-slip-upload" 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                      />
                    </label>
                  </div>

                  {/* File Preview */}
                  {selectedFile && previewUrl && (
                    <div className="mt-4 p-4 bg-white rounded-lg border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Image className="w-5 h-5 text-gray-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                            <p className="text-xs text-gray-500">
                              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Image Preview */}
                      <div className="mt-3">
                        <img 
                          src={previewUrl} 
                          alt="Deposit slip preview" 
                          className="max-w-full h-auto max-h-48 rounded-lg border"
                        />
                      </div>
                      
                      {/* Upload Status */}
                      {uploadedDepositSlipUrl && (
                        <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-700">File uploaded successfully</span>
                          </div>
                        </div>
                      )}
                      
                      {isUploading && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-md">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-blue-700">Uploading...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submission Details */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Submission Instructions</h4>
              <p className="text-gray-700 mb-4">
                Send the completed Registration Form along with {paymentMethod === "cheque" ? "Pay Order/Banker's Cheque" : "HBL's Original Deposit Slip"} to the following address:
              </p>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-700 space-y-1">
                  <p className="font-semibold text-gray-900">The Aga Khan University Examination Board</p>
                  <p>Block - C, IED-PDC, 1-5/B-VII</p>
                  <p>Federal B. Area, Karimabad, P.O. Box: 13688</p>
                  <p>Karachi-75950, Pakistan</p>
                  <p className="mt-2 font-medium">Tel: +92 21 3662 7011-8</p>
                </div>
              </div>
            </div>

            {/* Declaration */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Declaration</h4>
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="mb-4">
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
                  <span>, have read and understood the information in this form, and confirm that all details provided are truthful and accurate.</span>
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
                        <label className="text-sm text-gray-700 font-medium">I confirm the above statement and accept all terms and conditions.</label>
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
                    <FormLabel>Head of Institution's Signature</FormLabel>
                    <FormControl>
                      <Input placeholder="Type your name for signature" {...field} />
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
                    <FormLabel>Institution's Official Stamp</FormLabel>
                    <FormControl>
                      <Input placeholder="Institution stamp details (optional)" {...field} />
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
                {isEditMode ? (
                  <Button
                    type="button"
                    onClick={handleSaveDraft}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? "Updating..." : "Update Registration"}
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={saveMutation.isPending}
                    >
                      {saveMutation.isPending ? "Saving..." : "Save Draft"}
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCompleteRegistration}
                      disabled={saveMutation.isPending || completeMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {completeMutation.isPending ? "Completing..." : "Complete Registration"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}