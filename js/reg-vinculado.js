window.initRegVinculado = function() {
    console.log("✅ Módulo reg-vinculado.js cargado correctamente.");

    // ==========================================
    // 🔹 1. LISTAS COMPLETAS DE MARCAS Y MODELOS
    // ==========================================
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

    // ==========================================
    // 🔹 2. FUNCIONES DE UI
    // ==========================================
    window.toggleCampo = function(select, targetId) {
        const el = document.getElementById(targetId);
        const input = el?.querySelector('input');
        if (select.value === 'true') {
            if (el) el.style.display = 'block';
            if (input) input.required = true;
        } else {
            if (el) el.style.display = 'none';
            if (input) { input.value = ''; input.required = false; }
        }
    };

    window.activarCampoPerforacion = function(select) {
        const caja = document.getElementById('pv_box-lugar-perforacion');
        const input = document.getElementById('pv_txt_lugar_perforacion');
        if (!caja || !input) return;
        if (select.value === 'true') { caja.style.display = 'block'; input.required = true; }
        else { caja.style.display = 'none'; input.value = ''; input.required = false; }
    };

    window.convertirEstatura = function() {
        const inputM = document.getElementById('pv_p_estatura');
        const inputCm = document.getElementById('pv_p_estatura_cm');
        if (!inputM) return null;
        const metros = parseFloat(inputM.value);
        if (!isNaN(metros) && metros >= 0.50 && metros <= 2.30) {
            const cm = Math.round(metros * 100);
            if (inputCm) inputCm.value = cm; return cm;
        }
        return null;
    };

    window.cargarMarcasPV = function() {
        const tipo = document.getElementById('pv_v_tipo').value;
        const marcaSelect = document.getElementById('pv_v_marca');
        const modeloSelect = document.getElementById('pv_v_modelo');
        const boxCilindro = document.getElementById('pv_box_cilindro');

        marcaSelect.innerHTML = '<option value="">Seleccione marca...</option>';
        modeloSelect.innerHTML = '<option value="">Seleccione modelo...</option>';

        if (tipo === 'Motocicleta') {
            Object.keys(marcasModelosMoto).sort().forEach(m => {
                marcaSelect.innerHTML += `<option value="${m}">${m}</option>`;
            });
            boxCilindro.style.display = 'block';
        } else if (tipo === 'Automóvil') {
            Object.keys(marcasModelosAuto).sort().forEach(m => {
                marcaSelect.innerHTML += `<option value="${m}">${m}</option>`;
            });
            boxCilindro.style.display = 'none';
        }
    };

    window.cargarModelosPV = function() {
        const tipo = document.getElementById('pv_v_tipo').value;
        const marca = document.getElementById('pv_v_marca').value;
        const modeloSelect = document.getElementById('pv_v_modelo');
        
        modeloSelect.innerHTML = '<option value="">Seleccione modelo...</option>';
        
        let lista = tipo === 'Motocicleta' ? marcasModelosMoto[marca] : marcasModelosAuto[marca];
        
        if (lista) lista.forEach(mod => {
            modeloSelect.innerHTML += `<option value="${mod}">${mod}</option>`;
        });
    };

    // 🔹 Cargar Estaciones Policiales
    const estacionesList = [
        "EPM MARACAIBO", "EPM SAN FRANCISCO", "EPM LA CAÑADA", "EPM ESTACION POLICIAL JESUS E. LOSADA",
        "EPP CRISTO DE ARANZA", "EPP LUIS HURTADO", "EPP DAGNINO", "EPP OLEGARIO VILLALOBOS",
        "EPP CHIQUINQUIRA", "EPP FRANCISCO EUGENIO", "EPP CARACCIOLO", "EPP IDELFONSO",
        "EPP VENANCIO PULGAR", "EPP COQUIVACOA-ZAPARA", "EPP RAUL LEONI", "EPP ANTONIO BORJAS ROMERO",
        "EPP JUANA DE AVILA", "EPP SAN ISIDRO", "EPP CASIQUE MARA", "EPP BOLIVAR", "EPP EL BAJO",
        "EPP DOMITILA", "EPP CORTIJOS", "EPP MARCIAL HERNANDEZ", "EPP POTRERITO", "EPP ANDRES BELLO", "EPP SANTA LUCIA"
    ];

    function cargarEstaciones() {
        const select = document.getElementById('pv_estacion');
        if (!select) return;
        select.innerHTML = '<option value="">Seleccione estación...</option>';
        estacionesList.sort().forEach(est => {
            select.innerHTML += `<option value="${est}">${est}</option>`;
        });
    }

    // Llenar Años
    const anioSelect = document.getElementById('pv_v_anio');
    if (anioSelect) {
        const currentYear = new Date().getFullYear();
        anioSelect.innerHTML = '<option value="">Seleccione año...</option>';
        for (let y = currentYear; y >= 1990; y--) anioSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }

    // Cálculo de Edad
    const fechaNac = document.getElementById('pv_p_fecha_nac');
    const edadInput = document.getElementById('pv_p_edad');
    if (fechaNac && edadInput) {
        fechaNac.addEventListener('change', () => {
            if (!fechaNac.value) return;
            const hoy = new Date(), nac = new Date(fechaNac.value);
            let edad = hoy.getFullYear() - nac.getFullYear();
            const m = hoy.getMonth() - nac.getMonth();
            if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
            edadInput.value = (edad >= 0 && edad <= 120) ? edad : '';
        });
    }

    // Estatura en tiempo real
    const estaturaInput = document.getElementById('pv_p_estatura');
    if (estaturaInput) {
        estaturaInput.addEventListener('input', window.convertirEstatura);
        estaturaInput.addEventListener('blur', window.convertirEstatura);
    }

    // Dropdown de Banderas
    const nativeSelect = document.getElementById('pv_p_tlf_pais');
    const displayBox = document.querySelector('.phone-display');
    const optionsBox = document.querySelector('.phone-options');
    const flagImg = document.getElementById('pv_tlf-flag-img');
    const codeText = document.getElementById('pv_tlf-code-text');
    const countryText = document.getElementById('pv_tlf-country-text');
    
    const isoMap = {
        "Afganistán":"af", "Albania":"al", "Alemania":"de", "Andorra":"ad", "Angola":"ao", "Antigua y Barbuda":"ag", "Arabia Saudita":"sa", "Argelia":"dz", "Argentina":"ar", "Armenia":"am", "Australia":"au", "Austria":"at", "Azerbaiyán":"az", "Bahamas":"bs", "Baréin":"bh", "Bangladés":"bd", "Barbados":"bb", "Bélgica":"be", "Belice":"bz", "Benín":"bj", "Bielorrusia":"by", "Birmania":"mm", "Bolivia":"bo", "Bosnia y Herzegovina":"ba", "Botsuana":"bw", "Brasil":"br", "Brunéi":"bn", "Bulgaria":"bg", "Burkina Faso":"bf", "Burundi":"bi", "Bután":"bt", "Cabo Verde":"cv", "Camboya":"kh", "Camerún":"cm", "Canadá":"ca", "Catar":"qa", "Rep. Centroafricana":"cf", "Chad":"td", "Rep. Checa":"cz", "Chile":"cl", "China":"cn", "Chipre":"cy", "Colombia":"co", "Comoras":"km", "Corea del Norte":"kp", "Corea del Sur":"kr", "Costa de Marfil":"ci", "Costa Rica":"cr", "Croacia":"hr", "Cuba":"cu", "Dinamarca":"dk", "Dominica":"dm", "Ecuador":"ec", "Egipto":"eg", "El Salvador":"sv", "Emiratos Árabes":"ae", "Eritrea":"er", "Eslovaquia":"sk", "Eslovenia":"si", "España":"es", "Estados Unidos":"us", "Estonia":"ee", "Etiopía":"et", "Filipinas":"ph", "Finlandia":"fi", "Fiyi":"fj", "Francia":"fr", "Gabón":"ga", "Gambia":"gm", "Georgia":"ge", "Ghana":"gh", "Granada":"gd", "Grecia":"gr", "Guatemala":"gt", "Guinea":"gn", "Guinea Ecuatorial":"gq", "Guinea-Bisáu":"gw", "Guyana":"gy", "Haití":"ht", "Honduras":"hn", "Hungría":"hu", "India":"in", "Indonesia":"id", "Irak":"iq", "Irán":"ir", "Irlanda":"ie", "Islandia":"is", "Israel":"il", "Italia":"it", "Jamaica":"jm", "Japón":"jp", "Jordania":"jo", "Kazajistán":"kz", "Kenia":"ke", "Kirguistán":"kg", "Kiribati":"ki", "Kuwait":"kw", "Laos":"la", "Lesoto":"ls", "Letonia":"lv", "Líbano":"lb", "Liberia":"lr", "Libia":"ly", "Liechtenstein":"li", "Lituania":"lt", "Luxemburgo":"lu", "Macedonia del Norte":"mk", "Madagascar":"mg", "Malasia":"my", "Malaui":"mw", "Maldivas":"mv", "Malí":"ml", "Malta":"mt", "Marruecos":"ma", "Mauricio":"mu", "Mauritania":"mr", "México":"mx", "Micronesia":"fm", "Moldavia":"md", "Mónaco":"mc", "Mongolia":"mn", "Montenegro":"me", "Mozambique":"mz", "Namibia":"na", "Nauru":"nr", "Nepal":"np", "Nicaragua":"ni", "Níger":"ne", "Nigeria":"ng", "Nueva Zelanda":"nz", "Noruega":"no", "Omán":"om", "Países Bajos":"nl", "Pakistán":"pk", "Palaos":"pw", "Palestina":"ps", "Panamá":"pa", "Papúa Nueva Guinea":"pg", "Paraguay":"py", "Perú":"pe", "Polonia":"pl", "Portugal":"pt", "Reino Unido":"gb", "Puerto Rico":"pr", "Ruanda":"rw", "Rumania":"ro", "Rusia":"ru", "Samoa":"ws", "San Marino":"sm", "Santa Lucía":"lc", "Santo Tomé y Príncipe":"st", "San Vicente y las Granadinas":"vc", "Senegal":"sn", "Serbia":"rs", "Seychelles":"sc", "Sierra Leona":"sl", "Singapur":"sg", "Siria":"sy", "Somalia":"so", "Sudáfrica":"za", "Sudán":"sd", "Sudán del Sur":"ss", "Suecia":"se", "Suiza":"ch", "Surinam":"sr", "Esuatini":"sz", "Tayikistán":"tj", "Tanzania":"tz", "Tailandia":"th", "Timor Oriental":"tl", "Togo":"tg", "Tonga":"to", "Trinidad y Tobago":"tt", "Túnez":"tn", "Turquía":"tr", "Turkmenistán":"tm", "Tuvalu":"tv", "Ucrania":"ua", "Uganda":"ug", "Uruguay":"uy", "Uzbekistán":"uz", "Vanuatu":"vu", "Vaticano":"va", "Venezuela":"ve", "Vietnam":"vn", "Yemen":"ye", "Yibuti":"dj", "Zambia":"zm", "Zimbabue":"zw"
    };

    if (optionsBox && nativeSelect && displayBox) {
        optionsBox.innerHTML = '';
        Array.from(nativeSelect.options).forEach(opt => {
            if (!opt.value) return;
            const iso = isoMap[opt.text] || opt.value.replace('+','').toLowerCase();
            const div = document.createElement('div');
            div.className = 'phone-option';
            div.innerHTML = `<img src="https://flagcdn.com/w20/${iso}.png" style="width:18px;height:13px;object-fit:contain;border-radius:2px;"><span class="code" style="font-weight:600;min-width:30px;">${opt.value}</span><span class="country" style="color:#475569;font-size:0.8rem;">${opt.text}</span>`;
            div.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;cursor:pointer;border-bottom:1px solid #f1f5f9;transition:0.15s;';
            div.onmouseenter = () => div.style.background = '#f8fafc';
            div.onmouseleave = () => div.style.background = '';
            div.addEventListener('click', () => {
                nativeSelect.value = opt.value;
                flagImg.src = `https://flagcdn.com/w20/${iso}.png`;
                codeText.textContent = opt.value;
                countryText.textContent = opt.text;
                optionsBox.style.display = 'none';
            });
            optionsBox.appendChild(div);
        });
        displayBox.addEventListener('click', (e) => { e.stopPropagation(); optionsBox.style.display = optionsBox.style.display === 'block' ? 'none' : 'block'; });
        document.addEventListener('click', (e) => { if (!e.target.closest('.phone-dropdown-wrapper')) optionsBox.style.display = 'none'; });
    }

    // Vista Previa de Fotos
    const setupPreview = (idIn, idImg) => {
        const input = document.getElementById(idIn), preview = document.getElementById(idImg);
        if (!input || !preview) return;
        input.addEventListener('change', function() {
            const f = this.files[0];
            if (f) { 
                const r = new FileReader(); 
                r.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; }; 
                r.readAsDataURL(f); 
            } else preview.style.display = 'none';
        });
    };

    // Fotos Persona
    setupPreview('pv_foto_p_frontal', 'prev_p_frontal');
    setupPreview('pv_foto_p_izq', 'prev_p_izq');
    setupPreview('pv_foto_p_der', 'prev_p_der');
    // Fotos Vehículo
    setupPreview('pv_foto_v_frontal', 'prev_v_frontal');
    setupPreview('pv_foto_v_trasera', 'prev_v_trasera');
    setupPreview('pv_foto_v_der', 'prev_v_der');
    setupPreview('pv_foto_v_izq', 'prev_v_izq');

    // ==========================================
    // 🔹 3. VALIDACIÓN EN TIEMPO REAL
    // ==========================================
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    async function verificarDuplicado(inputId, msgId, tablas, columna) {
        const input = document.getElementById(inputId);
        const msgEl = document.getElementById(msgId);
        if (!input || !msgEl) return;

        const val = input.value.trim().toUpperCase();
        
        if (!val) {
            input.classList.remove('input-valid', 'input-error');
            msgEl.textContent = '';
            return;
        }

        msgEl.textContent = '🔍 Verificando...'; 
        msgEl.className = 'status-msg';
        
        try {
            let found = false;
            for (const tabla of tablas) {
                const { data, error } = await window.supabaseClient.from(tabla).select('id').ilike(columna, val).limit(1);
                if (error) throw error;
                if (data && data.length > 0) {
                    found = true;
                    break;
                }
            }

            if (found) {
                input.classList.add('input-error');
                input.classList.remove('input-valid');
                msgEl.textContent = '❌ Ya registrado'; 
                msgEl.className = 'status-msg error';
            } else {
                input.classList.add('input-valid');
                input.classList.remove('input-error');
                msgEl.textContent = '✅ Disponible'; 
                msgEl.className = 'status-msg valid';
            }
        } catch (e) {
            console.error("Error en validación:", e);
            msgEl.textContent = '⚠️ Error';
        }
    }

    // Listeners de Validación
    const validateCedula = debounce(() => verificarDuplicado('pv_p_cedula', 'pv-msg-cedula', ['registro_personas'], 'cedula'), 600);
    const elCedula = document.getElementById('pv_p_cedula');
    if (elCedula) elCedula.addEventListener('input', validateCedula);

    const validatePlaca = debounce(() => verificarDuplicado('pv_v_placa', 'pv-msg-placa', ['registro_motos', 'registro_automoviles'], 'placa'), 600);
    const elPlaca = document.getElementById('pv_v_placa');
    if (elPlaca) elPlaca.addEventListener('input', validatePlaca);

    const validateCarro = debounce(() => verificarDuplicado('pv_v_serial_carro', 'pv-msg-carro', ['registro_motos', 'registro_automoviles'], 'serial_carroceria'), 600);
    const elCarro = document.getElementById('pv_v_serial_carro');
    if (elCarro) elCarro.addEventListener('input', validateCarro);

    const validateMotor = debounce(() => verificarDuplicado('pv_v_serial_motor', 'pv-msg-motor', ['registro_motos', 'registro_automoviles'], 'serial_motor'), 600);
    const elMotor = document.getElementById('pv_v_serial_motor');
    if (elMotor) elMotor.addEventListener('input', validateMotor);

    // ==========================================
    // 🔹 4. ENVÍO DEL FORMULARIO
    // ==========================================
    const form = document.getElementById('form-reg-vinculado');
    const btn = form?.querySelector('.btn-submit');
    const msg = document.getElementById('msg-reg-vinculado');
    const mostrarError = (t) => { if(msg){msg.textContent='❌ '+t; msg.className='msg error'; msg.style.display='block';} };

    if (!form || !btn) return;

    // Inicializar
    cargarEstaciones();
    window.cargarMarcasPV();

    // ✅ VALIDACIÓN DE CAMPOS NUMÉRICOS (Cédula y Teléfono)
    const cedulaInput = document.getElementById('pv_p_cedula');
    const tlfNumInput = document.getElementById('pv_p_tlf_num');

    if (cedulaInput) {
        cedulaInput.addEventListener('input', e => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8);
        });
        cedulaInput.setAttribute('inputmode', 'numeric');
        cedulaInput.setAttribute('pattern', '\\d{7,8}');
    }

    if (tlfNumInput) {
        tlfNumInput.addEventListener('input', e => {
            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 20);
        });
        tlfNumInput.setAttribute('inputmode', 'numeric');
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }

        // Verificar errores de validación
        const inputsValidar = ['pv_p_cedula', 'pv_v_placa', 'pv_v_serial_carro', 'pv_v_serial_motor'];
        const hasError = inputsValidar.some(id => document.getElementById(id)?.classList.contains('input-error'));
        if (hasError) return mostrarError('Por favor corrija los campos marcados en rojo antes de registrar.');

        const cedula = document.getElementById('pv_p_cedula').value.trim();
        if (cedula.length < 7) return mostrarError('La cédula debe tener entre 7 y 8 dígitos.');

        // ✅ LEER VALORES CORRECTAMENTE AL MOMENTO DEL ENVÍO
        const complexionVal = document.getElementById('pv_p_complexion')?.value || null;
        const marcaCorporalVal = document.getElementById('pv_p_marca')?.value.trim() || null;
        
        const condMedicaSel = document.getElementById('pv_p_cond_medica')?.value;
        const condMedicaTxt = document.getElementById('pv_txt_cond')?.value.trim() || null;
        
        const medSel = document.getElementById('pv_p_medicamento')?.value;
        const medTxt = document.getElementById('pv_txt_med')?.value.trim() || null;
        
        const judSel = document.getElementById('pv_p_judicial')?.value;
        const judTxt = document.getElementById('pv_txt_jud')?.value.trim() || null;

        if (condMedicaSel === 'true' && !condMedicaTxt) return mostrarError('Describa la condición médica.');
        if (medSel === 'true' && !medTxt) return mostrarError('Ingrese el nombre del medicamento.');

        btn.disabled = true; btn.textContent = '⏳ Subiendo y Registrando...'; msg.style.display = 'none';

        try {
            const bucket = window.supabaseClient.storage.from('fotos_personas');
            const uid = sessionStorage.getItem('pnb_user_id') || 'user';
            const ts = Date.now();

            const uploadFile = async (inputId, suffix) => {
                const file = document.getElementById(inputId).files[0];
                if (!file) throw new Error('Falta fotografía: ' + inputId);
                const path = `${uid}/${ts}_${suffix}.jpg`;
                const { error } = await bucket.upload(path, file, { cacheControl: '3600' });
                if (error) throw error;
                return bucket.getPublicUrl(path).data.publicUrl;
            };

            const [
                fp_frontal, fp_izq, fp_der,
                fv_frontal, fv_trasera, fv_der, fv_izq
            ] = await Promise.all([
                uploadFile('pv_foto_p_frontal', 'pp_f'),
                uploadFile('pv_foto_p_izq', 'pp_i'),
                uploadFile('pv_foto_p_der', 'pp_d'),
                uploadFile('pv_foto_v_frontal', 'pv_f'),
                uploadFile('pv_foto_v_trasera', 'pv_t'),
                uploadFile('pv_foto_v_der', 'pv_rd'),
                uploadFile('pv_foto_v_izq', 'pv_ri')
            ]);

            const data = {
                // Persona
                primer_nombre: document.getElementById('pv_p_nombre1').value.trim(),
                segundo_nombre: document.getElementById('pv_p_nombre2').value.trim() || null,
                primer_apellido: document.getElementById('pv_p_apellido1').value.trim(),
                segundo_apellido: document.getElementById('pv_p_apellido2').value.trim() || null,
                cedula: cedula,
                fecha_nacimiento: document.getElementById('pv_p_fecha_nac').value,
                edad: parseInt(document.getElementById('pv_p_edad').value) || 0,
                apodo: document.getElementById('pv_p_apodo').value.trim() || null,
                nacionalidad: document.getElementById('pv_p_nacionalidad').value,
                sexo: document.getElementById('pv_p_sexo').value,
                direccion: document.getElementById('pv_p_direccion').value.trim() || null,
                tlf_pais: document.getElementById('pv_p_tlf_pais').value || null,
                tlf_numero: document.getElementById('pv_p_tlf_num').value.trim() || null,
                estatura_cm: window.convertirEstatura(),
                color_piel: document.getElementById('pv_p_color_piel').value,
                color_ojos: document.getElementById('pv_p_color_ojos').value,
                color_cabello: document.getElementById('pv_p_color_cabello').value,
                
                // ✅ MAPEO EXACTO Y SEGURO PARA CAMPOS QUE DABAN NULL
                complexion: complexionVal,
                marca_corporal: marcaCorporalVal,
                condicion_medica: condMedicaSel === 'true' ? condMedicaTxt : null,
                consume_medicamento: medSel === 'true' ? medTxt : null,
                problema_judicial: judSel === 'true' ? judTxt : null,

                usa_lentes: document.getElementById('pv_p_lentes').value === 'true',
                detalle_lentes: document.getElementById('pv_p_lentes').value === 'true' ? document.getElementById('pv_txt_lentes').value.trim() : null,
                perforaciones: document.getElementById('pv_p_perforaciones').value === 'true',
                detalle_perforaciones: document.getElementById('pv_p_perforaciones').value === 'true' ? document.getElementById('pv_txt_lugar_perforacion').value.trim() : null,
                
                foto_frontal_persona: fp_frontal,
                foto_perfil_izq_persona: fp_izq,
                foto_perfil_der_persona: fp_der,

                // Vehículo
                tipo_vehiculo: document.getElementById('pv_v_tipo').value,
                placa: document.getElementById('pv_v_placa').value.trim().toUpperCase(),
                serial_carroceria: document.getElementById('pv_v_serial_carro').value.trim(),
                serial_motor: document.getElementById('pv_v_serial_motor').value.trim() || null,
                cilindraje: document.getElementById('pv_v_cilindraje').value || null,
                color_vehiculo: document.getElementById('pv_v_color').value,
                anio_vehiculo: parseInt(document.getElementById('pv_v_anio').value),
                marca_vehiculo: document.getElementById('pv_v_marca').value,
                modelo_vehiculo: document.getElementById('pv_v_modelo').value,

                // Fotos Vehículo
                foto_frontal_vehiculo: fv_frontal,
                foto_trasera_vehiculo: fv_trasera,
                foto_lado_der_vehiculo: fv_der,
                foto_lado_izq_vehiculo: fv_izq,

                // Registro
                estacion_policial: document.getElementById('pv_estacion').value,
                direccion_detencion: document.getElementById('pv_dir_detencion').value.trim() || null,
                observaciones: document.getElementById('pv_observaciones').value.trim() || null
            };

            const { error } = await window.supabaseClient.from('registro_vinculado').insert([data]);
            if (error) throw error;

            msg.textContent = '✅ Registro vinculado creado exitosamente.'; 
            msg.className = 'msg success'; msg.style.display = 'block';
            setTimeout(() => msg.style.display = 'none', 4000);
            
            form.reset();
            document.querySelectorAll('.img-preview').forEach(i => i.style.display = 'none');
            document.querySelectorAll('.hidden-field').forEach(e => e.style.display = 'none');
            document.querySelectorAll('.input-valid, .input-error').forEach(i => i.classList.remove('input-valid', 'input-error'));
            document.querySelectorAll('.status-msg').forEach(m => m.textContent = '');
            
        } catch (err) {
            console.error('Error:', err);
            let m = 'Error inesperado.';
            if (err.message.includes('23505')) m = '❌ Esta cédula ya tiene un registro vinculado.';
            else if (err.message.includes('storage')) m = '❌ Error subiendo fotografías.';
            else if (err.message.includes('marca_corporal') || err.message.includes('complexion') || err.message.includes('condicion_medica')) {
                m = '❌ Error: La tabla en la base de datos no tiene todas las columnas necesarias. Ejecute el SQL de actualización.';
            }
            else m = '❌ ' + err.message;
            mostrarError(m);
        } finally {
            btn.disabled = false; btn.textContent = '✅ Registrar Persona y Vehículo';
        }
    });
};
