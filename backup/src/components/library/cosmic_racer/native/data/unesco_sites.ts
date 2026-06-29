export interface UNESCOSite {
    id: string;
    name: string;
    location: string; // Country
    type: 'Cultural' | 'Natural' | 'Mixed';
    lat: number;
    lng: number;
    description: string;
    dateInscribed?: number;
}

export const UNESCO_SITES: UNESCOSite[] = [
    // --- AFRICAN SITES ---
    {
        id: 'AF-001',
        name: 'Great Zimbabwe National Monument',
        location: 'Zimbabwe',
        type: 'Cultural',
        lat: -20.273,
        lng: 30.934,
        description: 'The capital of the Queen of Sheba, according to age-old legend, Great Zimbabwe is a unique testimony to the Bantu civilization of the Shona between the 11th and 15th centuries.',
        dateInscribed: 1986
    },
    {
        id: 'AF-002',
        name: 'Rock-Hewn Churches, Lalibela',
        location: 'Ethiopia',
        type: 'Cultural',
        lat: 12.0331,
        lng: 39.0472,
        description: 'The 11 medieval monolithic cave churches of this 13th-century "New Jerusalem" are situated in a mountainous region in the heart of Ethiopia.',
        dateInscribed: 1978
    },
    {
        id: 'AF-003',
        name: 'Tassili n\'Ajjer',
        location: 'Algeria',
        type: 'Mixed',
        lat: 25.5000,
        lng: 9.0000,
        description: 'A vast plateau in south-east Algeria with one of the most important groupings of prehistoric cave art in the world.',
        dateInscribed: 1982
    },
    {
        id: 'AF-004',
        name: 'Mosi-oa-Tunya / Victoria Falls',
        location: 'Zambia / Zimbabwe',
        type: 'Natural',
        lat: -17.9244,
        lng: 25.8567,
        description: 'These falls are among the most spectacular waterfalls in the world. The Zambezi River, which is more than 2 km wide at this point, plunges noisily down a series of basalt gorges.',
        dateInscribed: 1989
    },
    {
        id: 'AF-005',
        name: 'Robben Island',
        location: 'South Africa',
        type: 'Cultural',
        lat: -33.8067,
        lng: 18.3667,
        description: 'Robben Island was used at various times between the 17th and 20th centuries as a prison, a hospital for socially unacceptable groups and a military base.',
        dateInscribed: 1999
    },
    {
        id: 'AF-006',
        name: 'Ruins of Kilwa Kisiwani and Ruins of Songo Mnara',
        location: 'Tanzania',
        type: 'Cultural',
        lat: -8.9606,
        lng: 39.5126,
        description: 'The remains of two great East African ports admired by early European explorers are situated on two small islands near the coast.',
        dateInscribed: 1981
    },
    {
        id: 'AF-007',
        name: 'Island of Mozambique',
        location: 'Mozambique',
        type: 'Cultural',
        lat: -15.0356,
        lng: 40.7356,
        description: 'The fortified city of Mozambique is located on this island, a former Portuguese trading-post on the route to India.',
        dateInscribed: 1991
    },
    {
        id: 'AF-008',
        name: 'Memphis and its Necropolis – the Pyramid Fields from Giza to Dahshur',
        location: 'Egypt',
        type: 'Cultural',
        lat: 29.9792,
        lng: 31.1342,
        description: 'The capital of the Old Kingdom of Egypt has some extraordinary funerary monuments, including rock tombs, ornate mastabas, temples and pyramids.',
        dateInscribed: 1979
    },
    {
        id: 'AF-009',
        name: 'Cliff of Bandiagara (Land of the Dogons)',
        location: 'Mali',
        type: 'Mixed',
        lat: 14.3400,
        lng: -3.4500,
        description: 'The Bandiagara site is an outstanding landscape of cliffs and sandy plateaux with some beautiful architecture.',
        dateInscribed: 1989
    },
    {
        id: 'AF-010',
        name: 'Okavango Delta',
        location: 'Botswana',
        type: 'Natural',
        lat: -19.0000,
        lng: 23.0000,
        description: 'This delta in north-west Botswana comprises permanent marshlands and seasonally flooded plains.',
        dateInscribed: 2014
    },
    {
        id: 'AF-011',
        name: 'Timbuktu',
        location: 'Mali',
        type: 'Cultural',
        lat: 16.7666,
        lng: -3.0026,
        description: 'Home of the prestigious Koranic Sankore University and other madrasas, Timbuktu was an intellectual and spiritual capital.',
        dateInscribed: 1988
    },
    {
        id: 'AF-012',
        name: 'Old Towns of Djenné',
        location: 'Mali',
        type: 'Cultural',
        lat: 13.9060,
        lng: -4.5530,
        description: 'Inhabited since 250 B.C., Great Mosque of Djenné is the largest mud brick building in the world.',
        dateInscribed: 1988
    },
    {
        id: 'AF-013',
        name: 'Cradle of Humankind (Fossil Hominid Sites)',
        location: 'South Africa',
        type: 'Cultural',
        lat: -25.9667,
        lng: 27.8667,
        description: 'Contains a complex of limestone caves with a vast number of hominid fossils.',
        dateInscribed: 1999
    },
    {
        id: 'AF-014',
        name: 'Lake Malawi National Park',
        location: 'Malawi',
        type: 'Natural',
        lat: -14.0333,
        lng: 34.8833,
        description: 'Located at the southern end of the great expanse of Lake Malawi, with deep waters and mountain background.',
        dateInscribed: 1984
    },
    {
        id: 'AF-015',
        name: 'Kunta Kinteh Island and Related Sites',
        location: 'Gambia',
        type: 'Cultural',
        lat: 13.3167,
        lng: -16.3667,
        description: 'James Island and related sites present a testimony to the main periods and facets of the encounter between Africa and Europe.',
        dateInscribed: 2003
    },
    {
        id: 'AF-016',
        name: 'Mapungubwe Cultural Landscape',
        location: 'South Africa',
        type: 'Cultural',
        lat: -22.2500,
        lng: 29.3833,
        description: 'Mapungubwe developed into the largest kingdom in the sub-continent before it was abandoned in the 14th century.',
        dateInscribed: 2003
    },
    {
        id: 'AF-017',
        name: 'Stone Town of Zanzibar',
        location: 'Tanzania',
        type: 'Cultural',
        lat: -6.1633,
        lng: 39.1894,
        description: 'A fine example of the Swahili coastal trading towns of East Africa.',
        dateInscribed: 2000
    },
    {
        id: 'AF-018',
        name: 'Nubian Monuments from Abu Simbel to Philae',
        location: 'Egypt',
        type: 'Cultural',
        lat: 22.3369,
        lng: 31.6256,
        description: 'The "Open Air Museum of Nubia". Magnificent monuments carved out of the mountain.',
        dateInscribed: 1979
    },
    {
        id: 'AF-019',
        name: 'Archaeological Site of Carthage',
        location: 'Tunisia',
        type: 'Cultural',
        lat: 36.8566,
        lng: 10.3278,
        description: 'Founded in the 9th century B.C. on the Gulf of Tunis, Carthage grew into a massive trading empire.',
        dateInscribed: 1979
    },
    {
        id: 'AF-020',
        name: 'Richtersveld Cultural and Botanical Landscape',
        location: 'South Africa',
        type: 'Mixed',
        lat: -28.6000,
        lng: 17.2000,
        description: 'The extensive communal grazed lands are a testimony to the Nama people.',
        dateInscribed: 2007
    },

    // --- GLOBAL REFERENCE POINTS ---
    {
        id: 'GL-001',
        name: 'Machu Picchu',
        location: 'Peru',
        type: 'Cultural',
        lat: -13.1631,
        lng: -72.5450,
        description: 'Incan citadel set high in the Andes Mountains in Peru.',
        dateInscribed: 1983
    },
    {
        id: 'GL-002',
        name: 'Angkor',
        location: 'Cambodia',
        type: 'Cultural',
        lat: 13.4125,
        lng: 103.8667,
        description: 'One of the most important archaeological sites in South-East Asia. Contains the magnificent remains of the different capitals of the Khmer Empire.',
        dateInscribed: 1992
    },
    {
        id: 'GL-003',
        name: 'Stonehenge, Avebury and Associated Sites',
        location: 'United Kingdom',
        type: 'Cultural',
        lat: 51.1789,
        lng: -1.8262,
        description: 'The most famous megalithic monument in the world.',
        dateInscribed: 1986
    }
];
