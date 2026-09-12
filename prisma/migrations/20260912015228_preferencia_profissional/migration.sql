-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "preferidaId" TEXT;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_preferidaId_fkey" FOREIGN KEY ("preferidaId") REFERENCES "professional_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
