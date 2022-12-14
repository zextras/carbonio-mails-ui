/*
 * SPDX-FileCopyrightText: 2022 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { screen } from '@testing-library/react';
import { noop } from 'lodash';
import React from 'react';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import { createEditorCase } from '../../../../../tests/generators/editors';
import { generateStore } from '../../../../../tests/generators/store';

import EditAttachmentsBlock from '../edit-attachments-block';

describe('Attachments visualization', () => {
	test.each`
		editorId | attachmentType
		${'1'}   | ${'Various format attachments'}
	`(`$attachmentType attachments are visible in email editor`, async ({ editorId }) => {
		// Generate editor info for the store
		const editor = await createEditorCase(editorId);
		const editors = {
			status: 'idle',
			editors: {
				[editor.id ?? '']: editor
			}
		};

		// Generate the store
		const store = generateStore({ editors });

		// Get the attachment filename
		const filenames = editor?.attachmentFiles?.map((attachment) => attachment.filename);
		if (!filenames) {
			return;
		}

		// Create the props for the component
		const props = {
			editor,
			throttledSaveToDraft: noop
		};

		// Render the component
		const { user } = setupTest(<EditAttachmentsBlock {...props} />, { store });

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
