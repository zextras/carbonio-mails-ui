/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen } from '@testing-library/react';

import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { addEditor } from '../../../../../store/zustand/editor';
import { setupEditorStore } from '../../../../../tests/generators/editor-store';
import { generateEditorV2Case } from '../../../../../tests/generators/editors';
import { generateStore } from '../../../../../tests/generators/store';
import { EditAttachmentsBlock } from '../edit-attachments-block';

describe('Attachments visualization', () => {
	test.each`
		editorTestCaseId | attachmentType
		${'1'}           | ${'Various format attachments'}
	`(`$attachmentType attachments are visible in email editor`, async ({ editorTestCaseId }) => {
		// Generate editor info for the store
		const reduxStore = generateStore();
		setupEditorStore({ editors: [] });
		const editor = await generateEditorV2Case(editorTestCaseId, reduxStore.dispatch);
		addEditor({ id: editor.id, editor });

		// Get the attachment filename
		const filenames = editor?.savedAttachments?.map((attachment) => attachment.filename);
		if (!filenames) {
			return;
		}

		// Create the props for the component
		const props = {
			editorId: editor.id
		};

		// Render the component
		const { user } = setupTest(<EditAttachmentsBlock {...props} />, { store: reduxStore });

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
});
