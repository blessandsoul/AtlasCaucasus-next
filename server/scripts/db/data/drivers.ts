/**
 * Driver profile data for seeding (Georgian)
 * Linked to DRIVER_USERS and MULTI_ROLE_USERS with DRIVER role
 */

export interface DriverSeedData {
  userIndex: number; // Index into the corresponding user array
  bio: string;
  vehicleType: string;
  vehicleCapacity: number;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  licenseNumber: string;
  isVerified: boolean;
  isAvailable: boolean;
  // Location assignments (indices into locations array)
  locationIndices: number[];
  primaryLocationIndex: number;
}

// Vehicle types commonly used in Georgia tourism
export const VEHICLE_TYPES = {
  SEDAN: 'სედანი',
  SUV: 'ჯიპი',
  MINIVAN: 'მინივენი',
  MINIBUS: 'მიკროავტობუსი',
  LUXURY: 'ლუქს სედანი',
  FOURX4: '4x4 ოფროუდი',
};

// Drivers from DRIVER_USERS (indices 0-7)
export const DRIVER_PROFILES: DriverSeedData[] = [
  {
    userIndex: 0, // Vakhtang Vardiashvili
    bio: `პროფესიონალი მძღოლი 15 წლიანი გამოცდილებით საქართველოს მრავალფეროვან გზებზე ნავიგაციაში. სპეციალიზირებული ვარ მთის მარშრუტებზე და უსაფრთხოდ შემიძლია ყაზბეგის, სვანეთისა და თუშეთის რთულ გზებზე მართვა.

ჩემი კომფორტული 4x4 მანქანა აღჭურვილია კონდიციონერით, დამტენი პორტებით და Wi-Fi-ით. ვინარჩუნებ უმაღლეს უსაფრთხოების სტანდარტებს და ვიცი ყველა ლამაზი ხედის წერტილი და ფოტო გაჩერება გზაზე.

პუნქტუალური, პროფესიონალი და ყოველთვის ღიმილით - თქვენს მოგზაურობას ისევე სასიამოვნოს გავხდი, როგორც დანიშნულების ადგილს.`,
    vehicleType: VEHICLE_TYPES.FOURX4,
    vehicleCapacity: 4,
    vehicleMake: 'Toyota',
    vehicleModel: 'Land Cruiser Prado',
    vehicleYear: 2021,
    licenseNumber: 'AA-123-BCD',
    isVerified: true,
    isAvailable: true,
    locationIndices: [0, 2, 3, 4, 11], // Tbilisi, Kazbegi, Mestia, Ushguli, Gudauri
    primaryLocationIndex: 0, // Tbilisi
  },
  {
    userIndex: 1, // Giga Zhvania
    bio: `გამარჯობა! მე ვარ გიგა, 10 წელია ტურისტებს ვატარებ საქართველოში. ჩემი ფართო მინივენი იდეალურია ოჯახებისა და მცირე ჯგუფებისთვის, რომლებსაც სურთ კომფორტი გრძელი მგზავრობის დროს.

ვიცი ყველა საუკეთესო რესტორანი სადილის გაჩერებებისთვის და შემიძლია ადგილობრივი სპეციალიტეტების რეკომენდაცია ნებისმიერ მარშრუტზე. ჩემი მანქანა ყოველთვის სუფთა და კარგად მოვლილია.

ღვინის მხარეში მიდიხართ, მთებში თუ სანაპიროზე - უსაფრთხოდ და კომფორტულად მიგიყვანთ.`,
    vehicleType: VEHICLE_TYPES.MINIVAN,
    vehicleCapacity: 7,
    vehicleMake: 'Mercedes-Benz',
    vehicleModel: 'Vito',
    vehicleYear: 2020,
    licenseNumber: 'BB-456-EFG',
    isVerified: true,
    isAvailable: true,
    locationIndices: [0, 6, 7, 9, 10, 1], // Tbilisi, Signagi, Telavi, Kvareli, Tsinandali, Mtskheta
    primaryLocationIndex: 0, // Tbilisi
  },
  {
    userIndex: 2, // Zurab Avalishvili
    bio: `პროფესიონალი მძღოლი, რომელიც საქართველოში პრემიუმ ტრანსფერის მომსახურებას გთავაზობთ. 12 წლიანი გამოცდილებით საჭესთან და შესანიშნავი მომსახურებისადმი გატაცებით, ვუზრუნველყოფ რომ ყველა მგზავრობა იყოს გლუვი და კომფორტული.

სპეციალიზირებული ვარ აეროპორტის ტრანსფერებზე, საქმიანი მგზავრობებსა და VIP ტრანსპორტირებაზე. ჩემი ლუქს სედანი გთავაზობთ წყნარ, კომფორტულ მგზავრობას აღმასრულებლებისა და მომთხოვნი მოგზაურებისთვის.

ინგლისურისა და რუსულის თავისუფლად მცოდნე, ასევე შემიძლია ბაზისური ტურისტული ინფორმაციის მოწოდება მგზავრობის დროს.`,
    vehicleType: VEHICLE_TYPES.LUXURY,
    vehicleCapacity: 3,
    vehicleMake: 'Mercedes-Benz',
    vehicleModel: 'E-Class',
    vehicleYear: 2022,
    licenseNumber: 'CC-789-HIJ',
    isVerified: true,
    isAvailable: true,
    locationIndices: [0, 1, 5, 8], // Tbilisi, Mtskheta, Kutaisi, Gori
    primaryLocationIndex: 0, // Tbilisi
  },
  {
    userIndex: 3, // Shota Basilashvili
    bio: `მე ვარ შოთა, ბათუმში მცხოვრები მძღოლი, სპეციალიზირებული სანაპიროსა და აჭარის რეგიონის ტრანსპორტირებაზე. მთელი ცხოვრება აქ ვცხოვრობ და შავი ზღვის სანაპიროსა და მიმდებარე მთების ყველა კუთხე ვიცი.

ჩემი ჯიპი უმკლავდება როგორც სანაპირო გზებს, ისე მთის უღელტეხილებს აჭარული სოფლებისკენ. შემიძლია ფარულ ჩანჩქერებთან, ტრადიციულ რესტორნებთან და ხედის წერტილებთან წაყვანა, რომლებსაც უმეტესი ტურისტები ვერასოდეს ხედავენ.

მოქნილი, მეგობრული და ყოველთვის მზად ნაკვალევიდან გადახვევისთვის!`,
    vehicleType: VEHICLE_TYPES.SUV,
    vehicleCapacity: 4,
    vehicleMake: 'Hyundai',
    vehicleModel: 'Santa Fe',
    vehicleYear: 2019,
    licenseNumber: 'DD-012-KLM',
    isVerified: true,
    isAvailable: true,
    locationIndices: [13, 18, 19, 20, 5], // Batumi, Kobuleti, Martvili, Zugdidi, Kutaisi
    primaryLocationIndex: 13, // Batumi
  },
  {
    userIndex: 4, // Temuri Chikhladze
    bio: `ჯგუფური ტრანსპორტირების სპეციალისტი 8 წლიანი გამოცდილებით. ჩემი 15-ადგილიანი მიკროავტობუსი იდეალურია ტურისტული ჯგუფებისთვის, ერთად მოგზაურ ოჯახებისთვის ან კორპორატიული ღონისძიებებისთვის.

მანქანას აქვს კომფორტული სავარძლები, თავზე განთავსებული საცავები და PA სისტემა გიდებისთვის. ხშირად ვმუშაობ ტურისტულ კომპანიებთან და ვიცი როგორ შევინარჩუნო ჯგუფები გრაფიკში, ამავდროულად დავტოვო დრო გამოცდილებებისთვის.

საიმედო, გამოცდილი და მზად 15 კაციამდე ნებისმიერი ზომის ჯგუფებისთვის.`,
    vehicleType: VEHICLE_TYPES.MINIBUS,
    vehicleCapacity: 15,
    vehicleMake: 'Mercedes-Benz',
    vehicleModel: 'Sprinter',
    vehicleYear: 2020,
    licenseNumber: 'EE-345-NOP',
    isVerified: true,
    isAvailable: true,
    locationIndices: [0, 1, 2, 5, 6, 8, 11], // Tbilisi, Mtskheta, Kazbegi, Kutaisi, Signagi, Gori, Gudauri
    primaryLocationIndex: 0, // Tbilisi
  },
  {
    userIndex: 5, // Revaz Dolidze
    bio: `თავდადებული სედანის მძღოლი წყვილებისა და მარტო მოგზაურებისთვის, რომლებიც უფრო ინტიმურ მოგზაურობის გამოცდილებას ანიჭებენ უპირატესობას. ჩემი 6 წლიანი მართვის გამოცდილება ფოკუსირებულია პერსონალიზებულ მომსახურებასა და დეტალებზე ყურადღებაზე.

ჩემი კომფორტული სედანი იდეალურია თბილისის გარშემო და ახლომდებარე ატრაქციონებისკენ დღიური მოგზაურობებისთვის. ვთავაზობ კონკურენტულ ტარიფებს და მოქნილ გრაფიკს.

სიამოვნებით ვიცდი თქვენი ვიზიტების დროს და ვარეგულირებ მარშრუტს თქვენი ინტერესების მიხედვით.`,
    vehicleType: VEHICLE_TYPES.SEDAN,
    vehicleCapacity: 3,
    vehicleMake: 'Toyota',
    vehicleModel: 'Camry',
    vehicleYear: 2021,
    licenseNumber: 'FF-678-QRS',
    isVerified: true,
    isAvailable: true,
    locationIndices: [0, 1, 6, 7, 8], // Tbilisi, Mtskheta, Signagi, Telavi, Gori
    primaryLocationIndex: 0, // Tbilisi
  },
  {
    userIndex: 6, // Mamuka Elbakidze (NOT VERIFIED)
    bio: `ახალი ვარ პროფესიონალურ მართვის მომსახურებაში, მაგრამ გამოცდილი საქართველოს გზებზე. ვთავაზობ ბიუჯეტურ ტრანსპორტირებას მოგზაურებისთვის, რომლებიც ხელმისაწვდომ ვარიანტებს ეძებენ.

ჩემი კარგად მოვლილი სედანი უმკლავდება უმეტეს მარშრუტებს, გარდა ექსტრემალური მთის პირობებისა. იდეალურია დღიური მოგზაურობებისა და მოკლე მანძილებისთვის.

ჯერ კიდევ ვაშენებ რეპუტაციას, ამიტომ ვთავაზობ კონკურენტულ შესავალ ტარიფებს!`,
    vehicleType: VEHICLE_TYPES.SEDAN,
    vehicleCapacity: 3,
    vehicleMake: 'Hyundai',
    vehicleModel: 'Sonata',
    vehicleYear: 2018,
    licenseNumber: 'GG-901-TUV',
    isVerified: false, // Not verified
    isAvailable: true,
    locationIndices: [0, 1, 5], // Tbilisi, Mtskheta, Kutaisi
    primaryLocationIndex: 0, // Tbilisi
  },
  {
    userIndex: 7, // Konstantine Gabashvili (INACTIVE)
    bio: `გამოცდილი მძღოლი, ამჟამად შესვენებაზე. 11 წელია ვატარებ ტურისტებს საქართველოში, სპეციალიზირებული მრავალდღიან საგზაო მოგზაურობებზე.

ჩემი მინივენის მომსახურება ცნობილი იყო კომფორტით და საიმედოობით გრძელ მოგზაურობებზე. იმედი მაქვს მალე დავუბრუნდები მართვას.

გთხოვთ, მოგვიანებით შეამოწმოთ ხელმისაწვდომობა!`,
    vehicleType: VEHICLE_TYPES.MINIVAN,
    vehicleCapacity: 6,
    vehicleMake: 'Volkswagen',
    vehicleModel: 'Transporter',
    vehicleYear: 2019,
    licenseNumber: 'HH-234-WXY',
    isVerified: true,
    isAvailable: false, // Inactive
    locationIndices: [0, 2, 3, 4], // Tbilisi, Kazbegi, Mestia, Ushguli
    primaryLocationIndex: 0, // Tbilisi
  },
];

// Multi-role driver profiles (from MULTI_ROLE_USERS with DRIVER role)
export const MULTI_ROLE_DRIVER_PROFILES: DriverSeedData[] = [
  {
    userIndex: 10, // Lasha Javakhishvili (Guide + Driver) - same as guide index 10
    bio: `კომბინირებული გიდისა და მძღოლის მომსახურება - სრული ინფორმაციისთვის იხილეთ ჩემი გიდის პროფილი. ჩემი 4x4 მანქანა იდეალურია მიუწვდომელ ადგილებამდე მისაღწევად, სანამ ექსპერტის კომენტარებს ვაწვდი.

უმაღლესი მოხერხებულობა მცირე ჯგუფებისა და ოჯახებისთვის, რომლებსაც სურთ მოქნილობა და პერსონალური მომსახურება.`,
    vehicleType: VEHICLE_TYPES.FOURX4,
    vehicleCapacity: 4,
    vehicleMake: 'Mitsubishi',
    vehicleModel: 'Pajero',
    vehicleYear: 2020,
    licenseNumber: 'II-567-ABC',
    isVerified: true,
    isAvailable: true,
    locationIndices: [0, 2, 3, 4, 6, 11], // Same as guide locations
    primaryLocationIndex: 0, // Tbilisi
  },
  {
    userIndex: 11, // Guram Beridze (Guide + Driver) - same as guide index 11
    bio: `თქვენი გიდი და მძღოლი ერთში! ჩემი კომფორტული მინივენი 7 კაცამდე იტევს და იდეალურია საოჯახო მოგზაურობებისთვის. ჩემი ექსპერტიზის შესახებ მეტისთვის იხილეთ გიდის პროფილი.

ყოვლისმომცველი მომსახურება: სასტუმროდან წამოყვანა, მოქნილი მარშრუტები და მცოდნე კომენტარები მთელი გზის განმავლობაში.`,
    vehicleType: VEHICLE_TYPES.MINIVAN,
    vehicleCapacity: 7,
    vehicleMake: 'Mercedes-Benz',
    vehicleModel: 'V-Class',
    vehicleYear: 2021,
    licenseNumber: 'JJ-890-DEF',
    isVerified: true,
    isAvailable: true,
    locationIndices: [0, 6, 7, 9, 10, 2], // Same as guide locations
    primaryLocationIndex: 0, // Tbilisi
  },
];

// Combine all driver profiles
export const ALL_DRIVER_PROFILES = [...DRIVER_PROFILES, ...MULTI_ROLE_DRIVER_PROFILES];
