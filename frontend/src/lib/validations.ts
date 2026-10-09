import * as Yup from "yup";

/**
 * Yup validation schemas mirroring backend Pydantic models in `backend/app/schemas/`.
 */

// Mirrors `backend/app/schemas/auth.py:SignupRequest`
export const signupSchema = Yup.object().shape({
  company_name: Yup.string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters")
    .required("Company name is required"),
  email: Yup.string()
    .trim()
    .email("Please enter a valid work email address")
    .required("Work email address is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password cannot exceed 100 characters")
    .required("Password is required"),
});

// Mirrors `backend/app/schemas/auth.py:LoginRequest`
export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .trim()
    .email("Please enter a valid work email address")
    .required("Email address is required"),
  password: Yup.string()
    .min(1, "Password is required")
    .required("Password is required"),
});

// Mirrors `backend/app/schemas/tenant.py:TenantUpdateRequest`
export const tenantUpdateSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .max(100, "Company name cannot exceed 100 characters")
    .required("Company name is required"),
});

// Mirrors `backend/app/schemas/document.py:DocumentUrlCreate`
export const documentUrlSchema = Yup.object().shape({
  url: Yup.string()
    .trim()
    .url("Please enter a valid web URL (e.g., https://example.com/docs)")
    .required("URL is required"),
  title: Yup.string()
    .trim()
    .max(255, "Title cannot exceed 255 characters")
    .optional(),
});

// Mirrors `backend/app/schemas/document.py:DocumentFaqCreate`
export const documentFaqSchema = Yup.object().shape({
  title: Yup.string()
    .trim()
    .min(1, "Title is required")
    .max(255, "Title cannot exceed 255 characters")
    .required("Title is required"),
  faq_text: Yup.string()
    .trim()
    .min(10, "FAQ content must be at least 10 characters long")
    .required("FAQ content is required"),
});

export type SignupFormValues = Yup.InferType<typeof signupSchema>;
export type LoginFormValues = Yup.InferType<typeof loginSchema>;
export type TenantUpdateFormValues = Yup.InferType<typeof tenantUpdateSchema>;
export type DocumentUrlFormValues = Yup.InferType<typeof documentUrlSchema>;
export type DocumentFaqFormValues = Yup.InferType<typeof documentFaqSchema>;
