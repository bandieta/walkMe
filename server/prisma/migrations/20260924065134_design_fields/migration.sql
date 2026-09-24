-- AlterTable
ALTER TABLE "Dog" ADD COLUMN "ageGroup" TEXT;
ALTER TABLE "Dog" ADD COLUMN "energy" TEXT;
ALTER TABLE "Dog" ADD COLUMN "photoUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "onboardedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "radiusKm" REAL;
ALTER TABLE "User" ADD COLUMN "walkTimes" TEXT;
