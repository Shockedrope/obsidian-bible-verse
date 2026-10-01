import {
  App,
  Editor,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  requestUrl,
} from "obsidian";
import { BibleSearchModal } from "./src/search";

interface ESVBibleSettings {
  apiKey: string;
  includeVerseNumbers: boolean;
  includeFootnotes: boolean;
  includeHeadings: boolean;
  includeShortCopyright: boolean;
  indentPoetry: boolean;
  searchResultCount: number;
}

const DEFAULT_SETTINGS: ESVBibleSettings = {
  apiKey: "",
  includeVerseNumbers: true,
  includeFootnotes: false,
  includeHeadings: true,
  includeShortCopyright: true,
  indentPoetry: true,
  searchResultCount: 5,
};

export default class ESVBiblePlugin extends Plugin {
  settings: ESVBibleSettings;

  async onload() {
    await this.loadSettings();

    // Add command to insert a Bible verse
    this.addCommand({
      id: "insert-bible-verse",
      name: "Insert Bible verse",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        new BibleVerseModal(this.app, this, editor).open();
      },
    });

    // Add command to insert verse at cursor from selection
    this.addCommand({
      id: "insert-verse-from-selection",
      name: "Insert verse from selected reference",
      editorCallback: async (editor: Editor, view: MarkdownView) => {
        const selection = editor.getSelection();
        if (selection) {
          await this.insertVerse(editor, selection);
        } else {
          new Notice("Please select a Bible reference first");
        }
      },
    });

    // Add command to search for verses by keyword or topic
    this.addCommand({
      id: "search-bible-verses",
      name: "Search Bible verses",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        new BibleSearchModal(this.app, this, editor).open();
      },
    });

    // Add settings tab
    this.addSettingTab(new ESVBibleSettingTab(this.app, this));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async fetchVerse(reference: string): Promise<string | null> {
    if (!this.settings.apiKey) {
      new Notice("Please set your ESV API key in the plugin settings");
      return null;
    }

    const params = new URLSearchParams({
      q: reference,
      "include-passage-references": "true",
      "include-verse-numbers": this.settings.includeVerseNumbers.toString(),
      "include-footnotes": this.settings.includeFootnotes.toString(),
      "include-headings": this.settings.includeHeadings.toString(),
      "include-short-copyright": this.settings.includeShortCopyright.toString(),
      "indent-poetry": this.settings.indentPoetry.toString(),
      "include-selahs": "true",
      "indent-declares": "true",
      "indent-psalm-doxology": "true",
    });

    try {
      const response = await requestUrl({
        url: `https://api.esv.org/v3/passage/text/?${params.toString()}`,
        method: "GET",
        headers: {
          Authorization: `Token ${this.settings.apiKey}`,
        },
      });

      if (response.status !== 200) {
        new Notice(`Error fetching verse: ${response.status}`);
        return null;
      }

      const data = response.json;

      if (data.passages && data.passages.length > 0) {
        return data.passages.join("\n\n");
      } else {
        new Notice("No passage found for that reference");
        return null;
      }
    } catch (error) {
      new Notice(`Error fetching verse: ${error.message}`);
      return null;
    }
  }

  async insertVerse(editor: Editor, reference: string) {
    const notice = new Notice("Fetching verse...", 0);
    const verse = await this.fetchVerse(reference);
    notice.hide();

    if (verse) {
      this.insertText(editor, verse);
    }
  }

  insertText(editor: Editor, verse: string) {
    const cursor = editor.getCursor();
    editor.replaceRange(`\n${verse}\n`, cursor);
    new Notice("Verse inserted!");
  }
}

class BibleVerseModal extends Modal {
  plugin: ESVBiblePlugin;
  editor: Editor;
  reference: string = "";

  constructor(app: App, plugin: ESVBiblePlugin, editor: Editor) {
    super(app);
    this.plugin = plugin;
    this.editor = editor;
  }

  onOpen() {
    const { contentEl } = this;

    contentEl.createEl("h2", { text: "Insert Bible Verse" });

    const inputContainer = contentEl.createDiv({ cls: "esv-input-container" });

    const input = inputContainer.createEl("input", {
      type: "text",
      placeholder: "Enter reference (e.g., John 3:16, Romans 8:28-30)",
      cls: "esv-reference-input",
    });

    input.style.width = "100%";
    input.style.padding = "10px";
    input.style.marginBottom = "10px";
    input.style.fontSize = "16px";

    input.addEventListener("input", (e) => {
      this.reference = (e.target as HTMLInputElement).value;
    });

    input.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        await this.submitReference();
      }
    });

    const buttonContainer = contentEl.createDiv({ cls: "esv-button-container" });
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "flex-end";
    buttonContainer.style.gap = "10px";

    const cancelButton = buttonContainer.createEl("button", { text: "Cancel" });
    cancelButton.addEventListener("click", () => this.close());

    const insertButton = buttonContainer.createEl("button", {
      text: "Insert Verse",
      cls: "mod-cta",
    });
    insertButton.addEventListener("click", async () => {
      await this.submitReference();
    });

    // Focus the input
    input.focus();
  }

  async submitReference() {
    if (this.reference.trim()) {
      this.close();
      await this.plugin.insertVerse(this.editor, this.reference);
    } else {
      new Notice("Please enter a Bible reference");
    }
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class ESVBibleSettingTab extends PluginSettingTab {
  plugin: ESVBiblePlugin;

  constructor(app: App, plugin: ESVBiblePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "ESV Bible Verse Settings" });

    new Setting(containerEl)
      .setName("ESV API Key")
      .setDesc(
        "Enter your ESV API key. Get one free at https://api.esv.org/"
      )
      .addText((text) =>
        text
          .setPlaceholder("Enter your API key")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Formatting Options" });

    new Setting(containerEl)
      .setName("Include verse numbers")
      .setDesc("Show verse numbers in the passage")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeVerseNumbers)
          .onChange(async (value) => {
            this.plugin.settings.includeVerseNumbers = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Include footnotes")
      .setDesc("Include footnotes in the passage")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeFootnotes)
          .onChange(async (value) => {
            this.plugin.settings.includeFootnotes = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Include headings")
      .setDesc("Include section headings in the passage")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeHeadings)
          .onChange(async (value) => {
            this.plugin.settings.includeHeadings = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Include short copyright")
      .setDesc("Include the ESV copyright notice")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.includeShortCopyright)
          .onChange(async (value) => {
            this.plugin.settings.includeShortCopyright = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Indent poetry")
      .setDesc("Indent poetic passages (Psalms, Proverbs, etc.)")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.indentPoetry)
          .onChange(async (value) => {
            this.plugin.settings.indentPoetry = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Search" });

    new Setting(containerEl)
      .setName("Search results to show")
      .setDesc("How many verses to list when using \"Search Bible verses\"")
      .addSlider((slider) =>
        slider
          .setLimits(1, 20, 1)
          .setValue(this.plugin.settings.searchResultCount)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.searchResultCount = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Usage" });
    const usageDiv = containerEl.createDiv();
    usageDiv.createEl("p", {
      text: "Use the command palette (Ctrl/Cmd + P) and search for:",
    });
    const ul = usageDiv.createEl("ul");
    ul.createEl("li", {
      text: '"Insert Bible verse" - Opens a dialog to enter a reference',
    });
    ul.createEl("li", {
      text: '"Insert verse from selected reference" - Inserts the verse for selected text',
    });
    ul.createEl("li", {
      text: '"Search Bible verses" - Find verses by topic or keyword, preview, then insert',
    });

    usageDiv.createEl("p", { text: "Example references:" });
    const examplesUl = usageDiv.createEl("ul");
    examplesUl.createEl("li", { text: "John 3:16" });
    examplesUl.createEl("li", { text: "Romans 8:28-30" });
    examplesUl.createEl("li", { text: "Psalm 23" });
    examplesUl.createEl("li", { text: "Genesis 1:1-3" });
  }
}
