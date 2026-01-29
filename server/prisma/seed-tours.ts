import { PrismaClient, TourDifficulty } from "@prisma/client";

const prisma = new PrismaClient();

const TITLES = [
    "Wine Tasting in Kakheti",
    "Hiking to Gergeti Trinity",
    "Old Tbilisi Walking Tour",
    "Prometheus Cave Exploration",
    "Black Sea Sunset Cruise",
    "Svaneti Ancient Towers Trek",
    "Borjomi National Park Hike",
    "Vardzia Cave City Adventure",
    "Mtskheta Cultural Heritage",
    "Kazbegi Jeep Tour",
    "Martvili Canyon Boat Ride",
    "Ushguli Off-road Experience",
    "Batumi City Highlights",
    "Georgian Culinary Masterclass",
    "Signagi Love City Tour",
    "Racha Wine & Mountains",
    "Tusheti Horse Riding",
    "Gudauri Ski Resort Day Trip",
    "David Gareji Monastery Visit",
    "Telavi Royal Palace Tour",
    "Kutaisi Historical Discovery",
    "Adjara Highland Escape",
    "Dmanisi Archeological Site",
    "Javakheti Lakes Birdwatching",
    "Gori & Uplistsikhe Day Tour",
    "Chiatura Cable Cars",
    "Lagodekhi Nature Reserve",
    "Vashlovani Safari",
    "Rafting on Rioni River",
    "Paragliding in Kazbegi"
];

const CATEGORIES = ["Adventure", "Cultural", "Wine & Food", "Nature", "Historical", "City Tour"];
const DIFFICULTIES = [TourDifficulty.easy, TourDifficulty.moderate, TourDifficulty.challenging];

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
    console.log("🚀 Starting tour seeding...");

    // 1. Fetch Users (Owners)
    const users = await prisma.user.findMany({
        where: { roles: { some: { role: "GUIDE" } } } // Prefer guides as owners
    });

    if (users.length === 0) {
        throw new Error("No users found to assign tours to! Run 'npm run prisma:seed' first.");
    }

    // 2. Fetch Locations
    const locations = await prisma.location.findMany();
    if (locations.length === 0) {
        throw new Error("No locations found! Run 'npm run prisma:seed' first.");
    }

    console.log(`Found ${users.length} potential owners and ${locations.length} locations.`);

    // 3. Generate 30 Tours
    const toursToCreate = [];

    // We'll loop 30 times, or use the TITLES array if it has 30 items
    const count = 30;

    for (let i = 0; i < count; i++) {
        const owner = randomItem(users);
        // Pick 1-3 random locations
        const numLocs = randomInt(1, 3);
        const tourLocations = [];
        for (let j = 0; j < numLocs; j++) {
            tourLocations.push(randomItem(locations));
        }
        // Remove duplicates
        const uniqueLocations = [...new Set(tourLocations)];
        const primaryLocation = uniqueLocations[0];

        const title = TITLES[i] || `Georgian Adventure #${i + 1}`;
        const price = randomInt(50, 500);
        const duration = randomInt(180, 600); // 3-10 hours in minutes

        toursToCreate.push({
            ownerId: owner.id,
            title: title,
            summary: `Experience the best of ${primaryLocation.name} with this amazing ${title}. Unforgettable memories guaranteed!`,
            description: `Join us for an incredible journey to ${uniqueLocations.map(l => l.name).join(' and ')}. 
      
This tour includes:
- Professional guide service
- Comfortable transportation
- Local insights and stories
- Photo opportunities
- Refreshments

We will start our journey from ${primaryLocation.name} and explore the hidden gems of the region. Perfect for creating lasting memories of your trip to Georgia.`,
            price: price,
            currency: "GEL",
            city: primaryLocation.name,
            startLocation: primaryLocation.name,
            durationMinutes: duration,
            maxPeople: randomInt(4, 15),
            difficulty: randomItem(DIFFICULTIES),
            category: randomItem(CATEGORIES),
            isActive: true,
            isInstantBooking: Math.random() > 0.7,
            hasFreeCancellation: Math.random() > 0.5,
            isFeatured: Math.random() > 0.8,
            nextAvailableDate: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
            locations: uniqueLocations
        });
    }

    console.log(`Prepared ${toursToCreate.length} tours for insertion...`);

    // 4. Insert Tours
    for (const t of toursToCreate) {
        const { locations, ...tourData } = t;

        const createdTour = await prisma.tour.create({
            data: {
                ...tourData,
                locations: {
                    create: locations.map((loc, index) => ({
                        locationId: loc.id,
                        order: index
                    }))
                }
            }
        });
        console.log(`✅ Created tour: ${createdTour.title}`);
    }

    console.log(`🎉 Successfully generated ${toursToCreate.length} tours!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
