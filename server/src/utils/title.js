// A title is optional. If it's blank, use the first words of the description.
function resolveTitle(title, description) {
  let t = typeof title === 'string' ? title.trim() : '';
  if (t) return t;
  let d = typeof description === 'string' ? description.trim().replace(/\s+/g, ' ') : '';
  if (!d) return '';
  return d.length > 60 ? d.slice(0, 57).trimEnd() + '…' : d;
}

module.exports = { resolveTitle };
