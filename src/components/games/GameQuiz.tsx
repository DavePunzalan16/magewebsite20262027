"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ArcadeGameResult } from "@/lib/types/arcade";

interface Props { onComplete: (result: ArcadeGameResult) => Promise<void>; }

interface Question {
  q: string;
  choices: string[];
  answer: number;
  difficulty: "easy" | "medium" | "hard";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const QUESTIONS: Question[] = [
  // EASY - Anime
  { q: "What anime features a boy who becomes a pirate king?", choices: ["One Piece", "Naruto", "Bleach", "Dragon Ball"], answer: 0, difficulty: "easy" },
  { q: "Who is the main character of Naruto?", choices: ["Sasuke", "Naruto Uzumaki", "Kakashi", "Itachi"], answer: 1, difficulty: "easy" },
  { q: "What is the name of Goku's signature attack?", choices: ["Rasengan", "Kamehameha", "Spirit Bomb", "Final Flash"], answer: 1, difficulty: "easy" },
  { q: "Which anime is about collecting Dragon Balls?", choices: ["One Piece", "Dragon Ball", "Fairy Tail", "Bleach"], answer: 1, difficulty: "easy" },
  { q: "What is the name of the Shinigami in Death Note?", choices: ["Ryuk", "Light", "L", "Misa"], answer: 0, difficulty: "easy" },
  { q: "Which anime features Titan-fighting soldiers?", choices: ["Attack on Titan", "Tokyo Ghoul", "Demon Slayer", "Jujutsu Kaisen"], answer: 0, difficulty: "easy" },
  { q: "Who is the strongest hero in One Punch Man?", choices: ["Genos", "Saitama", "Bang", "Tatsumaki"], answer: 1, difficulty: "easy" },
  { q: "What fruit did Luffy eat?", choices: ["Flame Flame", "Gum Gum", "Chop Chop", "Smoke Smoke"], answer: 1, difficulty: "easy" },
  { q: "Which anime is set in a world of quirks/superpowers?", choices: ["My Hero Academia", "Mob Psycho 100", "One Punch Man", "Hunter x Hunter"], answer: 0, difficulty: "easy" },
  { q: "What is Pikachu's type in Pokemon?", choices: ["Fire", "Water", "Electric", "Grass"], answer: 2, difficulty: "easy" },
  { q: "What anime has a notebook that kills people?", choices: ["Death Note", "Psycho-Pass", "Another", "Future Diary"], answer: 0, difficulty: "easy" },
  { q: "Who is Naruto's rival and best friend?", choices: ["Shikamaru", "Sasuke", "Rock Lee", "Gaara"], answer: 1, difficulty: "easy" },
  { q: "What is the name of the school in My Hero Academia?", choices: ["Hogwarts", "U.A. High", "Kunugigaoka", "Shuchiin"], answer: 1, difficulty: "easy" },
  { q: "Which anime character has a straw hat?", choices: ["Luffy", "Zoro", "Ace", "Shanks"], answer: 0, difficulty: "easy" },
  { q: "What sport is featured in Haikyuu?", choices: ["Basketball", "Soccer", "Volleyball", "Tennis"], answer: 2, difficulty: "easy" },
  { q: "Who created the manga One Piece?", choices: ["Kishimoto", "Oda", "Toriyama", "Togashi"], answer: 1, difficulty: "easy" },
  { q: "What is the Sharingan in Naruto?", choices: ["A weapon", "An eye technique", "A village", "A jutsu scroll"], answer: 1, difficulty: "easy" },
  { q: "Which anime is about a demon slayer named Tanjiro?", choices: ["Demon Slayer", "Inuyasha", "Bleach", "Blue Exorcist"], answer: 0, difficulty: "easy" },
  { q: "What is Vegeta's relationship to Goku?", choices: ["Brother", "Rival", "Teacher", "Son"], answer: 1, difficulty: "easy" },
  { q: "Which Studio Ghibli film features a girl in a spirit world?", choices: ["Spirited Away", "Howl's Moving Castle", "Totoro", "Ponyo"], answer: 0, difficulty: "easy" },
  // EASY - Games
  { q: "What is the best-selling video game of all time?", choices: ["Minecraft", "GTA V", "Tetris", "Wii Sports"], answer: 0, difficulty: "easy" },
  { q: "What company created Mario?", choices: ["Sega", "Sony", "Nintendo", "Microsoft"], answer: 2, difficulty: "easy" },
  { q: "What game features characters like Master Chief?", choices: ["Halo", "Call of Duty", "Gears of War", "Destiny"], answer: 0, difficulty: "easy" },
  { q: "In Minecraft, what material is needed to make a portal to the Nether?", choices: ["Diamond", "Obsidian", "Gold", "Iron"], answer: 1, difficulty: "easy" },
  { q: "What genre is League of Legends?", choices: ["FPS", "MOBA", "RPG", "Battle Royale"], answer: 1, difficulty: "easy" },
  { q: "What is the main character's name in The Legend of Zelda?", choices: ["Zelda", "Link", "Ganon", "Navi"], answer: 1, difficulty: "easy" },
  { q: "Which game has a battle royale mode called Warzone?", choices: ["Fortnite", "PUBG", "Call of Duty", "Apex Legends"], answer: 2, difficulty: "easy" },
  { q: "What color is Sonic the Hedgehog?", choices: ["Red", "Green", "Blue", "Yellow"], answer: 2, difficulty: "easy" },
  { q: "What game features the character Steve building blocks?", choices: ["Roblox", "Minecraft", "Terraria", "Fortnite"], answer: 1, difficulty: "easy" },
  { q: "Which game has agents like Jett, Phoenix, and Sage?", choices: ["Overwatch", "Valorant", "Apex", "CS:GO"], answer: 1, difficulty: "easy" },
  // EASY - Manga
  { q: "What is manga?", choices: ["Japanese comics", "Chinese animation", "Korean drama", "Japanese music"], answer: 0, difficulty: "easy" },
  { q: "Manga is typically read in which direction?", choices: ["Left to right", "Right to left", "Top to bottom only", "Random"], answer: 1, difficulty: "easy" },
  { q: "Which manga magazine publishes One Piece?", choices: ["Shonen Jump", "Shonen Sunday", "Monthly Shonen", "Kodansha"], answer: 0, difficulty: "easy" },
  { q: "What does 'shonen' mean?", choices: ["Girl", "Boy", "Adult", "Child"], answer: 1, difficulty: "easy" },
  { q: "Which manga has over 1000 chapters?", choices: ["Naruto", "One Piece", "Dragon Ball", "Bleach"], answer: 1, difficulty: "easy" },
  // EASY - M.A.G.E. Guild
  { q: "What does M.A.G.E. stand for?", choices: ["Manga Anime Game Enthusiast", "Magic Arts Gaming Entertainment", "Modern Anime Guild Elite", "Media Arts Game Entertainment"], answer: 0, difficulty: "easy" },
  { q: "Where is the M.A.G.E. Guild based?", choices: ["UE Manila", "UE Caloocan", "UST", "FEU"], answer: 1, difficulty: "easy" },
  { q: "What type of organization is M.A.G.E.?", choices: ["Sports club", "Academic org", "Interest-based org", "Business org"], answer: 2, difficulty: "easy" },
  { q: "M.A.G.E. Guild focuses on which 3 areas?", choices: ["Music, Art, Games", "Manga, Anime, Games", "Movies, Animation, Gaming", "Media, Arts, Graphics"], answer: 1, difficulty: "easy" },
  { q: "What university is UE-Caloocan part of?", choices: ["University of the East", "University of the Philippines", "Far Eastern University", "Ateneo"], answer: 0, difficulty: "easy" },
  // MEDIUM - Anime
  { q: "What is the name of Eren's Titan form?", choices: ["Colossal Titan", "Attack Titan", "War Hammer", "Beast Titan"], answer: 1, difficulty: "medium" },
  { q: "In Jujutsu Kaisen, what is Gojo's domain expansion?", choices: ["Chimera Shadow", "Infinite Void", "Malevolent Shrine", "Coffin of Iron Mountain"], answer: 1, difficulty: "medium" },
  { q: "Who is the author of Attack on Titan?", choices: ["Hajime Isayama", "Eiichiro Oda", "Tite Kubo", "Akira Toriyama"], answer: 0, difficulty: "medium" },
  { q: "What is Luffy's Gear 5 form called?", choices: ["Sun God Nika", "Snakeman", "Boundman", "Tankman"], answer: 0, difficulty: "medium" },
  { q: "Which Hashira uses Flame Breathing in Demon Slayer?", choices: ["Giyu", "Rengoku", "Tengen", "Muichiro"], answer: 1, difficulty: "medium" },
  { q: "What year did Naruto's anime first air?", choices: ["2000", "2002", "2004", "1999"], answer: 1, difficulty: "medium" },
  { q: "Who killed Jiraiya in Naruto?", choices: ["Orochimaru", "Pain", "Itachi", "Madara"], answer: 1, difficulty: "medium" },
  { q: "What is the name of the survey corps in AoT?", choices: ["Military Police", "Garrison", "Scout Regiment", "Training Corps"], answer: 2, difficulty: "medium" },
  { q: "In Hunter x Hunter, what is Gon's Nen type?", choices: ["Enhancer", "Transmuter", "Emitter", "Conjurer"], answer: 0, difficulty: "medium" },
  { q: "Which anime has the Akatsuki organization?", choices: ["Bleach", "Naruto", "One Piece", "Dragon Ball"], answer: 1, difficulty: "medium" },
  { q: "What is the name of the 4th Hokage?", choices: ["Hiruzen", "Minato", "Tsunade", "Hashirama"], answer: 1, difficulty: "medium" },
  { q: "In One Piece, what is Zoro's dream?", choices: ["Find One Piece", "Greatest Swordsman", "Draw world map", "Find All Blue"], answer: 1, difficulty: "medium" },
  { q: "What studio animated Demon Slayer?", choices: ["MAPPA", "Ufotable", "Bones", "Wit Studio"], answer: 1, difficulty: "medium" },
  { q: "Who is All Might's successor in MHA?", choices: ["Bakugo", "Todoroki", "Deku", "Mirio"], answer: 2, difficulty: "medium" },
  { q: "What is the Philosopher's Stone in FMA?", choices: ["A gem", "Concentrated human souls", "Dragon blood", "Alchemy formula"], answer: 1, difficulty: "medium" },
  // MEDIUM - Games
  { q: "What is the max level in most Pokemon games?", choices: ["50", "80", "100", "120"], answer: 2, difficulty: "medium" },
  { q: "In Valorant, which agent can resurrect teammates?", choices: ["Sage", "Phoenix", "Skye", "KAY/O"], answer: 0, difficulty: "medium" },
  { q: "What is the rarest item in Minecraft?", choices: ["Diamond", "Netherite", "Dragon Egg", "Emerald"], answer: 2, difficulty: "medium" },
  { q: "Which game has champions like Yasuo and Ahri?", choices: ["Dota 2", "League of Legends", "Smite", "Heroes of the Storm"], answer: 1, difficulty: "medium" },
  { q: "What year was Fortnite Battle Royale released?", choices: ["2015", "2016", "2017", "2018"], answer: 2, difficulty: "medium" },
  { q: "In Genshin Impact, what element is Zhongli?", choices: ["Pyro", "Geo", "Hydro", "Anemo"], answer: 1, difficulty: "medium" },
  { q: "What is the final boss in Dark Souls 3?", choices: ["Nameless King", "Soul of Cinder", "Gael", "Aldrich"], answer: 1, difficulty: "medium" },
  { q: "Which game features a character named 'The Dragonborn'?", choices: ["Witcher 3", "Skyrim", "Dragon Age", "Elden Ring"], answer: 1, difficulty: "medium" },
  { q: "What is the currency in Valorant?", choices: ["V-Bucks", "Credits", "Coins", "VP"], answer: 3, difficulty: "medium" },
  { q: "In Among Us, what is the maximum number of impostors?", choices: ["2", "3", "4", "5"], answer: 1, difficulty: "medium" },
  { q: "What game studio created Elden Ring?", choices: ["CD Projekt Red", "FromSoftware", "Bethesda", "Capcom"], answer: 1, difficulty: "medium" },
  { q: "Which Pokemon generation introduced Mega Evolution?", choices: ["Gen 4", "Gen 5", "Gen 6", "Gen 7"], answer: 2, difficulty: "medium" },
  { q: "In Genshin Impact, what is the name of the traveler's sibling?", choices: ["Aether/Lumine", "Paimon", "Dainsleif", "Venti"], answer: 0, difficulty: "medium" },
  { q: "What rank comes after Gold in Valorant?", choices: ["Diamond", "Platinum", "Ascendant", "Immortal"], answer: 1, difficulty: "medium" },
  { q: "In League of Legends, what lane does the ADC play?", choices: ["Top", "Mid", "Jungle", "Bot"], answer: 3, difficulty: "medium" },
  // MEDIUM - Manga/M.A.G.E.
  { q: "What is the difference between manga and manhwa?", choices: ["Language", "Country of origin", "Art style", "Reading direction"], answer: 1, difficulty: "medium" },
  { q: "What manga genre targets young adult women?", choices: ["Shonen", "Seinen", "Josei", "Kodomomuke"], answer: 2, difficulty: "medium" },
  { q: "Who wrote Dragon Ball?", choices: ["Oda", "Kishimoto", "Toriyama", "Togashi"], answer: 2, difficulty: "medium" },
  { q: "What is a 'tankoubon' in manga?", choices: ["A chapter", "A collected volume", "A one-shot", "A magazine"], answer: 1, difficulty: "medium" },
  { q: "Which manga won Jump's most popular poll in 2024?", choices: ["One Piece", "Jujutsu Kaisen", "My Hero Academia", "Chainsaw Man"], answer: 0, difficulty: "medium" },
  { q: "What does 'seinen' manga target?", choices: ["Young boys", "Adult men", "Young girls", "Children"], answer: 1, difficulty: "medium" },
  { q: "The M.A.G.E. Guild website was built with which framework?", choices: ["React", "Vue", "Next.js", "Angular"], answer: 2, difficulty: "medium" },
  { q: "What database does M.A.G.E. Guild's website use?", choices: ["MongoDB", "Firebase", "Supabase", "MySQL"], answer: 2, difficulty: "medium" },
  { q: "In the M.A.G.E. Guild system, what do members earn for activity?", choices: ["Coins", "XP and Mana", "Tokens", "Stars"], answer: 1, difficulty: "medium" },
  { q: "What styling framework does M.A.G.E. use?", choices: ["Bootstrap", "Tailwind CSS", "Material UI", "Chakra UI"], answer: 1, difficulty: "medium" },
  // HARD - Anime
  { q: "What is the true name of the One Piece?", choices: ["Joy Boy's treasure", "Not yet revealed", "The World Government secret", "An ancient weapon"], answer: 1, difficulty: "hard" },
  { q: "In Bleach, what is Ichigo's final Bankai called?", choices: ["Tensa Zangetsu", "Zangetsu", "Getsuga Tensho", "Mugetsu"], answer: 0, difficulty: "hard" },
  { q: "What is the name of Gojo's reverse cursed technique?", choices: ["Infinity", "Red", "Blue", "Hollow Purple"], answer: 0, difficulty: "hard" },
  { q: "Who was the first One Piece character Oda designed?", choices: ["Luffy", "Shanks", "Buggy", "Morgan"], answer: 0, difficulty: "hard" },
  { q: "In Evangelion, what is the Human Instrumentality Project?", choices: ["Robot building", "Merging all human souls", "Time travel", "Space exploration"], answer: 1, difficulty: "hard" },
  { q: "What is the name of the 5th Emperor in One Piece?", choices: ["Shanks", "Luffy", "Blackbeard", "Buggy"], answer: 1, difficulty: "hard" },
  { q: "In Chainsaw Man, who is the Control Devil?", choices: ["Power", "Makima", "Reze", "Himeno"], answer: 1, difficulty: "hard" },
  { q: "What is Sukuna's original form in Jujutsu Kaisen?", choices: ["2 fingers", "4 arms 2 faces", "A curse", "A sword"], answer: 1, difficulty: "hard" },
  { q: "Who is the author of Berserk?", choices: ["Togashi", "Kentaro Miura", "Araki", "Inoue"], answer: 1, difficulty: "hard" },
  { q: "In Code Geass, what is Lelouch's Geass power?", choices: ["Time stop", "Absolute obedience", "Mind reading", "Future sight"], answer: 1, difficulty: "hard" },
  { q: "What year did Studio Ghibli release Princess Mononoke?", choices: ["1995", "1997", "1999", "2001"], answer: 1, difficulty: "hard" },
  { q: "In Steins;Gate, what is the organization's name?", choices: ["SERN", "Future Gadget Lab", "Valkyrie", "Committee of 300"], answer: 1, difficulty: "hard" },
  { q: "Who is the main villain of the Marineford Arc?", choices: ["Akainu", "Blackbeard", "Sengoku", "Kizaru"], answer: 0, difficulty: "hard" },
  { q: "What is the highest-grossing anime film ever?", choices: ["Your Name", "Demon Slayer Mugen Train", "Spirited Away", "One Piece Film Red"], answer: 1, difficulty: "hard" },
  { q: "In Death Note, what rule prevents Light from killing L directly?", choices: ["13-day rule", "Must know face and name", "Can't kill Shinigami", "No rule"], answer: 1, difficulty: "hard" },
  // HARD - Games
  { q: "What is the name of the final area in Elden Ring?", choices: ["Leyndell", "Erdtree", "Ashen Capital", "Elphael"], answer: 2, difficulty: "hard" },
  { q: "In Dota 2, what item gives the most raw damage?", choices: ["Daedalus", "Divine Rapier", "Butterfly", "Abyssal Blade"], answer: 1, difficulty: "hard" },
  { q: "What is the max rank in Valorant?", choices: ["Immortal 3", "Radiant", "Diamond 3", "Ascendant 3"], answer: 1, difficulty: "hard" },
  { q: "In League of Legends, what year was it released?", choices: ["2007", "2009", "2011", "2010"], answer: 1, difficulty: "hard" },
  { q: "What Genshin Impact boss drops materials for Raiden Shogun?", choices: ["Signora", "Azhdaha", "Stormterror", "Childe"], answer: 0, difficulty: "hard" },
  { q: "In Dark Souls, what is the name of the first boss?", choices: ["Taurus Demon", "Asylum Demon", "Capra Demon", "Gargoyles"], answer: 1, difficulty: "hard" },
  { q: "What is the hidden village in Minecraft called?", choices: ["Stronghold", "End City", "Ancient City", "Woodland Mansion"], answer: 2, difficulty: "hard" },
  { q: "In Valorant, what is Chamber's ultimate ability?", choices: ["Tour de Force", "Showstopper", "Blade Storm", "Rolling Thunder"], answer: 0, difficulty: "hard" },
  { q: "What game has the concept of 'Archons' as elemental gods?", choices: ["Honkai", "Genshin Impact", "Tower of Fantasy", "Wuthering Waves"], answer: 1, difficulty: "hard" },
  { q: "In Pokemon, which type has the most weaknesses?", choices: ["Ice", "Grass", "Rock", "Bug"], answer: 1, difficulty: "hard" },
  { q: "What is the rarest achievement in Minecraft Java?", choices: ["How Did We Get Here?", "Adventuring Time", "Beaconator", "The End"], answer: 0, difficulty: "hard" },
  { q: "In Elden Ring, who is Malenia's twin brother?", choices: ["Radahn", "Miquella", "Godrick", "Morgott"], answer: 1, difficulty: "hard" },
  { q: "What year was the first Pokemon game released in Japan?", choices: ["1994", "1996", "1998", "1995"], answer: 1, difficulty: "hard" },
  { q: "In Honkai Star Rail, what path is Kafka?", choices: ["Destruction", "Nihility", "Erudition", "Hunt"], answer: 1, difficulty: "hard" },
  { q: "What is the name of the dragon in League of Legends Summoner's Rift?", choices: ["Baron", "Drake", "Herald", "Vilemaw"], answer: 1, difficulty: "hard" },
  // HARD - Manga/Culture
  { q: "What manga holds the Guinness record for most copies published?", choices: ["Dragon Ball", "One Piece", "Golgo 13", "Naruto"], answer: 1, difficulty: "hard" },
  { q: "Which manga ran in Shonen Jump for 30+ years?", choices: ["One Piece", "Kochikame", "Golgo 13", "JoJo"], answer: 1, difficulty: "hard" },
  { q: "What is a 'doujinshi'?", choices: ["Official manga", "Self-published work", "Animation studio", "Manga award"], answer: 1, difficulty: "hard" },
  { q: "Who is considered the 'God of Manga'?", choices: ["Akira Toriyama", "Osamu Tezuka", "Eiichiro Oda", "Rumiko Takahashi"], answer: 1, difficulty: "hard" },
  { q: "What year was the first Weekly Shonen Jump issue?", choices: ["1968", "1970", "1972", "1965"], answer: 0, difficulty: "hard" },
  { q: "What Japanese word means 'comics for adult women'?", choices: ["Josei", "Shoujo", "Seinen", "Yaoi"], answer: 0, difficulty: "hard" },
  { q: "In manga terminology, what is a 'one-shot'?", choices: ["First chapter", "Single complete story", "Action scene", "Last chapter"], answer: 1, difficulty: "hard" },
  { q: "What is Comiket?", choices: ["Manga award", "Doujinshi convention", "Anime studio", "Publishing house"], answer: 1, difficulty: "hard" },
  { q: "Which manga magazine rivals Shonen Jump?", choices: ["Monthly Shonen", "Shonen Magazine", "Big Comic", "Young Jump"], answer: 1, difficulty: "hard" },
  { q: "What is 'isekai' as a genre?", choices: ["Horror", "Transported to another world", "School life", "Sports"], answer: 1, difficulty: "hard" },
  // More easy fillers
  { q: "What color is Super Saiyan hair?", choices: ["Blue", "Red", "Gold/Yellow", "Green"], answer: 2, difficulty: "easy" },
  { q: "Which anime character says 'Plus Ultra'?", choices: ["All Might", "Goku", "Naruto", "Luffy"], answer: 0, difficulty: "easy" },
  { q: "What is cosplay?", choices: ["Costume play", "Comic strip", "Animation", "Video game"], answer: 0, difficulty: "easy" },
  { q: "What is the most popular battle royale game?", choices: ["PUBG", "Fortnite", "Apex Legends", "All popular"], answer: 3, difficulty: "easy" },
  { q: "What does RPG stand for in gaming?", choices: ["Role Playing Game", "Really Popular Game", "Racing Platform Game", "Rapid Play Genre"], answer: 0, difficulty: "easy" },
  // More medium
  { q: "What is a 'gacha' game?", choices: ["Free to play", "Random loot box mechanic", "Fighting game", "Card game"], answer: 1, difficulty: "medium" },
  { q: "In anime, what does 'OVA' stand for?", choices: ["Original Video Animation", "Official Voice Actor", "Open Visual Art", "Overseas Video Anime"], answer: 0, difficulty: "medium" },
  { q: "What is the longest running anime series?", choices: ["One Piece", "Detective Conan", "Sazae-san", "Doraemon"], answer: 2, difficulty: "medium" },
  { q: "Which console is made by Nintendo?", choices: ["PlayStation", "Xbox", "Switch", "Steam Deck"], answer: 2, difficulty: "medium" },
  { q: "What does NPC stand for in gaming?", choices: ["Non-Player Character", "New Player Content", "No Problem Created", "National Pokemon Center"], answer: 0, difficulty: "medium" },
  // More hard
  { q: "What is the name of the sword style Zoro uses?", choices: ["Two Sword", "Three Sword", "Nine Sword", "No Sword"], answer: 1, difficulty: "hard" },
  { q: "In HxH, what floor does Hisoka fight on in Heaven's Arena?", choices: ["100th", "150th", "200th", "250th"], answer: 2, difficulty: "hard" },
  { q: "What year was the anime 'Cowboy Bebop' released?", choices: ["1996", "1998", "2000", "1997"], answer: 1, difficulty: "hard" },
  { q: "In Naruto, how many tailed beasts exist?", choices: ["7", "8", "9", "10"], answer: 2, difficulty: "hard" },
  { q: "What game engine does Genshin Impact use?", choices: ["Unreal", "Unity", "Custom", "Godot"], answer: 1, difficulty: "hard" },
  // More easy fillers about guild/general
  { q: "What is an 'org' in university?", choices: ["Organization", "Organ", "Origin", "Orchestra"], answer: 0, difficulty: "easy" },
  { q: "What platform hosts the M.A.G.E. website?", choices: ["GitHub", "Vercel", "Netlify", "AWS"], answer: 1, difficulty: "easy" },
  { q: "What is Discord used for?", choices: ["Video editing", "Communication", "Music production", "Drawing"], answer: 1, difficulty: "easy" },
  { q: "What is a guild in gaming?", choices: ["A weapon", "A group of players", "A quest", "A map"], answer: 1, difficulty: "easy" },
  { q: "What does PvP mean?", choices: ["Player vs Player", "Play vs Pay", "Power vs Power", "Point vs Point"], answer: 0, difficulty: "easy" },
  // More medium fillers
  { q: "What is the name of Demon Slayer's final arc?", choices: ["Mugen Train", "Entertainment District", "Infinity Castle", "Sunrise Countdown"], answer: 2, difficulty: "medium" },
  { q: "In Pokemon, which type beats Dragon?", choices: ["Ice", "Fairy", "Dragon", "All of these"], answer: 3, difficulty: "medium" },
  { q: "What anime studio made Attack on Titan Season 4?", choices: ["Wit Studio", "MAPPA", "Ufotable", "Bones"], answer: 1, difficulty: "medium" },
  { q: "What is 'webtoon'?", choices: ["Anime type", "Digital comic format", "Game genre", "Music video"], answer: 1, difficulty: "medium" },
  { q: "In Genshin, what is Paimon?", choices: ["Emergency food", "A god", "A weapon", "A monster"], answer: 0, difficulty: "medium" },
  // Fill to 200 questions
  { q: "What is the sword's name in Bleach?", choices: ["Zanpakuto", "Katana", "Buster Sword", "Excalibur"], answer: 0, difficulty: "medium" },
  { q: "Who is the main character of Spy x Family?", choices: ["Yor", "Loid Forger", "Anya", "Bond"], answer: 1, difficulty: "easy" },
  { q: "What power does Anya have in Spy x Family?", choices: ["Super strength", "Telepathy", "Invisibility", "Flight"], answer: 1, difficulty: "easy" },
  { q: "In Mob Psycho 100, what is Mob's real name?", choices: ["Kageyama Shigeo", "Reigen Arataka", "Teru Hanazawa", "Ritsu"], answer: 0, difficulty: "medium" },
  { q: "What is the currency in Fortnite?", choices: ["Credits", "V-Bucks", "Coins", "Gems"], answer: 1, difficulty: "easy" },
  { q: "Which anime features a basketball team?", choices: ["Haikyuu", "Kuroko no Basket", "Slam Dunk", "Both B and C"], answer: 3, difficulty: "medium" },
  { q: "What is 'anime'?", choices: ["Japanese animation", "Chinese cartoons", "Korean comics", "American art"], answer: 0, difficulty: "easy" },
  { q: "What does 'kawaii' mean?", choices: ["Scary", "Cool", "Cute", "Strong"], answer: 2, difficulty: "easy" },
  { q: "In gaming, what is 'FPS'?", choices: ["First Person Shooter", "Fast Play Speed", "Free Player System", "Final Power Strike"], answer: 0, difficulty: "easy" },
  { q: "What is the name of the organization in Naruto that hunts tailed beasts?", choices: ["ANBU", "Akatsuki", "Sound Village", "Root"], answer: 1, difficulty: "medium" },
  { q: "Who is the creator of JoJo's Bizarre Adventure?", choices: ["Togashi", "Araki", "Miura", "Oda"], answer: 1, difficulty: "hard" },
  { q: "What is the most-watched anime on Crunchyroll?", choices: ["One Piece", "Dragon Ball", "Attack on Titan", "Jujutsu Kaisen"], answer: 0, difficulty: "hard" },
  { q: "In Minecraft, what is the Ender Dragon?", choices: ["A mob", "The final boss", "A pet", "A biome"], answer: 1, difficulty: "easy" },
  { q: "What genre is Stardew Valley?", choices: ["FPS", "Farming sim", "Horror", "Racing"], answer: 1, difficulty: "easy" },
  { q: "Which game has a character called 'The Knight' and takes place in Hallownest?", choices: ["Dark Souls", "Hollow Knight", "Celeste", "Dead Cells"], answer: 1, difficulty: "medium" },
  { q: "What does 'GG' mean in gaming?", choices: ["Good Game", "Get Going", "Great Graphics", "Game Guide"], answer: 0, difficulty: "easy" },
  { q: "In Valorant, what does Killjoy's ultimate do?", choices: ["Reveals enemies", "Detains all enemies in range", "Heals team", "Creates wall"], answer: 1, difficulty: "hard" },
  { q: "Who voices Gojo in the Japanese dub of JJK?", choices: ["Junichi Suwabe", "Yuichi Nakamura", "Kenjiro Tsuda", "Takehito Koyasu"], answer: 1, difficulty: "hard" },
  { q: "What is the strongest Titan in AoT?", choices: ["Colossal", "Attack", "Founding", "War Hammer"], answer: 2, difficulty: "hard" },
  { q: "In League of Legends, what is Baron Nashor?", choices: ["A champion", "A neutral monster", "An item", "A rune"], answer: 1, difficulty: "medium" },
];

const TIME_LIMIT = 45 * 60; // 45 minutes in seconds
const QUESTIONS_PER_RUN = 75;

export default function GameQuiz({ onComplete }: Props) {
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const startTime = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startQuiz = useCallback((diff: "easy" | "medium" | "hard") => {
    setDifficulty(diff);
    // Filter by difficulty then randomize, pick 75
    const pool = QUESTIONS.filter(q => {
      if (diff === "easy") return true; // easy sees all
      if (diff === "medium") return q.difficulty === "medium" || q.difficulty === "hard";
      return q.difficulty === "hard";
    });
    const selected = shuffle(pool).slice(0, QUESTIONS_PER_RUN);
    setQuestions(selected);
    setCurrent(0);
    setScore(0);
    setSelected(null);
    setShowResult(false);
    setFinished(false);
    setTimeLeft(diff === "hard" ? 30 * 60 : diff === "medium" ? 40 * 60 : TIME_LIMIT);
    startTime.current = Date.now();
  }, []);

  // Timer
  useEffect(() => {
    if (!difficulty || finished) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setFinished(true);
          onComplete({ score, won: score > QUESTIONS_PER_RUN / 2, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [difficulty, finished, score, onComplete]);

  const handleAnswer = (idx: number) => {
    if (showResult || finished) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === questions[current].answer) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (current + 1 >= questions.length) {
      setFinished(true);
      onComplete({ score: score * 2, won: score > QUESTIONS_PER_RUN / 2, durationSeconds: Math.floor((Date.now() - startTime.current) / 1000) });
      return;
    }
    setCurrent(c => c + 1);
    setSelected(null);
    setShowResult(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  // Difficulty selection screen
  if (!difficulty) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-6">
        <h2 className="font-display text-[28px] text-white">M.A.G.E. Quiz</h2>
        <p className="font-body text-[14px] text-offwhite/60 text-center max-w-[400px]">
          Test your knowledge about Manga, Anime, Games, and the M.A.G.E. Guild!
          <br />75 randomized questions per run.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-[300px]">
          <button onClick={() => startQuiz("easy")} className="rounded-[10px] border border-green-500/30 bg-green-500/10 px-6 py-3 font-body text-[14px] text-green-400 hover:bg-green-500/20 transition-colors">
            🟢 Easy — 45 min
          </button>
          <button onClick={() => startQuiz("medium")} className="rounded-[10px] border border-yellow-500/30 bg-yellow-500/10 px-6 py-3 font-body text-[14px] text-yellow-400 hover:bg-yellow-500/20 transition-colors">
            🟡 Medium — 40 min
          </button>
          <button onClick={() => startQuiz("hard")} className="rounded-[10px] border border-red-500/30 bg-red-500/10 px-6 py-3 font-body text-[14px] text-red-400 hover:bg-red-500/20 transition-colors">
            🔴 Hard — 30 min
          </button>
        </div>
      </div>
    );
  }

  // Finished screen
  if (finished) {
    const percent = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="font-display text-[28px] text-white">Quiz Complete!</h2>
        <p className="font-body text-[16px] text-offwhite">{score}/{questions.length} correct ({percent}%)</p>
        <p className="font-body text-[13px] text-primary">+{score * 2} XP earned</p>
        <div className="mt-2 flex gap-3">
          <button onClick={() => setDifficulty(null)} className="rounded-full bg-primary/10 px-4 py-2 font-body text-[12px] text-primary hover:bg-primary/20">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const q = questions[current];

  return (
    <div className="flex flex-col items-center w-full max-w-[600px] mx-auto">
      {/* HUD */}
      <div className="mb-4 flex items-center justify-between w-full">
        <span className="font-body text-[12px] text-offwhite/50">Q {current + 1}/{questions.length}</span>
        <span className="font-body text-[13px] text-white">Score: <span className="text-primary font-bold">{score}</span></span>
        <span className={`font-body text-[13px] ${timeLeft < 60 ? "text-red-400 animate-pulse" : "text-offwhite"}`}>⏱️ {formatTime(timeLeft)}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-dark-gray/30 mb-4 overflow-hidden">
        <div className="h-full bg-primary/60 rounded-full transition-all" style={{ width: `${((current + 1) / questions.length) * 100}%` }} />
      </div>

      {/* Question */}
      <div className="w-full rounded-[12px] border border-dark-gray/30 bg-surface/30 p-6">
        <p className="font-body text-[15px] text-white mb-4 leading-relaxed">{q.q}</p>
        <div className="flex flex-col gap-2">
          {q.choices.map((choice, idx) => {
            let className = "w-full text-left rounded-[8px] border px-4 py-3 font-body text-[13px] transition-colors ";
            if (showResult) {
              if (idx === q.answer) className += "border-green-500/50 bg-green-500/10 text-green-400";
              else if (idx === selected) className += "border-red-500/50 bg-red-500/10 text-red-400";
              else className += "border-dark-gray/20 bg-transparent text-offwhite/40";
            } else {
              className += "border-dark-gray/30 bg-background/30 text-offwhite hover:border-primary/50 hover:bg-primary/5";
            }
            return (
              <button key={idx} onClick={() => handleAnswer(idx)} className={className} disabled={showResult}>
                {String.fromCharCode(65 + idx)}. {choice}
              </button>
            );
          })}
        </div>

        {showResult && (
          <button onClick={nextQuestion} className="mt-4 w-full rounded-full bg-primary/10 py-2 font-body text-[12px] text-primary hover:bg-primary/20">
            {current + 1 >= questions.length ? "Finish" : "Next Question →"}
          </button>
        )}
      </div>

      <span className="mt-3 font-body text-[10px] text-offwhite/30 uppercase">{difficulty} difficulty</span>
    </div>
  );
}
