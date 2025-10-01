/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useRef } from 'react';

import styled from '@emotion/styled';
import type { IAllProps as EditorProps } from '@tinymce/tinymce-react';
import { Editor } from '@tinymce/tinymce-react';
import { Container } from '@zextras/carbonio-design-system';
import { useUserSettings } from '@zextras/carbonio-shell-ui';
import { useTranslation } from 'react-i18next';
import type { EditorOptions, TinyMCE } from 'tinymce/tinymce';

import 'tinymce/tinymce'; // Required for global tinymce variable
import 'tinymce/models/dom';
// Theme
import 'tinymce/themes/silver';
// Toolbar icons
import 'tinymce/icons/default';
// Editor styles
import 'tinymce/skins/ui/oxide/skin.min.css';
// importing the plugin js.
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/autoresize';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/code';
import 'tinymce/plugins/directionality';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/help';
import 'tinymce/plugins/image';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/link';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/media';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/quickbars';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/table';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/wordcount';
import { createEditorDefaultStyle, generateEditorContentStyle } from './editor-style-utils';
import { calculateTinyMCELanguage } from './locale-utils';
import { createTinyMCEConfig } from './tinymce-config-utils';
import { createTinyMCESetup } from './tinymce-setup-utils';

type ComposerProps = Omit<EditorProps, 'onEditorChange'> & {
	/** The callback invoked when an edit is performed into the editor. `([text, html]) => {}` */
	onEditorChange?: (values: [string, string]) => void;
	/** Enable the distraction-free mode */
	inline?: boolean;
	/** The initial content of the editor */
	initialValue?: EditorProps['initialValue'];
	/** The content of the editor (controlled mode) */
	value?: EditorProps['value'];
	/**
	 * Callback called when user choose some file from the os.
	 * If defined, a menu item to add inline images is added to the composer.
	 */
	onFileSelect?: (arg: { editor: TinyMCE; files: HTMLInputElement['files'] | undefined }) => void;
	customInitOptions?: Partial<Omit<EditorOptions, 'selector' | 'target'>>;
	/** Whether the editor should be disabled */
	disabled?: boolean;
};

export const FileInput = styled.input`
	display: none;
`;

export const Composer = ({
	onEditorChange,
	onFileSelect,
	inline = false,
	value,
	initialValue,
	customInitOptions,
	disabled,
	...rest
}: ComposerProps): React.JSX.Element => {
	const isControlledMode = useMemo(() => !!onEditorChange, [onEditorChange]);

	const _onEditorChange = useCallback<NonNullable<EditorProps['onEditorChange']>>(
		(_newContent, editor) => {
			onEditorChange?.([
				editor.getContent({ format: 'text' }),
				editor.getContent({ format: 'html' })
			]);
		},
		[onEditorChange]
	);

	const { prefs } = useUserSettings();
	const defaultStyle = useMemo(() => createEditorDefaultStyle(prefs), [prefs]);
	const inputRef = useRef<HTMLInputElement>(null);
	const onFileClick = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.value = '';
			inputRef.current.click();
		}
	}, []);
	const [t] = useTranslation();

	const language = useMemo(
		() => calculateTinyMCELanguage(prefs.zimbraPrefLocale),
		[prefs.zimbraPrefLocale]
	);

	const inlineLabel = useMemo(() => t('label.add_inline_image', 'Add inline image'), [t]);
	const selectImageTooltip = useMemo(() => t('label.select_image', 'Select image'), [t]);

	const setupCallback = useMemo(
		() =>
			createTinyMCESetup({
				onFileSelect,
				onFileClick,
				inlineLabel,
				selectImageTooltip
			}),
		[inlineLabel, onFileClick, onFileSelect, selectImageTooltip]
	);

	const contentStyle = useMemo(() => generateEditorContentStyle(defaultStyle), [defaultStyle]);

	const editorInitConfig = useMemo(
		() =>
			createTinyMCEConfig({
				language,
				inline,
				contentStyle,
				setup: setupCallback,
				customOptions: customInitOptions
			}),
		[contentStyle, customInitOptions, inline, language, setupCallback]
	);

	const fileInputOnChange = useCallback(() => {
		if (onFileSelect && inputRef.current) {
			// eslint-disable-next-line global-require,@typescript-eslint/no-var-requires
			const tinymce = require('tinymce/tinymce');
			onFileSelect({ editor: tinymce, files: inputRef.current.files });
		}
	}, [onFileSelect]);

	return (
		<Container
			height="100%"
			crossAlignment="baseline"
			mainAlignment="flex-start"
			style={{ overflowY: 'hidden' }}
		>
			<FileInput
				data-testid="file-input"
				type="file"
				ref={inputRef}
				accept="image/*"
				onChange={fileInputOnChange}
				multiple
			/>

			<Editor
				initialValue={initialValue}
				value={value}
				init={editorInitConfig}
				onEditorChange={isControlledMode ? _onEditorChange : undefined}
				disabled={disabled}
				{...rest}
			/>
		</Container>
	);
};
