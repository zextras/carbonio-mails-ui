/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { TESTID_SELECTORS } from '../../../../../../__test__/constants';
import { setupEditorStore } from '../../../../../../__test__/generators/editor-store';
import { setupTest, screen } from '../../../../../../__test__/test-setup';
import { PROCESS_STATUS } from '../../../../../../constants';
import { generateNewMessageEditor } from '../../../../../../store/editor/editor-generators';
import { MailsEditorV2 } from '../../../../../../types';
import { EditViewFooter } from '../edit-view-footer';

describe('EditViewFooter', () => {
	describe('Appearence', () => {

		
		describe('Draft not saved yet', () => {
			it('should render the "Draft not saved" text', () => {
				const editor = generateNewMessageEditor();
				const editors = [editor];
				setupEditorStore({ editors });

				setupTest(<EditViewFooter editorId={editor.id} />);

				expect(screen.getByText('Draft not saved')).toBeVisible();
			});

			it('should render a disabled delete button', () => {
				const editor = generateNewMessageEditor();
				const editors = [editor];
				setupEditorStore({ editors });

				setupTest(<EditViewFooter editorId={editor.id} />);
				const deleteButton = screen.getByRoleWithIcon('button', {
					icon: TESTID_SELECTORS.icons.trash
				});

				expect(deleteButton).toBeDisabled();
			});
		});

		describe('Draft saving', () => {
			it('should render the "Saving..." text', () => {
				const editor: MailsEditorV2 = {
					...generateNewMessageEditor(),
					draftSaveProcessStatus: { status: PROCESS_STATUS.RUNNING }
				};
				const editors = [editor];
				setupEditorStore({ editors });

				setupTest(<EditViewFooter editorId={editor.id} />);

				expect(screen.getByText('Saving...')).toBeVisible();
			});

			it('should render a disabled delete button', () => {
				const editor: MailsEditorV2 = {
					...generateNewMessageEditor(),
					draftSaveProcessStatus: { status: PROCESS_STATUS.RUNNING }
				};
				const editors = [editor];
				setupEditorStore({ editors });

				setupTest(<EditViewFooter editorId={editor.id} />);
				const deleteButton = screen.getByRoleWithIcon('button', {
					icon: TESTID_SELECTORS.icons.trash
				});

				expect(deleteButton).toBeDisabled();
			});
		});

		describe('Draft saved', () => {
			it.todo('should render an enabled delete button');



			it('should render the last saved timestamp', () => {
				const lastSaveTimestamp = new Date(Date.now() - 1000 * 60); // 1 minute ago
				const editor: MailsEditorV2 = {
					...generateNewMessageEditor(),
					did: 'draft-id-123',
					draftSaveProcessStatus: {
						status: PROCESS_STATUS.COMPLETED,
						lastSaveTimestamp
					}
				};
				const editors = [editor];
				setupEditorStore({ editors });

				setupTest(<EditViewFooter editorId={editor.id} />);

				const formattedTime = new Intl.DateTimeFormat(undefined, {
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric'
				}).format(new Date(lastSaveTimestamp));

				expect(screen.getByText(`Draft saved at ${formattedTime}`)).toBeVisible();
			});

			it.todo('should call onDeleteClick when delete button is clicked');
		});
	});
});
