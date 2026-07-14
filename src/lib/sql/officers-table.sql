-- Officers table for real-time CMS
CREATE TABLE IF NOT EXISTS officers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  lore TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '/Officers/gojosan.jpg',
  is_special BOOLEAN NOT NULL DEFAULT false,
  display_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Anyone can view officers" ON officers;
DROP POLICY IF EXISTS "Admin can insert officers" ON officers;
DROP POLICY IF EXISTS "Admin can update officers" ON officers;
DROP POLICY IF EXISTS "Admin can delete officers" ON officers;

-- New policies
CREATE POLICY "Anyone can view officers" ON officers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert" ON officers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update" ON officers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete" ON officers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE officers;

-- Seed ALL 17 officers + 2 special mentions
INSERT INTO officers (id, name, position, description, lore, image, display_order, is_special) VALUES
('officer-16', 'Prof. Maria Nykhaella Javillonar', 'Adviser', 'The Elder Sage — guiding light of the guild, her wisdom steers us through every storm.', 'When the students sought to revive M.A.G.E., it was Prof. Javillonar who believed in them and provided the institutional support needed. Her guidance transformed a dream into an officially recognized reality.', '/Officers/gojosan.jpg', 1, false),
('officer-1', 'Christine Joy P. Echica', 'President', 'The Guild Master — a fearless leader who commands with wisdom and ignites the fire of passion in every mage.', 'When the M.A.G.E. Guild was revived in A.Y. 2026-2027, it was Christine who answered the call to lead. With unwavering determination, she rallied the founding officers and breathed new life into the organization.', '/Officers/gojosan.jpg', 2, false),
('officer-2', 'Argo Lladel S. Pecate', 'V.P. for Finance', 'The Gold Keeper — master of treasury arts, ensuring every coin fuels the guild''s grandest quests.', 'A strategic mind with an eye for resources. Argo ensures that every peso collected serves a purpose — from convention budgets to merchandise production.', '/Officers/gojosan.jpg', 3, false),
('officer-6', 'Christopher John B. Imus', 'V.P. for Membership', 'The Recruiter — a charismatic soul who summons new mages and strengthens the guild''s ranks.', 'Christopher''s infectious enthusiasm is the guild''s greatest recruitment tool. He personally welcomes every new member.', '/Officers/gojosan.jpg', 4, false),
('officer-9', 'Allan F. Chan Jr.', 'V.P. for External Affairs', 'The Diplomat — forging alliances beyond the guild walls, his connections span multiple kingdoms.', 'Allan''s network extends beyond UE Caloocan. His partnerships with other organizations have opened doors that strengthened M.A.G.E.', '/Officers/gojosan.jpg', 5, false),
('officer-13', 'Joshua Carl Elon', 'V.P. for Internal Affairs', 'The Guardian — protector of guild harmony, ensuring every member thrives within our walls.', 'Joshua is the heart of M.A.G.E.''s internal community. He resolves conflicts, ensures member welfare, and keeps the guild''s spirit strong.', '/Officers/gojosan.jpg', 6, false),
('officer-10', 'Mark Justine Quizado', 'V.P. for Media Documentation', 'The Chrono Mage — capturing moments in time, his lens preserves the guild''s greatest memories.', 'Every photo, every video, every visual memory of M.A.G.E.''s revival exists because of Mark''s dedication.', '/Officers/gojosan.jpg', 7, false),
('officer-14', 'Jeremiah A. Jacinto', 'V.P. for Creatives', 'The Enchanter — wielder of boundless imagination, his creative spells bring visions to life.', 'Every poster, every banner, every visual identity of the revived M.A.G.E. bears Jeremiah''s creative touch.', '/Officers/gojosan.jpg', 8, false),
('officer-5', 'Gramasia Rose Merca', 'Secretary', 'The Lore Scribe — keeper of sacred records, her quill captures every moment of guild history.', 'Every resolution passed, every meeting held, every milestone achieved — Gramasia ensures nothing is lost to time.', '/Officers/gojosan.jpg', 9, false),
('officer-3', 'Bless Jhiniel V. Selda', 'P.R.O.', 'The Herald — voice of the guild across all realms, spreading our legend to every corner.', 'Bless carries the guild''s message far and wide. From social media campaigns to campus announcements.', '/Officers/gojosan.jpg', 10, false),
('officer-17', 'Paula Stephanie Yanzon', 'Assistant P.R.O.', 'The Shadow Herald — working tirelessly behind the scenes, amplifying the guild''s voice across all platforms.', 'Paula is the unsung force multiplier of M.A.G.E.''s public relations.', '/Officers/gojosan.jpg', 11, false),
('officer-7', 'Nigel Marcus Discaya', 'Events Director', 'The Battle Planner — architect of legendary gatherings, every event he crafts becomes an epic saga.', 'Behind every successful guild event is Nigel''s meticulous planning. From conceptualization to execution.', '/Officers/gojosan.jpg', 12, false),
('officer-11', 'Zamuel Quintero', 'Business Manager', 'The Merchant Lord — cunning strategist of commerce, turning vision into sustainable power.', 'Zamuel turns creative vision into tangible results. From merchandise to sponsorship deals.', '/Officers/gojosan.jpg', 13, false),
('officer-4', 'Dale Wilson Espiritu', 'COE Representative', 'The Iron Sentinel — steadfast warrior of engineering, bridging the forge between realms.', 'Representing the College of Engineering, Dale bridges the technical and creative worlds.', '/Officers/gojosan.jpg', 14, false),
('officer-8', 'Justin Leigh Domingo', 'CAS Representative', 'The Arcane Scholar — wielding knowledge as his blade, he bridges arts and sciences.', 'Justin represents the College of Arts & Sciences. His broad perspective brings unique creative insights.', '/Officers/justin.jpg', 15, false),
('officer-12', 'Carl Vincent Manalastas', 'CBA Representative', 'The Trade Knight — a warrior of business acumen, his strategies fuel the guild''s growth.', 'Carl brings the strategic thinking of the College of Business Administration to M.A.G.E.', '/Officers/gojosan.jpg', 16, false),
('officer-15', 'Samantha Nadine G. Flores', 'CFAD Representative', 'The Art Weaver — her designs cast illusions of beauty, a true master of the visual arts.', 'Representing the College of Fine Arts, Architecture and Design, Samantha infuses every guild project with artistic excellence.', '/Officers/gojosan.jpg', 17, false),
('special-1', 'Christine Joy P. Echica', 'President & Revival Leader', 'The Guild Master who revived M.A.G.E. — without her leadership, the guild would remain dormant.', 'Christine didn''t just become President — she became the catalyst for M.A.G.E.''s entire resurrection. The Revival is her legacy.', '/Officers/gojosan.jpg', 18, true),
('special-2', 'Dave Matthew S. Punzalan', 'Website Creator & Developer', 'The Arcane Architect — the mind behind this digital realm, forging the guild''s online presence from code and creativity.', 'When M.A.G.E. was revived, Dave answered the call to build the guild''s digital home. This website — every animation, every interaction, every line of code — is his creation.', '/Officers/dave.jpg', 19, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  position = EXCLUDED.position,
  description = EXCLUDED.description,
  lore = EXCLUDED.lore,
  image = EXCLUDED.image,
  display_order = EXCLUDED.display_order,
  is_special = EXCLUDED.is_special;
