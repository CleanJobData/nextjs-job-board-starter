import { Typography } from "@/components/ui/Typography";
import { PageContainer } from "@/components/ui/PageContainer";
import { auth } from "@/features/auth/lib/auth";
import { listAllUsers } from "../../../actions/users";
import { UsersSearch } from "../../../components/UsersSearch";
import { UsersList } from "../../../components/UsersList";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const [{ data: users, total }, session] = await Promise.all([listAllUsers({ q: query }), auth()]);
  const currentUserId = session?.user?.id;

  return (
    <PageContainer size="full">
      <div className="mb-6">
        <Typography variant="h1" className="mb-2">
          Users
        </Typography>
        <Typography className="text-muted-foreground">
          {total} user{total === 1 ? "" : "s"}. You can&apos;t change your own admin role.
        </Typography>
      </div>

      <div className="mb-6">
        <UsersSearch initialQuery={query} />
      </div>

      <UsersList initial={users} total={total} query={query} currentUserId={currentUserId} />
    </PageContainer>
  );
}
