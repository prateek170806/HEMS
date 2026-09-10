"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/app/profile.actions";
import { User, Shield, CheckCircle2, AlertCircle, Calendar, Hash, Mail } from "lucide-react";

type UserType = {
  id: string;
  name: string;
  email: string;
  customerId: string;
  createdAt: Date;
  avatarInitials: string | null;
};

export default function ProfileForm({ user }: { user: UserType }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

  const initials =
    user.avatarInitials ||
    (user.name
      ? user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "U");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateProfileAction(formData);
      if (result?.error) {
        setMessage({ text: result.error, type: "error" });
      } else if (result?.success) {
        setMessage({ text: "Profile updated successfully.", type: "success" });
        window.location.reload();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
      {/* User Card Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-border">
        <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold shadow-md shrink-0">
          {initials}
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-foreground truncate">{user.name}</h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
              <Shield className="h-3 w-3" /> Customer
            </span>
          </div>
          <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>

      {/* Grid Fields */}
      <div className="grid grid-cols-1 gap-y-6 gap-x-6 sm:grid-cols-2">
        {/* Full Name (Editable) */}
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            Full Name <span className="text-destructive">*</span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={user.name}
              className="block w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Your full name"
            />
          </div>
        </div>

        {/* Email (Read-only) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
            Email Address <span className="text-xs text-muted-foreground font-normal">(Read-only)</span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              disabled
              defaultValue={user.email}
              className="block w-full rounded-lg border border-input bg-muted pl-10 pr-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>

        {/* Customer ID (Read-only) */}
        <div>
          <label htmlFor="customerId" className="block text-sm font-medium text-foreground mb-2">
            Customer ID <span className="text-xs text-muted-foreground font-normal">(Read-only)</span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Hash className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="customerId"
              name="customerId"
              type="text"
              disabled
              defaultValue={user.customerId}
              className="block w-full rounded-lg border border-input bg-muted pl-10 pr-3 py-2 text-sm font-mono text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>

        {/* Member Since (Read-only) */}
        <div className="sm:col-span-2">
          <label htmlFor="memberSince" className="block text-sm font-medium text-foreground mb-2">
            Member Since <span className="text-xs text-muted-foreground font-normal">(Read-only)</span>
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              id="memberSince"
              name="memberSince"
              type="text"
              disabled
              defaultValue={new Date(user.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              className="block w-full rounded-lg border border-input bg-muted pl-10 pr-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Message Feedback */}
      {message && (
        <div
          className={`p-4 rounded-lg text-sm flex items-center gap-2 ${
            message.type === "error"
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {message.type === "error" ? (
            <AlertCircle className="h-4 w-4 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Form Action */}
      <div className="flex items-center justify-end pt-4 border-t border-border">
        <Button type="submit" disabled={isPending} className="px-6">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
