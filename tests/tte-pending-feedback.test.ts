import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pendingTteFeedback } from '../app/utils/tte-pending-feedback.ts';

const live = { status: 'PENDING', signingUrl: 'https://portal.test/sign' };

test('external signing failure returns an error and instructions to resend the draft', () => {
  const feedback = pendingTteFeedback(
    { status: 'FAILED', errorMessage: 'External API HTTP 500' },
    true,
    'draf'
  );
  assert.equal(feedback.kind, 'toast');
  if (feedback.kind === 'toast') {
    assert.equal(feedback.color, 'error');
    assert.equal(feedback.title, 'df_tte_failed');
    assert.equal(feedback.description, 'df_tte_back_to_draft');
  }
});

test('only a completed signing transaction reports success', () => {
  assert.deepEqual(pendingTteFeedback({ status: 'SIGNED', completedAt: '2026-10-09T03:00:00Z' }), {
    kind: 'toast',
    color: 'success',
    title: 'df_tte_completed',
  });
  for (const status of ['SIGNED', 'PROCESSING', 'RECONCILING']) {
    const feedback = pendingTteFeedback({ status });
    assert.equal(feedback.kind === 'toast' && feedback.color, 'info');
  }
});

test('partial, cancelled and expired sessions never report success or redirect', () => {
  for (const status of ['PARTIAL', 'CANCELLED', 'EXPIRED', 'FAILED']) {
    const feedback = pendingTteFeedback({ ...live, status }, true);
    assert.equal(feedback.kind, 'toast');
    assert.notEqual(feedback.kind === 'toast' && feedback.color, 'success');
  }
});

test('a completedAt timestamp does not hide a completion error', () => {
  const feedback = pendingTteFeedback({
    status: 'SIGNED',
    completedAt: '2026-10-09',
    completionError: 'Persistence failed',
  });
  assert.equal(feedback.kind === 'toast' && feedback.color, 'error');
});

test('resume redirects only a live session, not a document restored to drafts', () => {
  assert.deepEqual(pendingTteFeedback(live, true, 'pending_tte'), {
    kind: 'redirect',
    url: live.signingUrl,
  });
  assert.equal(pendingTteFeedback(live, true, 'draf').kind, 'toast');
  assert.equal(
    pendingTteFeedback({ ...live, expiresAt: '2000-01-01T00:00:00Z' }, true).kind,
    'toast'
  );
});

test('a successful status check without a signing URL is informational, not signing success', () => {
  assert.equal(pendingTteFeedback({ status: 'PENDING' }).kind, 'toast');
  const feedback = pendingTteFeedback({ status: 'PENDING' }, true);
  assert.equal(feedback.kind === 'toast' && feedback.title, 'df_tte_resume_unavailable');
});
