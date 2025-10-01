"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, Mail, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast.success("OTP sent to your email address");
      } else {
        toast.error(data.error || "Failed to send OTP");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-md w-full space-y-6 sm:space-y-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              Check Your Email
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ve sent a 6-digit OTP to your email address
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>OTP Sent Successfully</CardTitle>
              <CardDescription>
                Please check your email and enter the OTP code below to reset your password
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-400 dark:text-blue-300" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Email sent to:</strong> {email}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                      The OTP code will expire in 10 minutes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      If you don&apos;t see the email in a few minutes, please check your Spam/Junk or Promotions folder.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => router.push("/reset-password")}
                  className="w-full"
                >
                  Enter OTP Code
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setEmailSent(false);
                    setEmail("");
                  }}
                  className="w-full"
                >
                  Send to Different Email
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link
              href="/login"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Book with UVA
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Reset your password
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Forgot Password?</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a verification code to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
