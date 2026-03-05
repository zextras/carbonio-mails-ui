/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { act } from '@testing-library/react';
import { Theme, useTheme } from '@zextras/carbonio-design-system';

import { TESTID_SELECTORS } from '../../../../../../__test__/constants';
import { setupEditorStore } from '../../../../../../__test__/generators/editor-store';
import { createSoapAPIInterceptor } from '../../../../../../__test__/mocks/network/msw/create-api-interceptor';
import { setupTest, screen, setupHook } from '../../../../../../__test__/test-setup';
import { FOLDER_ACTIONS } from '../../../../../../commons/utilities';
import { PROCESS_STATUS } from '../../../../../../constants';
import { generateNewMessageEditor } from '../../../../../../store/editor/editor-generators';
import { EditViewFooter } from '../edit-view-footer';
import { MailsEditorV2 } from 'types/editor';

const getDraftDeleteBottom = (): HTMLElement =>
	screen.getByRoleWithIcon('button', {
		icon: TESTID_SELECTORS.icons.trash
	});

const getConfirmationModalMessage = (): HTMLElement | null =>
	screen.queryByText('Are you sure you want to delete this draft?');

const getConfirmationModalButton = (): HTMLElement =>
	screen.getByRole('button', { name: /delete/i });

const awaitModalOpening = (): void => {
	act(() => {
		vi.advanceTimersByTime(10);
	});
};

const draftId = faker.number.int().toString();

describe('EditViewFooter', () => {
	describe('Draft not saved yet', () => {
		it('should render the "Draft not saved" text', () => {
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });

			setupTest(<EditViewFooter editorId={editor.id} />);

			expect(screen.getByText('Draft not saved')).toBeVisible();
		});

		it('should render an enabled delete button', () => {
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });

			setupTest(<EditViewFooter editorId={editor.id} />);

			expect(getDraftDeleteBottom()).toBeEnabled();
		});

		it('should immediately call onDraftDeleted when user clicks the delete button', async () => {
			const onDraftDeleted = vi.fn();
			const editor = generateNewMessageEditor();
			setupEditorStore({ editors: [editor] });

			const { user } = setupTest(
				<EditViewFooter editorId={editor.id} onDraftDeleted={onDraftDeleted} />
			);
			await user.click(getDraftDeleteBottom());

			expect(onDraftDeleted).toHaveBeenCalled();
		});
	});

	describe('Draft saving', () => {
		it('should render the "Saving..." text', () => {
			const editor: MailsEditorV2 = {
				...generateNewMessageEditor(),
				draftSaveProcessStatus: { status: PROCESS_STATUS.RUNNING }
			};
			setupEditorStore({ editors: [editor] });

			setupTest(<EditViewFooter editorId={editor.id} />);

			expect(screen.getByText('Saving...')).toBeVisible();
		});

		it('should render a disabled delete button', () => {
			const editor: MailsEditorV2 = {
				...generateNewMessageEditor(),
				draftSaveProcessStatus: { status: PROCESS_STATUS.RUNNING }
			};
			setupEditorStore({ editors: [editor] });

			setupTest(<EditViewFooter editorId={editor.id} />);

			expect(getDraftDeleteBottom()).toBeDisabled();
		});
	});

	describe('Draft saved', () => {
		it('should render the time of the last save if it is within the current day', () => {
			const lastSaveTimestamp = new Date(Date.now() - 1000 * 60); // 1 minute ago
			const formattedTime = lastSaveTimestamp.toLocaleTimeString([], {
				hour: 'numeric',
				minute: '2-digit'
			});
			const editor: MailsEditorV2 = {
				...generateNewMessageEditor(),
				did: draftId,
				draftSaveProcessStatus: {
					status: PROCESS_STATUS.COMPLETED,
					lastSaveTimestamp
				}
			};
			setupEditorStore({ editors: [editor] });

			setupTest(<EditViewFooter editorId={editor.id} />);

			expect(screen.getByText(`Draft saved at ${formattedTime}`)).toBeVisible();
		});

		it('should render the date and time of the last save if it is not within the current day', () => {
			const lastSaveTimestamp = new Date(Date.now() - 1000 * 60 * 60 * 24); // 1 day ago
			const formattedDate = lastSaveTimestamp.toLocaleString([], {
				year: 'numeric',
				month: '2-digit',
				day: '2-digit'
			});
			const formattedTime = lastSaveTimestamp.toLocaleString([], {
				hour: 'numeric',
				minute: '2-digit'
			});

			const editor: MailsEditorV2 = {
				...generateNewMessageEditor(),
				did: draftId,
				draftSaveProcessStatus: {
					status: PROCESS_STATUS.COMPLETED,
					lastSaveTimestamp
				}
			};
			setupEditorStore({ editors: [editor] });

			setupTest(<EditViewFooter editorId={editor.id} />);

			expect(screen.getByText(`Draft saved on ${formattedDate} at ${formattedTime}`)).toBeVisible();
		});

		it('should render an enabled delete button', () => {
			const editor: MailsEditorV2 = {
				...generateNewMessageEditor(),
				did: draftId,
				draftSaveProcessStatus: {
					status: PROCESS_STATUS.COMPLETED,
					lastSaveTimestamp: new Date()
				}
			};
			setupEditorStore({ editors: [editor] });

			setupTest(<EditViewFooter editorId={editor.id} />);

			expect(getDraftDeleteBottom()).toBeEnabled();
		});

		it('should ask for confirmation before deleting the draft', async () => {
			const {
				result: { current: theme }
			} = setupHook<never, Theme>(useTheme);
			const editor: MailsEditorV2 = {
				...generateNewMessageEditor(),
				did: draftId,
				draftSaveProcessStatus: {
					status: PROCESS_STATUS.COMPLETED,
					lastSaveTimestamp: new Date()
				}
			};
			setupEditorStore({ editors: [editor] });

			const { user } = setupTest(<EditViewFooter editorId={editor.id} />);
			await act(() => user.click(getDraftDeleteBottom()));
			awaitModalOpening();

			expect(getConfirmationModalMessage()).toBeVisible();
			expect(getConfirmationModalButton()).toBeVisible();
		});

		it('should call the DeleteMsg API when the deletion is confirmed', async () => {
			const apiInterceptor = createSoapAPIInterceptor('MsgAction');
			const editor: MailsEditorV2 = {
				...generateNewMessageEditor(),
				did: draftId,
				draftSaveProcessStatus: {
					status: PROCESS_STATUS.COMPLETED,
					lastSaveTimestamp: new Date()
				}
			};
			setupEditorStore({ editors: [editor] });

			const { user } = setupTest(<EditViewFooter editorId={editor.id} />);
			await user.click(getDraftDeleteBottom());
			awaitModalOpening();
			await act(() => user.click(getConfirmationModalButton()));
			const apiRequestPayload = await apiInterceptor;

			expect(apiRequestPayload).toEqual(
				expect.objectContaining({
					action: { id: draftId, op: FOLDER_ACTIONS.TRASH }
				})
			);
		});

		it('should close the confirmation modal when deletion is successful', async () => {
			const apiInterceptor = createSoapAPIInterceptor('MsgAction');
			const editor: MailsEditorV2 = {
				...generateNewMessageEditor(),
				did: draftId,
				draftSaveProcessStatus: {
					status: PROCESS_STATUS.COMPLETED,
					lastSaveTimestamp: new Date()
				}
			};
			setupEditorStore({ editors: [editor] });

			const { user } = setupTest(<EditViewFooter editorId={editor.id} />);
			await user.click(getDraftDeleteBottom());
			awaitModalOpening();
			await act(() => user.click(getConfirmationModalButton()));

			await apiInterceptor;

			expect(getConfirmationModalMessage()).not.toBeInTheDocument();
		});

		it('should call onDraftDeleted when the draft is deleted', async () => {
			createSoapAPIInterceptor('MsgAction');
			const onDraftDeleted = vi.fn();
			const editor: MailsEditorV2 = {
				...generateNewMessageEditor(),
				did: draftId,
				draftSaveProcessStatus: {
					status: PROCESS_STATUS.COMPLETED,
					lastSaveTimestamp: new Date()
				}
			};
			const editors = [editor];
			setupEditorStore({ editors });

			const { user } = setupTest(
				<EditViewFooter editorId={editor.id} onDraftDeleted={onDraftDeleted} />
			);

			await user.click(getDraftDeleteBottom());
			awaitModalOpening();
			await act(() => user.click(getConfirmationModalButton()));

			expect(onDraftDeleted).toHaveBeenCalled();
		});

		it.todo('should not call onDraftDeleted when the draft deletion fails');
	});
});
