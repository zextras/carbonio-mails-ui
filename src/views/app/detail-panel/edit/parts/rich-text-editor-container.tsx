/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { useCallback, useMemo, useRef } from 'react';

import { Editor } from '@tiptap/core';
import { useUserSettings } from '@zextras/carbonio-shell-ui';

import { editorUtils } from './editor-utils';
import { useEditorAttachments, useEditorsStore, useEditorText } from 'store/editor';
import { replaceCidUrlWithServiceUrl } from 'store/editor/editor-transformations';
import { MailsEditorV2 } from 'types/editor';
import { createTipTapPasteHandler } from 'views/app/detail-panel/edit/parts/editor-paste-handler';
import type { TextEditorContainerProps } from 'views/app/detail-panel/edit/parts/text-editor-container';
import {
	TipTapAccountSettingsPrefs,
	TipTapEditor,
	TipTapEditorValue
} from 'views/app/detail-panel/edit/parts/tiptap/tiptap-editor';

type InlineAttachmentInfo = {
	contentId: string | undefined;
	cidUrl: string | undefined;
	downloadServiceUrl: string | undefined;
};

export const RichTextEditorContainer = ({
	editorId,
	onDragOver
}: TextEditorContainerProps): JSX.Element => {
	const { text, setText } = useEditorText(editorId);
	const { addInlineAttachments, keepOnlyInlineAttachments } = useEditorAttachments(editorId);
	const savedAttachments = useEditorsStore(
		(state) => state.editors[editorId]?.savedAttachments ?? []
	);
	const { prefs } = useUserSettings();

	const editorRef = useRef<Editor | null>(null);

	const accountSettingsPrefs = useMemo<TipTapAccountSettingsPrefs>(
		() => ({
			locale: (prefs?.zimbraPrefLocale as string) ?? '',
			font: (prefs?.zimbraPrefHtmlEditorDefaultFontFamily as string) ?? '',
			fontSize: (prefs?.zimbraPrefHtmlEditorDefaultFontSize as string) ?? '',
			color: (prefs?.zimbraPrefHtmlEditorDefaultFontColor as string) ?? ''
		}),
		[prefs]
	);

	const value = useMemo<TipTapEditorValue>(
		() => ({
			plainText: text.plainText,
			richText: replaceCidUrlWithServiceUrl(text.richText, savedAttachments)
		}),
		[text, savedAttachments]
	);

	const handleChange = useCallback(
		(next: MailsEditorV2['text']): void => {
			setText(next);
			const { usedCids } = editorUtils.retrieveCIdsFromContent({ htmlContent: next.richText });
			keepOnlyInlineAttachments(usedCids);
		},
		[setText, keepOnlyInlineAttachments]
	);

	const insertInlineAttachment = useCallback((inlineAttachment: InlineAttachmentInfo): void => {
		const editor = editorRef.current;
		if (!editor || !inlineAttachment.downloadServiceUrl || !inlineAttachment.cidUrl) {
			return;
		}
		editor
			.chain()
			.focus()
			.insertContent({
				type: 'image',
				attrs: {
					src: inlineAttachment.downloadServiceUrl,
					alt: 'Inline attachment',
					pnsrc: inlineAttachment.cidUrl,
					'data-src': inlineAttachment.cidUrl,
					'data-pnsrc': inlineAttachment.cidUrl,
					'data-cid': inlineAttachment.contentId
				}
			})
			.run();
	}, []);

	const onInlineAttachmentsSelected = useCallback(
		(files: Array<File>): void => {
			if (files.length === 0) {
				return;
			}
			addInlineAttachments(files, {
				onSaveComplete: (inlineAttachments): void => {
					inlineAttachments.forEach(insertInlineAttachment);
				}
			});
		},
		[addInlineAttachments, insertInlineAttachment]
	);

	const onPaste = useMemo(
		() => createTipTapPasteHandler({ onImageFiles: onInlineAttachmentsSelected }),
		[onInlineAttachmentsSelected]
	);

	return (
		<TipTapEditor
			editorRef={editorRef}
			value={value}
			onChange={handleChange}
			onFileSelect={onInlineAttachmentsSelected}
			onPaste={onPaste}
			onDragOver={onDragOver}
			accountSettingsPrefs={accountSettingsPrefs}
		/>
	);
};
