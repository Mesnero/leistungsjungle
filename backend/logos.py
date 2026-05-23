import os
import re
import urllib.request

kassen_data = {
    "aok_baden_w_rttemberg": { "name": "AOK Baden-Württemberg", "id": "234", "slug": "AOK_Baden_Wuerttemberg" },
    "aok_bayern": { "name": "AOK Bayern", "id": "235", "slug": "AOK_Bayern" },
    "aok_bremen_bremerhaven": { "name": "AOK Bremen/Bremerhaven", "id": "237", "slug": "AOK_Bremen_Bremerhaven" },
    "aok_hessen": { "name": "AOK Hessen", "id": "239", "slug": "AOK_Hessen" },
    "aok_niedersachsen": { "name": "AOK Niedersachsen", "id": "241", "slug": "AOK_Niedersachsen" },
    "aok_nordost": { "name": "AOK Nordost", "id": "1209", "slug": "AOK_Nordost" },
    "aok_nordwest": { "name": "AOK NordWest", "id": "249", "slug": "AOK_NordWest" },
    "aok_plus": { "name": "AOK PLUS", "id": "245", "slug": "AOK_PLUS" },
    "aok_rheinland_hamburg": { "name": "AOK Rheinland/Hamburg", "id": "242", "slug": "AOK_Rheinland_Hamburg" },
    "aok_rheinland_pfalz_saarland": { "name": "AOK Rheinland-Pfalz/Saarland", "id": "243", "slug": "AOK_Rheinland_Pfalz_Saarland" },
    "aok_sachsen_anhalt": { "name": "AOK Sachsen-Anhalt", "id": "246", "slug": "AOK_Sachsen_Anhalt" },
    "audi_bkk": { "name": "Audi BKK", "id": "4", "slug": "Audi_BKK" },
    "barmer": { "name": "BARMER", "id": "250", "slug": "BARMER" },
    "bergische_krankenkasse": { "name": "BERGISCHE KRANKENKASSE", "id": "27", "slug": "BERGISCHE_KRANKENKASSE" },
    "bertelsmann_bkk": { "name": "Bertelsmann BKK", "id": "1115", "slug": "Bertelsmann_BKK" },
    "big_direkt_gesund": { "name": "BIG direkt gesund", "id": "262", "slug": "BIG_direkt_gesund" },
    "bkk24": { "name": "BKK24", "id": "12", "slug": "BKK24" },
    "bkk_akzo_nobel_bayern": { "name": "BKK Akzo Nobel Bayern", "id": "21", "slug": "BKK_Akzo_Nobel_Bayern" },
    "bkk_b_braun_aesculap": { "name": "BKK B. Braun Aesculap", "id": "1131", "slug": "BKK_B_Braun_Aesculap" },
    "bkk_d_rkoppadler": { "name": "BKK DürkoppAdler", "id": "56", "slug": "BKK_DuerkoppAdler" },
    "bkk_diakonie": { "name": "BKK Diakonie", "id": "29", "slug": "BKK_Diakonie" },
    "bkk_euregio": { "name": "BKK EUREGIO", "id": "20", "slug": "BKK_EUREGIO" },
    "bkk_ewe": { "name": "BKK EWE", "id": "1137", "slug": "BKK_EWE" },
    "bkk_exklusiv": { "name": "BKK exklusiv", "id": "69", "slug": "BKK_exklusiv" },
    "bkk_faber_castell_partner": { "name": "BKK Faber-Castell & Partner", "id": "70", "slug": "BKK_Faber_Castell_Partner" },
    "bkk_firmus": { "name": "BKK firmus", "id": "187", "slug": "BKK_firmus" },
    "bkk_freudenberg": { "name": "BKK Freudenberg", "id": "119", "slug": "BKK_Freudenberg" },
    "bkk_gildemeister_seidensticker": { "name": "BKK GILDEMEISTER SEIDENSTICKER", "id": "124", "slug": "BKK_GILDEMEISTER_SEIDENSTICKER" },
    "bkk_groz_beckert": { "name": "BKK Groz-Beckert", "id": "1141", "slug": "BKK_Groz_Beckert" },
    "bkk_herkules": { "name": "BKK HERKULES", "id": "130", "slug": "BKK_HERKULES" },
    "bkk_karl_mayer": { "name": "BKK KARL MAYER", "id": "1144", "slug": "BKK_KARL_MAYER" },
    "bkk_linde": { "name": "BKK Linde", "id": "1150", "slug": "BKK_Linde" },
    "bkk_mahle": { "name": "BKK MAHLE", "id": "1151", "slug": "BKK_MAHLE" },
    "bkk_melitta_hmr": { "name": "bkk melitta hmr", "id": "385", "slug": "bkk_melitta_hmr" },
    "bkk_merck": { "name": "BKK Merck", "id": "1152", "slug": "BKK_Merck" },
    "bkk_miele": { "name": "BKK Miele", "id": "1153", "slug": "BKK_Miele" },
    "bkk_mtu": { "name": "BKK MTU", "id": "1154", "slug": "BKK_MTU" },
    "bkk_pfaff": { "name": "BKK PFAFF", "id": "158", "slug": "BKK_PFAFF" },
    "bkk_pfalz": { "name": "BKK Pfalz", "id": "159", "slug": "BKK_Pfalz" },
    "bkk_provita": { "name": "BKK ProVita", "id": "383", "slug": "BKK_ProVita" },
    "bkk_public": { "name": "BKK Public", "id": "162", "slug": "BKK_Public" },
    "bkk_pwc": { "name": "BKK PwC", "id": "1156", "slug": "BKK_PwC" },
    "bkk_rieker_ricosta_weisser": { "name": "BKK Rieker.Ricosta.Weisser", "id": "1157", "slug": "BKK_Rieker_Ricosta_Weisser" },
    "bkk_salzgitter": { "name": "BKK Salzgitter", "id": "1159", "slug": "BKK_Salzgitter" },
    "bkk_sbh": { "name": "BKK SBH", "id": "176", "slug": "BKK_SBH" },
    "bkk_scheufelen": { "name": "BKK Scheufelen", "id": "394", "slug": "BKK_Scheufelen" },
    "bkk_technoform": { "name": "BKK Technoform", "id": "181", "slug": "BKK_Technoform" },
    "bkk_vdn": { "name": "BKK VDN", "id": "189", "slug": "BKK_VDN" },
    "bkk_verbundplus": { "name": "BKK VerbundPlus", "id": "64", "slug": "BKK_VerbundPlus" },
    "bkk_w_rth": { "name": "BKK Würth", "id": "1173", "slug": "BKK_Wuerth" },
    "bkk_werra_meissner": { "name": "BKK Werra-Meissner", "id": "194", "slug": "BKK_Werra_Meissner" },
    "bkk_wirtschaft_finanzen": { "name": "BKK WIRTSCHAFT & FINANZEN", "id": "1147", "slug": "BKK_WIRTSCHAFT_FINANZEN" },
    "bmw_bkk": { "name": "BMW BKK", "id": "1129", "slug": "BMW_BKK" },
    "bosch_bkk": { "name": "Bosch BKK", "id": "199", "slug": "Bosch_BKK" },
    "continentale_bkk": { "name": "Continentale BKK", "id": "160", "slug": "Continentale_BKK" },
    "dak_gesundheit": { "name": "DAK Gesundheit", "id": "251", "slug": "DAK_Gesundheit" },
    "debeka_bkk": { "name": "Debeka BKK", "id": "1119", "slug": "Debeka_BKK" },
    "energie_bkk": { "name": "energie-BKK", "id": "1112", "slug": "energie_BKK" },
    "ernst_young_bkk": { "name": "Ernst & Young BKK", "id": "1136", "slug": "Ernst_Young_BKK" },
    "heimat_krankenkasse": { "name": "Heimat Krankenkasse", "id": "1211", "slug": "Heimat_Krankenkasse" },
    "hek_hanseatische_krankenkasse": { "name": "HEK - Hanseatische Krankenkasse", "id": "254", "slug": "HEK_Hanseatische_Krankenkasse" },
    "hkk_krankenkasse": { "name": "hkk Krankenkasse", "id": "261", "slug": "hkk_Krankenkasse" },
    "ikk_brandenburg_und_berlin": { "name": "IKK Brandenburg und Berlin", "id": "265", "slug": "IKK_Brandenburg_und_Berlin" },
    "ikk_classic": { "name": "IKK classic", "id": "283", "slug": "IKK_classic" },
    "ikk_die_innovationskasse": { "name": "IKK - Die Innovationskasse", "id": "382", "slug": "IKK_Die_Innovationskasse" },
    "ikk_gesund_plus": { "name": "IKK gesund plus", "id": "279", "slug": "IKK_gesund_plus" },
    "ikk_s_dwest": { "name": "IKK Südwest", "id": "277", "slug": "IKK_Suedwest" },
    "kkh_kaufm_nnische_krankenkasse": { "name": "KKH Kaufmännische Krankenkasse", "id": "257", "slug": "KKH_Kaufmaennische_Krankenkasse" },
    "knappschaft": { "name": "KNAPPSCHAFT", "id": "1187", "slug": "KNAPPSCHAFT" },
    "koenig_bauer_bkk": { "name": "Koenig & Bauer BKK", "id": "1145", "slug": "Koenig_Bauer_BKK" },
    "krones_bkk": { "name": "Krones BKK", "id": "1148", "slug": "Krones_BKK" },
    "landwirtschaftliche_krankenkasse_lkk": { "name": "Landwirtschaftliche Krankenkasse - LKK", "id": "1215", "slug": "Landwirtschaftliche_Krankenkasse_LKK" },
    "mercedes_benz_bkk": { "name": "Mercedes-Benz BKK", "id": "1176", "slug": "Mercedes_Benz_BKK" },
    "mhplus_krankenkasse": { "name": "mhplus Krankenkasse", "id": "216", "slug": "mhplus_Krankenkasse" },
    "mkk_meine_krankenkasse": { "name": "mkk - meine krankenkasse", "id": "190", "slug": "mkk_meine_krankenkasse" },
    "mobil_krankenkasse": { "name": "Mobil Krankenkasse", "id": "148", "slug": "Mobil_Krankenkasse" },
    "novitas_bkk": { "name": "novitas bkk", "id": "219", "slug": "novitas_bkk" },
    "pronova_bkk": { "name": "Pronova BKK", "id": "1189", "slug": "Pronova_BKK" },
    "r_v_betriebskrankenkasse": { "name": "R+V Betriebskrankenkasse", "id": "165", "slug": "R_V_Betriebskrankenkasse" },
    "s_dzucker_bkk": { "name": "Südzucker-BKK", "id": "1179", "slug": "Suedzucker_BKK" },
    "salus_bkk": { "name": "Salus BKK", "id": "220", "slug": "Salus_BKK" },
    "sbk": { "name": "SBK", "id": "222", "slug": "SBK" },
    "securvita_krankenkasse": { "name": "SECURVITA Krankenkasse", "id": "224", "slug": "SECURVITA_Krankenkasse" },
    "skd_bkk": { "name": "SKD BKK", "id": "226", "slug": "SKD_BKK" },
    "techniker_krankenkasse_tk": { "name": "Techniker Krankenkasse (TK)", "id": "258", "slug": "TK" },
    "tui_bkk": { "name": "TUI BKK", "id": "185", "slug": "TUI_BKK" },
    "viactiv_krankenkasse": { "name": "VIACTIV Krankenkasse", "id": "193", "slug": "VIACTIV_Krankenkasse" },
    "vivida_bkk": { "name": "vivida bkk", "id": "1218", "slug": "vivida_bkk" },
    "wmf_bkk": { "name": "WMF BKK", "id": "232", "slug": "WMF_BKK" },
    "zf_bkk": { "name": "ZF BKK", "id": "392", "slug": "ZF_BKK" }
}

current_dir = os.path.dirname(os.path.abspath(__file__))
target_dir = os.path.join(current_dir, "Logos")
os.makedirs(target_dir, exist_ok=True)

print(f"🚀 Starte Download im Backend. Speicherort: {target_dir}\n")

opener = urllib.request.build_opener()
opener.addheaders = [('User-agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')]
urllib.request.install_opener(opener)

success_count = 0
fail_count = 0

for key, kasse in kassen_data.items():
    safe_filename = kasse["name"].replace("/", "_").replace("&", "und").replace(" ", "_")
    safe_filename = re.sub(r'[\\/*?:"<>|]', "", safe_filename)
    
    source_url = f"https://www.krankenkassen.de/download/krankenkassen-logo/{kasse['id']}/{kasse['slug']}_logo.svg"
    local_filepath = os.path.join(target_dir, f"{safe_filename}.svg")
    
    try:
        urllib.request.urlretrieve(source_url, local_filepath)
        print(f"✅ Geladen: {kasse['name']} -> Logos/{safe_filename}.svg")
        success_count += 1
    except Exception:
        try:
            fallback_url = f"https://www.krankenkassen.de/download/krankenkassen-logo/{kasse['id']}/{kasse['slug']}.svg"
            urllib.request.urlretrieve(fallback_url, local_filepath)
            print(f"✅ Geladen (Fallback): {kasse['name']} -> Logos/{safe_filename}.svg")
            success_count += 1
        except Exception:
            print(f"❌ Fehler bei {kasse['name']} (ID: {kasse['id']})")
            fail_count += 1

print(f"\n🎯 Download beendet! Erfolgreich: {success_count} | Fehler: {fail_count}")