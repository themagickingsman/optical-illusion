export interface AfricanArtifact {
    id: string;
    name: string;
    origin: {
        name: string; // Original Location / Kingdom
        lat: number;
        lng: number;
    };
    current_location: {
        museum: string;
        city: string;
        country: string;
        lat: number; // Lat of the museum
        lng: number; // Lng of the museum
    };
    year_taken?: string;
    status: 'Stolen' | 'Contested' | 'Returned' | 'Loaned';
    description: string;
    image_url?: string;
    iconType?: 'bowl' | 'staff' | 'axe' | 'beads' | 'gold' | 'mask' | 'sculpture' | 'text' | 'jewelry' | 'tool';
    linkedSiteId?: string; // ID of the UNESCO site this artifact belongs to
}

export const AFRICAN_ARTIFACTS: AfricanArtifact[] = [
    {
        id: 'ART-001',
        name: 'Benin Bronzes (Plaques & Heads)',
        origin: {
            name: 'Kingdom of Benin (Nigeria)',
            lat: 6.3320, // Corrected from 6.3350 (Palace of the Oba)
            lng: 5.6202  // Corrected from 5.6037
        },
        current_location: {
            museum: 'British Museum',
            city: 'London',
            country: 'United Kingdom',
            lat: 51.5194,
            lng: -0.1270
        },
        year_taken: '1897',
        status: 'Contested',
        description: 'Thousands of metal plaques and sculptures looted by British forces during the Benin Expedition of 1897.',
        iconType: 'sculpture',
        linkedSiteId: 'AF-012' // Linked loosely to Djenne/Mali region for trade route context, or NULL if precise site not in list. Benin City not currently in UNESCO list above, so we might need to add it or link to closest. For now, let's add Benin City or leave unlinked and use spatial. But user asked for click on locations.
    },
    // Adding specific items linked to the UNESCO sites we have
    {
        id: 'ART-ZIM-01',
        name: 'Great Zimbabwe Bird',
        origin: {
            name: 'Great Zimbabwe',
            lat: -20.273,
            lng: 30.934
        },
        current_location: {
            museum: 'Groote Schuur',
            city: 'Cape Town',
            country: 'South Africa',
            lat: -33.95,
            lng: 18.46
        },
        year_taken: '1889',
        status: 'Contested',
        description: 'Soapstone bird carving, a national emblem of Zimbabwe, taken by Cecil Rhodes.',
        iconType: 'sculpture',
        linkedSiteId: 'AF-001'
    },
    {
        id: 'ART-ZIM-02',
        name: 'Gold Beads of Mapungubwe',
        origin: {
            name: 'Mapungubwe',
            lat: -22.2500,
            lng: 29.3833
        },
        current_location: {
            museum: 'University of Pretoria',
            city: 'Pretoria',
            country: 'South Africa',
            lat: -25.7545,
            lng: 28.2314
        },
        year_taken: '1930s',
        status: 'Loaned',
        description: 'Delicate gold beads and rhino figures from the royal graves.',
        iconType: 'gold',
        linkedSiteId: 'AF-016'
    },
    {
        id: 'ART-ETH-01',
        name: 'Tabots of Lalibela',
        origin: {
            name: 'Lalibela',
            lat: 12.0331,
            lng: 39.0472
        },
        current_location: {
            museum: 'British Museum',
            city: 'London',
            country: 'United Kingdom',
            lat: 51.5194,
            lng: -0.1270
        },
        year_taken: '1868',
        status: 'Stolen',
        description: 'Sacred altar tablets looted after the Battle of Maqdala.',
        iconType: 'text',
        linkedSiteId: 'AF-002'
    },
    {
        id: 'ART-EGY-01',
        name: 'Rosetta Stone',
        origin: {
            name: 'Rashid (Egypt)',
            lat: 31.4044,
            lng: 30.4183
        },
        current_location: {
            museum: 'British Museum',
            city: 'London',
            country: 'United Kingdom',
            lat: 51.5194,
            lng: -0.1270
        },
        year_taken: '1801',
        status: 'Contested',
        description: 'Key to deciphering Egyptian hieroglyphs.',
        iconType: 'text',
        linkedSiteId: 'AF-008' // Loose link to Memphis/Giza region
    },
    {
        id: 'ART-EGY-02',
        name: 'Nefertiti Bust',
        origin: {
            name: 'Amarna',
            lat: 27.6444,
            lng: 30.9022
        },
        current_location: {
            museum: 'Neues Museum',
            city: 'Berlin',
            country: 'Germany',
            lat: 52.5201,
            lng: 13.3976
        },
        year_taken: '1913',
        status: 'Contested',
        description: 'Limestone bust of Nefertiti.',
        iconType: 'sculpture',
        linkedSiteId: 'AF-008' // Loose link to Memphis region
    },
    {
        id: 'ART-GHA-01',
        name: 'Asante Gold Soul-Washer Badge',
        origin: {
            name: 'Kumasi',
            lat: 6.6885,
            lng: -1.6244
        },
        current_location: {
            museum: 'British Museum',
            city: 'London',
            country: 'United Kingdom',
            lat: 51.5194,
            lng: -0.1270
        },
        year_taken: '1874',
        status: 'Stolen',
        description: 'Gold disc worn by officials purifying the king\'s soul.',
        iconType: 'gold',
        linkedSiteId: 'AF-012' // Linked to West African trade hubs (Djenne)
    },
    {
        id: 'ART-MAL-01',
        name: 'Djenne Terracotta Horseman',
        origin: {
            name: 'Djenne',
            lat: 13.9060,
            lng: -4.5530
        },
        current_location: {
            museum: 'Louvre',
            city: 'Paris',
            country: 'France',
            lat: 48.8606,
            lng: 2.3376
        },
        year_taken: '1900s',
        status: 'Stolen',
        description: 'Terracotta figure representing the Mali Empire cavalry.',
        iconType: 'sculpture',
        linkedSiteId: 'AF-012'
    },
    // --- NEWLY ADDED FROM BRITISH MUSEUM COLLECTION ---
    {
        id: 'ART-ETH-02',
        name: 'Maqdala Processional Cross',
        origin: {
            name: 'Maqdala (Ethiopia)',
            lat: 11.5500, // Corrected from 11.4500 (Fortress Plateau)
            lng: 39.2833  // Corrected from 39.1333
        },
        current_location: {
            museum: 'British Museum',
            city: 'London',
            country: 'United Kingdom',
            lat: 51.5194,
            lng: -0.1270
        },
        year_taken: '1868',
        status: 'Stolen',
        description: 'Intricate silver and gold processional cross looted from Emperor Tewodros II\'s fortress.',
        iconType: 'gold',
        linkedSiteId: 'AF-002' // Linked to Lalibela region
    },
    {
        id: 'ART-ETH-03',
        name: 'Royal Wedding Dress of Queen Woyzero Terunesh',
        origin: {
            name: 'Maqdala (Ethiopia)',
            lat: 11.4500,
            lng: 39.1333
        },
        current_location: {
            museum: 'British Museum',
            city: 'London',
            country: 'United Kingdom',
            lat: 51.5194,
            lng: -0.1270
        },
        year_taken: '1868',
        status: 'Stolen',
        description: 'Silk dress belonging to the Queen, taken after the siege of Maqdala.',
        iconType: 'text', // Representing textile
        linkedSiteId: 'AF-002'
    },
    {
        id: 'ART-GHA-02',
        name: 'Asante Gold Lute-Harp (Sankuo)',
        origin: {
            name: 'Kumasi (Ghana)',
            lat: 6.6885,
            lng: -1.6244
        },
        current_location: {
            museum: 'British Museum',
            city: 'London',
            country: 'United Kingdom',
            lat: 51.5194,
            lng: -0.1270
        },
        year_taken: '1817',
        status: 'Loaned',
        description: 'Gold-ornamented harp presented to a British diplomat. Recently loaned back to Ghana.',
        iconType: 'gold',
        linkedSiteId: 'AF-012'
    },
    {
        id: 'ART-GHA-03',
        name: 'Asante Gold Weights (Antelope & Bird)',
        origin: {
            name: 'Kumasi',
            lat: 6.6885,
            lng: -1.6244
        },
        current_location: {
            museum: 'British Museum',
            city: 'London',
            country: 'United Kingdom',
            lat: 51.5194,
            lng: -0.1270
        },
        year_taken: '1895',
        status: 'Stolen',
        description: 'Brass weights for measuring gold dust, including "Sankofa" birds and antelopes.',
        iconType: 'sculpture',
        linkedSiteId: 'AF-012'
    },
    {
        id: 'ART-NIG-02',
        name: 'Queen Idia Mask (Ivory)',
        origin: {
            name: 'Kingdom of Benin',
            lat: 6.3350,
            lng: 5.6037
        },
        current_location: {
            museum: 'British Museum',
            city: 'London',
            country: 'United Kingdom',
            lat: 51.5194,
            lng: -0.1270
        },
        year_taken: '1897',
        status: 'Contested',
        description: 'Celebrated ivory pendant mask of the Queen Mother Idia. One of the most famous African artworks.',
        iconType: 'mask',
        linkedSiteId: 'AF-012' // Linked loosely to Djenne/Mali/West Africa region
    },
    {
        id: 'ART-NIG-03',
        name: 'Benin Brass Plaque: The Palace',
        origin: {
            name: 'Kingdom of Benin',
            lat: 6.3350,
            lng: 5.6037
        },
        current_location: {
            museum: 'British Museum',
            city: 'London',
            country: 'United Kingdom',
            lat: 51.5194,
            lng: -0.1270
        },
        year_taken: '1897',
        status: 'Contested',
        description: 'Relief plaque depicting the Oba\'s palace with turreted roof and python.',
        iconType: 'sculpture',
        linkedSiteId: 'AF-012'
    }
];
