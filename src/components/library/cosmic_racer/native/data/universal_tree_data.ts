export interface CareerStep {
    levelName: string; // Atomic, DNA, RNA, Tissue, Organ, Self-Aware, Galactic
    levelIndex: number; // 1-7
    title: string;
    description: string;
    archetypeHero: string;
}

export interface District {
    id: number;
    name: string;
    coreDesire: string;
    discipline: string;
    biologicalArchetype: string;
    personalityArchetype: string;
    tribe: string;
    apostle: string;
    zodiac: string;
    element: string;
    mbti: string;
    careerEvolution: CareerStep[];
}

export const UNIVERSAL_TREE_DATA: District[] = [
    {
        id: 1,
        name: "Justice District",
        coreDesire: "Protection, fairness",
        discipline: "Law & Governance",
        biologicalArchetype: "Integumentary System",
        personalityArchetype: "Trailblazer (Initiator)",
        tribe: "Reuben",
        apostle: "Peter",
        zodiac: "Aries",
        element: "Fire",
        mbti: "ENTJ, ESTP",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Laws 101", description: "Understanding basic rules.", archetypeHero: "Solon" },
            { levelName: "DNA", levelIndex: 2, title: "Legal Frameworks", description: "Learning the structure of law.", archetypeHero: "Hammurabi" },
            { levelName: "RNA", levelIndex: 3, title: "Case Analysis", description: "Interpreting legal logic.", archetypeHero: "Thurgood Marshall" },
            { levelName: "Tissue", levelIndex: 4, title: "Intersectional Justice", description: "Applying law to complex systems.", archetypeHero: "RBG" },
            { levelName: "Organ", levelIndex: 5, title: "Trial Simulation", description: "Mastering the courtroom.", archetypeHero: "Cicero" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Ethical Jurisprudence", description: "Defining the morality of law.", archetypeHero: "MLK Jr." },
            { levelName: "Galactic", levelIndex: 7, title: "Constitutional Reform", description: "Reshaping the foundations of justice.", archetypeHero: "Mandela" }
        ]
    },
    {
        id: 2,
        name: "Community",
        coreDesire: "Stability, belonging",
        discipline: "Social Science & Economics",
        biologicalArchetype: "Endocrine System",
        personalityArchetype: "Grounded Builder",
        tribe: "Simeon",
        apostle: "Andrew",
        zodiac: "Taurus",
        element: "Earth",
        mbti: "ISFJ, ESTJ",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Social Roles 101", description: "Basics of interaction.", archetypeHero: "Village Elder" },
            { levelName: "DNA", levelIndex: 2, title: "Cultural Systems", description: "Patterns of behavior.", archetypeHero: "Jane Addams" },
            { levelName: "RNA", levelIndex: 3, title: "Conflict Resolution", description: "Mediating differences.", archetypeHero: "Desmond Tutu" },
            { levelName: "Tissue", levelIndex: 4, title: "Cross-Community Alliances", description: "Bridging groups.", archetypeHero: "Fred Rogers" },
            { levelName: "Organ", levelIndex: 5, title: "Urban Planning", description: "Designing for people.", archetypeHero: "Octavia Butler" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Social Architecture", description: "Building society structures.", archetypeHero: "Mother Teresa" },
            { levelName: "Galactic", levelIndex: 7, title: "Global Synthesis", description: "Unifying humanity.", archetypeHero: "The Buddha" }
        ]
    },
    {
        id: 3,
        name: "Communications", // Note: Mapped to "Science" in user table? No, user table has Science as District 3, checking carefully. NO, Display is "Science & Research" at #6. User table row 3 is "Communications District". Wait, User table row 3 is "Communications District" but row 3 in my previous data was "Communications". Let's stick to the user's provided image rows which align with my previous structure generally. Wait, looking at image: 1. Justice, 2. Community, 3. Science (Wait, Row 3 says Science?? No. Wait. Let me re-read the image text carefully.)
        // Image Trace:
        // 1 Justice
        // 2 Community
        // 3 Science (Text in image says "Science" at row 3? No, let me read the row headers from the image text provided in prompt.)
        // Prompt text "progression_system_02_04_archetypes": Row 3 is "Science". 
        // BUT the earlier "universal_knowledge_tree_04" image had Row 3 "Communications District" and Row 6 "Science & Research".
        // There is a conflict between the two images provided by user.
        // I will stick to the FIRST image ("universal_knowledge_tree_04") for the District IDs/Names as that is the master list (1-13). 
        // The second image "progression_system_02_04_archetypes" seems to list specific examples but skips or reorders.
        // Let's try to map the provided examples in "progression_system..." to the correct ID from "universal_tree...".
        // Progression Image has: Justice, Community, Science, Arts, Exploration, Wellness, Diplomacy, Transformation, Strategy, Innovation, Unity. (11 items).
        // My Master List has 13. 
        // I will map "Science" from Progression to ID 6 (Science & Research).
        // I will map "Communications" (ID 3) - using generic logic if missing in 2nd image or inferring.
        // Let's check text again: The prompt text block starting "progression_system..." has: Justice, Community, Science, Arts, Exploration, Wellness, Diplomacy, Transformation, Strategy, Innovation, Unity.
        // It's missing Communications (ID 3) and Unity Hub (ID 13) specifically in the example text block, or maybe "Science" is actually ID 6. 
        // I will implement the 11 from the text and infer the missing 2 based on the pattern "Atomic -> Galactic".

        // ID 3: Communications (Not in "progression" text, will generate pattern)
        coreDesire: "Connection, ideas",
        discipline: "Information Science & Computing",
        biologicalArchetype: "Immune System",
        personalityArchetype: "Connector",
        tribe: "Levi",
        apostle: "James (Zebedee)",
        zodiac: "Gemini",
        element: "Air",
        mbti: "ENTP, ENFP",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Signals 101", description: "Basic transmission.", archetypeHero: "Town Crier" },
            { levelName: "DNA", levelIndex: 2, title: "Language Systems", description: "Grammar of thought.", archetypeHero: "Shakespeare" },
            { levelName: "RNA", levelIndex: 3, title: "Media Logic", description: "Structure of stories.", archetypeHero: "Orson Welles" },
            { levelName: "Tissue", levelIndex: 4, title: "Network Integration", description: "Connecting points.", archetypeHero: "Tim Berners-Lee" },
            { levelName: "Organ", levelIndex: 5, title: "Mass Communication", description: "Broadcasting truth.", archetypeHero: "Oprah" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Meme Engineering", description: "Shaping culture.", archetypeHero: "McLuhan" },
            { levelName: "Galactic", levelIndex: 7, title: "Universal Translator", description: "Unifying understanding.", archetypeHero: "Hermes" }
        ]
    },
    {
        id: 4,
        name: "Wellness", // Mapped from "Wellness" in progression text
        coreDesire: "Health, emotional safety",
        discipline: "Biology & Biochemistry",
        biologicalArchetype: "Digestive System",
        personalityArchetype: "Heart Guardian",
        tribe: "Judah",
        apostle: "John",
        zodiac: "Cancer",
        element: "Water",
        mbti: "ESFJ, ISFP",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Anatomy 101", description: "Body basics.", archetypeHero: "Herbalist" },
            { levelName: "DNA", levelIndex: 2, title: "Diagnostic Systems", description: "Identifying root causes.", archetypeHero: "Hippocrates" },
            { levelName: "RNA", levelIndex: 3, title: "Treatment Logic", description: "Pathways to cure.", archetypeHero: "Nightingale" },
            { levelName: "Tissue", levelIndex: 4, title: "Integrative Medicine", description: "Holistic health.", archetypeHero: "Mayo" },
            { levelName: "Organ", levelIndex: 5, title: "Surgery Simulations", description: "Precise intervention.", archetypeHero: "Sushruta" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Healer Ethics", description: "Spirit of care.", archetypeHero: "Paul Farmer" },
            { levelName: "Galactic", levelIndex: 7, title: "Public Health", description: "Wellness for all.", archetypeHero: "WHO Founders" }
        ]
    },
    {
        id: 5,
        name: "Arts",
        coreDesire: "Creativity, legacy",
        discipline: "Humanities & Philosophy",
        biologicalArchetype: "Reproductive System",
        personalityArchetype: "Creative Expression",
        tribe: "Dan",
        apostle: "Philip",
        zodiac: "Leo",
        element: "Fire",
        mbti: "ENFJ, ESFP",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Color Theory", description: "Foundations of sight.", archetypeHero: "Cave Painter" },
            { levelName: "DNA", levelIndex: 2, title: "Composition Rules", description: "Structure of beauty.", archetypeHero: "Da Vinci" },
            { levelName: "RNA", levelIndex: 3, title: "Symbolism", description: "Meaning in form.", archetypeHero: "Picasso" },
            { levelName: "Tissue", levelIndex: 4, title: "Mixed-Media Fusion", description: "Combining elements.", archetypeHero: "O'Keeffe" },
            { levelName: "Organ", levelIndex: 5, title: "Portfolio Review", description: "Mastering the collection.", archetypeHero: "Mozart" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Art as Activism", description: "Moving the soul.", archetypeHero: "Frida Kahlo" },
            { levelName: "Galactic", levelIndex: 7, title: "Cultural Movements", description: "Shaping the zeitgeist.", archetypeHero: "Bowie" }
        ]
    },
    {
        id: 6,
        name: "Science & Research", // Mapped to "Science" in progression text
        coreDesire: "Order, improvement",
        discipline: "Mathematics & Logic",
        biologicalArchetype: "Musculoskeletal System",
        personalityArchetype: "Meticulous Synthesizer",
        tribe: "Naphtali",
        apostle: "Bartholomew",
        zodiac: "Virgo",
        element: "Earth",
        mbti: "ISTJ, INTJ",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Scientific Method", description: "How to question.", archetypeHero: "Curie" },
            { levelName: "DNA", levelIndex: 2, title: "Lab Protocols", description: "Safety and precision.", archetypeHero: "Newton" },
            { levelName: "RNA", levelIndex: 3, title: "Data Analysis", description: "Meaning from numbers.", archetypeHero: "Feynman" },
            { levelName: "Tissue", levelIndex: 4, title: "Interdisciplinary Research", description: "Connecting fields.", archetypeHero: "Darwin" },
            { levelName: "Organ", levelIndex: 5, title: "Peer Review", description: "Validating truth.", archetypeHero: "Einstein" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Philosophy of Science", description: "Ethics of knowing.", archetypeHero: "Hypatia" },
            { levelName: "Galactic", levelIndex: 7, title: "Paradigm Breakthroughs", description: "New reality.", archetypeHero: "Sagan" }
        ]
    },
    {
        id: 7,
        name: "Diplomacy",
        coreDesire: "Harmony, mediation",
        discipline: "Social Science & Economics",
        biologicalArchetype: "Endocrine System",
        personalityArchetype: "Balancer",
        tribe: "Gad",
        apostle: "Matthew",
        zodiac: "Libra",
        element: "Air",
        mbti: "INFP, ISFP",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Power 101", description: "Understanding influence.", archetypeHero: "Messenger" },
            { levelName: "DNA", levelIndex: 2, title: "Treaty Systems", description: "Codifying agreements.", archetypeHero: "Metternich" },
            { levelName: "RNA", levelIndex: 3, title: "Negotiation Logic", description: "Finding the win-win.", archetypeHero: "Kissinger" },
            { levelName: "Tissue", levelIndex: 4, title: "Geopolitical Webs", description: "Global systems.", archetypeHero: "Hammarskjöld" },
            { levelName: "Organ", levelIndex: 5, title: "Crisis Mediation", description: "Solving immediate conflict.", archetypeHero: "Talleyrand" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Cosmopolitan Ethics", description: "Universal citizenship.", archetypeHero: "Gandhi" },
            { levelName: "Galactic", levelIndex: 7, title: "UN 2.0", description: "Interplanetary peace.", archetypeHero: "Kofi Annan" }
        ]
    },
    {
        id: 8,
        name: "Transformation",
        coreDesire: "Depth, change",
        discipline: "Chemistry & Material Science",
        biologicalArchetype: "Respiratory System",
        personalityArchetype: "Insightful Transformer",
        tribe: "Asher",
        apostle: "Thomas",
        zodiac: "Scorpio",
        element: "Water",
        mbti: "INFJ, INTJ",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Materials 101", description: "Nature of matter.", archetypeHero: "Blacksmith" },
            { levelName: "DNA", levelIndex: 2, title: "Chemical Systems", description: "Reactions and bonds.", archetypeHero: "Mendeleev" },
            { levelName: "RNA", levelIndex: 3, title: "Reaction Logic", description: "Predicting change.", archetypeHero: "Haber" },
            { levelName: "Tissue", levelIndex: 4, title: "Bioengineering", description: "Life as material.", archetypeHero: "Tesla" },
            { levelName: "Organ", levelIndex: 5, title: "Nanotech Fabrication", description: "Building at scale.", archetypeHero: "Jobs" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Ethical Creation", description: "Moral making.", archetypeHero: "Lovelace" },
            { levelName: "Galactic", levelIndex: 7, title: "Post-Scarcity", description: "Abundance for all.", archetypeHero: "Fuller" }
        ]
    },
    {
        id: 9,
        name: "Exploration",
        coreDesire: "Discovery, wisdom",
        discipline: "Systems & Cybernetics",
        biologicalArchetype: "Nervous System",
        personalityArchetype: "Visionary Explorer",
        tribe: "Issachar",
        apostle: "James (Alphaeus)",
        zodiac: "Sagittarius",
        element: "Fire",
        mbti: "ENFP, INTP",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Map Reading", description: "Orienting thyself.", archetypeHero: "Nomad" },
            { levelName: "DNA", levelIndex: 2, title: "Navigation Systems", description: "Tools of travel.", archetypeHero: "Zheng He" },
            { levelName: "RNA", levelIndex: 3, title: "Risk Assessment", description: "Calculating danger.", archetypeHero: "Sacagawea" },
            { levelName: "Tissue", levelIndex: 4, title: "Expedition Planning", description: "Logistics of the unknown.", archetypeHero: "Cousteau" },
            { levelName: "Organ", levelIndex: 5, title: "Survival Challenges", description: "Endurance test.", archetypeHero: "Shackleton" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Ethical Exploration", description: "Respecting the new.", archetypeHero: "Norgay/Hillary" },
            { levelName: "Galactic", levelIndex: 7, title: "Interstellar Missions", description: "Beyond the star.", archetypeHero: "Elon Musk" }
        ]
    },
    {
        id: 10,
        name: "Strategy",
        coreDesire: "Long-term planning",
        discipline: "Physics & Engineering",
        biologicalArchetype: "Circulatory System",
        personalityArchetype: "Strategic Achiever",
        tribe: "Zebulun",
        apostle: "Simon the Zealot",
        zodiac: "Capricorn",
        element: "Earth",
        mbti: "ESTJ, ENTJ",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Chess 101", description: "Rules of the game.", archetypeHero: "Go Player" },
            { levelName: "DNA", levelIndex: 2, title: "Game Theory", description: "Predicting opponents.", archetypeHero: "Sun Tzu" },
            { levelName: "RNA", levelIndex: 3, title: "Algorithmic Logic", description: "Code of conduct.", archetypeHero: "von Neumann" },
            { levelName: "Tissue", levelIndex: 4, title: "Grand Strategy", description: "Big picture integration.", archetypeHero: "Clausewitz" },
            { levelName: "Organ", levelIndex: 5, title: "War Games", description: "Simulation and testing.", archetypeHero: "Patton" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Moral Strategy", description: "Winning right.", archetypeHero: "Eisenhower" },
            { levelName: "Galactic", levelIndex: 7, title: "Civilizational Design", description: "Architecting eras.", archetypeHero: "Asimov" }
        ]
    },
    {
        id: 11,
        name: "Innovation",
        coreDesire: "Progress, futurism",
        discipline: "Information Science & Computing",
        biologicalArchetype: "Immune System",
        personalityArchetype: "Innovative Futurist",
        tribe: "Joseph/Ephraim",
        apostle: "Jude/Thaddeus",
        zodiac: "Aquarius",
        element: "Air",
        mbti: "INTP, ENTP",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Prototyping 101", description: "Fail fast.", archetypeHero: "Tinkerer" },
            { levelName: "DNA", levelIndex: 2, title: "Tech Systems", description: "Hardware/Software.", archetypeHero: "Edison" },
            { levelName: "RNA", levelIndex: 3, title: "Debugging Logic", description: "Solving the glitch.", archetypeHero: "Hopper" },
            { levelName: "Tissue", levelIndex: 4, title: "Cross-Tech Fusion", description: "Combinatorial power.", archetypeHero: "Musk" },
            { levelName: "Organ", levelIndex: 5, title: "Patent Drafting", description: "Protecting ideas.", archetypeHero: "Turing" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Innovation Ethics", description: "Responsible creation.", archetypeHero: "Ada Lovelace" },
            { levelName: "Galactic", levelIndex: 7, title: "Singularity", description: "Beyond human limit.", archetypeHero: "Vinge" }
        ]
    },
    {
        id: 12,
        name: "Unity",
        coreDesire: "Wholeness, empathy",
        discipline: "Education & Culture",
        biologicalArchetype: "Lymphatic System",
        personalityArchetype: "Universal Empath",
        tribe: "Benjamin",
        apostle: "Matthias",
        zodiac: "Pisces",
        element: "Water",
        mbti: "INFP, INFJ",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Empathy 101", description: "Feeling the other.", archetypeHero: "Storyteller" },
            { levelName: "DNA", levelIndex: 2, title: "Group Dynamics", description: "Flow of the many.", archetypeHero: "Laozi" },
            { levelName: "RNA", levelIndex: 3, title: "Dialectic Logic", description: "Synthesis of opposites.", archetypeHero: "Rumi" },
            { levelName: "Tissue", levelIndex: 4, title: "Interfaith Dialogue", description: "Bridging beliefs.", archetypeHero: "Teilhard" },
            { levelName: "Organ", levelIndex: 5, title: "Community Healing", description: "Restoring the bond.", archetypeHero: "Hildegard" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Metaphysical Synthesis", description: "One truth.", archetypeHero: "Dogen" },
            { levelName: "Galactic", levelIndex: 7, title: "Collective Tech", description: "The Noosphere.", archetypeHero: "The Christ" }
        ]
    },
    {
        id: 13,
        name: "Unity Hub",
        coreDesire: "Integration, growth",
        discipline: "All Disciplines",
        biologicalArchetype: "Whole Body",
        personalityArchetype: "The Integrator",
        tribe: "All / Unity",
        apostle: "Unity / Christ",
        zodiac: "Spirit/Ether",
        element: "Ether",
        mbti: "ENFJ, INFJ",
        careerEvolution: [
            { levelName: "Atomic", levelIndex: 1, title: "Curiosity", description: "The spark of learning.", archetypeHero: "The Child" },
            { levelName: "DNA", levelIndex: 2, title: "Fundamentals", description: "Building blocks of all.", archetypeHero: "Aristotle" },
            { levelName: "RNA", levelIndex: 3, title: "Connections", description: "Seeing the web.", archetypeHero: "Da Vinci" },
            { levelName: "Tissue", levelIndex: 4, title: "Holism", description: "The sum is greater.", archetypeHero: "Buckminster Fuller" },
            { levelName: "Organ", levelIndex: 5, title: "Systemic Design", description: "Architecture of life.", archetypeHero: "Montessori" },
            { levelName: "Self-Aware", levelIndex: 6, title: "Consciousness Studies", description: "Knowing the knower.", archetypeHero: "Jung" },
            { levelName: "Galactic", levelIndex: 7, title: "Universal Mind", description: "One thought.", archetypeHero: "Logos" }
        ]
    }
];
