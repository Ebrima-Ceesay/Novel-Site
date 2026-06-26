function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove non-word chars
    .replace(/[\s_]+/g, '-')    // spaces/underscores to dashes
    .replace(/-+/g, '-');       // collapse multiple dashes
}

module.exports = { slugify };
