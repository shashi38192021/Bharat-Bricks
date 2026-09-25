import { useCallback, useEffect, useState } from "react";
import { readApiResponse } from "../utils/api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const emptyClientForm = {
  username: "",
  email: "",
  password: "",
  phoneNumber: "",
};

const emptyPropertyForm = {
  userRef: "",
  propertyType: "",
  name: "",
  description: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  phoneNumber: "",
  type: "rent",
  leaseYears: 1,
  bedrooms: 1,
  bathrooms: 1,
  sqft: "",
  regularPrice: 50,
  negotiable: false,
  basicAmenities: [],
  luxuryAmenities: [],
  imageUrls: [],
  latitude: "",
  longitude: "",
};

const BASIC_AMENITIES = [
  "Parking",
  "Power Backup",
  "Water Supply",
  "Security",
  "Lift",
];

const LUXURY_AMENITIES = [
  "Swimming Pool",
  "Gym",
  "Club House",
  "Garden",
  "CCTV",
];

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [employeeRequests, setEmployeeRequests] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showClientForm, setShowClientForm] = useState(false);
  const [showPropertyForm, setShowPropertyForm] = useState(false);

  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [propertyForm, setPropertyForm] =
    useState(emptyPropertyForm);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        statsResponse,
        usersResponse,
        listingsResponse,
        employeeRequestsResponse,
      ] = await Promise.all([
        fetch("/api/admin/stats", {
          credentials: "include",
      }),
      fetch("/api/admin/users", {
        credentials: "include",
      }),
      fetch("/api/admin/listings", {
       credentials: "include",
      }),
      fetch("/api/employee/requests", {
       credentials: "include",
     }),
  ]);

      const [
        statsData,
        usersData,
        listingsData,
        employeeRequestsData,
      ] = await Promise.all([
        readApiResponse(statsResponse),
        readApiResponse(usersResponse),
        readApiResponse(listingsResponse),
        readApiResponse(employeeRequestsResponse),
      ]);

      if (
        !statsResponse.ok ||
        !usersResponse.ok ||
        !listingsResponse.ok ||
        !employeeRequestsResponse.ok
      ) {
        throw new Error(
          statsData.message ||
            usersData.message ||
            listingsData.message ||
            employeeRequestsData.message ||
            "Unable to load admin dashboard."
        );
      }

      setStats(statsData);
      setUsers(usersData);
      setListings(listingsData);
      setEmployeeRequests(employeeRequestsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const handleClientChange = (e) => {
    const { id, value } = e.target;

    setClientForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handlePropertyChange = (e) => {
    const { id, value, checked, type } = e.target;

    setPropertyForm((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const togglePropertyAmenity = (group, amenity) => {
    setPropertyForm((prev) => ({
      ...prev,
      [group]: prev[group].includes(amenity)
        ? prev[group].filter((item) => item !== amenity)
        : [...prev[group], amenity],
    }));
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();

    clearMessages();

    try {
      setActionLoading(true);

      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientForm),
      });

      const data = await readApiResponse(response);

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Could not create client."
        );
      }

      setSuccess("Client created successfully.");

      setClientForm(emptyClientForm);
      setShowClientForm(false);

      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();

    clearMessages();

    if (!propertyForm.userRef) {
      setError("Please select a client.");
      return;
    }

    if (
      propertyForm.type === "lease" &&
      (!Number.isInteger(Number(propertyForm.leaseYears)) ||
        Number(propertyForm.leaseYears) < 1 ||
        Number(propertyForm.leaseYears) > 99)
    ) {
      setError(
        "Lease duration must be a whole number between 1 and 99 years."
      );
      return;
    }

    if (Number(propertyForm.regularPrice) < 50) {
      setError("Regular price must be at least ₹50.");
      return;
    }

    try {
      setActionLoading(true);

      const payload = {
        ...propertyForm,

        regularPrice: Number(propertyForm.regularPrice),

        bedrooms: Number(propertyForm.bedrooms),

        bathrooms: Number(propertyForm.bathrooms),

        sqft:
          propertyForm.sqft !== ""
            ? Number(propertyForm.sqft)
            : null,

        leaseYears:
          propertyForm.type === "lease"
            ? Number(propertyForm.leaseYears)
            : null,

        latitude:
          propertyForm.latitude !== ""
            ? Number(propertyForm.latitude)
            : null,

        longitude:
          propertyForm.longitude !== ""
            ? Number(propertyForm.longitude)
            : null,

        basicAmenities: propertyForm.basicAmenities,

        luxuryAmenities: propertyForm.luxuryAmenities,

        imageUrls: propertyForm.imageUrls,
      };

      const response = await fetch(
        "/api/admin/listings/create",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await readApiResponse(response);

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Could not create property."
        );
      }

      setSuccess("Property created successfully.");

      setPropertyForm(emptyPropertyForm);
      setShowPropertyForm(false);

      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    const confirmed = window.confirm(
      "Delete this user and all properties belonging to this user?"
    );

    if (!confirmed) return;

    clearMessages();

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/admin/users/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await readApiResponse(response);

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Could not delete user."
        );
      }

      setSuccess("User deleted successfully.");

      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAdmin = async (id) => {
    clearMessages();

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/admin/users/${id}/admin`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      const data = await readApiResponse(response);

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            "Could not change admin status."
        );
      }

      setSuccess("Admin status updated.");

      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleApproveEmployee = async (id) => {
    try {
      setActionLoading(true);

      const response = await fetch(`/api/employee/requests/${id}/approve`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to approve employee.");
      }

      setSuccess("Employee approved successfully.");
      setError("");

      await loadDashboard();
    } catch (error) {
      setError(error.message);
      setSuccess("");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectEmployee = async (id) => {
    try {
      setActionLoading(true);

      const response = await fetch(`/api/employee/requests/${id}/reject`, {
        method: "PATCH",
        credentials: "include",
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to reject employee.");
      }

      setSuccess("Employee request rejected.");
      setError("");

      await loadDashboard();
    } catch (error) {
      setError(error.message);
      setSuccess("");
    } finally {
      setActionLoading(false);
    }
  };
  const handleDeleteListing = async (id) => {
    const confirmed = window.confirm(
      "Delete this property permanently?"
    );

    if (!confirmed) return;

    clearMessages();

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/admin/listings/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await readApiResponse(response);

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message || "Could not delete property."
        );
      }

      setSuccess("Property deleted successfully.");

      await loadDashboard();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditListing = (id) => {
    window.location.href = `/update-listing/${id}`;
  };

  const openPropertyForm = () => {
    clearMessages();

    setPropertyForm({
      ...emptyPropertyForm,
      userRef:
        users.find((user) => !user.isAdmin)?._id || "",
    });

    setShowPropertyForm(true);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-3xl mb-3">⏳</div>
          <p className="text-slate-600 font-medium">
            Loading admin dashboard...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-3 py-6 sm:px-5 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
              Administration
            </p>

            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-slate-600">
              Manage clients, properties and administrators.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={actionLoading}
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            🔄 Refresh
          </button>

        </div>

        {/* MESSAGES */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            <strong>Success:</strong> {success}
          </div>
        )}

        {/* STATISTICS */}

        <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total Users
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {stats?.totalUsers ?? 0}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Registered clients and admins
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Total Properties
            </p>

            <p className="mt-2 text-3xl font-bold text-violet-700">
              {stats?.totalListings ?? 0}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Properties currently in database
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Active Properties
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {stats?.activeListings ?? 0}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Available on the website
            </p>
          </div>

        </section>

        {/* NAVIGATION */}

        <div className="mb-6 rounded-2xl bg-white border border-slate-200 shadow-sm p-2 overflow-x-auto">

          <div className="flex min-w-max gap-2">

            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`rounded-xl px-5 py-3 font-semibold ${
                activeTab === "overview"
                  ? "bg-blue-700 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              📊 Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`rounded-xl px-5 py-3 font-semibold ${
                activeTab === "users"
                  ? "bg-blue-700 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              👥 Users ({users.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("properties")}
              className={`rounded-xl px-5 py-3 font-semibold ${
                activeTab === "properties"
                  ? "bg-blue-700 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              🏠 Properties ({listings.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("employees")}
              className={`rounded-xl px-5 py-3 font-semibold ${
                activeTab === "employees"
                  ? "bg-blue-700 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Employees ({employeeRequests.length})
            </button>  
          </div>

        </div>

        {/* OVERVIEW */}

        {activeTab === "overview" && (
          <section className="grid gap-5 md:grid-cols-2">

            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                User Management
              </h2>

              <p className="mt-2 text-slate-600">
                Create clients, manage existing users and
                assign administrator access.
              </p>

              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setShowClientForm(true);
                  setActiveTab("users");
                }}
                className="mt-5 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
              >
                + Add Client
              </button>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">
                Property Management
              </h2>

              <p className="mt-2 text-slate-600">
                Add properties for clients, edit existing
                properties or remove properties.
              </p>

              <button
                type="button"
                onClick={() => {
                  openPropertyForm();
                  setActiveTab("properties");
                }}
                className="mt-5 rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                + Add Property
              </button>
            </div>

          </section>
        )}

        {/* USERS */}

        {activeTab === "users" && (
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm">

            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Manage Users
                </h2>

                <p className="text-sm text-slate-500">
                  Create clients and manage administrator access.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  clearMessages();
                  setClientForm(emptyClientForm);
                  setShowClientForm((prev) => !prev);
                }}
                className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
              >
                {showClientForm
                  ? "Close Form"
                  : "+ Add Client"}
              </button>

            </div>

            {/* ADD CLIENT FORM */}

            {showClientForm && (
              <form
                onSubmit={handleCreateClient}
                className="border-b border-slate-200 bg-slate-50 p-5"
              >

                <h3 className="mb-4 text-lg font-bold text-slate-900">
                  Create New Client
                </h3>

                <div className="grid gap-4 md:grid-cols-2">

                  <input
                    id="username"
                    value={clientForm.username}
                    onChange={handleClientChange}
                    required
                    placeholder="Username"
                    className="w-full rounded-lg border border-slate-300 bg-white p-3"
                  />

                  <input
                    id="email"
                    type="email"
                    value={clientForm.email}
                    onChange={handleClientChange}
                    required
                    placeholder="Email"
                    className="w-full rounded-lg border border-slate-300 bg-white p-3"
                  />

                  <input
                    id="password"
                    type="password"
                    value={clientForm.password}
                    onChange={handleClientChange}
                    required
                    minLength={6}
                    placeholder="Password"
                    className="w-full rounded-lg border border-slate-300 bg-white p-3"
                  />

                  <input
                    id="phoneNumber"
                    type="tel"
                    value={clientForm.phoneNumber}
                    onChange={handleClientChange}
                    required
                    maxLength={10}
                    placeholder="10-digit phone number"
                    className="w-full rounded-lg border border-slate-300 bg-white p-3"
                  />

                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="mt-4 rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                >
                  {actionLoading
                    ? "Creating..."
                    : "Create Client"}
                </button>

              </form>
            )}

            {/* USERS TABLE */}

            <div className="overflow-x-auto">

              <table className="w-full min-w-[760px] text-left text-sm">

                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">

                  <tr>
                    <th className="p-4">Username</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Phone</th>
                    <th className="p-4">Role</th>
                    <th className="p-4 text-right">
                      Actions
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="border-b border-slate-100 last:border-0"
                    >

                      <td className="p-4 font-semibold text-slate-800">
                        {user.username}
                      </td>

                      <td className="p-4 text-slate-600">
                        {user.email}
                      </td>

                      <td className="p-4 text-slate-600">
                        {user.phoneNumber || "-"}
                      </td>

                      <td className="p-4">

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            user.isAdmin
                              ? "bg-violet-100 text-violet-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {user.isAdmin
                            ? "Admin"
                            : "Client"}
                        </span>

                      </td>

                      <td className="p-4 text-right">

                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleToggleAdmin(user._id)
                          }
                          className="mr-3 font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                        >
                          {user.isAdmin
                            ? "Remove Admin"
                            : "Make Admin"}
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleDeleteUser(user._id)
                          }
                          className="font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

              {users.length === 0 && (
                <p className="p-10 text-center text-slate-500">
                  No users found.
                </p>
              )}

            </div>

          </section>
        )}

        {/* PROPERTIES */}

        {activeTab === "properties" && (
          <section className="rounded-2xl bg-white border border-slate-200 shadow-sm">

            <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Manage Properties
                </h2>

                <p className="text-sm text-slate-500">
                  Add, edit or remove properties.
                </p>
              </div>

              <button
                type="button"
                onClick={openPropertyForm}
                className="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-800"
              >
                + Add Property
              </button>

            </div>

            {/* ADD PROPERTY FORM */}

            {showPropertyForm && (
              <form
                onSubmit={handleCreateProperty}
                className="border-b border-slate-200 bg-slate-50 p-5"
              >

                <div className="mb-5 flex items-center justify-between">

                  <div>
                    <h3 className="text-xl font-bold text-slate-900">
                      Add Property for Client
                    </h3>

                    <p className="text-sm text-slate-500">
                      This property will appear on the website immediately.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowPropertyForm(false)
                    }
                    className="text-2xl text-slate-500 hover:text-red-600"
                  >
                    ×
                  </button>

                </div>

                <div className="grid gap-4 md:grid-cols-2">

                  {/* CLIENT */}

                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">
                      Select Client
                    </label>

                    <select
                      id="userRef"
                      value={propertyForm.userRef}
                      onChange={handlePropertyChange}
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white p-3"
                    >
                      <option value="">
                        Select Client
                      </option>

                      {users
                        .filter((user) => !user.isAdmin)
                        .map((user) => (
                          <option
                            key={user._id}
                            value={user._id}
                          >
                            {user.username} - {user.email}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* PROPERTY TYPE */}

                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">
                      Property Type
                    </label>

                    <select
                      id="propertyType"
                      value={propertyForm.propertyType}
                      onChange={handlePropertyChange}
                      required
                      className="w-full rounded-lg border border-slate-300 bg-white p-3"
                    >
                      <option value="">
                        Select Property Type
                      </option>

                      <option value="Apartment">
                        Apartment
                      </option>

                      <option value="Independent House">
                        Independent House
                      </option>

                      <option value="Commercial Property">
                        Commercial Property
                      </option>

                      <option value="Plot">
                        Plot
                      </option>
                    </select>
                  </div>

                  {/* NAME */}

                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">
                      Property Name
                    </label>

                    <input
                      id="name"
                      value={propertyForm.name}
                      onChange={handlePropertyChange}
                      required
                      minLength={3}
                      maxLength={100}
                      placeholder="Property name"
                      className="w-full rounded-lg border border-slate-300 bg-white p-3"
                    />
                  </div>

                  {/* PHONE */}

                  <div>
                    <label className="mb-1 block font-semibold text-slate-700">
                      Contact Phone Number
                    </label>

                    <input
                      id="phoneNumber"
                      type="tel"
                      value={propertyForm.phoneNumber}
                      onChange={handlePropertyChange}
                      required
                      placeholder="10-digit phone number"
                      className="w-full rounded-lg border border-slate-300 bg-white p-3"
                    />
                  </div>

                  {/* DESCRIPTION */}

                  <div className="md:col-span-2">

                    <label className="mb-1 block font-semibold text-slate-700">
                      Description
                    </label>

                    <textarea
                      id="description"
                      value={propertyForm.description}
                      onChange={handlePropertyChange}
                      required
                      rows={4}
                      placeholder="Describe the property"
                      className="w-full rounded-lg border border-slate-300 bg-white p-3"
                    />

                  </div>

                  {/* ADDRESS */}

                  <div className="md:col-span-2">

                    <label className="mb-1 block font-semibold text-slate-700">
                      Address
                    </label>

                    <input
                      id="address"
                      value={propertyForm.address}
                      onChange={handlePropertyChange}
                      required
                      placeholder="Property address"
                      className="w-full rounded-lg border border-slate-300 bg-white p-3"
                    />

                  </div>

                  {/* CITY */}

                  <input
                    id="city"
                    value={propertyForm.city}
                    onChange={handlePropertyChange}
                    placeholder="City"
                    className="w-full rounded-lg border border-slate-300 bg-white p-3"
                  />

                  {/* STATE */}

                  <input
                    id="state"
                    value={propertyForm.state}
                    onChange={handlePropertyChange}
                    placeholder="State"
                    className="w-full rounded-lg border border-slate-300 bg-white p-3"
                  />

                  {/* PINCODE */}

                  <input
                    id="pincode"
                    value={propertyForm.pincode}
                    onChange={handlePropertyChange}
                    placeholder="Pincode"
                    className="w-full rounded-lg border border-slate-300 bg-white p-3"
                  />

                </div>

                {/* LISTING TYPE */}

                <div className="mt-6 border-t border-slate-200 pt-5">

                  <h4 className="mb-3 font-bold text-slate-800">
                    Listing Type
                  </h4>

                  <div className="flex flex-wrap gap-3">

                    {["sale", "rent", "lease"].map(
                      (type) => (
                        <label
                          key={type}
                          className={`cursor-pointer rounded-lg border px-5 py-3 font-semibold capitalize ${
                            propertyForm.type === type
                              ? "border-blue-600 bg-blue-50 text-blue-700"
                              : "border-slate-300 bg-white text-slate-700"
                          }`}
                        >
                          <input
                            type="radio"
                            name="adminListingType"
                            value={type}
                            checked={
                              propertyForm.type === type
                            }
                            onChange={() =>
                              setPropertyForm(
                                (prev) => ({
                                  ...prev,
                                  type,
                                })
                              )
                            }
                            className="mr-2"
                          />

                          {type}
                        </label>
                      )
                    )}

                  </div>

                  {propertyForm.type === "lease" && (
                    <div className="mt-4 max-w-xs">

                      <label className="mb-1 block font-semibold text-slate-700">
                        Lease Duration (Years)
                      </label>

                      <input
                        id="leaseYears"
                        type="number"
                        min="1"
                        max="99"
                        value={propertyForm.leaseYears}
                        onChange={handlePropertyChange}
                        required
                        className="w-full rounded-lg border border-slate-300 bg-white p-3"
                      />

                    </div>
                  )}

                  <label className="mt-4 flex items-center gap-2 font-medium text-slate-700">

                    <input
                      id="negotiable"
                      type="checkbox"
                      checked={propertyForm.negotiable}
                      onChange={handlePropertyChange}
                    />

                    Price Negotiable

                  </label>

                </div>

                {/* PROPERTY DETAILS */}

                <div className="mt-6 border-t border-slate-200 pt-5">

                  <h4 className="mb-3 font-bold text-slate-800">
                    Property Details
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">
                        Bedrooms
                      </label>

                      <input
                        id="bedrooms"
                        type="number"
                        min="1"
                        value={propertyForm.bedrooms}
                        onChange={handlePropertyChange}
                        required
                        className="w-full rounded-lg border border-slate-300 bg-white p-3"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">
                        Bathrooms
                      </label>

                      <input
                        id="bathrooms"
                        type="number"
                        min="1"
                        value={propertyForm.bathrooms}
                        onChange={handlePropertyChange}
                        required
                        className="w-full rounded-lg border border-slate-300 bg-white p-3"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">
                        Area (sq.ft)
                      </label>

                      <input
                        id="sqft"
                        type="number"
                        min="1"
                        value={propertyForm.sqft}
                        onChange={handlePropertyChange}
                        placeholder="1200"
                        className="w-full rounded-lg border border-slate-300 bg-white p-3"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block font-semibold text-slate-700">
                        Regular Price
                      </label>

                      <input
                        id="regularPrice"
                        type="number"
                        min="50"
                        value={propertyForm.regularPrice}
                        onChange={handlePropertyChange}
                        required
                        className="w-full rounded-lg border border-slate-300 bg-white p-3"
                      />
                    </div>

                  </div>

                </div>

                {/* AMENITIES */}

                <div className="mt-6 grid gap-5 md:grid-cols-2">

                  <fieldset className="rounded-xl border border-slate-200 bg-white p-4">

                    <legend className="px-2 font-bold text-slate-800">
                      Basic Amenities
                    </legend>

                    <div className="mt-2 flex flex-wrap gap-2">

                      {BASIC_AMENITIES.map(
                        (amenity) => (
                          <label
                            key={amenity}
                            className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                              propertyForm.basicAmenities.includes(
                                amenity
                              )
                                ? "border-green-600 bg-green-50 text-green-700"
                                : "border-slate-200"
                            }`}
                          >

                            <input
                              type="checkbox"
                              checked={propertyForm.basicAmenities.includes(
                                amenity
                              )}
                              onChange={() =>
                                togglePropertyAmenity(
                                  "basicAmenities",
                                  amenity
                                )
                              }
                              className="mr-2"
                            />

                            {amenity}

                          </label>
                        )
                      )}

                    </div>

                  </fieldset>

                  <fieldset className="rounded-xl border border-slate-200 bg-white p-4">

                    <legend className="px-2 font-bold text-slate-800">
                      Luxury Amenities
                    </legend>

                    <div className="mt-2 flex flex-wrap gap-2">

                      {LUXURY_AMENITIES.map(
                        (amenity) => (
                          <label
                            key={amenity}
                            className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                              propertyForm.luxuryAmenities.includes(
                                amenity
                              )
                                ? "border-purple-600 bg-purple-50 text-purple-700"
                                : "border-slate-200"
                            }`}
                          >

                            <input
                              type="checkbox"
                              checked={propertyForm.luxuryAmenities.includes(
                                amenity
                              )}
                              onChange={() =>
                                togglePropertyAmenity(
                                  "luxuryAmenities",
                                  amenity
                                )
                              }
                              className="mr-2"
                            />

                            {amenity}

                          </label>
                        )
                      )}

                    </div>

                  </fieldset>

                </div>

                {/* LOCATION COORDINATES */}

                <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">

                  <h4 className="mb-3 font-bold text-slate-800">
                    Property Location
                  </h4>

                  <p className="mb-3 text-sm text-slate-500">
                    Enter coordinates if available. You can also leave
                    them empty and add the exact location later.
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">

                    <input
                      id="latitude"
                      type="number"
                      step="any"
                      value={propertyForm.latitude}
                      onChange={handlePropertyChange}
                      placeholder="Latitude"
                      className="w-full rounded-lg border border-slate-300 p-3"
                    />

                    <input
                      id="longitude"
                      type="number"
                      step="any"
                      value={propertyForm.longitude}
                      onChange={handlePropertyChange}
                      placeholder="Longitude"
                      className="w-full rounded-lg border border-slate-300 p-3"
                    />

                  </div>

                </div>

                {/* SUBMIT */}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="rounded-lg bg-green-700 px-6 py-3 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                  >
                    {actionLoading
                      ? "Creating Property..."
                      : "Create Property"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setShowPropertyForm(false)
                    }
                    className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                </div>

              </form>
            )}

            {/* PROPERTIES TABLE */}

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1000px] text-left text-sm">

                <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">

                  <tr>
                    <th className="p-4">Property</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Owner</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Price</th>
                    <th className="p-4 text-right">
                      Actions
                    </th>
                  </tr>

                </thead>

                <tbody>

                  {listings.map((listing) => (
                    <tr
                      key={listing._id}
                      className="border-b border-slate-100 last:border-0"
                    >

                      <td className="p-4">

                        <img
                          src={
                            listing.imageUrls?.[0] ||
                            "https://placehold.co/100x70?text=Property"
                          }
                          alt={listing.name || "Property"}
                          className="h-16 w-24 rounded-lg object-cover"
                        />

                      </td>

                      <td className="p-4">

                        <p className="font-semibold text-slate-800">
                          {listing.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {listing.propertyType}
                        </p>

                      </td>

                      <td className="p-4 text-slate-600">
                        {listing.userRef?.username ||
                          "Unknown"}
                      </td>

                      <td className="p-4">

                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                          {listing.type}
                        </span>

                      </td>

                      <td className="p-4 font-semibold text-slate-700">
                        {currencyFormatter.format(
                          listing.regularPrice || 0
                        )}
                      </td>

                      <td className="p-4 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            handleEditListing(
                              listing._id
                            )
                          }
                          className="mr-3 font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading}
                          onClick={() =>
                            handleDeleteListing(
                              listing._id
                            )
                          }
                          className="font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                        >
                          Delete
                        </button>

                      </td>

                    </tr>
                  ))}

                </tbody>

              </table>

              {listings.length === 0 && (
                <p className="p-10 text-center text-slate-500">
                  No properties found.
                </p>
              )}

              </div>
          </section>
        )}

              {/* EMPLOYEES */}

              {activeTab === "employees" && (
                <section className="rounded-2xl bg-white border border-slate-200 shadow-sm">

                  <div className="border-b border-slate-200 p-5">
                    <h2 className="text-xl font-bold text-slate-900">
                      Employee Requests
                    </h2>

                    <p className="text-sm text-slate-500">
                      Review employees who are requesting permission to access the User Dashboard.
                    </p>
                  </div>

                  <div className="overflow-x-auto">

                    <table className="w-full min-w-[800px] text-left text-sm">

                      <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                        <tr>
                          <th className="p-4">Employee</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Phone</th>
                          <th className="p-4">Requested</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                      </thead>

                      <tbody>

                        {employeeRequests.map((request) => (
                          <tr
                            key={request._id}
                            className="border-b border-slate-100 last:border-0"
                          >

                           <td className="p-4 font-semibold text-slate-800">
                             {request.employee?.username || "Unknown"}
                           </td>

                           <td className="p-4 text-slate-600">
                             {request.employee?.email || "-"}
                           </td>

                           <td className="p-4 text-slate-600">
                             {request.employee?.phoneNumber || "-"}
                           </td>

                           <td className="p-4 text-slate-600">
                             {request.createdAt
                               ? new Date(request.createdAt).toLocaleDateString()
                               : "-"}
                           </td>

                           <td className="p-4 text-right">

                             <button
                               type="button"
                               disabled={actionLoading}
                               onClick={() =>
                                 handleApproveEmployee(request._id)
                               }
                               className="mr-3 rounded-lg bg-green-600 px-4 py-2 font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                             >
                               Allow
                             </button>

                             <button
                               type="button"
                               disabled={actionLoading}
                               onClick={() =>
                                 handleRejectEmployee(request._id)
                               }
                               className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                             >
                               Don't Allow
                             </button>

                           </td>

                         </tr>
                       ))}

                      </tbody>

                    </table>

                    {employeeRequests.length === 0 && (
                      <p className="p-10 text-center text-slate-500">
                        No pending employee requests.
                      </p>
                     )}

                  </div>

                </section>
              )}
   
            </div>
          </main>
        );
      };

export default AdminDashboard;