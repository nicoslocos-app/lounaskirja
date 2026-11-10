# Lounaskirja · yhteinen keittiön tunnus

Kaikki käyttävät nyt samaa käyttäjätunnusta ja salasanaa. Kaikilla kirjautuneilla on oikeudet kirjauksiin, resepteihin, listoihin, tilastoihin, asetuksiin, vientiin ja historiapalautukseen. Erillisiä työntekijätunnuksia tai Supabase Auth -kirjautumista ei tarvita. Muutoksia ei voi kohdistaa yksittäiseen työntekijään.

Avaa `ALOITA_TASTA.html` tai seuraa alla olevia kolmea vaihetta. Salasana asetetaan Netlifyssä, ei lähdekoodissa tai GitHubissa. Paketissa ei ole oletussalasanaa.

## Päivitä jo olemassa oleva sovelluksesi

1. **Supabase → SQL Editor → New query:** kopioi paketin `supabase/04-yhteinen-tunnus.sql`-tiedoston KOKO sisältö ja paina Run. Tämä lisää yhteisen kirjautumisen tarvitsemat tietokantatoiminnot ja istuntotaulun. Se ei poista tai muuta nykyisiä lounaita, reseptejä tai käyttäjiä. Älä aja `01-tietokanta.sql`-tiedostoa uudelleen olemassa olevaan kantaan.
2. **GitHub:** lataa puretun uuden `lounaskirja`-kansion sisältö nykyisen lounaskirja-repositorion juureen. Hyväksy samannimisten tiedostojen korvaaminen Commit changes -toiminnolla. Mukaan pitää tulla erityisesti `src/api.mjs`, uusi `src/shared-auth.mjs` ja `public/app.js`. Käytä koko päivitettyä pakettia, jotta backend ja käyttöliittymä vastaavat toisiaan.
3. **Netlify → Environment variables:** lisää `APP_PASSWORD`, jonka arvoksi annat yhteisen, vähintään 12 merkin salasanan. Käyttäjätunnus on valmiiksi **lounas**. Halutessasi voit muuttaa sen lisäämällä muuttujan `APP_USERNAME`. Säilytä `SUPABASE_URL` ja `SUPABASE_SECRET_KEY` ennallaan. Vanhaa `SUPABASE_PUBLISHABLE_KEY`-arvoa ei enää käytetä, mutta sen voi jättää paikalleen. Valitse Functions-scope ja Production. Käynnistä uusi julkaisu Deploys → Trigger deploy.

Avaa tämän jälkeen sovelluksen verkkolinkki ja kirjaudu tunnuksella `lounas` sekä Netlifyyn asettamallasi salasanalla. Jos olet jo kirjautunut vanhaan versioon, päivitä sivu: se pyytää uuden kirjautumisen.

**Älä poista tai luo Supabasen Authentication-käyttäjiä tämän takia.** Niitä ei käytetä uudessa kirjautumisessa. `02-yllapitaja.sql` on aiemman version tiedosto eikä sitä tarvitse ajaa.

## Kokonaan uusi asennus

1. Luo erillinen Supabase-projekti. Aja SQL Editorissa ensin `supabase/01-tietokanta.sql` ja sitten `supabase/04-yhteinen-tunnus.sql`. Ensimmäinen luo ravintolan taulut; neljäs ottaa yhteisen kirjautumisen käyttöön. Tiedostoa `02-yllapitaja.sql` ei tarvita.
2. Luo uusi yksityinen GitHub-repositorio ja lataa puretun `lounaskirja`-kansion sisältö juureen. ZIP-tiedostoa ei ladata sellaisenaan. `netlify.toml` ja `package.json` näkyvät repositorion etusivulla.
3. Netlify → Import an existing project → GitHub → valitse repositorio. Base directory tyhjä, Build command `npm run build`, Publish directory `public`, Functions `netlify/functions`.
4. Lisää Netlifyyn muuttujat alla olevasta taulukosta (Functions / Production), julkaise ja avaa Netlifyn antama HTTPS-osoite. Tietokoneelle ei tarvitse asentaa Nodea tai käyttää terminaalia.

| Netlifyn muuttuja | Arvo |
| --- | --- |
| `SUPABASE_URL` | Supabasen Project URL, muotoa `https://…supabase.co` |
| `SUPABASE_SECRET_KEY` | Supabasen Settings → API Keys → Secret key (`sb_secret_…`; vanha service_role käy myös) |
| `APP_PASSWORD` | Yhteinen salasana, 12–256 merkkiä, ei alku- tai loppuvälilyöntejä |
| `APP_USERNAME` | Valinnainen; jos puuttuu, tunnus on `lounas` |

Secret key ja salasana kuuluvat vain Netlifyn ympäristömuuttujiin. Ne eivät kuulu GitHubiin, HTML:ään tai selainkoodiin.

## Salasanan vaihtaminen myöhemmin

Muuta Netlifyssä `APP_PASSWORD` ja käynnistä uusi julkaisu. Jokaisen täytyy tämän jälkeen kirjautua uudella salasanalla. Vanhat istunnot hylätään palvelimella. Tietokanta- tai Supabase Auth -käyttäjiä ei tarvitse muuttaa. Myös käyttäjätunnuksen tai palvelinavaimen vaihto katkaisee vanhat istunnot.

## Mukana olevat toiminnot

- Suomenkielinen lounaskirjaus, tämän päivän esivalinta Helsinki-ajassa, kalenteritiedot ja Suomen liikkuvat/fiksatut pyhät.
- Syöjät yhteensä ja niihin sisältyvät sopimusruokailijat. Kolme kategoriaa: proteiini, hiilihydraatti ja vegaaninen.
- Monta ruokalajia kategoriassa, listalta tai käsin. Lounaslistan esitäyttö uusille kirjauksille.
- Ylijäämä 0,25 GN:n välein, erikseen kategorioittain. Vakioastia määritellään asetuksissa, ei oletusta kilogrammoista.
- Poikkeuspäivät ja sulut; sulkupäivät eivät kuulu palvelukeskiarvoihin.
- Yksi palvelu päivässä, tallennusten muokkaus ja samanaikaisten muutosten versiotarkistus.
- Reseptit raaka-aineineen, määrineen, yksiköineen ja ohjeineen. Annosskaalaus, proteiinilähdehaku, kategoria- ja vahvistetun ruokavalion suodatus. Valinnainen enintään 200 kt JPG/PNG/WebP-kuva.
- Ma–pe-viikkolista, muokattava / arkistoitava ruokalajiluettelo.
- Rajattavat tilastot, täsmälliset luvut, pylväskaaviot, kokonaismäärät ja keskiarvot sekä CSV-vienti.
- Yhteinen keittiön tunnus, ravintola-asetukset, JSON-varmistus ja aiempien versioiden palautus.
- Kotinäytölle lisättävän sovelluksen manifesti. Ei offline-tallennuksia.

Kirjautunut henkilökunta muokkaa reseptejä ja vahvistaa allergeenit/ruokavaliot. Tyhjä allergeenilista ei tarkoita allergeenittomuutta. Tarkista aina todelliset raaka-aineet, pakkausmerkinnät ja ristikontaminaation riskit.

## Kirjautumisen toteutus

Netlify Function tarkistaa käyttäjätunnuksen ja salasanan palvelimella. Salasanoja verrataan scrypt-avainten avulla; raakaa salasanaa ei lähetetä selaimeen eikä tallenneta tietokantaan. Kirjautumislomake lähettää sen saman sivuston HTTPS-rajapintaan.

Onnistunut kirjautuminen luo 256-bittisen satunnaisen istuntotunnisteen. Selaimessa se on HttpOnly-, SameSite=Strict- ja HTTPS:llä Secure-evästeessä. Tietokannassa on vain tunnisteen SHA-256-tiiviste sekä palvelinavaimella suojattu kirjautumisasetusten HMAC-tiiviste. Istunto vanhenee 12 tunnissa. Uloskirjautuminen poistaa juuri kyseisen laitteen istunnon tietokannasta; muut voivat jatkaa.

`app_sessions`-taulussa on RLS ja anon/authenticated-rooleilta on poistettu oikeudet. Samoin uuden `save_shared_record`- ja `create_shared_session`-funktion suoritus on rajattu palvelinroolille. API vaatii kelvollisen istunnon kaikkiin ravintolatietoihin. `profiles` ja Auth-käyttäjät säilyvät aiemman version yhteensopivuutta varten, mutta uusi API ei käytä niitä. Tietokantaan pääsee vain Netlify Functionin kautta; selaimelle ei anneta Supabasen salaista avainta.

Kirjautumisessa on 10 yrityksen raja / 15 minuuttia per IP. Väärän salasanan jälkeen pitää tarvittaessa odottaa rajan nollautumista. API tarkistaa alkuperän, sisällön koon ja tietosisällöt. Päivämäärän tuplakirjaus ja toisen laitteen vanhentunut muokkaus hylätään. Aiemmat versiot säilyvät historiassa. Yhteisen tunnuksen uusissa muokkauksissa ei ole henkilökohtaista tekijää.

## Varmuuskopiointi ja palautus

### Päivittäiset virheet

Ylläpito → Avaa muutoshistoria → Näytä aiempi sisältö → Palauta tämä versio. Muutos palautetaan uutena versiona ja korvattu sisältö jää historiaan. Arkistointi ei muuta vanhoja päiväkirjauksia.

### Sisältövarmistus

Ylläpito → **Lataa JSON-varmuuskopio**. Tallenna kopio säännöllisesti ja aina ennen suuria muutoksia erilliseen suojattuun paikkaan. Tiedosto sisältää lounaat, viikkolistat, reseptit ainesosineen, ruokalajit, asetukset ja historian. Käyttäjäprofiileja, salasanoja ja istuntoja se ei sisällä. Vientiskeema on nyt `schema: 2`, ja `data`-kentät ovat JSON-objekteja, eivät JSON-tekstiä.

Tilastot → **Lataa CSV** vie valitun rajauksen Exceliin sopivassa muodossa (UTF-8 BOM, puolipisteet, desimaalipilkku). Reseptien ja ruokalajien siirrettävä muoto on JSON.

### Sisällön palautus JSONista

Mukana on `VARMUUSKOPION_PALAUTUS.html`, joka toimii omalla koneella selaimessa. Se lukee tämän Supabase-version JSON-varmistuksen paikallisesti ja tekee palautus-SQL:n; tiedostoa ei lähetetä mihinkään. **SQL korvaa nykyiset lounaat, listat, reseptit, ruokalajit, asetukset ja historian**. Käyttäjiä tai Supabase Authia se ei korvaa. Historiarivien tekijä asetetaan palautuksessa tyhjäksi, jotta palautus onnistuu myös erilliseen testiprojektiin.

1. Ota ensin nykytilasta JSON-varmistus. Säilytä sekä nykyinen että palautettava kopio.
2. Avaa palautustyökalu, valitse palautettava JSON ja lataa SQL.
3. Harjoittele palautus ensin ERILLISESSÄ Supabase-testiprojektissa, johon on ajettu `01-tietokanta.sql`.
4. Avaa ladattu SQL tekstieditorissa, liitä koko sisältö Supabasen SQL Editoriin ja suorita. Muutokset ovat yksi transaktio: virhe peruu koko sisältöpalautuksen.
5. Päivitä sovellus ja tarkista määrät sekä reseptit ennen käytön jatkamista. Palautuksen aikana ei pidä tehdä uusia kirjauksia.

Tämä työkalu hyväksyy vain tämän Supabase-version `schema: 2` -varmistukset. Aiemman Cloudflare-version mahdollinen sisältö vaatii erillisen siirron; sitä ei poisteta tai muuteta tällä paketilla.

### Koko projektin varmistus

Sisältö-JSON ei korvaa Supabasen koko projektin varmuuskopiota. Supabase suosittelee Free-projekteille säännöllisiä erillisiä tietokantavientejä. Hallinnoijan / teknisen ylläpitäjän ohje: https://supabase.com/docs/guides/platform/backups . Koko projektin palautuksessa on huomioitava myös Auth-käyttäjät ja profiilit. Älä pidä salasanoja tai API-avaimia GitHubissa.

## Testaus

Suoritetut testit kattavat yhteisen kirjautumisen, väärän tunnuksen/salasanan, kahden erillisen laitteen istunnot, vanhentumisen, uloskirjautumisen, salasanan vaihdon vaikutuksen, CSRF:n, kirjauksen luomisen ja muokkaamisen, tuplapäivän eston, versioristiriidan, reseptivalidoinnin, viennin ja historiapalautuksen. Uutta kirjautumista testataan oikealla PostgreSQL-skeemalla PGlitessä ilman Supabase Auth -jäljitelmää. Oikea Netlify/Supabase-pilviyhteys varmennetaan omassa julkaisussasi.

Kehittäjälle (Node 22+):

```sh
npm ci
npm run build
npm test
npm run test:integration
```

Paikalliseen kehitykseen kopioi `.env.example` tiedostoksi `.env` ja aseta TESTIprojektin oikeat arvot; sitten `npm run dev`. Tämä ei ole tarpeen dashboard-asennuksessa.

## Ylläpito ja kulut

GitHub, Netlify ja Supabase tarjoavat ilmaistasot. Pieni käyttö voi mahtua niihin, mutta maksuttomuutta tai keskeytymätöntä palvelua ei luvata. Seuraa käyttörajoja, ota varmistukset ja testaa palautus. Supabasen Free-projekti voi keskeytyä vähäisen käytön jälkeen. Netlifyn kiintiötä kuluttavat myös julkaisut. Ei maksullisia AI-palveluita.

Valinnainen testiresepti on `supabase/03-testiresepti.sql`; se ei luo keksittyjä lounastilastoja. Yksi ravintola, yksi palvelu päivässä. Ei offline-tallennusta. GN-määriä ei muuteta kiloiksi tai yksittäisten buffetruokien kulutukseksi.
