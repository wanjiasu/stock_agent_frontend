import { authClient } from "@/lib/auth-client";
import {Button} from "@/components/ui/button"
import { LogOut } from "lucide-react";
export default function Logout() {
    const handleLogout = async () => {
        await authClient.signOut();
    }
  return (

      <Button variant="destructive" onClick={handleLogout}>
        <LogOut />
        Logout
      </Button>

  );
}