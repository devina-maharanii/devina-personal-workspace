-- Add unique constraint for custom domains to prevent tenant collisions
CREATE UNIQUE INDEX "OrganizationSettings_customDomain_key"
ON "OrganizationSettings"("customDomain");
