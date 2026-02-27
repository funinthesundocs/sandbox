// src/app/(dashboard)/queue/page.tsx

export default function QueuePage() {
  return (
    <div>
      <h1
        style={{
          fontSize: 'var(--re-text-2xl)',
          fontWeight: 'var(--re-font-semibold)',
          color: 'var(--re-text-primary)',
          marginBottom: '8px',
        }}
      >
        Queue
      </h1>
      <p style={{ color: 'var(--re-text-muted)', fontSize: 'var(--re-text-sm)' }}>
        Coming in Phase 2.
      </p>
    </div>
  );
}
