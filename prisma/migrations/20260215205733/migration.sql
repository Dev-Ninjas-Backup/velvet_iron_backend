-- CreateTable
CREATE TABLE "onboarding" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "iscomplete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "onboarding_userId_key" ON "onboarding"("userId");

-- AddForeignKey
ALTER TABLE "onboarding" ADD CONSTRAINT "onboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
