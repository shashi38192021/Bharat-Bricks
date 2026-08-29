import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { BASIC_AMENITIES, LUXURY_AMENITIES } from "../utils/listing";

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const DEFAULT_POSITION = [20.5937, 78.9629];

const initialForm = {
  imageUrls: [],
  propertyType: "",
  name: "",
  description: "",
  address: "",
  phoneNumber: "",
  katha: "",
  type: "rent",
  leaseYears: 1,
  bedrooms: 1,
  bathrooms: 1,
  sqft: "",
  regularPrice: 50,
  negotiable: false,
  latitude: null,
  longitude: null,
  amenities: {
    basic: [],
    luxury: [],
  },
};

// Move map when location changes
function ChangeMapView({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 16);
    }
  }, [position, map]);

  return null;
}

// Click map to select exact location
function LocationPicker({ position, onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

const CreateListing = () => {
  const { listingId } = useParams();
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Location search
  const [locationSearch, setLocationSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);

  const [mapPosition, setMapPosition] =
    useState(DEFAULT_POSITION);

  // Handle normal form changes
  const handleChange = (e) => {
    const { id, value, checked, type } = e.target;

    // Sale / Rent / Lease
    if (["sale", "rent", "lease"].includes(id)) {
      setFormData((prev) => ({
        ...prev,
        type: id,
      }));

      return;
    }

    // Checkbox
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [id]: checked,
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  // Toggle amenities
  const toggleAmenity = (group, amenity) => {
    setFormData((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [group]: prev.amenities[group].includes(amenity)
          ? prev.amenities[group].filter(
              (item) => item !== amenity
            )
          : [...prev.amenities[group], amenity],
      },
    }));
  };

  // Search location using OpenStreetMap
  const searchLocation = async () => {
    if (!locationSearch.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchingLocation(true);
      setError("");

      const url =
        "https://nominatim.openstreetmap.org/search" +
        `?format=json&limit=5&q=${encodeURIComponent(
          locationSearch
        )}`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Location search failed.");
      }

      const data = await res.json();

      setSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Location search error:", err);
      setSearchResults([]);
      setError("Unable to search location. Please try again.");
    } finally {
      setSearchingLocation(false);
    }
  };

  // Select location from search results
  const selectLocation = (location) => {
    const lat = Number(location.lat);
    const lng = Number(location.lon);

    setMapPosition([lat, lng]);

    setFormData((prev) => ({
      ...prev,
      address: location.display_name,
      latitude: lat,
      longitude: lng,
    }));

    setLocationSearch(location.display_name);
    setSearchResults([]);
  };

  // Select exact location by clicking map
  const handleMapLocation = async (lat, lng) => {
    setMapPosition([lat, lng]);

    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));

    try {
      const url =
        "https://nominatim.openstreetmap.org/reverse" +
        `?format=json&lat=${lat}&lon=${lng}`;

      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!res.ok) {
        return;
      }

      const data = await res.json();

      if (data?.display_name) {
        setFormData((prev) => ({
          ...prev,
          address: data.display_name,
          latitude: lat,
          longitude: lng,
        }));

        setLocationSearch(data.display_name);
      }
    } catch (err) {
      console.error("Reverse location error:", err);
    }
  };

  // Upload images
  const uploadImages = async () => {
    if (!files.length) {
      setError("Please select at least one image.");
      return;
    }

    if (files.length + formData.imageUrls.length > 6) {
      setError("You can upload a maximum of 6 images.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const urls = await Promise.all(
        [...files].map(async (file) => {
          const body = new FormData();
          body.append("image", file);

          const res = await fetch("/api/upload", {
            method: "POST",
            body,
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(
              data.message || "Image upload failed."
            );
          }

          return data.secure_url;
        })
      );

      setFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...urls],
      }));

      setFiles([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Remove image
  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter(
        (_, i) => i !== index
      ),
    }));
  };

  // Submit listing
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!currentUser?._id) {
      setError(
        "Please sign in before creating a listing."
      );
      return;
    }

    if (formData.imageUrls.length === 0) {
      setError("Please upload at least one property image.");
      return;
    }

    if (
      formData.type === "lease" &&
      (!Number.isInteger(Number(formData.leaseYears)) ||
        Number(formData.leaseYears) < 1 ||
        Number(formData.leaseYears) > 99)
    ) {
      setError(
        "Lease duration must be between 1 and 99 years."
      );
      return;
    }

    if (
      formData.sqft &&
      Number(formData.sqft) <= 0
    ) {
      setError(
        "Property area must be greater than 0."
      );
      return;
    }

    if (Number(formData.regularPrice) < 50) {
      setError(
        "Regular price must be at least ₹50."
      );
      return;
    }

    // Exact map location is required
    if (
      formData.latitude === null ||
      formData.longitude === null
    ) {
      setError(
        "Please select the exact property location on the map."
      );
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,

        userRef: currentUser._id,

        bedrooms: Number(formData.bedrooms),

        bathrooms: Number(formData.bathrooms),

        sqft: formData.sqft
          ? Number(formData.sqft)
          : null,

        regularPrice: Number(
          formData.regularPrice
        ),

        latitude: Number(formData.latitude),

        longitude: Number(formData.longitude),

        leaseYears:
          formData.type === "lease"
            ? Number(formData.leaseYears)
            : null,

        // Convert amenities to backend fields
        basicAmenities: formData.amenities.basic,

        luxuryAmenities: formData.amenities.luxury,
      };

      // Remove frontend-only amenities object
      delete payload.amenities;

      const url = listingId
        ? `/api/listing/update/${listingId}/${currentUser._id}`
        : "/api/listing/create";

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(
          data.message ||
            (listingId
              ? "Could not update listing."
              : "Could not create listing.")
        );
      }

      navigate(
        `/listing/${data._id || listingId}`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Amenity component
  const AmenityGroup = ({
    title,
    group,
    items,
  }) => (
    <fieldset className="border border-slate-200 rounded-xl p-4">
      <legend className="px-2 font-semibold text-slate-800">
        {title}
      </legend>

      <div className="flex flex-wrap gap-3 mt-2">
        {items.map((amenity) => (
          <label
            key={amenity}
            className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer transition ${
              formData.amenities[group].includes(
                amenity
              )
                ? "border-green-600 bg-green-50 text-green-700"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <input
              type="checkbox"
              checked={formData.amenities[
                group
              ].includes(amenity)}
              onChange={() =>
                toggleAmenity(group, amenity)
              }
            />

            <span className="text-sm">
              {amenity}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <main className="bg-slate-50 min-h-screen py-6 px-3">
      <div className="max-w-5xl mx-auto">

        <h1 className="text-3xl font-bold text-center text-slate-800 mb-8">
          {listingId
            ? "Update Property"
            : "Create a Listing"}
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 md:p-7 flex flex-col gap-6"
        >

          {/* PROPERTY INFORMATION */}

          <section>
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Property Information
            </h2>

            <div className="grid md:grid-cols-2 gap-4">

              {/* Property Type */}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Property Type
                </label>

                <select
                  id="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  required
                  className="border border-slate-300 p-3 rounded-lg w-full"
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

              {/* Property Name */}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Property Name
                </label>

                <input
                  id="name"
                  required
                  minLength={3}
                  maxLength={100}
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter property name"
                  className="border border-slate-300 p-3 rounded-lg w-full"
                />
              </div>

              {/* Description */}

              <div className="md:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">
                  Description
                </label>

                <textarea
                  id="description"
                  required
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your property"
                  className="border border-slate-300 p-3 rounded-lg w-full"
                />
              </div>

              {/* Address */}

              <div className="md:col-span-2">
                <label className="block font-medium text-slate-700 mb-1">
                  Address / Location
                </label>

                <input
                  id="address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Property address"
                  className="border border-slate-300 p-3 rounded-lg w-full"
                />
              </div>

              {/* Phone */}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Contact Phone Number
                </label>

                <input
                  id="phoneNumber"
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Contact phone number"
                  className="border border-slate-300 p-3 rounded-lg w-full"
                />
              </div>

              {/* Katha */}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Katha Type
                </label>

                <select
                  id="katha"
                  value={formData.katha}
                  onChange={handleChange}
                  className="border border-slate-300 p-3 rounded-lg w-full"
                >
                  <option value="">
                    Select Katha Type
                  </option>

                  <option value="A Katha">
                    A Katha
                  </option>

                  <option value="B Katha">
                    B Katha
                  </option>

                  <option value="Others">
                    Others
                  </option>
                </select>
              </div>

            </div>
          </section>

          {/* EXACT PROPERTY LOCATION */}

          <section className="border border-slate-200 rounded-xl p-4">

            <h2 className="text-xl font-bold text-slate-800 mb-2">
              Exact Property Location
            </h2>

            <p className="text-sm text-slate-500 mb-4">
              Search for a location or click directly
              on the map to set the exact property
              location.
            </p>

            {/* Search */}

            <div className="flex flex-col sm:flex-row gap-2">

              <input
                type="text"
                value={locationSearch}
                onChange={(e) =>
                  setLocationSearch(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    searchLocation();
                  }
                }}
                placeholder="Search location, e.g. Whitefield, Bangalore"
                className="border border-slate-300 p-3 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />

              <button
                type="button"
                onClick={searchLocation}
                disabled={searchingLocation}
                className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg disabled:opacity-60"
              >
                {searchingLocation
                  ? "Searching..."
                  : "Search"}
              </button>

            </div>

            {/* Search Results */}

            {searchResults.length > 0 && (
              <div className="border border-slate-200 rounded-lg mt-2 overflow-hidden bg-white shadow-sm">

                {searchResults.map((location) => (
                  <button
                    key={location.place_id}
                    type="button"
                    onClick={() =>
                      selectLocation(location)
                    }
                    className="w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-blue-50 text-sm text-slate-700"
                  >
                    📍 {location.display_name}
                  </button>
                ))}

              </div>
            )}

            {/* Map */}

            <div className="mt-4 rounded-xl overflow-hidden border border-slate-300">

              <MapContainer
                center={mapPosition}
                zoom={5}
                style={{
                  height: "400px",
                  width: "100%",
                }}
              >

                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <ChangeMapView
                  position={mapPosition}
                />

                <LocationPicker
                  position={
                    formData.latitude !== null &&
                    formData.longitude !== null
                      ? [
                          formData.latitude,
                          formData.longitude,
                        ]
                      : null
                  }
                  onLocationSelect={
                    handleMapLocation
                  }
                />

              </MapContainer>

            </div>

            {/* Selected location */}

            {formData.latitude !== null &&
              formData.longitude !== null && (
                <div className="mt-3 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">

                  📍 Exact location selected

                  <br />

                  Latitude:{" "}
                  {Number(
                    formData.latitude
                  ).toFixed(6)}

                  <br />

                  Longitude:{" "}
                  {Number(
                    formData.longitude
                  ).toFixed(6)}

                </div>
              )}

          </section>

          {/* LISTING TYPE */}

          <section className="border-t pt-6">

            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Listing Type
            </h2>

            <div className="flex flex-wrap gap-4">

              {["sale", "rent", "lease"].map(
                (type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg border cursor-pointer capitalize ${
                      formData.type === type
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-300"
                    }`}
                  >

                    <input
                      id={type}
                      type="radio"
                      name="listingType"
                      checked={
                        formData.type === type
                      }
                      onChange={handleChange}
                    />

                    <span>{type}</span>

                  </label>
                )
              )}

            </div>

            {/* Lease Years */}

            {formData.type === "lease" && (
              <div className="mt-4 max-w-sm">

                <label className="block font-medium text-slate-700 mb-1">
                  Lease Duration (Years)
                </label>

                <input
                  id="leaseYears"
                  type="number"
                  min="1"
                  max="99"
                  required
                  value={formData.leaseYears}
                  onChange={handleChange}
                  className="border border-slate-300 p-3 rounded-lg w-full"
                />

              </div>
            )}

            {/* Negotiable */}

            <label className="flex items-center gap-2 mt-5">

              <input
                id="negotiable"
                type="checkbox"
                checked={formData.negotiable}
                onChange={handleChange}
              />

              <span className="text-slate-700">
                Price Negotiable
              </span>

            </label>

          </section>

          {/* PROPERTY DETAILS */}

          <section className="border-t pt-6">

            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Property Details
            </h2>

            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">

              {/* Bedrooms */}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Bedrooms
                </label>

                <input
                  id="bedrooms"
                  type="number"
                  min="1"
                  required
                  value={formData.bedrooms}
                  onChange={handleChange}
                  className="border border-slate-300 p-3 rounded-lg w-full"
                />
              </div>

              {/* Bathrooms */}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Bathrooms
                </label>

                <input
                  id="bathrooms"
                  type="number"
                  min="1"
                  required
                  value={formData.bathrooms}
                  onChange={handleChange}
                  className="border border-slate-300 p-3 rounded-lg w-full"
                />
              </div>

              {/* Area */}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Area (sq.ft)
                </label>

                <input
                  id="sqft"
                  type="number"
                  min="1"
                  value={formData.sqft}
                  onChange={handleChange}
                  placeholder="Example: 1200"
                  className="border border-slate-300 p-3 rounded-lg w-full"
                />
              </div>

              {/* Price */}

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Regular Price
                </label>

                <input
                  id="regularPrice"
                  type="number"
                  min="50"
                  required
                  value={formData.regularPrice}
                  onChange={handleChange}
                  className="border border-slate-300 p-3 rounded-lg w-full"
                />
              </div>

            </div>
          </section>

          {/* BASIC AMENITIES */}

          <AmenityGroup
            title="Basic Amenities"
            group="basic"
            items={BASIC_AMENITIES}
          />

          {/* LUXURY AMENITIES */}

          <AmenityGroup
            title="Luxury Amenities"
            group="luxury"
            items={LUXURY_AMENITIES}
          />

          {/* PROPERTY IMAGES */}

          <section className="border border-slate-200 rounded-xl p-4">

            <h2 className="font-bold text-lg text-slate-800 mb-3">
              Property Images
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) =>
                  setFiles(e.target.files)
                }
                className="border border-slate-300 p-3 rounded-lg flex-1"
              />

              <button
                type="button"
                onClick={uploadImages}
                disabled={uploading}
                className="bg-green-700 text-white px-5 py-3 rounded-lg disabled:opacity-60"
              >
                {uploading
                  ? "Uploading..."
                  : "Upload Images"}
              </button>

            </div>

            <div className="flex flex-wrap gap-3 mt-4">

              {formData.imageUrls.map(
                (url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="relative"
                  >

                    <img
                      src={url}
                      alt="Property"
                      className="h-24 w-24 object-cover rounded-lg"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        removeImage(index)
                      }
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6"
                    >
                      ×
                    </button>

                  </div>
                )
              )}

            </div>

          </section>

          {/* ERROR */}

          {error && (
            <p className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">
              {error}
            </p>
          )}

          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading || uploading}
            className="bg-blue-700 text-white p-4 rounded-lg font-semibold uppercase hover:bg-blue-800 disabled:opacity-60"
          >
            {loading
              ? listingId
                ? "Updating..."
                : "Creating..."
              : listingId
              ? "Update Listing"
              : "Create Listing"}
          </button>

        </form>
      </div>
    </main>
  );
};

export default CreateListing;