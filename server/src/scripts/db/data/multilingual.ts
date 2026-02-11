/**
 * Multilingual content pools and helpers for seed data generation.
 * Provides English, Russian, and Georgian content for names, bios,
 * tour descriptions, blog posts, and more.
 *
 * Used by other data files to generate realistic multilingual seed content.
 */

import { randomItem, randomInt, randomBool } from '../utils/helpers.js';

// =============================================================================
// TYPES
// =============================================================================

export type SeedLanguage = 'en' | 'ru' | 'ka';

// =============================================================================
// NAME POOLS
// =============================================================================

const EN_MALE_FIRST_NAMES = [
  'James', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas',
  'Christopher', 'Daniel', 'Matthew', 'Andrew', 'Joshua', 'Ethan', 'Alexander',
  'Benjamin', 'Samuel', 'Nathan', 'Henry', 'Oliver', 'Sebastian', 'Liam', 'Noah',
  'Lucas', 'Mason', 'Logan', 'Jack', 'Ryan', 'Tyler', 'Connor', 'Caleb', 'Owen',
];

const EN_FEMALE_FIRST_NAMES = [
  'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica',
  'Sarah', 'Karen', 'Emily', 'Olivia', 'Sophia', 'Isabella', 'Charlotte', 'Amelia',
  'Mia', 'Harper', 'Evelyn', 'Abigail', 'Emma', 'Chloe', 'Grace', 'Lily',
  'Hannah', 'Natalie', 'Victoria', 'Samantha', 'Rachel', 'Claire', 'Julia', 'Alice',
];

const EN_LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Anderson', 'Taylor', 'Thomas', 'Moore', 'Jackson',
  'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 'Robinson',
  'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Hill', 'Baker',
];

const RU_MALE_FIRST_NAMES = [
  'Александр', 'Дмитрий', 'Максим', 'Сергей', 'Андрей', 'Алексей', 'Артём', 'Илья',
  'Кирилл', 'Михаил', 'Никита', 'Матвей', 'Роман', 'Егор', 'Арсений', 'Иван',
  'Денис', 'Евгений', 'Тимур', 'Владислав', 'Игорь', 'Владимир', 'Олег', 'Виктор',
  'Борис', 'Павел', 'Николай', 'Георгий', 'Анатолий', 'Юрий', 'Константин', 'Пётр',
];

const RU_FEMALE_FIRST_NAMES = [
  'Анна', 'Мария', 'Елена', 'Наталья', 'Ольга', 'Татьяна', 'Ирина', 'Светлана',
  'Екатерина', 'Дарья', 'Алина', 'Юлия', 'Виктория', 'Анастасия', 'Полина', 'Марина',
  'Людмила', 'Галина', 'Лариса', 'Валентина', 'Надежда', 'Ксения', 'Вера', 'Софья',
  'Тамара', 'Нина', 'Оксана', 'Диана', 'Кристина', 'Алёна', 'Евгения', 'Любовь',
];

const RU_LAST_NAMES_MALE = [
  'Иванов', 'Петров', 'Сидоров', 'Козлов', 'Новиков', 'Морозов', 'Волков', 'Соколов',
  'Лебедев', 'Кузнецов', 'Попов', 'Смирнов', 'Орлов', 'Макаров', 'Федоров', 'Андреев',
  'Ковалёв', 'Ильин', 'Гусев', 'Титов', 'Кузьмин', 'Кудрявцев', 'Баранов', 'Куликов',
  'Алексеев', 'Степанов', 'Яковлев', 'Сорокин', 'Романов', 'Захаров', 'Борисов', 'Белов',
];

const RU_LAST_NAMES_FEMALE = [
  'Иванова', 'Петрова', 'Сидорова', 'Козлова', 'Новикова', 'Морозова', 'Волкова', 'Соколова',
  'Лебедева', 'Кузнецова', 'Попова', 'Смирнова', 'Орлова', 'Макарова', 'Федорова', 'Андреева',
  'Ковалёва', 'Ильина', 'Гусева', 'Титова', 'Кузьмина', 'Кудрявцева', 'Баранова', 'Куликова',
  'Алексеева', 'Степанова', 'Яковлева', 'Сорокина', 'Романова', 'Захарова', 'Борисова', 'Белова',
];

// =============================================================================
// GEORGIAN LOCATIONS (trilingual)
// =============================================================================

export interface MultilingualLocation {
  en: string;
  ru: string;
  ka: string;
}

export const LOCATIONS_MULTILINGUAL: MultilingualLocation[] = [
  { en: 'Tbilisi', ru: 'Тбилиси', ka: 'თბილისი' },
  { en: 'Mtskheta', ru: 'Мцхета', ka: 'მცხეთა' },
  { en: 'Kazbegi', ru: 'Казбеги', ka: 'ყაზბეგი' },
  { en: 'Mestia', ru: 'Местия', ka: 'მესტია' },
  { en: 'Ushguli', ru: 'Ушгули', ka: 'უშგული' },
  { en: 'Kutaisi', ru: 'Кутаиси', ka: 'ქუთაისი' },
  { en: 'Signagi', ru: 'Сигнахи', ka: 'სიღნაღი' },
  { en: 'Telavi', ru: 'Телави', ka: 'თელავი' },
  { en: 'Gori', ru: 'Гори', ka: 'გორი' },
  { en: 'Kvareli', ru: 'Кварели', ka: 'ყვარელი' },
  { en: 'Tsinandali', ru: 'Цинандали', ka: 'წინანდალი' },
  { en: 'Gudauri', ru: 'Гудаури', ka: 'გუდაური' },
  { en: 'Bakuriani', ru: 'Бакуриани', ka: 'ბაკურიანი' },
  { en: 'Batumi', ru: 'Батуми', ka: 'ბათუმი' },
  { en: 'Borjomi', ru: 'Боржоми', ka: 'ბორჯომი' },
  { en: 'Vardzia', ru: 'Вардзия', ka: 'ვარძია' },
  { en: 'David Gareja', ru: 'Давид Гареджи', ka: 'დავით გარეჯა' },
  { en: 'Lagodekhi', ru: 'Лагодехи', ka: 'ლაგოდეხი' },
  { en: 'Kobuleti', ru: 'Кобулети', ka: 'ქობულეთი' },
  { en: 'Martvili', ru: 'Мартвили', ka: 'მარტვილი' },
  { en: 'Zugdidi', ru: 'Зугдиди', ka: 'ზუგდიდი' },
  { en: 'Stepantsminda', ru: 'Степанцминда', ka: 'სტეფანწმინდა' },
  { en: 'Svaneti', ru: 'Сванетия', ka: 'სვანეთი' },
  { en: 'Tusheti', ru: 'Тушетия', ka: 'თუშეთი' },
  { en: 'Kakheti', ru: 'Кахетия', ka: 'კახეთი' },
];

// =============================================================================
// SPECIALTIES (trilingual)
// =============================================================================

export interface MultilingualSpecialty {
  en: string;
  ru: string;
  ka: string;
}

export const SPECIALTIES_MULTILINGUAL: MultilingualSpecialty[] = [
  { en: 'Cultural & Historical Tours', ru: 'Культурные и исторические туры', ka: 'კულტურული და ისტორიული ტურები' },
  { en: 'Wine & Gastronomy', ru: 'Вино и гастрономия', ka: 'ღვინო და გასტრონომია' },
  { en: 'Mountain Trekking', ru: 'Горный трекинг', ka: 'მთის ლაშქრობა' },
  { en: 'Adventure Sports', ru: 'Приключенческий спорт', ka: 'სათავგადასავლო სპორტი' },
  { en: 'Photography Tours', ru: 'Фотографические туры', ka: 'ფოტოგრაფიის ტურები' },
  { en: 'Eco-Tourism', ru: 'Экотуризм', ka: 'ეკოტურიზმი' },
  { en: 'Ski & Winter Sports', ru: 'Горные лыжи и зимний спорт', ka: 'სათხილამურო და ზამთრის სპორტი' },
  { en: 'Religious Heritage', ru: 'Религиозное наследие', ka: 'რელიგიური მემკვიდრეობა' },
  { en: 'City Walking Tours', ru: 'Пешие городские прогулки', ka: 'ქალაქის საფეხმავლო ტურები' },
  { en: 'Beach & Coastal', ru: 'Пляжный и прибрежный отдых', ka: 'სანაპირო და ზღვისპირა' },
  { en: 'Horseback Riding', ru: 'Конные прогулки', ka: 'ცხენით ჯირითი' },
  { en: 'Bird Watching', ru: 'Наблюдение за птицами', ka: 'ფრინველების დაკვირვება' },
];

// =============================================================================
// GUIDE BIO TEMPLATES
// =============================================================================

/**
 * Placeholders: {name}, {years}, {city}, {specialty}, {languages}
 */
export const GUIDE_BIO_TEMPLATES_EN: string[] = [
  `Hello! I'm {name}, a passionate tour guide with {years} years of experience exploring the wonders of Georgia. Based in {city}, I specialize in {specialty} and speak {languages}. My tours blend deep local knowledge with personal stories, ensuring every traveler leaves with unforgettable memories and a true understanding of Georgian culture.`,

  `Meet {name} — your local friend in Georgia! With {years} years of guiding under my belt, I've shown hundreds of visitors the hidden gems of {city} and beyond. My focus is {specialty}, and I pride myself on creating intimate, informative experiences. I'm fluent in {languages} and love connecting people from different cultures through shared adventures.`,

  `I'm {name}, a certified guide with {years} years of professional experience. Living in {city} has given me an insider's perspective that no guidebook can match. I specialize in {specialty} and speak {languages}. Whether you're a first-time visitor or a seasoned traveler, I'll craft an experience tailored to your interests and pace.`,

  `Welcome to Georgia! I'm {name}, and I've been sharing the beauty of this incredible country for {years} years. From the cobblestone streets of {city} to remote mountain villages, I create journeys that touch the heart. My expertise lies in {specialty}, and I communicate comfortably in {languages}. Let's explore together!`,

  `Gamarjoba! I'm {name}, born and raised in {city}. For the past {years} years, I've dedicated my career to showing travelers the authentic side of Georgia. My specialty is {specialty}, combining historical insights with hands-on experiences. Speaking {languages} allows me to connect with a diverse range of international visitors.`,

  `Hi, I'm {name}! As a guide for {years} years based in {city}, I've developed a deep appreciation for every corner of Georgia. I specialize in {specialty} and am known for my engaging storytelling and attention to detail. Fluent in {languages}, I ensure every guest feels welcome and well-informed throughout our journey.`,

  `My name is {name}, and guiding is not just my job — it's my calling. With {years} years of experience operating from {city}, I've led thousands of visitors through Georgia's most breathtaking landscapes and fascinating cultural sites. My expertise in {specialty} sets my tours apart. I speak {languages} fluently.`,

  `I'm {name}, a {city}-based guide who has spent {years} years perfecting the art of showing visitors the real Georgia. My tours focus on {specialty}, weaving together history, culture, and natural beauty into a seamless experience. I speak {languages} and take pride in making every traveler feel at home.`,

  `Hello! {name} here, your expert guide with {years} years in the tourism industry. Operating primarily from {city}, I offer carefully curated experiences centered on {specialty}. My language skills ({languages}) allow me to cater to an international audience, and my local connections open doors that other tours simply can't.`,

  `I'm {name}, and for {years} years I've been helping travelers discover why Georgia is one of the world's most extraordinary destinations. Based in {city}, I bring enthusiasm, expertise, and genuine hospitality to every tour. My focus on {specialty} means you'll get an in-depth, authentic experience. I speak {languages}.`,

  `Traveler, welcome! I'm {name} from {city}. Over my {years} years as a professional guide, I've earned a reputation for creating truly memorable experiences. I specialize in {specialty} and am passionate about Georgian history and traditions. I communicate in {languages} and tailor each tour to my guests' interests.`,

  `Greetings from {city}! I'm {name}, and with {years} years of guiding experience, I know the stories behind every ancient stone and vineyard in this country. My specialty is {specialty}, and I speak {languages}. I believe travel should transform you, and I work hard to make that happen for every single guest.`,
];

export const GUIDE_BIO_TEMPLATES_RU: string[] = [
  `Гамарджоба! Меня зовут {name}, я профессиональный гид с {years}-летним опытом работы в Грузии. Я живу в городе {city} и специализируюсь на {specialty}. Владею {languages}. Мои туры сочетают глубокие знания местной культуры с личными историями, чтобы каждый путешественник увёз с собой незабываемые впечатления.`,

  `Познакомьтесь с {name} — вашим местным другом в Грузии! За {years} лет работы гидом я показал(а) сотням путешественников скрытые жемчужины {city} и окрестностей. Моя специализация — {specialty}, и я горжусь тем, что создаю камерные, информативные программы. Свободно владею {languages}.`,

  `Меня зовут {name}, я сертифицированный гид с {years}-летним профессиональным стажем. Жизнь в {city} дала мне уникальную перспективу, которую не найти ни в одном путеводителе. Я специализируюсь на {specialty} и говорю на {languages}. Каждый тур я адаптирую под интересы и темп гостей.`,

  `Добро пожаловать в Грузию! Я {name}, и вот уже {years} лет делюсь красотой этой невероятной страны. От мощёных улочек {city} до отдалённых горных деревень — я создаю путешествия, которые трогают сердце. Моя экспертиза — {specialty}. Говорю на {languages}.`,

  `Гамарджоба! Я {name}, родился(ась) и вырос(ла) в {city}. Последние {years} лет я посвятил(а) карьеру тому, чтобы показывать путешественникам настоящую Грузию. Моя специализация — {specialty}, где я сочетаю исторические знания с практическим опытом. Владею {languages}.`,

  `Привет, я {name}! Будучи гидом уже {years} лет в {city}, я по-настоящему полюбил(а) каждый уголок Грузии. Специализируюсь на {specialty} и известен(а) увлекательным рассказом и вниманием к деталям. Свободно говорю на {languages}, чтобы каждый гость чувствовал себя комфортно.`,

  `Меня зовут {name}, и гидовство — это моё призвание. С {years}-летним опытом работы из {city} я провёл(а) тысячи посетителей по самым живописным местам и культурным достопримечательностям Грузии. Моя экспертиза в {specialty} выделяет мои туры. Свободно владею {languages}.`,

  `Я {name}, гид из {city}, который {years} лет совершенствует искусство показывать гостям настоящую Грузию. Мои туры фокусируются на {specialty}, переплетая историю, культуру и природную красоту в единое целое. Говорю на {languages} и стараюсь, чтобы каждый чувствовал себя как дома.`,

  `Здравствуйте! Это {name}, ваш эксперт-гид с {years}-летним стажем в туристической индустрии. Работая преимущественно из {city}, я предлагаю тщательно подобранные программы с акцентом на {specialty}. Мои языковые навыки ({languages}) позволяют работать с международной аудиторией.`,

  `Я {name}, и вот уже {years} лет помогаю путешественникам открывать для себя, почему Грузия — одно из самых необыкновенных мест на планете. Живу в {city}, приношу энтузиазм и подлинное гостеприимство в каждый тур. Специализация — {specialty}. Говорю на {languages}.`,

  `Путешественник, добро пожаловать! Я {name} из {city}. За {years} лет профессионального гидовства я заслужил(а) репутацию создателя поистине незабываемых впечатлений. Специализируюсь на {specialty} и увлечён(а) грузинской историей. Общаюсь на {languages}.`,
];

// =============================================================================
// DRIVER BIO TEMPLATES
// =============================================================================

/**
 * Placeholders: {name}, {years}, {vehicleType}, {city}
 */
export const DRIVER_BIO_TEMPLATES_EN: string[] = [
  `I'm {name}, a professional driver with {years} years of experience navigating Georgia's diverse roads. Based in {city}, my {vehicleType} is always clean, comfortable, and well-maintained. I know every scenic route, the best photo stops, and the hidden restaurants along the way. Your journey will be as memorable as the destination.`,

  `Hello! {name} here — your reliable driver in Georgia for {years} years. Operating a comfortable {vehicleType} from {city}, I specialize in safe, smooth transfers across the country. Whether it's mountain passes or coastal highways, I'll get you there comfortably and on time.`,

  `Meet {name}, your {city}-based chauffeur with {years} years behind the wheel. My well-equipped {vehicleType} offers a premium travel experience with air conditioning, charging ports, and plenty of luggage space. I'm punctual, professional, and always happy to share local tips during our drive.`,

  `I'm {name}, and driving tourists across Georgia has been my passion for {years} years. Based in {city}, my {vehicleType} is perfect for both short city transfers and multi-day road trips. I maintain the highest safety standards and know every beautiful viewpoint along Georgia's routes.`,

  `Professional driver {name} at your service! With {years} years of experience in {city} and throughout Georgia, I offer reliable transportation in my modern {vehicleType}. I'm known for my careful driving, friendly demeanor, and willingness to accommodate flexible itineraries.`,

  `Gamarjoba! I'm {name} from {city}, offering premium driving services for {years} years. My spacious {vehicleType} is ideal for families and small groups seeking comfort on Georgia's adventurous roads. I speak basic English and always ensure a safe, enjoyable ride.`,

  `Hi, I'm {name}! For {years} years I've been transporting travelers to Georgia's most beautiful destinations from my base in {city}. My {vehicleType} handles everything from smooth highways to rugged mountain tracks. I take pride in being reliable, clean, and always on schedule.`,

  `{name} here — your experienced driver based in {city}. After {years} years on Georgia's roads, there isn't a route I don't know. My well-maintained {vehicleType} provides a comfortable journey, and I'm always happy to recommend great local spots along the way.`,

  `I'm {name}, a dedicated driver with {years} years of experience serving tourists and locals in {city}. My {vehicleType} features modern amenities for a comfortable ride. I believe the journey matters as much as the destination, and I work to make every trip pleasant and stress-free.`,
];

export const DRIVER_BIO_TEMPLATES_RU: string[] = [
  `Меня зовут {name}, я профессиональный водитель с {years}-летним опытом езды по разнообразным дорогам Грузии. Базируюсь в {city}, мой {vehicleType} всегда чистый, комфортный и технически исправный. Знаю каждый живописный маршрут и лучшие остановки для фото.`,

  `Здравствуйте! {name} — ваш надёжный водитель в Грузии уже {years} лет. Управляя комфортабельным {vehicleType} из {city}, я специализируюсь на безопасных трансферах по всей стране. Горные перевалы или прибрежные трассы — довезу с комфортом и вовремя.`,

  `Познакомьтесь с {name}, вашим водителем из {city} с {years}-летним стажем за рулём. Мой оснащённый {vehicleType} предлагает премиальный уровень комфорта: кондиционер, зарядные устройства, достаточно места для багажа. Пунктуален, профессионален и всегда рад поделиться местными советами.`,

  `Я {name}, и перевозка туристов по Грузии — моя страсть уже {years} лет. Живу в {city}, мой {vehicleType} отлично подходит как для коротких городских трансферов, так и для многодневных путешествий. Соблюдаю высочайшие стандарты безопасности.`,

  `Профессиональный водитель {name} к вашим услугам! С {years}-летним опытом работы в {city} и по всей Грузии предлагаю надёжный транспорт на современном {vehicleType}. Меня знают за аккуратное вождение и дружелюбие.`,

  `Гамарджоба! Я {name} из {city}, предоставляю услуги вождения премиум-класса уже {years} лет. Мой просторный {vehicleType} идеален для семей и небольших групп. Говорю по-русски и всегда обеспечиваю безопасную, приятную поездку.`,

  `Привет, я {name}! Уже {years} лет вожу путешественников к самым красивым местам Грузии из {city}. Мой {vehicleType} справляется и с гладкими шоссе, и с горными тропами. Горжусь своей надёжностью и пунктуальностью.`,

  `{name} — ваш опытный водитель из {city}. За {years} лет на дорогах Грузии нет маршрута, которого я не знаю. Мой ухоженный {vehicleType} обеспечит комфортное путешествие. Всегда рад порекомендовать отличные местные заведения по пути.`,

  `Я {name}, преданный своему делу водитель с {years}-летним опытом обслуживания туристов в {city}. Мой {vehicleType} оснащён современными удобствами. Верю, что путешествие важно не меньше, чем пункт назначения, и стараюсь сделать каждую поездку приятной.`,
];

// =============================================================================
// COMPANY DESCRIPTION TEMPLATES
// =============================================================================

/**
 * Placeholders: {name}, {specialty}, {years}
 */
export const COMPANY_DESCRIPTION_TEMPLATES_EN: string[] = [
  `{name} is a premier travel company specializing in {specialty} across Georgia and the Caucasus region. With {years} years of experience, we've helped thousands of travelers discover the beauty, history, and culture of this extraordinary land. Our team of certified guides and travel experts creates unforgettable journeys through ancient monasteries, stunning mountain landscapes, and world-renowned wine regions.`,

  `Welcome to {name} — your gateway to authentic Georgian experiences. Specializing in {specialty} for {years} years, we offer carefully curated tours that go beyond the typical tourist trail. Our local experts share insider knowledge, hidden gems, and personal stories that bring Georgia's rich heritage to life.`,

  `Founded {years} years ago, {name} has grown into one of Georgia's most trusted travel companies. Our focus on {specialty} means every tour is crafted with deep expertise and genuine passion. From small group adventures to private excursions, we deliver exceptional service and authentic experiences that create lasting memories.`,

  `{name} celebrates the best of Georgian tourism through our specialized {specialty} programs. For {years} years, we've been connecting travelers with the heart and soul of the Caucasus. Our commitment to quality, sustainability, and authentic cultural exchange sets us apart in a growing industry.`,

  `At {name}, we believe travel should be transformative. Specializing in {specialty} for {years} years, our experienced team designs journeys that immerse you in Georgia's vibrant culture, breathtaking landscapes, and warm hospitality. Every detail is thoughtfully planned to exceed your expectations.`,

  `Discover Georgia with {name} — a company built on {years} years of passion for {specialty}. We offer unique experiences that combine adventure, culture, and culinary delights. Our multilingual guides and modern fleet ensure comfort and safety throughout your journey.`,

  `{name} is your trusted partner for exploring the Caucasus. With {years} years dedicated to {specialty}, we know the secret spots, the perfect timing, and the local connections that transform a good trip into an extraordinary one. Join us and see Georgia through the eyes of those who love it most.`,

  `For {years} years, {name} has been at the forefront of Georgian tourism, specializing in {specialty}. We take pride in our attention to detail, our network of local artisans and winemakers, and our ability to create bespoke experiences for travelers from around the world.`,
];

export const COMPANY_DESCRIPTION_TEMPLATES_RU: string[] = [
  `{name} — ведущая туристическая компания, специализирующаяся на {specialty} по всей Грузии и Кавказскому региону. С {years}-летним опытом мы помогли тысячам путешественников открыть для себя красоту, историю и культуру этой необыкновенной земли. Наша команда сертифицированных гидов создаёт незабываемые путешествия.`,

  `Добро пожаловать в {name} — ваш путь к настоящим грузинским впечатлениям. Специализируясь на {specialty} уже {years} лет, мы предлагаем тщательно подобранные туры, выходящие за рамки типичных маршрутов. Наши местные эксперты делятся уникальными знаниями и личными историями.`,

  `Основанная {years} лет назад, компания {name} стала одной из самых надёжных в Грузии. Наш фокус на {specialty} означает, что каждый тур создан с глубокой экспертизой и подлинной страстью. От групповых приключений до частных экскурсий — мы обеспечиваем исключительный сервис.`,

  `{name} отмечает лучшее в грузинском туризме через наши специализированные программы {specialty}. Уже {years} лет мы связываем путешественников с сердцем и душой Кавказа. Наша приверженность качеству и устойчивому туризму выделяет нас на растущем рынке.`,

  `В {name} мы верим, что путешествие должно преображать. Специализируясь на {specialty} уже {years} лет, наша команда проектирует маршруты, погружающие вас в яркую культуру Грузии, захватывающие дух пейзажи и тёплое гостеприимство.`,

  `Откройте для себя Грузию с {name} — компанией, построенной на {years}-летней страсти к {specialty}. Мы предлагаем уникальные впечатления, сочетающие приключения, культуру и кулинарные изыски. Наши многоязычные гиды обеспечат комфорт на всём протяжении путешествия.`,

  `{name} — ваш надёжный партнёр в исследовании Кавказа. С {years} годами опыта в {specialty} мы знаем секретные места и идеальное время для посещения. Присоединяйтесь и увидьте Грузию глазами тех, кто любит её больше всего.`,

  `Уже {years} лет {name} находится в авангарде грузинского туризма, специализируясь на {specialty}. Мы гордимся вниманием к деталям, сетью местных мастеров и виноделов и способностью создавать индивидуальные программы для путешественников со всего мира.`,
];

// =============================================================================
// TOUR TITLE TEMPLATES BY CATEGORY
// =============================================================================

export interface TourTitlesByCategory {
  [category: string]: string[];
}

export const TOUR_TITLE_TEMPLATES_EN: TourTitlesByCategory = {
  'Adventure': [
    'Rafting Adventure on the Aragvi River',
    'Paragliding Over the Caucasus Mountains',
    'Off-Road Expedition Through Tusheti',
    'Canyoning in Martvili Canyon',
    'Zip-Line and Adventure Park Experience',
    'Rock Climbing in Chaukhi Massif',
  ],
  'Cultural': [
    'Ancient Monasteries and Churches Trail',
    'Georgian Polyphonic Singing Workshop',
    'Traditional Carpet Weaving Experience',
    'Living Heritage: Village Life Immersion',
    'Georgian Dance and Music Evening',
    'Medieval Tower Houses of Svaneti',
  ],
  'Wine & Food': [
    'Kakheti Wine Route: Cellars and Vineyards',
    'Qvevri Winemaking Masterclass',
    'Georgian Cooking Class with Market Tour',
    'Chacha Distillery and Wine Tasting',
    'Farm-to-Table Feast in the Countryside',
    'Cheese and Bread Making Workshop',
  ],
  'Nature': [
    'Pristine Forests of Lagodekhi Reserve',
    'Birdwatching in Javakheti Wetlands',
    'Borjomi National Park Nature Walk',
    'Vashlovani Badlands Expedition',
    'Alpine Meadows and Wildflower Trail',
    'Mtirala Rainforest Discovery',
  ],
  'Historical': [
    'Vardzia Cave City and Rabati Castle',
    'Uplistsikhe: Georgia\'s Ancient Rock Town',
    'Silk Road Heritage Tour',
    'Soviet Legacy: Architecture and Stories',
    'David Gareja Monastery Complex',
    'Gori: Fortress and Museum Trail',
  ],
  'City Tour': [
    'Tbilisi Old Town Walking Tour',
    'Hidden Gems of Tbilisi: Street Art and Courtyards',
    'Batumi: Modern Architecture and History',
    'Kutaisi: City of the Golden Fleece',
    'Tbilisi by Night: Lights and Legends',
    'Art Nouveau Tbilisi: Architecture Walk',
  ],
  'Photography': [
    'Sunrise Photography at Gergeti Trinity',
    'Golden Hour in Signagi: Vineyard Views',
    'Svaneti Tower Houses Photo Expedition',
    'Tbilisi Contrasts: Old Meets New',
    'Landscapes of the Greater Caucasus',
    'Village Portraits: Faces of Georgia',
  ],
  'Hiking': [
    'Juta to Roshka: Chaukhi Pass Crossing',
    'Mestia to Ushguli Multi-Day Trek',
    'Truso Valley: Gorge and Mineral Springs',
    'Mount Kazbek Base Camp Trek',
    'Shatili to Mutso Historic Trail',
    'Abudelauri Lakes Day Hike',
  ],
  'Ski & Snow': [
    'Gudauri Freeride Skiing Day',
    'Bakuriani Family Ski Package',
    'Backcountry Skiing in Tetnuldi',
    'Winter Wonderland: Snowshoe Trek',
    'Gudauri to Kazbegi Snow Adventure',
    'Cross-Country Skiing in Bakuriani',
  ],
  'Beach & Coast': [
    'Batumi Beach and Botanical Garden',
    'Black Sea Kayaking Adventure',
    'Coastal Villages of Adjara',
    'Dolphin Watching Boat Tour',
    'Sunset Cruise Along the Coastline',
    'Kobuleti Beach and Wetlands Tour',
  ],
};

export const TOUR_TITLE_TEMPLATES_RU: TourTitlesByCategory = {
  'Adventure': [
    'Рафтинг на реке Арагви',
    'Параплан над Кавказскими горами',
    'Внедорожная экспедиция по Тушетии',
    'Каньонинг в Мартвильском каньоне',
    'Зиплайн и верёвочный парк',
    'Скалолазание на массиве Чаухи',
  ],
  'Cultural': [
    'Тропа древних монастырей и церквей',
    'Мастер-класс грузинского многоголосия',
    'Традиционное ковроткачество: мастер-класс',
    'Живое наследие: погружение в деревенский быт',
    'Вечер грузинского танца и музыки',
    'Средневековые башни Сванетии',
  ],
  'Wine & Food': [
    'Винный маршрут Кахетии: погреба и виноградники',
    'Мастер-класс квеври-виноделия',
    'Кулинарный мастер-класс с экскурсией на рынок',
    'Дегустация чачи и вина',
    'Фермерский пир в деревне',
    'Мастер-класс по сыро- и хлебоварению',
  ],
  'Nature': [
    'Девственные леса заповедника Лагодехи',
    'Бёрдвотчинг в Джавахетских болотах',
    'Боржоми: прогулка по национальному парку',
    'Экспедиция по бедлендам Вашловани',
    'Альпийские луга и тропа полевых цветов',
    'Тропический лес Мтирала: открытие',
  ],
  'Historical': [
    'Пещерный город Вардзия и крепость Рабати',
    'Уплисцихе: древний скальный город',
    'Тур по наследию Шёлкового пути',
    'Советское наследие: архитектура и истории',
    'Монастырский комплекс Давид Гареджи',
    'Гори: крепость и музейная тропа',
  ],
  'City Tour': [
    'Пешая прогулка по старому Тбилиси',
    'Скрытые жемчужины Тбилиси: стрит-арт и дворы',
    'Батуми: современная архитектура и история',
    'Кутаиси: город Золотого руна',
    'Ночной Тбилиси: огни и легенды',
    'Тбилиси в стиле ар-нуво: архитектурная прогулка',
  ],
  'Photography': [
    'Рассвет у Гергетской Троицы: фототур',
    'Золотой час в Сигнахи: виды виноградников',
    'Фотоэкспедиция к сванским башням',
    'Контрасты Тбилиси: старое и новое',
    'Пейзажи Большого Кавказа',
    'Портреты деревень: лица Грузии',
  ],
  'Hiking': [
    'Джута — Рошка: перевал Чаухи',
    'Местиа — Ушгули: многодневный трек',
    'Долина Трусо: ущелье и минеральные источники',
    'Казбек: трек к базовому лагерю',
    'Шатили — Муцо: историческая тропа',
    'Озёра Абуделаури: дневной поход',
  ],
  'Ski & Snow': [
    'Фрирайд в Гудаури',
    'Бакуриани: семейный горнолыжный пакет',
    'Бэккантри на Тетнулди',
    'Зимняя сказка: трек на снегоступах',
    'Гудаури — Казбеги: снежное приключение',
    'Беговые лыжи в Бакуриани',
  ],
  'Beach & Coast': [
    'Батуми: пляж и ботанический сад',
    'Каякинг на Чёрном море',
    'Прибрежные деревни Аджарии',
    'Наблюдение за дельфинами: морская прогулка',
    'Закатный круиз вдоль побережья',
    'Кобулети: пляж и заболоченные угодья',
  ],
};

// =============================================================================
// TOUR SUMMARY TEMPLATES
// =============================================================================

export const TOUR_SUMMARY_TEMPLATES_EN: string[] = [
  'Discover the hidden beauty of Georgia on this unforgettable guided experience through breathtaking landscapes and ancient heritage sites.',
  'Immerse yourself in authentic Georgian culture with expert local guides who share insider stories and off-the-beaten-path discoveries.',
  'Experience the best of the Caucasus with a carefully curated journey combining natural wonders, rich history, and warm hospitality.',
  'Join us for an extraordinary adventure through one of the most beautiful and culturally rich regions in the world.',
  'A perfect blend of history, nature, and gastronomy — this tour showcases why Georgia is every traveler\'s new favorite destination.',
  'Explore Georgia\'s magnificent landscapes and centuries-old traditions with a passionate local guide by your side.',
  'From stunning mountain vistas to ancient cave cities, this tour captures the essence of Georgian heritage and natural beauty.',
  'Let our experienced guides take you on a journey through time and terrain in one of the world\'s most extraordinary countries.',
  'Uncover the secrets of the Caucasus on this thoughtfully designed tour that balances adventure, culture, and relaxation.',
  'Whether you\'re a first-time visitor or a returning traveler, this experience will reveal a side of Georgia you\'ve never seen.',
];

export const TOUR_SUMMARY_TEMPLATES_RU: string[] = [
  'Откройте скрытую красоту Грузии в этом незабываемом путешествии по захватывающим пейзажам и древним памятникам наследия.',
  'Погрузитесь в настоящую грузинскую культуру с опытными местными гидами, которые расскажут уникальные истории.',
  'Испытайте лучшее, что может предложить Кавказ — тщательно спланированное путешествие с природными чудесами и тёплым гостеприимством.',
  'Присоединяйтесь к нашему необыкновенному приключению по одному из самых красивых и культурно богатых регионов мира.',
  'Идеальное сочетание истории, природы и гастрономии — этот тур показывает, почему Грузия стала любимым направлением.',
  'Исследуйте великолепные пейзажи Грузии и многовековые традиции с увлечённым местным гидом.',
  'От потрясающих горных панорам до древних пещерных городов — этот тур передаёт суть грузинского наследия.',
  'Позвольте нашим опытным гидам провести вас через время и пространство в одной из самых удивительных стран мира.',
  'Раскройте тайны Кавказа в этом продуманном туре, сочетающем приключения, культуру и отдых.',
  'Впервые ли вы в Грузии или возвращаетесь — это путешествие откроет вам сторону страны, которую вы ещё не видели.',
];

// =============================================================================
// TOUR DESCRIPTION TEMPLATES
// =============================================================================

export const TOUR_DESCRIPTION_TEMPLATES_EN: string[] = [
  `Embark on an extraordinary journey through Georgia's most captivating landscapes and cultural treasures. This carefully designed tour takes you from the vibrant streets of the city to the serene beauty of the countryside, offering an immersive experience that combines history, nature, and authentic Georgian hospitality.

Your expert local guide will share fascinating stories behind every landmark, from ancient fortresses that have stood for centuries to family-run wineries carrying on traditions dating back 8,000 years. Along the way, you'll enjoy traditional cuisine prepared with locally sourced ingredients and sample wines that represent the birthplace of viticulture.

Tour Highlights:
- Expert-guided exploration of iconic and hidden sites
- Traditional Georgian meal included
- Small group size for a personalized experience
- All transportation and entrance fees included
- Photo opportunities at stunning viewpoints

This tour is suitable for all fitness levels and operates in all weather conditions. Comfortable walking shoes are recommended.`,

  `Step into a world where ancient traditions meet breathtaking natural beauty. This immersive Georgian experience is designed for travelers who want to go beyond the surface and truly connect with the land, its people, and its extraordinary heritage.

From the moment we meet, you'll be transported into a world of medieval churches, dramatic mountain passes, and warm village hospitality that has remained unchanged for centuries. Our knowledgeable guide brings history to life through vivid storytelling, local insights, and genuine passion for Georgia's cultural wealth.

What's Included:
- Professional English-speaking guide
- Comfortable transportation throughout
- Authentic lunch at a local family home
- All entrance fees and permits
- Hotel pickup and drop-off

Special Features:
- Maximum 12 guests for an intimate experience
- Flexible itinerary to accommodate group interests
- Complimentary local treats and beverages

Whether you're a history enthusiast, nature lover, or food connoisseur, this tour offers something extraordinary for everyone.`,

  `Discover the magic of Georgia through an unforgettable journey that weaves together the country's most remarkable sites, flavors, and stories. Led by a passionate local expert, this tour is more than sightseeing — it's a deep dive into the soul of a nation with one of the richest cultural heritages on earth.

You'll traverse landscapes that range from lush green valleys to dramatic mountain peaks, visiting ancient monuments that tell the story of civilizations spanning millennia. Each stop is carefully chosen to reveal a different facet of Georgian life — from the sacred to the celebratory, from the rural to the cosmopolitan.

Tour Details:
- Duration designed for a thorough, unhurried experience
- Small group format (max 10 participants)
- Traditional supra (feast) with local wine pairing
- Off-the-beaten-path locations not found in guidebooks
- All necessary gear and equipment provided

Important Information:
- Moderate walking required (2-3 hours total)
- Tour operates rain or shine
- Free cancellation up to 24 hours in advance
- Children welcome (ages 6+)

Book this tour and let Georgia surprise you with its beauty, warmth, and timeless charm.`,

  `Experience Georgia as the locals do — with open hearts, full glasses, and stories that span thousands of years. This thoughtfully crafted tour combines the country's most stunning scenery with intimate cultural encounters that leave a lasting impression.

Your journey begins with a scenic drive through landscapes that have inspired poets and painters for centuries. Along the way, we'll stop at historic sites where kingdoms rose and fell, ancient churches where rare frescoes still glow with original color, and family estates where the art of winemaking continues as it has for generations.

What Makes This Tour Special:
- Personal attention from an experienced, certified guide
- Access to private estates and workshops not open to the public
- A genuine supra experience with a local family
- Curated music and storytelling that bring each site to life
- Sustainable tourism practices that support local communities

Practical Details:
- Comfortable, air-conditioned vehicle
- Bottled water and snacks provided
- Dietary restrictions accommodated with advance notice
- Tour available in English, Russian, and German

This isn't just a tour — it's an invitation into the heart of Georgia.`,
];

export const TOUR_DESCRIPTION_TEMPLATES_RU: string[] = [
  `Отправьтесь в необыкновенное путешествие по самым захватывающим пейзажам и культурным сокровищам Грузии. Этот тщательно продуманный тур проведёт вас от оживлённых улиц города до безмятежной красоты сельской местности, предлагая погружение в историю, природу и подлинное грузинское гостеприимство.

Ваш опытный местный гид расскажет увлекательные истории каждой достопримечательности — от древних крепостей, стоящих веками, до семейных виноделен, хранящих традиции, которым 8 000 лет. По пути вы попробуете блюда традиционной кухни из местных продуктов и вина, олицетворяющие родину виноделия.

Основные моменты:
- Экскурсия с экспертом по знаковым и скрытым местам
- Традиционный грузинский обед включён
- Маленькая группа для персонализированного опыта
- Все трансферы и входные билеты включены
- Фотоостановки на потрясающих смотровых площадках

Тур подходит для любого уровня физической подготовки. Рекомендуется удобная обувь для ходьбы.`,

  `Шагните в мир, где древние традиции встречаются с захватывающей природной красотой. Это погружение в грузинскую культуру создано для путешественников, которые хотят по-настоящему познакомиться с землёй, её людьми и необычайным наследием.

С момента встречи вы перенесётесь в мир средневековых церквей, драматичных горных перевалов и тёплого деревенского гостеприимства, не менявшегося веками. Наш знающий гид оживит историю через яркое повествование и подлинную страсть к культурному богатству Грузии.

Что включено:
- Профессиональный русскоговорящий гид
- Комфортный транспорт на протяжении всего маршрута
- Аутентичный обед в местном семейном доме
- Все входные билеты и разрешения
- Трансфер из отеля и обратно

Особенности:
- Максимум 12 гостей для камерной атмосферы
- Гибкий маршрут с учётом пожеланий группы
- Комплиментарные местные угощения и напитки

Будь вы ценитель истории, любитель природы или гурман — этот тур предлагает нечто необыкновенное для каждого.`,

  `Откройте магию Грузии в незабываемом путешествии, сплетающем воедино самые замечательные достопримечательности, вкусы и истории страны. Под руководством увлечённого местного эксперта, этот тур — не просто осмотр, а глубокое погружение в душу нации с одним из богатейших культурных наследий на земле.

Вы пересечёте ландшафты от пышных зелёных долин до драматичных горных вершин, посещая древние памятники, рассказывающие историю цивилизаций тысячелетней давности. Каждая остановка выбрана так, чтобы раскрыть иную грань грузинской жизни.

Детали тура:
- Продолжительность рассчитана на неспешный, основательный опыт
- Формат малой группы (максимум 10 участников)
- Традиционная супра (застолье) с местным вином
- Малоизвестные места, не указанные в путеводителях
- Всё необходимое снаряжение предоставляется

Важная информация:
- Требуется умеренная ходьба (2-3 часа суммарно)
- Тур проводится в любую погоду
- Бесплатная отмена за 24 часа
- Дети приветствуются (от 6 лет)

Забронируйте этот тур и позвольте Грузии удивить вас своей красотой и теплотой.`,

  `Познакомьтесь с Грузией так, как это делают местные — с открытыми сердцами, полными бокалами и историями, охватывающими тысячелетия. Этот продуманный тур сочетает потрясающие пейзажи с камерными культурными встречами, оставляющими неизгладимое впечатление.

Путешествие начинается с живописной поездки через ландшафты, вдохновлявшие поэтов и художников на протяжении столетий. По пути мы остановимся у исторических мест, древних церквей с оригинальными фресками и фамильных имений, где искусство виноделия продолжается поколениями.

Что делает этот тур особенным:
- Персональное внимание опытного сертифицированного гида
- Доступ к частным поместьям, закрытым для публики
- Настоящая супра с местной семьёй
- Живая музыка и рассказы, оживляющие каждое место
- Устойчивый туризм с поддержкой местных сообществ

Практические детали:
- Комфортный автомобиль с кондиционером
- Бутилированная вода и закуски предоставляются
- Диетические ограничения учитываются при предварительном уведомлении
- Тур доступен на русском, английском и немецком

Это не просто тур — это приглашение в сердце Грузии.`,
];

// =============================================================================
// ITINERARY STEP TEMPLATES BY CATEGORY
// =============================================================================

export interface ItineraryStepTemplate {
  title: string;
  description: string;
}

export interface ItineraryStepsByCategory {
  [category: string]: ItineraryStepTemplate[];
}

export const ITINERARY_STEP_TEMPLATES_EN: ItineraryStepsByCategory = {
  'Adventure': [
    { title: 'Safety Briefing & Equipment Check', description: 'Meet your instructor for a comprehensive safety briefing. All equipment is inspected and fitted to ensure your comfort and security throughout the adventure.' },
    { title: 'Warm-Up & Practice Session', description: 'A gentle introduction to the activity with basic techniques demonstrated by your experienced guide. Practice in a controlled environment before heading to the main course.' },
    { title: 'Main Adventure Activity', description: 'The highlight of the day! Tackle the main challenge with your guide providing support, encouragement, and photography along the way.' },
    { title: 'Scenic Rest and Refreshments', description: 'Take a well-deserved break at a scenic viewpoint. Enjoy local snacks, fresh water, and spectacular views of the surrounding landscape.' },
    { title: 'Second Adventure Stage', description: 'Continue your adventure with an exciting second stage that offers new challenges and even more spectacular scenery.' },
    { title: 'Celebration and Wrap-Up', description: 'Celebrate your accomplishment with the group. Share stories, review photos, and receive your adventure certificate.' },
  ],
  'Cultural': [
    { title: 'Welcome & Cultural Introduction', description: 'Your guide provides historical context and cultural background for the sites you\'ll visit today, setting the stage for a deeper appreciation.' },
    { title: 'Ancient Heritage Site Visit', description: 'Explore a UNESCO-listed or nationally significant heritage site. Your guide brings the stones to life with vivid stories of the people who built and worshipped here.' },
    { title: 'Traditional Craft Workshop', description: 'Participate in a hands-on workshop with local artisans. Learn traditional techniques that have been passed down through generations.' },
    { title: 'Local Community Interaction', description: 'Meet local residents who share their personal stories, traditions, and way of life. A genuine cultural exchange beyond the tourist surface.' },
    { title: 'Traditional Meal Experience', description: 'Sit down for a traditional Georgian meal prepared by local hosts. Learn about the significance of each dish and the rituals of the Georgian table.' },
    { title: 'Reflection and Farewell', description: 'A quiet moment to absorb the day\'s experiences. Your guide helps connect the historical and cultural threads into a complete picture.' },
  ],
  'Wine & Food': [
    { title: 'Market Visit & Ingredient Selection', description: 'Start at a bustling local market where your guide explains the seasonal ingredients that form the foundation of Georgian cuisine.' },
    { title: 'Family Winery Visit', description: 'Visit a family-owned winery where traditional qvevri winemaking has been practiced for generations. Tour the vineyard and underground cellars.' },
    { title: 'Wine Tasting Session', description: 'Sample 5-7 wines including rare indigenous grape varieties. Your sommelier guide explains the characteristics of each vintage and the art of qvevri aging.' },
    { title: 'Cooking Class', description: 'Roll up your sleeves and learn to prepare classic Georgian dishes under the guidance of a local chef. Khinkali, khachapuri, and more!' },
    { title: 'Supra Feast', description: 'Enjoy the fruits of your labor at a traditional supra. A tamada leads toasts as you feast on the dishes you prepared alongside local specialties.' },
    { title: 'Dessert & Churchkhela Making', description: 'Learn to make churchkhela (Georgian walnut candy) and enjoy traditional desserts with a final glass of wine.' },
  ],
  'Nature': [
    { title: 'Trailhead Orientation', description: 'Meet at the trailhead for a briefing on the day\'s route, wildlife you might encounter, and safety guidelines for the protected area.' },
    { title: 'Forest Canopy Walk', description: 'Enter the pristine forest and walk beneath ancient canopies. Your naturalist guide identifies native species and explains the ecosystem.' },
    { title: 'Waterfall or Lake Discovery', description: 'Reach a hidden natural wonder — a secluded waterfall or pristine alpine lake. Time for photography and quiet contemplation.' },
    { title: 'Wildlife Observation Point', description: 'Settle at a carefully chosen observation point. With binoculars provided, spot native birds, deer, and if lucky, chamois or eagles.' },
    { title: 'Picnic in Nature', description: 'A prepared picnic with local organic food in a stunning natural setting. Listen to the sounds of the forest while you recharge.' },
    { title: 'Gentle Return Journey', description: 'A different path back through varied terrain, with final opportunities for photography and nature appreciation.' },
  ],
  'Historical': [
    { title: 'Historical Overview Presentation', description: 'Your historian guide sets the scene with a brief presentation covering the key periods and events you\'ll encounter during today\'s tour.' },
    { title: 'Fortress or Castle Exploration', description: 'Explore the remains of a historic fortress. Walk the walls, examine the architecture, and hear tales of the sieges and rulers who shaped Georgian history.' },
    { title: 'Archaeological Site Visit', description: 'Visit an active or preserved archaeological site where centuries of human habitation are revealed layer by layer.' },
    { title: 'Museum Deep Dive', description: 'A guided tour through a curated museum collection with artifacts that bring the abstract history into tangible reality.' },
    { title: 'Medieval Church Interior', description: 'Step inside a medieval church to admire original frescoes, carved stonework, and understand the role of the church in Georgian national identity.' },
    { title: 'Historical Discussion & Q&A', description: 'An open discussion with your guide about the themes of the day. Ask questions, share observations, and connect the past to the present.' },
  ],
  'Hiking': [
    { title: 'Trailhead Meeting & Route Briefing', description: 'Meet your mountain guide at the trailhead. Review the day\'s route on the map, check equipment, and begin the ascent at a comfortable pace.' },
    { title: 'Alpine Meadow Crossing', description: 'Traverse flower-filled alpine meadows with panoramic mountain views. Your guide shares geological and botanical insights along the way.' },
    { title: 'Mountain Pass Summit', description: 'Reach the high point of the trek — a mountain pass with stunning 360-degree views. Time for photos and a celebratory snack.' },
    { title: 'Ridge Walk & Viewpoints', description: 'Walk along a dramatic ridge with views into deep valleys on both sides. One of the most scenic sections of the entire trek.' },
    { title: 'Mountain Village Stop', description: 'Descend to a traditional mountain village. Meet locals, enjoy homemade refreshments, and learn about high-altitude living traditions.' },
    { title: 'Descent & Conclusion', description: 'A scenic descent through varied terrain back to the finish point. Final group photo and transfer back to your accommodation.' },
  ],
};

export const ITINERARY_STEP_TEMPLATES_RU: ItineraryStepsByCategory = {
  'Adventure': [
    { title: 'Инструктаж по безопасности', description: 'Встреча с инструктором для подробного инструктажа. Всё снаряжение проверяется и подгоняется для вашего комфорта и безопасности.' },
    { title: 'Разминка и тренировка', description: 'Мягкое знакомство с активностью: базовые техники от опытного гида. Практика в контролируемой среде перед основным маршрутом.' },
    { title: 'Основная активность', description: 'Главное событие дня! Преодолевайте вызовы с поддержкой гида, который подбадривает и фотографирует.' },
    { title: 'Отдых на смотровой площадке', description: 'Заслуженный отдых с видом на окрестности. Местные закуски, свежая вода и захватывающие панорамы.' },
    { title: 'Второй этап приключения', description: 'Продолжение приключения с новыми вызовами и ещё более впечатляющими видами.' },
    { title: 'Празднование и итоги', description: 'Отметьте своё достижение с группой. Обменяйтесь впечатлениями и получите сертификат участника.' },
  ],
  'Cultural': [
    { title: 'Приветствие и введение', description: 'Гид даёт исторический контекст и культурную справку по местам, которые вы посетите, подготавливая к более глубокому восприятию.' },
    { title: 'Посещение объекта наследия', description: 'Осмотр объекта из списка ЮНЕСКО или национально значимого памятника. Гид оживляет камни яркими историями о строителях и молящихся.' },
    { title: 'Мастер-класс ремесла', description: 'Участие в практическом занятии с местными мастерами. Изучение традиционных техник, передающихся из поколения в поколение.' },
    { title: 'Общение с местными жителями', description: 'Знакомство с местными жителями, их личными историями, традициями и образом жизни. Настоящий культурный обмен.' },
    { title: 'Традиционная трапеза', description: 'Традиционный грузинский обед от местных хозяев. Узнайте о значении каждого блюда и ритуалах грузинского застолья.' },
    { title: 'Осмысление и прощание', description: 'Спокойный момент для усвоения впечатлений дня. Гид помогает связать исторические и культурные нити в цельную картину.' },
  ],
  'Wine & Food': [
    { title: 'Посещение рынка', description: 'Начало на оживлённом местном рынке, где гид рассказывает о сезонных ингредиентах грузинской кухни.' },
    { title: 'Визит на семейную винодельню', description: 'Посещение семейной винодельни с традиционным квеври-виноделием. Экскурсия по виноградникам и подземным погребам.' },
    { title: 'Дегустация вин', description: 'Дегустация 5-7 вин, включая редкие автохтонные сорта. Гид-сомелье объясняет характеристики каждого и искусство выдержки в квеври.' },
    { title: 'Кулинарный мастер-класс', description: 'Засучите рукава и научитесь готовить классические грузинские блюда под руководством местного шеф-повара. Хинкали, хачапури и многое другое!' },
    { title: 'Застолье-супра', description: 'Насладитесь плодами своего труда за традиционной супрой. Тамада ведёт тосты, пока вы пируете.' },
    { title: 'Десерт и чурчхела', description: 'Научитесь делать чурчхелу и насладитесь традиционными десертами с бокалом вина.' },
  ],
  'Nature': [
    { title: 'Ориентировка на маршруте', description: 'Встреча у начала тропы: обзор маршрута, информация о возможных встречах с дикой природой и правила безопасности.' },
    { title: 'Прогулка под кронами леса', description: 'Вход в нетронутый лес под вековыми деревьями. Гид-натуралист определяет местные виды и объясняет экосистему.' },
    { title: 'Водопад или озеро', description: 'Открытие скрытого природного чуда — уединённого водопада или горного озера. Время для фотографий и созерцания.' },
    { title: 'Точка наблюдения за животными', description: 'Остановка на специально выбранной точке. С предоставленными биноклями — наблюдение за птицами, оленями и другими животными.' },
    { title: 'Пикник на природе', description: 'Подготовленный пикник из местных органических продуктов в потрясающем природном окружении.' },
    { title: 'Обратный путь', description: 'Другой маршрут назад через разнообразный рельеф с последними возможностями для фотографий.' },
  ],
  'Historical': [
    { title: 'Историческое введение', description: 'Гид-историк вводит в контекст ключевых периодов и событий, которые вы встретите сегодня.' },
    { title: 'Осмотр крепости', description: 'Исследование исторической крепости. Прогулка по стенам и рассказы об осадах и правителях, формировавших грузинскую историю.' },
    { title: 'Археологические раскопки', description: 'Посещение действующего или сохранённого археологического памятника, где слой за слоем раскрывается история.' },
    { title: 'Экскурсия по музею', description: 'Углублённый осмотр музейной коллекции с артефактами, превращающими абстрактную историю в осязаемую реальность.' },
    { title: 'Средневековая церковь', description: 'Осмотр интерьера средневековой церкви: оригинальные фрески, каменная резьба и роль церкви в национальной идентичности.' },
    { title: 'Обсуждение и вопросы', description: 'Открытая дискуссия с гидом по темам дня. Задавайте вопросы и связывайте прошлое с настоящим.' },
  ],
  'Hiking': [
    { title: 'Встреча и обзор маршрута', description: 'Встреча с горным гидом у начала тропы. Обзор маршрута по карте, проверка снаряжения и начало подъёма в комфортном темпе.' },
    { title: 'Альпийские луга', description: 'Переход через цветущие альпийские луга с панорамными горными видами. Гид делится геологическими и ботаническими знаниями.' },
    { title: 'Перевал', description: 'Высшая точка маршрута — горный перевал с потрясающим обзором на 360 градусов. Время для фото и перекуса.' },
    { title: 'Гребень и смотровые площадки', description: 'Прогулка по драматичному хребту с видами на глубокие долины. Один из самых живописных участков трека.' },
    { title: 'Горная деревня', description: 'Спуск к традиционной горной деревне. Знакомство с местными жителями и домашние угощения.' },
    { title: 'Спуск и завершение', description: 'Живописный спуск по разнообразной местности. Групповое фото и трансфер к месту проживания.' },
  ],
};

// =============================================================================
// BLOG POST TEMPLATES (GEORGIAN - KA)
// =============================================================================

export interface BlogPostTemplate {
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
}

export const BLOG_POST_TEMPLATES_KA: BlogPostTemplate[] = [
  {
    title: 'საქართველოს 10 აუცილებლად სანახავი ადგილი',
    excerpt: 'ყაზბეგის თოვლიანი მწვერვალებიდან კახეთის მზიან ვენახებამდე — აღმოაჩინეთ ადგილები, რომლებიც ყველა მოგზაურმა უნდა ნახოს.',
    content: `<h2>საქართველო: კავკასიის თვალსაჩინო</h2>
<p>საქართველო სწრაფად გახდა ერთ-ერთი ყველაზე საინტერესო ტურისტული მიმართულება მსოფლიოში. თვალწარმტაცი მთის პეიზაჟებით, უძველესი ღვინის კულტურით და თბილი სტუმართმოყვარეობით, ეს პატარა ქვეყანა წარმოუდგენელ შთაბეჭდილებას ტოვებს.</p>

<h3>1. თბილისი — კონტრასტების დედაქალაქი</h3>
<p>დაიწყეთ მოგზაურობა თბილისში, სადაც უძველესი გოგირდის აბანოები თანამედროვე მინის ხიდის ქვეშ დგას. ძველი ქალაქის ვიწრო ქუჩები, ნარიყალას ციხე და ღამის ცხოვრების ენერგია.</p>

<h3>2. ყაზბეგი (სტეფანწმინდა)</h3>
<p>გერგეტის სამება მთა ყაზბეგის ფონზე — საქართველოს ყველაზე ფოტოგენური ხედია. ლაშქრობა ეკლესიამდე დაახლოებით 3 საათს მოითხოვს და გადაშლილი პანორამებით ჯილდოვდება.</p>

<h3>3. მესტია და უშგული — სვანეთი</h3>
<p>სვანეთის შუასაუკუნეების კოშკები UNESCO-ს მსოფლიო მემკვიდრეობის ძეგლია. მესტია საქართველოს საუკეთესო სალაშქრო მარშრუტების კარიბჭეა, ხოლო უშგული — ევროპის ერთ-ერთი ყველაზე მაღლა მდებარე მუდმივად დასახლებული პუნქტი.</p>

<h3>4. სიღნაღი — სიყვარულის ქალაქი</h3>
<p>ალაზნის ველის ზემოთ აღმართული სიღნაღი საქართველოს ყველაზე რომანტიკული ქალაქია. ქვაფენილი ქუჩები, რესტავრირებული გალავანი და კავკასიონის ხედი.</p>

<h3>5. ბათუმი — შავი ზღვის მარგალიტი</h3>
<p>საქართველოს სანაპირო ძვირფასეულობა აერთიანებს სანაპირო დასვენებას თამამ თანამედროვე არქიტექტურასთან. ბულვარი, ბოტანიკური ბაღი და ღამის ცხოვრება.</p>`,
    tags: ['მიმართულებები', 'მოგზაურობის გზამკვლევი', 'საქართველო'],
  },
  {
    title: 'ქართული სამზარეულოს სრული გზამკვლევი',
    excerpt: 'ხინკალი, ხაჭაპური და მის მიღმა — გაეცანით ქართული სამზარეულოს მდიდარ გემოვნებას.',
    content: `<h2>ქართული კვება: კულინარიული მოგზაურობა</h2>
<p>ქართული სამზარეულო მსოფლიოს ერთ-ერთი ყველაზე ნაკლებად შესწავლილი კულინარიული ტრადიციაა. ევროპული და აზიური კულინარიული პრაქტიკის გავლენით, მან სრულიად უნიკალური მიმართულება აიღო.</p>

<h3>ხაჭაპური — ეროვნული კერძი</h3>
<p>ეს ყველიანი პური მრავალ რეგიონულ ვარიაციაში მოდის. აჭარულია ყველაზე ცნობილი — ნავის ფორმის, თხევად კვერცხსა და კარაქით. იმერული და მეგრული ვერსიებიც თანაბრად გემრიელია.</p>

<h3>ხინკალი — ქართული პელმენი</h3>
<p>ეს წვნიანი კლუბოკები ხელოვნების ნაწარმოებია. სანელებლიანი ხორცით (ან სოკოთი, ყველით) გატენილი, ხელით ჭამის ტექნიკა საჭიროებს პრაქტიკას — აიღე ქუდით, მოკბინე, შესვი წვენი.</p>

<h3>ჩურჩხელა — ქართული სნიკერსი</h3>
<p>სანთლის ფორმის ტკბილეული ნიგვზისა და ყურძნის წვენისგან. ბაზრებზე ყველგან ნახავთ.</p>

<h3>ქართული სუფრა</h3>
<p>თამადის ხელმძღვანელობით მიმდინარე ტრადიციული ნადიმი — ათობით კერძით, უწყვეტი ღვინით და გულწრფელი სადღეგრძელოებით.</p>`,
    tags: ['კვება', 'კულტურა', 'ტრადიციები'],
  },
  {
    title: 'კავკასიონში ლაშქრობა: მარშრუტები ყველა დონისთვის',
    excerpt: 'იქნებით დამწყები მოლაშქრე თუ გამოცდილი ალპინისტი — კავკასიონს თქვენთვის ბილიკი აქვს.',
    content: `<h2>კავკასიონი: მოლაშქრეთა სამოთხე</h2>
<p>დიდი კავკასიონის ქედი ჩრდილოეთ საქართველოს გასწვრივ გადაჭიმული ბუნებრივი სიმაგრეა, რომელიც ევროპის ყველაზე სანახაობრივ ლაშქრობის მარშრუტებს გთავაზობთ.</p>

<h3>დამწყებთათვის: თრუსოს ხეობა</h3>
<p>მშვიდი ხეობის ლაშქრობა ყაზბეგთან — 4-5 საათი ორივე მიმართულებით. თერგის მდინარის გასწვრივ, მინერალური წყაროები და მიტოვებული სოფლები.</p>

<h3>საშუალო: ჯუთა-როშკა (ჩაუხის უღელტეხილი)</h3>
<p>ჩაუხის უღელტეხილის (3,338 მ) გადაკვეთა ორ ლამაზ ხეობას შორის. ჩაუხის მასივის კლდოვანი კოშკები დოლომიტებს მოგაგონებთ.</p>

<h3>მოწინავე: მესტიადან უშგულამდე</h3>
<p>4-დღიანი ტრეკი სვანეთის გულით — UNESCO-ს მემკვიდრეობის ობიექტი. სვანური კოშკები, მყინვარები და თეთნულდის ხედი.</p>`,
    tags: ['ლაშქრობა', 'მთები', 'თავგადასავალი'],
  },
  {
    title: 'ქართული ღვინის 8000 წლიანი ისტორია',
    excerpt: 'საქართველო ღვინის სამშობლოა — გაეცანით ქვევრით მეღვინეობის უძველეს ტრადიციას.',
    content: `<h2>ღვინის სამშობლო</h2>
<p>საქართველო ღვინის კულტურის აკვანია, სადაც მეღვინეობის ტრადიცია 8,000 წელს ითვლის. არქეოლოგიურმა გათხრებმა კახეთში აღმოაჩინა უძველესი ღვინის ნარჩენები, რაც საქართველოს მეღვინეობის პიონერად ადასტურებს.</p>

<h3>ქვევრი — უნიკალური მეღვინეობა</h3>
<p>ქვევრი — თიხის ჭურჭელია, რომელშიც ყურძნის წვენი ფერმენტაციას მიწაში ჩამარხული გადის. ეს მეთოდი UNESCO-ს არამატერიალური კულტურული მემკვიდრეობის ნაწილია.</p>

<h3>კახეთი — ღვინის მხარე</h3>
<p>კახეთი საქართველოს მთავარი ღვინის რეგიონია, სადაც 500-ზე მეტი ადგილობრივი ვაზის ჯიში მოიპოვება. საფერავი და რქაწითელი — ყველაზე ცნობილი ჯიშებია.</p>

<h3>ქართული სუფრა და ღვინო</h3>
<p>ღვინო ქართული კულტურის განუყოფელი ნაწილია. სუფრაზე ყოველი სადღეგრძელო ღვინით ითქმის, თამადის ხელმძღვანელობით.</p>`,
    tags: ['ღვინო', 'კულტურა', 'ისტორია', 'კახეთი'],
  },
  {
    title: 'სვანეთი: საქართველოს ყველაზე იდუმალი რეგიონი',
    excerpt: 'შუასაუკუნეების კოშკები, მყინვარები და უძველესი ტრადიციები — სვანეთის სრული გზამკვლევი.',
    content: `<h2>სვანეთის მაგია</h2>
<p>სვანეთი საქართველოს ყველაზე იზოლირებული და მისტიკური რეგიონია. მაღალ მთებში მოქცეული, მან შეინარჩუნა უნიკალური კულტურა, ენა და ტრადიციები, რომლებიც სხვაგან დიდი ხანია დაიკარგა.</p>

<h3>სვანური კოშკები</h3>
<p>მესტიისა და უშგულის შუასაუკუნეების თავდაცვითი კოშკები UNESCO-ს მსოფლიო მემკვიდრეობის ძეგლია. ზოგი კოშკი 1000 წელზე მეტი ხნისაა.</p>

<h3>ტრეკინგი სვანეთში</h3>
<p>მესტიიდან უშგულამდე 4-დღიანი ტრეკი საქართველოს ყველაზე პოპულარული მრავალდღიანი მარშრუტია. უშხარა — კავკასიის უმაღლესი მწვერვალი — გზის თანამგზავრია.</p>

<h3>სვანური კულტურა</h3>
<p>სვანები ინარჩუნებენ საკუთარ ენას, მუსიკასა და ტრადიციებს. სვანური მრავალხმიანობა მსოფლიოში უნიკალურია.</p>`,
    tags: ['სვანეთი', 'მთები', 'კულტურა', 'ლაშქრობა'],
  },
  {
    title: 'თბილისის ძველი ქალაქი: ისტორია ყოველ ნაბიჯზე',
    excerpt: 'ნარიყალადან აბანოთუბნამდე — თბილისის ძველი ქალაქის სრული გზამკვლევი.',
    content: `<h2>1500 წლიანი ისტორია</h2>
<p>თბილისის ძველი ქალაქი საუკუნეების ისტორიის ცოცხალი მუზეუმია. ვახტანგ გორგასლის მიერ V საუკუნეში დაარსებული, ქალაქი ათეულობით დამპყრობელს გადაურჩა და ყოველ ჯერზე აღორძინდა.</p>

<h3>ნარიყალას ციხე</h3>
<p>ციხე IV საუკუნიდან ბურჯია. საბაგიროთი ან ფეხით აღსვლა პანორამული ხედით ჯილდოვდება.</p>

<h3>აბანოთუბანი</h3>
<p>გოგირდის აბანოების უბანი — თბილისის სულის განსახიერება. ფარსიდან ნასესხები აგურის გუმბათები ბუნებრივ თბილ წყალს ფარავს.</p>

<h3>მეტეხის ტაძარი</h3>
<p>კლდეზე აშენებული XIII საუკუნის ეკლესია მტკვრის ზემოთ — თბილისის ერთ-ერთი ყველაზე ფოტოგენური ხედი.</p>`,
    tags: ['თბილისი', 'ისტორია', 'არქიტექტურა'],
  },
  {
    title: 'საქართველოში ზამთრის სპორტი: გუდაური და ბაკურიანი',
    excerpt: 'კავკასიონის საუკეთესო სათხილამურო კურორტები ევროპულ ალტერნატივებზე გაცილებით ხელმისაწვდომ ფასად.',
    content: `<h2>კავკასიის თოვლიანი სამოთხე</h2>
<p>საქართველოს სათხილამურო კურორტები სწრაფად იძენენ პოპულარობას. ხელუხლებელი თოვლი, მოკლე რიგები და ევროპის კურორტებთან შედარებით ძალიან კონკურენტული ფასები.</p>

<h3>გუდაური</h3>
<p>საქართველოს მთავარი სათხილამურო კურორტი 2,196 მეტრზე. ფრირაიდის შესანიშნავი შესაძლებლობები, ჰელი-სქი და თანამედროვე ინფრასტრუქტურა. სეზონი დეკემბრიდან აპრილამდე.</p>

<h3>ბაკურიანი</h3>
<p>ოჯახური კურორტი ბორჯომთან ახლოს. უფრო რბილი ფერდობები დამწყებთათვის, ბავშვთა სკოლები და თოვლის თხილამურის ტრასები.</p>

<h3>თეთნულდი</h3>
<p>სვანეთის ახალი კურორტი — ბექქანტრის მოყვარულთა სამოთხე. მინიმალური ინფრასტრუქტურა, მაქსიმალური თავგადასავალი.</p>`,
    tags: ['ზამთარი', 'სათხილამურო', 'გუდაური', 'სპორტი'],
  },
  {
    title: 'კახეთის ღვინის მარშრუტი: ვენახიდან ბოთლამდე',
    excerpt: 'კახეთის საუკეთესო მარნების, ვენახებისა და ღვინის დეგუსტაციების გზამკვლევი.',
    content: `<h2>კახეთი: ღვინის გული</h2>
<p>კახეთი საქართველოს ღვინის წარმოების 70%-ს იძლევა. ალაზნის ველის ნაყოფიერი მიწა და ხელსაყრელი კლიმატი იდეალურ პირობებს ქმნის ვაზის მოყვანისთვის.</p>

<h3>სიღნაღი — ღვინის მოგზაურობის დაწყება</h3>
<p>ამ მომხიბვლელი ქალაქიდან იხსნება ალაზნის ველის პანორამა. ადგილობრივი მარნები და ხაშმის მონასტერი.</p>

<h3>წინანდალის სამუზეუმო კომპლექსი</h3>
<p>ჩავჩავაძეთა ისტორიული მამული — ქართული მეღვინეობის ისტორიის მნიშვნელოვანი ადგილი. ღვინის დეგუსტაცია ბაღის ფონზე.</p>

<h3>ყვარელი და კინძმარაული</h3>
<p>კინძმარაულის ღვინის რეგიონი — ნახევარტკბილი წითელი ღვინის სამშობლო. ადგილობრივი საოჯახო მარნების მონახულება.</p>`,
    tags: ['ღვინო', 'კახეთი', 'დეგუსტაცია'],
  },
  {
    title: 'საქართველოს ეროვნული პარკები: ბუნების მოყვარულთათვის',
    excerpt: 'ბორჯომიდან ლაგოდეხამდე — საქართველოს საუკეთესო დაცული ტერიტორიების მიმოხილვა.',
    content: `<h2>ბუნების საგანძური</h2>
<p>საქართველო ბიომრავალფეროვნების ცენტრია. პატარა ტერიტორიაზე — სუბტროპიკული ტყეებიდან ალპურ მდელოებამდე, ნახევარუდაბნოებიდან მარადმწვანე ჯუნგლებამდე.</p>

<h3>ბორჯომ-ხარაგაულის ეროვნული პარკი</h3>
<p>ევროპის ერთ-ერთი ყველაზე დიდი ეროვნული პარკი. მრავალფეროვანი სალაშქრო ბილიკები, კემპინგი და ველური ბუნების დაკვირვება.</p>

<h3>ლაგოდეხის ნაკრძალი</h3>
<p>კახეთის მარადმწვანე ტყეები და ჩანჩქერები. ადვილი და საშუალო სირთულის ბილიკები, ბუნებრივი საცურაო აუზები.</p>

<h3>ვაშლოვანის დაცული ტერიტორიები</h3>
<p>უნიკალური ბედლენდის ლანდშაფტი აღმოსავლეთ საქართველოში. საქართველოს ყველაზე მშრალი და ცხელი რეგიონი — სრულიად განსხვავებული ბუნება.</p>`,
    tags: ['ბუნება', 'ეროვნული პარკები', 'ლაშქრობა'],
  },
  {
    title: 'ბათუმი: შავი ზღვის თანამედროვე სამოთხე',
    excerpt: 'სანაპირო დასვენებიდან ბოტანიკურ ბაღამდე — ბათუმის საუკეთესო ღირშესანიშნაობები.',
    content: `<h2>საქართველოს სანაპირო ძვირფასეულობა</h2>
<p>ბათუმი საქართველოს მეორე უმსხვილესი ქალაქი და შავი ზღვის სანაპიროს თვალსაჩინოა. თანამედროვე არქიტექტურა, ისტორიული უბნები და სუბტროპიკული კლიმატი.</p>

<h3>ბათუმის ბულვარი</h3>
<p>7 კილომეტრიანი სანაპირო პრომენადი — საღამოს გასეირნების საუკეთესო ადგილი. ველოსიპედის ბილიკები, ფონტანები და კაფეები.</p>

<h3>ბოტანიკური ბაღი</h3>
<p>სუბტროპიკული მცენარეთა კოლექცია ზღვის პირას. ბაღიდან გადაშლილი შავი ზღვის ხედი.</p>

<h3>აჭარის მთიანეთი</h3>
<p>ბათუმიდან საათნახევრის სავალში — დრამატული ჩანჩქერები, ხის ხიდები და ტრადიციული სოფლები. მახუნცეთის ჩანჩქერი აუცილებელი სანახაობაა.</p>`,
    tags: ['ბათუმი', 'ზღვა', 'არქიტექტურა'],
  },
];

// =============================================================================
// BLOG POST TEMPLATES (RUSSIAN - RU)
// =============================================================================

export const BLOG_POST_TEMPLATES_RU: BlogPostTemplate[] = [
  {
    title: '10 мест в Грузии, которые нужно увидеть',
    excerpt: 'От заснеженных вершин Казбеги до солнечных виноградников Кахетии — лучшие направления для путешественников.',
    content: `<h2>Грузия: жемчужина Кавказа</h2>
<p>Грузия стремительно превращается в одно из самых захватывающих направлений в мире. Потрясающие горные пейзажи, древняя винная культура и тёплое гостеприимство делают эту маленькую страну настоящим открытием.</p>

<h3>1. Тбилиси — столица контрастов</h3>
<p>Начните путешествие в Тбилиси, где древние серные бани соседствуют с современным стеклянным мостом, а советская архитектура — с модными кафе. Старый город, крепость Нарикала и яркая ночная жизнь.</p>

<h3>2. Казбеги (Степанцминда)</h3>
<p>Церковь Гергетской Троицы на фоне горы Казбек — возможно, самый фотографируемый вид в Грузии. Подъём занимает около 3 часов и вознаграждает панорамными видами.</p>

<h3>3. Местия и Ушгули — Сванетия</h3>
<p>Средневековые башни Сванетии — объект Всемирного наследия ЮНЕСКО. Местия — ворота в лучшие треккинговые маршруты, а Ушгули — одно из самых высокогорных постоянно населённых мест Европы.</p>

<h3>4. Сигнахи — город любви</h3>
<p>На вершине холма с видом на Алазанскую долину Сигнахи — самый романтичный город Грузии. Мощёные улочки и вид на Большой Кавказ.</p>

<h3>5. Батуми — жемчужина Чёрного моря</h3>
<p>Прибрежная жемчужина Грузии сочетает пляжный отдых с современной архитектурой. Бульвар, ботанический сад и ночная жизнь.</p>`,
    tags: ['направления', 'путеводитель', 'грузия', 'топ'],
  },
  {
    title: 'Полный гид по грузинской кухне',
    excerpt: 'Хинкали, хачапури и не только — исследуйте богатые вкусы грузинской кухни.',
    content: `<h2>Грузинская кухня: кулинарное путешествие</h2>
<p>Грузинская кухня — одна из великих неоткрытых кулинарных традиций мира. Под влиянием европейских и азиатских практик она развилась во что-то совершенно уникальное.</p>

<h3>Хачапури — национальное блюдо</h3>
<p>Хлеб с сыром в множестве региональных вариаций. Аджарский — в форме лодочки с яйцом и маслом — самый знаменитый. Имеретинский и мегрельский не менее вкусны.</p>

<h3>Хинкали — грузинские пельмени</h3>
<p>Сочные пельмени — настоящее искусство. С мясной (или грибной, сырной) начинкой, их едят руками: берёшь за хвостик, надкусываешь, выпиваешь бульон.</p>

<h3>Чурчхела — грузинский сникерс</h3>
<p>Нитка орехов, обмакнутая в загущённый виноградный сок. Вы увидите их на рынках по всей стране.</p>

<h3>Грузинское застолье — супра</h3>
<p>Традиционный пир под руководством тамады. Десятки блюд, бесконечное вино и сердечные тосты, которые могут длиться часами.</p>`,
    tags: ['еда', 'культура', 'традиции', 'грузия'],
  },
  {
    title: 'Треккинг на Кавказе: маршруты для всех уровней',
    excerpt: 'Будь вы начинающий турист или опытный альпинист — Кавказские горы приготовили для вас маршрут.',
    content: `<h2>Кавказские горы: рай для треккинга</h2>
<p>Большой Кавказский хребет протянулся вдоль северной Грузии, предлагая одни из самых впечатляющих треккинговых маршрутов в Европе.</p>

<h3>Для начинающих: долина Трусо</h3>
<p><strong>Продолжительность:</strong> 4-5 часов туда-обратно. Пологая прогулка по долине вдоль реки Терек через потрясающее ущелье с минеральными источниками.</p>

<h3>Средний уровень: Джута — Рошка</h3>
<p><strong>Продолжительность:</strong> 2 дня. Классический маршрут через перевал Чаухи (3 338 м) между двумя красивыми долинами. Скальные башни массива Чаухи напоминают Доломиты.</p>

<h3>Для опытных: Местиа — Ушгули</h3>
<p>4-дневный трек через сердце Сванетии. Средневековые башни, ледники и виды на Тетнулди. Один из лучших многодневных маршрутов в Европе.</p>`,
    tags: ['треккинг', 'горы', 'приключения', 'маршруты'],
  },
  {
    title: '8000 лет грузинского вина: история и традиции',
    excerpt: 'Грузия — родина вина. Узнайте о древнейшей традиции виноделия в квеври.',
    content: `<h2>Родина вина</h2>
<p>Грузия — колыбель мировой винной культуры. Традиция виноделия здесь насчитывает 8 000 лет. Археологические раскопки в Кахетии обнаружили древнейшие следы виноделия.</p>

<h3>Квеври — уникальное виноделие</h3>
<p>Квеври — глиняный сосуд, в котором виноградный сок ферментируется, будучи закопанным в землю. Этот метод включён в список нематериального культурного наследия ЮНЕСКО.</p>

<h3>Кахетия — винный край</h3>
<p>Кахетия производит 70% грузинского вина. Более 500 автохтонных сортов винограда — Саперави и Ркацители самые известные.</p>

<h3>Грузинское застолье и вино</h3>
<p>Вино — неотъемлемая часть грузинской культуры. На супре каждый тост произносится с вином под руководством тамады.</p>`,
    tags: ['вино', 'культура', 'история', 'кахетия'],
  },
  {
    title: 'Сванетия: самый загадочный регион Грузии',
    excerpt: 'Средневековые башни, ледники и древние традиции — полный путеводитель по Сванетии.',
    content: `<h2>Магия Сванетии</h2>
<p>Сванетия — самый изолированный и мистический регион Грузии. Высоко в горах она сохранила уникальную культуру, язык и традиции, давно утраченные в других местах.</p>

<h3>Сванские башни</h3>
<p>Средневековые оборонительные башни Местии и Ушгули — объект Всемирного наследия ЮНЕСКО. Некоторые башни старше 1000 лет.</p>

<h3>Треккинг в Сванетии</h3>
<p>4-дневный трек из Местии в Ушгули — самый популярный многодневный маршрут Грузии. Ушба — кавказская Маттерхорн — сопровождает вас на пути.</p>

<h3>Сванская культура</h3>
<p>Сваны сохраняют собственный язык, музыку и традиции. Сванское многоголосие уникально в мировом масштабе.</p>`,
    tags: ['сванетия', 'горы', 'культура', 'треккинг'],
  },
  {
    title: 'Старый Тбилиси: история на каждом шагу',
    excerpt: 'От Нарикалы до Абанотубани — полный путеводитель по историческому центру Тбилиси.',
    content: `<h2>1500 лет истории</h2>
<p>Старый город Тбилиси — живой музей многовековой истории. Основанный в V веке Вахтангом Горгасали, город пережил десятки завоевателей и каждый раз возрождался.</p>

<h3>Крепость Нарикала</h3>
<p>Крепость стоит на страже с IV века. Подъём на канатной дороге или пешком вознаграждается панорамным видом на город и реку Куру.</p>

<h3>Абанотубани</h3>
<p>Район серных бань — олицетворение души Тбилиси. Кирпичные купола в персидском стиле укрывают природные тёплые источники, известные с древности.</p>

<h3>Метехский храм</h3>
<p>Церковь XIII века на скале над Курой — один из самых фотогеничных видов столицы.</p>`,
    tags: ['тбилиси', 'история', 'архитектура', 'достопримечательности'],
  },
  {
    title: 'Зимний спорт в Грузии: Гудаури и Бакуриани',
    excerpt: 'Лучшие горнолыжные курорты Кавказа по ценам значительно ниже европейских альтернатив.',
    content: `<h2>Снежный рай Кавказа</h2>
<p>Грузинские горнолыжные курорты быстро набирают популярность. Нетронутый снег, короткие очереди и очень конкурентные цены по сравнению с курортами Европы.</p>

<h3>Гудаури</h3>
<p>Главный горнолыжный курорт Грузии на высоте 2 196 м. Отличные возможности для фрирайда, хели-ски и современная инфраструктура. Сезон с декабря по апрель.</p>

<h3>Бакуриани</h3>
<p>Семейный курорт рядом с Боржоми. Мягкие склоны для начинающих, детские школы и трассы для беговых лыж.</p>

<h3>Тетнулди</h3>
<p>Новый курорт в Сванетии — рай для любителей бэккантри. Минимальная инфраструктура, максимум приключений.</p>`,
    tags: ['зима', 'горные лыжи', 'гудаури', 'спорт'],
  },
  {
    title: 'Винный маршрут Кахетии: от виноградника до бутылки',
    excerpt: 'Путеводитель по лучшим винодельням, виноградникам и дегустациям Кахетии.',
    content: `<h2>Кахетия: сердце грузинского виноделия</h2>
<p>Кахетия производит 70% грузинского вина. Плодородная земля Алазанской долины и благоприятный климат создают идеальные условия для виноградарства.</p>

<h3>Сигнахи — начало винного путешествия</h3>
<p>Из этого очаровательного города открывается панорама Алазанской долины. Местные погреба и монастырь Хашми.</p>

<h3>Музейный комплекс Цинандали</h3>
<p>Историческое поместье Чавчавадзе — важное место в истории грузинского виноделия. Дегустация вина на фоне ухоженного сада.</p>

<h3>Кварели и Киндзмараули</h3>
<p>Регион Киндзмараули — родина знаменитого полусладкого красного вина. Посещение семейных погребов с дегустацией.</p>`,
    tags: ['вино', 'кахетия', 'дегустация', 'путеводитель'],
  },
  {
    title: 'Национальные парки Грузии: для любителей природы',
    excerpt: 'От Боржоми до Лагодехи — обзор лучших охраняемых территорий Грузии.',
    content: `<h2>Природные сокровища</h2>
<p>Грузия — центр биоразнообразия. На маленькой территории — от субтропических лесов до альпийских лугов, от полупустынь до вечнозелёных джунглей.</p>

<h3>Национальный парк Боржоми-Харагаули</h3>
<p>Один из крупнейших национальных парков Европы. Разнообразные пешие маршруты, кемпинг и наблюдение за дикой природой.</p>

<h3>Заповедник Лагодехи</h3>
<p>Вечнозелёные леса и водопады Кахетии. Маршруты лёгкой и средней сложности, природные купальни.</p>

<h3>Охраняемые территории Вашловани</h3>
<p>Уникальный ландшафт бедлендов на востоке Грузии. Самый засушливый и жаркий регион страны — совершенно иная природа.</p>`,
    tags: ['природа', 'национальные парки', 'треккинг', 'экотуризм'],
  },
  {
    title: 'Батуми: современный рай на Чёрном море',
    excerpt: 'От пляжного отдыха до ботанического сада — лучшие достопримечательности Батуми.',
    content: `<h2>Прибрежная жемчужина Грузии</h2>
<p>Батуми — второй по величине город Грузии и жемчужина черноморского побережья. Современная архитектура, исторические кварталы и субтропический климат.</p>

<h3>Батумский бульвар</h3>
<p>7-километровая набережная — лучшее место для вечерних прогулок. Велодорожки, фонтаны и кафе.</p>

<h3>Ботанический сад</h3>
<p>Коллекция субтропических растений у моря. Из сада открывается потрясающий вид на Чёрное море.</p>

<h3>Горная Аджария</h3>
<p>В полутора часах от Батуми — драматичные водопады, подвесные мосты и традиционные деревни. Водопад Махунцети — обязательная достопримечательность.</p>`,
    tags: ['батуми', 'море', 'архитектура', 'отдых'],
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Returns a weighted random language.
 * Distribution: en ~50%, ru ~30%, ka ~20%
 */
export function weightedRandomLanguage(): SeedLanguage {
  const roll = Math.random();
  if (roll < 0.5) return 'en';
  if (roll < 0.8) return 'ru';
  return 'ka';
}

/**
 * Returns a random first name for the given language and gender.
 */
export function getRandomName(lang: SeedLanguage, isMale: boolean): string {
  if (lang === 'ru') {
    return isMale ? randomItem(RU_MALE_FIRST_NAMES) : randomItem(RU_FEMALE_FIRST_NAMES);
  }
  // 'en' and 'ka' both use English names for seed purposes
  return isMale ? randomItem(EN_MALE_FIRST_NAMES) : randomItem(EN_FEMALE_FIRST_NAMES);
}

/**
 * Returns a random last name for the given language.
 * Russian last names are gender-aware (male/female forms).
 * For simplicity when gender is unknown, returns the male form.
 */
export function getLastName(lang: SeedLanguage, isMale?: boolean): string {
  if (lang === 'ru') {
    const male = isMale ?? randomBool();
    return male ? randomItem(RU_LAST_NAMES_MALE) : randomItem(RU_LAST_NAMES_FEMALE);
  }
  return randomItem(EN_LAST_NAMES);
}

/**
 * Returns a random full name for the given language and gender.
 */
export function getRandomFullName(lang: SeedLanguage, isMale: boolean): { firstName: string; lastName: string } {
  return {
    firstName: getRandomName(lang, isMale),
    lastName: getLastName(lang, isMale),
  };
}

/**
 * Fills template placeholders with provided values.
 * Replaces {key} patterns with corresponding values from the data object.
 */
export function fillTemplate(template: string, data: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  }
  return result;
}

/**
 * Returns a random guide bio from the template pool for the given language,
 * with placeholders filled in.
 */
export function getRandomGuideBio(
  lang: SeedLanguage,
  data: { name: string; years: number; city: string; specialty: string; languages: string }
): string {
  const templates = lang === 'ru' ? GUIDE_BIO_TEMPLATES_RU : GUIDE_BIO_TEMPLATES_EN;
  const template = randomItem(templates);
  return fillTemplate(template, data);
}

/**
 * Returns a random driver bio from the template pool for the given language,
 * with placeholders filled in.
 */
export function getRandomDriverBio(
  lang: SeedLanguage,
  data: { name: string; years: number; vehicleType: string; city: string }
): string {
  const templates = lang === 'ru' ? DRIVER_BIO_TEMPLATES_RU : DRIVER_BIO_TEMPLATES_EN;
  const template = randomItem(templates);
  return fillTemplate(template, data);
}

/**
 * Returns a random company description from the template pool for the given language,
 * with placeholders filled in.
 */
export function getRandomCompanyDescription(
  lang: SeedLanguage,
  data: { name: string; specialty: string; years: number }
): string {
  const templates = lang === 'ru' ? COMPANY_DESCRIPTION_TEMPLATES_RU : COMPANY_DESCRIPTION_TEMPLATES_EN;
  const template = randomItem(templates);
  return fillTemplate(template, data);
}

/**
 * Returns a random tour title for the given category and language.
 */
export function getRandomTourTitle(category: string, lang: SeedLanguage): string {
  const pool = lang === 'ru' ? TOUR_TITLE_TEMPLATES_RU : TOUR_TITLE_TEMPLATES_EN;
  const titles = pool[category];
  if (!titles || titles.length === 0) {
    // Fallback to a generic title
    return lang === 'ru' ? `Тур: ${category}` : `Tour: ${category}`;
  }
  return randomItem(titles);
}

/**
 * Returns a random tour summary for the given language.
 */
export function getRandomTourSummary(lang: SeedLanguage): string {
  const pool = lang === 'ru' ? TOUR_SUMMARY_TEMPLATES_RU : TOUR_SUMMARY_TEMPLATES_EN;
  return randomItem(pool);
}

/**
 * Returns a random tour description for the given language.
 */
export function getRandomTourDescription(lang: SeedLanguage): string {
  const pool = lang === 'ru' ? TOUR_DESCRIPTION_TEMPLATES_RU : TOUR_DESCRIPTION_TEMPLATES_EN;
  return randomItem(pool);
}

/**
 * Returns a set of itinerary steps for the given category and language.
 * Falls back to 'Cultural' category if the requested one is not found.
 */
export function getItinerarySteps(category: string, lang: SeedLanguage): ItineraryStepTemplate[] {
  const pool = lang === 'ru' ? ITINERARY_STEP_TEMPLATES_RU : ITINERARY_STEP_TEMPLATES_EN;
  const steps = pool[category] ?? pool['Cultural'] ?? [];
  return steps;
}

/**
 * Returns a random blog post template for the given language.
 */
export function getRandomBlogPost(lang: SeedLanguage): BlogPostTemplate {
  const pool = lang === 'ru' ? BLOG_POST_TEMPLATES_RU : BLOG_POST_TEMPLATES_KA;
  return randomItem(pool);
}

/**
 * Returns a location name in the requested language.
 */
export function getLocationName(index: number, lang: SeedLanguage): string {
  const loc = LOCATIONS_MULTILINGUAL[index];
  if (!loc) return 'Unknown';
  return loc[lang];
}

/**
 * Returns a specialty name in the requested language.
 */
export function getSpecialtyName(index: number, lang: SeedLanguage): string {
  const spec = SPECIALTIES_MULTILINGUAL[index];
  if (!spec) return lang === 'ru' ? 'Общий туризм' : 'General Tourism';
  return spec[lang];
}

/**
 * Returns a random specialty in the requested language.
 */
export function getRandomSpecialty(lang: SeedLanguage): string {
  const spec = randomItem(SPECIALTIES_MULTILINGUAL);
  return spec[lang];
}
