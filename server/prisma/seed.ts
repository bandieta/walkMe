import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Same Warsaw fixtures the mobile mock service used, so switching off
// USE_MOCK doesn't change what the Places screen shows.
const PLACES = [
  { name: 'Łazienki Park', category: 'park', address: 'ul. Agrykola 1, Śródmieście', lat: 52.2146, lng: 21.035, rating: 4.9, reviewCount: 2841, tags: ['Off-leash area', 'Water fountain', 'Trails'], isOpen: true, description: "Warsaw's most beautiful and dog-friendly park with expansive grounds.", emoji: '🌿' },
  { name: 'Pole Mokotowskie', category: 'park', address: 'ul. Pole Mokotowskie, Mokotów', lat: 52.2185, lng: 20.9978, rating: 4.7, reviewCount: 1523, tags: ['Off-leash meadow', 'Dog area', 'Space'], isOpen: true, description: 'Huge open meadow perfect for off-leash running and fetch.', emoji: '🌾' },
  { name: 'PAWSOME Dog Café', category: 'cafe', address: 'ul. Nowy Świat 22, Śródmieście', lat: 52.233, lng: 21.017, rating: 4.8, reviewCount: 873, tags: ['Dog menu', 'Indoor seating', 'Water bowls'], isOpen: true, description: "Warsaw's favourite dog-friendly café. Special dog biscuits and puppuccinos!", emoji: '☕' },
  { name: 'Happy Paws Vet Clinic', category: 'vet', address: 'ul. Puławska 115, Mokotów', lat: 52.2001, lng: 21.0223, rating: 4.6, reviewCount: 641, tags: ['24/7 Emergency', 'Dental care', 'Vaccinations'], isOpen: true, description: 'Highly rated veterinary clinic with 24/7 emergency service.', emoji: '🏥' },
  { name: 'PetStore Ursynów', category: 'store', address: 'al. KEN 84, Ursynów', lat: 52.1585, lng: 21.0452, rating: 4.4, reviewCount: 312, tags: ['Dog food', 'Accessories', 'Grooming'], isOpen: true, description: 'Everything a dog could need — food, toys, beds, grooming supplies.', emoji: '🛒' },
  { name: 'Kabaty Forest', category: 'trail', address: 'Kabaty, Warsaw', lat: 52.1407, lng: 21.0634, rating: 4.8, reviewCount: 1987, tags: ['Off-leash forest', 'Long trails', 'Nature'], isOpen: true, description: 'Urban forest with 900+ acres of off-leash trails. Dog heaven!', emoji: '🌲' },
  { name: 'Praga Park', category: 'park', address: 'al. Solidarności, Praga Północ', lat: 52.2547, lng: 21.0539, rating: 4.5, reviewCount: 876, tags: ['Dog run', 'Benches', 'Open spaces'], isOpen: true, description: 'Popular park on the Praga side. Great dog community!', emoji: '🌳' },
  { name: 'Lake Zegrze Beach', category: 'lake', address: 'Nieporęt, near Warsaw', lat: 52.4283, lng: 21.0539, rating: 4.9, reviewCount: 1102, tags: ['Dog swimming', 'Off-leash beach', 'BBQ area'], isOpen: true, description: 'Dog-friendly beach at Lake Zegrze, 40 min from Warsaw. Summer paradise!', emoji: '🏖️' },
  { name: 'Dog Bar Pies', category: 'cafe', address: 'ul. Wilcza 50, Śródmieście', lat: 52.2271, lng: 21.0098, rating: 4.7, reviewCount: 543, tags: ['Dog-friendly', 'Outdoor terrace', 'Craft beer'], isOpen: false, description: 'Cool craft beer bar with a large outdoor terrace — dogs always welcome.', emoji: '🍺' },
  { name: 'VetMedica Clinic', category: 'vet', address: 'ul. Grochowska 262, Praga', lat: 52.2422, lng: 21.0718, rating: 4.5, reviewCount: 429, tags: ['Surgery', 'X-Ray', 'Microchipping'], isOpen: true, description: 'Modern veterinary clinic with full diagnostic equipment.', emoji: '🩺' },
  { name: 'Wilanów Palace Park', category: 'park', address: 'ul. Wiertnicza 1, Wilanów', lat: 52.1675, lng: 21.0898, rating: 4.8, reviewCount: 2125, tags: ['Historic gardens', 'Dog-friendly', 'Off-leash areas'], isOpen: true, description: 'Stunning baroque palace with gorgeous gardens. Dogs allowed in the outer park.', emoji: '🏰' },
  { name: 'Psi Raj Pet Spa', category: 'store', address: 'ul. Marszałkowska 8, Śródmieście', lat: 52.2315, lng: 21.006, rating: 4.9, reviewCount: 245, tags: ['Grooming', 'Spa', 'Nail trimming'], isOpen: true, description: 'Premium dog grooming and spa. Your dog will come home looking fabulous.', emoji: '✂️' },
];

async function main() {
  const existing = await prisma.place.count();
  if (existing === 0) {
    for (const place of PLACES) {
      await prisma.place.create({ data: { ...place, tags: JSON.stringify(place.tags) } });
    }
    console.log(`Seeded ${PLACES.length} places.`);
  } else {
    console.log(`Places table already has ${existing} rows — skipping seed.`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
