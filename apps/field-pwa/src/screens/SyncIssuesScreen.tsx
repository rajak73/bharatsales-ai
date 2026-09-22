import { useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, RotateCcw, Trash2, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSyncEngine, type SyncIssue } from '../hooks/useSyncEngine';
import { describeSyncItem } from '../sync/ownership';

function formatWhen(ms: number) {
  const date = new Date(ms);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

/**
 * Queue items that will not sync on their own: this user's items the server
 * rejected (or that ran out of retries) — Retry or Discard — and items
 * another user queued on this device, which are never sent with this
 * user's session — Discard only.
 */
export function SyncIssuesScreen() {
  const navigate = useNavigate();
  const { failedItems, isOnline, retryFailed, discardFailed } = useSyncEngine();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (id: number, fn: () => Promise<void>) => {
    setBusyId(id);
    setActionError(null);
    try {
      await fn();
    } catch (err: any) {
      setActionError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDiscard = (item: SyncIssue) => {
    if (item.id === undefined) return;
    const what = describeSyncItem(item);
    const message = item.foreign
      ? `${what} was saved on this device by another user. Discarding deletes it permanently; it will never be sent to the server.`
      : `${what} will be permanently deleted from this device and never sent to the server.`;
    if (!window.confirm(message)) return;
    const id = item.id;
    run(id, () => discardFailed(id));
  };

  return (
    <div className="bg-background min-h-screen font-sans pb-24">
      <div className="bg-navy-900 px-4 pt-10 pb-3 flex items-center shadow-md sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="text-white mr-4" aria-label="Back">
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-white text-xl font-bold tracking-tight">Sync issues</h1>
      </div>

      <div className="p-4 space-y-3">
        {actionError && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
            {actionError}
          </div>
        )}

        {failedItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-border shadow-sm">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500 mb-3" />
            <h3 className="text-sm font-semibold text-gray-900">No sync issues</h3>
            <p className="text-sm text-gray-500 mt-1">Everything you saved offline is either synced or still on its way.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              {failedItems.length} item{failedItems.length === 1 ? '' : 's'} could not be synced automatically.
            </p>
            {failedItems.map((item) => {
              const busy = busyId === item.id;
              return (
                <div
                  key={item.id}
                  className={`bg-white p-4 rounded-xl shadow-sm border ${item.foreign ? 'border-gray-200' : 'border-red-200'}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        item.foreign ? 'bg-gray-100 text-gray-500' : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {item.foreign ? <UserX size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{describeSyncItem(item)}</h3>
                        <span className="text-[10px] text-gray-500 whitespace-nowrap shrink-0">{formatWhen(item.createdAt)}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 break-words">
                        {item.foreign
                          ? 'Belongs to another user. It will sync when they log in on this device.'
                          : item.error || 'The server did not accept this item.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    {busy ? (
                      <div className="flex-1 flex justify-center py-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
                      </div>
                    ) : (
                      <>
                        {!item.foreign && (
                          <button
                            type="button"
                            disabled={!isOnline || item.id === undefined}
                            onClick={() => item.id !== undefined && run(item.id, () => retryFailed(item.id!))}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-primary-50 text-primary-600 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                            Retry
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={item.id === undefined}
                          onClick={() => handleDiscard(item)}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-semibold hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          Discard
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {!isOnline && (
              <p className="text-xs text-gray-500 text-center">You are offline. Retry is available once you reconnect.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
