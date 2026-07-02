ALTER TABLE "lessons" DROP CONSTRAINT IF EXISTS "lessons_youtube_url_check";

ALTER TABLE "lessons"
  ADD CONSTRAINT "lessons_video_url_check" CHECK (
    "youtube_url" ~ '^https://(www\.)?(youtube\.com/(watch\?v=|embed/|shorts/|live/)|youtu\.be/)[A-Za-z0-9_-]+'
    OR "youtube_url" ~ '^https://drive\.google\.com/file/d/[A-Za-z0-9_-]+'
    OR "youtube_url" ~ '^https://1drv\.ms/v/'
    OR "youtube_url" ~ '^https://(www\.)?onedrive\.live\.com/'
  );
