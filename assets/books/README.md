# The books by the fire

Twelve local text editions for Cozy Cabin. All text is from Standard Ebooks' public source repositories, pinned to the commits and reading-order files in `sources.json`. No cover art, illustrations, publisher logos, or modern third-party introductions are included. Original author front matter and notes from the chosen editions are retained where present. Text is converted to paragraphs and heading ranges; illustrations and facsimile typography are not reproduced.

Standard Ebooks states that its original contributions are dedicated under CC0 1.0 and its source works are believed to be in the United States public domain:
https://standardebooks.org/about/standard-ebooks-and-the-public-domain
https://creativecommons.org/publicdomain/zero/1.0/

This is a U.S. public-domain collection; the source editions' copyright status is not a claim about every jurisdiction.

The novels are complete text editions, not samples. *Little Women* includes both parts. *Frankenstein* includes Mary Shelley's own introduction and preface. *The Legend of Sleepy Hollow* is the complete story from *The Sketch Book of Geoffrey Crayon, Gent.* The Poe volume, *Tales by the Fire*, is an original selection of eight complete stories (not the complete collected fiction):

- The Fall of the House of Usher
- The Tell-Tale Heart
- The Black Cat
- The Masque of the Red Death
- The Cask of Amontillado
- The Pit and the Pendulum
- The Gold-Bug
- A Descent into the Maelström

`library.js` contains only shelf metadata. JSON texts are fetched on selection; the service worker stores all twelve in a separate, versioned offline cache during installation. Changing an edition's content requires a new book-cache version and a deliberate bookmark migration because bookmarks are character offsets. Ordinary app updates retain this cache and the existing local memory.

To reproduce the extraction, clone the repositories in `sources.json`, check out their pinned commits in a source directory, and run `python tools/import-books.py SOURCE_DIRECTORY`. The importer accepts repository basenames as checkout directories. It uses only Python's standard library. Source provenance and SHA-256 checksums are regenerated with the assets.
