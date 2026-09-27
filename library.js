export const shelf = [
  {
    "id": "willows",
    "title": "The Wind in the Willows",
    "author": "Kenneth Grahame",
    "color": "#3e5142"
  },
  {
    "id": "garden",
    "title": "The Secret Garden",
    "author": "Frances Hodgson Burnett",
    "color": "#667047"
  },
  {
    "id": "anne",
    "title": "Anne of Green Gables",
    "author": "L. M. Montgomery",
    "color": "#73503d"
  },
  {
    "id": "little-women",
    "title": "Little Women",
    "author": "Louisa May Alcott",
    "color": "#703d3f"
  },
  {
    "id": "oz",
    "title": "The Wonderful Wizard of Oz",
    "author": "L. Frank Baum",
    "color": "#64623e"
  },
  {
    "id": "alice",
    "title": "Alice’s Adventures in Wonderland",
    "author": "Lewis Carroll",
    "color": "#475d65"
  },
  {
    "id": "holmes",
    "title": "The Adventures of Sherlock Holmes",
    "author": "Arthur Conan Doyle",
    "color": "#584432"
  },
  {
    "id": "time-machine",
    "title": "The Time Machine",
    "author": "H. G. Wells",
    "color": "#534c62"
  },
  {
    "id": "dracula",
    "title": "Dracula",
    "author": "Bram Stoker",
    "color": "#572e31"
  },
  {
    "id": "frankenstein",
    "title": "Frankenstein",
    "author": "Mary Shelley",
    "color": "#414d40"
  },
  {
    "id": "sleepy-hollow",
    "title": "The Legend of Sleepy Hollow",
    "author": "Washington Irving",
    "color": "#805d37"
  },
  {
    "id": "poe",
    "title": "Tales by the Fire",
    "author": "Edgar Allan Poe",
    "color": "#3f4354"
  }
];

export function readBookmarks(raw) {
  const result = {};
  for (const {id} of shelf) {
    const n = raw?.[id];
    if (Number.isSafeInteger(n) && n >= -1 && n < 10000000) result[id] = n;
  }
  return result;
}
