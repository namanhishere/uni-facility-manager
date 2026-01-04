"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, ArrowRight, ShieldCheck, Lock, User, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);

    // Demo State
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleRealSSO = () => {
        setIsLoading(true);
        // Build the authorization URL for the external SSO provider
        const clientId = 'client_id'; // Replace with env var if available
        const redirectUri = encodeURIComponent('http://localhost:3001/auth/callback');
        const scope = 'read';
        const authUrl = `https://devhcmutsso.namanhishere.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

        // Redirect to external SSO
        window.location.href = authUrl;
    };

    const handleDemoLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            // Simulation of authentication delay
            await new Promise(resolve => setTimeout(resolve, 800));

            if (!username) {
                throw new Error("Please enter a username/ID");
            }

            await login(username);
            // login function handles redirection
        } catch (err: any) {
            setError(err.message || "Authentication failed");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 p-4 font-sans">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="mx-auto w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
                        <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">University Facility Manager</h1>
                    <p className="text-gray-500 mt-2 text-sm">University Facility Management System</p>
                </div>

                <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="space-y-1 text-center pb-2">
                        <CardTitle className="text-xl">Welcome Back</CardTitle>
                        <CardDescription>
                            Please sign in to access the facility management system
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 pt-4">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-center">
                            <p className="text-sm text-blue-800 font-medium mb-1">Authenticated Access Only</p>
                            <p className="text-xs text-blue-600">Use your University SSO account to verify your identity.</p>
                        </div>

                        <Button
                            className="h-12 bg-[#003da5] hover:bg-[#002a7a] text-white shadow-md shadow-blue-900/10 transition-all group"
                            onClick={handleRealSSO}
                            disabled={isLoading}
                        >
                            {isLoading && !error ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Redirecting...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    Sign in with HCMUT SSO
                                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                                </span>
                            )}
                        </Button>

                        {/* Demo/Dev Login Toggle */}
                        <div className="mt-2">
                            <button
                                onClick={() => setIsDemoMode(!isDemoMode)}
                                className="w-full flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {isDemoMode ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                {isDemoMode ? "Hide Demo Login" : "Show Demo Login (Dev Only)"}
                            </button>
                        </div>

                        {/* Collapsible Demo Form */}
                        {isDemoMode && (
                            <form onSubmit={handleDemoLogin} className="space-y-4 pt-2 animate-in slide-in-from-top-2 duration-200">
                                {error && (
                                    <div className="bg-red-50 text-red-600 text-xs p-2 rounded-md flex items-center gap-2 border border-red-100">
                                        <AlertCircle className="w-3 h-3" />
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-xs">Demo ID (Student: 20110456, Admin: ADM001)</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="username"
                                            placeholder="e.g. 20110456"
                                            className="pl-9 h-10"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="Password (Any)"
                                        className="pl-3 h-10"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <Button type="submit" variant="outline" className="w-full" disabled={isLoading}>
                                    Login with Demo ID
                                </Button>
                            </form>
                        )}

                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <p className="text-xs text-center text-gray-400 w-full border-t border-gray-100 pt-4 mt-2">
                            University Facility Manager &copy; 2026
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
