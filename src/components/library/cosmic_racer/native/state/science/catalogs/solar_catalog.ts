import { SolarSystemBody } from '../recursion_levels';

export const SOLAR_SYSTEM_CATALOG: SolarSystemBody[] = [
    // ── PLANETS ──
    { name: 'Mercury', semi_major_axis_au: 0.387099, type: 'Planet', diameter_km: 4879, source: 'IAU', color: '#b5b5b5' },
    { name: 'Venus', semi_major_axis_au: 0.723332, type: 'Planet', diameter_km: 12104, source: 'IAU', color: '#e8cda0' },
    { name: 'Earth', semi_major_axis_au: 1.000000, type: 'Planet', diameter_km: 12742, source: 'IAU', color: '#4b9cd3' },
    { name: 'Mars', semi_major_axis_au: 1.523662, type: 'Planet', diameter_km: 6779, source: 'IAU', color: '#c1440e' },
    { name: 'Jupiter', semi_major_axis_au: 5.203363, type: 'Planet', diameter_km: 139820, source: 'IAU', color: '#c88b3a' },
    { name: 'Saturn', semi_major_axis_au: 9.537070, type: 'Planet', diameter_km: 116460, source: 'IAU', color: '#e4d191' },
    { name: 'Uranus', semi_major_axis_au: 19.191264, type: 'Planet', diameter_km: 50724, source: 'IAU', color: '#7de8e8' },
    { name: 'Neptune', semi_major_axis_au: 30.068963, type: 'Planet', diameter_km: 49244, source: 'IAU', color: '#4b70dd' },

    // ── DWARF PLANETS ──
    { name: 'Ceres', semi_major_axis_au: 2.768, type: 'Dwarf Planet', discoverer: 'Piazzi', year_discovered: 1801, diameter_km: 939, source: 'IAU', color: '#a0998a' },
    { name: 'Pluto', semi_major_axis_au: 39.482, type: 'Dwarf Planet', discoverer: 'Tombaugh', year_discovered: 1930, diameter_km: 2377, source: 'IAU', color: '#c9a97a' },
    { name: 'Haumea', semi_major_axis_au: 43.218, type: 'Dwarf Planet', discoverer: 'Brown', year_discovered: 2004, diameter_km: 1560, source: 'IAU', color: '#e0dacf' },
    { name: 'Makemake', semi_major_axis_au: 45.430, type: 'Dwarf Planet', discoverer: 'Brown', year_discovered: 2005, diameter_km: 1430, source: 'IAU', color: '#d4846a' },
    { name: 'Eris', semi_major_axis_au: 67.864, type: 'Dwarf Planet', discoverer: 'Brown', year_discovered: 2005, diameter_km: 2326, source: 'IAU', color: '#d0cac3' },

    // ── MAJOR ASTEROIDS (Main Belt) ──
    { name: 'Vesta', semi_major_axis_au: 2.362, type: 'Asteroid', discoverer: 'Olbers', year_discovered: 1807, diameter_km: 525, source: 'JPL' },
    { name: 'Pallas', semi_major_axis_au: 2.773, type: 'Asteroid', discoverer: 'Olbers', year_discovered: 1802, diameter_km: 512, source: 'JPL' },
    { name: 'Juno', semi_major_axis_au: 2.670, type: 'Asteroid', discoverer: 'Harding', year_discovered: 1804, diameter_km: 234, source: 'JPL' },
    { name: 'Hygiea', semi_major_axis_au: 3.142, type: 'Asteroid', discoverer: 'De Gasparis', year_discovered: 1849, diameter_km: 434, source: 'JPL' },
    { name: 'Davida', semi_major_axis_au: 3.167, type: 'Asteroid', discoverer: 'Dugan', year_discovered: 1903, diameter_km: 326, source: 'JPL' },
    { name: 'Interamnia', semi_major_axis_au: 3.064, type: 'Asteroid', discoverer: 'Cerulli', year_discovered: 1910, diameter_km: 332, source: 'JPL' },
    { name: 'Europa (asteroid)', semi_major_axis_au: 3.095, type: 'Asteroid', discoverer: 'Goldschmidt', year_discovered: 1858, diameter_km: 315, source: 'JPL' },
    { name: 'Sylvia', semi_major_axis_au: 3.490, type: 'Asteroid', discoverer: 'Pogson', year_discovered: 1866, diameter_km: 286, source: 'JPL' },
    { name: 'Cybele', semi_major_axis_au: 3.433, type: 'Asteroid', discoverer: 'Tempel', year_discovered: 1861, diameter_km: 273, source: 'JPL' },
    { name: 'Eunomia', semi_major_axis_au: 2.644, type: 'Asteroid', discoverer: 'De Gasparis', year_discovered: 1851, diameter_km: 268, source: 'JPL' },
    { name: 'Psyche', semi_major_axis_au: 2.922, type: 'Asteroid', discoverer: 'De Gasparis', year_discovered: 1852, diameter_km: 226, source: 'JPL' },
    { name: 'Thisbe', semi_major_axis_au: 2.767, type: 'Asteroid', discoverer: 'De Gasparis', year_discovered: 1852, diameter_km: 232, source: 'JPL' },
    { name: 'Bamberga', semi_major_axis_au: 2.681, type: 'Asteroid', discoverer: 'Palisa', year_discovered: 1892, diameter_km: 229, source: 'JPL' },
    { name: 'Patientia', semi_major_axis_au: 3.062, type: 'Asteroid', discoverer: 'Charlois', year_discovered: 1899, diameter_km: 225, source: 'JPL' },
    { name: 'Herculina', semi_major_axis_au: 2.772, type: 'Asteroid', discoverer: 'Peters', year_discovered: 1904, diameter_km: 222, source: 'JPL' },
    { name: 'Doris', semi_major_axis_au: 3.110, type: 'Asteroid', discoverer: 'Goldschmidt', year_discovered: 1857, diameter_km: 222, source: 'JPL' },
    { name: 'Camilla', semi_major_axis_au: 3.490, type: 'Asteroid', discoverer: 'Pogson', year_discovered: 1868, diameter_km: 254, source: 'JPL' },
    { name: 'Euphrosyne', semi_major_axis_au: 3.155, type: 'Asteroid', discoverer: 'Ferguson', year_discovered: 1854, diameter_km: 268, source: 'JPL' },
    { name: 'Flora', semi_major_axis_au: 2.202, type: 'Asteroid', discoverer: 'Hind', year_discovered: 1847, diameter_km: 147, source: 'JPL' },
    { name: 'Metis', semi_major_axis_au: 2.386, type: 'Asteroid', discoverer: 'Graham', year_discovered: 1848, diameter_km: 190, source: 'JPL' },
    { name: 'Iris', semi_major_axis_au: 2.386, type: 'Asteroid', discoverer: 'Hind', year_discovered: 1847, diameter_km: 200, source: 'JPL' },
    { name: 'Hebe', semi_major_axis_au: 2.426, type: 'Asteroid', discoverer: 'Hencke', year_discovered: 1847, diameter_km: 186, source: 'JPL' },
    { name: 'Astraea', semi_major_axis_au: 2.574, type: 'Asteroid', discoverer: 'Hencke', year_discovered: 1845, diameter_km: 119, source: 'JPL' },
    { name: 'Melpomene', semi_major_axis_au: 2.296, type: 'Asteroid', discoverer: 'Hind', year_discovered: 1852, diameter_km: 141, source: 'JPL' },
    { name: 'Fortuna', semi_major_axis_au: 2.442, type: 'Asteroid', discoverer: 'Hind', year_discovered: 1852, diameter_km: 225, source: 'JPL' },
    { name: 'Massalia', semi_major_axis_au: 2.409, type: 'Asteroid', discoverer: 'De Gasparis', year_discovered: 1852, diameter_km: 145, source: 'JPL' },
    { name: 'Lutetia', semi_major_axis_au: 2.435, type: 'Asteroid', discoverer: 'Goldschmidt', year_discovered: 1852, diameter_km: 120, source: 'JPL' },
    { name: 'Kalliope', semi_major_axis_au: 2.910, type: 'Asteroid', discoverer: 'Hind', year_discovered: 1852, diameter_km: 166, source: 'JPL' },
    { name: 'Thalia', semi_major_axis_au: 2.627, type: 'Asteroid', discoverer: 'Hind', year_discovered: 1852, diameter_km: 107, source: 'JPL' },
    { name: 'Themis', semi_major_axis_au: 3.135, type: 'Asteroid', discoverer: 'De Gasparis', year_discovered: 1853, diameter_km: 198, source: 'JPL' },
    { name: 'Daphne', semi_major_axis_au: 2.762, type: 'Asteroid', discoverer: 'Goldschmidt', year_discovered: 1856, diameter_km: 187, source: 'JPL' },
    { name: 'Egeria', semi_major_axis_au: 2.576, type: 'Asteroid', discoverer: 'De Gasparis', year_discovered: 1850, diameter_km: 208, source: 'JPL' },
    { name: 'Alauda', semi_major_axis_au: 3.195, type: 'Asteroid', discoverer: 'De Gasparis', year_discovered: 1858, diameter_km: 195, source: 'JPL' },
    { name: 'Palma', semi_major_axis_au: 3.148, type: 'Asteroid', discoverer: 'Goldschmidt', year_discovered: 1860, diameter_km: 189, source: 'JPL' },
    { name: 'Hermione', semi_major_axis_au: 3.438, type: 'Asteroid', discoverer: 'Peters', year_discovered: 1872, diameter_km: 210, source: 'JPL' },
    { name: 'Aurora', semi_major_axis_au: 3.164, type: 'Asteroid', discoverer: 'Goldschmidt', year_discovered: 1857, diameter_km: 205, source: 'JPL' },
    { name: 'Bertha', semi_major_axis_au: 3.200, type: 'Asteroid', discoverer: 'Prosper-Henry', year_discovered: 1875, diameter_km: 184, source: 'JPL' },
    { name: 'Winchester', semi_major_axis_au: 3.412, type: 'Asteroid', discoverer: 'Adams', year_discovered: 1890, diameter_km: 172, source: 'JPL' },
    { name: 'Elektra', semi_major_axis_au: 3.124, type: 'Asteroid', discoverer: 'Peters', year_discovered: 1873, diameter_km: 181, source: 'JPL' },
    { name: 'Amphitrite', semi_major_axis_au: 2.554, type: 'Asteroid', discoverer: 'Marth', year_discovered: 1854, diameter_km: 212, source: 'JPL' },

    // ── NEAR-EARTH / INNER BELT ──
    { name: 'Eros', semi_major_axis_au: 1.458, type: 'Asteroid', discoverer: 'Witt', year_discovered: 1898, diameter_km: 17, source: 'JPL' },
    { name: 'Gaspra', semi_major_axis_au: 2.210, type: 'Asteroid', discoverer: 'Neujmin', year_discovered: 1916, diameter_km: 12, source: 'JPL' },
    { name: 'Ida', semi_major_axis_au: 2.862, type: 'Asteroid', discoverer: 'Palisa', year_discovered: 1884, diameter_km: 32, source: 'JPL' },
    { name: 'Mathilde', semi_major_axis_au: 2.646, type: 'Asteroid', discoverer: 'Palisa', year_discovered: 1885, diameter_km: 53, source: 'JPL' },
    { name: 'Itokawa', semi_major_axis_au: 1.324, type: 'Asteroid', discoverer: 'LINEAR', year_discovered: 1998, diameter_km: 0.33, source: 'JPL' },
    { name: 'Bennu', semi_major_axis_au: 1.126, type: 'Asteroid', discoverer: 'LINEAR', year_discovered: 1999, diameter_km: 0.49, source: 'JPL' },
    { name: 'Ryugu', semi_major_axis_au: 1.190, type: 'Asteroid', discoverer: 'LINEAR', year_discovered: 1999, diameter_km: 0.87, source: 'JPL' },
    { name: 'Apophis', semi_major_axis_au: 0.922, type: 'Asteroid', discoverer: 'Tucker', year_discovered: 2004, diameter_km: 0.37, source: 'JPL' },

    // ── OUTER BELT / HILDAS ──
    { name: 'Hilda', semi_major_axis_au: 3.975, type: 'Asteroid', discoverer: 'Palisa', year_discovered: 1875, diameter_km: 171, source: 'JPL' },
    { name: 'Thule', semi_major_axis_au: 4.269, type: 'Asteroid', discoverer: 'Palisa', year_discovered: 1888, diameter_km: 127, source: 'MPC' },

    // ── JUPITER TROJANS ──
    { name: 'Hektor', semi_major_axis_au: 5.240, type: 'Trojan', discoverer: 'Kopff', year_discovered: 1907, diameter_km: 225, source: 'MPC' },
    { name: 'Patroclus', semi_major_axis_au: 5.218, type: 'Trojan', discoverer: 'Kopff', year_discovered: 1906, diameter_km: 140, source: 'MPC' },
    { name: 'Achilles', semi_major_axis_au: 5.312, type: 'Trojan', discoverer: 'Wolf', year_discovered: 1906, diameter_km: 130, source: 'MPC' },
    { name: 'Agamemnon', semi_major_axis_au: 5.168, type: 'Trojan', discoverer: 'Reinmuth', year_discovered: 1929, diameter_km: 167, source: 'MPC' },
    { name: 'Diomedes', semi_major_axis_au: 5.111, type: 'Trojan', discoverer: 'Reinmuth', year_discovered: 1937, diameter_km: 164, source: 'MPC' },

    // ── CENTAURS ──
    { name: 'Chiron', semi_major_axis_au: 13.708, type: 'Centaur', discoverer: 'Kowal', year_discovered: 1977, diameter_km: 218, source: 'MPC' },
    { name: 'Chariklo', semi_major_axis_au: 15.871, type: 'Centaur', discoverer: 'Spacewatch', year_discovered: 1997, diameter_km: 248, source: 'MPC' },
    { name: 'Pholus', semi_major_axis_au: 20.350, type: 'Centaur', discoverer: 'Rabinowitz', year_discovered: 1992, diameter_km: 185, source: 'MPC' },
    { name: 'Nessus', semi_major_axis_au: 24.600, type: 'Centaur', discoverer: 'Spacewatch', year_discovered: 1993, diameter_km: 60, source: 'MPC' },
    { name: 'Asbolus', semi_major_axis_au: 18.048, type: 'Centaur', discoverer: 'Spacewatch', year_discovered: 1995, diameter_km: 84, source: 'MPC' },
    { name: 'Thereus', semi_major_axis_au: 10.610, type: 'Centaur', discoverer: 'Spacewatch', year_discovered: 2001, diameter_km: 62, source: 'MPC' },
    { name: 'Okyrhoe', semi_major_axis_au: 8.380, type: 'Centaur', discoverer: 'Spacewatch', year_discovered: 1998, diameter_km: 52, source: 'MPC' },
    { name: 'Crantor', semi_major_axis_au: 26.130, type: 'Centaur', discoverer: 'Spacewatch', year_discovered: 2002, diameter_km: 70, source: 'MPC' },
    { name: 'Bienor', semi_major_axis_au: 16.540, type: 'Centaur', discoverer: 'Spacewatch', year_discovered: 2000, diameter_km: 198, source: 'MPC' },
    { name: 'Hylonome', semi_major_axis_au: 24.977, type: 'Centaur', discoverer: 'Mauna Kea', year_discovered: 1995, diameter_km: 70, source: 'MPC' },
    { name: 'Echeclus', semi_major_axis_au: 10.700, type: 'Centaur', discoverer: 'Spacewatch', year_discovered: 2000, diameter_km: 64, source: 'MPC' },
    { name: 'Pelion', semi_major_axis_au: 20.080, type: 'Centaur', discoverer: 'Spacewatch', year_discovered: 1998, diameter_km: 42, source: 'MPC' },
    { name: 'Cyllarus', semi_major_axis_au: 26.310, type: 'Centaur', discoverer: 'Spacewatch', year_discovered: 1998, diameter_km: 50, source: 'MPC' },
    { name: 'Elatus', semi_major_axis_au: 11.770, type: 'Centaur', discoverer: 'Spacewatch', year_discovered: 1999, diameter_km: 46, source: 'MPC' },
    { name: 'Amycus', semi_major_axis_au: 24.980, type: 'Centaur', discoverer: 'NEAT', year_discovered: 2002, diameter_km: 76, source: 'MPC' },

    // ── TRANS-NEPTUNIAN OBJECTS (TNOs) ──
    { name: 'Orcus', semi_major_axis_au: 39.420, type: 'TNO', discoverer: 'Brown', year_discovered: 2004, diameter_km: 910, source: 'MPC' },
    { name: 'Quaoar', semi_major_axis_au: 43.694, type: 'TNO', discoverer: 'Brown', year_discovered: 2002, diameter_km: 1110, source: 'MPC' },
    { name: 'Sedna', semi_major_axis_au: 506.2, type: 'TNO', discoverer: 'Brown', year_discovered: 2003, diameter_km: 995, source: 'MPC' },
    { name: 'Gonggong', semi_major_axis_au: 67.380, type: 'TNO', discoverer: 'Schwamb', year_discovered: 2007, diameter_km: 1230, source: 'MPC' },
    { name: 'Varuna', semi_major_axis_au: 43.129, type: 'TNO', discoverer: 'Spacewatch', year_discovered: 2000, diameter_km: 687, source: 'MPC' },
    { name: 'Ixion', semi_major_axis_au: 39.680, type: 'TNO', discoverer: 'DES', year_discovered: 2001, diameter_km: 617, source: 'MPC' },
    { name: 'Huya', semi_major_axis_au: 39.750, type: 'TNO', discoverer: 'Ferrin', year_discovered: 2000, diameter_km: 406, source: 'MPC' },
    { name: 'Salacia', semi_major_axis_au: 42.180, type: 'TNO', discoverer: 'Sheppard', year_discovered: 2004, diameter_km: 854, source: 'MPC' },
    { name: 'Varda', semi_major_axis_au: 46.110, type: 'TNO', discoverer: 'Schwamb', year_discovered: 2003, diameter_km: 740, source: 'MPC' },
    { name: 'Altjira', semi_major_axis_au: 44.110, type: 'TNO', discoverer: 'DES', year_discovered: 2001, diameter_km: 340, source: 'MPC' },
    { name: 'Borasisi', semi_major_axis_au: 43.970, type: 'TNO', discoverer: 'DES', year_discovered: 1999, diameter_km: 163, source: 'MPC' },
    { name: 'Chaos', semi_major_axis_au: 45.930, type: 'TNO', discoverer: 'DES', year_discovered: 1998, diameter_km: 600, source: 'MPC' },
    { name: 'Deucalion', semi_major_axis_au: 41.990, type: 'TNO', discoverer: 'Jewitt', year_discovered: 1999, diameter_km: 200, source: 'MPC' },
    { name: 'Rhadamanthus', semi_major_axis_au: 43.620, type: 'TNO', discoverer: 'DES', year_discovered: 1999, diameter_km: 200, source: 'MPC' },
    { name: 'Teharonhiawako', semi_major_axis_au: 44.150, type: 'TNO', discoverer: 'DES', year_discovered: 2001, diameter_km: 176, source: 'MPC' },

    // ── SCATTERED DISC ──
    { name: 'Typhon', semi_major_axis_au: 37.620, type: 'TNO', discoverer: 'NEAT', year_discovered: 2002, diameter_km: 162, source: 'MPC' },
    { name: 'Ceto', semi_major_axis_au: 101.900, type: 'TNO', discoverer: 'NEAT', year_discovered: 2003, diameter_km: 174, source: 'MPC' },
    { name: 'Lempo', semi_major_axis_au: 30.680, type: 'TNO', discoverer: 'Jewitt', year_discovered: 1999, diameter_km: 272, source: 'MPC' },

    // ── MOONS (Orbital radius from parent planet, in AU) ──
    // Earth
    { name: 'Moon', semi_major_axis_au: 0.00257, type: 'Moon', diameter_km: 3474, source: 'IAU' },

    // Mars
    { name: 'Phobos', semi_major_axis_au: 0.0000627, type: 'Moon', discoverer: 'Hall', year_discovered: 1877, diameter_km: 22, source: 'IAU' },
    { name: 'Deimos', semi_major_axis_au: 0.000157, type: 'Moon', discoverer: 'Hall', year_discovered: 1877, diameter_km: 12, source: 'IAU' },

    // Jupiter (Galilean + major inner)
    { name: 'Io', semi_major_axis_au: 0.00282, type: 'Moon', discoverer: 'Galileo', year_discovered: 1610, diameter_km: 3643, source: 'IAU' },
    { name: 'Europa', semi_major_axis_au: 0.00449, type: 'Moon', discoverer: 'Galileo', year_discovered: 1610, diameter_km: 3122, source: 'IAU' },
    { name: 'Ganymede', semi_major_axis_au: 0.00716, type: 'Moon', discoverer: 'Galileo', year_discovered: 1610, diameter_km: 5268, source: 'IAU' },
    { name: 'Callisto', semi_major_axis_au: 0.01259, type: 'Moon', discoverer: 'Galileo', year_discovered: 1610, diameter_km: 4821, source: 'IAU' },
    { name: 'Amalthea', semi_major_axis_au: 0.00121, type: 'Moon', discoverer: 'Barnard', year_discovered: 1892, diameter_km: 167, source: 'JPL' },
    { name: 'Himalia', semi_major_axis_au: 0.0765, type: 'Moon', discoverer: 'Perrine', year_discovered: 1904, diameter_km: 170, source: 'JPL' },

    // Saturn
    { name: 'Mimas', semi_major_axis_au: 0.00124, type: 'Moon', discoverer: 'Herschel', year_discovered: 1789, diameter_km: 396, source: 'IAU' },
    { name: 'Enceladus', semi_major_axis_au: 0.00159, type: 'Moon', discoverer: 'Herschel', year_discovered: 1789, diameter_km: 504, source: 'IAU' },
    { name: 'Tethys', semi_major_axis_au: 0.00197, type: 'Moon', discoverer: 'Cassini', year_discovered: 1684, diameter_km: 1062, source: 'IAU' },
    { name: 'Dione', semi_major_axis_au: 0.00252, type: 'Moon', discoverer: 'Cassini', year_discovered: 1684, diameter_km: 1123, source: 'IAU' },
    { name: 'Rhea', semi_major_axis_au: 0.00352, type: 'Moon', discoverer: 'Cassini', year_discovered: 1672, diameter_km: 1528, source: 'IAU' },
    { name: 'Titan', semi_major_axis_au: 0.00817, type: 'Moon', discoverer: 'Huygens', year_discovered: 1655, diameter_km: 5150, source: 'IAU' },
    { name: 'Hyperion', semi_major_axis_au: 0.00990, type: 'Moon', discoverer: 'Bond', year_discovered: 1848, diameter_km: 270, source: 'IAU' },
    { name: 'Iapetus', semi_major_axis_au: 0.0238, type: 'Moon', discoverer: 'Cassini', year_discovered: 1671, diameter_km: 1469, source: 'IAU' },
    { name: 'Phoebe', semi_major_axis_au: 0.0866, type: 'Moon', discoverer: 'Pickering', year_discovered: 1899, diameter_km: 213, source: 'JPL' },

    // Uranus
    { name: 'Miranda', semi_major_axis_au: 0.000868, type: 'Moon', discoverer: 'Kuiper', year_discovered: 1948, diameter_km: 472, source: 'IAU' },
    { name: 'Ariel', semi_major_axis_au: 0.00128, type: 'Moon', discoverer: 'Lassell', year_discovered: 1851, diameter_km: 1158, source: 'IAU' },
    { name: 'Umbriel', semi_major_axis_au: 0.00178, type: 'Moon', discoverer: 'Lassell', year_discovered: 1851, diameter_km: 1170, source: 'IAU' },
    { name: 'Titania', semi_major_axis_au: 0.00292, type: 'Moon', discoverer: 'Herschel', year_discovered: 1787, diameter_km: 1578, source: 'IAU' },
    { name: 'Oberon', semi_major_axis_au: 0.00390, type: 'Moon', discoverer: 'Herschel', year_discovered: 1787, diameter_km: 1523, source: 'IAU' },

    // Neptune
    { name: 'Triton', semi_major_axis_au: 0.00237, type: 'Moon', discoverer: 'Lassell', year_discovered: 1846, diameter_km: 2707, source: 'IAU' },
    { name: 'Nereid', semi_major_axis_au: 0.0368, type: 'Moon', discoverer: 'Kuiper', year_discovered: 1949, diameter_km: 340, source: 'JPL' },
    { name: 'Proteus', semi_major_axis_au: 0.000787, type: 'Moon', discoverer: 'Voyager 2', year_discovered: 1989, diameter_km: 420, source: 'JPL' },

    // Pluto
    { name: 'Charon', semi_major_axis_au: 0.000131, type: 'Moon', discoverer: 'Christy', year_discovered: 1978, diameter_km: 1212, source: 'IAU' },
    { name: 'Nix', semi_major_axis_au: 0.000327, type: 'Moon', discoverer: 'Weaver', year_discovered: 2005, diameter_km: 50, source: 'JPL' },
    { name: 'Hydra', semi_major_axis_au: 0.000432, type: 'Moon', discoverer: 'Weaver', year_discovered: 2005, diameter_km: 65, source: 'JPL' },

    // ═════════════════════════════════════════════════════════════════
    // OCTAVE 4 RANGE: ~2,778 – 221,598 AU (0.01 – 1.07 pc)
    // Domain: Inner Oort Cloud / Near-Interstellar
    // NOTE: Very few confirmed objects. This is a genuine data gap.
    // Most entries below are extreme TNOs with semi-major axes or
    // aphelion distances reaching into this range.
    // Sources: JPL Small-Body Database, MPC
    // ═════════════════════════════════════════════════════════════════

    // (Sedna at 506.2 AU is already listed in TNOs above)
    // Note: Sedna's aphelion ~937 AU reaches into this range


];
