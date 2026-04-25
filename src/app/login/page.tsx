import { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Admin Login | SiteLeader Admin",
  description: "Login page for SiteLeader admin panel",
};

export default function LoginPage() {
  return <LoginForm />;
}
