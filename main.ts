import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import * as path from "path";
import { generateValidBlog } from "blog_processor";
import { writeFile } from 'file_util';
import { updateHexoPage } from 'post_util';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: ''
}

const BLOG_TITLE:     string = "标题"
const BLOG_TAG: 	  string = "标签"
const BLOG_CATEGORY:  string = "分类"
const BLOG_POST_BLOG: string = "发布"

const HEXO_BLOG_SOURCE_PATH = "/source/_posts"

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		// const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
		// 	// Called when the user clicks the icon.
		// 	new Notice('This is a notice!');
		// });
		// // Perform additional things with the ribbon
		// ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		// this.addCommand({
		// 	id: 'open-sample-modal-simple',
		// 	name: 'Open sample modal (simple)',
		// 	callback: () => {
		// 		new SampleModal(this.app).open();
		// 	}
		// });

		let that = this;
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'post-blog-to-hexo-command',
			name: 'post blog to hexo',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				// console.log(editor.getSelection());
				// editor.replaceSelection('Sample Editor Command');
				const onSubmit = (title: string, tag: string, category: string, content: string) => {
					if (!(this.settings.mySetting && this.settings.mySetting.length > 0)) {
						new Notice("请先设置Hexo项目路径");
						return
					}

					if (!(title && title.length > 0)) {
						new Notice("标题为空");
						return;
					}

					let fullBlog = generateValidBlog(title, tag, category, content)

					let fileName = title + ".md";
					let dirPath = path.join(this.settings.mySetting, HEXO_BLOG_SOURCE_PATH)
					
					const activeFile = that.app.workspace.getActiveFile();
					if (!activeFile || activeFile.parent == null) {
						new Notice("博客发布失败");
						return;
					}
					
					let absolutePath = decodeURI(that.app.vault.adapter.getResourcePath(activeFile.parent.path));
					absolutePath = absolutePath.substring(12)
					absolutePath = absolutePath.substring(0, absolutePath.lastIndexOf('?'))

					// new Notice("正在发布博客: " + title)

					// generate blog file in hexo source dir
					writeFile(dirPath, fileName, fullBlog);

					// post blog to github page

					updateHexoPage(this.settings.mySetting)
				}
				const content = editor.getValue();
				new BlogSettingModal(this.app, content, onSubmit).open();
			}
		});
		// // This adds a complex command that can check whether the current state of the app allows execution of the command
		// this.addCommand({
		// 	id: 'open-sample-modal-complex',
		// 	name: 'Open sample modal (complex)',
		// 	checkCallback: (checking: boolean) => {
		// 		// Conditions to check
		// 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
		// 		if (markdownView) {
		// 			// If checking is true, we're simply "checking" if the command can be run.
		// 			// If checking is false, then we want to actually perform the operation.
		// 			if (!checking) {
		// 				new SampleModal(this.app).open();
		// 			}

		// 			// This command will only show up in Command Palette when the check function returns true
		// 			return true;
		// 		}
		// 	}
		// });

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

// class PostConfirmModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const {contentEl} = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const {contentEl} = this;
// 		contentEl.empty();
// 	}
// }


// modal to set blog setting
class BlogSettingModal extends Modal {
	title: string;		// blog title
	tag: string;		// blog tag
	category: string;	// blog category
	content: string;	// blog content
	onSubmit: (title: string, tag: string, category: string, content: string) => void;	// action when submit button clicked

	constructor(app: App, content: string, onSubmit: (title: string, tag: string, category: string, content: string) => void) {
		super(app);
		this.content = content;
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const {contentEl} = this;

		contentEl.createEl("h1", {text: "博客设置"})

		// blog title
		new Setting(contentEl)
			.setName(BLOG_TITLE)
			.addText((text) => 
				text.onChange((value) => {
					this.title = value;
			}))

		// blog tag
		new Setting(contentEl)
			.setName(BLOG_TAG)
			.addText((text) => 
				text.onChange((value) => {
					this.tag = value;
			}));

		// blog category
		new Setting(contentEl)
			.setName(BLOG_CATEGORY)
			.addText((text) => 
				text.onChange((value) => {
					this.category = value;
			}));

		// blog post button
		new Setting(contentEl)
			.addButton((btn) => 
				btn
					.setButtonText(BLOG_POST_BLOG)
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.title, this.tag, this.category, this.content)
					}));
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Hexo设置')
			.setDesc('请输入Hexo项目路径')
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('your hexo path is ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
