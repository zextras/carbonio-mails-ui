/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';

import { EditViewActions } from '../../../../../constants';
import { generateEditor } from '../../../../../store/editor/editor-generators';
import { setupTest } from '@test-setup';
import { setupEditorStore } from '__test__/generators/editor-store';
import { generateEditorV2Case } from '__test__/generators/editors';
import { generateMessage } from '__test__/generators/generateMessage';
import { addEditor } from 'store/editor/index';
import { MailsEditorV2 } from 'types/editor';
import { EditAttachmentsBlock } from 'views/app/detail-panel/edit/edit-attachments-block';

describe('Attachments visualization', () => {
	const setLargeFileUploadInfoBannerVisible = vi.fn();
	test.each`
		editorTestCaseId | attachmentType
		${'1'}           | ${'Various format attachments'}
	`(`$attachmentType attachments are visible in email editor`, async ({ editorTestCaseId }) => {
		// Generate editor info for the store
		setupEditorStore({ editors: [] });
		const editor = await generateEditorV2Case(editorTestCaseId);
		addEditor({ id: editor.id, editor });

		// Get the attachment filename
		const filenames = editor?.savedAttachments?.map((attachment) => attachment.filename);
		if (!filenames) {
			return;
		}

		// Create the props for the component
		const props = {
			editorId: editor.id,
			setLargeFileUploadInfoBannerVisible
		};

		// Render the component
		const { user } = setupTest(<EditAttachmentsBlock {...props} />);

		// Check if the attachments list expansion link exists
		const expansionLink = screen.queryByTestId('attachment-list-expand-link');
		if (expansionLink) {
			await user.click(expansionLink);
			await screen.findByTestId('attachment-list-collapse-link');
		}

		// Check the visibility of the attachment blocks
		filenames.forEach((filename) => {
			try {
				screen.getByTestId(`attachment-container-${filename}`);
			} catch (e) {
				throw new Error(`The attachment block for the file ${filename} is not present`);
			}
		});
	});
	it('should display inline attachments with no Content-ID', async () => {
		setupEditorStore({ editors: [] });
		const message = generateMessage({
			parts: [
				{
					name: 'part2',
					filename: 'file-with-no-content-id',
					disposition: 'inline' as const,
					contentType: 'image/png',
					size: 200
				}
			]
		});
		const editor = generateEditor({
			action: EditViewActions.EDIT_AS_DRAFT,
			id: 'test-id',
			message
		}) as MailsEditorV2;
		addEditor({ id: editor.id, editor });

		setupTest(<EditAttachmentsBlock editorId={editor.id} />);

		const editAttachmentsBlock = await screen.findByTestId('edit-attachments-block');
		expect(await within(editAttachmentsBlock).findByText('file-with-no-content-id')).toBeVisible();
	});
	it('should NOT display inline attachments with Content-ID', async () => {
		setupEditorStore({ editors: [] });
		const message = generateMessage({
			parts: [
				{
					name: 'part2',
					filename: 'other',
					disposition: 'inline' as const,
					contentType: 'image/png',
					size: 200
				},
				{
					name: 'inlinePart1',
					filename: 'file-with-content-id',
					disposition: 'inline' as const,
					ci: '123',
					contentType: 'image/png',
					size: 200
				}
			]
		});
		const editor = generateEditor({
			action: EditViewActions.EDIT_AS_DRAFT,
			id: 'test-id',
			message
		}) as MailsEditorV2;
		addEditor({ id: editor.id, editor });

		setupTest(<EditAttachmentsBlock editorId={editor.id} />);

		const editAttachmentsBlock = await screen.findByTestId('edit-attachments-block');
		expect(
			within(editAttachmentsBlock).queryByText('file-with-content-id')
		).not.toBeInTheDocument();
	});
});
