"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useFormik } from "formik";
import { adminApi } from "../../../lib/api";
import { Brand } from "../../../types";
import { brandCreateSchema, BrandCreateFormValues } from "../../../lib/validations";

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState<boolean>(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [brandToDelete, setBrandToDelete] = useState<Brand | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const fetchBrands = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminApi.listBrands(0, 500);
      setBrands(data.brands);
    } catch (err: any) {
      setError(err?.message || "Failed to load brands.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const matchesSearch =
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.owner_email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || brand.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [brands, searchQuery, statusFilter]);

  // Reset to first page when filtering or searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / pageSize));

  // Automatically clamp page if results shrink
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredBrands.length);

  const paginatedBrands = useMemo(() => {
    return filteredBrands.slice(startIndex, startIndex + pageSize);
  }, [filteredBrands, startIndex, pageSize]);

  // Generate numbered page buttons with smart ellipsis
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxButtons = 5;

    if (totalPages <= maxButtons + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push("...");
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push("...");
      }
      pages.push(totalPages);
    }
    return pages;
  };

  // Metric stats
  const stats = useMemo(() => {
    const total = brands.length;
    const active = brands.filter((b) => b.status === "active").length;
    const suspended = brands.filter((b) => b.status === "suspended").length;
    const totalDocs = brands.reduce((acc, b) => acc + (b.document_count || 0), 0);
    return { total, active, suspended, totalDocs };
  }, [brands]);

  // Toggle active/suspended status
  const handleToggleStatus = async (brand: Brand) => {
    const newStatus = brand.status === "active" ? "suspended" : "active";
    setActionLoadingId(brand.tenant_id);
    try {
      const updated = await adminApi.updateStatus(brand.tenant_id, newStatus);
      setBrands((prev) =>
        prev.map((b) => (b.tenant_id === brand.tenant_id ? updated : b))
      );
    } catch (err: any) {
      alert(`Error updating brand status: ${err?.message || "Operation failed"}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete brand
  const handleConfirmDelete = async () => {
    if (!brandToDelete) return;
    setActionLoadingId(brandToDelete.tenant_id);
    try {
      await adminApi.deleteBrand(brandToDelete.tenant_id);
      setBrands((prev) => prev.filter((b) => b.tenant_id !== brandToDelete.tenant_id));
      setBrandToDelete(null);
      setDeleteConfirmText("");
    } catch (err: any) {
      alert(`Error offboarding brand: ${err?.message || "Deletion failed"}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Copy API key to clipboard
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Formik modal for onboarding
  const formik = useFormik<BrandCreateFormValues>({
    initialValues: {
      company_name: "",
      email: "",
      password: "",
      plan: "trial",
    },
    validationSchema: brandCreateSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      setError(null);
      try {
        const newBrand = await adminApi.createBrand({
          company_name: values.company_name.trim(),
          email: values.email.trim().toLowerCase(),
          password: values.password,
          plan: values.plan,
        });
        setBrands((prev) => [newBrand, ...prev]);
        resetForm();
        setIsOnboardModalOpen(false);
      } catch (err: any) {
        alert(err?.message || "Failed to onboard new brand.");
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Client Brands & Provisioning</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Agency RBAC
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Provision dedicated client organizations, manage subscription tiers, and control account active status.
          </p>
        </div>

        <button
          onClick={() => setIsOnboardModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 transition-all active:scale-95"
        >
          <span>✨</span>
          <span>Onboard New Brand</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Total Brands
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">Onboarded client workspaces</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
            Active Workspaces
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.active}</div>
          <div className="text-[11px] text-slate-500 mt-1">Bots accepting chat & ingestion</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
            Suspended
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.suspended}</div>
          <div className="text-[11px] text-slate-500 mt-1">Locked out accounts & blocked widgets</div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-1">
            Knowledge Documents
          </div>
          <div className="text-2xl font-bold text-blue-400">{stats.totalDocs}</div>
          <div className="text-[11px] text-slate-500 mt-1">Total documents vectorized in Qdrant</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by brand name, slug, or owner email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 bg-slate-950/80 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
          <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm">🔍</span>
        </div>

        <div className="flex items-center gap-2">
          {(["all", "active", "suspended"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                statusFilter === filter
                  ? "bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent"
              }`}
            >
              {filter}
            </button>
          ))}
          <button
            onClick={fetchBrands}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-800 transition-colors"
            title="Refresh brand list"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Brands Table */}
      <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
            <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Loading brand directory...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            <p className="mb-3">⚠️ {error}</p>
            <button
              onClick={fetchBrands}
              className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
            >
              Retry
            </button>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800/60 flex items-center justify-center text-xl">
              🏢
            </div>
            <h3 className="text-base font-semibold text-white">No brands found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
              {searchQuery || statusFilter !== "all"
                ? "No client organizations match your filter criteria."
                : "No client brands have been onboarded yet. Click below to provision your first brand."}
            </p>
            <button
              onClick={() => setIsOnboardModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-md"
            >
              + Onboard First Brand
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/60 border-b border-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-6 font-semibold">Brand / Workspace</th>
                  <th className="py-3.5 px-4 font-semibold">Owner Contact</th>
                  <th className="py-3.5 px-4 font-semibold">Plan</th>
                  <th className="py-3.5 px-4 font-semibold">Knowledge Stats</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {paginatedBrands.map((brand) => (
                  <tr
                    key={brand.tenant_id}
                    className="hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-white">{brand.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        slug: {brand.slug}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="text-slate-200 text-xs font-medium">
                        {brand.owner_email || "No owner email"}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Joined {new Date(brand.created_at).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                          brand.plan === "pro"
                            ? "bg-purple-500/15 text-purple-300 border border-purple-500/30"
                            : brand.plan === "starter"
                            ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                            : "bg-slate-800 text-slate-300 border border-slate-700"
                        }`}
                      >
                        {brand.plan}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-300" title="Knowledge Documents">
                          📄 <strong>{brand.document_count}</strong> docs
                        </span>
                        <span className="text-slate-400" title="Chat Sessions">
                          💬 <strong>{brand.chat_session_count}</strong> chats
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          brand.status === "active"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-red-500/10 text-red-400 border border-red-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            brand.status === "active"
                              ? "bg-emerald-400 animate-pulse"
                              : "bg-red-400"
                          }`}
                        ></span>
                        <span>{brand.status}</span>
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Copy Public Key */}
                        {brand.public_api_key && (
                          <button
                            onClick={() => handleCopyKey(brand.public_api_key!)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
                            title="Copy Widget Public API Key"
                          >
                            <span>🔑</span>
                            <span>
                              {copiedKey === brand.public_api_key ? "Copied!" : "Embed Key"}
                            </span>
                          </button>
                        )}

                        {/* Toggle Status (Active / Suspended) */}
                        <button
                          onClick={() => handleToggleStatus(brand)}
                          disabled={actionLoadingId === brand.tenant_id}
                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                            brand.status === "active"
                              ? "text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                              : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
                          } disabled:opacity-50`}
                          title={
                            brand.status === "active"
                              ? "Suspend Brand (blocks login and widget chat)"
                              : "Reactivate Brand"
                          }
                        >
                          {actionLoadingId === brand.tenant_id
                            ? "Updating..."
                            : brand.status === "active"
                            ? "Suspend"
                            : "Activate"}
                        </button>

                        {/* Offboard / Delete Brand */}
                        <button
                          onClick={() => setBrandToDelete(brand)}
                          disabled={actionLoadingId === brand.tenant_id}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Offboard Brand"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Frontend Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-950/40 border-t border-slate-800/80 text-xs text-slate-400">
            {/* Left: Summary info & Page size selector */}
            <div className="flex flex-wrap items-center gap-4">
              <div>
                Showing{" "}
                <span className="font-semibold text-slate-200">
                  {filteredBrands.length === 0 ? 0 : startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-200">{endIndex}</span> of{" "}
                <span className="font-semibold text-slate-200">
                  {filteredBrands.length}
                </span>{" "}
                {filteredBrands.length === 1 ? "brand" : "brands"}
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="pageSizeSelect" className="text-slate-500 font-medium">
                  Per page:
                </label>
                <select
                  id="pageSizeSelect"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            {/* Right: Page Navigation Buttons */}
            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="First Page"
                aria-label="First Page"
              >
                «
              </button>

              {/* Previous Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Previous Page"
                aria-label="Previous Page"
              >
                ‹
              </button>

              {/* Numbered Page Buttons */}
              <div className="flex items-center gap-1">
                {getPageNumbers().map((p, idx) =>
                  typeof p === "number" ? (
                    <button
                      key={idx}
                      onClick={() => setCurrentPage(p)}
                      className={`min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
                        currentPage === p
                          ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-500 font-bold"
                          : "border border-slate-800/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
                      }`}
                    >
                      {p}
                    </button>
                  ) : (
                    <span key={idx} className="px-1 text-slate-600 select-none">
                      ...
                    </span>
                  )
                )}
              </div>

              {/* Next Page */}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Next Page"
                aria-label="Next Page"
              >
                ›
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1.5 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/80 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title="Last Page"
                aria-label="Last Page"
              >
                »
              </button>
            </div>
          </div>
        </>
      )}
      </div>

      {/* Onboard New Brand Modal */}
      {isOnboardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>✨</span>
                  <span>Onboard New Brand</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Provision tenant organization, primary owner, and widget credentials atomically.
                </p>
              </div>
              <button
                onClick={() => setIsOnboardModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="company_name">
                  Company / Brand Name
                </label>
                <input
                  id="company_name"
                  name="company_name"
                  type="text"
                  placeholder="Acme Diagnostics"
                  value={formik.values.company_name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 ${
                    formik.touched.company_name && formik.errors.company_name
                      ? "border-red-500/60 focus:ring-red-500/30"
                      : "border-slate-800 focus:ring-purple-500"
                  }`}
                  disabled={formik.isSubmitting}
                />
                {formik.touched.company_name && formik.errors.company_name && (
                  <p className="mt-1 text-xs text-red-400">• {formik.errors.company_name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="email">
                  Owner Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="admin@acmediagnostics.com"
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-500/60 focus:ring-red-500/30"
                      : "border-slate-800 focus:ring-purple-500"
                  }`}
                  disabled={formik.isSubmitting}
                />
                {formik.touched.email && formik.errors.email && (
                  <p className="mt-1 text-xs text-red-400">• {formik.errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="password">
                  Temporary Admin Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-4 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 ${
                    formik.touched.password && formik.errors.password
                      ? "border-red-500/60 focus:ring-red-500/30"
                      : "border-slate-800 focus:ring-purple-500"
                  }`}
                  disabled={formik.isSubmitting}
                />
                {formik.touched.password && formik.errors.password && (
                  <p className="mt-1 text-xs text-red-400">• {formik.errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5" htmlFor="plan">
                  Subscription Plan
                </label>
                <select
                  id="plan"
                  name="plan"
                  value={formik.values.plan}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={formik.isSubmitting}
                >
                  <option value="trial">Trial (Free 14 days)</option>
                  <option value="starter">Starter ($49/mo)</option>
                  <option value="pro">Pro Enterprise ($199/mo)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOnboardModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  disabled={formik.isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all disabled:opacity-50"
                >
                  {formik.isSubmitting ? "Provisioning..." : "Provision Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Offboard Confirmation Modal */}
      {brandToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-red-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 text-lg mb-4">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Offboard & Delete &quot;{brandToDelete.name}&quot;?
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              This action is permanent. All database records (users, chat sessions, API keys, uploaded documents) and all vectorized chunks in Qdrant will be immediately purged.
            </p>

            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-1.5">
                Type <strong className="text-slate-200">{brandToDelete.slug}</strong> to confirm:
              </label>
              <input
                type="text"
                placeholder={brandToDelete.slug}
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setBrandToDelete(null);
                  setDeleteConfirmText("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                disabled={actionLoadingId !== null}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteConfirmText !== brandToDelete.slug || actionLoadingId !== null}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {actionLoadingId ? "Deleting..." : "Permanently Offboard"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
