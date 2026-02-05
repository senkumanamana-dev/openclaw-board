-- CreateEnum
CREATE TYPE "TaskOrigin" AS ENUM ('HUMAN', 'AI');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "taskNumber" SERIAL NOT NULL;
ALTER TABLE "Task" ADD COLUMN "origin" "TaskOrigin" NOT NULL DEFAULT 'HUMAN';

-- CreateTable
CREATE TABLE "StatusHistory" (
    "id" TEXT NOT NULL,
    "status" "TaskStatus" NOT NULL,
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exitedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "taskId" TEXT NOT NULL,

    CONSTRAINT "StatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Task_taskNumber_key" ON "Task"("taskNumber");

-- CreateIndex
CREATE INDEX "StatusHistory_taskId_enteredAt_idx" ON "StatusHistory"("taskId", "enteredAt");

-- AddForeignKey
ALTER TABLE "StatusHistory" ADD CONSTRAINT "StatusHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
