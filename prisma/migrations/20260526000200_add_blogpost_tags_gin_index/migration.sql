-- Create GIN index for BlogPost.tags for efficient tag filtering/search
CREATE INDEX "BlogPost_tags_idx" ON "BlogPost" USING GIN ("tags");
