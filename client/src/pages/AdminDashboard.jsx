import { useCallback, useEffect, useState } from "react";
import { readApiResponse } from "../utils/api";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [statsResponse, usersResponse, listingsResponse] = await Promise.all([
        fetch("/api/admin/stats", { credentials: "include" }),
        fetch("/api/admin/users", { credentials: "include" }),
        fetch("/api/admin/listings", { credentials: "include" }),,
      ]);

      const [statsData, usersData, listingsData] = await Promise.all([
        readApiResponse(statsResponse),
        readApiResponse(usersResponse),
        readApiResponse(listingsResponse),
      ]);

      if (!statsResponse.ok || !usersResponse.ok || !listingsResponse.ok) {
        throw new Error(
          statsData.message || usersData.message || listingsData.message || "Unable to load dashboard."
        );
      }

      setStats(statsData);
      setUsers(usersData);
      setListings(listingsData);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const runAction = async (url, options, successMessage) => {
    try {
      setActionId(url);
      setError("");
      const response = await fetch(url, {
        ...options,
        credentials: "include",
      });      
      const data = await readApiResponse(response);

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Action could not be completed.");
      }

      await loadDashboard();
      return successMessage;
    } catch (requestError) {
      setError(requestError.message);
      return null;
    } finally {
      setActionId("");
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Delete this user and all of their listings?")) {
      await runAction(`/api/admin/users/${id}`, { method: "DELETE" });
    }
  };

  const handleToggleAdmin = async (id) => {
    await runAction(`/api/admin/users/${id}/admin`, { method: "PATCH" });
  };

  const handleDeleteListing = async (id) => {
    if (window.confirm("Delete this listing?")) {
      await runAction(`/api/admin/listings/${id}`, { method: "DELETE" });
    }
  };

  const handleToggleApproval = async (id) => {
    await runAction(`/api/admin/listings/approve/${id}`, { method: "PUT" });
  };

  if (loading) {
    return <p className="p-8 text-center text-slate-600">Loading admin dashboard…</p>;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">Administration</p>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="mt-1 text-slate-600">Manage members and property approvals.</p>
          </div>
          <button onClick={loadDashboard} className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-700 hover:bg-slate-100">
            Refresh
          </button>
        </div>

        {error && <p className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Total Users", stats?.totalUsers ?? 0, "text-blue-700 bg-blue-50"],
            ["Total Listings", stats?.totalListings ?? 0, "text-violet-700 bg-violet-50"],
            ["Active Listings", stats?.activeListings ?? 0, "text-emerald-700 bg-emerald-50"],
            ["Pending Approval", stats?.pendingListings ?? 0, "text-amber-700 bg-amber-50"],
          ].map(([label, value, color]) => (
            <article key={label} className={`rounded-2xl p-5 shadow-sm ${color}`}>
              <p className="text-sm font-medium">{label}</p>
              <p className="mt-2 text-3xl font-bold">{value}</p>
            </article>
          ))}
        </section>

        <div className="rounded-2xl bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 pt-5">
            <button onClick={() => setActiveTab("users")} className={`mr-6 border-b-2 pb-4 font-semibold ${activeTab === "users" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}>
              Manage Users ({users.length})
            </button>
            <button onClick={() => setActiveTab("listings")} className={`border-b-2 pb-4 font-semibold ${activeTab === "listings" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500"}`}>
              Manage Listings ({listings.length})
            </button>
          </div>

          <div className="overflow-x-auto p-5">
            {activeTab === "users" ? (
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="border-b text-slate-500"><tr><th className="pb-3">User</th><th className="pb-3">Email</th><th className="pb-3">Role</th><th className="pb-3 text-right">Actions</th></tr></thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-b last:border-0">
                      <td className="py-4 font-medium text-slate-800">{user.username}</td>
                      <td className="py-4 text-slate-600">{user.email}</td>
                      <td className="py-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isAdmin ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-600"}`}>{user.isAdmin ? "Admin" : "User"}</span></td>
                      <td className="py-4 text-right"><button disabled={actionId === `/api/admin/users/${user._id}/admin`} onClick={() => handleToggleAdmin(user._id)} className="mr-3 font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50">{user.isAdmin ? "Remove Admin" : "Make Admin"}</button><button disabled={actionId === `/api/admin/users/${user._id}`} onClick={() => handleDeleteUser(user._id)} className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="border-b text-slate-500"><tr><th className="pb-3">Property</th><th className="pb-3">Title</th><th className="pb-3">Price</th><th className="pb-3">Status</th><th className="pb-3 text-right">Actions</th></tr></thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing._id} className="border-b last:border-0">
                      <td className="py-3"><img src={listing.imageUrls?.[0] || "https://placehold.co/96x64?text=Property"} alt="" className="h-14 w-20 rounded-lg object-cover" /></td>
                      <td className="py-3"><p className="font-medium text-slate-800">{listing.name}</p><p className="text-xs text-slate-500">{listing.userRef?.username || "Unknown owner"}</p></td>
                      <td className="py-3 text-slate-700">{currencyFormatter.format(listing.regularPrice)}</td>
                      <td className="py-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${listing.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{listing.approved ? "Approved" : "Pending"}</span></td>
                      <td className="py-3 text-right"><button disabled={actionId === `/api/admin/listings/approve/${listing._id}`} onClick={() => handleToggleApproval(listing._id)} className="mr-3 font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50">{listing.approved ? "Unapprove" : "Approve"}</button><button disabled={actionId === `/api/admin/listings/${listing._id}`} onClick={() => handleDeleteListing(listing._id)} className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50">Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminDashboard;
