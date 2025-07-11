import { useState, useEffect, useMemo } from "react";
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
import { Users, CheckCircle, Upload, X, Image, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { StudentFeesInterface } from '@shared/schema';
import { insertStudentFeesSchema } from '@shared/schema';

const formSchema = insertStudentFeesSchema.extend({
  depositSlipUrl: z.string().optional(),
});

const completionSchema = formSchema.extend({
  disclaimerAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the disclaimer to complete registration",
  }),
});

type FormData = z.infer<typeof formSchema>;

interface StudentFeesFormProps {
  schoolCode?: string;
  feesData?: {
    primaryAmount: number;
    middleAmount: number;
    totalFee: number;
    primaryCount: number;
    middleCount: number;
  };
}

export default function StudentFeesForm({ 
  schoolCode,
  feesData
}: StudentFeesFormProps) {
  const { toast } = useToast();
  const [showSuccess, setShowSuccess] = useState(false);
  const [previousPaymentMethod, setPreviousPaymentMethod] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedDepositSlipUrl, setUploadedDepositSlipUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  
  // Fetch school data to calculate fees if feesData is not provided
  const { data: schoolData } = useQuery({
    queryKey: ["school-data-fees", schoolCode],
    queryFn: async () => {
      if (!schoolCode) return null;
      const response = await fetch(`/api/schools/${schoolCode}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch school data');
      }
      return await response.json();
    },
    enabled: !!schoolCode && !feesData
  });
  
  // Calculate fees from school registration data if feesData is not provided
  const calculatedFeesData = useMemo(() => {
    if (feesData) return feesData;
    if (!schoolData) {
      return {
        primaryAmount: 0,
        middleAmount: 0,
        totalFee: 0,
        primaryCount: 0,
        middleCount: 0
      };
    }
    
    const primaryCount = (schoolData.gradeIV || 0) + (schoolData.gradeV || 0);
    const middleCount = (schoolData.gradeVI || 0) + (schoolData.gradeVII || 0) + (schoolData.gradeVIII || 0);
    const primaryAmount = primaryCount * 2000;
    const middleAmount = middleCount * 2250;
    const totalFee = primaryAmount + middleAmount;
    
    return {
      primaryAmount,
      middleAmount,
      totalFee,
      primaryCount,
      middleCount
    };
  }, [feesData, schoolData]);

  // Load existing student fees if schoolCode is provided
  const { data: existingFees } = useQuery<StudentFeesInterface>({
    queryKey: ["student-fees", schoolCode],
    enabled: !!schoolCode,
    queryFn: async () => {
      const response = await fetch(`/api/schools/${schoolCode}/student-fees`);
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No fees found, return null
        }
        throw new Error('Failed to fetch student fees');
      }
      return await response.json();
    }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      schoolCode: schoolCode || "",
      paymentMethod: "cheque",
      chequeNumber: "",
      chequeDate: null,
      depositSlipNumber: "",
      depositDate: null,
      depositPayOrderNumber: "",
      totalAmount: calculatedFeesData?.totalFee?.toString() || "0",
      primaryAmount: calculatedFeesData?.primaryAmount?.toString() || "0",
      middleAmount: calculatedFeesData?.middleAmount?.toString() || "0",
      primaryCandidates: calculatedFeesData?.primaryCount || 0,
      middleCandidates: calculatedFeesData?.middleCount || 0,
      headOfInstitution: "",
      disclaimerAccepted: false,
      headSignature: "",
      institutionStamp: "",
    },
  });

  // Watch payment method to conditionally show fields
  const paymentMethod = form.watch("paymentMethod");
  
  // Handle payment method changes
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
    if (existingFees) {
      console.log('Loading student fees data:', existingFees);
      const formData = {
        schoolCode: existingFees.schoolCode || "",
        paymentMethod: existingFees.paymentMethod || "cheque",
        chequeNumber: existingFees.chequeNumber || "",
        chequeDate: existingFees.chequeDate 
          ? (new Date(existingFees.chequeDate).toString() === 'Invalid Date' ? null : new Date(existingFees.chequeDate)) 
          : null,
        depositSlipNumber: existingFees.depositSlipNumber || "",
        depositDate: existingFees.depositDate 
          ? (new Date(existingFees.depositDate).toString() === 'Invalid Date' ? null : new Date(existingFees.depositDate)) 
          : null,
        depositPayOrderNumber: existingFees.depositPayOrderNumber || "",
        totalAmount: existingFees.totalAmount?.toString() || "0",
        primaryAmount: existingFees.primaryAmount?.toString() || "0",
        middleAmount: existingFees.middleAmount?.toString() || "0",
        primaryCandidates: existingFees.primaryCandidates || 0,
        middleCandidates: existingFees.middleCandidates || 0,
        headOfInstitution: existingFees.headOfInstitution || "",
        disclaimerAccepted: Boolean(existingFees.disclaimerAccepted),
        headSignature: existingFees.headSignature || "",
        institutionStamp: existingFees.institutionStamp || "",
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
      setPreviousPaymentMethod("cheque");
    }
  }, [existingFees, schoolCode, form]);

  // Update form when calculatedFeesData changes
  useEffect(() => {
    if (calculatedFeesData) {
      form.setValue("totalAmount", calculatedFeesData.totalFee.toString());
      form.setValue("primaryAmount", calculatedFeesData.primaryAmount.toString());
      form.setValue("middleAmount", calculatedFeesData.middleAmount.toString());
      form.setValue("primaryCandidates", calculatedFeesData.primaryCount);
      form.setValue("middleCandidates", calculatedFeesData.middleCount);
    }
  }, [calculatedFeesData, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      console.log('Saving student fees data:', data);
      
      // Prepare data for submission
      const submitData = {
        ...data,
        totalAmount: data.totalAmount || "0",
        primaryAmount: data.primaryAmount || "0",
        middleAmount: data.middleAmount || "0",
        chequeDate: data.chequeDate ? data.chequeDate.toISOString() : null,
        depositDate: data.depositDate ? data.depositDate.toISOString() : null,
      };
      
      console.log('Submit student fees data:', submitData);
      
      const response = await fetch(`/api/schools/${data.schoolCode}/student-fees`, {
        method: existingFees ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Save failed:', errorText);
        throw new Error(`Failed to save student fees: ${response.status}`);
      }
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Save success:', data);
      // Invalidate and refetch the student fees data
      queryClient.invalidateQueries({ queryKey: ["student-fees", schoolCode] });
      
      toast({
        title: "Success",
        description: existingFees 
          ? "Student fees updated successfully" 
          : "Student fees saved successfully",
      });
      setShowSuccess(true);
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast({
        title: "Error",
        description: `Failed to save student fees: ${error.message}`,
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

  // File selection handler
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 5MB",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove file handler
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadedDepositSlipUrl("");
    // Clear file input
    const fileInput = document.getElementById('deposit-slip-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Upload file function
  const uploadFile = async () => {
    if (!selectedFile) return "";
    
    setIsUploading(true);
    try {
      const result = await uploadMutation.mutateAsync(selectedFile);
      return result.url;
    } catch (error) {
      console.error('Upload failed:', error);
      return "";
    }
  };

  const handleSave = async () => {
    // Validate form first
    const isValid = await form.trigger();
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
    
    console.log('Saving student fees with data:', submitData);
    saveMutation.mutate(submitData);
  };

  // Success message component
  if (showSuccess) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Student Fees Saved Successfully!</h3>
              <p className="text-green-700 mt-1">Student fees information has been saved to the database.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <div className="bg-primary text-white px-6 py-4 rounded-t-lg flex items-center">
        <Users className="w-6 h-6 mr-3" />
        <h3 className="text-lg font-semibold">Student Fees</h3>
      </div>

      <CardContent className="p-6">
        <Form {...form}>
          <form className="space-y-6">
            {/* Fee Information */}
            <div className="mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Fee Breakdown</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Primary Level:</span>
                    <p>PKR 2,000 × {calculatedFeesData?.primaryCount || 0} candidates = <span className="font-bold text-primary">PKR {calculatedFeesData?.primaryAmount?.toLocaleString() || 0}</span></p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Middle Level:</span>
                    <p>PKR 2,250 × {calculatedFeesData?.middleCount || 0} candidates = <span className="font-bold text-primary">PKR {calculatedFeesData?.middleAmount?.toLocaleString() || 0}</span></p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Total Amount:</span>
                    <p className="text-lg font-bold text-primary">PKR {calculatedFeesData?.totalFee?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
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

            {/* Beneficiary Information */}
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
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount (PKR)</FormLabel>
                    <FormControl>
                      <Input {...field} value={`${parseInt(field.value || '0').toLocaleString()}`} readOnly className="bg-gray-50" />
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
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <Button
                type="button"
                onClick={handleSave}
                className="bg-primary hover:bg-primary-dark text-white"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? "Saving..." : existingFees ? "Update Student Fees" : "Save Student Fees"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
