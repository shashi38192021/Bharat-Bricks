import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { MdLocationOn } from "react-icons/md";
import { FaBath, FaBed } from "react-icons/fa";
import { formatPrice, propertyTitle } from "../utils/listing";

const ListingItem = ({ listing }) => {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const handleListingClick = () => {
    if (!currentUser) {
      navigate("/sign-up");
      return;
    }

    navigate(`/listing/${listing._id}`);
  };

  return (
    <div className="bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-lg w-full sm:w-[330px]">
      <div
        onClick={handleListingClick}
        className="cursor-pointer"
      >
        <img
          src={
            listing.imageUrls?.[0] ||
            "https://53.fs1.hubspotusercontent-na1.net/hub/53/hubfs/Sales_Blog/real-estate-business-compressor.jpg?width=595&height=400&name=real-estate-business-compressor.jpg"
          }
          alt="Listing cover"
          className="h-[320px] sm:h-[220px] w-full object-cover hover:scale-105 transition-transform duration-300"
        />

        <div className="p-3 flex flex-col gap-2">
          <p className="truncate text-lg font-semibold text-slate-700">
            {propertyTitle(listing)}
          </p>

          <div className="flex items-center gap-1">
            <MdLocationOn className="h-4 w-4 text-green-700" />
            <p className="text-sm text-gray-600 truncate">
              {listing.address || "Location not specified"}
            </p>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2">
            {listing.description}
          </p>

          <div className="mt-2">
            <p className="text-lg font-semibold text-slate-700">
              {formatPrice(listing)}
            </p>

            <span
              className={`inline-flex mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                listing.negotiable === true
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {listing.negotiable === true
                ? "Negotiable"
                : "Non-negotiable"}
            </span>
          </div>

          <div className="text-slate-700 flex gap-4">
            <span className="flex items-center gap-1 font-bold text-xs">
              <FaBed className="h-4 w-4 text-green-700" />
              {listing.bedrooms || 0} BHK
            </span>

            <span className="flex items-center gap-1 font-bold text-xs">
              <FaBath className="h-4 w-4 text-green-700" />
              {listing.bathrooms || 0} bath
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingItem;