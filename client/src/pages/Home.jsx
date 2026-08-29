import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import SwiperCore from "swiper";
import "swiper/css/bundle";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("rent");
  const [recentListings, setRecentListings] = useState([]);
  const [rentListings, setRentListings] = useState([]);
  const [saleListings, setSaleListings] = useState([]);
  const [leaseListings, setLeaseListings] = useState([]);

  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);

  SwiperCore.use([Navigation, Autoplay]);

  const formatINR = (price) => {
    if (!price) return "₹0";
    return "₹" + Number(price).toLocaleString("en-IN");
  };

  const handlePropertyClick = (listingId) => {
    if (!currentUser) {
      navigate("/sign-up");
      return;
    }

    navigate(`/listing/${listingId}`);
  };

  useEffect(() => {
    const fetchRecentListings = async () => {
      try {
        const res = await fetch("/api/listing/get?limit=5");
        const data = await res.json();

        if (Array.isArray(data)) {
          setRecentListings(data);
        }
      } catch (error) {
        console.error("Error fetching hero listings:", error);
      }
    };

    const fetchRentListings = async () => {
      try {
        const res = await fetch("/api/listing/get?type=rent&limit=4");
        const data = await res.json();

        if (Array.isArray(data)) {
          setRentListings(data);
        }

        fetchSaleListings();
      } catch (error) {
        console.error("Error fetching rent listings:", error);
      }
    };

    const fetchSaleListings = async () => {
      try {
        const res = await fetch("/api/listing/get?type=sale&limit=4");
        const data = await res.json();

        if (Array.isArray(data)) {
          setSaleListings(data);
        }

        fetchLeaseListings();
      } catch (error) {
        console.error("Error fetching sale listings:", error);
      }
    };

    const fetchLeaseListings = async () => {
      try {
        const res = await fetch("/api/listing/get?type=lease&limit=4");
        const data = await res.json();

        if (Array.isArray(data)) {
          setLeaseListings(data);
        }
      } catch (error) {
        console.error("Error fetching lease listings:", error);
      }
    };

    fetchRecentListings();
    fetchRentListings();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const urlParams = new URLSearchParams();

    urlParams.set("type", selectedType);

    if (searchTerm.trim()) {
      urlParams.set("searchTerm", searchTerm.trim());
    }

    navigate(`/search?${urlParams.toString()}`);
  };

  const PropertyCard = ({ listing, priceSuffix = "" }) => {
    return (
      <div
        onClick={() => handlePropertyClick(listing._id)}
        className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer"
      >
        <img
          src={listing.imageUrls?.[0]}
          alt={listing.name}
          className="h-44 w-full object-cover"
        />

        <div className="p-4 flex flex-col justify-between flex-grow">
          <p className="font-semibold text-slate-800 text-base truncate">
            {listing.name}
          </p>

          <p className="text-slate-500 text-xs mt-1 truncate">
            📍 {listing.address || "Location on request"}
          </p>

          <p className="text-blue-600 font-bold text-lg mt-3">
            {formatINR(listing.regularPrice)}
            {priceSuffix}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full h-[450px] sm:h-[550px]">
        <Swiper
          navigation
          autoplay={{
            delay: 4000,
            disableOnInteraction: false,
          }}
          className="h-full w-full"
        >
          {recentListings.length > 0 ? (
            recentListings.map((listing) => (
              <SwiperSlide key={listing._id}>
                <div
                  className="h-full w-full bg-center bg-cover transition-all duration-500"
                  style={{
                    backgroundImage: `url(${
                      listing.imageUrls?.[0] ||
                      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80"
                    })`,
                  }}
                >
                  <div className="w-full h-full bg-black/40"></div>
                </div>
              </SwiperSlide>
            ))
          ) : (
            <SwiperSlide>
              <div
                className="h-full w-full bg-center bg-cover"
                style={{
                  backgroundImage:
                    "url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1400&q=80')",
                }}
              >
                <div className="w-full h-full bg-black/40"></div>
              </div>
            </SwiperSlide>
          )}
        </Swiper>

        {/* Centered Search Box */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none px-4">
          <div className="pointer-events-auto w-full max-w-2xl bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
              Find Your Dream Property in India
            </h1>

            <p className="text-slate-600 text-xs sm:text-sm mb-5">
              Explore verified properties for Rent, Sale, and Lease.
            </p>

            {/* Property Type Buttons */}
            <div className="flex justify-center gap-2 sm:gap-3 mb-4">
              {["rent", "sale", "lease"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-6 sm:px-8 py-2.5 rounded-lg font-semibold text-sm sm:text-base border transition-all ${
                    selectedType === type
                      ? "bg-yellow-200 text-slate-800 border-yellow-300 shadow-sm"
                      : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            {/* Location Search */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center bg-white border border-slate-300 rounded-xl overflow-hidden p-1.5 shadow-sm"
            >
              <input
                type="text"
                placeholder="Search by location / area..."
                className="w-full px-4 py-2.5 text-slate-700 text-sm sm:text-base focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg text-sm sm:text-base transition-colors"
              >
                Search
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6 flex flex-col gap-10 my-6">
        {/* Add Property */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex justify-center items-center">
          <Link
            to="/create-listing"
            className="bg-white text-blue-700 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition whitespace-nowrap shadow-md"
          >
            + Add Property
          </Link>
        </div>

        {/* Recently Added Rental */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                Recently Added Rental
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Explore homes and apartments available for monthly rent
              </p>
            </div>

            <Link
              className="text-xs sm:text-sm text-blue-600 hover:underline font-semibold flex items-center gap-1"
              to="/search?type=rent"
            >
              Show more rentals →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {rentListings.length > 0 ? (
              rentListings.map((listing) => (
                <PropertyCard
                  key={listing._id}
                  listing={listing}
                  priceSuffix=" / month"
                />
              ))
            ) : (
              <p className="text-slate-500 text-sm py-4 col-span-full text-center">
                No rental properties available yet.
              </p>
            )}
          </div>
        </section>

        {/* Recently Added Sale */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                Recently Added Sale
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Find properties available for direct buy
              </p>
            </div>

            <Link
              className="text-xs sm:text-sm text-blue-600 hover:underline font-semibold flex items-center gap-1"
              to="/search?type=sale"
            >
              Show more sales →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {saleListings.length > 0 ? (
              saleListings.map((listing) => (
                <PropertyCard key={listing._id} listing={listing} />
              ))
            ) : (
              <p className="text-slate-500 text-sm py-4 col-span-full text-center">
                No sale properties available yet.
              </p>
            )}
          </div>
        </section>

        {/* Recently Added Lease */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                Recently Added Lease
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Check out the latest properties for long-term lease
              </p>
            </div>

            <Link
              className="text-xs sm:text-sm text-blue-600 hover:underline font-semibold flex items-center gap-1"
              to="/search?type=lease"
            >
              Show more leases →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {leaseListings.length > 0 ? (
              leaseListings.map((listing) => (
                <PropertyCard
                  key={listing._id}
                  listing={listing}
                  priceSuffix=" / lease"
                />
              ))
            ) : (
              <p className="text-slate-500 text-sm py-4 col-span-full text-center">
                No lease properties available yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}