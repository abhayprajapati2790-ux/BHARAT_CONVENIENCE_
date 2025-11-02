"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Filter,
  Vote,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ThumbsUp,
} from "lucide-react";

export default function IssuesPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    colony: "",
    severity: "",
    sortBy: "severity",
  });

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
    1: "Low",
    2: "Medium",
    3: "High",
    4: "Critical",
    5: "Emergency",
  };

  useEffect(() => {
    const userData = localStorage.getItem("bharatUser");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    fetchIssues();
  }, [filters]);

  const fetchIssues = async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      const response = await fetch(`/api/issues?${params}`);
      if (response.ok) {
        const result = await response.json();
        setIssues(result.issues);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (issueId) => {
    if (!currentUser) {
      alert("Please sign in to vote");
      return;
    }

    try {
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issue_id: issueId,
          user_id: currentUser.id,
        }),
      });

      if (response.ok) {
        // Refresh issues to show updated vote count
        fetchIssues();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to vote");
      }
    } catch (error) {
      console.error("Error voting:", error);
      alert("Failed to vote");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "in_progress":
        return <Eye className="w-4 h-4" />;
      case "resolved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

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
              <h1 className="text-xl font-bold">Community Issues</h1>
            </div>
            <a
              href="/report"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
            >
              Report Issue
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4">
        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 mr-2" />
            <h3 className="font-semibold">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="p-2 bg-gray-700 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filters.severity}
              onChange={(e) =>
                setFilters({ ...filters, severity: e.target.value })
              }
              className="p-2 bg-gray-700 rounded-lg text-sm"
            >
              <option value="">All Severity</option>
              <option value="5">Emergency</option>
              <option value="4">Critical</option>
              <option value="3">High</option>
              <option value="2">Medium</option>
              <option value="1">Low</option>
            </select>

            <input
              type="text"
              placeholder="Colony/Area"
              value={filters.colony}
              onChange={(e) =>
                setFilters({ ...filters, colony: e.target.value })
              }
              className="p-2 bg-gray-700 rounded-lg text-sm"
            />

            <input
              type="text"
              placeholder="Category"
              value={filters.category}
              onChange={(e) =>
                setFilters({ ...filters, category: e.target.value })
              }
              className="p-2 bg-gray-700 rounded-lg text-sm"
            />

            <select
              value={filters.sortBy}
              onChange={(e) =>
                setFilters({ ...filters, sortBy: e.target.value })
              }
              className="p-2 bg-gray-700 rounded-lg text-sm"
            >
              <option value="severity">Sort by Severity</option>
              <option value="created_at">Sort by Date</option>
              <option value="vote_count">Sort by Votes</option>
            </select>
          </div>
        </div>

        {/* Issues List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="mt-2 text-gray-400">Loading issues...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {issues.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p>No issues found matching your filters.</p>
              </div>
            ) : (
              issues.map((issue) => (
                <div
                  key={issue.id}
                  className="bg-gray-800 rounded-lg p-6 border border-gray-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{issue.title}</h3>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${statusColors[issue.status]} text-white flex items-center gap-1`}
                        >
                          {getStatusIcon(issue.status)}
                          {issue.status.replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                        <span>📍 {issue.location}</span>
                        <span>🏘️ {issue.colony}</span>
                        <span>📂 {issue.category}</span>
                        <span>👤 {issue.reporter_name}</span>
                      </div>

                      <p className="text-gray-300 mb-3">{issue.description}</p>

                      {issue.ai_analysis && (
                        <div className="bg-blue-900 border border-blue-700 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-blue-300">
                              AI Analysis
                            </span>
                          </div>
                          <p className="text-sm text-blue-200">
                            {issue.ai_analysis}
                          </p>
                        </div>
                      )}
                    </div>

                    {issue.image_url && (
                      <img
                        src={issue.image_url}
                        alt="Issue"
                        className="w-24 h-24 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold ${severityColors[issue.severity_level]}`}
                        >
                          {severityLabels[issue.severity_level]}
                        </span>
                        <span className="text-gray-400 text-sm">Severity</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <ThumbsUp className="w-4 h-4 text-green-400" />
                        <span className="font-semibold">
                          {issue.vote_count || 0}
                        </span>
                        <span className="text-gray-400 text-sm">votes</span>
                      </div>

                      <span className="text-gray-400 text-sm">
                        {new Date(issue.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {currentUser &&
                        currentUser.colony === issue.colony &&
                        issue.status === "pending" && (
                          <button
                            onClick={() => handleVote(issue.id)}
                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                          >
                            <Vote className="w-4 h-4" />
                            Vote
                          </button>
                        )}

                      <a
                        href={`/issues/${issue.id}`}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
                      >
                        View Details
                      </a>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
