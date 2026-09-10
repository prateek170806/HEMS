import { AuthCard } from "@/components/auth/AuthCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register — WattWise",
  description: "Create an account for WattWise Smart Home Energy Management System.",
};

export default function RegisterPage() {
  return <AuthCard initialMode="register" />;
}
