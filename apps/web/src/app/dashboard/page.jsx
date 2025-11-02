"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trophy,
  Bell,
  Settings,
} from "lucide-react";

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [stats, setStats] = useState({});
  const [recentIssues, setRecentIssues] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("bharatUser");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      fetchDashboardData(user);
    } else {
      window.location.href = "/";
    }
  }, []);

  const fetchDashboardData = async (user) => {
    try {
      // Fetch user's issues and stats
      const issuesResponse = await fetch(
        `/api/issues?${user.user_type === "government" ? "" : `reported_by=${user.id}`}`,
      );
      const issuesData = await issuesResponse.json();

      // Calculate stats
      const issues = issuesData.issues || [];
      const userStats = {
        total_reports: issues.length,
        pending: issues.filter((i) => i.status === "pending").length,
        in_progress: issues.filter((i) => i.status === "in_progress").length,
        resolved: issues.filter((i) => i.status === "resolved").length,
        total_votes: issues.reduce((sum, i) => sum + (i.vote_count || 0), 0),
      };

      setStats(userStats);
      setRecentIssues(issues.slice(0, 5));

      // Fetch notifications
      const notifResponse = await fetch(
        `/api/notifications?user_id=${user.id}&limit=5`,
      );
      if (notifResponse.ok) {
        const notifData = await notifResponse.json();
        setNotifications(notifData.notifications || []);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateIssueStatus = async (issueId, newStatus, comment = "") => {
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          updated_by: currentUser.id,
          comment,
        }),
      });

      if (response.ok) {
        // Refresh data
        fetchDashboardData(currentUser);
      }
    } catch (error) {
      console.error("Error updating issue:", error);
    }
  };

  const markNotificationsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: currentUser.id }),
      });
      fetchDashboardData(currentUser);
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => window.history.back()}
                className="mr-4 p-2 hover:bg-gray-700 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold">
                {currentUser?.user_type === "government"
                  ? "Government Dashboard"
                  : "My Dashboard"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="text-sm">
                  {currentUser?.points || 0} points
                </span>
              </div>
              <span className="text-sm text-gray-300">
                {currentUser?.name} ({currentUser?.user_type})
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-8 h-8 text-blue-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.total_reports || 0}</p>
                <p className="text-gray-400 text-sm">
                  {currentUser?.user_type === "government"
                    ? "Total Issues"
                    : "My Reports"}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.pending || 0}</p>
                <p className="text-gray-400 text-sm">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-blue-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.in_progress || 0}</p>
                <p className="text-gray-400 text-sm">In Progress</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
              <div>
                <p className="text-2xl font-bold">{stats.resolved || 0}</p>
                <p className="text-gray-400 text-sm">Resolved</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Issues */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">
              {currentUser?.user_type === "government"
                ? "Recent Issues"
                : "My Recent Reports"}
            </h3>
            <div className="space-y-4">
              {recentIssues.length === 0 ? (
                <p className="text-gray-400">No issues found.</p>
              ) : (
                recentIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="border border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{issue.title}</h4>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          issue.status === "pending"
                            ? "bg-yellow-600"
                            : issue.status === "in_progress"
                              ? "bg-blue-600"
                              : issue.status === "resolved"
                                ? "bg-green-600"
                                : "bg-red-600"
                        }`}
                      >
                        {issue.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      📍 {issue.location} • 🏘️ {issue.colony}
                    </p>
                    <p className="text-sm text-gray-300 mb-3">
                      {issue.description.substring(0, 100)}...
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={`font-medium ${
                            issue.severity_level >= 4
                              ? "text-red-400"
                              : issue.severity_level >= 3
                                ? "text-orange-400"
                                : issue.severity_level >= 2
                                  ? "text-yellow-400"
                                  : "text-green-400"
                          }`}
                        >
                          Severity: {issue.severity_level}/5
                        </span>
                        <span className="text-gray-400">
                          Votes: {issue.vote_count || 0}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {currentUser?.user_type === "government" &&
                          issue.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  updateIssueStatus(issue.id, "in_progress")
                                }
                                className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-xs"
                              >
                                Start Work
                              </button>
                              <button
                                onClick={() =>
                                  updateIssueStatus(issue.id, "resolved")
                                }
                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs"
                              >
                                Resolve
                              </button>
                            </>
                          )}
                        {currentUser?.user_type === "government" &&
                          issue.status === "in_progress" && (
                            <button
                              onClick={() =>
                                updateIssueStatus(issue.id, "resolved")
                              }
                              className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-xs"
                            >
                              Mark Resolved
                            </button>
                          )}
                        <a
                          href={`/issues/${issue.id}`}
                          className="bg-gray-600 hover:bg-gray-700 px-3 py-1 rounded text-xs"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notifications & Achievements */}
          <div className="space-y-6">
            {/* Notifications */}
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notifications
                </h3>
                {notifications.length > 0 && (
                  <button
                    onClick={markNotificationsRead}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-gray-400">No new notifications.</p>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-lg ${notif.is_read ? "bg-gray-700" : "bg-blue-900"}`}
                    >
                      <h4 className="font-medium text-sm">{notif.title}</h4>
                      <p className="text-sm text-gray-300">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Badges & Achievements */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-400" />
                Achievements
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Points Earned</span>
                  <span className="font-semibold text-yellow-400">
                    {currentUser?.points || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Current Rank</span>
                  <span className="font-semibold text-blue-400">
                    Level {currentUser?.rank_level || 1}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Badges Earned</span>
                  <span className="font-semibold text-purple-400">
                    {currentUser?.badges?.length || 0}
                  </span>
                </div>

                {currentUser?.badges && currentUser.badges.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Your Badges:</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentUser.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className="bg-purple-600 px-2 py-1 rounded-full text-xs"
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/report"
              className="bg-blue-600 hover:bg-blue-700 p-4 rounded-lg text-center"
            >
              Report New Issue
            </a>
            <a
              href="/issues"
              className="bg-green-600 hover:bg-green-700 p-4 rounded-lg text-center"
            >
              Browse All Issues
            </a>
            {currentUser?.user_type === "government" && (
              <a
                href="/issues?status=pending&sortBy=severity"
                className="bg-red-600 hover:bg-red-700 p-4 rounded-lg text-center"
              >
                High Priority Issues
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
