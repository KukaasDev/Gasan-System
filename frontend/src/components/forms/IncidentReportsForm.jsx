import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn, getUserFromLocalStorage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { incidentReportSchema } from "./validationSchemas";

const incidentCategories = {
    "Crime-Related Incidents": [
        "Theft/Burglary",
        "Assault",
        "Vandalism",
        "Illegal Drugs",
        "Trespassing",
        "Scams/Fraud",
    ],
    "Community Disturbances": [
        "Noise Complaints",
        "Public Intoxication",
        "Disorderly Conduct",
        "Curfew Violations",
    ],
    "Environmental & Health Concerns": [
        "Garbage Dumping",
        "Flooding",
        "Health Hazards",
        "Fire Incidents",
    ],
    "Traffic & Road Issues": ["Illegal Parking", "Reckless Driving", "Accidents"],
    "Missing Persons & Lost Items": ["Missing Person", "Lost & Found"],
    "Domestic & Civil Disputes": ["Family Disputes", "Land/Property Issues", "Neighbor Conflicts"],
    "Animal-Related Incidents": ["Stray Animals", "Animal Bites"],
};

export default function IncidentReportForm() {
    const [selectedCategory, setSelectedCategory] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [user, setUser] = useState(() => getUserFromLocalStorage());
    const [isChrome, setIsChrome] = useState(false);

    // Update user when localStorage changes
    useEffect(() => {
        const handleStorageChange = () => {
            setUser(getUserFromLocalStorage());
        };

        window.addEventListener("storage", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    // Improved browser detection for Brave
    useEffect(() => {
        const detectBrowser = async () => {
            // Check if the browser is Brave using the navigator.brave API
            const isBrave = await new Promise((resolve) => {
                // Brave's promise-based detection
                const promise = navigator?.brave?.isBrave?.();
                if (promise) {
                    promise.then(resolve).catch(() => resolve(false));
                } else {
                    resolve(false);
                }
            });

            // Only set Chrome if it's not Brave
            const userAgent = navigator.userAgent.toLowerCase();
            const isChromeBrowser =
                userAgent.includes("chrome") &&
                !userAgent.includes("edg") &&
                !userAgent.includes("opr") &&
                !isBrave;

            setIsChrome(isChromeBrowser);
            console.log("Browser detection:", {
                userAgent,
                isChromeBrowser,
                isBrave,
            });
        };

        detectBrowser();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch,
    } = useForm({
        resolver: zodResolver(incidentReportSchema),
        defaultValues: {
            reporterName: user?.name || "",
            location: user?.barangay || "",
        },
    });

    // Update form when user changes
    useEffect(() => {
        if (user) {
            setValue("reporterName", user.name || "");
            setValue("location", user.barangay || "");
        }
    }, [user, setValue]);

    // Use useEffect to handle category changes
    useEffect(() => {
        if (selectedCategory) {
            setValue("category", selectedCategory);
        }
    }, [selectedCategory, setValue]);

    const handleCategoryChange = useCallback((value) => {
        setSelectedCategory(value);
    }, []);

    const onSubmit = async (data) => {
        try {
            setIsSubmitting(true);

            // Convert files to base64
            const evidenceFiles = [];
            if (data.evidence?.length) {
                for (const file of data.evidence) {
                    const base64Data = await convertFileToBase64(file);
                    evidenceFiles.push({
                        filename: file.name,
                        contentType: file.type,
                        data: base64Data,
                    });
                }
            }

            // Create request body
            const requestBody = {
                ...data,
                evidence: evidenceFiles,
            };

            const response = await axios.post(
                "http://localhost:5000/api/incident-report/submit",
                requestBody,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem("token")}`,
                        "Content-Type": "application/json",
                    },
                }
            );

            if (response.status === 201) {
                toast.success("Incident report submitted successfully!");
                reset();
                setSelectedCategory("");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            const errorMessage =
                error.response?.data?.message ||
                "Failed to submit incident report. Please try again.";
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Helper function to convert file to base64
    const convertFileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const base64String = reader.result.split(",")[1];
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
        });
    };

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                    Incident Report Form
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="category">Incident Category</Label>
                            <Select onValueChange={handleCategoryChange} value={selectedCategory}>
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.keys(incidentCategories).map((category) => (
                                        <SelectItem key={category} value={category}>
                                            {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.category && (
                                <p className="text-red-500 text-sm">{errors.category.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subCategory">Sub-category</Label>
                            <Select
                                onValueChange={(value) => setValue("subCategory", value)}
                                disabled={!selectedCategory}
                            >
                                <SelectTrigger id="subCategory">
                                    <SelectValue placeholder="Select sub-category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {selectedCategory &&
                                        incidentCategories[selectedCategory].map((subCategory) => (
                                            <SelectItem key={subCategory} value={subCategory}>
                                                {subCategory}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {errors.subCategory && (
                                <p className="text-red-500 text-sm">{errors.subCategory.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="date">Date of Incident</Label>
                            {isChrome ? (
                                <Input type="date" id="date" {...register("date")} />
                            ) : (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !watch("date") && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {watch("date") ? (
                                                format(new Date(watch("date")), "PPP")
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-0"
                                        align="start"
                                        side="bottom"
                                    >
                                        <Calendar
                                            mode="single"
                                            selected={
                                                watch("date") ? new Date(watch("date")) : undefined
                                            }
                                            onSelect={(date) => {
                                                setValue(
                                                    "date",
                                                    date ? format(date, "yyyy-MM-dd") : "",
                                                    { shouldValidate: true }
                                                );
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                            {errors.date && (
                                <p className="text-red-500 text-sm">{errors.date.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">Time of Incident</Label>
                            <Input type="time" id="time" {...register("time")} />
                            {errors.time && (
                                <p className="text-red-500 text-sm">{errors.time.message}</p>
                            )}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="location">Location of Incident</Label>
                            <Input
                                id="location"
                                {...register("location")}
                                placeholder="Enter the incident location"
                                defaultValue={user?.barangay || ""}
                            />
                            {errors.location && (
                                <p className="text-red-500 text-sm">{errors.location.message}</p>
                            )}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="description">Description of Incident</Label>
                            <Textarea
                                id="description"
                                {...register("description")}
                                placeholder="Provide details about the incident"
                                rows={4}
                            />
                            {errors.description && (
                                <p className="text-red-500 text-sm">{errors.description.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reporterName">Your Name</Label>
                            <Input
                                id="reporterName"
                                {...register("reporterName")}
                                placeholder="Enter your full name"
                                defaultValue={user?.name || ""}
                            />
                            {errors.reporterName && (
                                <p className="text-red-500 text-sm">
                                    {errors.reporterName.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="reporterContact">Your Contact Information</Label>
                            <Input
                                id="reporterContact"
                                {...register("reporterContact")}
                                placeholder="Enter your phone number or email"
                            />
                            {errors.reporterContact && (
                                <p className="text-red-500 text-sm">
                                    {errors.reporterContact.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="evidence">Upload Evidence (optional)</Label>
                            <Input
                                id="evidence"
                                type="file"
                                multiple
                                {...register("evidence")}
                                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                            />
                            {errors.evidence && (
                                <p className="text-red-500 text-sm">{errors.evidence.message}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-4 pt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                reset();
                                setSelectedCategory("");
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Submitting..." : "Submit Report"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
