import { App, Editor, Modal, Notice, SuggestModal, requestUrl } from "obsidian";
import type ESVBiblePlugin from "../main";
import { findTopics } from "./topics";

export interface SearchResult {
  reference: string;
  content: string;
  /** From the built-in topic map rather than the ESV keyword search. */
  curated: boolean;
  /** The user typed a reference (e.g. "John 3:16"); skip searching. */
  direct?: boolean;
}

const ESV_API = "https://api.esv.org/v3/passage";
const DEBOUNCE_MS = 400;
const SNIPPET_MAX = 300;

const STOPWORDS = new Set([
  "a", "an", "the", "of", "to", "in", "on", "for", "about", "regarding", "with",
  "and", "or", "is", "are", "be", "being", "that", "which", "what", "how", "where",
  "does", "do", "it", "its", "i", "my", "me", "we", "you", "your", "can", "please",
  "find", "show", "get", "give", "search", "look", "looking", "need", "want",
  "some", "any", "says", "say", "said", "verse", "verses", "passage", "passages",
  "scripture", "scriptures", "bible", "there", "one",
]);

/** Strips filler like "find me the verse about" and returns the meaningful words. */
export function normalizeQuery(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STOPWORDS.has(word));
}

const REFERENCE_PATTERN =
  /^(?:[1-3]\s*)?[a-z]+(?:\s+of\s+[a-z]+)?\.?\s+\d{1,3}(?::\d{1,3}(?:\s*[-–]\s*\d{1,3})?)?$/i;

/** True for input like "John 3:16", "1 Cor 13", or "Song of Solomon 2:4". */
export function looksLikeReference(query: string): boolean {
  return REFERENCE_PATTERN.test(query.trim());
}

interface ParsedRef {
  book: string;
  chapter: number;
  start: number;
  end: number;
}

function parseRef(reference: string): ParsedRef | null {
  const match = reference
    .trim()
    .match(/^(.+?)\s+(\d{1,3})(?::(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?$/);
  if (!match) return null;
  const start = match[3] ? parseInt(match[3], 10) : 1;
  const end = match[3] ? (match[4] ? parseInt(match[4], 10) : start) : 999;
  return { book: match[1].toLowerCase(), chapter: parseInt(match[2], 10), start, end };
}

function overlaps(a: string, b: string): boolean {
  if (a.toLowerCase() === b.toLowerCase()) return true;
  const pa = parseRef(a);
  const pb = parseRef(b);
  if (!pa || !pb) return false;
  return (
    pa.book === pb.book &&
    pa.chapter === pb.chapter &&
    pa.start <= pb.end &&
    pb.start <= pa.end
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const searchCache = new Map<string, SearchResult[]>();

/**
 * GET against the ESV API. Returns null on failure. `reportError` lets a caller
 * make several requests but show only one error notice.
 */
async function esvGet(
  plugin: ESVBiblePlugin,
  endpoint: "search" | "text",
  params: Record<string, string>,
  reportError: (message: string) => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | null> {
  try {
    const response = await requestUrl({
      url: `${ESV_API}/${endpoint}/?${new URLSearchParams(params).toString()}`,
      method: "GET",
      headers: { Authorization: `Token ${plugin.settings.apiKey}` },
    });
    return response.json;
  } catch (error) {
    const status = (error as { status?: number }).status;
    if (status === 429) {
      reportError("ESV API rate limit reached. Wait a moment and try again.");
    } else if (status === 401 || status === 403) {
      reportError("ESV API rejected your key. Check it in the plugin settings.");
    } else {
      reportError(`Search failed: ${(error as Error).message}`);
    }
    return null;
  }
}

/** Fetches plain-text snippets for curated references in one request. */
async function fetchSnippets(
  plugin: ESVBiblePlugin,
  references: string[],
  reportError: (message: string) => void
): Promise<string[]> {
  if (references.length === 0) return [];
  const json = await esvGet(
    plugin,
    "text",
    {
      q: references.join(";"),
      "include-passage-references": "false",
      "include-verse-numbers": "false",
      "include-footnotes": "false",
      "include-headings": "false",
      "include-short-copyright": "false",
    },
    reportError
  );
  const passages: string[] | undefined = json?.passages;
  // One passage per reference; if the counts disagree we can't pair them safely.
  if (!passages || passages.length !== references.length) {
    return references.map(() => "");
  }
  return passages.map((p) => truncate(p.replace(/\s+/g, " ").trim()));
}

function truncate(text: string): string {
  return text.length > SNIPPET_MAX ? text.slice(0, SNIPPET_MAX).trimEnd() + "…" : text;
}

async function keywordSearch(
  plugin: ESVBiblePlugin,
  query: string,
  limit: number,
  reportError: (message: string) => void
): Promise<SearchResult[]> {
  const json = await esvGet(
    plugin,
    "search",
    { q: query, "page-size": String(limit) },
    reportError
  );
  const results: { reference: string; content: string }[] = json?.results ?? [];
  return results.map((r) => ({
    reference: r.reference,
    content: truncate(r.content.replace(/\s+/g, " ").trim()),
    curated: false,
  }));
}

/**
 * Natural-language verse search: curated topic matches first, then live ESV
 * keyword results, de-duplicated and capped at `limit`.
 */
export async function searchVerses(
  plugin: ESVBiblePlugin,
  rawQuery: string,
  limit: number
): Promise<SearchResult[]> {
  const terms = normalizeQuery(rawQuery);
  if (terms.length === 0) return [];

  if (!plugin.settings.apiKey) {
    new Notice("Please set your ESV API key in the plugin settings");
    return [];
  }

  const cacheKey = `${limit}|${terms.join(" ")}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  let errorShown = false;
  const reportError = (message: string) => {
    if (errorShown) return;
    errorShown = true;
    new Notice(message);
  };

  const topics = findTopics(terms, rawQuery);
  const curatedRefs: string[] = [];
  for (const topic of topics) {
    for (const ref of topic.references) {
      if (!curatedRefs.some((existing) => overlaps(existing, ref))) curatedRefs.push(ref);
    }
  }
  const curatedWanted = curatedRefs.slice(0, limit);

  const keywordQueries = [terms.join(" ")];
  for (const topic of topics) {
    if (keywordQueries.indexOf(topic.searchTerm) < 0) keywordQueries.push(topic.searchTerm);
  }

  const [snippets, keywordBatches] = await Promise.all([
    fetchSnippets(plugin, curatedWanted, reportError),
    Promise.all(keywordQueries.map((q) => keywordSearch(plugin, q, limit, reportError))),
  ]);

  let live = ([] as SearchResult[]).concat(...keywordBatches);

  // ESV keyword search ANDs the words together; if that finds nothing, retry on
  // the longest word so natural phrasing still returns something.
  if (live.length === 0 && curatedWanted.length === 0 && terms.length > 1) {
    const longest = terms.slice().sort((a, b) => b.length - a.length)[0];
    live = await keywordSearch(plugin, longest, limit, reportError);
  }

  const curated: SearchResult[] = curatedWanted.map((reference, i) => ({
    reference,
    content: snippets[i] ?? "",
    curated: true,
  }));

  const curatedLead = Math.ceil(limit / 2);
  const ordered: SearchResult[] = curated.slice(0, curatedLead);
  for (const result of live) {
    if (!ordered.some((r) => overlaps(r.reference, result.reference))) ordered.push(result);
  }
  for (const result of curated.slice(curatedLead)) {
    if (!ordered.some((r) => overlaps(r.reference, result.reference))) ordered.push(result);
  }

  const final = ordered.slice(0, limit);
  if (!errorShown) searchCache.set(cacheKey, final);
  return final;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export class BibleSearchModal extends SuggestModal<SearchResult> {
  private plugin: ESVBiblePlugin;
  private editor: Editor;
  private initialQuery: string;
  private requestToken = 0;
  private lastResults: SearchResult[] = [];
  private lastTerms: string[] = [];

  constructor(app: App, plugin: ESVBiblePlugin, editor: Editor, initialQuery = "") {
    super(app);
    this.plugin = plugin;
    this.editor = editor;
    this.initialQuery = initialQuery;

    this.setPlaceholder('Search verses, e.g. "verse about trusting God" or John 3:16');
    this.emptyStateText = "Type to search the Bible";
    this.setInstructions([
      { command: "↑↓", purpose: "navigate" },
      { command: "↵", purpose: "preview" },
      { command: "esc", purpose: "dismiss" },
    ]);
  }

  open() {
    super.open();
    if (this.initialQuery) {
      this.inputEl.value = this.initialQuery;
      this.inputEl.dispatchEvent(new Event("input"));
    }
  }

  async getSuggestions(query: string): Promise<SearchResult[]> {
    const trimmed = query.trim();
    const token = ++this.requestToken;

    if (!trimmed) {
      this.lastResults = [];
      this.lastTerms = [];
      this.emptyStateText = "Type to search the Bible";
      return [];
    }

    if (looksLikeReference(trimmed)) {
      this.lastTerms = [];
      this.lastResults = [{ reference: trimmed, content: "", curated: false, direct: true }];
      return this.lastResults;
    }

    await sleep(DEBOUNCE_MS);
    // A newer keystroke superseded this one; keep showing what we have.
    if (token !== this.requestToken) return this.lastResults;

    const terms = normalizeQuery(trimmed);
    const results = await searchVerses(this.plugin, trimmed, this.plugin.settings.searchResultCount);
    if (token !== this.requestToken) return this.lastResults;

    this.lastTerms = terms;
    this.lastResults = results;
    this.emptyStateText = terms.length === 0 ? "Try a few more words" : "No matching verses found";
    return results;
  }

  renderSuggestion(result: SearchResult, el: HTMLElement) {
    el.addClass("esv-search-result");

    const header = el.createDiv({ cls: "esv-search-header" });
    header.createSpan({ cls: "esv-search-reference", text: result.reference });
    if (result.curated) {
      header.createSpan({ cls: "esv-search-badge", text: "Topic match" });
    }

    if (result.direct) {
      el.createDiv({ cls: "esv-search-snippet", text: "Preview this passage" });
      return;
    }
    if (!result.content) return;

    const snippet = el.createDiv({ cls: "esv-search-snippet" });
    if (this.lastTerms.length === 0) {
      snippet.setText(result.content);
      return;
    }
    const pattern = new RegExp(
      `(\\b(?:${this.lastTerms.map(escapeRegExp).join("|")})\\w*)`,
      "gi"
    );
    result.content.split(pattern).forEach((part, i) => {
      // split() with one capture group puts the matches at odd indexes
      if (i % 2 === 1) snippet.createEl("mark", { text: part });
      else if (part) snippet.appendText(part);
    });
  }

  onChooseSuggestion(result: SearchResult) {
    new BiblePreviewModal(
      this.app,
      this.plugin,
      this.editor,
      result.reference,
      this.inputEl.value
    ).open();
  }
}

export class BiblePreviewModal extends Modal {
  private plugin: ESVBiblePlugin;
  private editor: Editor;
  private reference: string;
  private query: string;
  private passage: string | null = null;
  private insertButton: HTMLButtonElement | null = null;

  constructor(app: App, plugin: ESVBiblePlugin, editor: Editor, reference: string, query: string) {
    super(app);
    this.plugin = plugin;
    this.editor = editor;
    this.reference = reference;
    this.query = query;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: this.reference });

    const body = contentEl.createDiv({ cls: "esv-preview-body" });
    body.setText("Loading…");

    const buttons = contentEl.createDiv({ cls: "esv-button-container" });
    const back = buttons.createEl("button", { text: "Back to results" });
    back.addEventListener("click", () => {
      this.close();
      new BibleSearchModal(this.app, this.plugin, this.editor, this.query).open();
    });
    const cancel = buttons.createEl("button", { text: "Cancel" });
    cancel.addEventListener("click", () => this.close());
    this.insertButton = buttons.createEl("button", { text: "Insert", cls: "mod-cta" });
    this.insertButton.disabled = true;
    this.insertButton.addEventListener("click", () => this.insert());

    this.scope.register([], "Enter", () => {
      this.insert();
      return false;
    });

    this.plugin.fetchVerse(this.reference).then((passage) => {
      if (passage) {
        this.passage = passage;
        body.setText(passage);
        if (this.insertButton) this.insertButton.disabled = false;
      } else {
        body.setText("Couldn't load this passage.");
      }
    });
  }

  private insert() {
    if (this.passage === null) return;
    const passage = this.passage;
    this.close();
    this.plugin.insertText(this.editor, passage);
  }

  onClose() {
    this.contentEl.empty();
  }
}
