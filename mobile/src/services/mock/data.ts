// ─── Seed data for mock backend ───────────────────────────────────────────────
// All coordinates are in Warsaw, Poland area

export const CURRENT_USER_ID = 'user-0';

export interface MockUser {
  id: string;
  displayName: string;
  email: string;
  bio: string;
  age: number;
  avatarColor: string;
  location: string;
  distance: string;
  walkCount: number;
  friendCount: number;
  dogIds: string[];
}

export interface MockDog {
  id: string;
  ownerId: string;
  name: string;
  breed: string;
  age: number;
  weight: number;
  emoji: string;
  personality: string[];
  bio: string;
}

export interface MockWalk {
  id: string;
  title: string;
  description: string;
  category: string;
  hostId: string;
  meetingLat: number;
  meetingLng: number;
  meetingPoint: string;
  scheduledAt: string;
  maxParticipants: number;
  participantIds: string[];
  status: 'upcoming' | 'live' | 'ended';
  duration: string;
}

export interface MockEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  lat: number;
  lng: number;
  organizerId: string;
  participantCount: number;
  maxParticipants: number;
  isJoined: boolean;
  status: 'upcoming' | 'live' | 'ended';
  category: string;
  emoji: string;
}

export interface MockPlace {
  id: string;
  name: string;
  category: 'park' | 'cafe' | 'vet' | 'beach' | 'trail' | 'store' | 'lake';
  address: string;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  isOpen: boolean;
  description: string;
  emoji: string;
}

export interface MockMessage {
  id: string;
  roomId: string; // walkId or matchId
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface MockMatch {
  id: string;
  userId: string;
  matchedAt: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

// ─── USERS ────────────────────────────────────────────────────────────────────

export const USERS: MockUser[] = [
  {
    id: 'user-0',
    displayName: 'Alex Johnson',
    email: 'alex@dogpals.com',
    bio: 'Dog dad 🐕 | Morning walker | Coffee & paws enthusiast. Luna keeps me sane.',
    age: 29,
    avatarColor: '#6C5CE7',
    location: 'Mokotów, Warsaw',
    distance: '0 km',
    walkCount: 24,
    friendCount: 12,
    dogIds: ['dog-0'],
  },
  {
    id: 'user-1',
    displayName: 'Karolina W.',
    email: 'karo@example.com',
    bio: 'Golden retriever mom 🌟 Love morning walks in Łazienki. Always up for a coffee after!',
    age: 28,
    avatarColor: '#fdcb6e',
    location: 'Śródmieście, Warsaw',
    distance: '0.8 km',
    walkCount: 31,
    friendCount: 18,
    dogIds: ['dog-1'],
  },
  {
    id: 'user-2',
    displayName: 'Tomasz K.',
    email: 'tomek@example.com',
    bio: 'German Shepherd enthusiast. Max and I do 10km every day, rain or shine 🏃',
    age: 33,
    avatarColor: '#00b894',
    location: 'Żoliborz, Warsaw',
    distance: '1.4 km',
    walkCount: 48,
    friendCount: 7,
    dogIds: ['dog-2'],
  },
  {
    id: 'user-3',
    displayName: 'Monika N.',
    email: 'monika@example.com',
    bio: 'Frenchie & Chihuahua mom 🐾 Small dogs, big personalities! Praga Park is our spot.',
    age: 26,
    avatarColor: '#e17055',
    location: 'Praga Północ, Warsaw',
    distance: '2.1 km',
    walkCount: 15,
    friendCount: 22,
    dogIds: ['dog-3', 'dog-4'],
  },
  {
    id: 'user-4',
    displayName: 'Adam Z.',
    email: 'adam@example.com',
    bio: 'Lab dad. Rocky is my best buddy. Looking for dog play dates around Ursynów 🌿',
    age: 34,
    avatarColor: '#74b9ff',
    location: 'Ursynów, Warsaw',
    distance: '3.2 km',
    walkCount: 19,
    friendCount: 9,
    dogIds: ['dog-5'],
  },
  {
    id: 'user-5',
    displayName: 'Kasia D.',
    email: 'kasia@example.com',
    bio: 'Beagle mom 🐝 Zoe is obsessed with squirrels. We explore new parks every weekend!',
    age: 27,
    avatarColor: '#a29bfe',
    location: 'Wilanów, Warsaw',
    distance: '4.1 km',
    walkCount: 22,
    friendCount: 15,
    dogIds: ['dog-6'],
  },
  {
    id: 'user-6',
    displayName: 'Michał W.',
    email: 'michal@example.com',
    bio: 'Two border collies = double the chaos 🌀 Training & agility enthusiast.',
    age: 31,
    avatarColor: '#00cec9',
    location: 'Bemowo, Warsaw',
    distance: '5.7 km',
    walkCount: 67,
    friendCount: 34,
    dogIds: ['dog-7', 'dog-8'],
  },
  {
    id: 'user-7',
    displayName: 'Anna K.',
    email: 'anna@example.com',
    bio: 'Poodle mom ☁️ Lily loves the water. Zegrze Lake is our happy place 🏖️',
    age: 25,
    avatarColor: '#fd79a8',
    location: 'Białołęka, Warsaw',
    distance: '7.3 km',
    walkCount: 11,
    friendCount: 6,
    dogIds: ['dog-9'],
  },
  {
    id: 'user-8',
    displayName: 'Piotr L.',
    email: 'piotr@example.com',
    bio: 'Husky dad ❄️ Thor needs 2 hours of walking a day. Anyone game for adventures?',
    age: 30,
    avatarColor: '#636e72',
    location: 'Targówek, Warsaw',
    distance: '2.9 km',
    walkCount: 55,
    friendCount: 28,
    dogIds: ['dog-10'],
  },
  {
    id: 'user-9',
    displayName: 'Zuzia M.',
    email: 'zuzia@example.com',
    bio: 'Pom & Maltese mom 🌸 Cookie & Teddy are tiny but mighty! Dog-friendly cafes are life.',
    age: 24,
    avatarColor: '#ff7675',
    location: 'Ochota, Warsaw',
    distance: '1.6 km',
    walkCount: 8,
    friendCount: 41,
    dogIds: ['dog-11', 'dog-12'],
  },
];

// ─── DOGS ─────────────────────────────────────────────────────────────────────

export const DOGS: MockDog[] = [
  { id: 'dog-0', ownerId: 'user-0', name: 'Luna', breed: 'Golden Retriever', age: 3, weight: 28, emoji: '🐕', personality: ['Friendly', 'Energetic', 'Playful'], bio: 'Luna loves everyone and everything. Her favourite activity is fetch at Pole Mokotowskie.' },
  { id: 'dog-1', ownerId: 'user-1', name: 'Mochi', breed: 'Golden Retriever', age: 2, weight: 24, emoji: '🐶', personality: ['Gentle', 'Social', 'Curious'], bio: 'Mochi is a social butterfly who loves meeting new dogs and people.' },
  { id: 'dog-2', ownerId: 'user-2', name: 'Max', breed: 'German Shepherd', age: 4, weight: 35, emoji: '🐕‍🦺', personality: ['Loyal', 'Athletic', 'Smart'], bio: 'Trained in basic obedience. Max is protective but friendly once he knows you.' },
  { id: 'dog-3', ownerId: 'user-3', name: 'Bella', breed: 'French Bulldog', age: 3, weight: 12, emoji: '🐾', personality: ['Stubborn', 'Funny', 'Loving'], bio: 'Bella is dramatic but lovable. Short walks only — Frenchie problems!' },
  { id: 'dog-4', ownerId: 'user-3', name: 'Coco', breed: 'Chihuahua', age: 5, weight: 3, emoji: '🐕', personality: ['Sassy', 'Alert', 'Tiny terror'], bio: 'Coco thinks she is a Great Dane. Do not underestimate the chihuahua.' },
  { id: 'dog-5', ownerId: 'user-4', name: 'Rocky', breed: 'Labrador', age: 2, weight: 30, emoji: '🐶', personality: ['Goofy', 'Energetic', 'Food-motivated'], bio: 'Rocky will be your best friend if you have treats. And also if you don\'t.' },
  { id: 'dog-6', ownerId: 'user-5', name: 'Zoe', breed: 'Beagle', age: 4, weight: 10, emoji: '🐕', personality: ['Curious', 'Stubborn', 'Nose-driven'], bio: 'Zoe follows her nose everywhere. She has escaped the garden 7 times and counting.' },
  { id: 'dog-7', ownerId: 'user-6', name: 'Bruno', breed: 'Border Collie', age: 3, weight: 20, emoji: '🐾', personality: ['Intelligent', 'Intense', 'Athletic'], bio: 'Bruno knows 40 commands and will stare you down until you give him something to do.' },
  { id: 'dog-8', ownerId: 'user-6', name: 'Mia', breed: 'Border Collie', age: 2, weight: 18, emoji: '🐕', personality: ['Fast', 'Smart', 'Herder'], bio: 'Mia tries to herd children at the park. Working on it.' },
  { id: 'dog-9', ownerId: 'user-7', name: 'Lily', breed: 'Standard Poodle', age: 4, weight: 22, emoji: '🐩', personality: ['Elegant', 'Smart', 'Swimmer'], bio: 'Lily loves water and will get in every puddle, lake and fountain she finds.' },
  { id: 'dog-10', ownerId: 'user-8', name: 'Thor', breed: 'Siberian Husky', age: 3, weight: 27, emoji: '🌨️', personality: ['Vocal', 'Dramatic', 'Energetic'], bio: 'Thor will sing you the song of his people at 6am. He needs friends who keep up.' },
  { id: 'dog-11', ownerId: 'user-9', name: 'Cookie', breed: 'Pomeranian', age: 2, weight: 3, emoji: '🧁', personality: ['Fluffy', 'Sassy', 'Social'], bio: 'Cookie looks like a cloud. Everybody loves her and she knows it.' },
  { id: 'dog-12', ownerId: 'user-9', name: 'Teddy', breed: 'Maltese', age: 3, weight: 4, emoji: '🧸', personality: ['Calm', 'Cuddly', 'Gentle'], bio: 'Teddy is Cookie\'s calm older brother. He\'s basically a therapy dog.' },
];

// ─── WALKS ────────────────────────────────────────────────────────────────────

const now = new Date();
const future = (hours: number) => new Date(now.getTime() + hours * 3600000).toISOString();
const past = (hours: number) => new Date(now.getTime() - hours * 3600000).toISOString();

export const WALKS: MockWalk[] = [
  {
    id: 'walk-1',
    title: 'Morning Walk in Łazienki',
    description: 'Start at the main entrance by the Palace on the Water. Dogs love the squirrels here! Bring water for the dogs.',
    category: 'Park',
    hostId: 'user-1',
    meetingLat: 52.2146,
    meetingLng: 21.0350,
    meetingPoint: 'Łazienki Park — main entrance',
    scheduledAt: future(2),
    maxParticipants: 8,
    participantIds: ['user-1', 'user-5', 'user-9'],
    status: 'upcoming',
    duration: '1.5h',
  },
  {
    id: 'walk-2',
    title: 'Kabaty Forest Trek',
    description: 'Long forest trail through Kabaty. Off-leash areas available! Bring snacks.',
    category: 'Trail',
    hostId: 'user-2',
    meetingLat: 52.1407,
    meetingLng: 21.0634,
    meetingPoint: 'Kabaty Metro Station — exit B',
    scheduledAt: future(26),
    maxParticipants: 6,
    participantIds: ['user-2', 'user-4', 'user-6'],
    status: 'upcoming',
    duration: '2h',
  },
  {
    id: 'walk-3',
    title: 'Pole Mokotowskie Evening',
    description: 'Relaxed evening walk around the meadow. Great spot for dogs to run free.',
    category: 'Park',
    hostId: 'user-0',
    meetingLat: 52.2185,
    meetingLng: 20.9978,
    meetingPoint: 'Pole Mokotowskie — southern gate',
    scheduledAt: future(1),
    maxParticipants: 10,
    participantIds: ['user-0', 'user-1', 'user-3', 'user-7'],
    status: 'live',
    duration: '1h',
  },
  {
    id: 'walk-4',
    title: 'Wilanów Palace Walk',
    description: 'Beautiful walk around Wilanów Palace grounds. Instagram-worthy scenery!',
    category: 'Park',
    hostId: 'user-5',
    meetingLat: 52.1675,
    meetingLng: 21.0898,
    meetingPoint: 'Wilanów Palace — car park entrance',
    scheduledAt: future(50),
    maxParticipants: 12,
    participantIds: ['user-5'],
    status: 'upcoming',
    duration: '1h',
  },
  {
    id: 'walk-5',
    title: 'Praga Park Meetup',
    description: 'Dog meetup at Praga Park. Social walk for all breeds. Puppies welcome!',
    category: 'Park',
    hostId: 'user-3',
    meetingLat: 52.2547,
    meetingLng: 21.0539,
    meetingPoint: 'Praga Park — fountain',
    scheduledAt: future(75),
    maxParticipants: 15,
    participantIds: ['user-3', 'user-8'],
    status: 'upcoming',
    duration: '1h',
  },
  {
    id: 'walk-6',
    title: 'City Centre Morning Run',
    description: 'Quick morning run through the city centre. Fast-paced, bring energetic dogs!',
    category: 'City',
    hostId: 'user-8',
    meetingLat: 52.2297,
    meetingLng: 21.0122,
    meetingPoint: 'Palace of Culture — steps',
    scheduledAt: past(3),
    maxParticipants: 5,
    participantIds: ['user-0', 'user-2', 'user-8'],
    status: 'ended',
    duration: '45min',
  },
];

// ─── EVENTS ───────────────────────────────────────────────────────────────────

export const EVENTS: MockEvent[] = [
  {
    id: 'event-1',
    title: 'DogPals Meetup — Spring Edition',
    description: 'Our biggest community meetup! Join 50+ dogs and their owners at Łazienki. There will be food trucks, dog treats, and prizes for the cutest dog.',
    date: future(72),
    location: 'Łazienki Park, Warsaw',
    lat: 52.2146,
    lng: 21.0350,
    organizerId: 'user-1',
    participantCount: 34,
    maxParticipants: 100,
    isJoined: false,
    status: 'upcoming',
    category: 'Meetup',
    emoji: '🎉',
  },
  {
    id: 'event-2',
    title: 'Dog Frisbee Competition',
    description: 'Show off your dog\'s frisbee skills! Open to all breeds. Prizes for distance, style, and accuracy. Register your dog at the event.',
    date: future(120),
    location: 'Ursynów Park, Warsaw',
    lat: 52.1558,
    lng: 21.0412,
    organizerId: 'user-6',
    participantCount: 18,
    maxParticipants: 40,
    isJoined: false,
    status: 'upcoming',
    category: 'Competition',
    emoji: '🥏',
  },
  {
    id: 'event-3',
    title: 'Puppy Playdate Party',
    description: 'Puppies under 1 year only! Safe, supervised playtime for young dogs to socialize. Bring vaccination certificate.',
    date: future(48),
    location: 'Praga Park, Warsaw',
    lat: 52.2547,
    lng: 21.0539,
    organizerId: 'user-3',
    participantCount: 12,
    maxParticipants: 20,
    isJoined: true,
    status: 'upcoming',
    category: 'Playdate',
    emoji: '🐶',
  },
  {
    id: 'event-4',
    title: 'Lake Swim Day at Zegrze',
    description: 'Summer swim day at Lake Zegrze! Dogs can swim, owners can relax on the beach. BBQ and refreshments available. 45 min by car from Warsaw.',
    date: future(3),
    location: 'Lake Zegrze, near Warsaw',
    lat: 52.4283,
    lng: 21.0539,
    organizerId: 'user-7',
    participantCount: 28,
    maxParticipants: 50,
    isJoined: false,
    status: 'live',
    category: 'Lake',
    emoji: '🏊',
  },
  {
    id: 'event-5',
    title: 'Dog Yoga (Doga)',
    description: 'Yoga session in the park with your dogs. Certified doga instructor leads a 60-minute session. Mats provided.',
    date: past(24),
    location: 'Pole Mokotowskie, Warsaw',
    lat: 52.2185,
    lng: 20.9978,
    organizerId: 'user-9',
    participantCount: 15,
    maxParticipants: 20,
    isJoined: true,
    status: 'ended',
    category: 'Wellness',
    emoji: '🧘',
  },
  {
    id: 'event-6',
    title: 'Night Walk — City Lights',
    description: 'Twilight walk through the Old Town and riverside. Lights, reflective gear encouraged. A magical experience for night owls! 🌙',
    date: future(168),
    location: 'Warsaw Old Town',
    lat: 52.2497,
    lng: 21.0122,
    organizerId: 'user-2',
    participantCount: 9,
    maxParticipants: 25,
    isJoined: false,
    status: 'upcoming',
    category: 'Walk',
    emoji: '🌙',
  },
];

// ─── PLACES ───────────────────────────────────────────────────────────────────

export const PLACES: MockPlace[] = [
  { id: 'place-1', name: 'Łazienki Park', category: 'park', address: 'ul. Agrykola 1, Śródmieście', lat: 52.2146, lng: 21.0350, rating: 4.9, reviewCount: 2841, tags: ['Off-leash area', 'Water fountain', 'Trails'], isOpen: true, description: 'Warsaw\'s most beautiful and dog-friendly park with expansive grounds.', emoji: '🌿' },
  { id: 'place-2', name: 'Pole Mokotowskie', category: 'park', address: 'ul. Pole Mokotowskie, Mokotów', lat: 52.2185, lng: 20.9978, rating: 4.7, reviewCount: 1523, tags: ['Off-leash meadow', 'Dog area', 'Space'], isOpen: true, description: 'Huge open meadow perfect for off-leash running and fetch.', emoji: '🌾' },
  { id: 'place-3', name: 'PAWSOME Dog Café', category: 'cafe', address: 'ul. Nowy Świat 22, Śródmieście', lat: 52.2330, lng: 21.0170, rating: 4.8, reviewCount: 873, tags: ['Dog menu', 'Indoor seating', 'Water bowls'], isOpen: true, description: 'Warsaw\'s favourite dog-friendly café. Special dog biscuits and puppuccinos!', emoji: '☕' },
  { id: 'place-4', name: 'Happy Paws Vet Clinic', category: 'vet', address: 'ul. Puławska 115, Mokotów', lat: 52.2001, lng: 21.0223, rating: 4.6, reviewCount: 641, tags: ['24/7 Emergency', 'Dental care', 'Vaccinations'], isOpen: true, description: 'Highly rated veterinary clinic with 24/7 emergency service.', emoji: '🏥' },
  { id: 'place-5', name: 'PetStore Ursynów', category: 'store', address: 'al. KEN 84, Ursynów', lat: 52.1585, lng: 21.0452, rating: 4.4, reviewCount: 312, tags: ['Dog food', 'Accessories', 'Grooming'], isOpen: true, description: 'Everything a dog could need — food, toys, beds, grooming supplies.', emoji: '🛒' },
  { id: 'place-6', name: 'Kabaty Forest', category: 'trail', address: 'Kabaty, Warsaw', lat: 52.1407, lng: 21.0634, rating: 4.8, reviewCount: 1987, tags: ['Off-leash forest', 'Long trails', 'Nature'], isOpen: true, description: 'Urban forest with 900+ acres of off-leash trails. Dog heaven!', emoji: '🌲' },
  { id: 'place-7', name: 'Praga Park', category: 'park', address: 'al. Solidarności, Praga Północ', lat: 52.2547, lng: 21.0539, rating: 4.5, reviewCount: 876, tags: ['Dog run', 'Benches', 'Open spaces'], isOpen: true, description: 'Popular park on the Praga side. Great dog community!', emoji: '🌳' },
  { id: 'place-8', name: 'Lake Zegrze Beach', category: 'lake', address: 'Nieporęt, near Warsaw', lat: 52.4283, lng: 21.0539, rating: 4.9, reviewCount: 1102, tags: ['Dog swimming', 'Off-leash beach', 'BBQ area'], isOpen: true, description: 'Dog-friendly beach at Lake Zegrze, 40 min from Warsaw. Summer paradise!', emoji: '🏖️' },
  { id: 'place-9', name: 'Dog Bar Pies', category: 'cafe', address: 'ul. Wilcza 50, Śródmieście', lat: 52.2271, lng: 21.0098, rating: 4.7, reviewCount: 543, tags: ['Dog-friendly', 'Outdoor terrace', 'Craft beer'], isOpen: false, description: 'Cool craft beer bar with a large outdoor terrace — dogs always welcome.', emoji: '🍺' },
  { id: 'place-10', name: 'VetMedica Clinic', category: 'vet', address: 'ul. Grochowska 262, Praga', lat: 52.2422, lng: 21.0718, rating: 4.5, reviewCount: 429, tags: ['Surgery', 'X-Ray', 'Microchipping'], isOpen: true, description: 'Modern veterinary clinic with full diagnostic equipment.', emoji: '🩺' },
  { id: 'place-11', name: 'Wilanów Palace Park', category: 'park', address: 'ul. Wiertnicza 1, Wilanów', lat: 52.1675, lng: 21.0898, rating: 4.8, reviewCount: 2125, tags: ['Historic gardens', 'Dog-friendly', 'Off-leash areas'], isOpen: true, description: 'Stunning baroque palace with gorgeous gardens. Dogs allowed in the outer park.', emoji: '🏰' },
  { id: 'place-12', name: 'Psi Raj Pet Spa', category: 'store', address: 'ul. Marszałkowska 8, Śródmieście', lat: 52.2315, lng: 21.0060, rating: 4.9, reviewCount: 245, tags: ['Grooming', 'Spa', 'Nail trimming'], isOpen: true, description: 'Premium dog grooming and spa. Your dog will come home looking fabulous.', emoji: '✂️' },
];

// ─── MESSAGES ────────────────────────────────────────────────────────────────

export const MESSAGES: MockMessage[] = [
  // Walk 1 — Łazienki
  { id: 'msg-w1-1', roomId: 'walk-1', senderId: 'user-1', senderName: 'Karolina W.', content: 'Hey everyone! So excited for tomorrow morning 🌞', createdAt: past(5) },
  { id: 'msg-w1-2', roomId: 'walk-1', senderId: 'user-5', senderName: 'Kasia D.', content: 'Zoe is already doing zoomies just thinking about it 🐕', createdAt: past(4.5) },
  { id: 'msg-w1-3', roomId: 'walk-1', senderId: 'user-1', senderName: 'Karolina W.', content: 'Meeting at 8am at the main entrance. Don\'t forget water for the dogs!', createdAt: past(4) },
  { id: 'msg-w1-4', roomId: 'walk-1', senderId: 'user-9', senderName: 'Zuzia M.', content: 'Cookie and Teddy will be there! 🧁🧸', createdAt: past(3) },
  { id: 'msg-w1-5', roomId: 'walk-1', senderId: 'user-5', senderName: 'Kasia D.', content: 'Should we grab coffee after at PAWSOME?', createdAt: past(1) },
  { id: 'msg-w1-6', roomId: 'walk-1', senderId: 'user-1', senderName: 'Karolina W.', content: 'YES 100% 🙌', createdAt: past(0.8) },

  // Walk 3 — Pole Mokotowskie (current user hosting, live)
  { id: 'msg-w3-1', roomId: 'walk-3', senderId: 'user-0', senderName: 'Alex Johnson', content: 'Starting in 30 min — the southern gate near the playground 🎯', createdAt: past(2) },
  { id: 'msg-w3-2', roomId: 'walk-3', senderId: 'user-1', senderName: 'Karolina W.', content: 'On my way! Mochi is so excited 🐶', createdAt: past(1.5) },
  { id: 'msg-w3-3', roomId: 'walk-3', senderId: 'user-3', senderName: 'Monika N.', content: 'Bella says she\'s ready (she\'s actually still asleep but w/e)', createdAt: past(1) },
  { id: 'msg-w3-4', roomId: 'walk-3', senderId: 'user-7', senderName: 'Anna K.', content: 'Lily just splashed through every puddle on the way 😅', createdAt: past(0.5) },

  // Match with user-1 (Karolina)
  { id: 'msg-m1-1', roomId: 'match-1', senderId: 'user-1', senderName: 'Karolina W.', content: 'Hi! Saw you at Pole Mokotowskie the other day! Your dog is adorable 😍', createdAt: past(24) },
  { id: 'msg-m1-2', roomId: 'match-1', senderId: 'user-0', senderName: 'Alex Johnson', content: 'Haha thank you! That\'s Luna — she loves that park. Your golden is gorgeous too!', createdAt: past(23) },
  { id: 'msg-m1-3', roomId: 'match-1', senderId: 'user-1', senderName: 'Karolina W.', content: 'That\'s Mochi! Want to do a park walk together sometime? 🐕', createdAt: past(22) },
  { id: 'msg-m1-4', roomId: 'match-1', senderId: 'user-0', senderName: 'Alex Johnson', content: 'Absolutely! I\'m free this weekend. How about Łazienki Saturday morning?', createdAt: past(21) },
  { id: 'msg-m1-5', roomId: 'match-1', senderId: 'user-1', senderName: 'Karolina W.', content: 'Perfect! 10am? ☀️', createdAt: past(20) },

  // Match with user-5 (Kasia)
  { id: 'msg-m2-1', roomId: 'match-2', senderId: 'user-5', senderName: 'Kasia D.', content: 'Hey! Your dog Luna is a golden? Zoe goes crazy for goldens 😂', createdAt: past(48) },
  { id: 'msg-m2-2', roomId: 'match-2', senderId: 'user-0', senderName: 'Alex Johnson', content: 'Haha yes! Luna is very social too. Beagles are the best!', createdAt: past(47) },
  { id: 'msg-m2-3', roomId: 'match-2', senderId: 'user-5', senderName: 'Kasia D.', content: 'Come to the Wilanów walk next weekend! It\'ll be fun 🌿', createdAt: past(46) },

  // Match with user-9 (Zuzia) — unreplied
  { id: 'msg-m3-1', roomId: 'match-3', senderId: 'user-9', senderName: 'Zuzia M.', content: 'OMGGG Luna looks exactly like my neighbour\'s dog. Are goldens just the best or what 🧡', createdAt: past(3) },
];

// ─── MATCHES ────────────────────────────────────────────────────────────────

export const MATCHES: MockMatch[] = [
  { id: 'match-1', userId: 'user-1', matchedAt: past(25), lastMessage: 'Perfect! 10am? ☀️', lastMessageAt: past(20), unread: 1 },
  { id: 'match-2', userId: 'user-5', matchedAt: past(50), lastMessage: 'Come to the Wilanów walk next weekend! It\'ll be fun 🌿', lastMessageAt: past(46), unread: 0 },
  { id: 'match-3', userId: 'user-9', matchedAt: past(3.5), lastMessage: 'OMGGG Luna looks exactly like my neighbour\'s dog 🧡', lastMessageAt: past(3), unread: 1 },
  { id: 'match-4', userId: 'user-3', matchedAt: past(72), lastMessage: '', lastMessageAt: past(72), unread: 0 },
  { id: 'match-5', userId: 'user-7', matchedAt: past(96), lastMessage: '', lastMessageAt: past(96), unread: 0 },
];

// Users to show in swipe deck (not yet matched)
export const SWIPE_CANDIDATES = ['user-2', 'user-4', 'user-6', 'user-8'];
