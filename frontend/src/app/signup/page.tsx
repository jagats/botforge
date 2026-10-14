import { redirect } from "next/navigation";

export default function SignupPage() {
  // Public registration is removed — immediately redirect visitors to login
  redirect("/login");
}
