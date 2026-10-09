"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import { tenantApi } from "../../../lib/api";
import { useAuth } from "../../../contexts/AuthContext";
import { tenantUpdateSchema, TenantUpdateFormValues } from "../../../lib/validations";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch tenant profile
  const {
    data: tenant,
    isLoading: isLoadingTenant,
  } = useQuery({
    queryKey: ["tenantProfile"],
    queryFn: tenantApi.getProfile,
  });

  // Fetch widget API key
  const {
    data: apiKey,
    isLoading: isLoadingKey,
  } = useQuery({
    queryKey: ["tenantApiKey"],
    queryFn: tenantApi.getApiKey,
  });

  // Mutation to update company name
  const updateMutation = useMutation({
    mutationFn: (newName: string) => tenantApi.updateProfile({ name: newName }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tenantProfile"] });
      await refreshUser();
      setIsEditingName(false);
      setSaveError(null);
    },
    onError: (err: any) => {
      setSaveError(err?.message || "Failed to update company name.");
    },
  });

  const formik = useFormik<TenantUpdateFormValues>({
    initialValues: {
      name: tenant?.name || "",
    },
    enableReinitialize: true,
    validationSchema: tenantUpdateSchema,
    onSubmit: async (values) => {
      setSaveError(null);
      await updateMutation.mutateAsync(values.name.trim());
    },
  });

  const embedSnippet = apiKey
    ? `<script src="http://localhost:8000/widget.js" data-public-key="${apiKey.public_key}" async></script>`
    : "";

  const handleCopy = () => {
    if (!embedSnippet) return;
    navigator.clipboard.writeText(embedSnippet);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  if (isLoadingTenant || isLoadingKey) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-12">
        <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"></div>
        <span className="text-sm">Loading workspace configuration...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1.5">
          Workspace Settings & Embed
        </h1>
        <p className="text-sm text-slate-400">
          Manage your organization profile, inspect public API credentials, and integrate the chatbot snippet.
        </p>
      </div>

      {saveError && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
          <span>⚠️</span>
          <span>{saveError}</span>
        </div>
      )}

      {/* Organization Details */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-white mb-6 flex items-center gap-2">
          <span>🏢</span>
          <span>Organization Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Company Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Company Name
            </label>
            {!isEditingName ? (
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-white">{tenant?.name}</span>
                <button
                  type="button"
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  onClick={() => {
                    formik.resetForm({ values: { name: tenant?.name || "" } });
                    setIsEditingName(true);
                  }}
                >
                  Edit
                </button>
              </div>
            ) : (
              <form onSubmit={formik.handleSubmit} noValidate className="mt-1">
                <div className="flex items-center gap-2">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={`px-3 py-1.5 bg-slate-950 border rounded-lg text-sm text-white focus:outline-none focus:ring-2 w-44 transition-all ${
                      formik.touched.name && formik.errors.name
                        ? "border-red-500/60 focus:ring-red-500/30 focus:border-red-500"
                        : "border-slate-700 focus:ring-blue-500"
                    }`}
                    value={formik.values.name}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    disabled={updateMutation.isPending}
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50"
                    disabled={updateMutation.isPending}
                  >
                    {updateMutation.isPending ? "..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-all"
                    onClick={() => {
                      formik.resetForm();
                      setIsEditingName(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
                {formik.touched.name && formik.errors.name && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <span>•</span>
                    <span>{formik.errors.name}</span>
                  </p>
                )}
              </form>
            )}
          </div>

          {/* Workspace Slug */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Workspace Slug
            </label>
            <span className="px-2.5 py-1 rounded-md bg-slate-950 font-mono text-xs text-slate-300 border border-slate-800">
              {tenant?.slug}
            </span>
          </div>

          {/* Plan */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Subscription Plan
            </label>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {tenant?.plan}
            </span>
          </div>

          {/* Tenant ID */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Partition Tenant ID
            </label>
            <span className="font-mono text-xs text-slate-400 block truncate" title={tenant?.id}>
              {tenant?.id}
            </span>
          </div>
        </div>
      </div>

      {/* Widget Embed Code */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
          <span>🔌</span>
          <span>Embed Chatbot on Your Website</span>
        </h2>
        <p className="text-sm text-slate-400 mb-6 max-w-2xl">
          Paste this single script tag into the <code>&lt;head&gt;</code> or <code>&lt;body&gt;</code> of your website.
          The widget connects directly to BotForge using your organization&apos;s public API key.
        </p>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-2">
              <span>Public Key:</span>
              <code className="px-2 py-0.5 rounded bg-slate-950 text-blue-400 font-mono text-xs border border-slate-800">
                {apiKey?.public_key}
              </code>
            </span>
            <div className="flex items-center gap-2">
              <a
                href={`/widget-demo.html?key=${encodeURIComponent(apiKey?.public_key || "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors"
              >
                <span>🧪</span>
                <span>Test in Live Demo ↗</span>
              </a>
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <span>{copyFeedback ? "✅" : "📋"}</span>
                <span>{copyFeedback ? "Copied to Clipboard!" : "Copy Snippet"}</span>
              </button>
            </div>
          </div>

          <pre className="bg-slate-950 border border-slate-800/90 rounded-xl p-4 font-mono text-xs text-sky-400 overflow-x-auto whitespace-pre-wrap break-all shadow-inner">
            {embedSnippet}
          </pre>
        </div>
      </div>
    </div>
  );
}
