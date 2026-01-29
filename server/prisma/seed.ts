import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Seed Georgian locations
    const locations = [
        // Tbilisi Region
        { name: "Tbilisi", region: "Tbilisi", latitude: 41.7151, longitude: 44.8271 },
        { name: "Mtskheta", region: "Mtskheta-Mtianeti", latitude: 41.8456, longitude: 44.7176 },

        // Kakheti Region (Wine Region)
        { name: "Sighnaghi", region: "Kakheti", latitude: 41.6198, longitude: 45.9221 },
        { name: "Telavi", region: "Kakheti", latitude: 41.9198, longitude: 45.4733 },
        { name: "Kvareli", region: "Kakheti", latitude: 41.9545, longitude: 45.8166 },
        { name: "Tsinandali", region: "Kakheti", latitude: 41.8889, longitude: 45.5639 },

        // Imereti Region
        { name: "Kutaisi", region: "Imereti", latitude: 42.2679, longitude: 42.6946 },
        { name: "Prometheus Cave", region: "Imereti", latitude: 42.3767, longitude: 42.6008 },
        { name: "Sataplia", region: "Imereti", latitude: 42.3100, longitude: 42.6375 },

        // Adjara Region
        { name: "Batumi", region: "Adjara", latitude: 41.6168, longitude: 41.6367 },
        { name: "Gonio", region: "Adjara", latitude: 41.5731, longitude: 41.5722 },
        { name: "Mtirala National Park", region: "Adjara", latitude: 41.6667, longitude: 41.8333 },

        // Svaneti Region
        { name: "Mestia", region: "Samegrelo-Zemo Svaneti", latitude: 43.0456, longitude: 42.7271 },
        { name: "Ushguli", region: "Samegrelo-Zemo Svaneti", latitude: 42.9167, longitude: 43.0167 },

        // Kazbegi Region
        { name: "Stepantsminda (Kazbegi)", region: "Mtskheta-Mtianeti", latitude: 42.6569, longitude: 44.6433 },
        { name: "Gergeti Trinity Church", region: "Mtskheta-Mtianeti", latitude: 42.6628, longitude: 44.6200 },

        // Samtskhe-Javakheti Region
        { name: "Borjomi", region: "Samtskhe-Javakheti", latitude: 41.8428, longitude: 43.3897 },
        { name: "Vardzia", region: "Samtskhe-Javakheti", latitude: 41.3814, longitude: 43.2842 },
        { name: "Rabati Castle", region: "Samtskhe-Javakheti", latitude: 41.6400, longitude: 42.9758 },

        // Racha-Lechkhumi Region
        { name: "Ambrolauri", region: "Racha-Lechkhumi", latitude: 42.5194, longitude: 43.1511 },
        { name: "Shaori Lake", region: "Racha-Lechkhumi", latitude: 42.5000, longitude: 43.2500 },

        // Black Sea Coast
        { name: "Kobuleti", region: "Adjara", latitude: 41.8211, longitude: 41.7764 },
        { name: "Ureki", region: "Guria", latitude: 41.9417, longitude: 41.7833 },
        { name: "Anaklia", region: "Samegrelo-Zemo Svaneti", latitude: 42.4000, longitude: 41.5833 },
    ];

    console.log(`📍 Seeding ${locations.length} locations...`);

    for (const location of locations) {
        await prisma.location.upsert({
            where: {
                name_country: {
                    name: location.name,
                    country: "Georgia",
                },
            },
            update: {},
            create: {
                name: location.name,
                region: location.region,
                country: "Georgia",
                latitude: location.latitude,
                longitude: location.longitude,
                isActive: true,
            },
        });
    }

    console.log("✅ Locations seeded successfully");

    // ==========================================
    // Seed Guide Users and Profiles
    // ==========================================
    console.log("👤 Seeding guides...");

    const passwordHash = '$2b$10$K4t8YqN1hJqXhkR5mVxLxOxQyPzG4FvD2FwrIeV3nQ8W5sKjT6kZq'; // Password123!

    const guides = [
        {
            email: 'giorgi.guide@example.com',
            firstName: 'Giorgi',
            lastName: 'Beridze',
            bio: 'Professional tour guide with 10 years of experience exploring the hidden gems of Georgia. Fluent in English, Russian, and Georgian. Specializing in wine tours and historical sites.',
            languages: ["en", "ru", "ka"],
            experience: 10,
            phone: '+995599123456',
            rating: 4.85,
            reviews: 47,
            price: 150.00,
            locations: ['Tbilisi', 'Mtskheta', 'Sighnaghi'],
            verified: true
        },
        {
            email: 'nino.guide@example.com',
            firstName: 'Nino',
            lastName: 'Kapanadze',
            bio: 'Passionate about Georgian culture and history. I love sharing stories about ancient monasteries and the Silk Road heritage. Hiking and adventure tours specialist.',
            languages: ["en", "ka", "de"],
            experience: 7,
            phone: '+995599234567',
            rating: 4.92,
            reviews: 31,
            price: 180.00,
            locations: ['Kutaisi', 'Batumi'],
            verified: true
        },
        {
            email: 'dato.guide@example.com',
            firstName: 'Dato',
            lastName: 'Lomidze',
            bio: 'Mountain guide certified for high-altitude trekking. Expert in Svaneti and Kazbegi regions. Safety-focused adventures for all skill levels.',
            languages: ["en", "ru", "ka", "fr"],
            experience: 12,
            phone: '+995599345678',
            rating: 4.78,
            reviews: 56,
            price: 250.00,
            locations: ['Stepantsminda (Kazbegi)', 'Mtskheta', 'Tbilisi'],
            verified: true
        },
        {
            email: 'mariam.guide@example.com',
            firstName: 'Mariam',
            lastName: 'Chkhaidze',
            bio: 'Food and wine tour specialist. Former sommelier with deep knowledge of Georgian winemaking traditions. Let me take you on a culinary journey!',
            languages: ["en", "ka"],
            experience: 5,
            phone: '+995599456789',
            rating: 4.95,
            reviews: 23,
            price: 200.00,
            locations: ['Sighnaghi', 'Tbilisi'],
            verified: true
        },
        {
            email: 'tornike.guide@example.com',
            firstName: 'Tornike',
            lastName: 'Gvenetadze',
            bio: 'Photography and cultural tours. I help travelers capture the perfect shots while learning about Georgian traditions. Fluent in multiple languages.',
            languages: ["en", "ru", "ka", "es"],
            experience: 8,
            phone: '+995599567890',
            rating: 4.60,
            reviews: 15,
            price: 120.00,
            locations: ['Tbilisi', 'Stepantsminda (Kazbegi)', 'Batumi'],
            verified: false
        },
        {
            email: 'elene.guide@example.com',
            firstName: 'Elene',
            lastName: 'Tsitskishvili',
            bio: 'Nature and bird watching specialist. Certified ornithologist offering eco-tours in Georgian national parks. Perfect for nature lovers!',
            languages: ["en", "ka"],
            experience: 6,
            phone: '+995599678901',
            rating: 4.72,
            reviews: 19,
            price: 140.00,
            locations: ['Batumi', 'Kutaisi'],
            verified: true
        }
    ];

    for (const guideData of guides) {
        // Create User
        const user = await prisma.user.upsert({
            where: { email: guideData.email },
            update: {},
            create: {
                email: guideData.email,
                firstName: guideData.firstName,
                lastName: guideData.lastName,
                passwordHash: passwordHash,
                emailVerified: true,
                isActive: true,
                roles: {
                    create: { role: 'GUIDE' }
                }
            }
        });

        // Create Guide Profile
        const guide = await prisma.guide.upsert({
            where: { userId: user.id },
            update: {
                pricePerDay: guideData.price,
                currency: 'GEL'
            },
            create: {
                userId: user.id,
                bio: guideData.bio,
                languages: guideData.languages,
                yearsOfExperience: guideData.experience,
                phoneNumber: guideData.phone,
                isVerified: guideData.verified,
                isAvailable: true,
                averageRating: guideData.rating,
                reviewCount: guideData.reviews,
                pricePerDay: guideData.price,
                currency: 'GEL'
            }
        });

        // Link Locations
        // First find location IDs
        const locationNames = guideData.locations;
        const locationRecords = await prisma.location.findMany({
            where: {
                name: { in: locationNames }
            }
        });

        if (locationRecords.length > 0) {
            // Delete existing
            await prisma.guideLocation.deleteMany({
                where: { guideId: guide.id }
            });

            // Create new
            await prisma.guideLocation.createMany({
                data: locationRecords.map((loc, index) => ({
                    guideId: guide.id,
                    locationId: loc.id,
                    isPrimary: index === 0 // First one is primary
                }))
            });
        }
    }

    console.log("✅ Guides seeded successfully");
    console.log("");
    console.log("🎉 Database seeding completed!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
