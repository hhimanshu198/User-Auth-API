import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Alert from "../components/Alert.jsx";
import Button from "../components/Button.jsx";
import Card from "../components/Card.jsx";
import EmptyState from "../components/EmptyState.jsx";
import MetricCard from "../components/MetricCard.jsx";
import api, { getApiError } from "../services/api.js";
import { roleName } from "../utils/format.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Users() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await api.get("/users");

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.users || [];

      setUsers(data);
    } catch (err) {
      setError(getApiError(err, "Unable to load users"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const stats = useMemo(() => {
    const admins = users.filter((item) => Number(item.role_id) === 1).length;
    const normalUsers = users.filter((item) => Number(item.role_id) === 2).length;

    return {
      total: users.length,
      admins,
      normalUsers
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((item) => {
      const searchableText = [
        item.id,
        item.name,
        item.email,
        roleName(item.role_id)
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !keyword || searchableText.includes(keyword);

      const matchesRole =
        roleFilter === "all" || String(item.role_id) === String(roleFilter);

      return matchesSearch && matchesRole;
    });
  }, [users, search, roleFilter]);

  const openDeleteModal = (targetUser) => {
    if (Number(targetUser.id) === Number(user?.id)) {
      toast.error("You cannot delete your own account.");
      return;
    }

    setSelectedUser(targetUser);
  };

  const deleteUser = async () => {
    if (!selectedUser) return;

    setDeletingId(selectedUser.id);
    setError("");

    try {
      await api.delete(`/users/${selectedUser.id}`);

      setUsers((currentUsers) =>
        currentUsers.filter((item) => item.id !== selectedUser.id)
      );

      toast.success("User deleted successfully");
      setSelectedUser(null);
    } catch (err) {
      setError(getApiError(err, "Unable to delete user"));
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
  };

  return (
    <div className="page-stack users-page">
      <div className="page-title-row">
        <div>
          <p className="eyebrow">Admin control center</p>
          <h1>User Management</h1>
          <p className="muted">
            View users, filter accounts, verify role-based access, and test
            admin-only delete permissions.
          </p>
        </div>

        <div className="page-actions">
          <Button variant="secondary" onClick={clearFilters}>
            Clear filters
          </Button>

          <Button variant="primary" loading={loading} onClick={loadUsers}>
            Refresh users
          </Button>
        </div>
      </div>

      <Alert type="danger" onClose={() => setError("")}>
        {error}
      </Alert>

      <div className="metrics-grid compact">
        <MetricCard label="Total users" value={stats.total} hint="Registered accounts" />
        <MetricCard label="Admins" value={stats.admins} hint="Role ID 1" />
        <MetricCard label="Normal users" value={stats.normalUsers} hint="Role ID 2" />
      </div>

      <Card className="users-card">
        <div className="table-toolbar advanced-toolbar">
          <div>
            <h2>All users</h2>
            <p>
              Showing {filteredUsers.length} of {users.length} account(s)
            </p>
          </div>

          <div className="filter-row">
            <input
              className="search-input"
              placeholder="Search by name, email, id, or role"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <select
              className="select-input"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
            >
              <option value="all">All roles</option>
              <option value="1">Admins</option>
              <option value="2">Users</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="user-table-skeleton">
            <div />
            <div />
            <div />
            <div />
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            title="No users found"
            text="Try changing the search keyword or role filter."
          />
        ) : (
          <div className="table-wrap premium-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((item) => {
                  const isCurrentUser = Number(item.id) === Number(user?.id);
                  const isAdmin = Number(item.role_id) === 1;

                  return (
                    <tr key={item.id}>
                      <td>
                        <span className="id-pill">#{item.id}</span>
                      </td>

                      <td>
                        <div className="user-cell">
                          <div className="avatar">
                            {(item.name || item.email || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <strong>{item.name || "Unnamed user"}</strong>
                            {isCurrentUser && <p>Current account</p>}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="email-cell">{item.email || "—"}</span>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            isAdmin ? "badge-admin" : "badge-user"
                          }`}
                        >
                          {roleName(item.role_id)}
                        </span>
                      </td>

                      <td>
                        <span className="status-pill active">Active</span>
                      </td>

                      <td>
                        <Button
                          variant="danger"
                          loading={deletingId === item.id}
                          disabled={isCurrentUser}
                          onClick={() => openDeleteModal(item)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedUser && (
        <div className="modal-backdrop">
          <div className="modal-card premium-modal">
            <p className="eyebrow">Confirm delete</p>

            <h2>Delete this user?</h2>

            <p className="muted">
              This will remove <strong>{selectedUser.email}</strong> from your
              system. This action cannot be undone.
            </p>

            <div className="danger-preview">
              <span>Name</span>
              <strong>{selectedUser.name || "Unnamed user"}</strong>

              <span>Email</span>
              <strong>{selectedUser.email || "—"}</strong>

              <span>Role</span>
              <strong>{roleName(selectedUser.role_id)}</strong>
            </div>

            <div className="modal-actions">
              <Button
                variant="secondary"
                disabled={Boolean(deletingId)}
                onClick={() => setSelectedUser(null)}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                loading={deletingId === selectedUser.id}
                onClick={deleteUser}
              >
                Yes, delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}