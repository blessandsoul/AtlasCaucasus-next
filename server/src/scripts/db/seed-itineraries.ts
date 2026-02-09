import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ItineraryStep {
  title: string;
  description: string;
}

// Itinerary data mapped by tour title (exact match)
const ITINERARIES: Record<string, ItineraryStep[]> = {
  "Wine Tasting in Kakheti": [
    { title: "Departure from Tbilisi", description: "Morning pickup from your hotel in Tbilisi. Scenic drive along the Georgian Military Highway through the lush Alazani Valley towards Kakheti — Georgia's premier wine region." },
    { title: "Shumi Winery Visit", description: "Arrive at Shumi Winery, one of Georgia's oldest. Tour the vineyards and learn about the unique Georgian qvevri winemaking method. Taste 4-5 wines paired with local cheese and bread." },
    { title: "Traditional Lunch", description: "Enjoy an authentic Georgian supra (feast) at a family-run restaurant. Dishes include khinkali, mtsvadi (grilled meat), fresh salads, and homemade wine." },
    { title: "Khareba Winery Tunnel", description: "Visit the famous Khareba wine tunnel carved into the mountainside, where thousands of bottles age at a natural temperature. Taste their signature Saperavi and Rkatsiteli wines." },
    { title: "Sighnaghi Viewpoint", description: "Stop at the picturesque town of Sighnaghi — the 'City of Love.' Walk along the ancient fortress walls with panoramic views of the Alazani Valley and the Greater Caucasus mountains." },
    { title: "Return to Tbilisi", description: "Relaxing drive back to Tbilisi with a bottle of your favorite wine as a souvenir. Drop-off at your hotel by evening." },
  ],
  "Hiking to Gergeti Trinity": [
    { title: "Early Morning Departure", description: "Leave Tbilisi at 7:00 AM. Drive north on the Georgian Military Highway, passing through Ananuri Fortress and the stunning Jinvali Reservoir." },
    { title: "Gudauri Pass & Cross Pass", description: "Stop at the Russia-Georgia Friendship Monument at 2,395m. Breathtaking views of the Devil's Valley. Continue over the Cross Pass (2,379m) with photo stops." },
    { title: "Arrive in Stepantsminda", description: "Reach the mountain town of Stepantsminda (Kazbegi). Brief rest and gear check before the hike. Light snacks and water available." },
    { title: "Hike to Gergeti Trinity Church", description: "Begin the 3km uphill hike (approximately 1.5-2 hours). The trail winds through alpine meadows with wildflowers. Altitude: from 1,750m to 2,170m." },
    { title: "Gergeti Trinity Church", description: "Arrive at the iconic 14th-century church perched against the backdrop of Mount Kazbek (5,047m). Explore the church, take in the panoramic views, and enjoy a well-deserved rest." },
    { title: "Descent & Lunch", description: "Hike back down to Stepantsminda. Lunch at a local restaurant featuring khinkali and mountain herb tea. Free time to explore the town." },
    { title: "Return Journey", description: "Drive back to Tbilisi with a stop at Pasanauri for dinner (optional). Arrive by late evening." },
  ],
  "Old Tbilisi Walking Tour": [
    { title: "Meeting at Freedom Square", description: "Gather at the iconic Freedom Square with its golden St. George statue. Brief history introduction about Tbilisi's founding and the legend of the hot springs." },
    { title: "Rustaveli Avenue", description: "Walk along Georgia's most famous boulevard. See the Parliament, Opera House, and the Rustaveli National Theatre. Learn about Georgia's Soviet past and independence movement." },
    { title: "Narikala Fortress & Cable Car", description: "Take the aerial tramway over the Old Town to Narikala Fortress (4th century). Panoramic views of Tbilisi, the Mtkvari River, and the surrounding hills." },
    { title: "Abanotubani (Bath District)", description: "Descend through the charming old streets to the sulfur bath district. See the distinctive domed rooftops and learn about the bathing traditions that gave Tbilisi its name." },
    { title: "Leghvtakhevi Waterfall", description: "Hidden gem walk through a narrow canyon to the waterfall right in the heart of the city. A surprising natural oasis surrounded by colorful overhanging houses." },
    { title: "Shardeni & Cafe Culture", description: "End the tour in the lively Shardeni Street area. Optional coffee or wine tasting at a traditional cafe. Recommendations for dinner spots in the Old Town." },
  ],
  "Prometheus Cave Exploration": [
    { title: "Morning Drive to Imereti", description: "Depart Kutaisi (or Tbilisi with earlier pickup). Drive through the green hills of the Imereti region towards Tskaltubo." },
    { title: "Enter Prometheus Cave", description: "Descend into one of Georgia's largest caves. The illuminated underground world spans 1.4km of walkable paths. Marvel at massive stalactites, stalagmites, and underground rivers." },
    { title: "Underground Boat Ride", description: "Board a small boat for a ride along the underground river at the deepest point of the cave. The eerie silence and dramatic lighting create an unforgettable atmosphere." },
    { title: "Lunch in Tskaltubo", description: "Visit the former Soviet spa town of Tskaltubo. Lunch at a local restaurant, then optional walk through the abandoned Soviet-era sanatoriums — a photographer's paradise." },
    { title: "Sataplia Nature Reserve", description: "Short drive to nearby Sataplia to see real dinosaur footprints preserved in limestone, a smaller cave, and the glass walkway viewpoint overlooking the Colchic forest." },
  ],
  "Black Sea Sunset Cruise": [
    { title: "Batumi Marina Check-in", description: "Meet at Batumi Marina by 4:00 PM. Board the yacht and get acquainted with the crew. Safety briefing and welcome drink." },
    { title: "Coastal Cruise", description: "Sail along the Batumi coastline, passing the Alphabet Tower, the Batumi Boulevard, and the city skyline. Learn about the Black Sea's unique ecosystem." },
    { title: "Sunset & Dinner", description: "Anchor in a scenic spot to watch the sunset over the Black Sea. Enjoy a Georgian dinner onboard with fresh fish, salads, wine, and chacha (grape brandy)." },
    { title: "Return Under the Stars", description: "Cruise back to the marina under the evening sky. See the illuminated Batumi skyline from the water — a magical view." },
  ],
  "Svaneti Ancient Towers Trek": [
    { title: "Fly or Drive to Mestia", description: "Take the scenic 30-minute flight from Natakhtari to Mestia (weather permitting), or drive through the dramatic Enguri River gorge. Arrive and settle into a family guesthouse." },
    { title: "Mestia Town & Museum", description: "Explore the UNESCO-listed medieval towers of Mestia. Visit the Svaneti Museum of History & Ethnography to learn about the unique Svan culture, traditions, and the famous Svan gold." },
    { title: "Trek to Chalaadi Glacier", description: "Morning hike to the Chalaadi Glacier (6km round trip). Cross a suspension bridge over the Mestiachala River and hike through ancient forest to the glacier's edge." },
    { title: "Drive to Ushguli", description: "Scenic 4x4 drive (2.5 hours) to Ushguli — the highest continuously inhabited settlement in Europe (2,200m). Stunning views of Mount Shkhara (5,193m)." },
    { title: "Explore Ushguli", description: "Walk through this living museum. Visit the Lamaria Church, the ethnographic museum, and the centuries-old Svan tower houses. Lunch with a local family." },
    { title: "Return & Farewell Dinner", description: "Drive back to Mestia. Farewell dinner featuring Kubdari (Svan meat pie), local beer, and traditional Svan toasts." },
  ],
  "Borjomi National Park Hike": [
    { title: "Arrive in Borjomi", description: "Morning arrival in the spa town of Borjomi. Sample the famous mineral water directly from the source in the town's central park." },
    { title: "Enter the National Park", description: "Begin the hike from the Borjomi Central Park entrance. Follow the trail through dense forest alongside the Borjomula River. The air is crisp with the scent of pine." },
    { title: "Sulfur Pools", description: "Reach the natural warm sulfur pools after a moderate 3km hike. Optional dip in the 35°C natural mineral water surrounded by forest." },
    { title: "Picnic Lunch", description: "Packed lunch in a scenic meadow clearing. Enjoy Georgian bread, cheese, fruits, and homemade lemonade with mountain views." },
    { title: "Return via Scenic Trail", description: "Take an alternate route back through old-growth forest. Spot local wildlife — deer, woodpeckers, and if lucky, a Caucasian salamander." },
  ],
  "Vardzia Cave City Adventure": [
    { title: "Drive to Samtskhe-Javakheti", description: "Depart early morning towards southern Georgia. The route passes through dramatic volcanic landscapes and the historic town of Akhaltsikhe." },
    { title: "Rabati Castle", description: "Stop at the beautifully restored Rabati Castle complex in Akhaltsikhe. Explore the mosque, church, synagogue, and fortress — a symbol of Georgia's multicultural heritage." },
    { title: "Vardzia Cave Monastery", description: "Arrive at the stunning Vardzia — a cave monastery complex carved into a sheer cliff face by Queen Tamar in the 12th century. Explore up to 600 rooms across 13 levels, including a chapel with original frescoes." },
    { title: "Lunch & Khertvisi Fortress", description: "Lunch at a restaurant overlooking the Mtkvari River gorge. Then visit the nearby Khertvisi Fortress, one of the oldest in Georgia (10th century)." },
    { title: "Return Journey", description: "Scenic drive back through the highland landscapes. Arrive in Tbilisi by evening." },
  ],
  "Mtskheta Cultural Heritage": [
    { title: "Drive to Mtskheta", description: "Short 25-minute drive from Tbilisi to Mtskheta — Georgia's ancient capital and a UNESCO World Heritage Site. Once the center of the Iberian Kingdom." },
    { title: "Jvari Monastery", description: "Visit the 6th-century Jvari Monastery perched on a hilltop overlooking the confluence of the Mtkvari and Aragvi rivers. One of Georgia's most iconic views." },
    { title: "Svetitskhoveli Cathedral", description: "Explore the Svetitskhoveli Cathedral — the spiritual heart of Georgia. Built in the 11th century, it is said to enshrine Christ's robe. Magnificent frescoes and medieval architecture." },
    { title: "Samtavro Monastery", description: "Walk to the nearby Samtavro Monastery where St. Nino, who brought Christianity to Georgia, lived and prayed. See the ancient mulberry tree." },
    { title: "Local Market & Lunch", description: "Browse the local market for churchkhela (Georgian candle candy), spices, and souvenirs. Lunch at a traditional restaurant with river views." },
  ],
  "Kazbegi Jeep Tour": [
    { title: "Tbilisi to Ananuri", description: "Depart Tbilisi in a 4x4 vehicle. First stop at Ananuri Fortress on the shores of the Jinvali Reservoir — a medieval castle complex with beautiful lake views." },
    { title: "Cross Pass & Gudauri", description: "Drive over the dramatic Cross Pass at 2,379m. Stop at the Friendship Monument and the ski resort town of Gudauri. Photo opportunities at every turn." },
    { title: "Jeep Ride to Gergeti", description: "Switch to off-road mode for the thrilling 4x4 ascent to Gergeti Trinity Church. The rugged mountain track offers incredible views of Kazbek's glaciers." },
    { title: "Truso Valley Expedition", description: "Continue by jeep into the remote Truso Valley — a narrow gorge with mineral springs, travertine terraces, and an abandoned village. Feel like a true explorer." },
    { title: "Lunch & Hot Springs", description: "Return to Stepantsminda for a hearty mountain lunch. Optional visit to natural mineral water springs near the town." },
  ],
  "Martvili Canyon Boat Ride": [
    { title: "Arrive at Martvili Canyon", description: "Morning arrival at the entrance of Martvili Canyon in the Samegrelo region. The canyon was once a bathing spot reserved exclusively for the Dadiani royal family." },
    { title: "Upper Canyon Walk", description: "Walk along the suspended walkways above the turquoise Abasha River. The 30m-deep canyon is draped in moss and ferns, creating a prehistoric atmosphere." },
    { title: "Boat Ride Through the Canyon", description: "Board a small boat for a 15-minute ride through the lower canyon. Glide beneath towering rock walls and small waterfalls — the highlight of the experience." },
    { title: "Okatse Canyon", description: "Drive 20 minutes to nearby Okatse Canyon. Walk the suspended metal walkway hanging 140m above the canyon floor. Not for the faint of heart!" },
  ],
  "Ushguli Off-road Experience": [
    { title: "4x4 Departure from Mestia", description: "Board your 4x4 vehicle in Mestia for the 2.5-hour off-road journey to Ushguli. The unpaved mountain road crosses rivers and passes through remote Svan villages." },
    { title: "Arrive in Ushguli", description: "Welcome to Europe's highest continuously inhabited settlement at 2,200m. Surrounded by the snow-capped peaks of the Greater Caucasus, including Shkhara (5,193m)." },
    { title: "Village Exploration", description: "Walk through the four hamlets that make up Ushguli. Visit the medieval defensive towers, the Lamaria Church, and the ethnographic museum. Every corner tells a centuries-old story." },
    { title: "Hike to Shkhara Glacier Viewpoint", description: "Optional 2-hour hike towards the Shkhara Glacier for stunning close-up views of the highest peak in Georgia. Alpine meadows filled with wildflowers in summer." },
    { title: "Svan Lunch", description: "Home-cooked Svan lunch with a local family. Try kubdari (meat-stuffed bread), tashmijabi (cheese and potato mash), and local mountain honey." },
    { title: "Return to Mestia", description: "Scenic return drive with golden hour light illuminating the mountain peaks. Arrive in Mestia by evening." },
  ],
  "Batumi City Highlights": [
    { title: "Batumi Boulevard", description: "Start at the 7km seaside boulevard — the longest in the Black Sea region. See the Alphabet Tower, the moving Ali & Nino statue, and the dancing fountains." },
    { title: "Old Town & Piazza", description: "Explore Batumi's charming old quarter with its mix of European and Ottoman architecture. Visit the Piazza Square with its stunning mosaic facades and Italian-style clock tower." },
    { title: "Batumi Botanical Garden", description: "Visit the spectacular Batumi Botanical Garden perched on the hillside above the sea. Home to over 5,000 plant species from around the world. Panoramic Black Sea views." },
    { title: "Cable Car Ride", description: "Take the Argo Cable Car from the seafront up to Anuria Mountain for sweeping views over the city, the port, and the Black Sea coastline." },
  ],
  "Georgian Culinary Masterclass": [
    { title: "Market Visit", description: "Start at the Dezerter Bazaar — Tbilisi's largest and most vibrant market. Shop for fresh herbs, spices, cheese, and vegetables. Learn to pick the best ingredients like a local." },
    { title: "Khinkali Workshop", description: "Learn to make Georgia's iconic dumplings. Master the art of the 18-pleat fold and the perfect seasoning. Each student makes their own batch of khinkali." },
    { title: "Khachapuri & Pkhali", description: "Learn two more Georgian staples: Imeruli khachapuri (cheese bread) and pkhali (walnut-herb appetizer). Hands-on preparation with traditional techniques." },
    { title: "Churchkhela Making", description: "Create Georgia's famous 'candle candy' — walnuts dipped in thickened grape juice. A fun, messy, and delicious process!" },
    { title: "Supra Feast", description: "Sit down to enjoy everything you've cooked in a traditional Georgian supra (feast). Toast with homemade wine, share stories, and celebrate Georgian hospitality." },
  ],
  "Signagi Love City Tour": [
    { title: "Scenic Drive to Signagi", description: "Drive through the picturesque Kakheti region with its endless vineyards. Arrive at the hilltop town of Signagi, known as the 'City of Love' for its 24-hour wedding chapel." },
    { title: "City Walls Walk", description: "Walk along the beautifully restored medieval fortress walls with 23 towers. The walls offer stunning panoramic views of the Alazani Valley and the snowcapped Caucasus mountains." },
    { title: "Bodbe Monastery", description: "Visit the Bodbe Monastery just outside Signagi — the burial place of St. Nino who Christianized Georgia in the 4th century. Beautiful gardens and a holy spring." },
    { title: "Wine Cellar Visit", description: "Visit a family wine cellar (marani) for a private tasting. Learn about the 8,000-year-old Georgian winemaking tradition and the unique qvevri method." },
    { title: "Lunch & Free Time", description: "Lunch at a restaurant with terrace views over the valley. Free time to explore the town's art galleries, craft shops, and cobblestone streets." },
  ],
  "Racha Wine & Mountains": [
    { title: "Drive to Racha", description: "Scenic drive from Tbilisi through Imereti into the Racha region — one of Georgia's most beautiful and least-visited areas. The road follows river valleys and crosses mountain passes." },
    { title: "Shaori Lake", description: "Stop at the serene Shaori Reservoir surrounded by pine forests and mountains. A peaceful spot for photos and fresh mountain air." },
    { title: "Khvanchkara Wine Tasting", description: "Visit a winery in the village of Khvanchkara — birthplace of the famous semi-sweet red wine that was reportedly Stalin's favorite. Taste directly from the qvevri." },
    { title: "Mountain Village Lunch", description: "Authentic Rachian lunch in a village home. Racha is known for its smoked ham (lori), lobiani (bean bread), and shkmeruli (garlic chicken). Generous portions guaranteed." },
    { title: "Nikortsminda Cathedral", description: "Visit the 11th-century Nikortsminda Cathedral, famous for its extraordinary stone carvings and frescoes. A hidden masterpiece of Georgian medieval architecture." },
  ],
  "Tusheti Horse Riding": [
    { title: "Drive to Omalo", description: "Epic 4x4 drive over the Abano Pass (2,926m) — one of the most dangerous roads in the world. Dramatic switchbacks with breathtaking views. Arrive in the remote Tusheti region." },
    { title: "Horse Assignment & Training", description: "Meet your horse at the Omalo stables. Brief riding lesson for beginners. The sturdy Tushetian horses are gentle and sure-footed on mountain trails." },
    { title: "Ride to Dartlo", description: "Horseback ride through alpine meadows to the ancient village of Dartlo. Pass stone towers, shepherd camps, and flocks of sheep. The landscape feels untouched by time." },
    { title: "Dartlo Village Exploration", description: "Explore the UNESCO-candidate village of Dartlo with its distinctive slate-roofed towers. Visit a local family for tea and homemade cheese." },
    { title: "Return Ride & Campfire", description: "Ride back to Omalo in the golden afternoon light. Evening campfire with traditional Tushetian stories, homemade beer (aludi), and grilled mtsvadi under the stars." },
  ],
  "Gudauri Ski Resort Day Trip": [
    { title: "Morning Drive to Gudauri", description: "Depart Tbilisi early morning for the 2-hour drive to Gudauri ski resort (2,196m). The road follows the stunning Georgian Military Highway." },
    { title: "Equipment & Lift Passes", description: "Rent ski or snowboard equipment at the resort (or bring your own). Collect your lift pass. The resort has runs for all skill levels from 2,196m to 3,276m." },
    { title: "Skiing & Snowboarding", description: "Hit the slopes! Gudauri offers 57km of groomed runs, off-piste opportunities, and incredible views of the Caucasus mountains. Ski school available for beginners." },
    { title: "Mountain Lunch", description: "Lunch at a mountainside restaurant with views of the slopes. Warm up with Georgian bean soup (lobio) and hot chocolate." },
    { title: "Return to Tbilisi", description: "After an exhilarating day on the mountains, drive back to Tbilisi. Arrive by evening, pleasantly tired." },
  ],
  "David Gareji Monastery Visit": [
    { title: "Drive to the Semi-Desert", description: "Leave Tbilisi heading southeast into the Kakheti steppe. The landscape transforms from green hills to dramatic semi-desert terrain — a stark contrast to the lush western Georgia." },
    { title: "David Gareji Monastery", description: "Arrive at the 6th-century cave monastery complex founded by one of the Thirteen Assyrian Fathers. Explore the main Lavra monastery built into the cliff face." },
    { title: "Hike to Udabno Caves", description: "Climb over the ridge (20-minute hike) to the Udabno caves on the Azerbaijan border. See remarkable medieval frescoes preserved inside the cave chapels — some dating to the 9th century." },
    { title: "Panoramic Views", description: "From the ridge, enjoy vast views stretching into Azerbaijan. The painted desert landscape is surreal and unlike anything else in Georgia." },
    { title: "Return via Sagarejo", description: "Drive back through the Iori Valley with a stop in Sagarejo for late lunch and local wine tasting." },
  ],
  "Telavi Royal Palace Tour": [
    { title: "Drive to Kakheti", description: "Morning drive to Telavi, the capital of the Kakheti wine region. Pass through rolling hills covered with vineyards." },
    { title: "Batonis Tsikhe Palace", description: "Visit the 17th-century Batonis Tsikhe — the royal residence of the Kakhetian kings. Explore the palace halls, museum collections, and beautiful gardens with 900-year-old plane trees." },
    { title: "Alaverdi Monastery", description: "Visit the stunning 11th-century Alaverdi Cathedral — one of the tallest medieval churches in Georgia. The monastery has its own working winery producing wine since the 6th century." },
    { title: "Wine Estate Lunch", description: "Lunch at a wine estate with a full Georgian supra. Tour the vineyards, learn about the terroir, and taste premium Kakheti wines." },
    { title: "Tsinandali Estate", description: "Visit the Tsinandali Estate — the former home of poet Alexander Chavchavadze and a cradle of Georgian winemaking. Tour the historic house-museum and the wine cellar." },
  ],
  "Kutaisi Historical Discovery": [
    { title: "Arrive in Kutaisi", description: "Reach Georgia's second city — the former capital of the ancient Kingdom of Colchis, where Jason and the Argonauts sought the Golden Fleece." },
    { title: "Bagrati Cathedral", description: "Visit the 11th-century Bagrati Cathedral, recently restored. Once a UNESCO site, it sits on Ukimerioni Hill with commanding views of Kutaisi and the Rioni River." },
    { title: "Gelati Monastery", description: "Drive to the UNESCO-listed Gelati Monastery (1106 AD). Founded by King David the Builder, it houses extraordinary mosaics, frescoes, and was once the leading academy in the medieval Caucasus." },
    { title: "Colchis Fountain & City Center", description: "Return to the city center to see the Colchis Fountain with its golden replicas of ancient Georgian artifacts. Walk through the charming market and White Bridge area." },
    { title: "Traditional Imeretian Lunch", description: "Enjoy the distinctive cuisine of Imereti — lighter than eastern Georgian food. Try Imeretian khachapuri, gebzhalia (cheese in mint sauce), and Imeretian wine." },
  ],
};

// Generic itinerary generator for tours without specific data
function generateGenericItinerary(title: string, city: string | null, durationMinutes: number | null): ItineraryStep[] {
  const hours = durationMinutes ? Math.round(durationMinutes / 60) : 4;
  const location = city || "the destination";

  if (hours <= 4) {
    return [
      { title: "Meeting & Introduction", description: `Meet your guide at the designated meeting point in ${location}. Brief introduction and overview of the day's itinerary.` },
      { title: "Main Experience", description: `The heart of the ${title.toLowerCase()} experience. Your guide will share fascinating stories, history, and local insights as you explore.` },
      { title: "Break & Refreshments", description: "Short break with refreshments. Opportunity to ask questions, take photos, and soak in the atmosphere." },
      { title: "Final Stop & Farewell", description: `Conclude the experience at a scenic viewpoint. Your guide will share final recommendations for ${location}. Transfer back to the meeting point.` },
    ];
  }

  return [
    { title: "Morning Pickup", description: `Early morning pickup from your accommodation in ${location}. Comfortable vehicle with air conditioning. Your guide will outline the day ahead.` },
    { title: "First Stop", description: `Arrive at the first highlight of the ${title.toLowerCase()}. Explore the area with your expert guide who knows every hidden corner and story.` },
    { title: "Mid-Morning Activity", description: "Continue to the next point of interest. Engage in the main activity of the tour with hands-on experiences and photo opportunities." },
    { title: "Lunch", description: `Traditional Georgian lunch at a carefully selected local restaurant. Enjoy regional specialties and homemade wine. Dietary requirements accommodated with advance notice.` },
    { title: "Afternoon Exploration", description: "After lunch, continue with the afternoon program. Visit additional sites and experience the best of what this tour has to offer." },
    { title: "Return Journey", description: `Scenic drive back to ${location} with a final photo stop along the way. Arrive by late afternoon/evening. Drop-off at your accommodation.` },
  ];
}

async function main(): Promise<void> {
  console.log("🗺️  Starting itinerary seeding...\n");

  const tours = await prisma.tour.findMany({
    select: {
      id: true,
      title: true,
      city: true,
      durationMinutes: true,
      itinerary: true,
    },
  });

  console.log(`Found ${tours.length} tours in the database.\n`);

  let updated = 0;
  let skipped = 0;

  for (const tour of tours) {
    // Skip tours that already have itinerary data
    if (tour.itinerary) {
      console.log(`⏭️  Skipping "${tour.title}" — already has itinerary`);
      skipped++;
      continue;
    }

    // Use specific itinerary if available, otherwise generate a generic one
    const itinerary = ITINERARIES[tour.title]
      ?? generateGenericItinerary(tour.title, tour.city, tour.durationMinutes);

    await prisma.tour.update({
      where: { id: tour.id },
      data: {
        itinerary: JSON.stringify(itinerary),
      },
    });

    console.log(`✅ Added ${itinerary.length}-step itinerary to "${tour.title}"`);
    updated++;
  }

  console.log(`\n🎉 Done! Updated: ${updated}, Skipped: ${skipped}, Total: ${tours.length}`);
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
