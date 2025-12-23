import { useLocalSearchParams } from "expo-router";
import ProfileScreen from "@/features/profile/screen/ProfileScreen";

export default function UserProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProfileScreen userId={String(id)} />;
}
