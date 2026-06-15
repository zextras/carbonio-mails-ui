/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useEffect, useImperativeHandle, useMemo } from 'react';

import styled from '@emotion/styled';
import { EditorContent, useEditor } from '@tiptap/react';
import { Container } from '@zextras/carbonio-design-system';

import { buildEditorExtensions } from './extensions';
import { MAIL_EDITOR_CONTENT_STYLES } from './tiptap-content-styles';
import { TipTapToolbar } from './tiptap-toolbar';
import { TipTapEditorProps } from './tiptap-types';

export type {
	TipTapEditorValue,
	TipTapAccountSettingsPrefs,
	TipTapEditorProps
} from './tiptap-types';

const EditorContentWrapper = styled.div`
	width: 100%;
	flex: 1 1 auto;
	overflow: auto;

	.ProseMirror {
		min-height: 12.5rem;
		padding: 0.5rem 0.75rem;
		outline: none;
	}

	${MAIL_EDITOR_CONTENT_STYLES}
`;

const getImageFilesFromDataTransfer = (dataTransfer: DataTransfer | null): Array<File> => {
	if (!dataTransfer) {
		return [];
	}
	return Array.from(dataTransfer.files).filter((file) => file.type.startsWith('image/'));
};

export const TipTapEditor = ({
	value,
	onChange,
	onFileSelect,
	onPaste,
	onDragOver,
	accountSettingsPrefs,
	disabled = false,
	editorRef
}: TipTapEditorProps): React.JSX.Element => {
	const extensions = useMemo(() => buildEditorExtensions(), []);

	const editorStyle = useMemo(() => {
		const declarations: Array<string> = [];
		if (accountSettingsPrefs.font) {
			declarations.push(`font-family: ${accountSettingsPrefs.font}`);
		}
		if (accountSettingsPrefs.fontSize) {
			declarations.push(`font-size: ${accountSettingsPrefs.fontSize}`);
		}
		if (accountSettingsPrefs.color) {
			declarations.push(`color: ${accountSettingsPrefs.color}`);
		}
		return declarations.join('; ');
	}, [accountSettingsPrefs.color, accountSettingsPrefs.font, accountSettingsPrefs.fontSize]);

	const editor = useEditor(
		{
			extensions,
			content: value.richText,
			immediatelyRender: true,
			shouldRerenderOnTransaction: false,
			editable: !disabled,
			onUpdate: ({ editor: activeEditor }): void => {
				onChange({
					richText: activeEditor.getHTML(),
					plainText: activeEditor.getText()
				});
			},
			editorProps: {
				attributes: {
					spellcheck: 'true',
					class: 'carbonio-tiptap',
					style: editorStyle,
					'data-testid': 'tiptap-editor-content'
				},
				handlePaste: (_view, event): boolean => (onPaste ? Boolean(onPaste(event)) : false),
				handleDrop: (_view, event): boolean => {
					const imageFiles = getImageFilesFromDataTransfer(event.dataTransfer);
					if (imageFiles.length > 0) {
						event.preventDefault();
						onFileSelect(imageFiles);
						return true;
					}
					return false;
				},
				handleDOMEvents: {
					dragover: (_view, event): boolean => {
						onDragOver?.(event);
						return false;
					}
				}
			}
		},
		[extensions]
	);

	// Expose the editor instance to consumers (smartlink modal, inline image insert, ...)
	useImperativeHandle(editorRef, () => editor, [editor]);

	// Keep the editable state in sync with the `disabled` prop.
	useEffect(() => {
		editor?.setEditable(!disabled);
	}, [disabled, editor]);

	// Controlled-literal sync with a diff-guard: only re-apply the incoming value
	// when it differs from what the editor currently holds. Since `onChange`
	// stores the HTML extracted from the editor, the next render's diff matches
	// and no `setContent` runs - so the caret never jumps while typing.
	useEffect(() => {
		if (editor && value.richText !== editor.getHTML()) {
			editor.commands.setContent(value.richText, { emitUpdate: false });
		}
	}, [editor, value.richText]);

	const handleImageFiles = useCallback(
		(files: Array<File>) => {
			if (files.length > 0) {
				onFileSelect(files);
			}
		},
		[onFileSelect]
	);

	return (
		<Container
			height="100%"
			width="100%"
			crossAlignment="flex-start"
			mainAlignment="flex-start"
			data-testid="MailEditorWrapper"
		>
			<TipTapToolbar
				editor={editor}
				disabled={disabled}
				accountSettingsPrefs={accountSettingsPrefs}
				onFileSelect={handleImageFiles}
			/>
			<EditorContentWrapper>
				<EditorContent editor={editor} />
			</EditorContentWrapper>
		</Container>
	);
};
