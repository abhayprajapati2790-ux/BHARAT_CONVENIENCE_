"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Vote,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  XCircle,
} from "lucide-react";

export default function IssueDetailPage({ params }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [userVoted, setUserVoted] = useState(false);

  const statusColors = {
    pending: "bg-yellow-600",
    in_progress: "bg-blue-600",
    resolved: "bg-green-600",
    rejected: "bg-red-600",
  };

  const severityColors = {
    1: "text-green-400",
    2: "text-yellow-400",
    3: "text-orange-400",
    4: "text-red-400",
    5: "text-red-600",
  };

  const severityLabels = {
    1: "Low Priority",
    2: "Medium Priority",
    3: "High Priority",
    4: "Critical",
    5: "Emergency",
  };

  useEffect(() => {
    const userData = localStorage.getItem("bharatUser");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchIssue();
  }, [params.id]);

  const fetchIssue = async () => {
    try {
      const response = await fetch(`/api/issues/${params.id}`);
      if (response.ok) {
        const result = await response.json();
        setIssue(result.issue);

        // Check if current user has voted
        if (currentUser) {
          const voteResponse = await fetch(
            `/api/votes?issue_id=${params.id}&user_id=${currentUser.id}`,
          );
          if (voteResponse.ok) {
            const voteResult = await voteResponse.json();
            setUserVoted(voteResult.user_voted);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching issue:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async () => {
    if (!currentUser) {
      alert("Please sign in to vote");
      return;
    }

    setVoting(true);
    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_id: params.id,
          user_id: currentUser.id,
        }),
      });

      if (response.ok) {
        setUserVoted(true);
        fetchIssue(); // Refresh to show updated vote count
      } else {
        const error = await response.json();
        alert(error.error || "Failed to vote");
      }
    } catch (error) {
      console.error("Error voting:", error);
      alert("Failed to vote");
    } finally {
      setVoting(false);
    }
  };

  const updateIssueStatus = async (newStatus, comment = "") => {
    try {
      const response = await fetch(`/api/issues/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          updated_by: currentUser.id,
          comment,
        }),
      });

      if (response.ok) {
        fetchIssue(); // Refresh to show updated status
      }
    } catch (error) {
      console.error("Error updating issue:", error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "in_progress":
        return <Eye className="w-5 h-5" />;
      case "resolved":
        return <CheckCircle className="w-5 h-5" />;
      case "rejected":
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Issue Not Found</h2>
          <p className="text-gray-400">
            The issue you're looking for doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => window.history.back()}
              className="mr-4 p-2 hover:bg-gray-700 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Issue Details</h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {/* Issue Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-3">{issue.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {issue.location}
                </span>
                <span>🏘️ {issue.colony}</span>
                <span>📂 {issue.category}</span>
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {issue.reporter_name}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(issue.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <span
                className={`px-3 py-2 rounded-full text-sm font-medium ${statusColors[issue.status]} text-white flex items-center gap-2`}
              >
                {getStatusIcon(issue.status)}
                {issue.status.replace("_", " ").toUpperCase()}
              </span>

              <div className="text-right">
                <div
                  className={`text-lg font-bold ${severityColors[issue.severity_level]}`}
                >
                  {severityLabels[issue.severity_level]}
                </div>
                <div className="text-sm text-gray-400">
                  Severity Level {issue.severity_level}/5
                </div>
              </div>
            </div>
          </div>

          {/* Voting Section */}
          <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Vote className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-lg">
                  {issue.vote_count || 0}
                </span>
                <span className="text-gray-400">community votes</span>
              </div>
              {userVoted && (
                <span className="text-green-400 text-sm">
                  ✓ You voted for this issue
                </span>
              )}
            </div>

            {currentUser &&
              currentUser.colony === issue.colony &&
              issue.status === "pending" &&
              !userVoted && (
                <button
                  onClick={handleVote}
                  disabled={voting}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg font-semibold flex items-center gap-2"
                >
                  <Vote className="w-4 h-4" />
                  {voting ? "Voting..." : "Vote for this Issue"}
                </button>
              )}
          </div>

          {/* Government Actions */}
          {currentUser?.user_type === "government" && (
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-4 mb-4">
              <h3 className="font-semibold mb-3">Government Actions</h3>
              <div className="flex gap-3">
                {issue.status === "pending" && (
                  <>
                    <button
                      onClick={() => updateIssueStatus("in_progress")}
                      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
                    >
                      Start Working
                    </button>
                    <button
                      onClick={() => updateIssueStatus("resolved")}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm"
                    >
                      Mark as Resolved
                    </button>
                    <button
                      onClick={() => updateIssueStatus("rejected")}
                      className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
                    >
                      Reject Issue
                    </button>
                  </>
                )}
                {issue.status === "in_progress" && (
                  <button
                    onClick={() => updateIssueStatus("resolved")}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm"
                  >
                    Mark as Resolved
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Description</h3>
              <p className="text-gray-300 leading-relaxed">
                {issue.description}
              </p>
            </div>

            {/* AI Analysis */}
            {issue.ai_analysis && (
              <div className="bg-blue-900 border border-blue-700 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-blue-300">
                    AI Analysis
                  </h3>
                </div>
                <p className="text-blue-200">{issue.ai_analysis}</p>
              </div>
            )}

            {/* Status Timeline */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Status Timeline</h3>
              <div className="space-y-4">
                {/* Initial Report */}
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-medium">Issue Reported</h4>
                    <p className="text-sm text-gray-400">
                      Reported by {issue.reporter_name} on{" "}
                      {new Date(issue.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Status Updates */}
                {issue.status_updates &&
                  issue.status_updates.map((update, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          update.new_status === "resolved"
                            ? "bg-green-600"
                            : update.new_status === "in_progress"
                              ? "bg-blue-600"
                              : update.new_status === "rejected"
                                ? "bg-red-600"
                                : "bg-yellow-600"
                        }`}
                      >
                        {getStatusIcon(update.new_status)}
                      </div>
                      <div>
                        <h4 className="font-medium">
                          Status changed to{" "}
                          {update.new_status.replace("_", " ")}
                        </h4>
                        <p className="text-sm text-gray-400">
                          Updated by {update.updated_by_name} on{" "}
                          {new Date(update.created_at).toLocaleDateString()}
                        </p>
                        {update.comment && (
                          <p className="text-sm text-gray-300 mt-1">
                            {update.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image */}
            {issue.image_url && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Photo Evidence</h3>
                <img
                  src={issue.image_url}
                  alt="Issue"
                  className="w-full rounded-lg"
                />
              </div>
            )}

            {/* Location */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Location Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-400">Address:</span>
                  <p className="font-medium">{issue.location}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Colony/Area:</span>
                  <p className="font-medium">{issue.colony}</p>
                </div>
                {issue.latitude && issue.longitude && (
                  <div>
                    <span className="text-sm text-gray-400">Coordinates:</span>
                    <p className="font-medium text-sm">
                      {issue.latitude}, {issue.longitude}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Reporter Info */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Reporter Information
              </h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-400">Name:</span>
                  <p className="font-medium">{issue.reporter_name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Colony:</span>
                  <p className="font-medium">{issue.reporter_colony}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-400">Reported on:</span>
                  <p className="font-medium">
                    {new Date(issue.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Assigned Official */}
            {issue.assigned_to_name && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Assigned Official
                </h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-400">Name:</span>
                    <p className="font-medium">{issue.assigned_to_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-400">Email:</span>
                    <p className="font-medium">{issue.assigned_to_email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
