"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "@/lib/actions/settings";
import { useUploadThing } from "@/lib/uploadthing";
import { toast } from "sonner";
import { 
  User, 
  Mail, 
  FileText, 
  Camera, 
  Loader2, 
  CheckCircle2, 
  Clock 
} from "lucide-react";
import Image from "next/image";
import { getErrorMessage } from "@/lib/utils";

interface ProfileSettingsClientProps {
  initialUser: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl: string | null;
    bio: string | null;
    timezone: string | null;
  };
}

const COMMON_TIMEZONES = [
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
  { value: "America/New_York", label: "Eastern Time (ET) - New York" },
  { value: "America/Chicago", label: "Central Time (CT) - Chicago" },
  { value: "America/Denver", label: "Mountain Time (MT) - Denver" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT) - Los Angeles" },
  { value: "Europe/London", label: "GMT / British Time - London" },
  { value: "Europe/Paris", label: "Central European Time (CET) - Paris" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST) - Tokyo" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT) - Singapore" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AEST) - Sydney" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST) - Kolkata" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST) - Dubai" },
];

export function ProfileSettingsClient({ initialUser }: ProfileSettingsClientProps) {
  const [user, setUser] = useState(initialUser);
  
  // Form fields
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [timezone, setTimezone] = useState(user.timezone || "UTC");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");

  const [isPending, startTransition] = useTransition();
  const [uploadProgress, setUploadProgress] = useState(0);

  // UploadThing hook for avatar uploader
  const { startUpload, isUploading } = useUploadThing("avatarUpload", {
    onClientUploadComplete: (res) => {
      setUploadProgress(0);
      const url = res?.[0]?.url;
      if (url) {
        setAvatarUrl(url);
        toast.success("Profile avatar uploaded successfully!");
      }
    },
    onUploadError: (err) => {
      setUploadProgress(0);
      toast.error(err.message || "Avatar upload failed.");
    },
    onUploadProgress: (progress) => {
      setUploadProgress(progress);
    }
  });

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await startUpload([file]);
     
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to initiate avatar upload."));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name field is required.");
      return;
    }

    // Optimistic Save
    startTransition(async () => {
      try {
        const result = await updateProfile({
          name,
          bio: bio || undefined,
          timezone,
          avatarUrl: avatarUrl || undefined,
        });

        if (result.success) {
          toast.success("Profile updated successfully!");
          setUser({
            ...user,
            name,
            bio,
            timezone,
            avatarUrl: avatarUrl || null,
          });
        }
       
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, "Failed to update profile settings."));
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Settings Title */}
      <div>
        <h2 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
          <User className="h-5 w-5 text-indigo-400" /> Account Profile Details
        </h2>
        <p className="text-xs text-zinc-500 mt-1 font-semibold">
          Update your public profile display name, profile avatar, and local timezone settings.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Profile Picture Uploader */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl border border-zinc-850 bg-zinc-950/40 w-fit">
          <div className="relative h-24 w-24 rounded-full border border-zinc-800 bg-zinc-900 overflow-hidden group shrink-0">
            {avatarUrl || user.avatarUrl ? (
              <Image
                src={avatarUrl || user.avatarUrl || ""}
                alt={name}
                fill
                className="object-cover transition-all group-hover:brightness-50"
                sizes="96px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-zinc-650 group-hover:brightness-50 transition-all">
                <User className="h-10 w-10 text-zinc-550" />
              </div>
            )}

            {/* Hover overlay edit uploader */}
            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300">
              <Camera className="h-5 w-5 text-indigo-400 animate-bounce" />
              <span className="text-[9px] font-bold uppercase text-white mt-1">Change</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            {/* Progress Circular/Loader */}
            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 z-10">
                <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
                <span className="text-[9px] font-bold text-indigo-400 mt-1">{uploadProgress}%</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h4 className="text-sm font-bold text-zinc-200">User Profile Avatar</h4>
            <p className="text-[10px] text-zinc-550 max-w-xs font-semibold leading-relaxed">
              Upload a custom PNG or JPEG image. Recommended size: 256x256px. Max file size: 2MB.
            </p>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-zinc-550" /> Display Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Nishan Saas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-950 font-medium"
            />
          </div>

          {/* Email (Read-Only) */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-zinc-550" /> Email Identity (Read-only)
            </label>
            <div className="w-full px-4 py-2.5 bg-zinc-950/30 border border-zinc-900 rounded-xl text-xs text-zinc-500 font-semibold flex items-center justify-between">
              <span>{user.email}</span>
              <span className="text-[9px] font-bold text-zinc-650 uppercase tracking-widest bg-zinc-900 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>
          </div>

          {/* Bio Field */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-zinc-550" /> Bio / Brief Description
            </label>
            <textarea
              rows={3}
              placeholder="Tell us a little bit about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-950 font-medium resize-none"
              maxLength={160}
            />
            <div className="flex justify-end text-[10px] text-zinc-550 font-medium">
              <span>{bio.length} / 160 characters</span>
            </div>
          </div>

          {/* Timezone Selector */}
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-550" /> Preferences Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950/60 border border-zinc-850 rounded-xl text-xs text-zinc-200 focus:outline-none focus:border-indigo-950 cursor-pointer font-medium"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isPending || isUploading}
            className="flex items-center gap-1.5 py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            <span>Save Profile Settings</span>
          </button>
        </div>

      </form>
    </div>
  );
}
