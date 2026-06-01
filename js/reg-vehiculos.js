window.initRegVehiculos = function() {
    // 🔹 LISTAS COMPLETAS DE MARCAS Y MODELOS PARA MOTOCICLETAS
    const marcasModelosMoto = {
        "Empire Keeway": ["Matrix Lite", "Matrix II 150", "EK Xpress Lite", "QJ Fort", "Horse (EK Horse 2 SE)", "EK Arsen II 200", "EK Atlas", "EK Atlas HD/HDS 200", "Owen 200", "Thunder EK", "TX II 150", "TX 250GS", "QJ Motor SRT 550", "QJ Motor SRT 550X", "QJ Motor SRT 700S", "QJ Motor SRT 700SX", "Superlight 200S", "V302C"],
        "Bera Motorcycles": ["Bera BWS", "Milán", "Runner", "SBR", "X1", "BRF", "León", "BR200 / DT", "Cobra", "Kavak", "BRZ", "GR", "Antiking", "Carguero"],
        "Motos Toro": ["Toro Jaguar TR150cc", "Toro León TR200cc", "Toro TRX 150", "Toro TRX 250", "Toro Cappuccino TR180cc", "Toro Power TR180cc", "Toro Moka 150", "Toro Fox TR180cc", "Toro REX TR150cc", "Toro REX TR250cc", "Toro REX Motard", "Toro R3X 250", "Toro Tank TR180cc", "Toro Cyclone RX650"],
        "MD Motos (MD Haojin)": ["MD Águila 150cc", "MD Canario 150cc", "MD Cóndor 150cc", "MD Cardenal 150cc", "MD Fénix 150cc", "MD Tauro 150cc", "MD Gavilán 150cc", "MD Falco 200cc", "MD Lechuza 200cc", "MD Cuervo 150cc", "MD Abeja / Colibrí 150cc", "MD Boa 200 (Carguero)"],
        "AVA Motors": ["AVA Jaguar 150cc", "AVA León 150cc", "AVA Chita 150cc", "AVA Pantera 150cc", "AVA Leopardo 150cc", "AVA Tucán 110cc", "AVA Avispón 150cc", "AVA Flash 150cc", "AVA Águila 150cc", "AVA Tigrito 175cc", "AVA Mustang 250cc", "AVA Deer 250cc", "AVA Tigre 250cc", "AVA Mule", "AVA Rhino 250cc (Tricargo)"],
        "Skygo": ["Skygo Executive 250 (SG250)", "Skygo Majestic 250", "Skygo Elegance 250", "Skygo Edge 250", "Skygo Crossac 250", "Skygo Enduro G2", "Skygo SG150 / Skigo 150cc", "Skygo Sg150t-8", "Skygo Chopper KV-AK150"],
        "Murasaki Motorcycle": ["Kawi 150", "Caracal 150", "Tributo 150", "Caravan 150", "Portimao 150", "Fenix 150", "Fenix 200", "Ray 2 150", "Super Ray 150", "Infernus 200", "Predator X 300", "XS3 (Scooter eléctrica)", "XS6 (Eléctrica)", "Karuay 110", "MetallicCat 200 (Motocargo)"],
        "Bel Motos": ["Bel Matrix 150", "Bel New Matrix 150", "Bel Speed 150", "Bel Evo 150", "Bel Max 150", "Bel Max 200", "Bel Owen 150", "Bel Horse 150", "Bel Gloster 150", "Bel RK6 200", "Bel Sierra 200", "Bel Dakar 200", "Bel Space 150", "Bel Cargo 200"],
        "Motos Kadi": ["Kadi KD150-13 (Kadi Hawk)", "Kadi KD150-15 (Kadi Jaguar)", "Kadi KD150-23 (Kadi León)", "Kadi KD150-2B (Kadi Águila)", "Kadi KD150T-5 (Kadi Scooter)", "Kadi KD200 (Kadi Enduro / Doble Propósito)", "Kadi KD200-ZH (Kadi Motocargo)"],
        "Escuda Motorcycles": ["Escuda Hero", "Escuda Adventure", "Escuda Extreme", "Escuda EM200", "Escuda New Jog", "Escuda Alexa"],
        "Yamaha": ["Yamaha YBR 125", "Yamaha FZ16 / FZ-S / FZ25", "Yamaha YZF-R1 / R6 / R3 / R15", "Yamaha MT-03 / MT-07 / MT-09 / MT-10", "Yamaha TMAX / XMAX / NMAX / BWS (Zuma)", "Yamaha Crypton 110", "Yamaha DT 125 / DT 175", "Yamaha XT 660R / XT 600", "Yamaha Ténéré 700 / Super Ténéré 1200", "Yamaha WR 250F / WR 450F", "Yamaha YZ 250F / YZ 450F", "Yamaha Bolt C-Spec", "Yamaha V-Star 250 / 650 / 1100", "Yamaha XTZ 125 / XTZ 150 / XTZ 250 Lander", "Yamaha Crux 110", "Yamaha RayZR 125", "Yamaha Fascino 125", "Yamaha Tracer 7 / Tracer 9 GT", "Yamaha XSR 155 / XSR 700 / XSR 900", "Yamaha Raptor 700R (Cuatrimoto / ATV)", "Yamaha YFZ450R (Cuatrimoto / ATV)", "Yamaha Grizzly 700 (Cuatrimoto / ATV)"],
        "Honda": ["Honda CG 150 Titan / Titan 120", "Honda CB 125F / CB 190R / CB 250 Twister / CB 500F / CB 650F / CB 1000R", "Honda CBR 250R / CBR 600RR / CBR 1000RR Fireblade", "Honda CRF 250F / CRF 250R / CRF 450R / CRF 1100L Africa Twin", "Honda XR 150L / XR 190L / XR 250 Tornado / XR 650L", "Honda XRE 190 / XRE 300", "Honda Transalp XL750", "Honda GL 1800 Gold Wing", "Honda CMX 500 Rebel / CMX 1100 Rebel", "Honda Shadow 750", "Honda NC 750X", "Honda X-ADV 750", "Honda ADV 160 / ADV 350", "Honda PCX 160", "Honda Elite 125", "Honda Dio 110", "Honda NAVI 110", "Honda Wave 110S", "Honda Biz 125", "Honda GL 150 Cargo", "Honda TRX 420 FourTrax / TRX 700XX (Cuatrimoto / ATV)"],
        "Suzuki": ["Suzuki GN 125", "Suzuki AX 100", "Suzuki DR 150 / DR 200 / DR 650", "Suzuki Gixxer 150 / Gixxer 250", "Suzuki GSX-R600 / GSX-R750 / GSX-R1000", "Suzuki GSX-S750 / GSX-S1000", "Suzuki Hayabusa (GSX1300R)", "Suzuki V-Strom 250 / V-Strom 650 / V-Strom 1050", "Suzuki Boulevard C50 / M109R", "Suzuki Burgman 125 / Burgman 200 / Burgman 400 / Burgman 650", "Suzuki Address 115", "Suzuki Avenis 125", "Suzuki Access 125", "Suzuki EN 125 HU", "Suzuki Katana", "Suzuki SV 650", "Suzuki RM-Z250 / RM-Z450", "Suzuki KingQuad 400 / KingQuad 750 (Cuatrimoto / ATV)"],
        "KTM": ["KTM 125 Duke / 200 Duke / 250 Duke / 390 Duke / 790 Duke / 890 Duke / 990 Duke / 1390 Super Duke R", "KTM RC 125 / RC 200 / RC 390 / RC 8C", "KTM 250 Adventure / 390 Adventure / 790 Adventure / 890 Adventure / 1290 Super Adventure / 1390 Super Adventure", "KTM 690 Enduro R", "KTM 690 SMC R", "KTM 150 EXC / 250 EXC / 300 EXC (TPI / hardenduro)", "KTM 250 EXC-F / 350 EXC-F / 450 EXC-F / 500 EXC-F", "KTM 125 SX / 250 SX", "KTM 250 SX-F / 350 SX-F / 450 SX-F", "KTM 50 SX / 65 SX / 85 SX", "KTM Freeride E-XC"],
        "Ducati": ["Ducati Monster", "Ducati Diavel / XDiavel", "Ducati Hypermotard", "Ducati Multistrada", "Ducati Panigale", "Ducati Streetfighter", "Ducati SuperSport", "Ducati DesertX", "Ducati Scrambler", "Ducati Superleggera"],
        "Benelli": ["Benelli TNT 15", "Benelli TNT 25", "Benelli TNT 135", "Benelli TNT 150i", "Benelli TNT 250", "Benelli TNT 300", "Benelli TNT 600i", "Benelli 180S", "Benelli 302S", "Benelli 502C", "Benelli 752S", "Benelli TRK 251 / TRK 502 / TRK 502X / TRK 702 / TRK 702X / TRK 800", "Benelli Leoncino 125 / Leoncino 250 / Leoncino 500 / Leoncino 800", "Benelli Imperiale 400", "Benelli BKX 250 / BKX 300", "Benelli VZ 125i", "Benelli Panarea 125"],
        "Kawasaki": ["Kawasaki Ninja 250R / 300 / 400 / 500 / 650 / 1000SX / H2 / H2R", "Kawasaki Ninja ZX-4R / ZX-6R / ZX-10R / ZX-14R", "Kawasaki Z125 Pro / Z400 / Z500 / Z650 / Z900 / Z1000 / Z H2", "Kawasaki Z650RS / Z900RS", "Kawasaki Versys-X 300 / Versys 650 / Versys 1000", "Kawasaki KLR 650", "Kawasaki KLX 110 / 140 / 150 / 230 / 300 / 450R", "Kawasaki KX 65 / 85 / 112 / 250 / 450", "Kawasaki Vulcan S / Vulcan 900 / Vulcan 1700 Voyager", "Kawasaki Eliminator / Eliminator 450", "Kawasaki Concours 14", "Kawasaki Brute Force 300 / Brute Force 750 (Cuatrimoto / ATV)"],
        "Otra": ["Otra (Especificar en observaciones)"]
    };

    // 🔹 LISTAS COMPLETAS DE MARCAS Y MODELOS PARA AUTOMÓVILES
    const marcasModelosAuto = {
        "JAC Motors": ["Arena / Arena Sport (Sedán)", "Aventura / Aventura Pro (JS3)", "Nevado / Nevado Sport Wagon (JS4)", "Tepuy / Tepuy Pro (JS6)", "Savanna / Savanna Pro Sport (JS8)", "La Venezolana (T6 - Pick-up 4x2 y 4x4)", "La Venezolana Pro (T8 - Pick-up 4x4)", "T9 (Pick-up)", "J7 / J7 Elite Pro", "Refine (Mini-van / MPV)", "Sunray (Vans de carga y pasajeros)", "Bachaco (Camión de carga)", "Búfalo (Camión de carga)", "Leyenda (Camión de carga)"],
        "Toyota": ["Agya", "Yaris / Yaris Cross", "Corolla / Corolla Cross", "Camry", "Prius", "Hilux", "Land Cruiser (Serie 70 / Machito)", "Land Cruiser Prado", "Land Cruiser (Serie 200 / Serie 300)", "Fortuner", "4Runner", "RAV4", "Sequoia", "Tundra", "Tacoma", "Hiace", "Coaster", "Terios (Histórico / Daihatsu)", "Starlet (Histórico)", "Celica (Histórico)", "Merú (Histórico)", "Aygo X", "Aqua", "Avanza", "Rush", "Raize", "Yaris Heykers", "Corolla Hatchback / Corolla Touring Sports", "GR Yaris", "GR Corolla", "GR86", "GR Supra", "Avalon", "Century", "Crown / Crown Signia", "Mirai", "bZ4X / bZ3", "Urban Cruiser", "C-HR", "Harrier", "Highlander / Grand Highlander", "Venza", "Sienna", "Alphard / Vellfire", "Innova", "Roomy", "Sienta", "Voxy", "Noah", "Probox", "LiteAce / TownAce", "Hilux Champ / Rangga", "Proace / Proace City / Proace Max"],
        "Changan Auto": ["Alsvin", "CS15", "CS35 Plus", "CS55 Plus", "CS75 Plus", "CS85 Coupe", "CS95", "Uni-T", "Uni-K", "Uni-V", "Hunter (Pick-up)", "Star 5 (Vans de carga y pasajeros)", "Q20 / M201 (Mini-trucks de carga)"],
        "Foton": ["Tunland E", "Tunland G7", "TruckMate M25 (1.3 Toneladas)", "TruckMate + Cargabox", "Foton 2 Toneladas", "Foton 3 Toneladas", "View C2 (Van de carga y pasajeros)", "View CS2 (Ambulancia y transporte)", "Aumark S (Camiones de mediana capacidad / 5 a 8 Toneladas)", "Aumark TX", "Auman R (Camiones de carga pesada / 10 a 45 Toneladas)", "Mars V7", "Mars V9", "Tunland V9", "Tunland Yutu", "Grand General G9", "Sauvana", "Toplander", "Saga", "Toano / Toano Grand-V", "View Traveller", "View Transvan", "View i-series", "Gratour V3", "Gratour ix5", "Gratour im6", "Midi", "MP-X", "Smart Smurf E7", "EV Light Truck 4.5T"],
        "Chevrolet": ["Aveo", "Spark", "Optra", "Cruze", "Onix", "Cavalier", "Tracker", "Captiva", "Trailblazer", "Traverse", "Tahoe", "Suburban", "Orlando", "Silverado", "Colorado", "D-Max", "Grand Vitara", "LUV", "Astra", "Corsa", "Meriva", "Zafira", "Epica", "Impala", "Malibu", "Century", "Celebrity", "Caprice", "Swift", "San Remo", "Trax", "Chevette", "Lumina", "Monte carlos", "Trailblazer (Global/Crossover)", "Equinox", "Equinox EV", "Blazer", "Blazer EV", "Silverado EV", "Montana", "S10", "Spin", "Groove", "Seeker", "Monza (Global actual)", "Sail", "Menlo", "Bolt EV / Bolt EUV"],
        "Ford": ["Territory", "EcoSport", "Escape", "Edge", "Explorer", "Everest", "Bronco / Bronco Sport", "Expedition", "Ranger / Ranger Raptor", "F-150 / FX4 / Lariat", "F-350 / Super Duty", "Fiesta", "Focus", "Laser", "Festiva", "Ka", "Fusion", "Mustang", "Sierra"],
        "Jeep": ["CJ-5 / CJ-7", "Wrangler (YJ / TJ / JK / JL)", "Cherokee (XJ / KJ / KK / KL)", "Grand Cherokee (ZJ / WJ / WK / WK2 / WL)", "Gladiator", "Compass", "Renegade", "Commander (Histórico 3 filas)", "Wagoneer / Grand Wagoneer (Históricos)", "J-10 / J-20 (Camionetas pickup históricas)", "Comanche", "Avenger", "Recon", "Wagoneer S", "Commander (Modelo actual para Latinoamérica/Asia)", "Grand Commander (Mercado asiático)", "Meridian"],
        "RAM": ["Ram 1500 (Classic / DT / Rebel / Laramie)", "Ram 2500 (Heavy Duty)", "Ram 3500 (Heavy Duty)", "Ram 700", "Ram 1000", "Ram 1200", "Ram Rampage", "Ram 1500 RHO", "Ram 1500 TRX", "Ram 1500 REV", "Ram ProMaster", "Ram ProMaster City", "Ram ProMaster Rapid", "Ram V700 Rapid", "Ram V700 City", "Ram Chassis Cab (4500 / 5500)"],
        "Hyundai": ["Grand i10 (Hatchback / Sedán)", "Accent", "Elantra", "Sonata", "Getz", "Matrix", "Atos", "Excel", "Scoupe", "Creta / Creta Grand", "Tucson", "Santa Fe", "Veracruz", "Terracan", "Galloper", "Palisade", "Kona / Kona EV", "Ioniq", "Staria", "H-1 / Starex", "HD65 / HD72 / HD78 (Camiones de carga)", "i10 / i20 / i30", "HB20 (HB20X / HB20S)", "Bayon", "Venue", "Alcazar", "Mufasa", "Casper", "Inster", "Lafesta", "Celesta", "Aura", "Grandeur / Azera", "Santa Cruz", "Nexo", "Ioniq 3", "Ioniq 5 / Ioniq 5 N", "Ioniq 6 / Ioniq 6 N", "Ioniq 9", "Custo", "Porter / H-100"],
        "Kia": ["Picanto", "Soluto", "Sonet", "Seltos", "Sportage", "Sorento", "Carnival", "Rio (Stylus / Excite / Spice)", "Cerato / Forte", "Optima", "Carens / Rondo", "Pregio (Van)", "Besta (Van)", "K2700 / K3000 / Bongo (Camiones)", "Sephia", "Spectra", "Opirus", "Tasman (Pick-up global)", "EV2", "EV3", "EV4", "EV5", "EV6 / EV6 GT", "EV9", "K3 / K4 (Sucesores del Cerato y Rio)", "K5 (Sucesor del Optima)", "K8", "K9 / K900", "Ray / Ray EV", "Morning", "Ceed / ProCeed / XCeed", "Stonic", "Niro (Hybrid / Plug-in / EV)", "Soul", "Telluride", "Stinger", "Cadenza", "Mohave / Borrego", "Pegas", "Venga", "Joice"],
        "Fiat": ["Cronos", "Argo / Argo Trekking", "Pulse (Audace / S-Design)", "Fastback / Fastback Impetus", "Mobi / Mobi Trekking", "Toro", "Fiorino", "Uno (Fire / Way)", "Palio / Palio Weekend", "Siena", "Premio", "Uno Mille", "Regatta", "Tucán", "Ritmo", "Mirafiori / Fiat 131", "Spazio / Fiat 147", "Tempra", "Marea", "Brava", "Idea", "Stilo", "Strada", "500 (500e / Hybrid)", "500X", "600 / 600 Hybrid", "Panda / Grande Panda", "Tipo (Sedán / Hatchback / Cross)", "Titano", "Scudo", "Ducato", "Doblò", "E-Ulysse", "Topolino"],
        "Renault": ["Logan", "Sandero / Sandero Stepway", "Duster", "Oroch", "Koleos", "Kwid", "Twingo (Histórico muy destacado)", "Clio (Histórico)", "Symbol (Histórico)", "Megane (Histórico)", "Scenic (Histórico)", "Laguna (Histórico)", "Kangoo (Histórico)", "R19 / R11 / R9 / R5 (Históricos clásicos)", "Kardian", "Boreal", "Filante", "Arkana", "Austral", "Rafale", "Espace (Gama SUV actual)", "Symbioz", "Captur", "Triber", "Kiger", "Megane E-Tech (100% Eléctrico)", "Scenic E-Tech (100% Eléctrico)", "Renault 5 E-Tech (Eléctrico retro)", "Renault 4 E-Tech (Eléctrico retro)", "Niagara (Pick-up global)", "Master", "Trafic", "Express"],
        "Chery": ["Arrizo 5 / Arrizo 5 Pro", "Tiggo 2 Pro Max", "Tiggo 4 / Tiggo 4 Pro Max", "Tiggo 7 Pro / Tiggo 7 Pro Max", "Tiggo 8 Pro / Tiggo 8 Pro Max", "Tiggo 9", "Himla (Pick-up)", "QQ (Histórico muy destacado)", "Arauca (Histórico)", "Orinoco (Histórico)", "Tiggo (Generaciones antiguas 2.0 / 2.4)", "Grand Tiger (Pick-up histórica)", "X1 (Histórico)", "Arrizo 8", "QQ Ice Cream", "Little Ant (eQ1)", "Wujie Pro (eQ7)", "Tiggo 3x / Tiggo 5x", "Tiggo 8 Pro Plug-in Hybrid (PHEV)", "Fulwin T9 / Fulwin T9L", "Fulwin A9", "Fulwin T11", "Omoda 5 / Omoda E5 (Bajo la submarca Omoda)", "Jaecoo 7 / Jaecoo 9 (Bajo la submarca Jaecoo)", "iCAR 03 / iCAR V23 (Bajo la submarca iCAR)", "EQ7", "Arrizo 5 GT"],
        "Geely": ["Coolray / New Coolray", "Azkarra", "Tugella", "Geometry C (100% Eléctrico)", "Okavango", "Emgrand", "Binyue / Binyue Cool", "Binrui / Binrui Cool", "Xingyue L (Monjaro)", "Xingyue S", "Xingrui (Preface)", "Haoyue L", "Icon", "Boyue L / Boyue Cool", "Panda Mini EV / Panda Knight", "Geometry A / Geometry E (Gama Geometry)", "Galaxy L7 / Galaxy L6 / Galaxy E8 (Gama Geely Galaxy)", "E5", "Preface L", "Jiaji / Jiaji L", "Borui / Borui GE"],
        "Maxus": ["D60", "G50", "T60", "D90", "Territory (SUV)", "G10", "G20", "G70", "G90", "MIFA 7", "MIFA 9", "T70", "T90", "Terron 9", "eTerron 9", "Interstellar X", "V70", "V80", "V90", "EV30", "Deliver 7", "Deliver 9", "eDeliver 3", "eDeliver 5", "eDeliver 7", "eDeliver 9", "Dana V1", "Dana M1", "Dana T1"],
        "DFSK": ["D1 (Pick-up)", "E5 Comfort Hybrid (PHEV)", "Seres E3 (100% Eléctrico / Comercializado bajo su red)", "Glory 330S", "K07S (Minivan)", "C31 (Mini Truck)", "Glory 500 / Fengon 500", "Glory 560 Pro", "Glory 580", "Glory 600 / Fengon 600", "Fengon IX5", "Fengon IX7", "E3 / Seres 3", "Seres 5 / Seres 7 (Gama de alta gama en mercados globales)", "Candy (Mini EV)", "K01 / K02 / K05S / K07S (Línea de comerciales K-Series)", "C32 / C35 / C36 / C37 (Línea de comerciales C-Series)", "EC31 / EC35 / EC36 (Comerciales 100% eléctricos)", "D51 / D52 / D71 / D72 (Camiones ligeros y pesados D-Series)", "V21 / V22 / V27 / V29 (Línea comercial V-Series)", "Super Cab"],
        "Dongfeng": ["D1 (Pick-up)", "E5 Comfort Hybrid (PHEV)", "Glory 500", "Glory 580", "Glory 330S", "Seres E3 (100% Eléctrico)", "K07S (Minivan)", "C31 (Mini Truck)", "E5 Plus", "600 / Glory 600 / Fengon 600", "Glory 560 Pro", "Fengon IX5", "Fengon IX7", "Candy (Mini EV)", "EC35 (Van eléctrica)", "EC31 / EC36 (Comerciales eléctricos)", "K01 / K02 / K05S (Línea comercial K-Series)", "C32 / C35 / C36 / C37 (Línea comercial C-Series)", "D51 / D52 / D71 / D72 (Línea comercial D-Series)", "V21 / V22 / V27 / V29 (Línea comercial V-Series)", "Super Cab", "Seres 5 / Seres 7 (Gama global bajo soporte de la casa matriz)"],
        "Nissan": ["Versa", "Sentra", "Altima", "Pathfinder", "X-Trail", "Frontier", "Kicks", "March", "NP300", "Note", "Magnite"],
        "Peugeot": ["208", "301", "308", "408", "2008", "3008", "5008", "Partner", "Landtrek", "Rifter", "e-208"],
        "Volkswagen": ["Gol", "Polo", "Virtus", "Jetta", "Passat", "Tiguan", "T-Roc", "Taos", "Amarok", "Nivus", "ID.4"],
        "Mitsubishi": ["L200", "Outlander", "ASX", "Montero", "Lancer", "Eclipse Cross", "Xpander", "Mirage"],
        "Mazda": ["Mazda 2", "Mazda 3", "Mazda 6", "CX-3", "CX-30", "CX-5", "CX-9", "MX-5", "BT-50"],
        "Otra": ["Otra (Especificar en observaciones)"]
    };

    // 🔹 Referencias DOM
    const marcaSelect = document.getElementById('v_marca');
    const modeloSelect = document.getElementById('v_modelo');
    const anioSelect = document.getElementById('v_anio');
    const form = document.getElementById('form-reg-vehiculos');
    const btn = form?.querySelector('.btn-submit');
    const msg = document.getElementById('msg-reg-vehiculos');

    // 🔹 1. Poblar Años
    if (anioSelect) {
        const currentYear = new Date().getFullYear();
        anioSelect.innerHTML = '<option value="">Seleccione año...</option>';
        for (let y = currentYear; y >= 1850; y--) anioSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }

    // 🔹 2. Lógica de Marcas/Modelos
    function cargarMarcas(tipo) {
        const lista = tipo === 'moto' ? marcasModelosMoto : marcasModelosAuto;
        marcaSelect.innerHTML = '<option value="">Seleccione marca...</option>';
        Object.keys(lista).sort().forEach(m => marcaSelect.innerHTML += `<option value="${m}">${m}</option>`);
        modeloSelect.innerHTML = '<option value="">Seleccione modelo...</option>';
    }

    marcaSelect.addEventListener('change', function() {
        const tipo = document.getElementById('v_tipo').value === 'Motocicleta' ? 'moto' : 'auto';
        const lista = tipo === 'moto' ? marcasModelosMoto : marcasModelosAuto;
        const marca = this.value;
        modeloSelect.innerHTML = '<option value="">Seleccione modelo...</option>';
        if (lista[marca]) lista[marca].forEach(mod => modeloSelect.innerHTML += `<option value="${mod}">${mod}</option>`);
    });

    // 🔹 3. Selector de Tipo (Moto/Auto)
    window.selectVehicleType = function(type) {
        document.querySelectorAll('.tipo-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.type === type));
        document.getElementById('v_tipo').value = (type === 'moto') ? 'Motocicleta' : 'Automóvil';
        
        cargarMarcas(type);
        
        const isMoto = type === 'moto';
        document.getElementById('grid-fotos-moto').style.display = isMoto ? 'grid' : 'none';
        document.getElementById('grid-fotos-auto').style.display = isMoto ? 'none' : 'grid';
        document.getElementById('box-cilindraje').style.display = isMoto ? 'block' : 'none';
        
        // Toggle required para fotos
        document.getElementById('grid-fotos-moto').querySelectorAll('input').forEach(i => i.required = isMoto);
        document.getElementById('grid-fotos-auto').querySelectorAll('input').forEach(i => i.required = !isMoto);
        
        document.querySelectorAll('input[type="file"]').forEach(i => i.value = '');
        document.querySelectorAll('.img-preview').forEach(i => { i.style.display = 'none'; i.src = ''; });
        
        // ✅ Resetear validación al cambiar de tipo
        resetValidation();
    };

    //  4. Vista Previa de Imágenes
    const setupPreview = (inputId, previewId) => {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(previewId);
        if (!input || !preview) return;
        input.addEventListener('change', function() {
            const file = this.files[0];
            if (file) { const r = new FileReader(); r.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; }; r.readAsDataURL(file); }
            else preview.style.display = 'none';
        });
    };
    ['v_foto_frontal', 'v_foto_trasera', 'v_foto_der', 'v_foto_izq', 'v_foto_frontal_a', 'v_foto_trasera_a', 'v_foto_der_a', 'v_foto_izq_a'].forEach((id, i) => {
        setupPreview(id, id.replace('v_foto_', 'prev_v_'));
    });

    //  5. 🚨 VALIDACIÓN EN TIEMPO REAL (CORREGIDA: Tablas Separadas)
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    async function checkAvailability(input, msgId) {
        const val = input.value.trim().toUpperCase();
        const msgEl = document.getElementById(msgId);
        if (!val) {
            input.classList.remove('input-valid', 'input-error');
            if (msgEl) { msgEl.textContent = ''; msgEl.className = 'status-msg'; }
            return;
        }
        
        if (msgEl) { msgEl.textContent = '⏳ Verificando...'; msgEl.className = 'status-msg'; }

        try {
            let found = false;

            // ✅ CORRECCIÓN: Solo verificar en la tabla correspondiente al tipo de vehículo
            // Si estoy en Motos -> verifico en registro_motos
            // Si estoy en Autos -> verifico en registro_automoviles
            // NO cruzamos tablas para validación de unicidad (viceversa permitido)
            const currentTable = document.getElementById('v_tipo').value === 'Motocicleta' ? 'registro_motos' : 'registro_automoviles';

            const col = input.id === 'v_placa' ? 'placa' :
                        input.id === 'v_serial_carroceria' ? 'serial_carroceria' : 'serial_motor';

            const { data } = await window.supabaseClient.from(currentTable).select('id').eq(col, val).maybeSingle();
            if (data) found = true;

            if (found) {
                input.classList.add('input-error'); input.classList.remove('input-valid');
                if (msgEl) { msgEl.textContent = '❌ Ya registrado'; msgEl.className = 'status-msg error'; }
            } else {
                input.classList.add('input-valid'); input.classList.remove('input-error');
                if (msgEl) { msgEl.textContent = '✅ Disponible'; msgEl.className = 'status-msg valid'; }
            }
        } catch (e) {
            if (msgEl) msgEl.textContent = '⚠️ Error de conexión';
        }
    }

    const validatePlaca = debounce((e) => checkAvailability(e.target, 'msg-placa'), 600);
    const validateCarro = debounce((e) => checkAvailability(e.target, 'msg-carroceria'), 600);
    const validateMotor = debounce((e) => checkAvailability(e.target, 'msg-motor'), 600);

    document.getElementById('v_placa')?.addEventListener('input', validatePlaca);
    document.getElementById('v_serial_carroceria')?.addEventListener('input', validateCarro);
    document.getElementById('v_serial_motor')?.addEventListener('input', validateMotor);

    //  6. ✅ FUNCIÓN DE LIMPIEZA COMPLETA (Corrección del error verde)
    function resetValidation() {
        // Limpiar clases de borde
        document.querySelectorAll('.registro-form input').forEach(i => i.classList.remove('input-valid', 'input-error'));
        // Limpiar textos de mensajes
        ['msg-placa', 'msg-carroceria', 'msg-motor'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.textContent = '';
        });
    }

    //  7. Envío del Formulario
    if (!form || !btn) return console.error('❌ Formulario no encontrado');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }

        const placa = document.getElementById('v_placa').value.trim().toUpperCase();
        const serialCarro = document.getElementById('v_serial_carroceria').value.trim();
        const color = document.getElementById('v_color').value;
        
        const msgPlaca = document.getElementById('msg-placa');
        if (msgPlaca?.classList.contains('error')) return mostrarError('La placa ya se encuentra registrada.');

        if (placa.length < 6) return mostrarError('La placa debe tener al menos 6 caracteres.');

        btn.disabled = true; btn.textContent = '⏳ Guardando...'; msg.style.display = 'none';

        try {
            const isMoto = document.getElementById('v_tipo').value === 'Motocicleta';
            const tablaDestino = isMoto ? 'registro_motos' : 'registro_automoviles';
            const bucket = window.supabaseClient.storage.from('fotos_vehiculos');
            const uid = sessionStorage.getItem('pnb_user_id') || 'user';
            const ts = Date.now();

            const uploadFile = async (inputId, suffix) => {
                const el = document.getElementById(inputId);
                const file = el?.files[0];
                if (!file) throw new Error(`Falta la fotografía: ${el.previousElementSibling.textContent}`);
                const path = `${uid}/${ts}_${suffix}.jpg`;
                const { error } = await bucket.upload(path, file, { cacheControl: '3600' });
                if (error) throw new Error('Error subiendo imágenes.');
                return bucket.getPublicUrl(path).data.publicUrl;
            };

            let urls = {};
            const prefix = isMoto ? '' : '_a';
            [urls.f, urls.r, urls.rd, urls.ri] = await Promise.all([
                uploadFile(`v_foto_frontal${prefix}`, 'f'), uploadFile(`v_foto_trasera${prefix}`, 't'),
                uploadFile(`v_foto_der${prefix}`, 'rd'), uploadFile(`v_foto_izq${prefix}`, 'ri')
            ]);

            const data = {
                estatus: 'Verificación',
                estacion_policial: document.getElementById('v_estacion')?.value || 'EPP GENERICA',
                direccion_detencion: document.getElementById('v_direccion_detencion')?.value.trim() || null,
                placa, 
                anio: parseInt(document.getElementById('v_anio').value), 
                color, 
                serial_carroceria: serialCarro,
                marca: document.getElementById('v_marca').value, 
                modelo: document.getElementById('v_modelo').value,
                observaciones: document.getElementById('v_observaciones')?.value.trim() || null,
                foto_frontal: urls.f, foto_trasera: urls.r, foto_lado_derecho: urls.rd, foto_lado_izquierdo: urls.ri
            };

            if (isMoto) {
                data.serial_motor = document.getElementById('v_serial_motor').value.trim() || null;
                data.cilindraje = document.getElementById('v_cilindraje').value;
            } else {
                data.serial_motor = document.getElementById('v_serial_motor').value.trim() || null;
            }

            const { error } = await window.supabaseClient.from(tablaDestino).insert([data]);
            if (error) throw error;

            // ✅ MOSTRAR MENSAJE DE ÉXITO
            msg.textContent = '✅ Vehículo registrado exitosamente.'; 
            msg.className = 'msg success'; 
            msg.style.display = 'block';
            
            // ✅ LIMPIEZA TOTAL TRAS ÉXITO
            form.reset(); 
            resetValidation(); // Esto borra el verde y los textos
            selectVehicleType('moto'); // Esto reinicia el tipo a Moto
            
            // ✅ Ocultar mensaje después de 4 segundos
            setTimeout(() => { 
                msg.style.display = 'none'; 
            }, 4000);

        } catch (err) {
            console.error('Error:', err);
            let mensaje = 'Error inesperado. Intente nuevamente.';
            if (err.message.includes('23505') || err.message.includes('unique')) mensaje = '❌ Esta placa ya se encuentra registrada.';
            else if (err.message.includes('storage')) mensaje = '❌ Error subiendo fotografías.';
            else if (err.message.includes('Falta la fotografía')) mensaje = ' ' + err.message;
            mostrarError(mensaje);
        } finally { btn.disabled = false; btn.textContent = '✅ Registrar Vehículo'; }
    });

    function mostrarError(t) { if(msg){msg.textContent='❌ '+t; msg.className='msg error'; msg.style.display='block';} }
    
    // Inicializar
    selectVehicleType('moto');
};
