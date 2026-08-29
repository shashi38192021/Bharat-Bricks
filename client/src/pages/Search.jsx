import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ListingItem from "../components/ListingItem";

const Search = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarData, setSidebarData] = useState({
    location: "",
    type: "all",
    propertyType: "",
    minPrice: "",
    maxPrice: "",
    bedrooms: "",
    sort: "created_at",
    order: "desc",
  });
  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);

    const locationFromUrl = urlParams.get("location");
    const typeFromUrl = urlParams.get("type");
    const propertyTypeFromUrl = urlParams.get("propertyType");
    const minPriceFromUrl = urlParams.get("minPrice");
    const maxPriceFromUrl = urlParams.get("maxPrice");
    const bedroomsFromUrl = urlParams.get("bedrooms");

    setSidebarData({
      location: locationFromUrl || "",
      type: typeFromUrl || "all",
      propertyType: propertyTypeFromUrl || "",
      minPrice: minPriceFromUrl || "",
      maxPrice: maxPriceFromUrl || "",
      bedrooms: bedroomsFromUrl || "",
      sort: sidebarData.sort,
      order: sidebarData.order,
    });

    const fetchListings = async () => {
      setLoading(true);
      setShowMore(false);

      const searchQuery = urlParams.toString();
      const res = await fetch(`/api/listing/get?${searchQuery}`);
      const data = await res.json();

      if (data.length > 8) {
        setShowMore(true);
      } else {
        setShowMore(false);
      }

      setListings(data);
      setLoading(false);
    };

    fetchListings();
  }, [location.search]);

  const handleChange = (e) => {
    const { id, value } = e.target;

    setSidebarData((data) => ({
      ...data,
      [id]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const urlParams = new URLSearchParams();

    if (sidebarData.location) {
      urlParams.set("location", sidebarData.location);
    }

    if (sidebarData.type && sidebarData.type !== "all") {
      urlParams.set("type", sidebarData.type);
    }

    if (sidebarData.propertyType) {
      urlParams.set("propertyType", sidebarData.propertyType);
    }

    if (sidebarData.minPrice) {
      urlParams.set("minPrice", sidebarData.minPrice);
    }

    if (sidebarData.maxPrice) {
      urlParams.set("maxPrice", sidebarData.maxPrice);
    }

    if (sidebarData.bedrooms) {
      urlParams.set("bedrooms", sidebarData.bedrooms);
    }

    navigate(`/search?${urlParams.toString()}`);
  };

  const onShowMoreClick = async () => {
    const numberOfListings = listings.length;
    const startIndex = numberOfListings;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set("startIndex", startIndex);
    const searchQuery = urlParams.toString();

    const res = await fetch(`/api/listing/get?${searchQuery}`);
    const data = await res.json();

    if (data.length < 9) {
      setShowMore(false);
    }

    setListings([...listings, ...data]);
  };

  return (
    <div className="flex flex-col md:flex-row">
      <div className="p-7 border-b-2 md:border-r-2 md:min-h-screen">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Location */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Location</label>
            <input
              type="text"
              id="location"
              placeholder="Enter city or area"
              className="border rounded-lg p-3"
              value={sidebarData.location}
              onChange={handleChange}
            />
          </div>

          {/* Looking For */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Looking For</label>
            <select
              id="type"
              value={sidebarData.type}
              onChange={handleChange}
              className="border rounded-lg p-3"
            >
              <option value="all">Any</option>
              <option value="sale">Buy / Sale</option>
              <option value="rent">Rent</option>
              <option value="lease">Lease</option>
            </select>
          </div>

          {/* Property Type */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Property Type</label>
            <select
              id="propertyType"
              value={sidebarData.propertyType}
              onChange={handleChange}
              className="border rounded-lg p-3"
            >
              <option value="">Any Property Type</option>
              <option value="Apartment">Apartment</option>
              <option value="Independent House">Independent House</option>
              <option value="Standalone Building">Standalone Building</option>
              <option value="Commercial Property">Commercial Property</option>
              <option value="Plot">Plot</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Price Range</label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                id="minPrice"
                placeholder="Min Price"
                min="0"
                className="border rounded-lg p-3"
                value={sidebarData.minPrice}
                onChange={handleChange}
              />
              <input
                type="number"
                id="maxPrice"
                placeholder="Max Price"
                min="0"
                className="border rounded-lg p-3"
                value={sidebarData.maxPrice}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Bedrooms */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Bedrooms</label>
            <select
              id="bedrooms"
              value={sidebarData.bedrooms}
              onChange={handleChange}
              className="border rounded-lg p-3"
            >
              <option value="">Any Bedrooms</option>
              <option value="1">1 BHK</option>
              <option value="2">2 BHK</option>
              <option value="3">3 BHK</option>
              <option value="4">4 BHK</option>
              <option value="5">5+ BHK</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-blue-700 text-white p-3 rounded-lg uppercase hover:opacity-95"
          >
            Search
          </button>
        </form>
      </div>

      <div className="flex-1">
        <h1 className="text-3xl font-semibold border-b p-3 text-slate-700 mt-5">
          Listing Results:
        </h1>
        <div className="p-7 flex flex-wrap gap-4">
          {!loading && listings.length === 0 && (
            <p className="text-xl text-slate-700">No listing found!</p>
          )}

          {loading && (
            <p className="text-xl text-slate-700 text-center w-full">
              Loading...
            </p>
          )}

          {!loading &&
            listings &&
            listings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} />
            ))}

          {showMore && (
            <button
              onClick={onShowMoreClick}
              className="text-green-700 hover:underline p-7 text-center w-full"
            >
              Show more
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Search;