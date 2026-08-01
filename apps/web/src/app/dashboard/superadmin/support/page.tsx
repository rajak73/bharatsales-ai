'use client';

import { useState, useEffect } from 'react';
import { SuperadminService } from '@bharatsales/api-client';
import { Loader2, Ticket } from 'lucide-react';

export default function SupportPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await SuperadminService.getAllTickets();
      setTickets(data || []);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      setUpdating(id);
      await SuperadminService.updateTicketStatus(id, status);
      await fetchTickets();
    } catch (error) {
      console.error('Failed to update ticket:', error);
    } finally {
      setUpdating(null);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'Resolved') return 'bg-green-100 text-green-700';
    if (status === 'In Progress') return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
  };

  const priorityColor = (priority: string) => {
    if (priority === 'High') return 'text-red-600';
    if (priority === 'Low') return 'text-gray-500';
    return 'text-amber-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Support</h1>
        <p className="text-gray-500">Tickets raised by organizations across the platform • {tickets.length} tickets</p>
      </div>

      {tickets.length === 0 ? (
        <div className="card text-center py-12">
          <Ticket className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-gray-500">No support tickets raised yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tickets.map((ticket) => (
            <div key={ticket._id} className="card">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-bold text-gray-900">{ticket.subject}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className={priorityColor(ticket.priority)}>{ticket.priority} priority</span> • {new Date(ticket.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(ticket.status)}`}>{ticket.status}</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{ticket.message}</p>
              <div className="flex space-x-2 pt-3 border-t border-gray-100">
                {updating === ticket._id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                ) : (
                  <>
                    {ticket.status !== 'In Progress' && (
                      <button onClick={() => updateStatus(ticket._id, 'In Progress')} className="text-blue-600 hover:text-blue-800 text-xs font-medium">
                        Mark In Progress
                      </button>
                    )}
                    {ticket.status !== 'Resolved' && (
                      <button onClick={() => updateStatus(ticket._id, 'Resolved')} className="text-green-600 hover:text-green-800 text-xs font-medium">
                        Mark Resolved
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
