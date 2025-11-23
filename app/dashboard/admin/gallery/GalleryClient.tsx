"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ComprehensiveGalleryManager from "@/components/admin/ComprehensiveGalleryManager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Camera,
  Image as ImageIcon,
  Upload,
  Eye,
  Users,
  BarChart3,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Wifi,
  WifiOff,
} from "lucide-react";

interface GalleryStats {
  total: number;
  active: number;
  pending: number;
  inactive: number;
  archived: number;
  categories: { name: string; count: number }[];
  recentActivity: {
    id: string;
    action: string;
    image: string;
    user: string;
    date: string;
  }[];
}

interface GalleryClientProps {
  userEmail: string;
}

export default function GalleryClient({ userEmail }: GalleryClientProps) {
  const [activeTab, setActiveTab] = useState("manage");
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    total: 156,
    active: 89,
    pending: 23,
    inactive: 32,
    archived: 12,
    categories: [
      { name: "Events", count: 45 },
      { name: "Campaigns", count: 38 },
      { name: "Team", count: 28 },
      { name: "Community", count: 25 },
      { name: "Projects", count: 15 },
      { name: "Documentation", count: 5 },
    ],
    recentActivity: [
      {
        id: "1",
        action: "uploaded",
        image: "campaign-event-1.jpg",
        user: "John Doe",
        date: "2 minutes ago",
      },
      {
        id: "2",
        action: "edited",
        image: "team-photo.jpg",
        user: "Jane Smith",
        date: "15 minutes ago",
      },
      {
        id: "3",
        action: "deleted",
        image: "old-banner.jpg",
        user: "Mike Johnson",
        date: "1 hour ago",
      },
    ],
  });
  const [analytics, setAnalytics] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { toast } = useToast();

  // Use real-time stats data
  const statsData: GalleryStats = stats;

  // Predefined Tailwind classes to avoid inline style props.
  // These arrays keep the classes present in source so Tailwind generates them.
  const colorClasses = [
    "bg-blue-500",
    "bg-indigo-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-rose-500",
    "bg-amber-500",
  ];

  const widthClasses = [
    "w-[0%]",
    "w-[10%]",
    "w-[20%]",
    "w-[30%]",
    "w-[40%]",
    "w-[50%]",
    "w-[60%]",
    "w-[70%]",
    "w-[80%]",
    "w-[90%]",
    "w-[100%]",
  ];

  const heightClasses = [
    "h-[5%]",
    "h-[10%]",
    "h-[15%]",
    "h-[20%]",
    "h-[25%]",
    "h-[30%]",
    "h-[35%]",
    "h-[40%]",
    "h-[45%]",
    "h-[50%]",
    "h-[55%]",
    "h-[60%]",
    "h-[65%]",
    "h-[70%]",
    "h-[75%]",
    "h-[80%]",
    "h-[85%]",
    "h-[90%]",
    "h-[95%]",
    "h-[100%]",
  ];

  const getActionIcon = (action: string) => {
    switch (action) {
      case "create":
      case "uploaded":
        return <Upload className="w-4 h-4 text-green-500" />;
      case "update":
      case "edited":
        return <Settings className="w-4 h-4 text-blue-500" />;
      case "delete":
      case "deleted":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <ImageIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  // Load initial stats and analytics
  const loadStatsAndAnalytics = useCallback(async () => {
    try {
      const [statsResponse, analyticsResponse] = await Promise.all([
        fetch("/api/admin/gallery/analytics?period=30d"),
        fetch("/api/admin/gallery/analytics?period=30d"),
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          total: statsData.overview.totalImages,
          active: statsData.overview.activeImages,
          pending: statsData.overview.pendingImages,
          inactive: statsData.overview.inactiveImages,
          archived: statsData.overview.archivedImages,
          categories: statsData.categories,
          recentActivity: statsData.recentActivity
            .slice(0, 3)
            .map((activity: any) => ({
              id: activity.id,
              action: activity.action.toLowerCase(),
              image: `Image ${activity.entityId}`,
              user: activity.performedBy?.firstName
                ? `${activity.performedBy.firstName} ${activity.performedBy.lastName}`
                : activity.performedBy?.email || "Unknown User",
              date: new Date(activity.createdAt).toLocaleString(),
            })),
        });
      }

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error("Error loading stats and analytics:", error);
    }
  }, []);

  // WebSocket connection setup
  useEffect(() => {
    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/ws/notifications`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        toast({
          title: "Connected",
          description: "Real-time updates enabled",
        });
        // Load initial data when connected
        loadStatsAndAnalytics();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "gallery_update") {
            setLastUpdate(new Date());
            toast({
              title: "Gallery Updated",
              description:
                message.data.message ||
                "Gallery has been updated by another user",
            });
            // Refresh stats and analytics in real-time
            loadStatsAndAnalytics();
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 5 seconds
        setTimeout(connectWebSocket, 5000);
      };

      wsRef.current.onerror = (error) => {
        console.error("Gallery WebSocket error:", error);
        setIsConnected(false);
      };
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [toast, loadStatsAndAnalytics]);

  // Render component

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Gallery Management
              </h1>
              <p className="mt-2 text-gray-600">
                Manage your image gallery with advanced tools and features
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-sm">
                <Users className="w-4 h-4 mr-1" />
                {userEmail}
              </Badge>
              <Badge
                variant={isConnected ? "default" : "destructive"}
                className="text-sm"
              >
                {isConnected ? (
                  <>
                    <Wifi className="w-4 h-4 mr-1" />
                    Live
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 mr-1" />
                    Offline
                  </>
                )}
              </Badge>
              {lastUpdate && (
                <Badge variant="outline" className="text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  Updated {lastUpdate.toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Camera className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Total Images
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.active}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    Pending Review
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.pending}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.inactive}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Archived</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.archived}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="manage">
              <Camera className="w-4 h-4 mr-2" />
              Manage
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Clock className="w-4 h-4 mr-2" />
              Activity
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-6">
            <ComprehensiveGalleryManager />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Categories Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Images by Category</CardTitle>
                  <CardDescription>
                    Distribution of images across different categories
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {statsData.categories.map((category, index) => (
                      <div
                        key={category.name}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div
                            className="w-3 h-3 rounded-full mr-3"
                            style={{
                              backgroundColor: `hsl(${index * 60}, 70%, 50%)`,
                            }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${
                                  (category.count / statsData.total) * 100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-8">
                            {category.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Analytics Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Upload Timeline</CardTitle>
                  <CardDescription>
                    Upload activity over the last 30 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics && (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              +{analytics.overview?.growthRate || 0}%
                            </div>
                            <div className="text-sm text-gray-600">
                              Growth Rate
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {analytics.overview?.avgUploadsPerDay || 0}
                            </div>
                            <div className="text-sm text-gray-600">Avg/Day</div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium">
                            Upload Timeline (Last 7 days)
                          </h4>
                          <div className="h-32 flex items-end space-x-1">
                            {analytics.timeline
                              ?.slice(-7)
                              .map((item: any, index: number) => (
                                <div
                                  key={index}
                                  className="bg-blue-500 rounded-sm flex-1"
                                  style={{
                                    height: `${Math.max(
                                      (item.count /
                                        Math.max(
                                          ...analytics.timeline
                                            .slice(-7)
                                            .map((i: any) => i.count)
                                        )) *
                                        100,
                                      5
                                    )}%`,
                                  }}
                                  title={`${item.date}: ${item.count} uploads`}
                                />
                              ))}
                          </div>
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>7 days ago</span>
                            <span>Today</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest actions performed on gallery images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        {getActionIcon(activity.action)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {activity.user} {activity.action}{" "}
                          <span className="text-blue-600">
                            {activity.image}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">{activity.date}</p>
                      </div>
                      <Badge
                        variant={
                          activity.action === "deleted"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {activity.action}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
