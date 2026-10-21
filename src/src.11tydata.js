// Picks the text file (de.yml or en.yml) for each page from its `lang` front matter.
export default {
  eleventyComputed: {
    t: (data) => data[data.lang],
    home: (data) => (data.lang === "en" ? "/en/" : "/"),
  },
};
