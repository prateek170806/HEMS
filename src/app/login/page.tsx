import { AuthCard } from "@/components/auth/AuthCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — WattWise",
  description: "Sign in to access your WattWise Smart Home Energy Management System.",
};

export default function LoginPage() {
  return <AuthCard initialMode="login" />;
}
