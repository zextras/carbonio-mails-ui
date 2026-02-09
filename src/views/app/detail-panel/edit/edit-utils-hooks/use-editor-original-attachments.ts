/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { useCallback, useMemo } from 'react';

import { EditViewActions } from 'constants/index';
import { buildSavedAttachments } from 'helpers/attachments';
import { useEditorsStore } from 'store/editor/store';
import { forEach } from 'lodash';

type UseEditorOriginalAttachmentsArgs = {
	editorId: string;
};

type UseEditorOriginalAttachmentsResult = {
	originalMessageHasAttachments: boolean;
	addOriginalAttachmentsToEditor: () => void;
};

/**
 * Custom hook that provides functionality to add original attachments from the message being replied to.
 * This hook checks if the current editor action is a reply and if the original message has attachments.
 *
 * @param editorId - The ID of the editor
 * @returns An object containing originalMessageHasAttachments flag and addOriginalAttachmentsToEditor function
 */
export const useEditorOriginalAttachments = ({
	editorId
}: UseEditorOriginalAttachmentsArgs): UseEditorOriginalAttachmentsResult => {
	const editor = useEditorsStore((state) => state.editors[editorId]);
	const isReplyAction =
		editor?.action === EditViewActions.REPLY || editor?.action === EditViewActions.REPLY_ALL;
	const originalMessage = editor?.originalMessage;

	const hasOriginalAttachments = useMemo(() => {
		if (!originalMessage) {
			return false;
		}
		const originalAttachments = buildSavedAttachments(originalMessage);
		const standardAttachments = originalAttachments.filter(
			(att) => !att.isInline && !att.contentId
		);
		return standardAttachments.length > 0;
	}, [originalMessage]);

	const addOriginalAttachments = useCallback(() => {
		if (!originalMessage) {
			return;
		}

		const originalAttachments = buildSavedAttachments(originalMessage);
		const standardAttachments = originalAttachments.filter(
			(att) => !att.isInline && !att.contentId
		);

		const store = useEditorsStore.getState();
		forEach(standardAttachments, (attachment) => {
			store.addSavedAttachment(editorId, attachment);
		});
	}, [originalMessage, editorId]);

	return {
		originalMessageHasAttachments: hasOriginalAttachments && isReplyAction,
		addOriginalAttachmentsToEditor: addOriginalAttachments
	};
};
