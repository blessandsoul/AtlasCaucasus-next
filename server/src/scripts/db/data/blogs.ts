/**
 * Blog post seed data for Atlas Caucasus
 * Georgian tourism-focused content
 */

export interface BlogSeedData {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  isPublished: boolean;
  viewCount: number;
  /** Index into seed-assets images (1070-1101 range) */
  imageIndex: number;
}

export const BLOG_POSTS: BlogSeedData[] = [
  {
    title: 'Top 10 Must-Visit Destinations in Georgia for 2026',
    excerpt: 'From the snow-capped peaks of Kazbegi to the sun-drenched vineyards of Kakheti, discover the destinations that should be on every traveler\'s radar this year.',
    content: `<h2>Georgia: A Gem of the Caucasus</h2>
<p>Georgia has rapidly become one of the most exciting travel destinations in the world. With its stunning mountain landscapes, ancient wine culture, and warm hospitality, this small country packs an incredible punch for travelers of all kinds.</p>

<h3>1. Tbilisi - The Capital of Contrasts</h3>
<p>Start your journey in Tbilisi, where ancient sulfur baths sit beneath a modern glass bridge, and Soviet-era architecture neighbors trendy cafes. Don't miss the old town's winding streets, Narikala Fortress, and the vibrant nightlife scene.</p>

<h3>2. Kazbegi (Stepantsminda)</h3>
<p>The iconic Gergeti Trinity Church perched against the backdrop of Mount Kazbek is perhaps Georgia's most photographed scene. The hike to the church takes about 3 hours and rewards you with breathtaking panoramic views.</p>

<h3>3. Mestia & Ushguli - Svaneti</h3>
<p>The medieval tower houses of Svaneti are a UNESCO World Heritage Site. Mestia serves as the gateway to some of Georgia's best trekking routes, while Ushguli — one of Europe's highest continuously inhabited settlements — feels like stepping back in time.</p>

<h3>4. Signagi - The City of Love</h3>
<p>Perched on a hilltop overlooking the Alazani Valley, Signagi is Georgia's most romantic town. Its cobblestone streets, renovated city walls, and views of the Greater Caucasus make it perfect for a weekend getaway.</p>

<h3>5. Batumi - The Black Sea Pearl</h3>
<p>Georgia's coastal gem combines beach relaxation with bold modern architecture. The Batumi Boulevard, botanical garden, and vibrant nightlife make it a must-visit, especially in summer.</p>

<h3>6. Vardzia - Cave City</h3>
<p>This stunning cave monastery complex carved into the cliffs of Erusheti Mountain dates back to the 12th century. The sheer scale of the site — with over 600 rooms — is awe-inspiring.</p>

<h3>7. Kakheti Wine Region</h3>
<p>Georgia is the birthplace of wine, with 8,000 years of winemaking tradition. Kakheti is the heart of it all, where you can visit family cellars, taste qvevri wine, and enjoy the rolling vineyard landscapes.</p>

<h3>8. David Gareja Monastery</h3>
<p>This 6th-century rock-hewn monastery on the Azerbaijan border offers a unique combination of spiritual history and semi-desert landscapes unlike anything else in Georgia.</p>

<h3>9. Gudauri - Ski Paradise</h3>
<p>Georgia's premier ski resort offers excellent powder, uncrowded slopes, and prices that are a fraction of European Alps resorts. The freeride opportunities here are world-class.</p>

<h3>10. Borjomi - Healing Waters</h3>
<p>Famous for its mineral water, Borjomi is surrounded by lush forests in the Lesser Caucasus. The Borjomi-Kharagauli National Park offers excellent hiking trails through pristine wilderness.</p>`,
    tags: ['destinations', 'travel-guide', 'georgia', 'top-picks'],
    isPublished: true,
    viewCount: 1247,
    imageIndex: 1070,
  },
  {
    title: 'A Complete Guide to Georgian Cuisine: What to Eat and Where',
    excerpt: 'Khinkali, khachapuri, and beyond — explore the rich flavors of Georgian cuisine and find the best restaurants to experience them.',
    content: `<h2>Georgian Food: A Culinary Journey</h2>
<p>Georgian cuisine is one of the world's great undiscovered food traditions. Influenced by both European and Asian culinary practices, it has developed into something entirely unique — bold, flavorful, and incredibly generous.</p>

<h3>Khachapuri - The National Dish</h3>
<p>This cheese-filled bread comes in many regional varieties. The Adjarian version — shaped like a boat with a runny egg and butter — is the most famous, but Imeretian (round) and Megrelian (double-cheese) versions are equally delicious.</p>

<h3>Khinkali - Georgian Dumplings</h3>
<p>These juicy dumplings are an art form. Filled with spiced meat (or mushrooms, cheese, or potato), the trick is eating them by hand — grab the top knot, take a small bite, sip the broth, then devour. Never use a fork!</p>

<h3>Churchkhela - Georgian Snickers</h3>
<p>Sometimes called "Georgian Snickers," these candle-shaped treats are made by dipping strings of walnuts in grape juice thickened with flour. You'll see them hanging in markets throughout the country.</p>

<h3>Pkhali - Vegetable Pâté</h3>
<p>A staple of the Georgian supra (feast), pkhali are finely chopped vegetable dishes — spinach, beet, or cabbage — mixed with walnuts, garlic, and herbs. They're shaped into balls and topped with pomegranate seeds.</p>

<h3>The Georgian Supra</h3>
<p>No discussion of Georgian food is complete without mentioning the supra — a traditional feast led by a tamada (toastmaster). Expect dozens of dishes, endless wine, and heartfelt toasts that can last for hours.</p>

<h3>Where to Eat</h3>
<p>In Tbilisi, try Shavi Lomi for modern Georgian, Barbarestan for historic recipes, or any neighborhood dukani for authentic home-style cooking. In the countryside, the best meals are often found in family-run guesthouses.</p>`,
    tags: ['food', 'culture', 'travel-tips', 'georgia'],
    isPublished: true,
    viewCount: 892,
    imageIndex: 1071,
  },
  {
    title: 'Trekking in the Caucasus: Routes for Every Level',
    excerpt: 'Whether you\'re a casual hiker or an experienced mountaineer, the Georgian Caucasus has a trail waiting for you. Here are our top picks for 2026.',
    content: `<h2>The Caucasus Mountains: A Trekker's Paradise</h2>
<p>The Greater Caucasus range stretches across northern Georgia like a natural fortress, offering some of the most spectacular trekking in Europe. From gentle valley walks to challenging alpine crossings, there's something for everyone.</p>

<h3>Beginner: Truso Valley</h3>
<p><strong>Duration:</strong> 4-5 hours round trip<br><strong>Difficulty:</strong> Easy</p>
<p>This gentle valley walk near Kazbegi follows the Terek River through a stunning gorge. You'll pass mineral springs, abandoned villages, and travertine formations. The trail is mostly flat and well-marked.</p>

<h3>Intermediate: Juta to Roshka (Chaukhi Pass)</h3>
<p><strong>Duration:</strong> 2 days<br><strong>Difficulty:</strong> Moderate</p>
<p>This classic route crosses the dramatic Chaukhi Pass (3,338m) between two beautiful valleys. The Chaukhi Massif's jagged rock towers are reminiscent of the Dolomites, and the wildflower meadows in summer are unforgettable.</p>

<h3>Advanced: Mestia to Ushguli</h3>
<p><strong>Duration:</strong> 4 days<br><strong>Difficulty:</strong> Moderate-Hard</p>
<p>The crown jewel of Georgian trekking. This route winds through Svaneti's medieval villages, crosses high mountain passes, and culminates in Ushguli with views of Mount Shkhara (5,193m), Georgia's highest peak.</p>

<h3>Expert: Tusheti - Omalo to Shatili</h3>
<p><strong>Duration:</strong> 5-7 days<br><strong>Difficulty:</strong> Hard</p>
<p>This remote crossing through the eastern Caucasus is for experienced trekkers only. The route traverses the wild Tusheti and Khevsureti regions, passing through some of Georgia's most isolated and beautiful landscapes.</p>

<h3>Essential Tips</h3>
<ul>
<li>Best season: Mid-June to mid-September</li>
<li>Always carry rain gear — mountain weather changes fast</li>
<li>Register with local rescue services for remote treks</li>
<li>Hire a local guide for routes above 3,000m</li>
<li>Bring cash — there are no ATMs in remote valleys</li>
</ul>`,
    tags: ['trekking', 'adventure', 'mountains', 'outdoor'],
    isPublished: true,
    viewCount: 1534,
    imageIndex: 1072,
  },
  {
    title: 'Georgian Wine: 8,000 Years of Tradition',
    excerpt: 'Discover the world\'s oldest winemaking tradition, from ancient qvevri clay vessels to modern natural wine movements.',
    content: `<h2>The Birthplace of Wine</h2>
<p>Archaeological evidence shows that wine was first made in Georgia around 6000 BC, making it the world's oldest wine-producing region. Today, Georgian wine is experiencing a renaissance, with qvevri (clay vessel) wines gaining international acclaim.</p>

<h3>Qvevri: The Ancient Method</h3>
<p>The traditional Georgian winemaking method uses large clay vessels called qvevri, which are buried underground. Grapes — skins, seeds, and stems included — ferment naturally in these vessels for months. The result is amber-colored wine with complex, tannic flavors unlike anything produced elsewhere.</p>
<p>In 2013, UNESCO added the qvevri winemaking method to its Intangible Cultural Heritage list.</p>

<h3>Key Grape Varieties</h3>
<p>Georgia has over 500 indigenous grape varieties — more than almost any other country. The most important include:</p>
<ul>
<li><strong>Saperavi</strong> — Georgia's flagship red grape, producing deep, full-bodied wines</li>
<li><strong>Rkatsiteli</strong> — The most widely planted white grape, versatile and food-friendly</li>
<li><strong>Mtsvane</strong> — A delicate white grape, often blended with Rkatsiteli</li>
<li><strong>Kisi</strong> — A rare white grape making a comeback in amber wines</li>
</ul>

<h3>Wine Regions</h3>
<p><strong>Kakheti</strong> produces 70% of Georgia's wine and is the must-visit region. Key spots include Sighnaghi, Telavi, Tsinandali, and Kvareli. Many family cellars (marani) welcome visitors for tastings.</p>
<p><strong>Kartli</strong> (around Gori) and <strong>Imereti</strong> (around Kutaisi) offer excellent wines in less touristy settings.</p>

<h3>Wine Tasting Tips</h3>
<p>Join a wine tour or simply knock on doors in Kakheti villages — most families make their own wine and are happy to share. Many guesthouses include wine with meals. For a curated experience, visit the Wine Museum in Sighnaghi or the Château Mukhrani estate near Tbilisi.</p>`,
    tags: ['wine', 'culture', 'kakheti', 'traditions'],
    isPublished: true,
    viewCount: 756,
    imageIndex: 1073,
  },
  {
    title: 'How to Plan the Perfect Road Trip Through Georgia',
    excerpt: 'A practical guide to renting cars, navigating Georgian roads, fuel stops, and the best routes to explore this beautiful country at your own pace.',
    content: `<h2>Road Tripping in Georgia</h2>
<p>Georgia is a road tripper's dream. The country is small enough to drive across in a day, but varied enough that you could spend weeks exploring. From the Military Highway to the coastal road, here's everything you need to know.</p>

<h3>Getting a Car</h3>
<p>Rental agencies are plentiful in Tbilisi and Batumi. International companies like Hertz and Budget operate alongside reliable local firms. Expect to pay $30-60/day for a standard SUV. An SUV is recommended — some of Georgia's best destinations require unpaved mountain roads.</p>

<h3>Road Conditions</h3>
<p>Main highways between cities are generally good. The road from Tbilisi to Batumi is a modern highway. However, mountain roads — especially in Svaneti, Tusheti, and parts of Kakheti — can be rough, narrow, and sometimes unpaved. Check conditions before heading to remote areas.</p>

<h3>Suggested Routes</h3>

<h4>Route 1: The Georgian Military Highway (2-3 days)</h4>
<p>Tbilisi → Mtskheta → Ananuri → Gudauri → Kazbegi. This iconic route follows the Aragvi and Terek rivers through dramatic mountain scenery. Stop at the Ananuri fortress and the Friendship Monument along the way.</p>

<h4>Route 2: Kakheti Wine Loop (2-3 days)</h4>
<p>Tbilisi → Sighnaghi → Telavi → Tsinandali → Kvareli → Lagodekhi → Tbilisi. Combine wine tasting with monastery visits and stunning valley views. Perfect for food and wine lovers.</p>

<h4>Route 3: Western Georgia (5-7 days)</h4>
<p>Tbilisi → Kutaisi → Martvili Canyon → Mestia → Ushguli → Batumi. This longer route covers cave cities, canyons, medieval Svaneti, and the Black Sea coast.</p>

<h3>Practical Tips</h3>
<ul>
<li>Drive on the right side of the road</li>
<li>Georgian drivers can be aggressive — stay alert</li>
<li>Fill up at every gas station in mountain areas</li>
<li>Carry cash for tolls and remote village guesthouses</li>
<li>Download offline maps — mobile coverage is spotty in mountains</li>
</ul>`,
    tags: ['road-trip', 'travel-tips', 'planning', 'transportation'],
    isPublished: true,
    viewCount: 623,
    imageIndex: 1074,
  },
  {
    title: 'Svaneti: Georgia\'s Last Wild Frontier',
    excerpt: 'Medieval tower houses, glacier-fed rivers, and Europe\'s most dramatic mountain scenery — welcome to Svaneti, Georgia\'s wildest region.',
    content: `<h2>Svaneti: Where Time Stands Still</h2>
<p>Tucked away in the northwest corner of Georgia, Svaneti is one of Europe's most remote and dramatically beautiful regions. Its medieval stone tower houses, towering peaks, and fierce cultural traditions make it feel like another world entirely.</p>

<h3>History and Culture</h3>
<p>The Svans are one of Georgia's most ancient ethnic groups, with their own language and customs. Their iconic tower houses — some over 1,000 years old — were built for defense during times of conflict and blood feuds. Today, many still stand as a testament to Svaneti's turbulent but fascinating history.</p>

<h3>Mestia: Gateway to Svaneti</h3>
<p>The regional capital has transformed in recent years with new hotels, restaurants, and a small airport. The Svaneti Museum of History and Ethnography houses an impressive collection of medieval icons and manuscripts. Don't miss the Mestia towers lit up at sunset.</p>

<h3>Ushguli: Europe's Highest Village</h3>
<p>At 2,200 meters elevation, Ushguli is one of the highest continuously inhabited settlements in Europe. The cluster of stone towers against the backdrop of Mount Shkhara (5,193m) is one of Georgia's most iconic images. The drive from Mestia takes 2-3 hours on a rough mountain road.</p>

<h3>Activities</h3>
<ul>
<li><strong>Trekking:</strong> The Mestia to Ushguli 4-day trek is world-famous</li>
<li><strong>Skiing:</strong> Tetnuldi and Hatsvali ski resorts offer uncrowded slopes</li>
<li><strong>Glacier hiking:</strong> Visit the Chalaadi Glacier near Mestia</li>
<li><strong>Cultural tours:</strong> Visit tower houses, ancient churches, and local craftsmen</li>
</ul>

<h3>Getting There</h3>
<p>Fly from Tbilisi to Mestia (1 hour, weather-dependent) or drive via Zugdidi (5-6 hours). The road has been significantly improved but remains scenic and winding. Marshrutka (minibus) service runs daily from Zugdidi.</p>`,
    tags: ['svaneti', 'adventure', 'mountains', 'culture'],
    isPublished: true,
    viewCount: 1089,
    imageIndex: 1075,
  },
  {
    title: 'Budget Travel in Georgia: How to Explore for Under $50/Day',
    excerpt: 'Georgia is one of Europe\'s most affordable destinations. Here\'s how to stretch your budget without missing any of the magic.',
    content: `<h2>Georgia on a Budget</h2>
<p>Georgia offers incredible value for travelers. With affordable accommodation, cheap and delicious food, and reasonable transport costs, it's possible to have an amazing trip for a fraction of what you'd spend in Western Europe.</p>

<h3>Accommodation: $8-25/night</h3>
<p>Hostels in Tbilisi start at $8-12 per night for a dorm bed. Private rooms in guesthouses across the country run $15-25. In rural areas, family-run guesthouses often include dinner and breakfast for $20-30 per person — an incredible deal.</p>

<h3>Food: $8-15/day</h3>
<p>Eating well in Georgia is remarkably cheap. A plate of khinkali (dumplings) costs about $2. Khachapuri ranges from $1.50 to $4. A full meal at a local restaurant rarely exceeds $8. Street food — lobiani (bean-filled bread), churchkhela, fresh fruit — costs even less.</p>

<h3>Transport: $5-15/day</h3>
<p>Marshrutkas (minibuses) connect all major towns for $2-8. The Tbilisi metro costs just $0.20 per ride. Taxis are cheap — use Bolt or Maxim apps for fair prices. A taxi across Tbilisi rarely costs more than $3-5.</p>

<h3>Free and Cheap Activities</h3>
<ul>
<li>Walking tours of Tbilisi Old Town (free/tip-based)</li>
<li>Visiting most churches and monasteries (free)</li>
<li>Hiking in national parks (free or $1-2 entrance)</li>
<li>Sulfur baths in Abanotubani ($3-8)</li>
<li>Wine tasting at family cellars (often free)</li>
<li>Tbilisi flea market at Dry Bridge (free)</li>
</ul>

<h3>Money-Saving Tips</h3>
<ul>
<li>Cook at local markets — fresh produce is incredibly cheap</li>
<li>Use marshrutkas instead of private transfers</li>
<li>Travel in shoulder season (May-June, September-October)</li>
<li>Ask locals for recommendations — tourist-facing restaurants are pricier</li>
<li>Carry cash in rural areas</li>
</ul>

<h3>Sample Daily Budget</h3>
<p><strong>Budget ($30-40/day):</strong> Hostel/guesthouse + local restaurants + marshrutka</p>
<p><strong>Mid-range ($60-100/day):</strong> Hotel + nicer restaurants + rental car</p>
<p><strong>Comfort ($120+/day):</strong> Boutique hotel + fine dining + guided tours</p>`,
    tags: ['budget', 'travel-tips', 'planning', 'backpacking'],
    isPublished: true,
    viewCount: 2103,
    imageIndex: 1076,
  },
  {
    title: 'The Ultimate Guide to Tbilisi Neighborhoods',
    excerpt: 'From the bohemian streets of Vera to the historic charm of Abanotubani, explore Tbilisi\'s most fascinating neighborhoods.',
    content: `<h2>Tbilisi: A City of Neighborhoods</h2>
<p>Tbilisi is a city best explored on foot, neighborhood by neighborhood. Each district has its own character, from the ancient to the ultramodern. Here's your guide to the capital's most interesting areas.</p>

<h3>Old Town (Kala)</h3>
<p>The historic heart of Tbilisi, with narrow cobblestone streets, colorful wooden balconies, and hidden courtyards. Key sights include Narikala Fortress, Anchiskhati Basilica (6th century), and the sulfur baths of Abanotubani. Best explored on foot — get lost in the alleyways.</p>

<h3>Rustaveli Avenue</h3>
<p>Tbilisi's main boulevard is lined with grand 19th-century buildings, theaters, museums, and upscale shops. The Georgian National Museum, Parliament building, and Rustaveli Theatre are all here. It's the place to people-watch with a coffee.</p>

<h3>Vera</h3>
<p>The bohemian heart of Tbilisi. Narrow streets, independent cafes, vintage shops, and street art define this neighborhood. Vera attracts artists, students, and young professionals. The farmer's market on weekends is excellent.</p>

<h3>Vake</h3>
<p>Tbilisi's upscale residential district has wide tree-lined streets, elegant apartments, and excellent restaurants. Vake Park is perfect for a morning jog, and the area has some of the city's best brunch spots.</p>

<h3>Fabrika (Marjanishvili)</h3>
<p>Once a Soviet sewing factory, Fabrika has been transformed into Tbilisi's coolest social hub — a hostel, coworking space, bar, and courtyard venue all in one. The surrounding Marjanishvili area has great street art and a thriving cafe scene.</p>

<h3>Sololaki</h3>
<p>Quiet and residential, Sololaki sits on the slopes below Mtatsminda. Its Art Nouveau buildings and peaceful atmosphere make it one of the most photogenic areas. Take the funicular up to Mtatsminda Park for panoramic city views.</p>`,
    tags: ['tbilisi', 'city-guide', 'neighborhoods', 'culture'],
    isPublished: true,
    viewCount: 945,
    imageIndex: 1077,
  },
  {
    title: 'Skiing in Georgia: Why Gudauri Should Be Your Next Winter Destination',
    excerpt: 'Affordable lift passes, incredible powder, and no crowds — here\'s why Georgia\'s ski resorts are Europe\'s best-kept secret.',
    content: `<h2>Georgia's Ski Revolution</h2>
<p>While the world flocks to the Alps, savvy skiers and snowboarders are discovering Georgia's incredible mountain resorts. With modern infrastructure, reliable snow, and prices that will make you smile, Georgian skiing is a revelation.</p>

<h3>Gudauri: The Main Event</h3>
<p>Located just 2 hours from Tbilisi on the Georgian Military Highway, Gudauri is the country's premier ski resort. At 2,196m base elevation (top station 3,279m), snow coverage is reliable from December through April.</p>
<p><strong>Stats:</strong> 70km of marked runs, 16 lifts, 1,000m+ vertical drop</p>
<p><strong>Lift pass:</strong> ~$15-20/day (compared to $60+ in European Alps)</p>

<h3>Freeride Paradise</h3>
<p>Gudauri has gained an international reputation for its off-piste terrain. The wide-open bowls above the resort offer some of the best accessible backcountry skiing in the Caucasus. Heli-skiing is also available for those seeking untouched powder.</p>

<h3>Bakuriani: Family Friendly</h3>
<p>This lower-elevation resort (1,700m) in the Lesser Caucasus is perfect for families and beginners. Gentler slopes, a charming village atmosphere, and excellent cross-country skiing trails make it a relaxing alternative to Gudauri.</p>

<h3>Tetnuldi: The New Frontier</h3>
<p>Svaneti's newest resort opened in 2016 and offers something truly special — skiing with views of 5,000m+ peaks. The resort is still developing but already has excellent long runs and virtually zero crowds.</p>

<h3>What to Expect</h3>
<ul>
<li>Modern gondolas and chairlifts (Gudauri has been upgraded significantly)</li>
<li>Affordable equipment rental ($10-15/day)</li>
<li>Excellent après-ski food (khinkali and wine after skiing!)</li>
<li>Short transfer times from Tbilisi</li>
<li>Generally uncrowded slopes, even on weekends</li>
</ul>`,
    tags: ['skiing', 'winter', 'gudauri', 'adventure'],
    isPublished: true,
    viewCount: 567,
    imageIndex: 1078,
  },
  {
    title: 'Understanding Georgian Polyphonic Singing: A UNESCO Treasure',
    excerpt: 'Georgia\'s ancient tradition of polyphonic singing is one of humanity\'s oldest musical forms. Learn about this haunting art that brings audiences to tears.',
    content: `<h2>The Sound of Georgia</h2>
<p>In 2001, Georgian polyphonic singing was among the very first traditions recognized by UNESCO as a Masterpiece of Intangible Heritage of Humanity. This ancient musical form — where multiple voices weave together in complex harmonies — is unlike anything else on Earth.</p>

<h3>What is Polyphonic Singing?</h3>
<p>Georgian polyphony involves three vocal parts singing simultaneously: the top voice (mtkhroli) carries the melody, the middle voice (mtkmeli) provides the countermelody, and the bass voice (bani) creates the foundation. The harmonies are often dissonant by Western standards, creating an otherworldly, deeply emotional sound.</p>

<h3>Regional Styles</h3>
<p>Each region of Georgia has its own polyphonic tradition:</p>
<ul>
<li><strong>Kakheti:</strong> Complex, ornate melodies with elaborate vocal ornamentation</li>
<li><strong>Svaneti:</strong> Powerful, archaic harmonies with the sharpest dissonances</li>
<li><strong>Guria:</strong> The yodeling tradition of "krimanchuli" — incredibly complex and energetic</li>
<li><strong>Kartli-Kakheti:</strong> Work songs, table songs, and sacred music</li>
</ul>

<h3>Where to Hear It</h3>
<p>Polyphonic singing is still very much alive in Georgia. You might hear it at a supra (feast), in a church service, or at cultural events. In Tbilisi, visit the Georgian National Singing Center or attend a performance at the Tbilisi Opera House. In rural areas, ask your guesthouse host — many villages have singing groups that practice regularly.</p>

<h3>The Voyager Connection</h3>
<p>In 1977, a Georgian folk song — "Chakrulo" — was included on the Voyager Golden Record sent into space as a representation of Earth's musical heritage. It's literally the sound of humanity reaching for the stars.</p>`,
    tags: ['culture', 'music', 'traditions', 'heritage'],
    isPublished: true,
    viewCount: 421,
    imageIndex: 1079,
  },
  {
    title: 'Photography Guide: Capturing Georgia\'s Most Stunning Landscapes',
    excerpt: 'From golden hour at Gergeti Trinity Church to starry skies over Tusheti, here are the best photography spots and tips for shooting Georgia.',
    content: `<h2>Georgia Through the Lens</h2>
<p>Few countries offer photographers such diverse and dramatic subjects as Georgia. Ancient monasteries against mountain backdrops, colorful Tbilisi balconies, vast vineyard landscapes, and remote medieval villages — it's a photographer's playground.</p>

<h3>Golden Hour Spots</h3>

<h4>Gergeti Trinity Church, Kazbegi</h4>
<p>The most iconic shot in Georgia. Best photographed at sunrise when the first light hits Mount Kazbek behind the church. Arrive early to beat the crowds and catch the mist clearing from the valley below.</p>

<h4>Narikala Fortress, Tbilisi</h4>
<p>Sunset from the fortress walls offers panoramic views over old Tbilisi with the Mtkvari River winding below. The warm light turns the city's colorful buildings into gold.</p>

<h4>Ushguli Towers, Svaneti</h4>
<p>The medieval towers against the snow-capped Shkhara peak are best shot in late afternoon when the light is warm and the shadows add depth to the stone structures.</p>

<h3>Blue Hour & Night</h3>

<h4>Bridge of Peace, Tbilisi</h4>
<p>The glass bridge illuminates beautifully at dusk. Shoot from the riverbank for reflections, or from the bridge itself for old town views.</p>

<h4>Tusheti Starscapes</h4>
<p>With virtually no light pollution, Tusheti offers some of the best astrophotography opportunities in Europe. The Milky Way arcs perfectly over the ancient tower houses of Dartlo village in summer.</p>

<h3>Essential Tips</h3>
<ul>
<li>Bring a wide-angle lens for mountain landscapes and church interiors</li>
<li>A telephoto (70-200mm) is invaluable for compressing mountain layers</li>
<li>Weather changes fast — always have your camera ready</li>
<li>Drone regulations are relaxed but check restricted zones near borders</li>
<li>Ask permission before photographing people, especially in rural areas</li>
<li>The best light is typically September-October when autumn colors peak</li>
</ul>`,
    tags: ['photography', 'travel-tips', 'landscapes', 'destinations'],
    isPublished: true,
    viewCount: 834,
    imageIndex: 1080,
  },
  {
    title: 'Batumi: From Soviet Resort to Modern Marvel',
    excerpt: 'How Georgia\'s Black Sea capital reinvented itself with bold architecture, vibrant nightlife, and a unique blend of old and new.',
    content: `<h2>Batumi's Remarkable Transformation</h2>
<p>Once a fading Soviet-era resort town, Batumi has undergone one of the most dramatic urban transformations in the post-Soviet world. Today it's a vibrant, confident city that blends bold modern architecture with old-world Adjarian charm.</p>

<h3>The New Batumi</h3>
<p>The city's skyline is now punctuated by eye-catching buildings: the rotating Alphabetic Tower, the futuristic Batumi Tower, and the moving Ali and Nino statue on the boulevard. Love them or not, they've given Batumi a distinctive identity.</p>

<h3>The Boulevard</h3>
<p>Stretching 7km along the seafront, Batumi Boulevard is the city's social hub. Lined with parks, fountains, cafes, and public art, it's perfect for evening strolls. The dancing fountains show near the lake is a nightly highlight.</p>

<h3>Old Town</h3>
<p>Behind the modern facade, Batumi's old town retains its charm. Narrow streets with ornate 19th-century buildings, the Piazza Square (a Venice-inspired plaza), and the bustling fish market offer a glimpse of the city's history.</p>

<h3>Adjarian Cuisine</h3>
<p>Batumi is the best place to try Adjarian cuisine, which has distinct Turkish and Middle Eastern influences. Must-tries include Adjarian khachapuri (the boat-shaped version), borano (cheese fondue), and sinori (rolled cottage cheese crepes).</p>

<h3>Day Trips</h3>
<ul>
<li><strong>Botanical Garden:</strong> 111 hectares of subtropical gardens overlooking the sea</li>
<li><strong>Gonio Fortress:</strong> Roman-era fortress 15km south of the city</li>
<li><strong>Machakhela National Park:</strong> Lush subtropical forests and waterfalls</li>
<li><strong>Sarpi Border:</strong> Walk to the Turkish border and back in an afternoon</li>
</ul>

<h3>Best Time to Visit</h3>
<p>Summer (June-September) for beach weather and nightlife. May and October for fewer crowds and pleasant temperatures. Winter is quiet but atmospheric, with subtropical gardens still green.</p>`,
    tags: ['batumi', 'city-guide', 'architecture', 'beach'],
    isPublished: true,
    viewCount: 678,
    imageIndex: 1081,
  },
];

export const KA_BLOG_POSTS: BlogSeedData[] = [
  {
    title: 'საქართველოს 10 საუკეთესო ღირშესანიშნაობა 2026 წელს',
    excerpt: 'ყაზბეგის თოვლიანი მწვერვალებიდან კახეთის მზით მოსხმულ ვენახებამდე — აღმოაჩინეთ ის ადგილები, რომლებიც ყველა მოგზაურის სიაში უნდა იყოს.',
    content: `<h2>საქართველო: კავკასიის მარგალიტი</h2>
<p>საქართველო სწრაფად იქცა მსოფლიოს ერთ-ერთ ყველაზე საინტერესო ტურისტულ მიმართულებად. მისი განსაცვიფრებელი მთის ლანდშაფტები, უძველესი ღვინის კულტურა და თბილი სტუმართმოყვარეობა ამ პატარა ქვეყანას წარმოუდგენელ მიმზიდველობას ანიჭებს.</p>

<h3>1. თბილისი — კონტრასტების დედაქალაქი</h3>
<p>დაიწყეთ მოგზაურობა თბილისში, სადაც უძველესი გოგირდის აბანოები თანამედროვე მინის ხიდის ქვეშ დგას, ხოლო საბჭოთა არქიტექტურა ტრენდულ კაფეებს ეზიარება. არ გამოტოვოთ ძველი ქალაქის ხვეული ქუჩები, ნარიყალას ციხესიმაგრე და ცოცხალი ღამის ცხოვრება.</p>

<h3>2. ყაზბეგი (სტეფანწმინდა)</h3>
<p>გერგეტის სამება, რომელიც ყაზბეგის მთის ფონზე დგას, ალბათ საქართველოს ყველაზე ფოტოგრაფირებადი ხედია. ეკლესიამდე ასვლას დაახლოებით 3 საათი სჭირდება და თქვენ დაგაჯილდოვებთ თვალწარმტაცი პანორამული ხედებით.</p>

<h3>3. მესტია და უშგული — სვანეთი</h3>
<p>სვანეთის შუა საუკუნეების კოშკები იუნესკოს მსოფლიო მემკვიდრეობის ძეგლია. მესტია საქართველოს საუკეთესო სალაშქრო მარშრუტების კარიბჭეა, ხოლო უშგული — ევროპის ერთ-ერთი ყველაზე მაღალი მუდმივად დასახლებული პუნქტი — დროში უკან გადადგმული ნაბიჯივით გრძნობს თავს.</p>

<h3>4. სიღნაღი — სიყვარულის ქალაქი</h3>
<p>ბორცვზე აღმართული სიღნაღი ალაზნის ველს გადაჰყურებს. მისი ქვაფენილი ქუჩები, განახლებული ქალაქის გალავნები და კავკასიონის ხედები მას სრულყოფილ შაბათ-კვირის გასასვლელ ადგილად აქცევს.</p>

<h3>5. ბათუმი — შავი ზღვის მარგალიტი</h3>
<p>საქართველოს სანაპირო ქალაქი სანაპირო დასვენებას თამამ თანამედროვე არქიტექტურასთან აერთიანებს. ბათუმის ბულვარი, ბოტანიკური ბაღი და ცოცხალი ღამის ცხოვრება მას აუცილებლად მოსანახულებელ ადგილად აქცევს.</p>

<h3>6. ვარძია — გამოქვაბულთა ქალაქი</h3>
<p>ერუშეთის მთის კლდეში ნაკვეთი ეს განსაცვიფრებელი სამონასტრო კომპლექსი XII საუკუნით თარიღდება. ობიექტის მასშტაბი — 600-ზე მეტი ოთახით — აღფრთოვანების გრძნობას იწვევს.</p>

<h3>7. კახეთი — ღვინის მხარე</h3>
<p>საქართველო ღვინის სამშობლოა, 8000 წლიანი მეღვინეობის ტრადიციით. კახეთი ამ ყველაფრის გულია, სადაც შეგიძლიათ საოჯახო მარნების მონახულება, ქვევრის ღვინის დაგემოვნება და ვენახის ლანდშაფტებით ტკბობა.</p>

<h3>8. დავით გარეჯა</h3>
<p>ეს VI საუკუნის კლდეში ნაკვეთი მონასტერი აზერბაიჯანის საზღვარზე სულიერი ისტორიისა და ნახევრადუდაბნო ლანდშაფტის უნიკალურ შერწყმას გვთავაზობს.</p>

<h3>9. გუდაური — სათხილამურო სამოთხე</h3>
<p>საქართველოს პრემიერ სათხილამურო კურორტი შესანიშნავ ფხვიერ თოვლს, თავისუფალ ტრასებს და ევროპული ალპების ფასების მცირე ნაწილს სთავაზობს მოთხილამურეებს.</p>

<h3>10. ბორჯომი — სამკურნალო წყლები</h3>
<p>მინერალური წყლით სახელგანთქმული ბორჯომი მცირე კავკასიონის უხვ ტყეებშია ჩაფლული. ბორჯომ-ხარაგაულის ეროვნული პარკი ხელუხლებელ ველურ ბუნებაში შესანიშნავ სალაშქრო ბილიკებს გთავაზობთ.</p>`,
    tags: ['ღირშესანიშნაობები', 'მოგზაურობის-გზამკვლევი', 'საქართველო', 'ტოპ-არჩევანი'],
    isPublished: true,
    viewCount: 1183,
    imageIndex: 1082,
  },
  {
    title: 'ქართული სამზარეულოს სრული გზამკვლევი: რა ჭამოთ და სად',
    excerpt: 'ხინკალი, ხაჭაპური და მეტი — აღმოაჩინეთ ქართული სამზარეულოს მდიდარი არომატები და საუკეთესო რესტორნები.',
    content: `<h2>ქართული სამზარეულო: კულინარიული მოგზაურობა</h2>
<p>ქართული სამზარეულო მსოფლიოს ერთ-ერთი უდიდესი აღმოუჩენელი კულინარიული ტრადიციაა. ევროპული და აზიური კულინარიული პრაქტიკის გავლენით, იგი სრულიად უნიკალურ, თამამ და წარმოუდგენლად გულუხვ სამზარეულოდ ჩამოყალიბდა.</p>

<h3>ხაჭაპური — ეროვნული კერძი</h3>
<p>ეს ყველით სავსე პური მრავალი რეგიონალური სახეობით მოდის. აჭარული ვერსია — ნავის ფორმის, თხევადი კვერცხითა და კარაქით — ყველაზე ცნობილია, მაგრამ იმერული (მრგვალი) და მეგრული (ორმაგი ყველით) ვერსიებიც თანაბრად გემრიელია.</p>

<h3>ხინკალი — ქართული პელმენები</h3>
<p>ეს წვნიანი პელმენები ნამდვილი ხელოვნებაა. სანელებლიანი ხორცით (ან სოკოთი, ყველით, კარტოფილით) გატენილი ხინკლის ჭამის ხელოვნება ასეთია — აიღეთ კუდით, პატარა ნაკბენი გააკეთეთ, წვენი მოწოვეთ, შემდეგ შეჭამეთ. არასდროს გამოიყენოთ ჩანგალი!</p>

<h3>ჩურჩხელა — ქართული სნიკერსი</h3>
<p>ეს სანთლის ფორმის ტკბილეული კაკლის ძაფის ყურძნის წვენში ამოვლებით მზადდება, რომელიც ფქვილით სქელდება. მათ ბაზრებზე ჩამოკიდებულს ნახავთ მთელ ქვეყანაში.</p>

<h3>ფხალი — ბოსტნეულის პატე</h3>
<p>ქართული სუფრის აუცილებელი კერძი, ფხალი წვრილად დაჭრილი ბოსტნეულისგან — ისპანახი, ჭარხალი ან კომბოსტო — ნიგვზით, ნივრითა და მწვანილით მზადდება. ისინი ბურთულების ფორმას იღებენ და ბროწეულის მარცვლებით იფერება.</p>

<h3>ქართული სუფრა</h3>
<p>ქართულ სამზარეულოზე საუბარი სუფრის — ტრადიციული ნადიმის — ხსენების გარეშე შეუძლებელია. თამადის ხელმძღვანელობით, მოელით ათობით კერძს, დაუსრულებელ ღვინოს და გულწრფელ სადღეგრძელოებს, რომლებიც საათობით გრძელდება.</p>

<h3>სად ჭამოთ</h3>
<p>თბილისში სცადეთ შავი ლომი თანამედროვე ქართულისთვის, ბარბარესთანი ისტორიული რეცეპტებისთვის, ან ნებისმიერი სამეზობლო დუქანი ავთენტური სახლის სტილის საჭმლისთვის. სოფლებში, საუკეთესო კერძები ხშირად საოჯახო სასტუმრო სახლებში მოიძებნება.</p>`,
    tags: ['საჭმელი', 'კულტურა', 'მოგზაურობის-რჩევები', 'საქართველო'],
    isPublished: true,
    viewCount: 847,
    imageIndex: 1083,
  },
  {
    title: 'კავკასიონში ლაშქრობა: მარშრუტები ყველა დონისთვის',
    excerpt: 'მოყვარული მოლაშქრე ხართ თუ გამოცდილი ალპინისტი, ქართულ კავკასიონში თქვენი ბილიკი გელოდებათ.',
    content: `<h2>კავკასიონი: მოლაშქრის სამოთხე</h2>
<p>დიდი კავკასიონის ქედი საქართველოს ჩრდილოეთით ბუნებრივ ციხესიმაგრესავით გადაჭიმულა და ევროპის ერთ-ერთ ყველაზე სანახაობრივ სალაშქრო ადგილს წარმოადგენს. ხეობის მშვიდი გასეირნებიდან რთულ ალპურ გადასასვლელებამდე, აქ ყველასთვის არის რაღაც.</p>

<h3>დამწყებთათვის: თრუსოს ხეობა</h3>
<p><strong>ხანგრძლივობა:</strong> 4-5 საათი წინ და უკან<br><strong>სირთულე:</strong> მარტივი</p>
<p>ეს მშვიდი ხეობის გასეირნება ყაზბეგთან თერგის მდინარეს მიჰყვება განსაცვიფრებელი ხეობის გავლით. თქვენ გაივლით მინერალურ წყაროებს, მიტოვებულ სოფლებს და ტრავერტინის წარმონაქმნებს.</p>

<h3>საშუალო დონე: ჯუთა-როშკა (ჩაუხის უღელტეხილი)</h3>
<p><strong>ხანგრძლივობა:</strong> 2 დღე<br><strong>სირთულე:</strong> საშუალო</p>
<p>ეს კლასიკური მარშრუტი ჩაუხის დრამატული უღელტეხილის (3,338 მ) გავლით ორ ულამაზეს ხეობას შორის გადის. ჩაუხის მასივის დანაპირალი კლდის კოშკები დოლომიტებს მოგაგონებთ, ხოლო ველური ყვავილების მდელოები ზაფხულში დაუვიწყარია.</p>

<h3>რთული დონე: მესტია-უშგული</h3>
<p><strong>ხანგრძლივობა:</strong> 4 დღე<br><strong>სირთულე:</strong> საშუალო-რთული</p>
<p>ქართული ლაშქრობის გვირგვინი. ეს მარშრუტი სვანეთის შუა საუკუნეების სოფლებს გაივლის, მაღალმთიან უღელტეხილებს კვეთს და უშგულში მთავრდება შხარას მთის (5,193 მ) — საქართველოს უმაღლესი მწვერვალის — ხედებით.</p>

<h3>ექსპერტებისთვის: თუშეთი — ომალო-შატილი</h3>
<p><strong>ხანგრძლივობა:</strong> 5-7 დღე<br><strong>სირთულე:</strong> რთული</p>
<p>ეს მარშრუტი აღმოსავლეთ კავკასიონის მეშვეობით მხოლოდ გამოცდილი მოლაშქრეებისთვისაა. ბილიკი ველურ თუშეთსა და ხევსურეთის რეგიონებს კვეთს, საქართველოს ყველაზე მოწყვეტილ და ულამაზეს ლანდშაფტებს გაგაცნობთ.</p>

<h3>აუცილებელი რჩევები</h3>
<ul>
<li>საუკეთესო სეზონი: ივნისის შუა რიცხვებიდან სექტემბრის შუა რიცხვებამდე</li>
<li>ყოველთვის იქონიეთ წვიმის ტანსაცმელი — მთის ამინდი სწრაფად იცვლება</li>
<li>დარეგისტრირდით ადგილობრივ სამაშველო სამსახურში შორეული ლაშქრობებისთვის</li>
<li>დაიქირავეთ ადგილობრივი გიდი 3,000 მ-ზე მაღალი მარშრუტებისთვის</li>
<li>იქონიეთ ნაღდი ფული — მოშორებულ ხეობებში ბანკომატები არ არის</li>
</ul>`,
    tags: ['ლაშქრობა', 'თავგადასავალი', 'მთები', 'ბუნება'],
    isPublished: true,
    viewCount: 1421,
    imageIndex: 1084,
  },
  {
    title: 'ქართული ღვინო: 8000 წლიანი ტრადიცია',
    excerpt: 'აღმოაჩინეთ მსოფლიოს უძველესი მეღვინეობის ტრადიცია — უძველესი ქვევრის თიხის ჭურჭლიდან თანამედროვე ბუნებრივი ღვინის მოძრაობამდე.',
    content: `<h2>ღვინის სამშობლო</h2>
<p>არქეოლოგიური მტკიცებულებები აჩვენებს, რომ ღვინო საქართველოში პირველად ძვ. წ. 6000 წლისთვის დამზადდა, რაც მას მსოფლიოს უძველეს მეღვინეობის რეგიონად აქცევს. დღეს ქართული ღვინო აღორძინების პერიოდს განიცდის, ქვევრის ღვინოები საერთაშორისო აღიარებას იძენენ.</p>

<h3>ქვევრი: უძველესი მეთოდი</h3>
<p>ტრადიციული ქართული მეღვინეობის მეთოდი იყენებს დიდ თიხის ჭურჭელს — ქვევრს, რომელიც მიწაში არის ჩაფლული. ყურძენი — კანით, წიპწით და ყუნწით ერთად — ამ ჭურჭელში თვეების განმავლობაში ბუნებრივად დუღდება. შედეგი არის ქარვისფერი ღვინო კომპლექსური, მწკლარტე გემოთი, რომელსაც სხვაგან არ წარმოადგენენ.</p>
<p>2013 წელს იუნესკომ ქვევრის მეღვინეობის მეთოდი კაცობრიობის არამატერიალური კულტურული მემკვიდრეობის სიაში შეიტანა.</p>

<h3>ძირითადი ყურძნის ჯიშები</h3>
<p>საქართველოში 500-ზე მეტი ადგილობრივი ყურძნის ჯიშია — თითქმის ნებისმიერ სხვა ქვეყანაზე მეტი. ყველაზე მნიშვნელოვანი მოიცავს:</p>
<ul>
<li><strong>საფერავი</strong> — საქართველოს ფლაგმანი წითელი ყურძნის ჯიში, აწარმოებს მუქ, სხეულოვან ღვინოებს</li>
<li><strong>რქაწითელი</strong> — ყველაზე ფართოდ გავრცელებული თეთრი ყურძნის ჯიში, მრავალმხრივი და საჭმელთან კარგად შეხამებადი</li>
<li><strong>მწვანე</strong> — ნაზი თეთრი ყურძნის ჯიში, ხშირად რქაწითელთან ერთად გამოიყენება</li>
<li><strong>ქისი</strong> — იშვიათი თეთრი ყურძნის ჯიში, რომელიც ქარვისფერ ღვინოებში ბრუნდება</li>
</ul>

<h3>ღვინის რეგიონები</h3>
<p><strong>კახეთი</strong> საქართველოს ღვინის 70%-ს აწარმოებს და აუცილებლად მოსანახულებელი რეგიონია. მთავარი ადგილებია სიღნაღი, თელავი, წინანდალი და ყვარელი. ბევრი საოჯახო მარანი სტუმრებს დეგუსტაციისთვის ღიაა.</p>
<p><strong>ქართლი</strong> (გორის მიდამოებში) და <strong>იმერეთი</strong> (ქუთაისის მიდამოებში) შესანიშნავ ღვინოებს ნაკლებად ტურისტულ გარემოში გთავაზობენ.</p>

<h3>ღვინის დეგუსტაციის რჩევები</h3>
<p>შეუერთდით ღვინის ტურს ან უბრალოდ კარზე მიაკაკუნეთ კახეთის სოფლებში — ოჯახების უმეტესობა საკუთარ ღვინოს აკეთებს და სიამოვნებით გაგიზიარებთ. ბევრი სასტუმრო სახლი კვებასთან ერთად ღვინოსაც გთავაზობთ.</p>`,
    tags: ['ღვინო', 'კულტურა', 'კახეთი', 'ტრადიციები'],
    isPublished: true,
    viewCount: 723,
    imageIndex: 1085,
  },
  {
    title: 'იდეალური საგზაო მოგზაურობის დაგეგმვა საქართველოში',
    excerpt: 'პრაქტიკული გზამკვლევი მანქანის დაქირავების, ქართულ გზებზე ნავიგაციის, საწვავის შევსებისა და საუკეთესო მარშრუტების შესახებ.',
    content: `<h2>საგზაო მოგზაურობა საქართველოში</h2>
<p>საქართველო საგზაო მოგზაურობისთვის იდეალური ქვეყანაა. ის საკმარისად პატარაა, რომ ერთ დღეში გადაკვეთოთ, მაგრამ საკმარისად მრავალფეროვანი, რომ კვირების განმავლობაში გამოიკვლიოთ. სამხედრო გზიდან სანაპირო მაგისტრალამდე, აქ ყველაფერი გეცოდინებათ.</p>

<h3>მანქანის მიღება</h3>
<p>ქირავნობის სააგენტოები უხვადაა თბილისსა და ბათუმში. საერთაშორისო კომპანიები ადგილობრივ სანდო ფირმებთან ერთად მუშაობენ. ჩვეულებრივი ჯიპისთვის მოსალოდნელია $30-60 დღეში. ჯიპი რეკომენდებულია — საქართველოს ზოგიერთ საუკეთესო ადგილამდე მიუსაფარიანი მთის გზები მიდის.</p>

<h3>გზის მდგომარეობა</h3>
<p>ქალაქებს შორის მთავარი მაგისტრალები ძირითადად კარგ მდგომარეობაშია. თბილისი-ბათუმის გზა თანამედროვე მაგისტრალია. თუმცა მთის გზები — განსაკუთრებით სვანეთში, თუშეთში და კახეთის ზოგიერთ ნაწილში — შეიძლება იყოს უხეში, ვიწრო და მიუსაფარიანი.</p>

<h3>რეკომენდებული მარშრუტები</h3>

<h4>მარშრუტი 1: საქართველოს სამხედრო გზა (2-3 დღე)</h4>
<p>თბილისი → მცხეთა → ანანური → გუდაური → ყაზბეგი. ეს ხატოვანი მარშრუტი არაგვისა და თერგის მდინარეებს მიჰყვება დრამატული მთის სცენების გავლით. გაჩერდით ანანურის ციხესთან და მეგობრობის მონუმენტთან.</p>

<h4>მარშრუტი 2: კახეთის ღვინის მარშრუტი (2-3 დღე)</h4>
<p>თბილისი → სიღნაღი → თელავი → წინანდალი → ყვარელი → ლაგოდეხი → თბილისი. ღვინის დეგუსტაცია მონასტრების მონახულებასთან და ხეობის განსაცვიფრებელ ხედებთან ერთად.</p>

<h4>მარშრუტი 3: დასავლეთ საქართველო (5-7 დღე)</h4>
<p>თბილისი → ქუთაისი → მარტვილის კანიონი → მესტია → უშგული → ბათუმი. ეს გრძელი მარშრუტი გამოქვაბულთა ქალაქებს, კანიონებს, შუა საუკუნეების სვანეთსა და შავი ზღვის სანაპიროს მოიცავს.</p>

<h3>პრაქტიკული რჩევები</h3>
<ul>
<li>მართეთ გზის მარჯვენა მხარეს</li>
<li>ქართველი მძღოლები შეიძლება აგრესიული იყვნენ — ყურადღებით იყავით</li>
<li>მთის რაიონებში ყოველ ბენზინგასამართ სადგურზე შეავსეთ საწვავი</li>
<li>იქონიეთ ნაღდი ფული შორეული სოფლების სასტუმრო სახლებისთვის</li>
<li>ჩამოტვირთეთ ოფლაინ რუქები — მთებში მობილური კავშირი არასტაბილურია</li>
</ul>`,
    tags: ['საგზაო-მოგზაურობა', 'მოგზაურობის-რჩევები', 'დაგეგმვა', 'ტრანსპორტი'],
    isPublished: true,
    viewCount: 589,
    imageIndex: 1086,
  },
  {
    title: 'სვანეთი: საქართველოს უკანასკნელი ველური საზღვარი',
    excerpt: 'შუა საუკუნეების კოშკები, მყინვარებით კვებადი მდინარეები და ევროპის ყველაზე დრამატული მთის სცენები — კეთილი იყოს თქვენი მობრძანება სვანეთში.',
    content: `<h2>სვანეთი: სადაც დრო ჩერდება</h2>
<p>საქართველოს ჩრდილო-დასავლეთ კუთხეში მოქცეული სვანეთი ევროპის ერთ-ერთი ყველაზე მოშორებული და დრამატულად ლამაზი რეგიონია. მისი შუა საუკუნეების ქვის კოშკები, ამაღლებული მწვერვალები და მამაცი კულტურული ტრადიციები სხვა სამყაროს შეგრძნებას ქმნის.</p>

<h3>ისტორია და კულტურა</h3>
<p>სვანები საქართველოს ერთ-ერთი ყველაზე უძველესი ეთნიკური ჯგუფია, საკუთარი ენითა და ჩვეულებებით. მათი ხატოვანი კოშკები — ზოგიერთი 1,000 წელზე მეტი ხნისა — კონფლიქტებისა და სისხლის აღების პერიოდში თავდაცვისთვის აშენდა. დღეს ბევრი მათგანი ჯერ კიდევ დგას, როგორც სვანეთის მღელვარე, მაგრამ მომხიბვლელი ისტორიის მოწმობა.</p>

<h3>მესტია: სვანეთის კარიბჭე</h3>
<p>რეგიონის ცენტრი ბოლო წლებში ახალი სასტუმროებით, რესტორნებითა და მცირე აეროპორტით გარდაიქმნა. სვანეთის ისტორიისა და ეთნოგრაფიის მუზეუმში შუა საუკუნეების ხატებისა და ხელნაწერების შთამბეჭდავი კოლექციაა. არ გამოტოვოთ მესტიის კოშკები მზის ჩასვლისას.</p>

<h3>უშგული: ევროპის ყველაზე მაღალი სოფელი</h3>
<p>2,200 მეტრ სიმაღლეზე, უშგული ევროპის ერთ-ერთი ყველაზე მაღალი მუდმივად დასახლებული პუნქტია. ქვის კოშკების ჯგუფი შხარას მთის (5,193 მ) ფონზე საქართველოს ერთ-ერთი ყველაზე ხატოვანი სურათია. მესტიიდან მგზავრობა 2-3 საათს სჭირდება მოუსაფარ მთის გზაზე.</p>

<h3>აქტივობები</h3>
<ul>
<li><strong>ლაშქრობა:</strong> მესტია-უშგულის 4-დღიანი მარშრუტი მსოფლიო მასშტაბით ცნობილია</li>
<li><strong>თხილამურები:</strong> თეთნულდისა და ხაცვალის სათხილამურო კურორტები თავისუფალ ტრასებს გთავაზობთ</li>
<li><strong>მყინვარზე ლაშქრობა:</strong> ეწვიეთ ჩალაადის მყინვარს მესტიასთან</li>
<li><strong>კულტურული ტურები:</strong> მოინახულეთ კოშკები, უძველესი ეკლესიები და ადგილობრივი ხელოსნები</li>
</ul>

<h3>როგორ მიხვიდეთ</h3>
<p>იფრინეთ თბილისიდან მესტიაში (1 საათი, ამინდზე დამოკიდებული) ან იმგზავრეთ მანქანით ზუგდიდის გავლით (5-6 საათი). გზა მნიშვნელოვნად გაუმჯობესდა, მაგრამ კვლავ სანახაობრივი და ხვეული რჩება.</p>`,
    tags: ['სვანეთი', 'თავგადასავალი', 'მთები', 'კულტურა'],
    isPublished: true,
    viewCount: 1034,
    imageIndex: 1087,
  },
  {
    title: 'ბიუჯეტური მოგზაურობა საქართველოში: როგორ მოიარო $50-ზე ნაკლებით დღეში',
    excerpt: 'საქართველო ევროპის ერთ-ერთი ყველაზე ხელმისაწვდომი მიმართულებაა. აი, როგორ გაჭიმოთ ბიუჯეტი ჯადოს გამოტოვების გარეშე.',
    content: `<h2>საქართველო ბიუჯეტით</h2>
<p>საქართველო მოგზაურებს წარმოუდგენელ ფასთა თანაფარდობას სთავაზობს. ხელმისაწვდომი საცხოვრებელით, იაფი და გემრიელი საჭმლითა და გონივრული ტრანსპორტის ხარჯებით, შესაძლებელია საოცარი მოგზაურობა დასავლეთ ევროპაში დახარჯული თანხის მცირე ნაწილით.</p>

<h3>საცხოვრებელი: $8-25/ღამეში</h3>
<p>ჰოსტელები თბილისში $8-12-დან იწყება საერთო ოთახში ერთი ადგილისთვის. კერძო ოთახები სასტუმრო სახლებში მთელი ქვეყნის მასშტაბით $15-25 ღირს. სოფლის რაიონებში საოჯახო სასტუმრო სახლები ხშირად ვახშამსა და საუზმეს $20-30-ად სთავაზობენ ერთ ადამიანს — წარმოუდგენლად კარგი შეთავაზება.</p>

<h3>საჭმელი: $8-15/დღეში</h3>
<p>საქართველოში კარგად ჭამა საოცრად იაფია. ერთი პორცია ხინკალი დაახლოებით $2 ღირს. ხაჭაპური $1.50-დან $4-მდე მერყეობს. სრული კვება ადგილობრივ რესტორანში იშვიათად აღემატება $8-ს. ქუჩის საჭმელი — ლობიანი, ჩურჩხელა, ახალი ხილი — კიდევ უფრო ნაკლები ღირს.</p>

<h3>ტრანსპორტი: $5-15/დღეში</h3>
<p>სამარშრუტო ტაქსები (მიკროავტობუსები) ყველა ძირითად ქალაქს $2-8-ად აკავშირებს. თბილისის მეტრო მხოლოდ $0.20 ღირს ერთი მგზავრობისთვის. ტაქსები იაფია — გამოიყენეთ Bolt ან Maxim აპები სამართლიანი ფასებისთვის.</p>

<h3>უფასო და იაფი აქტივობები</h3>
<ul>
<li>თბილისის ძველი ქალაქის ფეხით ტურები (უფასო/ჩაის ფულზე)</li>
<li>ეკლესიებისა და მონასტრების მონახულება (უფასო)</li>
<li>ლაშქრობა ეროვნულ პარკებში (უფასო ან $1-2 შესასვლელი)</li>
<li>გოგირდის აბანოები აბანოთუბანში ($3-8)</li>
<li>ღვინის დეგუსტაცია საოჯახო მარნებში (ხშირად უფასო)</li>
<li>თბილისის ბაზრობა მშრალ ხიდთან (უფასო)</li>
</ul>

<h3>ფულის დაზოგვის რჩევები</h3>
<ul>
<li>იყიდეთ პროდუქტები ადგილობრივ ბაზრებზე — ახალი პროდუქცია წარმოუდგენლად იაფია</li>
<li>გამოიყენეთ სამარშრუტო ტაქსები კერძო ტრანსფერების ნაცვლად</li>
<li>იმგზავრეთ არა-სეზონზე (მაისი-ივნისი, სექტემბერი-ოქტომბერი)</li>
<li>ადგილობრივებს ჰკითხეთ რეკომენდაციები — ტურისტულ რესტორნებში უფრო ძვირია</li>
<li>მთის რაიონებში ნაღდი ფული იქონიეთ</li>
</ul>

<h3>სავარაუდო დღიური ბიუჯეტი</h3>
<p><strong>ბიუჯეტური ($30-40/დღეში):</strong> ჰოსტელი/სასტუმრო სახლი + ადგილობრივი რესტორნები + სამარშრუტო ტაქსი</p>
<p><strong>საშუალო ($60-100/დღეში):</strong> სასტუმრო + უკეთესი რესტორნები + ნაქირავები მანქანა</p>
<p><strong>კომფორტული ($120+/დღეში):</strong> ბუტიკ-სასტუმრო + მაღალი კლასის რესტორნები + გიდიანი ტურები</p>`,
    tags: ['ბიუჯეტი', 'მოგზაურობის-რჩევები', 'დაგეგმვა', 'ბექპეკინგი'],
    isPublished: true,
    viewCount: 1987,
    imageIndex: 1088,
  },
  {
    title: 'თბილისის უბნების გზამკვლევი',
    excerpt: 'ვერას ბოჰემური ქუჩებიდან აბანოთუბნის ისტორიულ ხიბლამდე — აღმოაჩინეთ თბილისის ყველაზე მომხიბვლელი უბნები.',
    content: `<h2>თბილისი: უბნების ქალაქი</h2>
<p>თბილისი ქალაქია, რომელიც ფეხით, უბნიდან უბანში უკეთესად მოიარება. თითოეულ რაიონს საკუთარი ხასიათი აქვს, უძველესიდან ულტრათანამედროვემდე. აქ არის თქვენი გზამკვლევი დედაქალაქის ყველაზე საინტერესო უბნებისთვის.</p>

<h3>ძველი ქალაქი (კალა)</h3>
<p>თბილისის ისტორიული გული, ვიწრო ქვაფენილი ქუჩებით, ფერადი ხის აივნებითა და ფარული ეზოებით. მთავარი ღირშესანიშნაობებია ნარიყალას ციხესიმაგრე, ანჩისხატის ბაზილიკა (VI საუკუნე) და აბანოთუბნის გოგირდის აბანოები. ფეხით გასეირნებით საუკეთესოდ მოინახულება — დაიკარგეთ შესახვევებში.</p>

<h3>რუსთაველის გამზირი</h3>
<p>თბილისის მთავარი ბულვარი XIX საუკუნის მდიდრული შენობებით, თეატრებით, მუზეუმებითა და ელიტარული მაღაზიებითაა მორთული. საქართველოს ეროვნული მუზეუმი, პარლამენტის შენობა და რუსთაველის თეატრი აქ არის.</p>

<h3>ვერა</h3>
<p>თბილისის ბოჰემური გული. ვიწრო ქუჩები, დამოუკიდებელი კაფეები, ვინტაჟ მაღაზიები და ქუჩის ხელოვნება ამ უბანს განსაზღვრავს. ვერა მხატვრებს, სტუდენტებსა და ახალგაზრდა პროფესიონალებს იზიდავს. შაბათ-კვირის ფერმერული ბაზრობა შესანიშნავია.</p>

<h3>ვაკე</h3>
<p>თბილისის ელიტარული საცხოვრებელი რაიონი ფართო ხეივანებით, ელეგანტური ბინებითა და შესანიშნავი რესტორნებით. ვაკის პარკი დილის ჯოგინგისთვის იდეალურია, ხოლო რაიონში ქალაქის საუკეთესო ბრანჩ-ადგილები მოიძებნება.</p>

<h3>ფაბრიკა (მარჯანიშვილი)</h3>
<p>ოდესღაც საბჭოთა საკერავ ფაბრიკა, ფაბრიკა თბილისის ყველაზე მოდურ სოციალურ ჰაბად გარდაიქმნა — ჰოსტელი, კოვორკინგ სივრცე, ბარი და ეზოს ადგილი ერთად. მარჯანიშვილის მიმდებარე ტერიტორიას შესანიშნავი ქუჩის ხელოვნება და ყვავილი კაფე-სცენა აქვს.</p>

<h3>სოლოლაკი</h3>
<p>მშვიდი და საცხოვრებელი, სოლოლაკი მთაწმინდის ძირას ფერდობებზე დგას. მისი არტ-ნუვოს შენობები და მშვიდი ატმოსფერო მას ერთ-ერთ ყველაზე ფოტოგენურ რაიონად აქცევს. ფუნიკულიორით ასვლით მთაწმინდის პარკში ქალაქის პანორამული ხედები იხსნება.</p>`,
    tags: ['თბილისი', 'ქალაქის-გზამკვლევი', 'უბნები', 'კულტურა'],
    isPublished: true,
    viewCount: 912,
    imageIndex: 1089,
  },
  {
    title: 'სათხილამურო ტურიზმი საქართველოში: რატომ უნდა იყოს გუდაური თქვენი მომდევნო ზამთრის მიმართულება',
    excerpt: 'ხელმისაწვდომი საბაგირო ბილეთები, წარმოუდგენელი ფხვიერი თოვლი და ხალხმრავლობის გარეშე — აი, რატომ არის საქართველოს სათხილამურო კურორტები ევროპის საუკეთესო საიდუმლო.',
    content: `<h2>საქართველოს სათხილამურო რევოლუცია</h2>
<p>სანამ მსოფლიო ალპებისკენ მიისწრაფვის, გამოცდილი მოთხილამურეები და სნოუბორდისტები საქართველოს წარმოუდგენელ მთის კურორტებს აღმოაჩენენ. თანამედროვე ინფრასტრუქტურით, სანდო თოვლითა და ფასებით, რომლებიც გაგაღიმებთ, ქართული თხილამურები ნამდვილი აღმოჩენაა.</p>

<h3>გუდაური: მთავარი მოვლენა</h3>
<p>თბილისიდან მხოლოდ 2 საათის სავალზე, საქართველოს სამხედრო გზაზე, გუდაური ქვეყნის უპირველესი სათხილამურო კურორტია. 2,196 მ ბაზის სიმაღლეზე (ზედა სადგური 3,279 მ), თოვლის საფარი სანდოა დეკემბრიდან აპრილამდე.</p>
<p><strong>სტატისტიკა:</strong> 70 კმ მონიშნული ტრასა, 16 საბაგირო, 1,000 მ+ ვერტიკალური ვარდნა</p>
<p><strong>საბაგირო ბილეთი:</strong> ~$15-20/დღეში (ევროპულ ალპებში $60+-თან შედარებით)</p>

<h3>ფრირაიდის სამოთხე</h3>
<p>გუდაურმა საერთაშორისო რეპუტაცია მოიპოვა თავისი ოფ-პისტე ტერიტორიით. კურორტის ზემოთ ფართო ღია ბაქნები კავკასიონის ერთ-ერთ საუკეთესო ხელმისაწვდომ ბექკანტრი თხილამურს გთავაზობთ. ჰელი-სქიინგიც ხელმისაწვდომია ხელუხლებელი ფხვიერი თოვლის მაძიებლებისთვის.</p>

<h3>ბაკურიანი: ოჯახებისთვის</h3>
<p>ეს დაბალი სიმაღლის კურორტი (1,700 მ) მცირე კავკასიონში ოჯახებისა და დამწყებთათვის იდეალურია. მშვიდი ფერდობები, მომხიბვლელი სოფლის ატმოსფერო და შესანიშნავი ქროს-ქანტრი ტრასები მას გუდაურის მოსვენებულ ალტერნატივად აქცევს.</p>

<h3>თეთნულდი: ახალი საზღვარი</h3>
<p>სვანეთის უახლესი კურორტი 2016 წელს გაიხსნა და ნამდვილად განსაკუთრებულს გთავაზობთ — თხილამურს 5,000 მ+ მწვერვალების ხედებით. კურორტი ჯერ კიდევ ვითარდება, მაგრამ უკვე შესანიშნავი გრძელი ტრასები და პრაქტიკულად ნულოვანი ხალხმრავლობა აქვს.</p>

<h3>რას მოელოდოთ</h3>
<ul>
<li>თანამედროვე გონდოლები და საბაგირო სადგურები (გუდაური მნიშვნელოვნად განახლდა)</li>
<li>ხელმისაწვდომი აღჭურვილობის დაქირავება ($10-15/დღეში)</li>
<li>შესანიშნავი აპრე-სქი კვება (ხინკალი და ღვინო თხილამურების შემდეგ!)</li>
<li>მოკლე ტრანსფერის დრო თბილისიდან</li>
<li>ძირითადად თავისუფალი ტრასები, შაბათ-კვირასაც კი</li>
</ul>`,
    tags: ['თხილამურები', 'ზამთარი', 'გუდაური', 'თავგადასავალი'],
    isPublished: true,
    viewCount: 534,
    imageIndex: 1090,
  },
  {
    title: 'ფოტოგრაფიის გზამკვლევი: საქართველოს ყველაზე ლამაზი ხედები',
    excerpt: 'გერგეტის სამების ოქროს საათიდან თუშეთის ვარსკვლავიან ცამდე — აქ არის საუკეთესო ფოტოგრაფიის ადგილები და რჩევები საქართველოს გადასაღებად.',
    content: `<h2>საქართველო ობიექტივში</h2>
<p>რამდენიმე ქვეყანა სთავაზობს ფოტოგრაფებს ისეთ მრავალფეროვან და დრამატულ სიუჟეტებს, როგორც საქართველო. უძველესი მონასტრები მთის ფონზე, თბილისის ფერადი აივნები, ვრცელი ვენახის ლანდშაფტები და მოშორებული შუა საუკუნეების სოფლები — ეს ფოტოგრაფის სამოთხეა.</p>

<h3>ოქროს საათის ადგილები</h3>

<h4>გერგეტის სამება, ყაზბეგი</h4>
<p>საქართველოს ყველაზე ხატოვანი კადრი. საუკეთესოდ მზის ამოსვლისას იღება, როდესაც პირველი შუქი ეკლესიის უკან ყაზბეგის მთას ეცემა. ადრე მიდით ხალხმრავლობის ასაცილებლად და ხეობიდან ნისლის გაფანტვის დასაჭერად.</p>

<h4>ნარიყალას ციხესიმაგრე, თბილისი</h4>
<p>ციხის კედლებიდან მზის ჩასვლა ძველ თბილისზე პანორამულ ხედს გთავაზობთ, მტკვრის მდინარე ქვემოთ ხვეულებს ეძინება. თბილი შუქი ქალაქის ფერად შენობებს ოქროსფრად აქცევს.</p>

<h4>უშგულის კოშკები, სვანეთი</h4>
<p>შუა საუკუნეების კოშკები თოვლიანი შხარას მწვერვალის ფონზე საუკეთესოდ გვიან ნაშუადღევს იღება, როცა შუქი თბილია და ჩრდილები ქვის კონსტრუქციებს სიღრმეს მატებს.</p>

<h3>ლურჯი საათი და ღამე</h3>

<h4>მშვიდობის ხიდი, თბილისი</h4>
<p>მინის ხიდი შებინდებისას ულამაზესად ანათდება. სანაპიროდან გადაიღეთ ასახვებისთვის, ან ხიდიდან — ძველი ქალაქის ხედებისთვის.</p>

<h4>თუშეთის ვარსკვლავიანი ცა</h4>
<p>პრაქტიკულად ნულოვანი სინათლის დაბინძურებით, თუშეთი ევროპაში ერთ-ერთ საუკეთესო ასტროფოტოგრაფიის შესაძლებლობას გთავაზობთ. ირმის ნახტომი ზაფხულში დართლოს სოფლის უძველეს კოშკებზე იდეალურად გადაიშლება.</p>

<h3>აუცილებელი რჩევები</h3>
<ul>
<li>ფართო კუთხის ობიექტივი მთის ლანდშაფტებისა და ეკლესიების ინტერიერებისთვის</li>
<li>ტელეფოტო (70-200 მმ) მთის ფენების შეკუმშვისთვის</li>
<li>ამინდი სწრაფად იცვლება — ყოველთვის მზად იქონიეთ კამერა</li>
<li>დრონის რეგულაციები მსუბუქია, მაგრამ შეამოწმეთ შეზღუდული ზონები საზღვრებთან</li>
<li>ხალხის გადაღებამდე ნებართვა ითხოვეთ, განსაკუთრებით სოფლებში</li>
<li>საუკეთესო შუქი ჩვეულებრივ სექტემბერ-ოქტომბერშია, შემოდგომის ფერების პიკისას</li>
</ul>`,
    tags: ['ფოტოგრაფია', 'მოგზაურობის-რჩევები', 'ლანდშაფტები', 'ღირშესანიშნაობები'],
    isPublished: true,
    viewCount: 798,
    imageIndex: 1091,
  },
];

export const RU_BLOG_POSTS: BlogSeedData[] = [
  {
    title: 'Топ-10 мест для посещения в Грузии в 2026 году',
    excerpt: 'От заснеженных вершин Казбеги до залитых солнцем виноградников Кахетии — откройте для себя направления, которые должны быть в списке каждого путешественника.',
    content: `<h2>Грузия: жемчужина Кавказа</h2>
<p>Грузия стремительно превращается в одно из самых захватывающих туристических направлений мира. Потрясающие горные ландшафты, древняя винная культура и тёплое гостеприимство делают эту маленькую страну невероятно привлекательной для путешественников всех типов.</p>

<h3>1. Тбилиси — столица контрастов</h3>
<p>Начните путешествие в Тбилиси, где древние серные бани соседствуют с современным стеклянным мостом, а советская архитектура — с модными кафе. Не пропустите извилистые улочки старого города, крепость Нарикала и яркую ночную жизнь.</p>

<h3>2. Казбеги (Степанцминда)</h3>
<p>Знаменитая Троицкая церковь Гергети на фоне горы Казбек — пожалуй, самый фотографируемый вид Грузии. Подъём к церкви занимает около 3 часов и вознаграждает потрясающими панорамными видами.</p>

<h3>3. Местия и Ушгули — Сванетия</h3>
<p>Средневековые сванские башни являются объектом Всемирного наследия ЮНЕСКО. Местия — ворота к лучшим треккинговым маршрутам Грузии, а Ушгули — одно из самых высоких постоянно обитаемых поселений в Европе — словно путешествие во времени.</p>

<h3>4. Сигнахи — город любви</h3>
<p>Расположенный на холме с видом на Алазанскую долину, Сигнахи — самый романтичный городок Грузии. Мощёные улицы, отреставрированные крепостные стены и виды на Большой Кавказ делают его идеальным для уикенда.</p>

<h3>5. Батуми — жемчужина Чёрного моря</h3>
<p>Приморская жемчужина Грузии сочетает пляжный отдых со смелой современной архитектурой. Батумский бульвар, ботанический сад и яркая ночная жизнь делают город обязательным к посещению, особенно летом.</p>

<h3>6. Вардзия — пещерный город</h3>
<p>Потрясающий пещерный монастырский комплекс, высеченный в скалах горы Эрушети, датируется XII веком. Масштаб объекта — более 600 помещений — поражает воображение.</p>

<h3>7. Кахетия — винный регион</h3>
<p>Грузия — родина вина с 8000-летней традицией виноделия. Кахетия — её сердце, где можно посетить семейные винные погреба, попробовать вино из квеври и насладиться пейзажами виноградников.</p>

<h3>8. Монастырь Давид Гареджи</h3>
<p>Этот высеченный в скале монастырь VI века на границе с Азербайджаном предлагает уникальное сочетание духовной истории и полупустынных ландшафтов, не имеющих аналогов в Грузии.</p>

<h3>9. Гудаури — горнолыжный рай</h3>
<p>Главный горнолыжный курорт Грузии предлагает отличный пухлый снег, свободные склоны и цены, составляющие малую долю от стоимости европейских Альп.</p>

<h3>10. Боржоми — целебные воды</h3>
<p>Знаменитый своей минеральной водой, Боржоми окружён пышными лесами Малого Кавказа. Национальный парк Боржоми-Харагаули предлагает отличные пешие маршруты через первозданную природу.</p>`,
    tags: ['достопримечательности', 'путеводитель', 'грузия', 'топ-подборка'],
    isPublished: true,
    viewCount: 1156,
    imageIndex: 1092,
  },
  {
    title: 'Полный гид по грузинской кухне: что есть и где',
    excerpt: 'Хинкали, хачапури и не только — исследуйте богатые вкусы грузинской кухни и найдите лучшие рестораны.',
    content: `<h2>Грузинская кухня: кулинарное путешествие</h2>
<p>Грузинская кухня — одна из величайших неоткрытых кулинарных традиций мира. Под влиянием европейских и азиатских практик она превратилась в нечто совершенно уникальное — смелое, ароматное и невероятно щедрое.</p>

<h3>Хачапури — национальное блюдо</h3>
<p>Этот сырный хлеб существует во множестве региональных вариаций. Аджарская версия — в форме лодки с жидким яйцом и маслом — самая знаменитая, но имеретинская (круглая) и мегрельская (с двойным сыром) версии не менее вкусны.</p>

<h3>Хинкали — грузинские пельмени</h3>
<p>Эти сочные пельмени — настоящее искусство. Начинённые мясом со специями (или грибами, сыром, картофелем), хинкали требуют особой техники — берите за хвостик, делайте маленький надкус, выпивайте бульон, затем съедайте. Никогда не используйте вилку!</p>

<h3>Чурчхела — грузинский «Сникерс»</h3>
<p>Эти сладости в форме свечей делаются из нанизанных на нитку орехов, которые окунают в виноградный сок, загущённый мукой. Вы увидите их развешанными на рынках по всей стране.</p>

<h3>Пхали — овощное паштет</h3>
<p>Неотъемлемое блюдо грузинского застолья, пхали — мелко нарезанные овощи (шпинат, свёкла или капуста), смешанные с орехами, чесноком и зеленью, сформированные в шарики и украшенные зёрнами граната.</p>

<h3>Грузинское застолье — супра</h3>
<p>Разговор о грузинской кухне невозможен без упоминания супры — традиционного застолья под руководством тамады. Ожидайте десятки блюд, бесконечное вино и душевные тосты, которые могут длиться часами.</p>

<h3>Где поесть</h3>
<p>В Тбилиси попробуйте «Шави Ломи» для современной грузинской кухни, «Барбарестан» для исторических рецептов или любой соседский духан для аутентичной домашней еды. В сельской местности лучшие блюда часто подают в семейных гостевых домах.</p>`,
    tags: ['еда', 'культура', 'советы', 'грузия'],
    isPublished: true,
    viewCount: 834,
    imageIndex: 1093,
  },
  {
    title: 'Треккинг по Кавказу: маршруты для всех уровней',
    excerpt: 'Будь вы начинающим туристом или опытным альпинистом, в грузинском Кавказе вас ждёт подходящий маршрут.',
    content: `<h2>Кавказские горы: рай для треккинга</h2>
<p>Хребет Большого Кавказа протянулся через северную Грузию как природная крепость, предлагая одни из самых зрелищных треккинговых маршрутов в Европе. От спокойных прогулок по долинам до сложных альпийских переходов — здесь найдётся что-то для каждого.</p>

<h3>Для начинающих: Трусовское ущелье</h3>
<p><strong>Продолжительность:</strong> 4-5 часов туда и обратно<br><strong>Сложность:</strong> Лёгкая</p>
<p>Эта спокойная прогулка по долине вблизи Казбеги следует по реке Терек через потрясающее ущелье. Вы пройдёте мимо минеральных источников, заброшенных деревень и травертиновых образований. Тропа в основном ровная и хорошо обозначенная.</p>

<h3>Средний уровень: Джута — Рошка (перевал Чаухи)</h3>
<p><strong>Продолжительность:</strong> 2 дня<br><strong>Сложность:</strong> Средняя</p>
<p>Этот классический маршрут пересекает драматичный перевал Чаухи (3 338 м) между двумя красивыми долинами. Зубчатые скальные башни массива Чаухи напоминают Доломиты, а луга с полевыми цветами летом незабываемы.</p>

<h3>Сложный: Местия — Ушгули</h3>
<p><strong>Продолжительность:</strong> 4 дня<br><strong>Сложность:</strong> Средне-высокая</p>
<p>Жемчужина грузинского треккинга. Маршрут проходит через средневековые деревни Сванетии, пересекает высокогорные перевалы и завершается в Ушгули с видами на гору Шхара (5 193 м) — высочайшую вершину Грузии.</p>

<h3>Для экспертов: Тушетия — Омало-Шатили</h3>
<p><strong>Продолжительность:</strong> 5-7 дней<br><strong>Сложность:</strong> Высокая</p>
<p>Этот отдалённый переход через восточный Кавказ только для опытных треккеров. Маршрут пересекает дикие регионы Тушетии и Хевсуретии, проходя через самые изолированные и красивые ландшафты Грузии.</p>

<h3>Важные советы</h3>
<ul>
<li>Лучший сезон: с середины июня до середины сентября</li>
<li>Всегда берите дождевик — горная погода меняется быстро</li>
<li>Регистрируйтесь в местной спасательной службе для удалённых маршрутов</li>
<li>Нанимайте местного гида для маршрутов выше 3 000 м</li>
<li>Берите наличные — в удалённых долинах нет банкоматов</li>
</ul>`,
    tags: ['треккинг', 'приключения', 'горы', 'активный-отдых'],
    isPublished: true,
    viewCount: 1389,
    imageIndex: 1094,
  },
  {
    title: 'Грузинское вино: 8000-летняя традиция',
    excerpt: 'Откройте для себя старейшую в мире винодельческую традицию — от древних глиняных сосудов квеври до современного движения натуральных вин.',
    content: `<h2>Родина вина</h2>
<p>Археологические данные свидетельствуют, что вино впервые было изготовлено в Грузии около 6000 г. до н. э., что делает её старейшим винодельческим регионом мира. Сегодня грузинское вино переживает ренессанс, а вина из квеври получают международное признание.</p>

<h3>Квеври: древний метод</h3>
<p>Традиционный грузинский метод виноделия использует большие глиняные сосуды — квеври, которые закапывают в землю. Виноград — вместе с кожицей, косточками и гребнями — бродит в этих сосудах в течение месяцев естественным образом. Результат — янтарное вино со сложным, терпким вкусом, не имеющим аналогов нигде в мире.</p>
<p>В 2013 году ЮНЕСКО включило метод виноделия в квеври в список нематериального культурного наследия человечества.</p>

<h3>Основные сорта винограда</h3>
<p>В Грузии более 500 автохтонных сортов винограда — больше, чем почти в любой другой стране. Наиболее важные из них:</p>
<ul>
<li><strong>Саперави</strong> — флагманский красный сорт Грузии, производящий глубокие, полнотелые вина</li>
<li><strong>Ркацители</strong> — самый распространённый белый сорт, универсальный и гастрономичный</li>
<li><strong>Мцване</strong> — нежный белый сорт, часто купажируемый с Ркацители</li>
<li><strong>Киси</strong> — редкий белый сорт, переживающий возрождение в янтарных винах</li>
</ul>

<h3>Винные регионы</h3>
<p><strong>Кахетия</strong> производит 70% грузинского вина и является обязательным к посещению регионом. Ключевые точки — Сигнахи, Телави, Цинандали и Кварели. Многие семейные погреба (марани) открыты для посещений и дегустаций.</p>
<p><strong>Картли</strong> (район Гори) и <strong>Имеретия</strong> (район Кутаиси) предлагают превосходные вина в менее туристической обстановке.</p>

<h3>Советы по дегустации</h3>
<p>Присоединяйтесь к винному туру или просто стучите в двери кахетинских сёл — большинство семей делают собственное вино и рады поделиться. Многие гостевые дома включают вино в стоимость питания. Для более организованного опыта посетите Музей вина в Сигнахи или поместье Шато Мухрани под Тбилиси.</p>`,
    tags: ['вино', 'культура', 'кахетия', 'традиции'],
    isPublished: true,
    viewCount: 712,
    imageIndex: 1095,
  },
  {
    title: 'Планирование идеального автопутешествия по Грузии',
    excerpt: 'Практический гид по аренде автомобиля, навигации по грузинским дорогам, заправкам и лучшим маршрутам для исследования страны в своём ритме.',
    content: `<h2>Автопутешествие по Грузии</h2>
<p>Грузия — мечта для автопутешественников. Страна достаточно мала, чтобы пересечь за день, но настолько разнообразна, что можно исследовать неделями. От Военно-Грузинской дороги до прибрежной трассы — вот всё, что вам нужно знать.</p>

<h3>Аренда автомобиля</h3>
<p>Прокатные агентства в изобилии представлены в Тбилиси и Батуми. Международные компании, такие как Hertz и Budget, работают наряду с надёжными местными фирмами. Ожидайте $30-60 в день за стандартный внедорожник. Внедорожник рекомендуется — к лучшим местам Грузии ведут грунтовые горные дороги.</p>

<h3>Состояние дорог</h3>
<p>Основные магистрали между городами обычно в хорошем состоянии. Дорога из Тбилиси в Батуми — современное шоссе. Однако горные дороги — особенно в Сванетии, Тушетии и частях Кахетии — могут быть неровными, узкими и порой грунтовыми. Проверяйте условия перед поездкой в отдалённые районы.</p>

<h3>Рекомендуемые маршруты</h3>

<h4>Маршрут 1: Военно-Грузинская дорога (2-3 дня)</h4>
<p>Тбилиси → Мцхета → Ананури → Гудаури → Казбеги. Этот легендарный маршрут следует по рекам Арагви и Терек через драматические горные пейзажи. Остановитесь у крепости Ананури и Монумента Дружбы Народов.</p>

<h4>Маршрут 2: Кахетинский винный маршрут (2-3 дня)</h4>
<p>Тбилиси → Сигнахи → Телави → Цинандали → Кварели → Лагодехи → Тбилиси. Сочетание дегустаций с посещением монастырей и потрясающими видами долин. Идеально для ценителей еды и вина.</p>

<h4>Маршрут 3: Западная Грузия (5-7 дней)</h4>
<p>Тбилиси → Кутаиси → Мартвильский каньон → Местия → Ушгули → Батуми. Этот длинный маршрут охватывает пещерные города, каньоны, средневековую Сванетию и черноморское побережье.</p>

<h3>Практические советы</h3>
<ul>
<li>Движение правостороннее</li>
<li>Грузинские водители могут быть агрессивными — будьте внимательны</li>
<li>Заправляйтесь на каждой АЗС в горных районах</li>
<li>Берите наличные для удалённых сельских гостевых домов</li>
<li>Скачайте офлайн-карты — мобильная связь в горах нестабильна</li>
</ul>`,
    tags: ['автопутешествие', 'советы', 'планирование', 'транспорт'],
    isPublished: true,
    viewCount: 601,
    imageIndex: 1096,
  },
  {
    title: 'Сванетия: последний дикий рубеж Грузии',
    excerpt: 'Средневековые башни, ледниковые реки и самые драматичные горные пейзажи Европы — добро пожаловать в Сванетию.',
    content: `<h2>Сванетия: где время остановилось</h2>
<p>Спрятанная в северо-западном углу Грузии, Сванетия — один из самых отдалённых и драматически красивых регионов Европы. Средневековые каменные башни, возвышающиеся вершины и яростные культурные традиции создают ощущение иного мира.</p>

<h3>История и культура</h3>
<p>Сваны — одна из древнейших этнических групп Грузии, с собственным языком и обычаями. Их знаменитые башни — некоторым более 1 000 лет — были построены для защиты во времена конфликтов и кровной мести. Сегодня многие из них по-прежнему стоят как свидетельство бурной, но увлекательной истории Сванетии.</p>

<h3>Местия: ворота Сванетии</h3>
<p>Столица региона в последние годы преобразилась с появлением новых отелей, ресторанов и небольшого аэропорта. В Музее истории и этнографии Сванетии хранится впечатляющая коллекция средневековых икон и рукописей. Не пропустите башни Местии, подсвеченные на закате.</p>

<h3>Ушгули: самое высокое село Европы</h3>
<p>На высоте 2 200 метров Ушгули — одно из высочайших постоянно обитаемых поселений в Европе. Скопление каменных башен на фоне горы Шхара (5 193 м) — одно из самых культовых изображений Грузии. Дорога из Местии занимает 2-3 часа по грунтовой горной дороге.</p>

<h3>Активности</h3>
<ul>
<li><strong>Треккинг:</strong> 4-дневный маршрут Местия — Ушгули всемирно известен</li>
<li><strong>Горные лыжи:</strong> курорты Тетнулди и Хацвали предлагают безлюдные склоны</li>
<li><strong>Ледниковый хайкинг:</strong> посетите ледник Чалаади вблизи Местии</li>
<li><strong>Культурные туры:</strong> посещение башен, древних церквей и местных ремесленников</li>
</ul>

<h3>Как добраться</h3>
<p>Летите из Тбилиси в Местию (1 час, зависит от погоды) или поезжайте на автомобиле через Зугдиди (5-6 часов). Дорога значительно улучшена, но остаётся живописной и извилистой. Маршрутки ходят ежедневно из Зугдиди.</p>`,
    tags: ['сванетия', 'приключения', 'горы', 'культура'],
    isPublished: true,
    viewCount: 1023,
    imageIndex: 1097,
  },
  {
    title: 'Бюджетное путешествие по Грузии: как исследовать страну менее чем за $50 в день',
    excerpt: 'Грузия — одно из самых доступных направлений Европы. Вот как растянуть бюджет, не упустив ничего важного.',
    content: `<h2>Грузия на бюджете</h2>
<p>Грузия предлагает невероятное соотношение цены и качества для путешественников. Доступное жильё, дешёвая и вкусная еда, разумные транспортные расходы — здесь можно потрясающе провести время за малую часть стоимости поездки в Западную Европу.</p>

<h3>Жильё: $8-25 за ночь</h3>
<p>Хостелы в Тбилиси начинаются от $8-12 за ночь за место в общей комнате. Отдельные комнаты в гостевых домах по всей стране стоят $15-25. В сельских районах семейные гостевые дома часто включают ужин и завтрак за $20-30 на человека — невероятное предложение.</p>

<h3>Еда: $8-15 в день</h3>
<p>Вкусно поесть в Грузии удивительно дёшево. Порция хинкали стоит около $2. Хачапури — от $1.50 до $4. Полноценный обед в местном ресторане редко превышает $8. Уличная еда — лобиани (хлеб с фасолью), чурчхела, свежие фрукты — стоит ещё меньше.</p>

<h3>Транспорт: $5-15 в день</h3>
<p>Маршрутки (микроавтобусы) соединяют все крупные города за $2-8. Метро Тбилиси стоит всего $0.20 за поездку. Такси дешёвые — используйте приложения Bolt или Maxim для честных цен. Такси через весь Тбилиси редко стоит больше $3-5.</p>

<h3>Бесплатные и недорогие активности</h3>
<ul>
<li>Пешие экскурсии по старому Тбилиси (бесплатно / за чаевые)</li>
<li>Посещение большинства церквей и монастырей (бесплатно)</li>
<li>Хайкинг в национальных парках (бесплатно или $1-2 за вход)</li>
<li>Серные бани в Абанотубани ($3-8)</li>
<li>Дегустация вин в семейных погребах (часто бесплатно)</li>
<li>Блошиный рынок у Сухого моста в Тбилиси (бесплатно)</li>
</ul>

<h3>Советы по экономии</h3>
<ul>
<li>Покупайте продукты на местных рынках — свежие овощи и фрукты невероятно дёшевы</li>
<li>Используйте маршрутки вместо частных трансферов</li>
<li>Путешествуйте в межсезонье (май-июнь, сентябрь-октябрь)</li>
<li>Спрашивайте рекомендации у местных — туристические рестораны дороже</li>
<li>В горных районах имейте при себе наличные</li>
</ul>

<h3>Примерный дневной бюджет</h3>
<p><strong>Бюджетный ($30-40/день):</strong> хостел/гостевой дом + местные рестораны + маршрутки</p>
<p><strong>Средний ($60-100/день):</strong> отель + рестораны получше + арендованный автомобиль</p>
<p><strong>Комфортный ($120+/день):</strong> бутик-отель + изысканные рестораны + экскурсии с гидом</p>`,
    tags: ['бюджет', 'советы', 'планирование', 'бэкпекинг'],
    isPublished: true,
    viewCount: 1876,
    imageIndex: 1098,
  },
  {
    title: 'Путеводитель по районам Тбилиси',
    excerpt: 'От богемных улиц Веры до исторического шарма Абанотубани — исследуйте самые интересные районы Тбилиси.',
    content: `<h2>Тбилиси: город районов</h2>
<p>Тбилиси — город, который лучше всего исследовать пешком, район за районом. У каждого квартала свой характер — от древнего до ультрасовременного. Вот ваш путеводитель по самым интересным районам столицы.</p>

<h3>Старый город (Кала)</h3>
<p>Историческое сердце Тбилиси с узкими мощёными улочками, яркими деревянными балконами и скрытыми дворами. Главные достопримечательности — крепость Нарикала, базилика Анчисхати (VI век) и серные бани Абанотубани. Лучше всего исследовать пешком — заблудитесь в переулках.</p>

<h3>Проспект Руставели</h3>
<p>Главный бульвар Тбилиси обрамлён величественными зданиями XIX века, театрами, музеями и элитными магазинами. Здесь расположены Грузинский национальный музей, здание парламента и Театр Руставели. Идеальное место, чтобы наблюдать за людьми за чашечкой кофе.</p>

<h3>Вера</h3>
<p>Богемное сердце Тбилиси. Узкие улочки, независимые кафе, винтажные магазины и стрит-арт определяют этот район. Вера привлекает художников, студентов и молодых профессионалов. Фермерский рынок по выходным великолепен.</p>

<h3>Ваке</h3>
<p>Престижный жилой район Тбилиси с широкими тенистыми улицами, элегантными квартирами и отличными ресторанами. Парк Ваке идеален для утренней пробежки, а в районе расположены одни из лучших мест для бранча в городе.</p>

<h3>Фабрика (Марджанишвили)</h3>
<p>Бывшая советская швейная фабрика, Фабрика превратилась в самое модное социальное пространство Тбилиси — хостел, коворкинг, бар и площадка для мероприятий в одном месте. В окрестностях Марджанишвили — отличный стрит-арт и оживлённая кофейная сцена.</p>

<h3>Сололаки</h3>
<p>Тихий и жилой, Сололаки расположен на склонах под Мтацминдой. Здания в стиле ар-нуво и спокойная атмосфера делают его одним из самых фотогеничных районов. Поднимитесь на фуникулёре в парк Мтацминда за панорамными видами города.</p>`,
    tags: ['тбилиси', 'городской-гид', 'районы', 'культура'],
    isPublished: true,
    viewCount: 889,
    imageIndex: 1099,
  },
  {
    title: 'Горнолыжный туризм в Грузии: почему Гудаури стоит выбрать следующей зимой',
    excerpt: 'Доступные ски-пассы, потрясающий пухляк и никаких очередей — вот почему горнолыжные курорты Грузии — лучший секрет Европы.',
    content: `<h2>Горнолыжная революция Грузии</h2>
<p>Пока весь мир стремится в Альпы, опытные лыжники и сноубордисты открывают для себя невероятные горные курорты Грузии. Современная инфраструктура, надёжный снежный покров и цены, от которых вы улыбнётесь, — грузинские горные лыжи это настоящее откровение.</p>

<h3>Гудаури: главное событие</h3>
<p>Расположенный всего в 2 часах от Тбилиси на Военно-Грузинской дороге, Гудаури — главный горнолыжный курорт страны. На базовой высоте 2 196 м (верхняя станция 3 279 м) снежный покров надёжен с декабря по апрель.</p>
<p><strong>Характеристики:</strong> 70 км маркированных трасс, 16 подъёмников, перепад высот более 1 000 м</p>
<p><strong>Ски-пасс:</strong> ~$15-20/день (сравните с $60+ в европейских Альпах)</p>

<h3>Рай для фрирайда</h3>
<p>Гудаури завоевал международную репутацию благодаря внетрассовому катанию. Широкие открытые чаши над курортом предлагают одни из лучших доступных бэккантри-трасс на Кавказе. Хели-ски также доступен для тех, кто ищет нетронутый пухляк.</p>

<h3>Бакуриани: для семей</h3>
<p>Этот курорт на меньшей высоте (1 700 м) на Малом Кавказе идеален для семей и начинающих. Пологие склоны, уютная деревенская атмосфера и отличные трассы для беговых лыж делают его расслабляющей альтернативой Гудаури.</p>

<h3>Тетнулди: новый рубеж</h3>
<p>Новейший курорт Сванетии, открытый в 2016 году, предлагает нечто поистине особенное — катание с видами на пятитысячники. Курорт всё ещё развивается, но уже располагает отличными длинными трассами и практически нулевыми очередями.</p>

<h3>Чего ожидать</h3>
<ul>
<li>Современные гондолы и кресельные подъёмники (Гудаури значительно модернизирован)</li>
<li>Доступный прокат оборудования ($10-15/день)</li>
<li>Отличный апре-ски (хинкали и вино после катания!)</li>
<li>Короткий трансфер из Тбилиси</li>
<li>В основном пустые склоны даже по выходным</li>
</ul>`,
    tags: ['горные-лыжи', 'зима', 'гудаури', 'приключения'],
    isPublished: true,
    viewCount: 543,
    imageIndex: 1100,
  },
  {
    title: 'Фотогид: самые красивые места Грузии',
    excerpt: 'От золотого часа у Троицкой церкви Гергети до звёздного неба над Тушетией — лучшие фотолокации и советы для съёмки Грузии.',
    content: `<h2>Грузия через объектив</h2>
<p>Немногие страны предлагают фотографам столь разнообразные и драматичные сюжеты, как Грузия. Древние монастыри на фоне гор, яркие тбилисские балконы, бескрайние виноградники и отдалённые средневековые деревни — это настоящая площадка для фотографа.</p>

<h3>Локации для золотого часа</h3>

<h4>Троицкая церковь Гергети, Казбеги</h4>
<p>Самый знаковый кадр Грузии. Лучше всего снимать на рассвете, когда первый свет ложится на гору Казбек за церковью. Приходите рано, чтобы избежать толп и поймать момент, когда туман рассеивается из долины внизу.</p>

<h4>Крепость Нарикала, Тбилиси</h4>
<p>Закат со стен крепости открывает панорамный вид на старый Тбилиси с извивающейся внизу рекой Мтквари. Тёплый свет превращает яркие здания города в золото.</p>

<h4>Башни Ушгули, Сванетия</h4>
<p>Средневековые башни на фоне заснеженной вершины Шхара лучше всего снимать ближе к вечеру, когда свет тёплый и тени добавляют глубину каменным сооружениям.</p>

<h3>Голубой час и ночь</h3>

<h4>Мост Мира, Тбилиси</h4>
<p>Стеклянный мост прекрасно подсвечивается в сумерках. Снимайте с набережной для отражений или с самого моста для видов на старый город.</p>

<h4>Звёздное небо Тушетии</h4>
<p>Практически без светового загрязнения, Тушетия предлагает одни из лучших возможностей для астрофотографии в Европе. Млечный Путь идеально выгибается над древними башнями села Дартло летом.</p>

<h3>Важные советы</h3>
<ul>
<li>Широкоугольный объектив необходим для горных пейзажей и интерьеров церквей</li>
<li>Телеобъектив (70-200 мм) незаменим для сжатия горных слоёв</li>
<li>Погода меняется быстро — камера всегда должна быть наготове</li>
<li>Правила для дронов мягкие, но проверяйте запретные зоны вблизи границ</li>
<li>Спрашивайте разрешение перед съёмкой людей, особенно в сельской местности</li>
<li>Лучший свет обычно в сентябре-октябре, на пике осенних красок</li>
</ul>`,
    tags: ['фотография', 'советы', 'пейзажи', 'достопримечательности'],
    isPublished: true,
    viewCount: 801,
    imageIndex: 1101,
  },
];

export const ALL_BLOG_POSTS: BlogSeedData[] = [
  ...BLOG_POSTS,
  ...KA_BLOG_POSTS,
  ...RU_BLOG_POSTS,
];