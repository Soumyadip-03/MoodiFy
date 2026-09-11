"use client";

import { useState, useRef } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";

interface ContactFormProps {
  defaultEmail?: string;
  defaultName?: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}

export function ContactForm({
  defaultEmail = "",
  defaultName = "",
  onCancel,
  onSuccess,
}: ContactFormProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [email, setEmail] = useState(defaultEmail);
  const [name, setName] = useState(defaultName);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error("Invalid file type", { description: "Please select a PNG or JPEG image." });
      return;
    }

    // Validate size (e.g. 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Please select an image under 5MB." });
      return;
    }

    setFile(selectedFile);
  };

  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim() || !message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("user_email", email);
      formData.append("user_name", name);
      formData.append("message", message);
      if (file) {
        formData.append("file", file);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/email/feedback`, {
        method: "POST",
        body: formData, // fetch automatically sets the boundary for multipart/form-data
      });

      if (!response.ok) {
        throw new Error("Failed to send feedback");
      }

      toast.success("Message sent!", {
        description: "Thank you for reaching out to us.",
      });
      
      setMessage("");
      setFile(null);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Your Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!!defaultName || loading}
            className={`w-full px-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#FF6B35] transition-colors ${
              isDark
                ? "bg-[#1a1a1a] border-[#333333] text-white placeholder-gray-500 disabled:opacity-50"
                : "bg-[#F5F5F5] border-[#E5E5E5] text-black placeholder-gray-400 disabled:opacity-50"
            }`}
            required
          />
        </div>
        <div className="flex-1">
          <input
            type="email"
            placeholder="Your Email *"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!!defaultEmail || loading}
            className={`w-full px-4 py-2.5 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#FF6B35] transition-colors ${
              isDark
                ? "bg-[#1a1a1a] border-[#333333] text-white placeholder-gray-500 disabled:opacity-50"
                : "bg-[#F5F5F5] border-[#E5E5E5] text-black placeholder-gray-400 disabled:opacity-50"
            }`}
            required
          />
        </div>
      </div>

      <textarea
        placeholder="What's on your mind? *"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className={`w-full h-32 p-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-[#FF6B35] resize-none transition-colors ${
          isDark
            ? "bg-[#1a1a1a] border-[#333333] text-white placeholder-gray-500"
            : "bg-[#F5F5F5] border-[#E5E5E5] text-black placeholder-gray-400"
        }`}
        disabled={loading}
        required
      />

      <div className="flex items-center justify-between mt-2">
        <div>
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={loading}
          />
          {!file ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-[#FF6B35] ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <Paperclip size={16} /> Attach Image (Optional)
            </button>
          ) : (
            <div className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg border ${
              isDark ? "bg-[#1a1a1a] border-[#333333] text-gray-300" : "bg-[#F5F5F5] border-[#E5E5E5] text-gray-700"
            }`}>
              <Paperclip size={14} className="text-[#FF6B35]" />
              <span className="truncate max-w-[80px] sm:max-w-[100px]">{file.name}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={loading}
                className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors ${
                isDark ? "bg-[#222222] hover:bg-[#333333] text-white" : "bg-[#F0F0F0] hover:bg-[#E0E0E0] text-black"
              }`}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#FF6B35] rounded-xl hover:bg-[#e85d2a] disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              "Send Message"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
