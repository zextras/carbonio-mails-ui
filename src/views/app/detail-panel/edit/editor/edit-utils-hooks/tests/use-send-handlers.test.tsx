/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { act, screen } from '@testing-library/react';

import { attachmentWords } from '../../check-subject-attachment';
import { useSendHandlers } from '../use-send-handlers';
import { setupHook } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { setupEditorStore } from '__test__/generators/editor-store';
import { anUnsavedAttachment, generateNewEditor } from '__test__/generators/editors';
import { useEditorsStore } from 'store/editor';
import { UnsavedAttachment } from 'types/attachments';

const NO_ATTACHMENTS_WARNING = 'messages.modal.send_anyway.no_attachments';

const uploadedAttachment = (): UnsavedAttachment => ({
	...anUnsavedAttachment(),
	aid: 'upload-id',
	uploadStatus: { status: 'completed' }
});

const setupEditorWithAttachmentKeyword = (unsavedAttachments: Array<UnsavedAttachment>): string => {
	const editor = generateNewEditor({
		id: 'editor-1',
		subject: 'Report',
		text: { plainText: `Please find the report ${attachmentWords[0]}.`, richText: '' },
		savedAttachments: [],
		unsavedAttachments
	});
	setupEditorStore({ editors: [editor] });
	return editor.id;
};

describe('useSendHandlers', () => {
	it('should not show the missing attachment warning on send later when a file is uploaded but the draft is not saved yet', async () => {
		createSoapAPIInterceptor('SaveDraft');
		const editorId = setupEditorWithAttachmentKeyword([uploadedAttachment()]);
		const scheduledTime = Date.now() + 60 * 60 * 1000;
		const { result } = setupHook(useSendHandlers, { initialProps: [editorId] });

		await act(async () => {
			result.current.onSendLaterClick(scheduledTime);
		});

		expect(screen.queryByText(NO_ATTACHMENTS_WARNING)).not.toBeInTheDocument();
		expect(useEditorsStore.getState().editors[editorId].autoSendTime).toBe(scheduledTime);
	});

	it('should show the missing attachment warning on send later when no file is attached', async () => {
		const editorId = setupEditorWithAttachmentKeyword([]);
		const { result } = setupHook(useSendHandlers, { initialProps: [editorId] });

		await act(async () => {
			result.current.onSendLaterClick(Date.now() + 60 * 60 * 1000);
		});

		expect(screen.getByText(NO_ATTACHMENTS_WARNING)).toBeInTheDocument();
	});
});
