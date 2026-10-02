import { createSupabaseAdminClient } from '@/lib/providers/supabase/admin';
import { AuditEvent, Profile } from '@/types/database';

function isMissingTable(error: { message?: string; code?: string } | null) {
  if (!error) return false;
  const text = `${error.code ?? ''} ${error.message ?? ''}`.toLowerCase();
  return (
    text.includes('audit_events') ||
    text.includes('does not exist') ||
    text.includes('schema cache')
  );
}

export async function recordAudit(input: {
  actor: Pick<Profile, 'id' | 'full_name' | 'role'>;
  action: string;
  summary: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const admin = createSupabaseAdminClient();
    const { error } = await admin.from('audit_events').insert({
      actor_id: input.actor.id,
      actor_name: input.actor.full_name,
      actor_role: input.actor.role,
      action: input.action,
      entity_type: input.entityType ?? null,
      entity_id: input.entityId ?? null,
      entity_name: input.entityName ?? null,
      summary: input.summary,
      metadata: input.metadata ?? null,
    });
    if (error && !isMissingTable(error)) {
      console.error('audit_events insert', error.message);
    }
  } catch {
    // Nazorat jurnali asosiy amalni to'xtatmasin
  }
}

export async function getAuditEvents(limit = 150): Promise<AuditEvent[]> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('audit_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error && isMissingTable(error)) return [];
  if (error) throw error;
  return (data || []) as AuditEvent[];
}
