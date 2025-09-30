/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { EditorOptions } from 'tinymce/tinymce';

/**
 * Default font size formats for TinyMCE editor
 */
export const DEFAULT_FONT_SIZE_FORMATS =
	'8pt 9pt 10pt 11pt 12pt 13pt 14pt 16pt 18pt 24pt 30pt 36pt 48pt 60pt 72pt 96pt';

/**
 * Default plugins for TinyMCE editor
 */
export const DEFAULT_PLUGINS = [
	'advlist',
	'autolink',
	'lists',
	'link',
	'image',
	'charmap',
	'preview',
	'anchor',
	'searchreplace',
	'code',
	'fullscreen',
	'insertdatetime',
	'media',
	'table',
	'code',
	'help',
	'quickbars',
	'directionality',
	'autoresize',
	'visualblocks'
];

/**
 * Default style formats for TinyMCE editor
 */
export const DEFAULT_STYLE_FORMATS = [
	{
		title: 'Headers',
		items: [
			{ title: 'h1', block: 'h1' },
			{ title: 'h2', block: 'h2' },
			{ title: 'h3', block: 'h3' },
			{ title: 'h4', block: 'h4' },
			{ title: 'h5', block: 'h5' },
			{ title: 'h6', block: 'h6' }
		]
	},
	{
		title: 'Blocks',
		items: [
			{ title: 'p', block: 'p' },
			{ title: 'div', block: 'div' },
			{ title: 'pre', block: 'pre' }
		]
	},
	{
		title: 'Containers',
		items: [
			{ title: 'section', block: 'section', wrapper: true, merge_siblings: false },
			{ title: 'article', block: 'article', wrapper: true, merge_siblings: false },
			{ title: 'blockquote', block: 'blockquote', wrapper: true },
			{ title: 'hgroup', block: 'hgroup', wrapper: true },
			{ title: 'aside', block: 'aside', wrapper: true },
			{ title: 'figure', block: 'figure', wrapper: true }
		]
	}
];

/**
 * Generates the toolbar configuration for TinyMCE editor
 * @param inline - Whether the editor is in inline mode
 * @returns Toolbar configuration
 */
export function generateToolbarConfig(inline: boolean): string | false {
	if (inline) {
		return false;
	}

	return [
		'fontfamily fontsize styles visualblocks',
		'bold italic underline strikethrough',
		'removeformat code',
		'alignleft aligncenter alignright alignjustify',
		'forecolor backcolor',
		'bullist numlist outdent indent',
		'ltr rtl',
		'link',
		'insertfile image',
		'imageSelector'
	].join(' | ');
}

/**
 * Generates the quickbars configuration for TinyMCE editor
 * @param inline - Whether the editor is in inline mode
 * @returns Quickbars configuration object
 */
export function generateQuickBarsConfig(inline: boolean): {
	quickbars_insert_toolbar: string;
	quickbars_selection_toolbar: string;
} {
	return {
		quickbars_insert_toolbar: inline ? 'bullist numlist' : '',
		quickbars_selection_toolbar: inline
			? 'bold italic underline | forecolor backcolor | removeformat | link'
			: 'link'
	};
}

/**
 * Creates the base TinyMCE editor configuration
 * @param options - Configuration options
 * @returns TinyMCE editor configuration
 */
export function createTinyMCEConfig(options: {
	language: string;
	inline: boolean;
	contentStyle: string;
	setup?: EditorOptions['setup'];
	customOptions?: Partial<Omit<EditorOptions, 'selector' | 'target'>>;
}): Omit<EditorOptions, 'selector' | 'target'> {
	const { language, inline, contentStyle, setup, customOptions } = options;
	const quickBarsConfig = generateQuickBarsConfig(inline);

	return {
		content_css: [''],
		language_url: `${BASE_PATH}tinymce/langs/${language}.js`,
		language,
		setup,
		min_height: 350,
		auto_focus: true,
		menubar: false,
		statusbar: false,
		branding: false,
		resize: true,
		inline,
		font_size_formats: DEFAULT_FONT_SIZE_FORMATS,
		object_resizing: 'img',
		style_formats: DEFAULT_STYLE_FORMATS,
		plugins: DEFAULT_PLUGINS,
		toolbar: generateToolbarConfig(inline),
		...quickBarsConfig,
		contextmenu: [''],
		toolbar_mode: 'wrap',
		content_style: contentStyle,
		visualblocks_default_state: false,
		end_container_on_empty_block: true,
		relative_urls: false,
		remove_script_host: false,
		newline_behavior: 'default',
		browser_spellcheck: true,
		convert_unsafe_embeds: true,
		...(customOptions ?? {})
	};
}
