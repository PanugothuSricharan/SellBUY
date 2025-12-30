// Location enum for campus marketplace
// "Entire Campus" is used for browsing all locations (no filter applied)
// Specific hostels enforce strict location-based filtering

export const LOCATIONS = {
  ENTIRE_CAMPUS: "Entire Campus",
  BH1: "BH-1",
  BH2: "BH-2",
  BH3: "BH-3",
  GH: "GH",
  IVH: "IVH",
  SATPURA: "Satpura",
};

// Array of valid product locations (excludes "Entire Campus" - that's for browsing only)
export const PRODUCT_LOCATIONS = [
  LOCATIONS.BH1,
  LOCATIONS.BH2,
  LOCATIONS.BH3,
  LOCATIONS.GH,
  LOCATIONS.IVH,
  LOCATIONS.SATPURA,
];

// All locations including "Entire Campus" for the browse dropdown
export const BROWSE_LOCATIONS = [LOCATIONS.ENTIRE_CAMPUS, ...PRODUCT_LOCATIONS];

export default PRODUCT_LOCATIONS;
