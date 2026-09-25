-- CreateTable
CREATE TABLE "DogWalkRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dogId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "shelterId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" DATETIME,
    "lastMessage" TEXT,
    "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unreadForRequester" INTEGER NOT NULL DEFAULT 0,
    "unreadForShelter" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DogWalkRequest_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DogWalkRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DogWalkRequest_shelterId_fkey" FOREIGN KEY ("shelterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Dog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerId" TEXT,
    "shelterId" TEXT,
    "name" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "weight" REAL,
    "bio" TEXT,
    "emoji" TEXT,
    "energy" TEXT,
    "ageGroup" TEXT,
    "photoUrl" TEXT,
    "personality" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Dog_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dog_shelterId_fkey" FOREIGN KEY ("shelterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Dog" ("age", "ageGroup", "bio", "breed", "createdAt", "emoji", "energy", "id", "name", "ownerId", "personality", "photoUrl", "updatedAt", "weight") SELECT "age", "ageGroup", "bio", "breed", "createdAt", "emoji", "energy", "id", "name", "ownerId", "personality", "photoUrl", "updatedAt", "weight" FROM "Dog";
DROP TABLE "Dog";
ALTER TABLE "new_Dog" RENAME TO "Dog";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "bio" TEXT,
    "age" INTEGER,
    "location" TEXT,
    "walkTimes" TEXT,
    "radiusKm" REAL,
    "onboardedAt" DATETIME,
    "lat" REAL,
    "lng" REAL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "accountType" TEXT NOT NULL DEFAULT 'person',
    "shelterConfirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("age", "bio", "createdAt", "displayName", "email", "id", "lat", "lng", "location", "onboardedAt", "photoUrl", "provider", "providerId", "radiusKm", "status", "updatedAt", "walkTimes") SELECT "age", "bio", "createdAt", "displayName", "email", "id", "lat", "lng", "location", "onboardedAt", "photoUrl", "provider", "providerId", "radiusKm", "status", "updatedAt", "walkTimes" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_provider_providerId_key" ON "User"("provider", "providerId");
CREATE TABLE "new_WalkParticipant" (
    "walkId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dogId" TEXT,

    PRIMARY KEY ("walkId", "userId"),
    CONSTRAINT "WalkParticipant_walkId_fkey" FOREIGN KEY ("walkId") REFERENCES "Walk" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WalkParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WalkParticipant_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES "Dog" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WalkParticipant" ("userId", "walkId") SELECT "userId", "walkId" FROM "WalkParticipant";
DROP TABLE "WalkParticipant";
ALTER TABLE "new_WalkParticipant" RENAME TO "WalkParticipant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "DogWalkRequest_dogId_requesterId_key" ON "DogWalkRequest"("dogId", "requesterId");
