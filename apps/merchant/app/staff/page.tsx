"use client";

import { FormEvent, useCallback, useEffect, useState, type ReactNode } from "react";
import type { AssignableStaffRole, StaffMemberResponse } from "@airrand/contracts";
import { AlertMessage } from "../../components/ui/alert-message";
import { NotificationFeedback } from "../../components/ui/notification-feedback";
import { NOTIFICATION_UI_COPY } from "@airrand/notifications/templates";
import { LoadingState } from "../../components/ui/loading-state";
import { MerchantGate } from "../../components/merchant-gate";
import { PageShell } from "../../components/page-shell";
import { Surface } from "../../components/ui/surface";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../components/auth-context";
import { useMerchant } from "../../components/merchant-context";
import {
  ApiError,
  createStaffMember,
  deactivateStaffMember,
  fetchStaff,
  reactivateStaffMember,
  resetStaffPassword,
  updateStaffMemberRole,
} from "../../lib/api";
import { formatDateTime } from "../../lib/format";
import { formatRoleLabel, isForbiddenApiError } from "../../lib/permissions";
import { useMerchantPermissions } from "../../lib/use-merchant-permissions";

function StaffContent() {
  const { merchantId } = useMerchant();
  const { user: currentUser } = useAuth();
  const {
    canViewStaff,
    canCreateStaff,
    canUpdateStaffRole,
    canDeactivateStaff,
    canReactivateStaff,
    canResetStaffPassword,
    role: actorRole,
  } = useMerchantPermissions();

  const [staff, setStaff] = useState<StaffMemberResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [notificationInfo, setNotificationInfo] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newRole, setNewRole] = useState<AssignableStaffRole>("staff");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const load = useCallback(async () => {
    if (!merchantId || !canViewStaff) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setStaff(await fetchStaff(merchantId));
    } catch (err) {
      if (isForbiddenApiError(err)) {
        setError("You do not have permission to view staff.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to load staff");
      }
    } finally {
      setLoading(false);
    }
  }, [merchantId, canViewStaff]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!merchantId || !canCreateStaff) {
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError("Email is required.");
      return;
    }
    if (temporaryPassword.length < 8) {
      setError("Temporary password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const created = await createStaffMember(merchantId, {
        email: trimmedEmail,
        displayName: displayName.trim() || undefined,
        role: newRole,
        temporaryPassword,
      });
      setStaff((prev) =>
        [...prev.filter((member) => member.id !== created.id), created].sort(
          (a, b) => a.email.localeCompare(b.email),
        ),
      );
      setEmail("");
      setDisplayName("");
      setTemporaryPassword("");
      setNewRole(actorRole === "manager" ? "staff" : "staff");
      setSuccess(
        `Created ${created.email}. Share the temporary password securely — they must change it on first sign-in.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create staff member");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(member: StaffMemberResponse, role: AssignableStaffRole) {
    if (!merchantId || !canUpdateStaffRole) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await updateStaffMemberRole(merchantId, member.id, role);
      setStaff((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setSuccess(`Updated role for ${updated.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  async function handleReactivate(member: StaffMemberResponse) {
    if (!merchantId || !canReactivateStaff) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await reactivateStaffMember(merchantId, member.id);
      setStaff((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setSuccess(`Reactivated ${updated.email}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reactivate staff member");
    } finally {
      setSaving(false);
    }
  }

  async function handleResetPassword(member: StaffMemberResponse) {
    if (!merchantId || !canResetStaffPassword) {
      return;
    }

    const temporaryPassword = window.prompt(
      `Set a new temporary password for ${member.email} (min 8 characters):`,
    );
    if (!temporaryPassword) {
      return;
    }
    if (temporaryPassword.length < 8) {
      setError("Temporary password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    setNotificationInfo(null);
    try {
      const updated = await resetStaffPassword(
        merchantId,
        member.id,
        temporaryPassword,
      );
      setStaff((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setSuccess(
        `Password reset for ${updated.email}. Share the temporary password out of band.`,
      );
      setNotificationInfo(NOTIFICATION_UI_COPY.staffResetQueued);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(member: StaffMemberResponse) {
    if (!merchantId || !canDeactivateStaff) {
      return;
    }

    if (
      !window.confirm(
        `Deactivate ${member.email}? They will not be able to sign in until reactivated manually.`,
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await deactivateStaffMember(merchantId, member.id);
      setStaff((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setSuccess(`Deactivated ${updated.email}.`);
    } catch (err) {
      if (err instanceof ApiError && isForbiddenApiError(err)) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Failed to deactivate staff member");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!canViewStaff) {
    return (
      <PageShell
        title="Staff"
        description="Manage merchant staff accounts and roles."
      >
        <Surface>
          <AlertMessage
            variant="error"
            message="You do not have permission to manage staff."
          />
        </Surface>
      </PageShell>
    );
  }

  const assignableRoles: AssignableStaffRole[] =
    actorRole === "owner" ? ["manager", "staff"] : ["staff"];

  return (
    <PageShell
      title="Staff"
      description="Invite staff with a temporary password. New users must change it on first sign-in. Share credentials out of band — email is not enabled yet."
    >
      {error ? <NotificationFeedback kind="error" message={error} /> : null}
      {success ? <NotificationFeedback kind="actionSuccess" message={success} /> : null}
      {notificationInfo ? (
        <NotificationFeedback kind="notificationQueued" message={notificationInfo} />
      ) : null}

      {canCreateStaff ? (
        <Surface>
          <h2 className="pos-section-title">Add staff member</h2>
          <form className="pos-form-grid" onSubmit={(event) => void handleCreate(event)}>
            <label className="pos-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="off"
                required
              />
            </label>
            <label className="pos-field">
              <span>Display name (optional)</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
              />
            </label>
            <label className="pos-field">
              <span>Role</span>
              <select
                value={newRole}
                onChange={(event) => setNewRole(event.target.value as AssignableStaffRole)}
                disabled={assignableRoles.length === 1}
              >
                {assignableRoles.map((role) => (
                  <option key={role} value={role}>
                    {formatRoleLabel(role)}
                  </option>
                ))}
              </select>
            </label>
            <label className="pos-field">
              <span>Temporary password</span>
              <input
                type="password"
                value={temporaryPassword}
                onChange={(event) => setTemporaryPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                required
              />
            </label>
            <div className="pos-form-actions">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Create staff"}
              </Button>
            </div>
          </form>
        </Surface>
      ) : null}

      {loading ? <LoadingState /> : null}

      {!loading ? (
        <Surface padding="none" className="pos-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => {
                const isSelf = member.id === currentUser?.id;
                return (
                  <tr key={member.id}>
                    <td>{member.email}</td>
                    <td>{member.displayName ?? "—"}</td>
                    <td>
                      {canUpdateStaffRole &&
                      member.isActive &&
                      member.role !== "owner" ? (
                        <select
                          value={member.role}
                          disabled={saving}
                          onChange={(event) =>
                            void handleRoleChange(
                              member,
                              event.target.value as AssignableStaffRole,
                            )
                          }
                        >
                          <option value="manager">Manager</option>
                          <option value="staff">Staff</option>
                        </select>
                      ) : (
                        formatRoleLabel(member.role)
                      )}
                    </td>
                    <td>
                      {member.isActive ? "Active" : "Inactive"}
                      {member.isActive && member.mustChangePassword ? (
                        <span className="pos-muted"> · Must change password</span>
                      ) : null}
                    </td>
                    <td>
                      {member.lastLoginAt
                        ? formatDateTime(member.lastLoginAt)
                        : "Never"}
                    </td>
                    <td className="pos-table-actions">
                      {(() => {
                        const actions: ReactNode[] = [];
                        if (canReactivateStaff && !member.isActive) {
                          actions.push(
                            <Button
                              key="reactivate"
                              type="button"
                              variant="secondary"
                              disabled={saving}
                              onClick={() => void handleReactivate(member)}
                            >
                              Reactivate
                            </Button>,
                          );
                        }
                        if (
                          canResetStaffPassword &&
                          member.isActive &&
                          !isSelf &&
                          member.role !== "owner"
                        ) {
                          actions.push(
                            <Button
                              key="reset"
                              type="button"
                              variant="secondary"
                              disabled={saving}
                              onClick={() => void handleResetPassword(member)}
                            >
                              Reset password
                            </Button>,
                          );
                        }
                        if (canDeactivateStaff && member.isActive && !isSelf) {
                          actions.push(
                            <Button
                              key="deactivate"
                              type="button"
                              variant="secondary"
                              disabled={saving || member.role === "owner"}
                              onClick={() => void handleDeactivate(member)}
                            >
                              Deactivate
                            </Button>,
                          );
                        }
                        if (actions.length === 0) {
                          return "—";
                        }
                        return actions;
                      })()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {staff.length === 0 ? (
            <p className="pos-muted pos-table-empty">No staff members yet.</p>
          ) : null}
        </Surface>
      ) : null}
    </PageShell>
  );
}

export default function StaffPage() {
  return (
    <MerchantGate>
      <StaffContent />
    </MerchantGate>
  );
}
