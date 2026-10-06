import { redirect } from "next/navigation";

// Older "fix your programme" notifications link here; the programme is now edited on My details.
export default function ProgrammePage() {
  redirect("/account");
}
