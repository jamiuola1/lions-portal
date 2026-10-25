// Content migrated from https://e-clubhouse.org/sites/oshawaairport/ (Phase 1 inventory).
// Anything with verified:false is held back from production until the club confirms it.

export const club = {
  name: "Oshawa Airport Lions Club",
  motto: "We Serve",
  district: "District A-16",
  email: process.env.NEXT_PUBLIC_CLUB_EMAIL ?? "dsan@sansom-ins.ca",
  meetings: {
    schedule: "1st and 3rd Thursday, 7 PM",
    first: "1st Thursday: location to be confirmed",
    third: "3rd Thursday: Oshawa Airport Departure Lounge",
  },
};

export const nav = [
  { href: "/about", label: "About" },
  { href: "/community-service", label: "Community service" },
  { href: "/community", label: "Community" },
  { href: "/membership", label: "Membership" },
  { href: "/contact", label: "Contact" },
];

export const causes = [
  { title: "Diabetes", text: "Donated to the Charles H. Best Centre for Diabetes." },
  { title: "Environment", text: "Collecting certain plastic items for recycling, plus park cleanups once or twice a year." },
  { title: "Hunger", text: "Food collected for Durham Outlook for the Needy, and support for Cornerstone Men's Shelter." },
  { title: "Childhood cancer", text: "Funds raised for Hearth Place to support pediatric cancer patients." },
  { title: "Vision", text: "Donations to the Lions Foundation of Canada Dog Guides." },
];

export const localSupport = [
  "Denise House: school supplies for children in residence",
  "Cornerstone Community Men's Hostel: monetary donations",
  "Simcoe Hall Settlement House: donations, plus gifts and food for a family through the Christmas Hamper Program",
  "Hearth Place Cancer Support Centre: monetary donation",
  "St. Vincent's Kitchen: food preparation and monetary donation",
];

export const signatureEvents = [
  { title: "Gingerbread house decorating with Santa and Mrs. Claus", note: "Held the last Sunday of November or first Sunday of December.", verify: "Venue and current status" },
  { title: "Breakfast with Santa", note: "Pancakes, sausages and a gift for each child. Held in December.", verify: "Venue and current status" },
];

export const lionsPrograms = [
  "Lions Foundation of Canada Dog Guides (vision, hearing, autism assistance, service, seizure response, diabetic alert, support)",
  "Lions Clubs Camp Kirk Foundation, for children with learning disabilities",
  "Sleeping Children Around the World",
  "Lions Clubs International Foundation, for worldwide disaster relief",
  "Lions Home for the Deaf",
  "Recycle for Sight: used and damaged glasses collected, repaired and sent to communities that need them",
];

// Names and roles only. No personal emails are published. Source: officers page labelled 2023-2024.
export const officers = [
  { role: "President", name: "Micheline Lush", verified: false },
  { role: "Vice President", name: "Cathy Murray", verified: false },
  { role: "Secretary (Recording)", name: "John Wells", verified: false },
  { role: "Secretary (Reporting)", name: "Tina Cawthorne", verified: false },
  { role: "Treasurer", name: "Tina Cawthorne", verified: false },
  { role: "Membership Chair", name: "Dave Sansom", verified: false },
  { role: "LCIF Coordinator", name: "Louis Marechal", verified: false },
  { role: "Club Marketing", name: "Debbie Dawson", verified: false },
  { role: "Service Chair", name: "Steve Murray", verified: false },
  { role: "Health and Welfare", name: "Leigh Beauchamp", verified: false },
];
