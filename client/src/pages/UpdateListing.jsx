import React, { useEffect, useState } from "react";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import { app } from "../firebase";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

const UpdateListing = () => {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const params = useParams();

  const [files, setFiles] = useState([]);

  const [formData, setFormData] = useState({
    imageUrls: [],
    name: "",
    description: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phoneNumber: "",

    type: "rent",

    propertyType: "Apartment",

    regularPrice: "",
    negotiable: false,

    leaseYears: "",

    sqft: "",

    bedrooms: 1,
    bathrooms: 1,

    basicAmenities: [],
    luxuryAmenities: [],
  });

  const [imageUploadError, setImageUploadError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  /*
   * =========================================================
   * AMENITIES
   * =========================================================
   */

  const basicAmenityOptions = [
    "Parking",
    "Power Backup",
    "Water Supply",
    "Lift",
    "Security",
    "CCTV",
    "Garden",
    "Gym",
    "Swimming Pool",
  ];

  const luxuryAmenityOptions = [
    "Club House",
    "Private Pool",
    "Home Theatre",
    "Modular Kitchen",
    "Smart Home",
    "Air Conditioning",
    "Intercom",
    "Play Area",
    "Jogging Track",
  ];

  /*
   * =========================================================
   * FETCH LISTING
   * =========================================================
   */

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const listingId = params.listingId;

        const res = await fetch(`/api/listing/get/${listingId}`);
        const data = await res.json();

        if (!res.ok || data.success === false) {
          setError(data.message || "Failed to load listing.");
          return;
        }

        setFormData({
          imageUrls: data.imageUrls || [],
          name: data.name || "",
          description: data.description || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          pincode: data.pincode || "",
          phoneNumber: data.phoneNumber || "",

          type: data.type || "rent",

          propertyType:
            data.propertyType || "Apartment",

          regularPrice:
            data.regularPrice ?? "",

          negotiable:
            data.negotiable || false,

          leaseYears:
            data.leaseYears ?? "",

          sqft:
            data.sqft ?? "",

          bedrooms:
            data.bedrooms ?? 1,

          bathrooms:
            data.bathrooms ?? 1,

          basicAmenities:
            data.basicAmenities ||
            data.amenities?.basic ||
            [],

          luxuryAmenities:
            data.luxuryAmenities ||
            data.amenities?.luxury ||
            [],
        });
      } catch (err) {
        console.error("Error fetching listing:", err);
        setError("Failed to load listing.");
      }
    };

    fetchListing();
  }, [params.listingId]);

  /*
   * =========================================================
   * HANDLE CHANGE
   * =========================================================
   */

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;

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

  /*
   * =========================================================
   * PROPERTY TYPE
   * =========================================================
   */

  const handleTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      type,
      leaseYears: type === "lease" ? prev.leaseYears : "",
    }));
  };

  /*
   * =========================================================
   * AMENITIES
   * =========================================================
   */

  const handleAmenityChange = (amenity, category) => {
    setFormData((prev) => {
      const currentAmenities =
        category === "basic"
          ? prev.basicAmenities
          : prev.luxuryAmenities;

      const exists = currentAmenities.includes(amenity);

      const updatedAmenities = exists
        ? currentAmenities.filter((item) => item !== amenity)
        : [...currentAmenities, amenity];

      return {
        ...prev,
        [category === "basic"
          ? "basicAmenities"
          : "luxuryAmenities"]: updatedAmenities,
      };
    });
  };

  /*
   * =========================================================
   * IMAGE UPLOAD
   * =========================================================
   */

  const handleImageSubmit = (e) => {
    e.preventDefault();

    if (!files || files.length === 0) {
      setImageUploadError("Please select images first.");
      return;
    }

    if (
      files.length + formData.imageUrls.length >
      6
    ) {
      setImageUploadError(
        "You can only have a maximum of 6 images per listing."
      );
      return;
    }

    setUploading(true);
    setImageUploadError(false);

    const promises = [];

    for (let i = 0; i < files.length; i++) {
      promises.push(storeImage(files[i]));
    }

    Promise.all(promises)
      .then((urls) => {
        setFormData((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, ...urls],
        }));

        setFiles([]);
        setImageUploadError(false);
        setUploading(false);
      })
      .catch((err) => {
        console.error(
          "Image upload failed:",
          err
        );

        setImageUploadError(
          err.message || "Image upload failed."
        );

        setUploading(false);
      });
  };

  const storeImage = async (file) => {
    return new Promise((resolve, reject) => {
      const storage = getStorage(app);

      const fileName =
        new Date().getTime() + "-" + file.name;

      const storageRef = ref(
        storage,
        fileName
      );

      const uploadTask =
        uploadBytesResumable(
          storageRef,
          file
        );

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred /
              snapshot.totalBytes) *
            100;

          console.log(
            `Upload is ${progress}% done!`
          );
        },

        (error) => {
          reject(error);
        },

        async () => {
          try {
            const downloadURL =
              await getDownloadURL(
                uploadTask.snapshot.ref
              );

            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  /*
   * =========================================================
   * REMOVE IMAGE
   * =========================================================
   */

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter(
        (_, i) => i !== index
      ),
    }));
  };

  /*
   * =========================================================
   * SUBMIT
   * =========================================================
   */

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError(false);

      /*
       * Image validation
       */

      if (formData.imageUrls.length < 1) {
        setError(
          "You must upload at least one image!"
        );
        return;
      }

      /*
       * Phone validation
       */

      if (!formData.phoneNumber.trim()) {
        setError(
          "Phone number is required!"
        );
        return;
      }

      /*
       * Price validation
       */

      if (
        formData.regularPrice === "" ||
        Number(formData.regularPrice) < 0
      ) {
        setError(
          "Please enter a valid property price."
        );
        return;
      }

      /*
       * Lease validation
       */

      if (
        formData.type === "lease" &&
        (!formData.leaseYears ||
          Number(formData.leaseYears) < 1 ||
          Number(formData.leaseYears) > 99)
      ) {
        setError(
          "Lease duration must be between 1 and 99 years."
        );
        return;
      }

      setLoading(true);

      /*
       * Create clean data.
       *
       * IMPORTANT:
       * Old fields such as:
       * offer
       * discountPrice
       * furnished
       * parking
       * katha
       * bachelor
       *
       * are NOT sent.
       */

      const updatedData = {
        name: formData.name.trim(),

        description:
          formData.description.trim(),

        address:
          formData.address.trim(),

        city:
          formData.city.trim(),

        state:
          formData.state.trim(),

        pincode:
          formData.pincode.trim(),

        phoneNumber:
          formData.phoneNumber.trim(),

        type: formData.type,

        propertyType:
          formData.propertyType,

        regularPrice:
          Number(formData.regularPrice),

        negotiable:
          Boolean(formData.negotiable),

        leaseYears:
          formData.type === "lease"
            ? Number(formData.leaseYears)
            : null,

        sqft:
          formData.sqft === ""
            ? null
            : Number(formData.sqft),

        bedrooms:
          Number(formData.bedrooms),

        bathrooms:
          Number(formData.bathrooms),

        basicAmenities:
          formData.basicAmenities,

        luxuryAmenities:
          formData.luxuryAmenities,

        imageUrls:
          formData.imageUrls,

        userRef:
          currentUser._id,
      };

      console.log(
        "Submitting updated listing:",
        updatedData
      );

      const res = await fetch(
        `/api/listing/update/${params.listingId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            updatedData
          ),
        }
      );

      const data = await res.json();

      setLoading(false);

      console.log(
        "Update response:",
        data
      );

      if (
        !res.ok ||
        data.success === false
      ) {
        setError(
          data.message ||
            "Failed to update listing."
        );
        return;
      }

      navigate(
        `/listing/${data._id}`
      );
    } catch (err) {
      console.error(
        "Error updating listing:",
        err
      );

      setError(
        err.message ||
          "Something went wrong."
      );

      setLoading(false);
    }
  };

  /*
   * =========================================================
   * UI
   * =========================================================
   */

  return (
    <main className="p-3 max-w-5xl mx-auto">
      <h1 className="text-3xl font-semibold text-center my-7">
        Update Listing
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-6"
      >
        {/* ===================================================
            BASIC INFORMATION
        =================================================== */}

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Property Information
          </h2>

          <div className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Property Name"
              className="border p-3 rounded-lg"
              id="name"
              maxLength="62"
              minLength="10"
              required
              onChange={handleChange}
              value={formData.name}
            />

            <textarea
              placeholder="Property Description"
              className="border p-3 rounded-lg min-h-32"
              id="description"
              required
              onChange={handleChange}
              value={formData.description}
            />

            <input
              type="text"
              placeholder="Property Address"
              className="border p-3 rounded-lg"
              id="address"
              required
              onChange={handleChange}
              value={formData.address}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="City"
                className="border p-3 rounded-lg"
                id="city"
                onChange={handleChange}
                value={formData.city}
              />

              <input
                type="text"
                placeholder="State"
                className="border p-3 rounded-lg"
                id="state"
                onChange={handleChange}
                value={formData.state}
              />

              <input
                type="text"
                placeholder="Pincode"
                className="border p-3 rounded-lg"
                id="pincode"
                onChange={handleChange}
                value={formData.pincode}
              />
            </div>

            <input
              type="tel"
              placeholder="Enter phone number"
              className="border p-3 rounded-lg"
              id="phoneNumber"
              required
              onChange={handleChange}
              value={formData.phoneNumber}
            />
          </div>
        </div>

        {/* ===================================================
            SALE / RENT / LEASE
        =================================================== */}

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Listing Type
          </h2>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                handleTypeChange("sale")
              }
              className={`px-6 py-3 rounded-lg border font-medium ${
                formData.type === "sale"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Sale
            </button>

            <button
              type="button"
              onClick={() =>
                handleTypeChange("rent")
              }
              className={`px-6 py-3 rounded-lg border font-medium ${
                formData.type === "rent"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Rent
            </button>

            <button
              type="button"
              onClick={() =>
                handleTypeChange("lease")
              }
              className={`px-6 py-3 rounded-lg border font-medium ${
                formData.type === "lease"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300"
              }`}
            >
              Lease
            </button>
          </div>
        </div>

        {/* ===================================================
            PROPERTY TYPE
        =================================================== */}

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Property Type
          </h2>

          <select
            id="propertyType"
            value={formData.propertyType}
            onChange={handleChange}
            className="border p-3 rounded-lg w-full"
            required
          >
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

        {/* ===================================================
            PRICE
        =================================================== */}

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Price
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium mb-1">
                Property Price
              </label>

              <input
                type="number"
                id="regularPrice"
                min="0"
                required
                className="p-3 border rounded-lg w-full"
                onChange={handleChange}
                value={formData.regularPrice}
              />
            </div>

            <label className="flex items-center gap-2 mt-4 sm:mt-6">
              <input
                type="checkbox"
                id="negotiable"
                className="w-5 h-5"
                onChange={handleChange}
                checked={
                  formData.negotiable
                }
              />

              <span className="font-medium">
                Negotiable
              </span>
            </label>
          </div>

          {formData.type === "lease" && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Lease Duration (Years)
              </label>

              <input
                type="number"
                id="leaseYears"
                min="1"
                max="99"
                required
                placeholder="Example: 5"
                className="p-3 border rounded-lg w-full"
                onChange={handleChange}
                value={
                  formData.leaseYears
                }
              />

              <p className="text-sm text-gray-500 mt-1">
                Enter the lease duration in
                years.
              </p>
            </div>
          )}
        </div>

        {/* ===================================================
            PROPERTY DETAILS
        =================================================== */}

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Property Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Bedrooms
              </label>

              <input
                type="number"
                id="bedrooms"
                min="0"
                max="50"
                required
                className="p-3 border rounded-lg w-full"
                onChange={handleChange}
                value={
                  formData.bedrooms
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Bathrooms
              </label>

              <input
                type="number"
                id="bathrooms"
                min="0"
                max="50"
                required
                className="p-3 border rounded-lg w-full"
                onChange={handleChange}
                value={
                  formData.bathrooms
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Area (Sqft)
              </label>

              <input
                type="number"
                id="sqft"
                min="0"
                placeholder="Example: 1200"
                className="p-3 border rounded-lg w-full"
                onChange={handleChange}
                value={formData.sqft}
              />
            </div>
          </div>
        </div>

        {/* ===================================================
            BASIC AMENITIES
        =================================================== */}

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Basic Amenities
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {basicAmenityOptions.map(
              (amenity) => (
                <label
                  key={amenity}
                  className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.basicAmenities.includes(
                      amenity
                    )}
                    onChange={() =>
                      handleAmenityChange(
                        amenity,
                        "basic"
                      )
                    }
                    className="w-5 h-5"
                  />

                  <span>
                    {amenity}
                  </span>
                </label>
              )
            )}
          </div>
        </div>

        {/* ===================================================
            LUXURY AMENITIES
        =================================================== */}

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Luxury Amenities
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {luxuryAmenityOptions.map(
              (amenity) => (
                <label
                  key={amenity}
                  className="flex items-center gap-2 border rounded-lg p-3 cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={formData.luxuryAmenities.includes(
                      amenity
                    )}
                    onChange={() =>
                      handleAmenityChange(
                        amenity,
                        "luxury"
                      )
                    }
                    className="w-5 h-5"
                  />

                  <span>
                    {amenity}
                  </span>
                </label>
              )
            )}
          </div>
        </div>

        {/* ===================================================
            IMAGES
        =================================================== */}

        <div className="bg-white border rounded-xl p-5 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">
            Property Images
          </h2>

          <p className="text-gray-600 text-sm mb-4">
            The first image will be the cover
            image. Maximum 6 images.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              onChange={(e) =>
                setFiles(e.target.files)
              }
              className="p-3 border border-gray-300 rounded-lg w-full"
              type="file"
              id="images"
              accept="image/*"
              multiple
            />

            <button
              onClick={handleImageSubmit}
              disabled={uploading}
              type="button"
              className="p-3 px-6 text-green-700 border border-green-700 rounded-lg uppercase hover:shadow-lg disabled:opacity-80"
            >
              {uploading
                ? "Uploading..."
                : "Upload"}
            </button>
          </div>

          {imageUploadError && (
            <p className="text-red-700 text-sm mt-2">
              {imageUploadError}
            </p>
          )}

          {formData.imageUrls.length >
            0 && (
            <div className="mt-5 flex flex-col gap-3">
              {formData.imageUrls.map(
                (url, index) => (
                  <div
                    key={`${url}-${index}`}
                    className="flex justify-between items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={url}
                        alt={`Listing ${
                          index + 1
                        }`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />

                      <span className="text-sm text-gray-600">
                        {index === 0
                          ? "Cover Image"
                          : `Image ${
                              index + 1
                            }`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveImage(
                          index
                        )
                      }
                      className="bg-red-700 px-3 py-2 text-white rounded-lg uppercase hover:opacity-75"
                    >
                      Delete
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            {error}
          </div>
        )}

        {/* ===================================================
            UPDATE BUTTON
        =================================================== */}

        <button
          disabled={
            loading || uploading
          }
          type="submit"
          className="p-4 bg-blue-700 text-white rounded-lg uppercase font-semibold hover:bg-blue-800 disabled:opacity-80"
        >
          {loading
            ? "Updating..."
            : "Update Listing"}
        </button>
      </form>
    </main>
  );
};

export default UpdateListing;