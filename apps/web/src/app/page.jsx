"use client";

import { useState, useEffect } from "react";
import {
  Camera,
  Users,
  Vote,
  Trophy,
  Heart,
  MessageCircle,
  Bell,
  User,
  Plus,
} from "lucide-react";

export default function HomePage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showChatBot, setShowChatBot] = useState(false);

  useEffect(() => {
    // Check if user exists in localStorage
    const userData = localStorage.getItem("bharatUser");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const handleUserSetup = async (userData) => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const result = await response.json();
        setCurrentUser(result.user);
        localStorage.setItem("bharatUser", JSON.stringify(result.user));
        setShowUserModal(false);
      }
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-blue-400">
              BHARAT CONVENIENCE
            </h1>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <>
                  <span className="text-sm text-gray-300">
                    {currentUser.name} ({currentUser.user_type})
                  </span>
                  <div className="flex items-center space-x-2">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm">{currentUser.points || 0}</span>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => setShowUserModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Report. Vote. Resolve.
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            A platform for citizens to report civic issues, vote on priorities,
            and track resolutions. Help make your community better.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() =>
                currentUser
                  ? (window.location.href = "/report")
                  : setShowUserModal(true)
              }
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold flex items-center justify-center"
            >
              <Camera className="w-5 h-5 mr-2" />
              Report Issue
            </button>
            <button
              onClick={() => setShowDonationModal(true)}
              className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-semibold flex items-center justify-center"
            >
              <Heart className="w-5 h-5 mr-2" />
              Donate to Help
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-800">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <Camera className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Report Issues</h4>
              <p className="text-gray-300">
                Take photos and report civic problems in your area
              </p>
            </div>
            <div className="text-center">
              <Vote className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Community Voting</h4>
              <p className="text-gray-300">
                Vote on issues in your colony to prioritize solutions
              </p>
            </div>
            <div className="text-center">
              <Users className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold mb-2">Government Action</h4>
              <p className="text-gray-300">
                Track progress as government addresses top issues
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      {currentUser && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold mb-8">Quick Actions</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a
                href="/report"
                className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-8 h-8 text-blue-400 mb-2" />
                <h4 className="font-semibold">New Report</h4>
              </a>
              <a
                href="/issues"
                className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Vote className="w-8 h-8 text-green-400 mb-2" />
                <h4 className="font-semibold">Browse Issues</h4>
              </a>
              <a
                href="/dashboard"
                className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <User className="w-8 h-8 text-purple-400 mb-2" />
                <h4 className="font-semibold">My Dashboard</h4>
              </a>
              <button
                onClick={() => setShowChatBot(true)}
                className="bg-gray-800 p-6 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <MessageCircle className="w-8 h-8 text-yellow-400 mb-2" />
                <h4 className="font-semibold">Get Help</h4>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* User Setup Modal */}
      {showUserModal && (
        <UserSetupModal
          onClose={() => setShowUserModal(false)}
          onSubmit={handleUserSetup}
        />
      )}

      {/* Donation Modal */}
      {showDonationModal && (
        <DonationModal onClose={() => setShowDonationModal(false)} />
      )}

      {/* Chat Bot */}
      {showChatBot && (
        <ChatBot
          onClose={() => setShowChatBot(false)}
          currentUser={currentUser}
        />
      )}

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center text-gray-400">
          <p>
            &copy; 2025 BHARAT CONVENIENCE. Making communities better together.
          </p>
        </div>
      </footer>
    </div>
  );
}

// User Setup Modal Component
function UserSetupModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    user_type: "public",
    colony: "",
    phone: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Join BHARAT CONVENIENCE</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-3 bg-gray-700 rounded-lg"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full p-3 bg-gray-700 rounded-lg"
            required
          />
          <select
            value={formData.user_type}
            onChange={(e) =>
              setFormData({ ...formData, user_type: e.target.value })
            }
            className="w-full p-3 bg-gray-700 rounded-lg"
          >
            <option value="public">Public User</option>
            <option value="government">Government Official</option>
          </select>
          <input
            type="text"
            placeholder="Colony/Area"
            value={formData.colony}
            onChange={(e) =>
              setFormData({ ...formData, colony: e.target.value })
            }
            className="w-full p-3 bg-gray-700 rounded-lg"
          />
          <input
            type="tel"
            placeholder="Phone (Optional)"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            className="w-full p-3 bg-gray-700 rounded-lg"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-semibold"
            >
              Join Now
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 bg-gray-600 hover:bg-gray-700 py-3 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Donation Modal Component
function DonationModal({ onClose }) {
  const [donationData, setDonationData] = useState({
    donor_name: "",
    donor_email: "",
    amount: "",
  });

  const handleDonate = () => {
    // In a real implementation, this would integrate with Aptos wallet
    alert(
      "Aptos wallet integration would be implemented here. This is a demo showing the donation flow.",
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">Donate to Help Poor People</h3>
        <p className="text-gray-300 mb-4">
          Your donation will help support poor communities affected by civic
          issues. Donations are processed via Aptos blockchain.
        </p>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            value={donationData.donor_name}
            onChange={(e) =>
              setDonationData({ ...donationData, donor_name: e.target.value })
            }
            className="w-full p-3 bg-gray-700 rounded-lg"
          />
          <input
            type="email"
            placeholder="Email (Optional)"
            value={donationData.donor_email}
            onChange={(e) =>
              setDonationData({ ...donationData, donor_email: e.target.value })
            }
            className="w-full p-3 bg-gray-700 rounded-lg"
          />
          <input
            type="number"
            placeholder="Amount (APT)"
            value={donationData.amount}
            onChange={(e) =>
              setDonationData({ ...donationData, amount: e.target.value })
            }
            className="w-full p-3 bg-gray-700 rounded-lg"
          />
          <div className="flex gap-3">
            <button
              onClick={handleDonate}
              className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold"
            >
              Donate via Aptos
            </button>
            <button
              onClick={onClose}
              className="px-6 bg-gray-600 hover:bg-gray-700 py-3 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-4">
          * Donations are optional and help support community welfare programs.
        </p>
      </div>
    </div>
  );
}

// Chat Bot Component
function ChatBot({ onClose, currentUser }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm here to help you navigate BHARAT CONVENIENCE. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          user_id: currentUser?.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: result.message },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble right now. Please try again later.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-gray-800 rounded-lg shadow-xl border border-gray-700 flex flex-col z-50">
      <div className="p-4 border-b border-gray-700 flex justify-between items-center">
        <h4 className="font-semibold">AI Assistant</h4>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          ×
        </button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`${msg.role === "user" ? "text-right" : "text-left"}`}
          >
            <div
              className={`inline-block p-2 rounded-lg max-w-xs ${
                msg.role === "user" ? "bg-blue-600" : "bg-gray-700"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-left">
            <div className="inline-block p-2 rounded-lg bg-gray-700">
              Thinking...
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask me anything..."
            className="flex-1 p-2 bg-gray-700 rounded-lg text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
