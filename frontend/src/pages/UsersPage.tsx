import { useUsers, useUpdateUserRole } from '@/hooks/useApi';
import { useAuthStore } from '@/stores/auth.store';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Navigate } from 'react-router-dom';

const ROLE_OPTIONS = ['ADMIN', 'AUDITOR', 'VIEWER'] as const;
const ROLE_BADGES: Record<string, 'default' | 'info' | 'secondary'> = {
  ADMIN: 'default',
  AUDITOR: 'info',
  VIEWER: 'secondary',
};

export function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const { data: users, isLoading } = useUsers();
  const updateRole = useUpdateUserRole();

  if (currentUser?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>

      {isLoading ? (
        <div className="text-muted-foreground">Loading users...</div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Name</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Email</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Joined</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u) => (
                    <tr key={u.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 font-medium">{u.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-4">
                        <Badge variant={ROLE_BADGES[u.role] || 'secondary'}>{u.role}</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {new Date(u.createdAt!).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {u.id !== currentUser.id && (
                          <select
                            value={u.role}
                            onChange={(e) => updateRole.mutate({ id: u.id, role: e.target.value })}
                            className="border border-border rounded-md px-2 py-1 text-sm bg-background"
                          >
                            {ROLE_OPTIONS.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
