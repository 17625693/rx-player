/**
 * Copyright 2015 CANAL+ Group
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


const rBr = /<br[^>]+>/gm;
const rAbsTime = /^(([0-9]+):)?([0-9]+):([0-9]+)(\.([0-9]+))?$/;
const rRelTime = /(([0-9]+)(\.[0-9]+)?)(ms|h|m|s)/;

const escape = window.escape;

const MULTS = {
  h: 3600,
  m: 60,
  s: 1,
  ms: 0.001,
};

function parseTTML(ttml, lang, offset) {
  let doc;
  if (typeof ttml == "string") {
    doc = new DOMParser().parseFromString(ttml, "text/xml");
  } else {
    doc = ttml;
  }

  if (!(doc instanceof window.Document || doc instanceof window.HTMLElement)) {
    throw new Error("ttml needs a Document to parse");
  }

  const node = doc.querySelector("tt");
  if (!node) {
    throw new Error("ttml could not find <tt> tag");
  }

  const subs = parseChildren(node.querySelector("body"), 0);
  for (let i = 0; i < subs.length; i++) {
    const s = subs[i];
    s.start += offset;
    s.end += offset;
  }

  return subs;
}

// Parse the children of the given node recursively
function parseChildren(node, parentOffset) {
  let siblingOffset = 0;
  node = node.firstChild;
  const arr = [];
  let sub;

  while(node) {
    if (node.nodeType === 1) {
      switch(node.tagName.toUpperCase()) {
      case "P":
        // p is a textual node, process contents as subtitle
        sub = parseNode(node, parentOffset, siblingOffset);
        siblingOffset = sub.end;
        arr.push(sub);
        break;
      case "DIV":
        // div is container for subtitles, recurse
        let newOffset = parseTimestamp(node.getAttribute("begin"), 0);
        if (newOffset == null) {
          newOffset = parentOffset;
        }
        arr.push.apply(arr, parseChildren(node, newOffset));
        break;
      }
    }
    node = node.nextSibling;
  }

  return arr;
}

// Parse a node for text content
function parseNode(node, parentOffset, siblingOffset) {
  let start = parseTimestamp(node.getAttribute("begin"), parentOffset);
  let end = parseTimestamp(node.getAttribute("end"), parentOffset);
  const dur = parseTimestamp(node.getAttribute("dur"), 0);

  if (!typeof start == "number" &&
      !typeof end == "number" &&
      !typeof dur == "number") {
    throw new Error("ttml unsupported timestamp format");
  }

  if (dur > 0) {
    if (start == null) {
      start = siblingOffset || parentOffset;
    }
    if (end == null) {
      end = start + dur;
    }
  }
  else if (end == null) {
    // No end given, infer duration if possible
    // Otherwise, give end as MAX_VALUE
    end = parseTimestamp(node.getAttribute("duration"), 0);
    if (end >= 0) {
      end += start;
    } else {
      end = Number.MAX_VALUE;
    }
  }

  return {
    // Trim left and right whitespace from text and convert non-explicit line breaks
    id: node.getAttribute("xml:id") || node.getAttribute("id"),
    text: decodeURIComponent(escape(node.innerHTML.replace(rBr, "\n"))),
    start, end,
  };
}

// Time may be:
//   * absolute to timeline (hh:mm:ss.ms)
//   * relative (decimal followed by metric) ex: 3.4s, 5.7m
function parseTimestamp(time, offset) {
  if (!time) {
    return null;
  }

  let match;

  // Parse absolute times ISO 8601 format ([hh:]mm:ss[.mmm])
  match = time.match(rAbsTime);
  if (match) {
    const [,,h,m,s,,ms] = match;
    return (
      parseInt((h || 0), 10) * 3600 +
      parseInt(m, 10) * 60 +
      parseInt(s, 10) +
      parseFloat("0." + ms)
    );
  }

  // Parse relative times (fraction followed by a unit metric d.ddu)
  match = time.match(rRelTime);
  if (match) {
    const [,n,,,metric] = match;
    return parseFloat(n) * MULTS[metric] + offset;
  }

  return null;
}

module.exports = { parseTTML };
