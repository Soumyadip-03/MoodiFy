"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { ShieldAlert, Users, Mail, Loader2, CheckCircle2, Activity, LayoutTemplate, FileText, Info, AlertTriangle, CheckCircle, Newspaper } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { EmailTemplateType, generateEmailHTML } from "@/utils/emailTemplates";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  isSpotifyConnected: boolean;
  createdAt: string;
}

export default function AdminPage() {
  const { theme } = useTheme() as { theme: string };
  const isDark = theme === "dark";

  const [adminSecret, setAdminSecret] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");

  const [recipientType, setRecipientType] = useState<"all" | "specific">("all");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const [template, setTemplate] = useState<EmailTemplateType>("announcement");
  const [emailTitle, setEmailTitle] = useState("");
  const [emailBody, setEmailBody] = useState("");
  
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);

  useEffect(() => {
    const savedSecret = localStorage.getItem("admin_secret");
    if (savedSecret) {
      setAdminSecret(savedSecret);
    }

    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(5000) });
        setBackendStatus(res.ok ? "online" : "offline");
      } catch {
        setBackendStatus("offline");
      }
    };
    checkBackend();
  }, []);

  const handleSaveSecret = (val: string) => {
    setAdminSecret(val);
    localStorage.setItem("admin_secret", val);
  };

  const fetchUsers = async () => {
    if (!adminSecret) return toast.error("Admin Secret required");
    setLoadingUsers(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/users/all`, {
        headers: { "Authorization": `Bearer ${adminSecret}` }
      });
      if (!res.ok) throw new Error("Failed to fetch users (Invalid secret?)");
      const data = await res.json();
      setUsers(data.users || []);
      toast.success(`Fetched ${data.users?.length || 0} users`);
    } catch (e: unknown) {
      if (e instanceof Error) toast.error(e.message);
    } finally {
      setLoadingUsers(false);
    }
  };

  const toggleUserSelection = (uid: string) => {
    const newSet = new Set(selectedUserIds);
    if (newSet.has(uid)) newSet.delete(uid);
    else newSet.add(uid);
    setSelectedUserIds(newSet);
  };

  const selectAllUsers = () => {
    setSelectedUserIds(new Set(users.map(u => u.uid)));
  };

  const clearSelection = () => {
    setSelectedUserIds(new Set());
  };

  const handleSend = async () => {
    if (!adminSecret) {
      return toast.error("Admin Secret required");
    }

    let targetUsers = users;
    if (recipientType === "specific") {
      targetUsers = users.filter(u => selectedUserIds.has(u.uid));
    }

    if (targetUsers.length === 0) {
      return toast.error("No recipients selected");
    }

    if (!emailTitle || !emailBody) {
      return toast.error("Please fill in both title and message");
    }

    setIsSending(true);
    setSendProgress(0);

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < targetUsers.length; i++) {
      const user = targetUsers[i];
      
      const htmlBody = generateEmailHTML(template, {
        title: emailTitle,
        body: emailBody,
        userName: user.displayName || "User",
        logoUrl: typeof window !== "undefined" ? `${window.location.origin}/MoodiFy.svg` : undefined
      });

      const body = {
        to_email: user.email,
        subject: emailTitle,
        body_text: emailBody,
        body_html: htmlBody
      };

      try {
        const res = await fetch(`${API_URL}/api/email/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${adminSecret}`
          },
          body: JSON.stringify(body)
        });

        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }

      setSendProgress(((i + 1) / targetUsers.length) * 100);
    }

    setIsSending(false);
    
    if (failCount === 0) {
      toast.success("Success!", { description: `Successfully sent ${successCount} emails.` });
    } else {
      toast.warning("Finished with errors", { description: `Sent: ${successCount}, Failed: ${failCount}` });
    }
  };

  const previewHtml = generateEmailHTML(template, {
    title: emailTitle || "Your Title Here",
    body: emailBody || "Your message will appear here...",
    userName: "User",
    logoUrl: typeof window !== "undefined" ? `${window.location.origin}/MoodiFy.svg` : undefined
  });

  const textClass = isDark ? "text-white" : "text-[#3A2A20]";
  const mutedText = isDark ? "text-[#aaa]" : "text-[#7A6055]";
  const cardClass = isDark ? "bg-[#1C1C1C] border-[#333]" : "bg-white border-[#E5E5E5]";
  const inputClass = isDark 
    ? "bg-[#2A2A2A] border-[#444] text-white focus:border-[#FF6B35]" 
    : "bg-[#F5F5F5] border-[#DDD] text-[#3A2A20] focus:border-[#FF6B35]";

  const templates: { id: EmailTemplateType, label: string, icon: React.ElementType, color: string }[] = [
    { id: "announcement", label: "Announcement", icon: ShieldAlert, color: "text-[#FF6B35]" },
    { id: "info", label: "Info", icon: Info, color: "text-blue-500" },
    { id: "warning", label: "Warning", icon: AlertTriangle, color: "text-red-500" },
    { id: "success", label: "Success", icon: CheckCircle, color: "text-green-500" },
    { id: "news", label: "News", icon: Newspaper, color: "text-gray-500" },
    { id: "custom", label: "Custom (Raw)", icon: FileText, color: "text-purple-500" },
  ];

  return (
    <div className={`h-screen overflow-hidden flex flex-col p-4 md:p-6 transition-colors duration-300 ${isDark ? "bg-[#121212]" : "bg-[#FDFBF7]"}`}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4 w-full mx-auto flex-shrink-0">
        <div>
          <h1 className={`text-2xl md:text-3xl font-bold flex items-center gap-2 ${textClass}`}>
            <ShieldAlert className="text-[#FF6B35]" size={28} />
            Admin Panel
          </h1>
          <p className={`mt-1 text-sm ${mutedText}`}>Manage users and dispatch official communications.</p>
        </div>

        {/* Security / Fetch Users (Moved to Header) */}
        <div className="flex items-center gap-2 flex-1 max-w-sm mx-auto md:mx-4">
          <input 
            type="password"
            value={adminSecret}
            onChange={(e) => handleSaveSecret(e.target.value)}
            placeholder="Admin Secret Key"
            className={`w-full px-4 py-2.5 rounded-xl border outline-none transition-all text-sm ${inputClass}`}
          />
          <button 
            onClick={fetchUsers}
            disabled={loadingUsers || !adminSecret}
            className="px-4 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#e85d2a] text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
          >
            {loadingUsers ? <Loader2 size={16} className="animate-spin" /> : <Users size={16} />}
            Fetch
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          <div className={`p-3 rounded-xl border flex items-center justify-center gap-3 min-w-[140px] ${cardClass}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-black/20" : "bg-black/5"}`}>
              <Activity className={backendStatus === "online" ? "text-green-500" : "text-red-500"} size={18} />
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-medium uppercase tracking-wider ${mutedText}`}>Status</span>
              <span className={`text-sm font-bold ${textClass}`}>
                {backendStatus === "checking" ? "Checking" : backendStatus === "online" ? "Online" : "Offline"}
              </span>
            </div>
          </div>
          
          <div className={`p-3 rounded-xl border flex items-center justify-center gap-3 min-w-[140px] ${cardClass}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? "bg-black/20" : "bg-black/5"}`}>
              <Users className="text-blue-500" size={18} />
            </div>
            <div className="flex flex-col">
              <span className={`text-[11px] font-medium uppercase tracking-wider ${mutedText}`}>Users</span>
              <span className={`text-sm font-bold ${textClass}`}>
                {users.length > 0 ? users.length : "-"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0 w-full mx-auto">
        {/* Left Column: Config & Form */}
        <div className="flex flex-col gap-4 h-full min-h-0 pb-6 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* Recipients Card (Moved Back to Left Column) */}
          <AnimatePresence>
            {users.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl border shadow-lg flex-shrink-0 ${cardClass}`}
              >
                <h2 className={`text-lg font-bold mb-3 flex items-center gap-2 ${textClass}`}>
                  <Users size={18} className="text-blue-500" /> Select Recipients
                </h2>
                
                <div className="flex gap-2 p-1 bg-black/5 dark:bg-white/5 rounded-xl mb-3 w-fit">
                  <button 
                    onClick={() => setRecipientType("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${recipientType === "all" ? "bg-white dark:bg-[#333] shadow-sm " + textClass : mutedText}`}
                  >
                    All Users ({users.length})
                  </button>
                  <button 
                    onClick={() => setRecipientType("specific")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${recipientType === "specific" ? "bg-white dark:bg-[#333] shadow-sm " + textClass : mutedText}`}
                  >
                    Specific Users
                  </button>
                </div>

                {recipientType === "specific" && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="flex flex-col gap-3"
                  >
                    <div className="flex justify-between items-center">
                      <span className={`text-sm font-medium ${mutedText}`}>
                        {selectedUserIds.size} selected
                      </span>
                      <div className="flex gap-2">
                        <button onClick={selectAllUsers} className="text-xs font-medium text-[#FF6B35] hover:underline">Select All</button>
                        <button onClick={clearSelection} className="text-xs font-medium text-[#FF6B35] hover:underline">Clear All</button>
                      </div>
                    </div>
                    
                    <div className={`max-h-60 overflow-y-auto rounded-xl border p-2 custom-scrollbar ${isDark ? "bg-[#111] border-[#333]" : "bg-white border-[#eee]"}`}>
                      {users.map(u => (
                        <div 
                          key={u.uid} 
                          onClick={() => toggleUserSelection(u.uid)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedUserIds.has(u.uid) ? (isDark ? "bg-[#FF6B35]/20" : "bg-[#FF6B35]/10") : (isDark ? "hover:bg-[#222]" : "hover:bg-[#f9f9f9]")}`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selectedUserIds.has(u.uid) ? "bg-[#FF6B35] border-[#FF6B35]" : (isDark ? "border-[#555]" : "border-[#ccc]")}`}>
                            {selectedUserIds.has(u.uid) && <CheckCircle2 size={14} className="text-white" />}
                          </div>
                          <div>
                            <p className={`text-sm font-medium ${textClass}`}>{u.displayName || "Unknown User"}</p>
                            <p className={`text-xs ${mutedText}`}>{u.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Email Builder Card */}
          <div className={`p-5 rounded-2xl border shadow-lg flex-1 min-h-[500px] flex flex-col ${cardClass}`}>
            <h2 className={`text-lg font-bold mb-4 flex items-center gap-2 flex-shrink-0 ${textClass}`}>
              <Mail size={18} className="text-purple-500" /> Compose Email
            </h2>

            <div className="flex-shrink-0">
              <label className={`block text-sm font-medium mb-2 ${mutedText}`}>Select Template</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {templates.map(t => {
                const Icon = t.icon;
                const isSelected = template === t.id;
                return (
                  <button 
                    key={t.id}
                    onClick={() => setTemplate(t.id)}
                    className={`px-4 py-2.5 rounded-xl border flex flex-row items-center justify-center gap-2 transition-all ${isSelected ? "border-[#FF6B35] bg-[#FF6B35]/5" : (isDark ? "border-[#444] hover:border-[#666]" : "border-[#DDD] hover:border-[#BBB]")}`}
                  >
                    <Icon size={18} className={isSelected ? "text-[#FF6B35]" : t.color} />
                    <span className={`text-sm font-medium ${isSelected ? "text-[#FF6B35]" : textClass}`}>{t.label}</span>
                  </button>
                );
              })}
              </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 min-h-0">
              <div className="flex-shrink-0">
                <label className={`block text-sm font-medium mb-1.5 ${mutedText}`}>Title / Subject</label>
                <input 
                  type="text"
                  value={emailTitle}
                  onChange={(e) => setEmailTitle(e.target.value)}
                  placeholder="Your email subject"
                  className={`w-full px-4 py-3 rounded-xl border outline-none transition-all ${inputClass}`}
                />
              </div>
              
              <div className="flex-1 flex flex-col min-h-0">
                <label className={`block text-sm font-medium mb-1.5 flex-shrink-0 ${mutedText}`}>
                  {template === "custom" ? "Raw HTML or Text" : "Message Body"}
                </label>
                <textarea 
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder={template === "custom" ? "<h1>HTML version</h1><p>Your content here...</p>" : "Write your message here..."}
                  className={`w-full flex-1 px-4 py-3 rounded-xl border outline-none transition-all resize-none ${template === "custom" ? "font-mono text-sm" : ""} ${inputClass}`}
                />
              </div>
            </div>
            
            {/* Actions */}
            <div className="mt-4 flex-shrink-0 flex flex-col sm:flex-row gap-4 items-center justify-between">
              
              {isSending && (
                <div className="flex-1 w-full flex flex-col gap-2">
                  <div className="flex justify-between text-xs font-medium text-[#FF6B35]">
                    <span>Sending emails...</span>
                    <span>{Math.round(sendProgress)}%</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? "bg-[#333]" : "bg-[#eee]"}`}>
                    <div 
                      className="h-full bg-[#FF6B35] transition-all duration-300 ease-out"
                      style={{ width: `${sendProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 w-full sm:w-auto ml-auto">
                <button 
                  disabled={isSending}
                  onClick={() => {
                    setEmailTitle(""); setEmailBody(""); 
                  }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${isDark ? "bg-[#333] hover:bg-[#444] text-white" : "bg-[#E5E5E5] hover:bg-[#D5D5D5] text-[#3A2A20]"}`}
                >
                  Clear Form
                </button>
                <button 
                  disabled={isSending || users.length === 0}
                  onClick={handleSend}
                  className="px-5 py-2.5 rounded-lg text-sm bg-[#FF6B35] hover:bg-[#e85d2a] text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSending ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                  Send to {recipientType === "all" ? users.length : selectedUserIds.size} Users
                </button>
              </div>
            </div>
            
          </div>
        </div>

        {/* Right Column: Live Preview */}
        <div className="flex flex-col h-full min-h-0 pb-6">


          <div className={`p-6 rounded-3xl border shadow-lg flex-1 min-h-0 flex flex-col ${cardClass}`}>
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${textClass}`}>
              <LayoutTemplate size={20} className="text-green-500" /> Live Preview
            </h2>
            
            <div className={`w-full flex-1 rounded-2xl border overflow-hidden ${isDark ? "bg-white border-[#222]" : "bg-white border-[#f0f0f0]"}`}>
              <iframe
                title="Email Preview"
                srcDoc={previewHtml}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
