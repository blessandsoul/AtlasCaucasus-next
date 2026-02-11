/**
 * Company data for seeding (Georgian)
 * 6 tour companies with realistic data
 */

import { weightedRandomLanguage, getRandomCompanyDescription, type SeedLanguage } from './multilingual.js';
import { randomInt, randomPhoneNumber } from '../utils/helpers.js';

export interface CompanySeedData {
  companyName: string;
  description: string;
  registrationNumber: string;
  websiteUrl?: string;
  phoneNumber: string;
  isVerified: boolean;
  // Rating data will be calculated from reviews
}

export const COMPANIES: CompanySeedData[] = [
  {
    companyName: 'საქართველოს ტურები',
    description: `საქართველოს ტურები არის პრემიერ სამოგზაურო კომპანია, რომელიც სპეციალიზირებულია ავთენტურ ქართულ გამოცდილებებზე. დაარსდა 2010 წელს და 50,000-ზე მეტ მოგზაურს დავეხმარეთ კავკასიის რეგიონის სილამაზის აღმოჩენაში.

ჩვენი გამოცდილი გიდებისა და მოგზაურობის ექსპერტების გუნდი ქმნის დაუვიწყარ მოგზაურობებს უძველესი მონასტრების, თვალწარმტაცი მთის პეიზაჟებისა და მსოფლიოში ცნობილი ღვინის რეგიონების გავლით. ვთავაზობთ მცირე ჯგუფურ ტურებს, კერძო ექსკურსიებს და ინდივიდუალურ მარშრუტებს.

იქნება ეს თავგადასავალი ყაზბეგის მთებში, ღვინის დეგუსტაცია კახეთში თუ თბილისის ძველი ქალაქის ქვაფენილი ქუჩების შესწავლა - საქართველოს ტურები გთავაზობთ განსაკუთრებულ მომსახურებას და ავთენტურ გამოცდილებებს.`,
    registrationNumber: 'GE-2010-TR-001234',
    websiteUrl: 'https://georgiatours.ge',
    phoneNumber: '+995 555 10 20 30',
    isVerified: true,
  },
  {
    companyName: 'კავკასიის აღმოჩენა',
    description: `კავკასიის აღმოჩენა არის თქვენი კარიბჭე სამხრეთ კავკასიის რეგიონის დიდებულ პეიზაჟებსა და მდიდარ კულტურებთან. სპეციალიზირებული ვართ თავგადასავლურ მოგზაურობასა და კულტურულ ჩაღრმავებაზე, ვთავაზობთ უნიკალურ გამოცდილებებს, რომლებიც ტიპიურ ტურისტულ მარშრუტებს სცილდება.

ჩვენი ექსპერტი გიდები არიან გატაცებული ადგილობრივები, რომლებიც გიზიარებენ ცოდნას ფარული საგანძურების, ტრადიციული სოფლებისა და თვალწარმტაცი ხედების შესახებ. სვანეთში ლაშქრობიდან უძველესი კლდის ქალაქების შესწავლამდე - ჩვენ ვქმნით მოგზაურობებს, რომლებიც შთააგონებს და გარდაქმნის.

როგორც ეკოლოგიურად ცნობიერი კომპანია, პრიორიტეტულია მდგრადი ტურიზმის პრაქტიკა და ადგილობრივი თემების მხარდაჭერა.`,
    registrationNumber: 'GE-2015-TR-005678',
    websiteUrl: 'https://explorecaucasus.com',
    phoneNumber: '+995 577 20 30 40',
    isVerified: true,
  },
  {
    companyName: 'მთის თავგადასავლები საქართველო',
    description: `მთის თავგადასავლები საქართველო არის ქვეყნის წამყვანი გარე თავგადასავლების კომპანია, სპეციალიზირებული ლაშქრობის, ალპინიზმისა და ზამთრის სპორტის გამოცდილებებზე.

15 წელზე მეტი გამოცდილებით დიდი კავკასიონის ექსპედიციების ხელმძღვანელობაში, ჩვენი სერტიფიცირებული მთის გიდები უზრუნველყოფენ უსაფრთხო და საინტერესო თავგადასავლებს ყველა დონის მოთავგადასავლეებისთვის. ვმუშაობთ მთელი წლის განმავლობაში - ზაფხულში ვთავაზობთ ლაშქრობებს მყინვარებით დაფარულ მწვერვალებზე, ზამთარში კი - სათხილამურო ტურებს ხელუხლებელ მთის ფერდობებზე.

ჩვენი ვალდებულება უსაფრთხოების, გარემოზე პასუხისმგებლობისა და ავთენტური მთის კულტურის მიმართ დაგვიმსახურა საერთაშორისო თავგადასავლური მოგზაურობის ასოციაციების აღიარება.`,
    registrationNumber: 'GE-2008-TR-003456',
    websiteUrl: 'https://mountainadventures.ge',
    phoneNumber: '+995 568 30 40 50',
    isVerified: true,
  },
  {
    companyName: 'ქართული ღვინის ტურები',
    description: `ქართული ღვინის ტურები ზეიმობს მეღვინეობის 8000 წლიან ტრადიციას ღვინის სამშობლოში. ჩვენ ვთავაზობთ ჩაღრმავებულ გამოცდილებებს კახეთის, ქართლისა და იმერეთის ღვინის რეგიონებში.

ჩვენი ტურები მოიცავს საოჯახო მარნების მონახულებას, ტრადიციული ქვევრით მეღვინეობის დემონსტრაციას და იშვიათი ადგილობრივი ვაზის ჯიშების დეგუსტაციას. ღვინის მიღმა ვიკვლევთ გასტრონომიას, ისტორიას და სტუმართმოყვარეობას, რაც ქართულ კულტურას უნიკალურს ხდის.

იქნებით სომელიე თუ უბრალოდ ღვინით დაინტერესებული, ჩვენი მცოდნე გიდები ქმნიან დასამახსოვრებელ მოგზაურობებს საქართველოს ვენახებსა და სოფლებში.`,
    registrationNumber: 'GE-2012-TR-007890',
    websiteUrl: 'https://winetours.ge',
    phoneNumber: '+995 591 40 50 60',
    isVerified: true,
  },
  {
    companyName: 'ბათუმის თავგადასავლები',
    description: `ბათუმის თავგადასავლები სპეციალიზირებულია საქართველოს შავი ზღვის სანაპიროსა და სუბტროპიკული აჭარის რეგიონში გამოცდილებებზე. ბათუმში დაფუძნებული, ვთავაზობთ სანაპირო აქტივობებს, ბოტანიკურ ტურებსა და თავგადასავლებს ახლომდებარე მთებში.

ბათუმის თანამედროვე არქიტექტურისა და ისტორიული ხიბლის ნაზავის შესწავლიდან აჭარის მთიანეთში ფარული ჩანჩქერების აღმოჩენამდე - ჩვენ ვაჩვენებთ საქართველოს დასავლეთის კარიბჭის მრავალფეროვნებას.

ჩვენი სეზონური შეთავაზებები მოიცავს დელფინებზე დაკვირვებას, პარაპლანერიზმს სანაპიროზე და გასტრო ტურებს აჭარული სამზარეულოთი და მისი ცნობილი ხაჭაპურის ვარიაციებით.`,
    registrationNumber: 'GE-2018-TR-009012',
    websiteUrl: 'https://batumiadventure.com',
    phoneNumber: '+995 593 50 60 70',
    isVerified: true,
  },
  {
    companyName: 'კავკასიის ექსპედიციები',
    description: `კავკასიის ექსპედიციები ორგანიზებს რთულ ლაშქრობასა და ექსპედიციურ ტურებს გამოცდილი თავგადასავლებისმოყვარეებისთვის. სპეციალიზირებული ვართ მრავალდღიან ველური ბუნების მოგზაურობებზე საქართველოს, სომხეთისა და აზერბაიჯანის მიუწვდომელ რეგიონებში.

ჩვენი ხელმოწერის ექსპედიციები მოიცავს ტრანსკავკასიური ბილიკის გადაკვეთას, სვანეთის მაღალ მარშრუტს და მყინვარწვერის ტექნიკურ ასვლებს. ყველა მოგზაურობას ხელმძღვანელობენ სერტიფიცირებული მთის გიდები ველური ბუნების პირველადი დახმარების ტრენინგით.

ვუზრუნველყოფთ ხარისხიან აღჭურვილობას, დეტალურ წინასწარ მომზადებას და მცირე ჯგუფის ზომებს უსაფრთხოების უზრუნველსაყოფად და მყიფე მთის ეკოსისტემებზე გავლენის შესამცირებლად.`,
    registrationNumber: 'GE-2020-TR-011234',
    websiteUrl: 'https://caucasusexpeditions.ge',
    phoneNumber: '+995 597 60 70 80',
    isVerified: false, // Not yet verified
  },
];

// EN company name templates
const EN_COMPANY_NAMES = [
  'Caucasus Discovery Tours', 'Georgia Explorer', 'Silk Road Adventures',
  'Black Sea Travel Co.', 'Tbilisi City Tours', 'Svaneti Expeditions',
  'Kakheti Wine Journeys', 'Kazbegi Peak Adventures', 'Georgian Heritage Tours',
  'Colchis Travel Agency', 'Trans-Caucasus Trips', 'Golden Fleece Tours',
  'Panorama Georgia', 'Kartli Explorer', 'Adjara Sun Tours',
  'Ancient Routes Travel', 'Prometheus Adventures', 'Georgia Unveiled',
];

const RU_COMPANY_NAMES = [
  'Открытие Кавказа', 'Грузия Тур', 'Приключения Шёлкового Пути',
  'Черноморские Путешествия', 'Тбилиси Тур', 'Экспедиции Сванетии',
  'Винные Туры Кахетии', 'Казбеги Приключения', 'Наследие Грузии',
  'Колхида Трэвел', 'Транскавказские Туры', 'Золотое Руно Тур',
  'Панорама Грузия', 'Картли Тур', 'Аджара Солнечные Туры',
  'Древние Маршруты', 'Прометей Приключения', 'Грузия Без Границ',
];

/**
 * Generate additional companies for 4x data volume
 * Creates ~18 additional companies with EN/RU descriptions
 */
export function generateAdditionalCompanies(): CompanySeedData[] {
  const additional: CompanySeedData[] = [];

  for (let i = 0; i < 18; i++) {
    const lang = weightedRandomLanguage();
    // Skip 'ka' since we already have Georgian companies - reassign to EN
    const effectiveLang: SeedLanguage = lang === 'ka' ? 'en' : lang;

    const companyName = effectiveLang === 'ru' ? RU_COMPANY_NAMES[i % RU_COMPANY_NAMES.length] : EN_COMPANY_NAMES[i % EN_COMPANY_NAMES.length];
    const regYear = randomInt(2005, 2024);
    const regNum = `GE-${regYear}-TR-${String(randomInt(100000, 999999))}`;

    const description = getRandomCompanyDescription(effectiveLang, {
      name: companyName,
      years: 2025 - regYear,
      specialty: effectiveLang === 'en'
        ? ['adventure tours', 'cultural experiences', 'wine tastings', 'mountain expeditions', 'city tours', 'eco-tourism'][i % 6]
        : ['приключенческие туры', 'культурные экскурсии', 'дегустации вин', 'горные экспедиции', 'городские туры', 'эко-туризм'][i % 6],
    });

    additional.push({
      companyName,
      description,
      registrationNumber: regNum,
      websiteUrl: i % 3 === 0 ? undefined : `https://example-tour-${i + 7}.com`,
      phoneNumber: randomPhoneNumber(),
      isVerified: Math.random() > 0.2,
    });
  }

  return additional;
}
