import { useState, useCallback } from "react";

// ============================================================
// DATA LAYER — edit this to add homeworlds, careers, etc.
// ============================================================

const HOMEWORLDS = {
  1: {
    name: "Primitive Origins",
    nameSet: "Primitive",
    worldType: "Feral",
    label3: "World Type:",
    baseStats: { WS: 20, BS: 20, S: 25, T: 25, Ag: 20, Int: 20, Per: 20, WP: 15, Fel: 15 },
    baseWounds: 9,
    fateBrackets: [4, 10, 0, 0],
    ageBrackets: [70, 100, 0],
    ageOptions: ["Warrior(15)", "Old One(25)"],
    careers: ["Assassin", "Guardsman", "Imperial Psyker", "Scum"],
    backgrounds: ["Molten Wastes", "Frozen Wastes", "Water World", "Seas of Sand", "Jungles", "Apocalyptic Wasteland", "Swamps", "Temperate", "Imposing Geography"],
    superstitions: ["Dirt Ward", "Unlucky Colour", "Hunter's Oath", "Thirsty Blade", "Spirit Shackle", "Warrior Death", "Power of Names", "Lonely Dead", "Living Record", "Nemesis"],
    traits: "Iron Stomach, Primitive, Rite of Passage, Wilderness Savvy",
    skills: "Speak Language (Tribal Dialect) (Int), Basic Skills: Navigation (Surface) (Int), Survival (Int), Tracking (Int)",
    talents: "",
    randomWeights: [30, 80, 90, 100, 0, 0, 0, 0],
  },
  2: {
    name: "Imperial Citizen",
    nameSet: "Imperial",
    worldType: "Imperial",
    label3: "World Type:",
    baseStats: { WS: 20, BS: 20, S: 20, T: 20, Ag: 20, Int: 20, Per: 20, WP: 23, Fel: 20 },
    baseWounds: 8,
    fateBrackets: [0, 8, 10, 0],
    ageBrackets: [50, 80, 100],
    ageOptions: ["Stripling(20)", "Mature(30)", "Veteran(40)"],
    careers: ["Adept", "Arbitrator", "Assassin", "Cleric", "Guardsman", "Imperial Psyker", "Scum", "Tech-Priest"],
    backgrounds: ["Agri-world", "Backwater", "Feudal World", "War Zone", "Dead Planet", "Shrine World", "Paradise Planet"],
    superstitions: [],
    traits: "Blessed Ignorance, Hagiography, Liturgical Familiarity, Superior Origins",
    skills: "Basic Skills: Speak Language (High Gothic) (Int), Literacy (Int), Common Lore (Imperial Creed) (Int), Common Lore (Imperium) (Int), Common Lore (War) (Int)",
    talents: "",
    randomWeights: [12, 25, 38, 52, 65, 79, 90, 100],
  },
  3: {
    name: "Hive World",
    nameSet: "Low Born",
    worldType: "Hive",
    label3: "Caste:",
    baseStats: { WS: 20, BS: 20, S: 20, T: 15, Ag: 20, Int: 20, Per: 20, WP: 20, Fel: 25 },
    baseWounds: 8,
    fateBrackets: [4, 8, 10, 0],
    ageBrackets: [30, 90, 100],
    ageOptions: ["Nipper(15)", "Adult(25)", "Old Timer(35)"],
    careers: ["Arbitrator", "Assassin", "Cleric", "Guardsman", "Imperial Psyker", "Scum", "Tech-Priest"],
    backgrounds: ["Hive Rat", "Ganger Scum", "Factory Dregs", "Middle Hive", "Specialist", "Hive Noble"],
    superstitions: [],
    traits: "Accustomed to Crowds, Raised in Caves of Steel, Hivebound, Wary",
    skills: "Speak Language (Hive Dialect) (Int), Basic Skills: Tech-Use (Int)",
    talents: "",
    randomWeights: [17, 20, 25, 35, 40, 89, 100, 0],
  },
  4: {
    name: "Forge World",
    nameSet: "Mechanicus",
    worldType: "Forge",
    label3: "Point of Origin:",
    baseStats: { WS: 15, BS: 20, S: 20, T: 20, Ag: 20, Int: 25, Per: 20, WP: 20, Fel: 20 },
    baseWounds: 7,
    fateBrackets: [5, 9, 10, 0],
    ageBrackets: [30, 90, 100],
    ageOptions: ["Nipper(15)", "Adult(25)", "Old Timer(35)"],
    careers: ["Adept", "Assassin", "Guardsman", "Scum", "Tech-Priest"],
    backgrounds: ["Greater Forge World", "Minor Forge World", "Orbital", "Demesne", "Research Outpost", "Explorator Fleet"],
    superstitions: [],
    traits: "Fit For Purpose, Stranger to the Cult, Credo Omnissiah",
    skills: "Basic Skills: Common Lore (Tech) (Int), Common Lore (Machine Cult) (Int)",
    talents: "Technical Knock",
    randomWeights: [25, 35, 60, 70, 100, 0, 0, 0],
  },
  5: {
    name: "Void Born",
    nameSet: "Void Born",
    worldType: "Void",
    label3: "Craft of Origin:",
    baseStats: { WS: 20, BS: 20, S: 15, T: 20, Ag: 20, Int: 20, Per: 20, WP: 25, Fel: 20 },
    baseWounds: 6,
    fateBrackets: [0, 8, 10, 0],
    ageBrackets: [40, 70, 100],
    ageOptions: ["Youth(15)", "Mature(20)", "Methuselah(50)"],
    careers: ["Adept", "Arbitrator", "Assassin", "Cleric", "Imperial Psyker", "Scum", "Tech-Priest"],
    backgrounds: ["Space Hulk", "Orbital", "Chartist Vessel", "War Ship", "Rogue Trader"],
    superstitions: [],
    traits: "Charmed, Ill-Omened, Shipwise, Void Accustomed",
    skills: "Basic Skills: Navigation (Stellar) (Int), Pilot (Spacecraft) (Ag)",
    talents: "",
    randomWeights: [10, 20, 25, 35, 75, 85, 100, 0],
  },
  6: {
    name: "Schola Progenium",
    nameSet: "High Born",
    worldType: "Schola",
    label3: "Fate of your progenitors:",
    baseStats: { WS: 20, BS: 20, S: 20, T: 20, Ag: 20, Int: 20, Per: 20, WP: 20, Fel: 20 },
    baseWounds: 8,
    fateBrackets: [2, 7, 10, 0],
    ageBrackets: [50, 80, 100],
    ageOptions: ["Stripling(20)", "Mature(30)", "Veteran(40)"],
    careers: ["Adept", "Arbitrator", "Cleric", "Guardsman"],
    careersF: ["Adept", "Arbitrator", "Cleric", "Guardsman", "Schola Progenium Sororitas"],
    backgrounds: ["Warrior Martyr", "Slaughtered by Rebels", "Distant Outpost", "Lost to the Void", "Without a Trace", "Never to Return", "Not Spoken of"],
    superstitions: [],
    traits: "Schola Education, Skill at Arms, Sheltered Upbringing, Tempered Will",
    skills: "Literacy (Int), Speak Language (High Gothic) (Int), Speak Language (Low Gothic) (Int), Basic Skills: Common Lore (Administratum) (Int), Common Lore (Ecclesiarchy) (Int), Common Lore (Imperial Creed) (Int), Common Lore (Imperium) (Int), Common Lore (War) (Int), Scholastic Lore (Philosophy) (Int)",
    talents: "Basic Weapon Training (Las or SP), Melee Weapon Training (Primitive), Pistol Training (Las or SP)",
    randomWeights: [20, 40, 60, 100, 0, 0, 0, 0],
    randomWeightsF: [20, 40, 60, 80, 100, 0, 0, 0],
  },
  7: {
    name: "Noble Born",
    nameSet: "High Born",
    worldType: "Noble",
    label3: "Lineage of Renown:",
    baseStats: { WS: 20, BS: 20, S: 20, T: 20, Ag: 20, Int: 20, Per: 20, WP: 15, Fel: 25 },
    baseWounds: 8,
    fateBrackets: [3, 9, 10, 0],
    ageBrackets: [50, 80, 100],
    ageOptions: ["Stripling(20)", "Mature(30)", "Veteran(40)"],
    careers: ["Adept", "Arbitrator", "Assassin", "Cleric", "Guardsman", "Imperial Psyker", "Scum"],
    backgrounds: ["Merchant Magnates", "Family Militant", "Commanders of Mankind", "Provender of the Imperium", "House of Iron Spires", "The Blood of Greatness", "Rogue's Fortune", "Shadowed Blood"],
    superstitions: [],
    traits: "Etiquette, Supremely Connected, Vendetta, Wealth",
    skills: "Literacy (Int), Speak Language (High & Low Gothic) (Int). Basic Skills: Navigation (Stellar) (Int), Pilot (Spacecraft) (Ag)",
    talents: "Peer (Nobility), Peer (*Of your choice)",
    randomWeights: [18, 30, 40, 56, 75, 85, 100, 0],
  },
  8: {
    name: "Mind Cleansed",
    nameSet: "",
    worldType: "",
    label3: "Shards of Memory:",
    baseStats: { WS: 20, BS: 20, S: 20, T: 20, Ag: 20, Int: 20, Per: 20, WP: 25, Fel: 15 },
    baseWounds: 8,
    fateBrackets: [0, 3, 9, 10],
    ageBrackets: [40, 70, 100],
    ageOptions: ["Youth(15)", "Mature(20)", "Methuselah(50)"],
    careers: ["Arbitrator", "Assassin", "Cleric", "Guardsman", "Imperial Psyker", "Tech-Priest"],
    backgrounds: ["The Shattered Mirror", "The Cold Grave", "The Night of the Daemon", "The Sole Survivor", "The Dark Altar", "The Throne of Blood", "The Nightmare Forest", "The Malfian Candidate", "The Repairer of the Reputations"],
    superstitions: [],
    traits: "Engramp Implantation, Failsafe Control, Imperial Conditioning, Through A Mirror Darkly",
    skills: "Deceive (Fel), Intimidate (S). Basic Skills: Common Lore (Tech) (Int), Survival (Int)",
    talents: "Jaded, Pistol Weapon Training (SP or Las)",
    randomWeights: [15, 50, 60, 80, 90, 100, 0, 0],
  },
};

const CAREERS = {
  Adept: {
    skills: "Speak Language (Low Gothic) (Int), Literacy (Int), Trade (Copyist) (Int) or Trade (Valet) (Fel), Common Lore (Imperium) (Int), Scholastic Lore (Legend) (Int) or Common Lore (Tech) (Int)",
    talents: "Melee Weapon Training (Primitive) or Pistol Training (SP), Light Sleeper or Resistance (Cold), Sprint or Unremarkable",
    gear: "Stub Revolver (6 rounds) or Staff, Administratum robes (Common Quality Clothing), Auto-Quill or Writing Kit, Chrono or hour glass, Data slate or illuminated tome, backpack",
  },
  Arbitrator: {
    skills: "Speak Language (Low Gothic) (Int), Literacy (Int), Common Lore (Adeptus Arbites) (Int), Common Lore (Imperium) (Int), Inquiry (Fel)",
    talents: "Basic Weapons Training (SP), Melee Weapons Training (Primitive), Quick Draw or Rapid Reload",
    gear: "Shotgun (12 shells), Club, Brass Knuckles, Knife, chain coat or flak vest or mesh vest, uniform (good quality clothing), 3 doses of stimm, injector, Arbitrator ID, chrono, pack of lho-sticks or flask of amasec",
  },
  Assassin: {
    skills: "Speak Language (Low Gothic) (Int), Awareness (Per), Dodge (Ag)",
    talents: "Ambidextrous or Unremarkable, Thrown Weapon Training or Pistol Training (Las), Basic Weapons Training (SP), Melee Weapons Training (Primitive), Pistol Training (SP)",
    gear: "Shotgun (12 shells) or Hunting Rifle (16 rounds) or Autogun (1 clip [30]), Sword, Knife, Compact Las Pistol (1 Charge Pack) or 10 throwing knives, 3 doses of stimm, Black body glove (Common quality clothing)",
  },
  Cleric: {
    skills: "Speak Language (Low Gothic) (Int), Common Lore (Imperial Creed) (Int), Literacy (Int), Performer (Singer) (Fel) or Trade (Copyist) (Int), Trade (Cook) (Int) or Trade (Valet) (Fel)",
    talents: "Pistol Training (SP), Basic Weapons Training (Primitive) or Thrown Weapon Training (Primitive), Melee Weapons Training (Primitive), Pistol Training (SP)",
    gear: "Hammer or Sword, stub revolver (6 rounds) or autopistol (1 clip), crossbow (10 bolts) or 5 throwing knives, chain coat or flak vest, aquila necklace, Ecclesiarchy robes (good quality clothing), 4 candles, backpack",
  },
  Guardsman: {
    skills: "Speak Language (Low Gothic) (Int), Drive (Ground Vehicle) (Ag) or Swim (S)",
    talents: "Melee Weapon Training (Primitive), Pistol Training (Primitive or Las), Basic Weapons Training (Las), Basic Weapons Training (Primitive or SP)",
    gear: "Sword or axe or hammer, flintlock pistol (12 shots) or las pistol (1 charge pack), lasgun (1 charge pack), bow (10 arrows) or musket (12 shots) or shotgun (12 shells), knife, guard flak armour, uniform or stealth gear or street clothes (common quality clothing), 1 week corpse starch rations, mercenary licence or explosive collar or Imperial infantryman's Uplifting Primer",
  },
  "Imperial Psyker": {
    skills: "Speak Language (Low Gothic) (Int), Psyniscience (Per), Invocation (WP), Trade (Merchant) (Fel) or Trade (Soothesayer) (Fel), Literacy (Int)",
    talents: "Melee Weapon Training (Primitive), Pistol Training (SP or Las), Psy Rating 1",
    gear: "Sword or axe, staff, compact stub revolver (3 bullets) or compact las pistol (1 charge pack), knife (psykana mercy blade), quilted vest, tatty robe (poor quality clothing), book of imperial saints or deck of cards or dice, Psy-Focus, sanctioning brand",
    hasSanctioning: true,
  },
  Scum: {
    skills: "Speak Language (Low Gothic) (Int), Blather (Fel), Charm (Fel) or Dodge (Ag), Deceive (Fel), Awareness (Per), Common Lore (Imperium) (Int)",
    talents: "Ambidextrous or Unremarkable, Melee Weapon Training (Primitive), Pistol Training (SP), Basic Weapon Training (SP)",
    gear: "Autogun (1 clip [30]) or Shotgun (12 shells), Autopistol (1 clip [30]), Brass Knuckles or club, Knife, quilted vest or beast furs, street ware or dirty coveralls (poor quality clothing)",
  },
  "Tech-Priest": {
    skills: "Speak Language (Low Gothic) (Int), Tech-Use (Int), Literacy (Int), Secret Tongue (Tech) (Int), Trade (Schrimshawer) (Ag) or Trade (Copyist) (Int)",
    talents: "Melee Weapon Training (Primitive), Pistol Training (Las), Basic Weapon Training (Las), Electro Graft use",
    gear: "Metal Staff, las pistol (1 charge pack), las carbine (1 charge pack), knife, flak vest, glow lamp, data-slate, Mechanicus robes and vestments (Good quality clothing), 1d10 spare parts (power cells, wires, chronometers, vial of sacred machine oil)",
  },
  "Schola Progenium Sororitas": {
    skills: "Common Lore (Imperial Creed) (Int), Literacy (Int), Performer (Singer) (Fel), Speak Language (Low Gothic) (Int), Trade (Copyist) (Int)",
    talents: "Melee Weapon Training (Primitive), Pistol Training (Las), Basic Weapon Training (Primitive), Pure Faith",
    gear: "Club or Flail or Staff, las pistol (1 charge pack), carapace chest plate and mesh cowl or feral plate, aquila necklace, chaplet ecclesiasticus, vestments (good quality clothing), 4 candles, writing kit, copy of the Rule of the Sororitas, Ring of Suffrage",
  },
};

const SANCTIONING = [
  "Reconstructed Skull", "Hunted", "Unlovely Memories", "The Horror! The Horror!",
  "Pain through Nerve Induction", "Dental Probes", "Optical Rupture", "Screaming Devotions",
  "Irradiance", "Tongue Bound", "Throne Wed", "Witch Prickling", "Hypno-doctrination",
];

const SANCTIONING_WEIGHTS = [9, 15, 26, 36, 43, 50, 58, 64, 71, 76, 89, 96, 101];

const SANCTIONING_EFFECTS = {
  1: { stat: "Int", col: "sanc", val: -3 },
  2: { stat: "I", col: "sanc", val: "1d10" },
  3: { stat: "I", col: "sanc", val: "1d5" },
  4: { stat: "I", col: "sanc", val: "1d5" },
  12: { stat: "T", col: "sanc", val: 3 },
  13: { stat: "WP", col: "sanc", val: 3 },
};

const DIVINATIONS = [
  { text: "Mutation without, corruption within", effect: {} },
  { text: "Only the insane have strength enough to prosper. Only those who prosper may judge what is sane", effect: { I: 2 } },
  { text: "Sins hidden in the heart turn all to decay", effect: { C: 3 } },
  { text: "Innocence is an illusion", effect: { C: 1, I: 1 } },
  { text: "Dark dreams lie upon the heart", effect: { C: 2 } },
  { text: "The pain of the bullet is ecstasy compared to damnation", effect: { T: 1 } },
  { text: "Kill the alien before it can speak its lies", effect: { Ag: 2 } },
  { text: "Truth is subjective", effect: { Int: 3, C: 3 } },
  { text: "Know the mutant; kill the mutant", effect: { Per: 2 } },
  { text: "Even a man who has nothing can still offer his life", effect: { S: 2 } },
  { text: "If a job is worth doing it is worth dying for", effect: {} },
  { text: "Only in death does duty end", effect: { W: 1 } },
  { text: "A mind without purpose will wander in dark places", effect: { F: 1 } },
  { text: "There are no civilians in the battle for survival", effect: { T: 2, W: 1 } },
  { text: "Violence solves everything", effect: { WS: 3 } },
  { text: "To war is human", effect: { Ag: 3 } },
  { text: "Die if you must, but not with your spirit broken", effect: { WP: 3 } },
  { text: "The gun is mightier than the sword", effect: { BS: 3 } },
  { text: "Be a boon to your brothers and bane to your enemies", effect: { Fel: 3 } },
  { text: "Men must die so that man endures", effect: { T: 3 } },
  { text: "In darkness, follow the light of Terra", effect: { WP: 3 } },
  { text: "The only true fear is of dying with your duty not done", effect: { W: 2 } },
  { text: "Thought begets Heresy; Heresy begets Retribution", effect: { S: 3 } },
  { text: "The wise man learns from the deaths of others", effect: { Int: 3 } },
  { text: "A suspicious mind is a healthy mind", effect: { Per: 3 } },
  { text: "Trust in your fear", effect: { Ag: 2, F: 1 } },
  { text: "There is no substitute for zeal", effect: { T: 2, WP: 2 } },
  { text: "Do not ask why you serve. Only ask how", effect: { WS: 2, BS: 2 } },
];

const DIV_WEIGHTS = [2,4,8,9,12,16,19,22,27,31,34,39,43,47,51,55,59,63,67,71,75,80,86,91,95,98,100,101];

const STAT_KEYS = ["WS", "BS", "S", "T", "Ag", "Int", "Per", "WP", "Fel"];
const STATUS_KEYS = ["W", "F", "I", "C"];

// Name data
const NAMES = {
  male: {
    default: { A: ["Ax","As","Ars","Abot","Ad","Adr","Aar","Ab","Ac","Acar","Acarn","Accurs","Ach","Acher","Achiv","Albor","Blyn","Ball","Brass","Aeg","Aemil","Aen","Aeol","Aug","Alac","Alar","Alb","Alr","Alv","Ama","Amer","Anat","Anth","Apol","Aquar","Ang","Ard","Aqul","Arec","Arm","Attic","Aurel","Ax","Bacc","Bal","Bar","Bast","Beat","Bel","Ben","Bol","Blaz","Brut","Bruc","Bruk","Cacc","Calix","D","Dol","Dam","Dan","Dar","Dokk","Dous","Dos","Dox","Dag","Cred","Cicc","Cel","Ces","Chas","Chrys","Cry","Crom","Cron","Cran","Cras","Cas","Castil","Crat","Crav","Crux","Crucc","Drow","Dr","Drom","Dus","Del","Dal","Des","Er","Erl","Earn","Ever","Ern","Ear","Fr","Frac","Frav","Fav","Fab","Fash","Fad","Frik","Frid","Furl","Fars","Stan","For","Fis","Fyr","Fal","Fek","Fux","Fruc","Greg","Greas","Gil","Gar","Gor","Gord","Gram","Gran","Grout","Gout","Got","Gat","Gas","Gaf","Gax","Glis","Glit","Gabr","Gatr","Gil","Gam","Gaz","Hec","Herc","Hedg","Had","Has","Hast","Hastr","Han","Ham","Hax","Hor","Horat","Hum","Hin","Ill","Ick","Ik","Id","Ias","Jac","Jon","J","Joh","Jov","Jax","Jud","Just","Jus","Jan","Jorn","Jaq","Jacq","Jorl","Korb","Kor","Kr","Kred","Krel","Kron","Krom","Krys","Kry","Krim","Krin","Kev","Kat","Katr","Krux","Kid","Lab","Lac","Lad","Orion","Laf","Lam","Lan","Lap","Laq","Lar","Las","Lat","Lav","Lex","Les","Lec","Leb","Led","Lor","Lax","Leon","Len","Lest","Lucc","Lox","Loc","Mor","Mar","Mer","Mir","Moor","Mord","Mart","Max","Maks","Mas","Monc","Morl","Mons","Mob","Nih","Nil","Nik","Nikol","Nicol","Nic","Nex","Nord","Nor","Nort","Nams","Oliv","Oct","Occel","Ot","Ots","Orl","Par","Pum","Pil","Pet","Perx","Pers","Prol","Prob","Pat","Patr","Pax","Quig","Qith","Quell","Qual","Red","Rad","Ror","Reb","Rev","Res","Rest","Rex","Rax","Rom","Ron","Roc","Rok","Rokk","Ross","Rod","Rad","Rab","Rat","Rath","Ratr","Rem","Ren","Sylos","Sh","Sik","Sis","Sod","Som","Sab","Sabr","Serg","Ser","Sir","Snadr","Silv","Sac","Sad","Saf","Sag","Sahr","Sept","Sep","Slar","Sar","Saur","Sirl","Tab","Tan","Tat","Ter","Terr","Term","Tom","Ton","Ther","Ux","Us","Ulyss","Unth","Uth","Vic","Viv","Vict","Vikt","Vik","Vicent","Virg","Var","Verd","Verr","Wral","War","Wes","Wrel","Wr","Wod","Wom","Zod","Zex","Zas","Zath","Sam","Samm","Sand","Sard","Barr"], B: ["i","io","o","an","on","ic","ik","is","e","in","ony","orsi","aro","an","en","es","on","obi","uth","edd","eth","ath","ov","orov","est","al","un","o","ot","ath","ire","io","ik","im","in","aln","ecki","y","al","ol","el","as","us","er"] },
    Primitive: { A: ["Arl","Bro","Dar","Frak","Fral","Garm","Grish","Grak","Hak","Jarr","Kar","Karrl","Krell","Lek","Mar","Mir","Narl","Orl","Frenz","Quarl","Roth","Ragaa","Stig","Strang","Thak","Ulth","Varn","Wrax","Yarn","Zek","As","Bot","Bosh","Abrer","Dol","Dok","Lor","Ak","Ek","Ik","Ok","Uk","Us","Uv","Ub","Dor","Dim","Dum","Ohr","Rag","Ragn","Fel","Dom","Drom","Sab","Oth","Cr","Kr","Br","Sor","Dr","Fr","Wr","Tot","Zan","Prot","Plot","Plut","Pl","Put","Pot","Kot","Cot","Chot","Chow","Blot","Blut","But","Bras"], B: ["o","ic","uk","or","ar","uk","uk","uk","ek","og","ug","ig","","","","ull","ul","ool","oth","oom","um","ep","ush"] },
    "High Born": { A: ["Ad","Adr","Aar","Ab","Ac","Acar","Acarn","Accurs","Ach","Acher","Achiv","Acuz","Blyn","Ball","Brass","Aeg","Aemil","Aen","Aeol","Agust","Alac","Alar","Alb","Alr","Alv","Ama","Amer","Anat","Anth","Apol","Aquar","Ang","Ard","Aquil","Arec","Arm","Attic","Atell","Aurel","Axel","Bacc","Bal","Bar","Bast","Beat","Bel","Ben","Blais","Blaz","Brut","Cacc","Calix","Call","Calig","Cam","Can","Oriann","Cass","Cat","Cel","Ces","Chuan","Cic","Cip","Clad","Claud","Col","Constant","Cor","Cord","Corn","Corw","Crisp","Dant","Dac","Deod","Del","Dom","Elad","Domin","Duc","Duk","Dux","El","Ez","Fab","Fah","Falc","Fan","Fantin","Farr","Faun","Faust","Fav","Fedel","Fel","Fek","Fer","Ferr","Fest","Fid","Fil","Firm","Fit","Flav","Florent","Gal","Galis","Gaz","Gad","Gen","Greg","Had","Hec","Herc","Herm","Hil","Ignat","Ign","Ill","Jac","Jan","Jar","Jenar","Jeov","Jerol","Jocund","Jov","Jud","Jul","Just","Justin","Justan","Juv","Juven","Kaar","Kalv","Klaud","Konstant","Konst","Korb","Kornel","Lar","Larr","Lam","Liber","Lib","Let","Lor","Lorn","Lucc","Lucrec","Lum","Luk","Mad","Maghn","Magh","Maks","Maksym","Maksymil","Manc","Manl","Marc","March","Marint","Orion","Mar","Mark","Mart","Maximil","Max","Mercur","Meris","Mer","Mil","Mill","Mis","Misen","Mith","Modes","Morr","Mont","Nar","Nahil","Narcis","Ner","Nic","Nol","Nost","Nos","Oleth","Octav","Oct","Olen","Oral","Ord","Ordan","Ordell","Pac","Oss","Ov","Pad","Pahrin","Palat","Palatin","Palm","Pat","Par","Patern","Patrid","Pax","Pel","Pereg","Perfect","Per","Perp","Pet","Pert","Pilat","Pil","Proces","Proc","Proct","Quant","Quentin","Rain","Real","Rebel","Redempt","Reg","Rem","Remeg","Riv","Romer","Rom","Sabr","Sab","Ross","Sal","Sant","San","Sarg","Satur","Sat","Sav","Scip","Scorp","Scrib","Senec","Sen","Seg","Sec","Secun","Secund","Semp","Sept","Septim","Seren","Serg","Sex","Sever","Severin","Silvan","Silv","Sil","Sim","Sir","Sirv","Sirvent","Sol","Solan","Solar","Somn","Som","Sop","Sopor","Stan","Stanis","Steph","Sylv","Sylvan","Sylvest","Tap","Tapan","Tarq","Tarran","Tar","Tars","Tarsic","Tat","Tatian","Taur","Tav","Ter","Teras","Thadd","Tiber","Tib","Tig","Tiz","Tom","Tonit","Trin","Trinit","Tull","Turn","Trans","Tran","Top","Torc","Tren","Tonit","Turn","Tur","Tybalt","Tyr","Tyb","Uisean","Ulic","Ulis","Ulix","Ulpian","Ulyses","Uniq","Un","Uran","Urb","Urs","Val","Valen","Valent","Valer","Var","Ved","Vened","Venedict","Vent","Ventur","Ver","Verg","Vergil","Verl","Vern","Vic","Vict","Victor","Vid","Vidal","Vik","Viktor","Vin","Vincent","Vinn","Vins","Virg","Virgil","Vir","Virx","Virxil","Vital","Vit","Viten","Vit","Vulc","Vulcan","Vulp","Wal","War","Warin","Wic","Xav","Xas","Xen","Xener","Xust","Yan","Zan","Zanob","Zanth","Zephyr","Zon","Zor"], B: ["us","us","us","io","io","ius","idus","ian","ion","ion","rian","rien","uth","ule","atas","otas","itas"] },
  },
  female: {
    default: { A: ["Axin","Ashel","Ars","Abuet","Ad","Adr","Ar","Ac","Acar","Acarn","Acarm","Accurs","Ach","Ach","Akiv","Ankar","Blys","Ball","Bell","Brit","Aeg","Aem","Aen","A","Alar","Alb","Alr","Alv","Am","Amer","Anat","Ann","Apol","Aquar","Ang","Ard","Aqul","Arec","Angel","Arm","Att","Aurel","Ax","Bal","Bar","Bast","Beat","Bel","Bet","Dev","Bry","Bras","Bres","Cort","Kort","Glor","Cacc","Cas","D","Dol","Dam","Dan","Dar","Dokk","Das","Dox","Dag","Citr","Cicc","Cel","Ces","Chas","Cath","Cry","Cath","Carm","Cynth","Cas","Cit","Castil","Cat","Crav","Dak","Dr","Drom","Dus","Del","Dal","Des","Ell","Oriann","Orion","Ever","Ern","Er","Fr","Frac","Frav","Fav","Far","Stan","For","Fis","Fyr","Fal","Grat","Grett","Gil","G","Gat","Grac","Gaf","Glis","Glit","Gabr","Gem","Gil","Gam","Gaz","Hass","Hel","Helen","Hath","Has","Hast","Hastr","Han","Hann","Hav","Hum","Id","Las","Jac","Jaz","Jez","Just","Jus","Jan","Joan","Kan","Kor","Kr","K","Kass","Kast","Kiv","Kry","Kris","Krin","Kat","Katr","Kid","Lab","Lac","Lad","Laf","Lam","Lan","Lap","Laq","Lar","Laur","Las","Lat","Lav","Lex","Les","Lec","Leb","Led","Lor","Lax","Lev","Len","Lest","Lucc","Lox","Loc","Mor","Mar","Mert","Max","Maks","Mimc","Mirl","Mins","Morg","Merv","Nih","Nil","Nik","Nik","Nicol","Nic","Nes","Nord","Nor","Nort","Navs","Oliv","Oct","Occel","Ot","Ots","Orl","Par","Pum","Pil","Pet","Perx","Pers","Prol","Prov","Pat","B","Pax","Q","Qith","Quell","Qual","Red","Rad","Ros","Reb","Rev","Res","Rest","Rex","Rax","Rom","Roc","Ros","Rab","Rem","Ren","Sylos","Sh","Sik","Sis","Soph","Clar","Sod","Sem","Sab","Sabr","Serg","Ser","Sir","Sar","Silv","Sylv","Sac","Sad","Saf","Sag","Sahr","Sept","Star","Steph","Sep","Slar","Sar","Sar","Soph","Tab","Tan","Tat","Ter","Terr","Term","Tar","Tor","Ther","Ux","Us","Ulyss","Unth","Uth","Vic","Viv","Vict","Vikt","Vik","Vicet","Virg","Var","Verd","Verr","War","Wes","Vell","Wr","Zod","Zess","Zas","Zath","Sam","Samm","Sand","Sard","Barr","Abel","Ari","Asc","Asp","C","Emel","Euphr","Ezr","Jess","Karm","Dahl"], B: ["a","ia","ae","ana","ona","en","ana","ika","isa","inia","ona","ii","ella","ala","any","ani","elle","ina","ania","inia","oria","isha","ity","ania","ana","asia","ie","anie","ora","ara","iette","eline","ena","anda","enia","ore","ira","a","a","a","onna","anda","andra","ynn","enn","asynn","enn","ynn"] },
    Primitive: { A: ["Arl","Bro","Bor","Dar","Frak","Fral","Garm","Grish","Grak","Hak","Jarr","Kar","Karrl","Krell","Lek","Mar","Mir","Narl","Orl","Phrenz","Quarl","Roth","Ragaa","Stig","Strang","Thak","Ulth","Varn","Wrax","Yarn","Zek","As","Bot","Bosh","Abrer","Dol","Dok","Lor","Ak","Ek","Ik","Ok","Uk","Us","Uv","Ub","Dor","Dim","Dum","Ohr"], B: ["a","ala","ana","isa","asa","isi","ee","a","a","a","i"] },
    "High Born": { A: ["Ad","Adr","Aar","Ab","Ac","Acar","Acarn","Accurs","Ach","Acher","Achiv","Acuz","Blys","Ball","Brass","Aeg","Aemil","Aen","Aeol","Agust","Alac","Alar","Alb","Alr","Alar","Alv","Ama","Amer","An","Ann","Am","Anat","Anth","Apol","Aquar","Ang","Ard","Aquil","Arec","Arm","Attic","Aurel","Atell","Axel","Bacc","Bal","Bar","Bast","Beat","Bel","Ben","Blais","Blaz","Brut","Cacc","Calix","Call","Calig","Cam","Can","Cass","Cat","Cel","Ces","Chuan","Cic","Cip","Clad","Claud","Col","Constant","Cor","Cord","Corn","Corw","Crisp","Dant","Dac","Deod","Del","Dom","Elad","Domin","Duc","Duk","Dux","El","Ez","Fab","Fah","Frey","Fran","Falc","Fan","Fantin","Farr","Faun","Faust","Fav","Fedel","Fel","Fek","Fer","Ferr","Fest","Fid","Fil","Firm","Fit","Flav","Florent","Gal","Galis","Gaz","Gad","Gen","Grac","Heth","Hel","Helen","Helan","Hil","Ignat","Ign","Ill","Jac","Jan","Jar","Jenar","Jeov","Jerol","Jocund","Jov","Jud","Jul","Just","Justin","Justan","Juv","Juven","Kaar","Kalv","Klaud","Konstant","Konst","Karb","Kornel","Lar","Larr","Lam","Liber","Lib","Let","Lor","Lorn","Lucc","Lucrec","Lum","Luk","Mad","Maghn","Magh","Maks","Maksym","Maksymil","Manc","Maval","Marc","Morg","March","Margint","Mar","Marg","Mart","Maximil","Mag","Mercur","Meris","Mer","Mil","Mill","Mis","Misen","Mith","Modes","Morr","Mont","Nar","Nahil","Narcis","Ner","Nic","Nol","Nost","Nos","Oriann","Orion","Oleth","Octav","Oct","Olen","Oral","Ord","Ordan","Ordell","Pac","Oss","Ov","Pad","Pahrin","Palat","Palatin","Palm","Pat","Par","Patern","Patrid","Pax","Pel","Pereg","Perf","Per","Perp","Pet","Pert","Pilat","Pil","Proces","Proc","Proct","Quant","Quentin","Rain","Real","Rebel","Redempt","Reg","Rem","Remeg","Riv","Romer","Rom","Sabr","Sab","Ross","Sal","Sant","San","Sar","Sar","Satar","Satur","Satir","Sat","Star","Sav","Scip","Scorp","Scrib","Senec","Sen","Seg","Sec","Secun","Secund","Semp","Sept","Septim","Seren","Serag","Sex","Sever","Severin","Silvan","Silv","Sil","Sim","Sir","Sirv","Sirvent","Sol","Solan","Solar","Somn","Som","Sop","Sopor","Stan","Stanis","Steph","Sylv","Sylvan","Sylv","Tap","Tapan","Tarq","Tarran","Tar","Tars","Tarsic","Tat","Tatian","Taur","Tav","Ter","Teras","Thadd","Tiber","Tib","Tig","Tiz","Tom","Tonit","Trin","Trinit","Tull","Turn","Trans","Tran","Top","Torc","Tren","Tonit","Turn","Tur","Tybalt","Tyr","Tyb","Uisean","Ulic","Ulis","Ulix","Ulpian","Ulyses","Uniq","Un","Uran","Urb","Urs","Val","Valen","Valent","Valer","Var","Ved","Vened","Venedict","Vent","Ventur","Ver","Verg","Vergil","Verl","Vern","Vic","Vict","Victor","Vid","Vidal","Vik","Viktor","Vin","Vinn","Vins","Virg","Virgin","Vir","Virx","Virxil","Vital","Vit","Viten","Vit","Vulc","Vulcan","Vulp","Wal","War","Warin","Wic","Xav","Xas","Xen","Xener","Xust","Yan","Zan","Zanob","Zanth","Zephyr","Zon","Zor","Sophit","Soph"], B: ["ana","ana","a","a","a","axa","ixa","osa","usa","ia","ia","iasa","idusa","iana","iona","a","riana","riena","uta","ula","ata","ota","ita","isi","ibi","itia","asa","asa","ella","allia","a","ila","alla","ina","orna","arna","anora","anie","ee","ae","iona","ary","asia","ity","ii","ay","ena","ancia","inta","icia","ela","onna","ana","ona","ora","ara","a","usa"] },
  },
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
const rand = (n) => Math.floor(Math.random() * n) + 1;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const roll = (sides) => Math.floor(Math.random() * sides) + 1;

function weightedRoll(weights) {
  const n = rand(100);
  for (let i = 0; i < weights.length; i++) {
    if (weights[i] > 0 && n <= weights[i]) return i + 1;
  }
  return 1;
}

function generateName(gender, nameSet) {
  const gKey = gender === "Male" ? "male" : "female";
  const setKey = (nameSet === "High Born" || nameSet === "Primitive") ? nameSet : "default";
  const { A, B } = NAMES[gKey][setKey] || NAMES[gKey].default;
  const validA = A.filter(Boolean);
  const validB = B.filter(Boolean);
  const baseName = pick(validA) + pick(validB);
  if (nameSet === "High Born") {
    const extras = Math.floor(Math.random() * 2) + 1;
    let name = baseName;
    for (let i = 0; i < extras; i++) name += " " + pick(validA) + pick(validB);
    return name;
  }
  return baseName;
}

function rollDivination() {
  const n = rand(100);
  for (let i = 0; i < DIV_WEIGHTS.length; i++) {
    if (n <= DIV_WEIGHTS[i]) return i;
  }
  return 0;
}

function calcBuild(gender, worldType, stats, heightRef) {
  let { S: str, T: tou, Ag: agi } = stats;
  let base = 61.5;
  let mod = 18;
  if (heightRef === null) {
    if (str >= 35) mod += 2;
    if (str >= 39 && tou <= 35) mod += 2;
    if (str < 35 || tou > str + 5) mod -= 1;
    if (tou > 35) mod += 1;
    if (tou > str) mod += 1;
    if (str < 28) mod -= 3;
    if (agi + 1 > (str + tou) / 2) mod -= 1;
    if (gender === "Female") mod -= 3;
    if (agi > tou + 5) mod += 5;
    let sAdj = str, tAdj = tou;
    if (worldType === "Feral") { sAdj += rand(20) + 9; tAdj += rand(20) + 9; mod += 2; }
    else if (worldType === "Imperial") { sAdj += rand(20) + 4; tAdj += rand(20) + 4; }
    else if (worldType === "Noble") { sAdj += rand(30) + 4; tAdj += rand(30) + 4; }
    else if (worldType === "Hive") { sAdj += rand(30); tAdj += rand(30); mod -= 2; }
    else if (worldType === "Forge") { sAdj += rand(30) + 2; tAdj += rand(30) + 2; }
    else if (worldType === "Schola") { tAdj += rand(30); }
    else { sAdj += rand(30) + 4; tAdj += rand(30) + 4; }
    let aAdj = agi;
    if (agi >= 38) aAdj += rand(15);
    const factor = parseFloat((((sAdj * 0.9 + tAdj * 0.8) - aAdj) / 100).toFixed(2));
    const h = parseFloat((base + factor * mod).toFixed(2));
    const hF = h / 12;
    const hF2 = Math.floor(hF);
    const hI = Math.round((hF - hF2) * 12);
    const hM = parseFloat((hF * 0.3048).toFixed(2));
    return { height: h, display: `${hF2}'${hI}"`, meters: hM };
  }
  return null;
}

function calcWeight(height, stats) {
  const { S: str, T: tou, Ag: agi } = stats;
  const base = 30;
  const baseH = 61.5;
  let v = 10 + (180 * ((height / 80) - (baseH / 80)));
  v += 25 * (str / 40);
  v += 25 * (tou / 40);
  v -= 25 * (agi / 40);
  const kg = parseFloat((base + v).toFixed(2));
  const lb = parseFloat((kg * 2.204).toFixed(0));
  return { kg, lb };
}

function rollAge(ageOptions, ageBrackets) {
  const n = rand(100);
  let sel = 0;
  for (let i = 0; i < ageBrackets.length; i++) {
    if (ageBrackets[i] > 0 && n <= ageBrackets[i]) { sel = i; break; }
    if (i === ageBrackets.length - 1) sel = i;
  }
  const opt = ageOptions[sel] || ageOptions[0];
  const base = parseInt(opt.replace(/\D/g, "")) || 20;
  return base + rand(10);
}

// ============================================================
// DEFAULT STATE
// ============================================================
const defaultChar = () => ({
  homeworldId: null,
  background: "",
  superstition: "",
  career: "",
  gender: "Male",
  name: "",
  divIndex: -1,
  sanctIndex: -1,
  sanctYears: 0,
  age: 0,
  ageOption: "",
  height: null,
  heightDisplay: "",
  weightKg: 0,
  weightLb: 0,
  rolls: { WS: [0,0], BS: [0,0], S: [0,0], T: [0,0], Ag: [0,0], Int: [0,0], Per: [0,0], WP: [0,0], Fel: [0,0] },
  statusRolls: { W: 0, F: 0, I: 0, C: 0 },
  statsRolled: false,
  rerolls: 0,
  rerollLimit: 1,
  lastReroll: null,
});

// ============================================================
// COMPUTED VALUES
// ============================================================
function computeStats(char) {
  if (!char.homeworldId) return {};
  const hw = HOMEWORLDS[char.homeworldId];
  const divBonus = char.divIndex >= 0 ? DIVINATIONS[char.divIndex].effect : {};
  const sanBonus = {};
  if (char.sanctIndex >= 0) {
    const e = SANCTIONING_EFFECTS[char.sanctIndex + 1];
    if (e) {
      if (e.val === "1d10" || e.val === "1d5") sanBonus[e.stat] = char.sanctYears > 0 ? char.sanctYears : 0;
      else sanBonus[e.stat] = e.val;
    }
  }
  const stats = {};
  for (const k of STAT_KEYS) {
    const base = hw.baseStats[k] || 20;
    const d1 = char.rolls[k]?.[0] || 0;
    const d2 = char.rolls[k]?.[1] || 0;
    const div = divBonus[k] || 0;
    const san = sanBonus[k] || 0;
    stats[k] = { d1, d2, base, div, san, total: d1 + d2 + base + div + san };
  }
  const wBase = hw.baseWounds;
  const wRoll = char.statusRolls.W || 0;
  const wDiv = divBonus.W || 0;
  const wSan = sanBonus.W || 0;
  const fBase = 0;
  const fRoll = char.statusRolls.F || 0;
  const fDiv = divBonus.F || 0;
  const fSan = sanBonus.F || 0;
  stats.W = { roll: wRoll, base: wBase, div: wDiv, san: wSan, total: wRoll + wBase + wDiv + wSan };
  stats.F = { roll: fRoll, base: fBase, div: fDiv, san: fSan, total: fRoll + fBase + fDiv + fSan };
  stats.I = { roll: char.statusRolls.I || 0, base: 0, div: divBonus.I || 0, san: sanBonus.I || 0 };
  stats.I.total = stats.I.roll + stats.I.base + stats.I.div + stats.I.san;
  stats.C = { roll: char.statusRolls.C || 0, base: 0, div: divBonus.C || 0, san: sanBonus.C || 0 };
  stats.C.total = stats.C.roll + stats.C.base + stats.C.div + stats.C.san;
  return stats;
}

// ============================================================
// MAIN APP
// ============================================================
export default function CharacterCreator({onNavigate}) {
  const [char, setChar] = useState(defaultChar());
  const [stats, setStats] = useState({});

  const update = useCallback((updater) => {
    setChar(prev => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      setStats(computeStats(next));
      return next;
    });
  }, []);

  // ---- ACTIONS ----
  function selectHomeworld(id) {
    const hw = HOMEWORLDS[id];
    const gender = Math.random() < 0.5 ? "Male" : "Female";
    const divIdx = rollDivination();
    const careers = (gender === "Female" && hw.careersF) ? hw.careersF : hw.careers;
    const wts = (gender === "Female" && hw.randomWeightsF) ? hw.randomWeightsF : hw.randomWeights;
    const careerIdx = weightedRoll(wts) - 1;
    const career = careers[Math.min(careerIdx, careers.length - 1)];
    const bg = hw.backgrounds.length ? pick(hw.backgrounds) : "";
    const sup = hw.superstitions.length ? pick(hw.superstitions) : "";
    const age = rollAge(hw.ageOptions, hw.ageBrackets);
    const name = generateName(gender, hw.nameSet);
    let sanctIndex = -1, sanctYears = 0;
    if (career === "Imperial Psyker") {
      const n = rand(100);
      let si = 0;
      for (let i = 0; i < SANCTIONING_WEIGHTS.length; i++) {
        if (n < SANCTIONING_WEIGHTS[i]) { si = i; break; }
      }
      sanctIndex = si;
      sanctYears = roll(si === 1 ? 10 : 5);
    }
    const rolled = doRollStats(id);
    const height = calcBuild(gender, hw.worldType, rolled.totalStats, null);
    const weight = calcWeight(height.height, rolled.totalStats);
    let fateRoll = 1;
    const fr = rand(10);
    if (fr > hw.fateBrackets[0]) fateRoll = 2;
    if (hw.fateBrackets[1] && fr > hw.fateBrackets[1]) fateRoll = 3;
    if (hw.fateBrackets[2] && fr > hw.fateBrackets[2] && hw.fateBrackets[3]) fateRoll = 4;

    update({
      homeworldId: id, gender, divIndex: divIdx, career,
      background: bg, superstition: sup, age, name,
      sanctIndex, sanctYears,
      rolls: rolled.rolls,
      statusRolls: { ...rolled.statusRolls, F: fateRoll },
      statsRolled: true, rerolls: 0, lastReroll: null,
      height: height.height, heightDisplay: height.display,
      weightKg: weight.kg, weightLb: weight.lb,
      ageOption: hw.ageOptions[0],
    });
  }

  function doRollStats(hwId) {
    const hw = HOMEWORLDS[hwId || char.homeworldId];
    const rolls = {};
    const totalStats = {};
    for (const k of STAT_KEYS) {
      const d1 = roll(10), d2 = roll(10);
      rolls[k] = [d1, d2];
      totalStats[k] = d1 + d2 + (hw.baseStats[k] || 20);
    }
    const wRoll = roll(5);
    const iRoll = 0, cRoll = 0;
    const statusRolls = { W: wRoll, F: 1, I: iRoll, C: cRoll };
    return { rolls, statusRolls, totalStats };
  }

  function reroll(statKey) {
    if (char.rerolls >= char.rerollLimit) return;
    if (!char.statsRolled) return;
    const hw = HOMEWORLDS[char.homeworldId];
    const isStatus = STATUS_KEYS.includes(statKey);
    if (isStatus && statKey === "W") {
      const orig = char.statusRolls.W;
      const newRoll = roll(5);
      const kept = newRoll > orig;
      update(prev => ({
        ...prev,
        statusRolls: { ...prev.statusRolls, W: kept ? newRoll : orig },
        rerolls: prev.rerolls + 1,
        lastReroll: { stat: "Max Wounds", kept, orig, newVal: newRoll },
      }));
    } else if (!isStatus) {
      const [d1, d2] = char.rolls[statKey];
      const origSum = d1 + d2;
      const n1 = roll(7) + 3, n2 = roll(7) + 3;
      const newSum = n1 + n2;
      const kept = newSum > origSum;
      update(prev => ({
        ...prev,
        rolls: { ...prev.rolls, [statKey]: kept ? [n1, n2] : [d1, d2] },
        rerolls: prev.rerolls + 1,
        lastReroll: { stat: statKey, kept, orig: origSum, origRolls: [d1, d2], newVal: newSum, newRolls: [n1, n2] },
      }));
    }
  }

  function randomizeAll() {
    if (!char.homeworldId) {
      const hwId = weightedRoll([15, 19, 20, 10, 11, 10, 10, 5]);
      selectHomeworld(hwId);
    } else {
      selectHomeworld(char.homeworldId);
    }
  }

  const hw = char.homeworldId ? HOMEWORLDS[char.homeworldId] : null;
  const careerData = char.career ? CAREERS[char.career] : null;
  const divination = char.divIndex >= 0 ? DIVINATIONS[char.divIndex] : null;
  const sanctName = char.sanctIndex >= 0 ? SANCTIONING[char.sanctIndex] : null;

  const statColors = (total) => {
    if (total >= 35) return "#6ee7b7";
    if (total <= 25) return "#f87171";
    return "#e2d5b0";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0804", color: "#c8b89a", fontFamily: "'Cinzel', serif", position: "relative", overflow: "hidden" }}>
      {/* Background texture */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(139,90,43,0.03) 40px, rgba(139,90,43,0.03) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(139,90,43,0.03) 40px, rgba(139,90,43,0.03) 41px)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(180,120,40,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cinzel+Decorative:wght@700&family=IM+Fell+English&display=swap');
        * { box-sizing: border-box; }
        select { background: #1a1208; color: #c8b89a; border: 1px solid #5a3e1b; padding: 6px 10px; font-family: 'IM Fell English', serif; font-size: 13px; cursor: pointer; outline: none; border-radius: 0; appearance: none; -webkit-appearance: none; }
        select:hover { border-color: #a07030; }
        button { background: linear-gradient(180deg, #3a2510 0%, #1e1208 100%); color: #c8b89a; border: 1px solid #5a3e1b; padding: 6px 14px; font-family: 'Cinzel', serif; font-size: 11px; letter-spacing: 1px; cursor: pointer; transition: all 0.2s; border-radius: 0; }
        button:hover { border-color: #c09040; color: #f0d890; background: linear-gradient(180deg, #5a3510 0%, #2e1e08 100%); }
        .section { border: 1px solid #3a2510; background: rgba(15, 10, 4, 0.85); margin-bottom: 16px; position: relative; }
        .section::before { content: ''; position: absolute; inset: 3px; border: 1px solid rgba(90,62,27,0.3); pointer-events: none; }
        .section-title { background: linear-gradient(90deg, #2a1808, #1a1005, #2a1808); border-bottom: 1px solid #3a2510; padding: 8px 20px; font-family: 'Cinzel Decorative', serif; font-size: 11px; letter-spacing: 3px; color: #a07030; text-transform: uppercase; display: flex; align-items: center; gap: 10px; }
        .section-title::before, .section-title::after { content: '—'; color: #5a3e1b; }
        .stat-row { display: grid; grid-template-columns: 130px 40px 40px 70px 50px 50px 65px; gap: 4px; align-items: center; padding: 5px 12px; border-bottom: 1px solid rgba(58,37,16,0.4); cursor: pointer; transition: background 0.15s; }
        .stat-row:hover { background: rgba(90,62,27,0.2); }
        .stat-row.rerolled-kept { background: rgba(70,140,70,0.15) !important; }
        .stat-row.rerolled-fail { background: rgba(140,50,50,0.15) !important; }
        .col-head { font-size: 9px; letter-spacing: 2px; color: #6a5030; text-transform: uppercase; }
        .stat-name { font-family: 'IM Fell English', serif; font-size: 13px; color: #a89070; }
        .stat-val { font-family: 'Cinzel', serif; font-size: 14px; text-align: center; }
        .stat-total { font-family: 'Cinzel', serif; font-size: 15px; font-weight: 600; text-align: center; }
        .info-row { display: flex; gap: 8px; padding: 6px 12px; border-bottom: 1px solid rgba(58,37,16,0.3); align-items: flex-start; }
        .info-label { font-size: 10px; letter-spacing: 2px; color: #6a5030; text-transform: uppercase; min-width: 80px; padding-top: 2px; }
        .info-value { font-family: 'IM Fell English', serif; font-size: 13px; color: #c8b89a; line-height: 1.5; }
        .divination-text { font-family: 'IM Fell English', serif; font-style: italic; font-size: 14px; color: #b8a070; line-height: 1.5; }
        .summary-card { border: 1px solid #3a2510; background: rgba(20,12,4,0.9); padding: 16px 20px; margin-bottom: 16px; display: flex; gap: 32px; align-items: center; flex-wrap: wrap; }
        .summary-name { font-family: 'Cinzel Decorative', serif; font-size: 22px; color: #d4a850; letter-spacing: 2px; }
        .summary-sub { font-family: 'IM Fell English', serif; font-size: 13px; color: #8a7050; }
        .badge { border: 1px solid #4a3010; background: rgba(90,62,27,0.2); padding: 3px 10px; font-size: 10px; letter-spacing: 2px; color: #9a7840; display: inline-block; margin: 2px; }
        .aquila { color: #6a5030; font-size: 18px; margin: 0 4px; }
        .reroll-info { padding: 10px 16px; background: rgba(20,12,4,0.6); border-top: 1px solid #2a1808; font-family: 'IM Fell English', serif; font-size: 12px; color: #7a6040; }
        .reroll-info.fail { color: #c05050; }
        .reroll-info.kept { color: #50a050; }
        select option { background: #1a1208; }
      `}</style>
	
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px", position: "relative", zIndex: 1 }}>
        {/* BACK BUTTON */}
		<div style={{ marginBottom: 16 }}>
			<button onClick={() => onNavigate("home")}>← Back to Main Menu</button>
		</div>
		{/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: 32, borderBottom: "1px solid #3a2510", paddingBottom: 20 }}>
          <div style={{ fontFamily: "'Cinzel Decorative', serif", fontSize: 28, color: "#c09040", letterSpacing: 6, marginBottom: 4 }}>DARK HERESY</div>
          <div style={{ fontFamily: "'IM Fell English', serif", fontSize: 14, color: "#6a5030", letterSpacing: 4 }}>CHARACTER GENERATION DOSSIER</div>
          <div style={{ marginTop: 8, fontSize: 11, color: "#3a2810", letterSpacing: 2, fontFamily: "Cinzel" }}>INQUISITION USE ONLY ✦ CLEARANCE: VERMILLION</div>
        </div>

        {/* SUMMARY CARD */}
        {char.statsRolled && (
          <div className="summary-card">
            <div>
              <div className="summary-name">{char.name || "—"}</div>
              <div className="summary-sub">{char.gender} · {hw?.name} · {char.career}</div>
              {char.background && <div className="summary-sub">Background: {char.background}</div>}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {char.age > 0 && <span className="badge">Age {char.age}</span>}
              {char.heightDisplay && <span className="badge">{char.heightDisplay}</span>}
              {char.weightKg > 0 && <span className="badge">{char.weightLb}lb / {char.weightKg}kg</span>}
              {divination && <span className="badge">Div. Bonus</span>}
              {sanctName && <span className="badge">Sanctioned</span>}
            </div>
          </div>
        )}

        {/* ORIGIN */}
        <div className="section">
          <div className="section-title">I. Origin</div>
          <div style={{ padding: "14px 16px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <select value={char.homeworldId || -1} onChange={e => { const v = parseInt(e.target.value); if (v > 0) selectHomeworld(v); }} style={{ minWidth: 200 }}>
              <option value={-1}>— Select an Origin —</option>
              {Object.entries(HOMEWORLDS).map(([id, hw]) => <option key={id} value={id}>{hw.name}</option>)}
            </select>
            <button onClick={randomizeAll}>✦ Randomize Everything</button>
            {hw && char.homeworldId && (
              <>
                <select value={char.background} onChange={e => update({ background: e.target.value })} style={{ minWidth: 180 }}>
                  <option value="">— {hw.label3} —</option>
                  {hw.backgrounds.map(b => <option key={b}>{b}</option>)}
                </select>
                {hw.superstitions.length > 0 && (
                  <select value={char.superstition} onChange={e => update({ superstition: e.target.value })} style={{ minWidth: 160 }}>
                    <option value="">— Superstition —</option>
                    {hw.superstitions.map(s => <option key={s}>{s}</option>)}
                  </select>
                )}
              </>
            )}
          </div>
          {hw && (
            <>
              <div className="info-row"><span className="info-label">Traits</span><span className="info-value">{hw.traits}</span></div>
              <div className="info-row"><span className="info-label">Skills</span><span className="info-value">{hw.skills}</span></div>
              {hw.talents && <div className="info-row"><span className="info-label">Talents</span><span className="info-value">{hw.talents}</span></div>}
            </>
          )}
        </div>

        {/* CHARACTERISTICS */}
        {char.statsRolled && (
          <div className="section">
            <div className="section-title">II. Characteristics & Status</div>
            <div style={{ padding: "10px 12px 4px", overflowX:"auto"			}}>
			<div style={{minWidth: "520px"}}>
              {/* Header */}
              <div className="stat-row" style={{ cursor: "default" }}>
                <span className="col-head">Characteristic</span>
                <span className="col-head" style={{ textAlign: "center" }}>D10</span>
                <span className="col-head" style={{ textAlign: "center" }}>D10</span>
                <span className="col-head" style={{ textAlign: "center" }}>Origin</span>
                <span className="col-head" style={{ textAlign: "center" }}>Divin.</span>
                <span className="col-head" style={{ textAlign: "center" }}>Sanct.</span>
                <span className="col-head" style={{ textAlign: "center" }}>Total</span>
              </div>
              {STAT_KEYS.map(k => {
                const s = stats[k];
                if (!s) return null;
                const isRerolled = char.lastReroll?.stat === k;
                const rowClass = `stat-row${isRerolled ? (char.lastReroll.kept ? " rerolled-kept" : " rerolled-fail") : ""}`;
                const names = { WS: "Weapon Skill", BS: "Ballistics Skill", S: "Strength", T: "Toughness", Ag: "Agility", Int: "Intelligence", Per: "Perception", WP: "Willpower", Fel: "Fellowship" };
                return (
                  <div key={k} className={rowClass} onClick={() => reroll(k)} title={char.rerolls < char.rerollLimit ? "Click to reroll" : "No rerolls left"}>
                    <span className="stat-name">{names[k]}</span>
                    <span className="stat-val" style={{ color: s.d1 === 10 ? "#f0c040" : "#8a7050" }}>{s.d1}</span>
                    <span className="stat-val" style={{ color: s.d2 === 10 ? "#f0c040" : "#8a7050" }}>{s.d2}</span>
                    <span className="stat-val" style={{ color: "#6a8060" }}>{s.base}</span>
                    <span className="stat-val" style={{ color: s.div ? "#a07030" : "#3a2810" }}>{s.div || "—"}</span>
                    <span className="stat-val" style={{ color: s.san ? "#6070a0" : "#3a2810" }}>{s.san || "—"}</span>
                    <span className="stat-total" style={{ color: statColors(s.total) }}>{s.total}</span>
                  </div>
                );
              })}
			</div>

              {/* Status */}
              <div style={{ marginTop: 12, borderTop: "1px solid #2a1808", paddingTop: 8 }}>
                <div className="stat-row" style={{ cursor: "default", gridTemplateColumns: "130px 40px 70px 50px 50px 65px" }}>
                  <span className="col-head">Status</span>
                  <span className="col-head" style={{ textAlign: "center" }}>D5</span>
                  <span className="col-head" style={{ textAlign: "center" }}>Origin</span>
                  <span className="col-head" style={{ textAlign: "center" }}>Divin.</span>
                  <span className="col-head" style={{ textAlign: "center" }}>Sanct.</span>
                  <span className="col-head" style={{ textAlign: "center" }}>Total</span>
                </div>
                {[["W","Max Wounds"],["F","Fate Points"],["I","Insanity"],["C","Corruption"]].map(([k, label]) => {
                  const s = stats[k];
                  if (!s) return null;
                  return (
                    <div key={k} className={`stat-row${char.lastReroll?.stat === "Max Wounds" && k === "W" ? (char.lastReroll.kept ? " rerolled-kept" : " rerolled-fail") : ""}`}
                      style={{ gridTemplateColumns: "130px 40px 70px 50px 50px 65px" }}
                      onClick={() => k === "W" && reroll("W")}
                      title={k === "W" ? "Click to reroll" : ""}>
                      <span className="stat-name">{label}</span>
                      <span className="stat-val" style={{ color: s.roll === 5 ? "#f0c040" : "#8a7050" }}>{s.roll}</span>
                      <span className="stat-val" style={{ color: "#6a8060" }}>{s.base}</span>
                      <span className="stat-val" style={{ color: s.div ? "#a07030" : "#3a2810" }}>{s.div || "—"}</span>
                      <span className="stat-val" style={{ color: s.san ? "#6070a0" : "#3a2810" }}>{s.san || "—"}</span>
                      <span className="stat-total" style={{ color: "#c8b89a" }}>{s.total}</span>
                    </div>
                  );
                })}
			  </div>
			 
              <div style={{ padding: "8px 12px", display: "flex", gap: 12, alignItems: "center", borderTop: "1px solid #2a1808", marginTop: 8 }}>
                <button onClick={() => selectHomeworld(char.homeworldId)}>✦ Reroll All Stats</button>
                <span style={{ fontSize: 11, color: "#5a4020", fontFamily: "'IM Fell English', serif" }}>
                  Rerolls used: {char.rerolls}/{char.rerollLimit} · Click a row to attempt reroll (kept only if higher)
                </span>
              </div>
              {char.lastReroll && (
                <div className={`reroll-info ${char.lastReroll.kept ? "kept" : "fail"}`}>
                  {char.lastReroll.kept
                    ? `✓ Rerolled ${char.lastReroll.stat}: new rolls [${char.lastReroll.newRolls?.join(", ") || char.lastReroll.newVal}] beat original [${char.lastReroll.origRolls?.join(", ") || char.lastReroll.orig}]`
                    : `✗ Rerolled ${char.lastReroll.stat}: new value [${char.lastReroll.newRolls?.join(", ") || char.lastReroll.newVal}] did not exceed original [${char.lastReroll.origRolls?.join(", ") || char.lastReroll.orig}]. Original kept.`
                  }
                </div>
              )}
            </div>
          </div>
        )}

        {/* CHARACTER INFO */}
        {char.statsRolled && (
          <div className="section">
            <div className="section-title">III. Personal Record</div>
            <div style={{ padding: "10px 0" }}>
              <div className="info-row" style={{ alignItems: "center", gap: 12 }}>
                <span className="info-label">Name</span>
                <span className="info-value" style={{ fontSize: 16, color: "#d4a850", fontFamily: "'Cinzel', serif" }}>{char.name}</span>
                <button onClick={() => update(prev => ({ ...prev, name: generateName(prev.gender, hw?.nameSet || "") }))}>⟳ New Name</button>
              </div>
              <div className="info-row" style={{ alignItems: "center", gap: 12 }}>
                <span className="info-label">Gender</span>
                <span className="info-value">{char.gender}</span>
                <button onClick={() => {
                  const g = char.gender === "Male" ? "Female" : "Male";
                  update(prev => ({ ...prev, gender: g, name: generateName(g, hw?.nameSet || "") }));
                }}>⟳ Switch</button>
              </div>
              <div className="info-row">
                <span className="info-label">Build</span>
                <span className="info-value">{char.heightDisplay} · {char.weightLb}lb / {char.weightKg}kg</span>
              </div>
              <div className="info-row">
                <span className="info-label">Age</span>
                <span className="info-value">{char.age}{char.sanctIndex >= 0 ? ` (+ ${char.sanctYears} years sanctioning = ${char.age + char.sanctYears})` : ""}</span>
              </div>
            </div>
          </div>
        )}

        {/* DIVINATION */}
        {char.statsRolled && (
          <div className="section">
            <div className="section-title">IV. Divination</div>
            <div style={{ padding: "14px 20px" }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
                <select value={char.divIndex} onChange={e => update({ divIndex: parseInt(e.target.value) })} style={{ minWidth: 280 }}>
                  <option value={-1}>— Select a Divination —</option>
                  {DIVINATIONS.map((d, i) => <option key={i} value={i}>{d.text.substring(0, 60)}{d.text.length > 60 ? "…" : ""}</option>)}
                </select>
                <button onClick={() => update({ divIndex: rollDivination() })}>✦ Random</button>
              </div>
              {divination && (
                <>
                  <div className="divination-text">"{divination.text}"</div>
                  {Object.keys(divination.effect).length > 0 && (
                    <div style={{ marginTop: 8, fontSize: 12, color: "#a07030" }}>
                      Bonus: {Object.entries(divination.effect).map(([k, v]) => `${k} +${v}`).join(", ")}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* CAREER */}
        {char.statsRolled && (
          <div className="section">
            <div className="section-title">V. Career Path</div>
            <div style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", borderBottom: "1px solid #2a1808" }}>
              <select value={char.career} onChange={e => update({ career: e.target.value })} style={{ minWidth: 200 }}>
                <option value="">— Select Career —</option>
                {(hw ? ((char.gender === "Female" && hw.careersF) ? hw.careersF : hw.careers) : []).map(c => <option key={c}>{c}</option>)}
              </select>
              <button onClick={() => {
                const careers = (char.gender === "Female" && hw?.careersF) ? hw.careersF : hw?.careers || [];
                const wts = (char.gender === "Female" && hw?.randomWeightsF) ? hw.randomWeightsF : hw?.randomWeights || [];
                const idx = weightedRoll(wts) - 1;
                update({ career: careers[Math.min(idx, careers.length - 1)] || careers[0] });
              }}>✦ Random</button>
              {char.career === "Imperial Psyker" && (
                <>
                  <select value={char.sanctIndex} onChange={e => {
                    const si = parseInt(e.target.value);
                    const sy = roll(si === 1 ? 10 : 5);
                    update({ sanctIndex: si, sanctYears: sy });
                  }} style={{ minWidth: 220 }}>
                    <option value={-1}>— Sanctioning —</option>
                    {SANCTIONING.map((s, i) => <option key={i} value={i}>{s}</option>)}
                  </select>
                  <button onClick={() => {
                    const n = rand(100);
                    let si = 0;
                    for (let i = 0; i < SANCTIONING_WEIGHTS.length; i++) { if (n < SANCTIONING_WEIGHTS[i]) { si = i; break; } }
                    const sy = roll(si === 1 ? 10 : 5);
                    update({ sanctIndex: si, sanctYears: sy });
                  }}>✦ Random</button>
                  {sanctName && <span style={{ fontSize: 12, color: "#8070a0", fontFamily: "'IM Fell English', serif" }}>{sanctName} · {char.sanctYears} years</span>}
                </>
              )}
            </div>
            {careerData && (
              <div style={{ padding: "4px 0" }}>
                <div className="info-row"><span className="info-label">Skills</span><span className="info-value">{careerData.skills}</span></div>
                <div className="info-row"><span className="info-label">Talents</span><span className="info-value">{careerData.talents}</span></div>
                <div className="info-row"><span className="info-label">Gear</span><span className="info-value">{careerData.gear}</span></div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "16px 0", fontSize: 10, color: "#2a1808", letterSpacing: 3, fontFamily: "Cinzel" }}>
          ✦ IN THE GRIM DARKNESS OF THE FAR FUTURE, THERE IS ONLY WAR ✦
        </div>
      </div>
    </div>
  );
}
