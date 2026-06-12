-- All accounts are admins now: drop the role column and its enum type.
ALTER TABLE "User" DROP COLUMN "role";
DROP TYPE "Role";
