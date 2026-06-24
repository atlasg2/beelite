-- Reference (not bid math): printed product spec + provenance on each finish.
ALTER TABLE "ProjectFinish" ADD COLUMN "manufacturer" TEXT;
ALTER TABLE "ProjectFinish" ADD COLUMN "product" TEXT;
ALTER TABLE "ProjectFinish" ADD COLUMN "sourceSheet" TEXT;
