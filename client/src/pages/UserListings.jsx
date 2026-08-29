import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FiEdit, FiTrash2, FiEye } from "react-icons/fi";

const UserListings = () => {
  const { currentUser } = useSelector((state) => state.user);

  const [userListings, setUserListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const res = await fetch(
          `/api/listing/user/${currentUser?._id}`,
          {
            credentials: "include",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch listings");
        }

        setUserListings(data);
      } catch (error) {
        console.log(error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser?._id) {
      fetchListings();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleDelete = async (listingId) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) {
      return;
    }

    try {
      const res = await fetch(
        `/api/listing/delete/${listingId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete listing");
      }

      setUserListings((prev) =>
        prev.filter((listing) => listing._id !== listingId)
      );
    } catch (error) {
      console.log(error);
      alert(error.message);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between my-8">
        <h1 className="text-4xl font-bold text-gray-800">
          My Listings
        </h1>

        <Link
          to="/create-listing"
          className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Property
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <p className="text-center text-gray-600 animate-pulse">
          Loading listings...
        </p>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="text-center">
          <p className="text-red-600 font-semibold">
            Failed to load listings. Please try again later.
          </p>
        </div>
      )}

      {/* Listings */}
      {!loading &&
        !error &&
        userListings.length > 0 && (
          <div className="space-y-6">

            {userListings.map((listing) => (
              <div
                key={listing._id}
                className="bg-white shadow-md p-5 rounded-lg flex items-center gap-5"
              >

                {/* Property Image */}
                <Link
                  to={`/listing/${listing._id}`}
                  className="flex-shrink-0"
                  title="View Property"
                >
                  <img
                    src={listing.imageUrls?.[0]}
                    alt="Property"
                    className="h-24 w-24 object-cover rounded-md transition-transform duration-300 hover:scale-105"
                  />
                </Link>

                {/* Property Information */}
                <div className="flex-1">

                  <Link
                    to={`/listing/${listing._id}`}
                    className="text-xl font-semibold text-blue-600 hover:underline transition"
                  >
                    {listing.name || "Property"}
                  </Link>

                  {listing.address && (
                    <p className="text-gray-600 mt-1">
                      {listing.address}
                    </p>
                  )}

                  {listing.type && (
                    <p className="text-gray-500 text-sm mt-1 capitalize">
                      {listing.type}
                    </p>
                  )}

                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">

                  {/* VIEW */}
                  <Link
                    to={`/listing/${listing._id}`}
                    className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                    title="View Listing"
                  >
                    <FiEye size={20} />
                  </Link>

                  {/* EDIT */}
                  <Link
                    to={`/create-listing/${listing._id}`}
                    className="p-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
                    title="Edit Listing"
                  >
                    <FiEdit size={20} />
                  </Link>

                  {/* DELETE */}
                  <button
                    onClick={() => handleDelete(listing._id)}
                    className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                    title="Delete Listing"
                  >
                    <FiTrash2 size={20} />
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

      {/* No Listings */}
      {!loading &&
        !error &&
        userListings.length === 0 && (
          <div className="text-center">
            <p className="text-gray-500 mb-4">
              No listings found.
            </p>

            <Link
              to="/create-listing"
              className="inline-block bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              + Add Property
            </Link>
          </div>
        )}
    </div>
  );
};

export default UserListings;