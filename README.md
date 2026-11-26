# Roots & Rituals

CA1 project K3P26EP–14: Tribal Artisan Cultural Preservation and Fair Trade Exhibition System.

A frontend exhibition built with HTML, CSS and JavaScript. It includes five required art categories, filters, image zoom, room preview, folklore narration and artisan profiles, with fair-trade information.

Open index.html using Live Server. Narration MP3 files are generated with `node scripts/build-narration.cjs` (requires eSpeak and FFmpeg). The browser read-aloud option is a fallback. Source images need internet access. The exhibition links to official GI registration records for all five traditions, documented masterworks and artisan honours. GI registration concerns a craft tradition, not an individual object. Warli and Santhal images carry NGV non-commercial terms. The Gond painting has verified rights-holder permission (Wikimedia VRT ticket 2019031810003182, CC BY 4.0); the Bastar museum image has conditional Smithsonian educational-use terms. Pithora is represented by a link to the accessioned 2016 artwork by Mansingh Rathwa; the exhibition does not reproduce the image because permission from the underlying copyright holder is not established. Museum accessions, individual certificates and craft GI registrations are distinct. AI assistance was used in research and code development.

Team Artemis — assigned project responsibilities: Shridhar (Team Leader & Exhibition Designer); Abhinav Choudhary (Frontend & Interactive Features Developer); Swati (Cultural Research & Content Specialist). These are assigned roles, not a claim of equal completed contributions.

## Artwork provenance and rights register

| Tradition | Individual record | Reuse status |
| --- | --- | --- |
| Warli | [NGV Warli drawing, c. 1980](https://www.ngv.vic.gov.au/explore/collection/work/155150/) | Museum non-commercial full-image terms; maker not named |
| Gond | [Sarmaya 2015.2.24](https://sarmaya.in/objects/indigenous-tribal-art/untitled-tree-of-life-2/) | CC BY 4.0, VRT permission 2019031810003182; licensed source file 496 × 644 px |
| Bastar | [Smithsonian S1990.3a-g](https://asia-archive.si.edu/object/S1990.3a-g/) | Conditional non-commercial educational use, not CC0; maker not named |
| Santhal | [NGV 2011.315](https://www.ngv.vic.gov.au/explore/collection/work/99492/) | Museum non-commercial full-image terms; maker not named |
| Pithora | [Cambridge MAA 2016.212](https://collections.maa.cam.ac.uk/objects/561793/) | Link-only, no image reproduction until rights-holder permission is established |

Individual certificates of authenticity are not available in the source records; accession records document institutional provenance but do not replace certificates. No artwork is offered for sale and no claim of fair-trade or individual GI certification is made. For Pithora, Cambridge's [collection terms](https://collections.maa.cam.ac.uk/) require additional permission where applicable. 

## Validation

[GitHub Actions](https://github.com/abhinavchoudhary897-code/roots-and-rituals-ca1/actions) builds narration, checks JavaScript, runs Chromium acceptance tests, runs Lighthouse audits and checks museum image URLs before deploying. Fixture-based tests exercise UI behavior separately from network image validation. See each run for actual results.
