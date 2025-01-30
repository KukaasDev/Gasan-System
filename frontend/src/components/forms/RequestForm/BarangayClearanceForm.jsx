import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, getUserFromLocalStorage } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { barangayClearanceSchema } from "../validationSchemas";

export default function BarangayClearanceForm({ onSubmit, initialData, onDataChange }) {
    // Get user data directly from localStorage
    const [currentUser, setCurrentUser] = useState(() => getUserFromLocalStorage());
    const [isChrome, setIsChrome] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        watch,
    } = useForm({
        resolver: zodResolver(barangayClearanceSchema),
        defaultValues: {
            name: currentUser?.name || "",
            email: currentUser?.email || "",
            barangay: currentUser?.barangay || "",
            purpose: initialData?.purpose || "",
            contactNumber: initialData?.contactNumber || "",
            dateOfBirth: initialData?.dateOfBirth || "",
        },
    });

    // Watch form values and notify parent component of changes
    const formValues = watch();
    useEffect(() => {
        onDataChange?.(formValues);
    }, [formValues, onDataChange]);

    // Update form when localStorage changes
    useEffect(() => {
        const handleStorageChange = () => {
            const userData = getUserFromLocalStorage();
            setCurrentUser(userData);
            if (userData) {
                setValue("name", userData.name || "");
                setValue("email", userData.email || "");
                setValue("barangay", userData.barangay || "");
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, [setValue]);

    // Add browser detection
    useEffect(() => {
        const detectBrowser = async () => {
            const isBrave = await new Promise((resolve) => {
                const promise = navigator?.brave?.isBrave?.();
                if (promise) {
                    promise.then(resolve).catch(() => resolve(false));
                } else {
                    resolve(false);
                }
            });

            const userAgent = navigator.userAgent.toLowerCase();
            const isChromeBrowser =
                userAgent.includes("chrome") &&
                !userAgent.includes("edg") &&
                !userAgent.includes("opr") &&
                !isBrave;

            setIsChrome(isChromeBrowser);
        };

        detectBrowser();
    }, []);

    const handleFormSubmit = (data) => {
        console.log("Submitting clearance form with data:", data);
        onSubmit(data, "barangay-clearance");
    };

    return (
        <form id="document-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                        id="name"
                        {...register("name")}
                        defaultValue={currentUser?.name || ""}
                        readOnly
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        {...register("email")}
                        defaultValue={currentUser?.email || ""}
                        readOnly
                    />
                    {errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="barangay">Barangay</Label>
                    <Input
                        id="barangay"
                        {...register("barangay")}
                        defaultValue={currentUser?.barangay || ""}
                        readOnly
                    />
                    {errors.barangay && (
                        <p className="text-red-500 text-sm">{errors.barangay.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="purpose">Purpose</Label>
                    <Input
                        id="purpose"
                        {...register("purpose")}
                        placeholder="Enter purpose for clearance"
                    />
                    {errors.purpose && (
                        <p className="text-red-500 text-sm">{errors.purpose.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="contactNumber">Contact Number</Label>
                    <Input
                        id="contactNumber"
                        type="tel"
                        {...register("contactNumber")}
                        placeholder="Enter your contact number"
                    />
                    {errors.contactNumber && (
                        <p className="text-red-500 text-sm">{errors.contactNumber.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    {isChrome ? (
                        <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
                    ) : (
                        <Popover modal={true}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !watch("dateOfBirth") && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {watch("dateOfBirth") ? (
                                        format(new Date(watch("dateOfBirth")), "PPP")
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start" side="bottom">
                                <Calendar
                                    mode="single"
                                    selected={
                                        watch("dateOfBirth")
                                            ? new Date(watch("dateOfBirth"))
                                            : undefined
                                    }
                                    onSelect={(date) => {
                                        setValue(
                                            "dateOfBirth",
                                            date ? format(date, "yyyy-MM-dd") : "",
                                            {
                                                shouldValidate: true,
                                            }
                                        );
                                    }}
                                    disabled={(date) =>
                                        date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                    {errors.dateOfBirth && (
                        <p className="text-red-500 text-sm">{errors.dateOfBirth.message}</p>
                    )}
                </div>
            </div>
        </form>
    );
}

BarangayClearanceForm.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    initialData: PropTypes.object,
    onDataChange: PropTypes.func,
};
