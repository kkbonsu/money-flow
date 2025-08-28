import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  User,
  Calendar,
  Filter,
  Send,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import type { SupportTicket, SupportMessage } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function SupportTickets() {
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tickets, isLoading } = useQuery<SupportTicket[]>({
    queryKey: ['/api/support-tickets'],
  });

  const { data: messages } = useQuery<SupportMessage[]>({
    queryKey: ['/api/support-tickets', selectedTicket, 'messages'],
    enabled: !!selectedTicket,
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SupportTicket> }) => {
      return apiRequest(`/api/support-tickets/${id}`, 'PUT', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
      toast({ title: "Success", description: "Ticket updated successfully" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number; message: string }) => {
      return apiRequest(`/api/support-tickets/${ticketId}/messages`, 'POST', {
        message,
        senderType: 'staff',
        senderId: 1 // Replace with actual user ID
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets', selectedTicket, 'messages'] });
      setNewMessage('');
      toast({ title: "Success", description: "Message sent successfully" });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      case 'closed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const filteredTickets = tickets?.filter(ticket => {
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const handleStatusChange = (ticketId: number, newStatus: string) => {
    updateTicketMutation.mutate({ 
      id: ticketId, 
      data: { 
        status: newStatus,
        ...(newStatus === 'resolved' ? { resolvedAt: new Date() } : {})
      } 
    });
  };

  const handleSendMessage = () => {
    if (!selectedTicket || !newMessage.trim()) return;
    sendMessageMutation.mutate({ ticketId: selectedTicket, message: newMessage.trim() });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage customer support requests and inquiries
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTickets?.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(ticket.status)}
                  <CardTitle className="text-lg">{ticket.title}</CardTitle>
                </div>
                <Badge className={getPriorityColor(ticket.priority)}>
                  {ticket.priority}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                {ticket.description}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {ticket.customerEmail}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(ticket.createdAt), 'MMM dd, yyyy')}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(ticket.status)}>
                  {ticket.status.replace('_', ' ')}
                </Badge>
                
                <div className="flex gap-2">
                  <Select
                    value={ticket.status}
                    onValueChange={(value) => handleStatusChange(ticket.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedTicket(ticket.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5" />
                          {ticket.title}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <p className="font-medium">Description:</p>
                          <p className="text-gray-700 dark:text-gray-300 mt-1">{ticket.description}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span>Customer: {ticket.customerEmail}</span>
                            <span>Priority: {ticket.priority}</span>
                            <span>Created: {format(new Date(ticket.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                          </div>
                        </div>

                        {/* Messages */}
                        <div className="space-y-3">
                          <h4 className="font-semibold">Messages:</h4>
                          <div className="max-h-60 overflow-y-auto space-y-2">
                            {messages?.map((message) => (
                              <div
                                key={message.id}
                                className={`p-3 rounded-lg ${
                                  message.senderType === 'staff'
                                    ? 'bg-blue-100 dark:bg-blue-900 ml-8'
                                    : 'bg-gray-100 dark:bg-gray-800 mr-8'
                                }`}
                              >
                                <div className="text-sm text-gray-500 mb-1">
                                  {message.senderType === 'staff' ? 'Staff' : 'Customer'} • {format(new Date(message.createdAt), 'MMM dd, HH:mm')}
                                </div>
                                <p>{message.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Reply */}
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Type your response..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            className="flex-1"
                          />
                          <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTickets?.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
            No support tickets found
          </h3>
          <p className="text-gray-500">
            {statusFilter === 'all' && priorityFilter === 'all'
              ? "No tickets have been created yet."
              : "No tickets match your current filters."}
          </p>
        </div>
      )}
    </div>
  );
}