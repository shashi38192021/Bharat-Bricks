import { useEffect, useState } from "react";

const UserDashboard = () => {
  const [user, setUser] = useState(null);

  const [showClientForm, setShowClientForm] = useState(false);

  const [clientForm, setClientForm] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
  });

  const [clientMessage, setClientMessage] = useState("");
  const [clientLoading, setClientLoading] = useState(false);

  const [stats, setStats] = useState({
    clientsAdded: 0,
    propertiesAdded: 0,
    saleDeals: 0,
    rentDeals: 0,
    leaseDeals: 0,
    assignedProperties: 0,
  });

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  }, []);

  const handleClientChange = (event) => {
    const { name, value } = event.target;

    setClientForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAddClient = async (event) => {
    event.preventDefault();

    setClientLoading(true);
    setClientMessage("");

    try {
      const response = await fetch("/api/employee-client/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(clientForm),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to add client."
        );
      }

      setClientMessage("Client added successfully.");

      setStats((previous) => ({
        ...previous,
        clientsAdded: previous.clientsAdded + 1,
      }));

      setClientForm({
        username: "",
        email: "",
        phoneNumber: "",
        password: "",
      });

      setShowClientForm(false);
    } catch (error) {
      console.error("Add client error:", error);

      setClientMessage(
        error.message || "Failed to add client."
      );
    } finally {
      setClientLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Employee Dashboard
          </h1>

          <p className="mt-2 text-slate-600">
            Welcome {user?.username || "Employee"}.
          </p>

          <p className="mt-1 text-sm text-slate-500">
            Manage your clients and properties. You do not have
            permission to delete clients, properties, or other records.
          </p>
        </div>


        {/* EMPLOYEE STATISTICS */}

        <section className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

          {/* CLIENTS */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Clients Added
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-700">
              {stats.clientsAdded}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Total clients added by you.
            </p>
          </div>


          {/* PROPERTIES */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Properties Added
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {stats.propertiesAdded}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Properties added by you.
            </p>
          </div>


          {/* ASSIGNED */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Properties Assigned
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-700">
              {stats.assignedProperties}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Properties assigned to you for closing deals.
            </p>
          </div>


          {/* SALE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Sale Deals Closed
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.saleDeals}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Successfully closed sale conversations.
            </p>
          </div>


          {/* RENT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Rent Deals Closed
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.rentDeals}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Successfully closed rental conversations.
            </p>
          </div>


          {/* LEASE */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Lease Deals Closed
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stats.leaseDeals}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Successfully closed lease conversations.
            </p>
          </div>

        </section>


        {/* EMPLOYEE ACTIONS */}

        <section className="grid gap-6 lg:grid-cols-2">


          {/* CLIENT MANAGEMENT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Clients
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add and manage the clients handled by you.
            </p>

            <button
              type="button"
              onClick={() => {
                setShowClientForm(true);
                setClientMessage("");
              }}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              + Add Client
            </button>


            {/* ADD CLIENT FORM */}

            {showClientForm && (
              <form
                onSubmit={handleAddClient}
                className="mt-6 space-y-4 border-t border-slate-200 pt-5"
              >

                <h3 className="text-lg font-bold text-slate-900">
                  Add New Client
                </h3>


                <input
                  type="text"
                  name="username"
                  value={clientForm.username}
                  onChange={handleClientChange}
                  placeholder="Client Name"
                  required
                  className="w-full rounded-lg border border-slate-300 p-3"
                />


                <input
                  type="email"
                  name="email"
                  value={clientForm.email}
                  onChange={handleClientChange}
                  placeholder="Client Email"
                  required
                  className="w-full rounded-lg border border-slate-300 p-3"
                />


                <input
                  type="tel"
                  name="phoneNumber"
                  value={clientForm.phoneNumber}
                  onChange={handleClientChange}
                  placeholder="10-digit Phone Number"
                  maxLength="10"
                  required
                  className="w-full rounded-lg border border-slate-300 p-3"
                />


                <input
                  type="password"
                  name="password"
                  value={clientForm.password}
                  onChange={handleClientChange}
                  placeholder="Temporary Password"
                  required
                  className="w-full rounded-lg border border-slate-300 p-3"
                />


                <div className="flex gap-3">

                  <button
                    type="submit"
                    disabled={clientLoading}
                    className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {clientLoading
                      ? "Adding Client..."
                      : "Save Client"}
                  </button>


                  <button
                    type="button"
                    onClick={() => {
                      setShowClientForm(false);
                      setClientMessage("");
                    }}
                    className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Cancel
                  </button>

                </div>


                {clientMessage && (
                  <p className="rounded-lg bg-slate-100 p-3 text-sm font-medium text-slate-700">
                    {clientMessage}
                  </p>
                )}

              </form>
            )}

          </div>


          {/* PROPERTY MANAGEMENT */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <h2 className="text-xl font-bold text-slate-900">
              Properties
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Add and manage the properties handled by you.
            </p>

            <button
              type="button"
              onClick={() =>
                (window.location.href = "/create-listing")
              }
              className="mt-5 rounded-lg bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700"
            >
              + Add Property
            </button>

            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                You can add and manage properties assigned to your
                employee account.
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-700">
                Property deletions are not available to employees.
              </p>
            </div>

          </div>

        </section>


        {/* DEAL ACTIVITY */}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-900">
            Deal Activity
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Track conversations and deals closed by you.
          </p>


          <div className="mt-6 grid gap-4 md:grid-cols-3">

            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Sale
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stats.saleDeals}
              </p>
            </div>


            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Rent
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stats.rentDeals}
              </p>
            </div>


            <div className="rounded-xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Lease
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {stats.leaseDeals}
              </p>
            </div>

          </div>

        </section>

      </div>
    </main>
  );
};

export default UserDashboard;