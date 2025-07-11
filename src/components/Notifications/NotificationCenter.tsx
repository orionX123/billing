
import { useState } from "react";
import { Bell, Filter, Trash2, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationService, type Notification } from "@/services/notificationService";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const NotificationCenter = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: notificationData, isLoading } = useQuery({
    queryKey: ['notifications', activeTab, priorityFilter, categoryFilter],
    queryFn: () => notificationService.getNotifications({
      unreadOnly: activeTab === 'unread',
      priority: priorityFilter || undefined,
      category: categoryFilter || undefined,
      limit: 50
    }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: notificationService.deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = notificationData?.notifications || [];
  const unreadCount = notificationData?.unreadCount || 0;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'border-l-destructive bg-destructive/5';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending || unreadCount === 0}
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Notifications</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Priorities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-4">
              <ScrollArea className="h-96">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No notifications found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification: Notification) => (
                      <Card
                        key={notification.id}
                        className={cn(
                          "border-l-4 transition-all",
                          getPriorityColor(notification.priority),
                          !notification.isRead && "shadow-sm bg-accent/30"
                        )}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <span className="text-lg mt-0.5">
                                {getNotificationIcon(notification.type)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className={cn(
                                    "font-medium",
                                    !notification.isRead && "font-semibold"
                                  )}>
                                    {notification.title}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {notification.category}
                                  </Badge>
                                  <Badge 
                                    variant={notification.priority === 'critical' ? 'destructive' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {notification.priority}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {!notification.isRead && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsReadMutation.mutate(notification.id)}
                                  disabled={markAsReadMutation.isPending}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                disabled={deleteNotificationMutation.isPending}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;
