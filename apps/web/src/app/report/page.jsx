"use client";

import { useState, useEffect } from "react";
import { Camera, MapPin, ArrowLeft, Upload, AlertCircle } from "lucide-react";

export default function ReportPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    location: "",
    colony: "",
    latitude: null,
    longitude: null,
    image_url: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categories = [
    "Road & Infrastructure",
    "Water Supply",
    "Electricity",
    "Waste Management",
    "Public Safety",
    "Healthcare",
    "Education",
    "Transportation",
    "Environment",
    "Other",
  ];

  useEffect(() => {
    const userData = localStorage.getItem("bharatUser");
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      setFormData((prev) => ({ ...prev, colony: user.colony || "" }));
    } else {
      window.location.href = "/";
    }
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        },
      );
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    try {
      setLoading(true);
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (response.ok) {
        const result = await response.json();
        setFormData((prev) => ({ ...prev, image_url: result.url }));
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const response = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          reported_by: currentUser.id,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = "/issues";
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting report:", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            ✓
          </div>
          <h2 className="text-2xl font-bold mb-2">Report Submitted!</h2>
          <p className="text-gray-300">
            Your issue has been reported and will be analyzed by AI.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Redirecting to issues page...
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
            <h1 className="text-xl font-bold">Report an Issue</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Issue Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Brief description of the issue"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
              required
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Detailed Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Provide detailed information about the issue..."
              rows={4}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2">Location *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="Street address or landmark"
                className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg"
                required
              />
              <button
                type="button"
                onClick={getCurrentLocation}
                className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg"
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>
            {formData.latitude && formData.longitude && (
              <p className="text-sm text-green-400 mt-1">
                GPS coordinates captured
              </p>
            )}
          </div>

          {/* Colony */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Colony/Area *
            </label>
            <input
              type="text"
              value={formData.colony}
              onChange={(e) =>
                setFormData({ ...formData, colony: e.target.value })
              }
              placeholder="Your colony or area name"
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg"
              required
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Photo Evidence
            </label>
            <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
              {formData.image_url ? (
                <div>
                  <img
                    src={formData.image_url}
                    alt="Uploaded"
                    className="max-w-full h-48 object-cover mx-auto rounded-lg mb-2"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image_url: "" })}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove image
                  </button>
                </div>
              ) : (
                <div>
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400 mb-2">
                    Upload a photo of the issue
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setImageFile(file);
                        handleImageUpload(file);
                      }
                    }}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg cursor-pointer inline-flex items-center"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* AI Notice */}
          <div className="bg-blue-900 border border-blue-700 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-400 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-300">AI Analysis</h4>
                <p className="text-sm text-blue-200">
                  Our AI will automatically analyze your report to determine
                  severity level and prioritize it for government attention.
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 py-3 rounded-lg font-semibold"
          >
            {loading ? "Submitting..." : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
