import { useEffect } from "react";
import { Redirect } from "expo-router";
import { useAuthStore } from "../stores/auth.store";

export default function Index() {
  const status = useAuthStore((s) => s.status);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // ممكن تحط Splash Screen هنا بدل null
  if (status === "loading") return null;

  if (status === "authenticated") {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/auth/login" />;
}
