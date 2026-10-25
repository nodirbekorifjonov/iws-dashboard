'use client';

import {
  createStaffAccount,
  resetStaffPassword,
  updateStaffAccount,
} from '@/lib/actions/governance';
import type { StaffAccount } from '@/lib/api/governance';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { USER_ROLE_LABELS, UserRole } from '@/types/database';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const ROLE_OPTIONS = [
  { value: 'brigadier', label: USER_ROLE_LABELS.brigadier },
  { value: 'admin', label: USER_ROLE_LABELS.admin },
  { value: 'superadmin', label: USER_ROLE_LABELS.superadmin },
];

export function UsersManager({
  accounts,
  locations,
}: {
  accounts: StaffAccount[];
  locations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const locationOptions = [
    { value: '', label: 'Blok tanlang' },
    ...locations.map((location) => ({ value: location.id, label: location.name })),
  ];

  return (
    <div className="space-y-6">
      {message ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</div>
      ) : null}

      <Card>
        <CardContent className="p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Yangi xodim</h2>
          <form
            className="mt-4 grid gap-3 sm:grid-cols-2"
            action={async (formData) => {
              const result = await createStaffAccount(formData);
              setMessage(result.error || null);
              if (!result.error) router.refresh();
            }}
          >
            <Input name="full_name" label="F.I.Sh" required />
            <Input name="email" label="Email" type="email" required />
            <Input name="password" label="Parol" type="text" required minLength={6} />
            <Select name="role" label="Rol" options={ROLE_OPTIONS} defaultValue="brigadier" />
            <Select name="location_id" label="Blok (brigadir uchun)" options={locationOptions} />
            <div className="sm:col-span-2">
              <Button type="submit">Yaratish</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {accounts.map((account) => (
          <StaffRow
            key={`${account.id}:${account.role}:${account.locationId ?? ''}`}
            account={account}
            locationOptions={locationOptions}
            onMessage={setMessage}
          />
        ))}
      </div>
    </div>
  );
}

function StaffRow({
  account,
  locationOptions,
  onMessage,
}: {
  account: StaffAccount;
  locationOptions: { value: string; label: string }[];
  onMessage: (message: string | null) => void;
}) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(
    account.role === 'worker' || account.role === 'creator' ? 'brigadier' : account.role
  );
  const [locationId, setLocationId] = useState(account.locationId || '');

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="break-words font-medium text-slate-900">{account.fullName}</p>
            <p className="break-all text-sm text-slate-500">{account.email || 'Email yo‘q'}</p>
          </div>
          <Badge variant={account.isCreator ? 'info' : 'neutral'}>
            {account.isCreator ? 'Creator' : USER_ROLE_LABELS[account.role]}
          </Badge>
        </div>
        {account.isCreator ? (
          <p className="text-sm text-slate-500">Bu hisobning roli va paroli shu yerda o‘zgarmaydi.</p>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            <form
              className="space-y-3"
              action={async (formData) => {
                const result = await updateStaffAccount(formData);
                onMessage(result.error || null);
                if (!result.error) router.refresh();
              }}
            >
              <input type="hidden" name="user_id" value={account.id} />
              <Select
                name="role"
                label="Rol"
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                options={ROLE_OPTIONS}
              />
              {role === 'brigadier' ? (
                <Select
                  name="location_id"
                  label="Blok"
                  value={locationId}
                  onChange={(event) => setLocationId(event.target.value)}
                  options={locationOptions}
                />
              ) : (
                <input type="hidden" name="location_id" value="" />
              )}
              <Button type="submit" size="sm">
                Saqlash
              </Button>
            </form>
            <form
              className="space-y-3"
              action={async (formData) => {
                const result = await resetStaffPassword(formData);
                onMessage(result.error || null);
                if (!result.error) router.refresh();
              }}
            >
              <input type="hidden" name="user_id" value={account.id} />
              <Input name="password" label="Yangi parol" type="text" required minLength={6} />
              <Button type="submit" size="sm" variant="secondary">
                Parolni yangilash
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
