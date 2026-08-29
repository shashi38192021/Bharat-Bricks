import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import SwiperCore from "swiper";
import { Navigation } from "swiper/modules";
import "swiper/css/bundle";

import {
  FaShare,
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaStar,
  FaRegStar,
  FaPhone,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaHeart,
  FaRegHeart,
  FaBookmark,
  FaRegBookmark,
  FaCalendarCheck,
  FaCheckCircle,
} from "react-icons/fa";

import { useSelector } from "react-redux";
import { formatPrice, propertyTitle } from "../utils/listing";

const Listing = () => {
  SwiperCore.use([Navigation]);

  const { listingId } = useParams();

  const { currentUser } = useSelector((state) => state.user);

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareMenuRef = useRef(null);

  const [reviews, setReviews] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);

  const [activity, setActivity] = useState({
    liked: false,
    saved: false,
    wantedToVisit: false,
    visited: false,
    finalized: false,
  });

  const [activityCounts, setActivityCounts] = useState({
    likes: 0,
    saves: 0,
    wantedToVisit: 0,
    visited: 0,
    finalized: 0,
  });

  const [activityLoading, setActivityLoading] = useState(false);

  /*
   * =========================================================
   * FETCH PROPERTY
   * =========================================================
   */

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(false);

        const res = await fetch(`/api/listing/get/${listingId}`);
        const data = await res.json();

        if (!res.ok || data.success === false) {
          setError(true);
          setLoading(false);
          return;
        }

        setListing(data);

        setReviews(data.reviews || []);

        /*
         * Activity information returned by backend
         *
         * Expected:
         * data.userActivity
         * data.activityCounts
         */

        if (data.userActivity) {
          setActivity({
            liked: !!data.userActivity.liked,
            saved: !!data.userActivity.saved,
            wantedToVisit: !!data.userActivity.wantedToVisit,
            visited: !!data.userActivity.visited,
            finalized: !!data.userActivity.finalized,
          });
        }

        if (data.activityCounts) {
          setActivityCounts({
            likes: data.activityCounts.likes || 0,
            saves: data.activityCounts.saves || 0,
            wantedToVisit: data.activityCounts.wantedToVisit || 0,
            visited: data.activityCounts.visited || 0,
            finalized: data.activityCounts.finalized || 0,
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching listing:", err);
        setError(true);
        setLoading(false);
      }
    };

    fetchListing();
  }, [listingId]);

  /*
   * =========================================================
   * SHARE MENU
   * =========================================================
   */

  const handleOutsideClick = (event) => {
    if (
      shareMenuRef.current &&
      !shareMenuRef.current.contains(event.target)
    ) {
      setShowShareMenu(false);
    }
  };

  useEffect(() => {
    if (showShareMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showShareMenu]);

  /*
   * =========================================================
   * PROPERTY ACTIVITY
   * =========================================================
   */

  const handleActivity = async (activityName) => {
    if (!currentUser) {
      alert("Please sign in to continue.");
      return;
    }

    if (!listing) return;

    try {
      setActivityLoading(true);

      const res = await fetch(
        `/api/listing/activity/${listing._id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            activity: activityName,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(
          data.message || "Could not update activity."
        );
      }

      /*
       * Update selected activity
       */

      if (activityName === "like") {
        setActivity((prev) => ({
          ...prev,
          liked: data.active,
        }));
      }

      if (activityName === "save") {
        setActivity((prev) => ({
          ...prev,
          saved: data.active,
        }));
      }

      if (activityName === "wantedToVisit") {
        setActivity((prev) => ({
          ...prev,
          wantedToVisit: data.active,
        }));
      }

      if (activityName === "visited") {
        setActivity((prev) => ({
          ...prev,
          visited: data.active,
        }));
      }

      if (activityName === "finalized") {
        setActivity((prev) => ({
          ...prev,
          finalized: data.active,
        }));
      }

      /*
       * Update activity counts
       */

      if (data.counts) {
        setActivityCounts({
          likes: data.counts.likes || 0,
          saves: data.counts.saves || 0,
          wantedToVisit: data.counts.wantedToVisit || 0,
          visited: data.counts.visited || 0,
          finalized: data.counts.finalized || 0,
        });
      }
    } catch (err) {
      console.error("Activity error:", err);
      alert(err.message);
    } finally {
      setActivityLoading(false);
    }
  };

  /*
   * =========================================================
   * REVIEWS
   * =========================================================
   */

  const renderStars = (selectedRating, onClick = null) => {
    return [...Array(5)].map((_, index) => (
      <span
        key={index}
        onClick={() =>
          onClick && onClick(index + 1)
        }
        className={onClick ? "cursor-pointer" : ""}
      >
        {index < selectedRating ? (
          <FaStar className="text-yellow-500" />
        ) : (
          <FaRegStar className="text-gray-400" />
        )}
      </span>
    ));
  };

  const handleReviewSubmit = () => {
    if (!currentUser) {
      alert("Please sign in to submit a review.");
      return;
    }

    if (!reviewText.trim()) {
      return;
    }

    const newReview = {
      user: {
        name: currentUser.username,
      },
      rating,
      review: reviewText,
    };

    setReviews((prev) => [...prev, newReview]);

    setReviewText("");
    setRating(5);

    alert("Review submitted!");
  };

  /*
   * =========================================================
   * SOCIAL SHARING
   * =========================================================
   */

  const shareUrl = encodeURIComponent(
    window.location.href
  );

  const shareText = encodeURIComponent(
    `Check out this property: ${
      listing?.name || "Property"
    }`
  );

  const socialLinks = [
    {
      id: "facebook",
      icon: <FaFacebook className="text-blue-600" />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
    {
      id: "twitter",
      icon: <FaTwitter className="text-blue-400" />,
      url: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareText}`,
    },
    {
      id: "whatsapp",
      icon: <FaWhatsapp className="text-green-500" />,
      url: `https://api.whatsapp.com/send?text=${shareText}%20${shareUrl}`,
    },
  ];

  /*
   * =========================================================
   * LOADING / ERROR
   * =========================================================
   */

  if (loading) {
    return (
      <main className="bg-gray-50 min-h-screen">
        <p className="text-center py-10 text-2xl text-gray-700">
          Loading...
        </p>
      </main>
    );
  }

  if (error || !listing) {
    return (
      <main className="bg-gray-50 min-h-screen">
        <p className="text-center py-10 text-2xl text-red-600">
          Something went wrong!
        </p>
      </main>
    );
  }

  /*
   * =========================================================
   * PROPERTY DETAILS
   * =========================================================
   */

  return (
    <main className="bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">

        {/* =====================================================
            PROPERTY HEADER
        ===================================================== */}

        <div className="bg-white shadow-lg rounded-lg p-5 mb-6">

          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {propertyTitle(listing)}
          </h1>

          <p className="flex items-center text-gray-700 mt-3">
            <FaMapMarkerAlt className="text-red-500 mr-2" />

            {listing.address || "Location not specified"}
          </p>

          <div className="mt-4">
            <p className="text-2xl font-bold text-blue-700">
              {formatPrice(listing)}
            </p>

            <span
              className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold ${
                listing.negotiable
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {listing.negotiable
                ? "Negotiable"
                : "Non-negotiable"}
            </span>
          </div>
        </div>

        {/* =====================================================
            IMAGE SLIDER
        ===================================================== */}

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">

          <Swiper navigation>
            {(listing.imageUrls || []).map(
              (url, index) => (
                <SwiperSlide key={index}>
                  <div
                    className="h-[300px] sm:h-[500px] bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${url})`,
                    }}
                  />
                </SwiperSlide>
              )
            )}
          </Swiper>

        </div>

        {/* =====================================================
            SHARE BUTTON
        ===================================================== */}

        <div className="fixed top-[13%] right-[3%] z-20">

          <button
            type="button"
            className="border rounded-full w-12 h-12 flex justify-center items-center bg-gradient-to-r from-blue-500 to-teal-400 shadow-lg"
            onClick={() =>
              setShowShareMenu((prev) => !prev)
            }
          >
            <FaShare className="text-white" />
          </button>

          {showShareMenu && (
            <div
              ref={shareMenuRef}
              className="absolute top-14 right-0 bg-white shadow-lg rounded-lg p-2 w-40 flex flex-col gap-2"
            >
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-md"
                >
                  {social.icon}

                  <span className="text-gray-700 capitalize">
                    {social.id}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* =====================================================
            PROPERTY ACTIVITY
        ===================================================== */}

        <div className="mt-6 bg-white shadow-lg rounded-lg p-5 border border-gray-200">

          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Property Activity
          </h2>

          <div className="flex flex-wrap gap-3">

            {/* LIKE */}

            <button
              type="button"
              disabled={activityLoading}
              onClick={() =>
                handleActivity("like")
              }
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition ${
                activity.liked
                  ? "bg-red-50 border-red-500 text-red-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-red-50"
              }`}
            >
              {activity.liked ? (
                <FaHeart />
              ) : (
                <FaRegHeart />
              )}

              <span>Like</span>

              <span>
                ({activityCounts.likes})
              </span>
            </button>

            {/* SAVE */}

            <button
              type="button"
              disabled={activityLoading}
              onClick={() =>
                handleActivity("save")
              }
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition ${
                activity.saved
                  ? "bg-blue-50 border-blue-500 text-blue-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-blue-50"
              }`}
            >
              {activity.saved ? (
                <FaBookmark />
              ) : (
                <FaRegBookmark />
              )}

              <span>Save</span>

              <span>
                ({activityCounts.saves})
              </span>
            </button>

            {/* WANTED TO VISIT */}

            <button
              type="button"
              disabled={activityLoading}
              onClick={() =>
                handleActivity("wantedToVisit")
              }
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition ${
                activity.wantedToVisit
                  ? "bg-yellow-50 border-yellow-500 text-yellow-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-yellow-50"
              }`}
            >
              <FaCalendarCheck />

              <span>Wanted to Visit</span>

              <span>
                ({activityCounts.wantedToVisit})
              </span>
            </button>

            {/* VISITED */}

            <button
              type="button"
              disabled={activityLoading}
              onClick={() =>
                handleActivity("visited")
              }
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition ${
                activity.visited
                  ? "bg-green-50 border-green-500 text-green-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-green-50"
              }`}
            >
              <FaCheckCircle />

              <span>Visited</span>

              <span>
                ({activityCounts.visited})
              </span>
            </button>

            {/* FINALIZED */}

            <button
              type="button"
              disabled={activityLoading}
              onClick={() =>
                handleActivity("finalized")
              }
              className={`flex items-center gap-2 px-4 py-3 rounded-lg border transition ${
                activity.finalized
                  ? "bg-purple-50 border-purple-500 text-purple-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-purple-50"
              }`}
            >
              <FaStar />

              <span>
                Selected for Finalize
              </span>

              <span>
                ({activityCounts.finalized})
              </span>
            </button>

          </div>

          {!currentUser && (
            <p className="text-sm text-gray-500 mt-4">
              Sign in to like, save, visit, or finalize
              this property.
            </p>
          )}
        </div>

        {/* =====================================================
            PROPERTY BASIC DETAILS
        ===================================================== */}

        <div className="mt-6 bg-white shadow-lg rounded-lg p-5 border border-gray-200">

          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Property Details
          </h2>

          <div className="flex flex-wrap gap-3">

            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-4 py-3">
              <FaBed className="text-blue-600" />

              <span className="font-medium">
                {listing.bedrooms || 0} Beds
              </span>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 border rounded-lg px-4 py-3">
              <FaBath className="text-green-600" />

              <span className="font-medium">
                {listing.bathrooms || 0} Baths
              </span>
            </div>

            {listing.sqft && (
              <div className="bg-gray-50 border rounded-lg px-4 py-3">
                <span className="font-medium">
                  {listing.sqft} Sqft
                </span>
              </div>
            )}

            {listing.propertyType && (
              <div className="bg-gray-50 border rounded-lg px-4 py-3">
                <span className="font-medium">
                  {listing.propertyType}
                </span>
              </div>
            )}

            {listing.katha && (
              <div className="bg-gray-50 border rounded-lg px-4 py-3">
                <span className="font-medium">
                  {listing.katha}
                </span>
              </div>
            )}

            {listing.type && (
              <div className="bg-gray-50 border rounded-lg px-4 py-3 capitalize">
                <span className="font-medium">
                  {listing.type}
                </span>
              </div>
            )}

            {listing.type === "lease" &&
              listing.leaseYears && (
                <div className="bg-gray-50 border rounded-lg px-4 py-3">
                  <span className="font-medium">
                    {listing.leaseYears} Years Lease
                  </span>
                </div>
              )}

          </div>
        </div>

        {/* =====================================================
            AMENITIES
        ===================================================== */}

        {(listing.amenities?.basic?.length > 0 ||
          listing.amenities?.luxury?.length > 0) && (
          <div className="mt-6 bg-white shadow-lg rounded-lg p-5 border border-gray-200">

            <h2 className="text-2xl font-bold text-gray-900 mb-5">
              Amenities
            </h2>

            <div className="flex flex-wrap gap-3">

              {listing.amenities?.basic?.map(
                (amenity) => (
                  <span
                    key={amenity}
                    className="bg-gray-50 border rounded-lg px-4 py-2 text-sm"
                  >
                    ✓ {amenity}
                  </span>
                )
              )}

              {listing.amenities?.luxury?.map(
                (amenity) => (
                  <span
                    key={amenity}
                    className="bg-gray-50 border rounded-lg px-4 py-2 text-sm"
                  >
                    ✓ {amenity}
                  </span>
                )
              )}

            </div>
          </div>
        )}

        {/* =====================================================
            DESCRIPTION
        ===================================================== */}

        <div className="mt-6 bg-white shadow-lg rounded-lg p-6 border border-gray-200">

          <h2 className="text-xl font-bold text-gray-900 mb-3 border-b pb-3">
            Property Description
          </h2>

          <p className="text-gray-700 leading-relaxed">
            {listing.description}
          </p>

        </div>

        {/* =====================================================
            LOCATION / MAP
        ===================================================== */}

        {listing.address && (
          <div className="mt-6 bg-white shadow-lg rounded-lg p-5">

            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <FaMapMarkerAlt className="text-green-700 mr-2" />

              Property Location
            </h2>

            <div className="overflow-hidden rounded-lg">

              <iframe
                title="Property Location"
                className="w-full h-64 border rounded-lg"
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  listing.address
                )}&output=embed`}
                allowFullScreen
                loading="lazy"
              />

            </div>

            <a
              href={`https://www.google.com/maps?q=${encodeURIComponent(
                listing.address
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-blue-600 font-medium hover:underline"
            >
              View on Google Maps
            </a>

          </div>
        )}

        {/* =====================================================
            CONTACT OWNER
        ===================================================== */}

        <div className="mt-6 bg-white shadow-lg rounded-lg p-5">

          <h2 className="text-xl font-bold text-gray-900 mb-3">
            Contact Owner
          </h2>

          {listing.phoneNumber ? (
            <button
              type="button"
              onClick={() =>
                (window.location.href = `tel:${listing.phoneNumber}`)
              }
              className="bg-green-600 text-white px-5 py-3 rounded-lg flex items-center gap-2 hover:bg-green-700"
            >
              <FaPhone />

              Call {listing.phoneNumber}
            </button>
          ) : (
            <p className="text-gray-500">
              Owner contact details not available.
            </p>
          )}

        </div>

        {/* =====================================================
            REVIEWS
        ===================================================== */}

        <div className="mt-6 mb-10 bg-white shadow-lg rounded-lg p-5">

          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Reviews
          </h2>

          {reviews.length > 0 ? (
            <div className="flex flex-col">

              {reviews.map((review, index) => (
                <div
                  key={index}
                  className="border-b border-gray-200 py-4"
                >

                  <p className="font-semibold text-gray-800">
                    {review.user?.name ||
                      review.user?.username ||
                      "User"}
                  </p>

                  <div className="flex mt-1">
                    {renderStars(
                      review.rating || 0
                    )}
                  </div>

                  <p className="text-gray-700 mt-2">
                    {review.review}
                  </p>

                </div>
              ))}

            </div>
          ) : (
            <p className="text-gray-500">
              No reviews yet. Be the first to review!
            </p>
          )}

          {/* WRITE REVIEW */}

          {currentUser && (
            <div className="mt-6">

              <h3 className="font-semibold text-lg mb-2">
                Leave a Review
              </h3>

              <div className="flex mb-2">
                {renderStars(
                  rating,
                  setRating
                )}
              </div>

              <textarea
                rows="4"
                className="w-full border rounded-lg p-3"
                placeholder="Write your review..."
                value={reviewText}
                onChange={(event) =>
                  setReviewText(event.target.value)
                }
              />

              <button
                type="button"
                onClick={handleReviewSubmit}
                className="mt-3 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
              >
                Submit Review
              </button>

            </div>
          )}

        </div>

      </div>
    </main>
  );
};

export default Listing;