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
  /** Index into seed-assets images (1070-1089 range) */
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