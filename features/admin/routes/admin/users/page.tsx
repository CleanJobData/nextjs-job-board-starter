import { Typography } from "@/components/ui/Typography";
import { PageContainer } from "@/components/ui/PageContainer";
import { auth } from "@/features/auth/lib/auth";
import { listAllUsers } from "../../../actions/users";
import { UserRow } from "../../../components/UserRow";

export default async function AdminUsersPage() {
  const [users, session] = await Promise.all([listAllUsers(), auth()]);
  const currentUserId = session?.user?.id;

  return (
    <PageContainer size="full">
      <div className="mb-8">
        <Typography variant="h1" className="mb-2">
          Users
        </Typography>
        <Typography className="text-muted-foreground">
          {users.length} user{users.length === 1 ? "" : "s"}. You can&apos;t change your own admin role.
        </Typography>
      </div>
      <div className="space-y-3">
        {users.map((u) => (
          <UserRow key={u.id} user={u} isSelf={u.id === currentUserId} />
        ))}
      </div>
    </PageContainer>
  );
}
