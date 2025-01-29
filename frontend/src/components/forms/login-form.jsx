// filepath: /c:/Users/chest/OneDrive/Documents/Projects/Gasan System/frontend/src/components/forms/login-form.jsx
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { loginFailure, loginStart, loginSuccess } from "@/redux/user/userSlice";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export function LoginForm({ className }) {
    const { currentUser } = useSelector((state) => state.user);
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (currentUser) {
            navigate("/dashboard?tab=home");
        } else {
            navigate("/sign-in");
        }
    }, [currentUser, navigate]);

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const handleLogin = async (values) => {
        try {
            setLoading(true);
            dispatch(loginStart());
            const { email, password } = values;

            if (!email || !password) {
                toast.error("All fields are required.");
                return;
            }

            const response = await axios.post("http://localhost:5000/api/auth/login", values, {
                headers: {
                    "Content-Type": "application/json",
                    withCredentials: true,
                },
            });

            const data = response.data;

            if (response.status === 200) {
                const user = {
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    barangay: data.barangay,
                    isVerified: data.isVerified,
                    role: data.role,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                };

                localStorage.setItem("user", JSON.stringify(user));
                dispatch(loginSuccess(user));
                localStorage.setItem("token", data.token);
                toast.success("Logged in successfully.");
                setLoading(false);
                navigate("/dashboard?tab=home");
            }
        } catch (error) {
            setLoading(false);
            dispatch(loginFailure(error.response?.data?.message || "Login failed"));
            console.error(error);
            toast.error("Invalid email or password.");
        }
    };

    return (
        <Form {...form}>
            <form className={cn("space-y-6", className)} onSubmit={form.handleSubmit(handleLogin)}>
                <div className="space-y-4 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Welcome back
                    </h1>
                    <p className="text-sm text-gray-600">
                        Enter your credentials to access your account
                    </p>
                </div>

                <div className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">
                                    Email address
                                </FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="name@example.com"
                                        className="h-11"
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <div className="flex items-center justify-between">
                                    <FormLabel className="text-sm font-medium text-gray-700">
                                        Password
                                    </FormLabel>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm font-medium text-green-600 hover:text-green-500"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <FormControl>
                                    <Input {...field} type="password" className="h-11" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full h-11 bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <span className="animate-spin">⏳</span> Signing in...
                        </div>
                    ) : (
                        "Sign in"
                    )}
                </Button>

                <div className="text-center text-sm text-gray-600">
                    Don't have an account?{" "}
                    <Link to="/sign-up" className="font-medium text-green-600 hover:text-green-500">
                        Sign up
                    </Link>
                </div>
            </form>
        </Form>
    );
}

LoginForm.propTypes = {
    className: PropTypes.string,
};
