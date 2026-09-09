"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/app/profile.actions";

type UserType = {
  name: string;
  email: string;
  customerId: string;
  createdAt: Date;
  avatarInitials: string | null;
};

export default function ProfileForm({ user }: { user: UserType }) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; type: "error" | "success" } | null>(null);

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
        // Force reload to update session if needed (since NextAuth session is in a cookie, navigating updates RSCs)
        window.location.reload();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-6 sm:p-8">
      <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        
        <div className="sm:col-span-6 flex items-center gap-x-6">
          {user.avatarInitials ? (
            <div className="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
              {user.avatarInitials}
            </div>
          ) : (
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-xl">WW</span>
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold leading-7">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="sm:col-span-4">
          <label htmlFor="customerId" className="block text-sm font-medium leading-6">
            Customer ID
          </label>
          <div className="mt-2">
            <input
              id="customerId"
              name="customerId"
              type="text"
              disabled
              defaultValue={user.customerId}
              className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-border bg-muted text-muted-foreground sm:text-sm sm:leading-6 px-3 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="sm:col-span-4">
          <label htmlFor="memberSince" className="block text-sm font-medium leading-6">
            Member Since
          </label>
          <div className="mt-2">
            <input
              id="memberSince"
              name="memberSince"
              type="text"
              disabled
              defaultValue={new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
              className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-border bg-muted text-muted-foreground sm:text-sm sm:leading-6 px-3 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="sm:col-span-4">
          <label htmlFor="name" className="block text-sm font-medium leading-6">
            Full Name
          </label>
          <div className="mt-2">
            <input
              id="name"
              name="name"
              type="text"
              required
              defaultValue={user.name}
              className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-border focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3 bg-background"
            />
          </div>
        </div>
      </div>
      
      {message && (
        <div className={`mt-6 p-4 rounded-md text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20' : 'bg-green-50 text-green-700 ring-1 ring-green-600/20'}`}>
          {message.text}
        </div>
      )}

      <div className="mt-8 flex items-center justify-end gap-x-6 border-t border-border pt-8">
        <Button
          type="submit"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
