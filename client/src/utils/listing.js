export const BASIC_AMENITIES = [ "Furnished", "Semi-Furnished","Un-furnished","Parking", "Power Backup", "Water Supply", "Security", "Lift", "CCTV", "Wi-Fi", "Balcony", "Garden", "Gated Community", ];
export const LUXURY_AMENITIES = ["Swimming Pool", "Gym", "Club House", "Home Theater", "Indoor Games", "Outdoor Games", "Jacuzzi", "Sauna", "Private Terrace", "Smart Home", "Servant Room"];

export const formatPrice = (listing) => {
  const price = `₹${Number(listing.regularPrice || 0).toLocaleString("en-IN")}`;
  if (listing.type === "rent") return `${price} / month`;
  const years = Number(listing.leaseYears);
  if (listing.type === "lease" && Number.isInteger(years) && years >= 1) return `${price} for ${years} ${years === 1 ? "year" : "years"}`;
  return price;
};

export const propertyTitle = (listing) => {
  const type = listing.type ? listing.type[0].toUpperCase() + listing.type.slice(1) : "Sale";
  const propertyType = ["Apartment", "Independent House", "Commercial Property", "Plot"].includes(listing.propertyType) ? listing.propertyType : "Property";
  const bedrooms = Number(listing.bedrooms);
  const bedroomPrefix = ["Apartment", "Independent House"].includes(propertyType) && Number.isFinite(bedrooms) && bedrooms > 0 ? `${bedrooms} BHK ` : "";
  const location = listing.address?.split(",")[0]?.trim() || listing.address?.trim();
  const area = Number(listing.sqft) > 0 ? ` — ${listing.sqft} sqft` : "";
  return `${bedroomPrefix}${propertyType} for ${type}${location ? ` in ${location}` : ""}${area}`;
};
