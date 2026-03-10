/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen } from '@testing-library/react';
import { ErrorSoapBodyResponse } from '@zextras/carbonio-shell-ui';
import { FOLDERS, getFolder } from '@zextras/carbonio-ui-commons';
import { times } from 'lodash';

import { setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { generateMessage } from '__test__/generators/generateMessage';
import { MailMessage } from 'types/messages';
import { MsgActionRequest, MsgActionResponse } from 'types/soap/msg-action';
import { MoveMessage } from 'ui-actions/move-msg';

describe('MoveMsg', () => {
	const { children: inboxChildren } = getFolder(FOLDERS.INBOX) ?? {};
	const sourceFolder = inboxChildren?.[0].id ?? '';
	const msgs: Array<MailMessage> = times(10, () => generateMessage({ folderId: sourceFolder }));
	const msgIds = msgs.map<string>((msg) => msg.id);

	describe('Modal title', () => {
		it('should display be visible when in move mode', async () => {
			const component = (
				<MoveMessage
					folderId={sourceFolder}
					selectedIDs={msgIds}
					onClose={vi.fn()}
					isRestore={false}
				/>
			);

			setupTest(component);

			expect(screen.getByText('Move Message')).toBeVisible();
		});

		it('should be visible when in restore mode', async () => {
			const component = (
				<MoveMessage folderId={sourceFolder} selectedIDs={msgIds} onClose={vi.fn()} isRestore />
			);

			setupTest(component);

			expect(screen.getByText('Restore')).toBeVisible();
		});
	});

	describe('Confirm button', () => {
		it('should be visible', async () => {
			const component = (
				<MoveMessage
					folderId={sourceFolder}
					selectedIDs={msgIds}
					onClose={vi.fn()}
					isRestore={false}
				/>
			);

			setupTest(component);

			expect(
				screen.getByRole('button', {
					name: /Move/
				})
			).toBeVisible();
		});

		it('should be enabled if the user select a destination folder', async () => {
			populateFoldersStore();
			const destinationFolder = FOLDERS.INBOX;

			const component = (
				<MoveMessage
					folderId={sourceFolder}
					selectedIDs={msgIds}
					onClose={vi.fn()}
					isRestore={false}
				/>
			);

			const { user } = setupTest(component);
			const inboxFolderListItem = await screen.findByTestId(
				`folder-accordion-item-${destinationFolder}`,
				{}
			);

			await user.click(inboxFolderListItem);

			const button = screen.getByRole('button', {
				name: /Move/
			});
			expect(button).toBeEnabled();
		});

		it('should call the correct API when a destination folder is selected and the user clicks on the confirm button', async () => {
			populateFoldersStore();
			const destinationFolder = FOLDERS.INBOX;

			const interceptor = createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>(
				'MsgAction',
				{
					action: {
						id: msgIds.join(','),
						op: 'move'
					}
				}
			);

			const component = (
				<MoveMessage
					folderId={sourceFolder}
					selectedIDs={msgIds}
					onClose={vi.fn()}
					isRestore={false}
				/>
			);

			const { user } = setupTest(component);

			const inboxFolderListItem = await screen.findByTestId(
				`folder-accordion-item-${destinationFolder}`,
				{}
			);

			await act(async () => {
				await user.click(inboxFolderListItem);
			});

			const button = screen.getByRole('button', {
				name: /Move/
			});

			await act(async () => {
				await user.click(button);
			});

			const requestParameter = await interceptor;
			expect(requestParameter.action.id).toBe(msgIds.join(','));
			expect(requestParameter.action.op).toBe('move');
			expect(requestParameter.action.l).toBe(destinationFolder);
			expect(requestParameter.action.f).toBeUndefined();
			expect(requestParameter.action.tn).toBeUndefined();
		});

		it('should show an error snackbar when the API call fails ', async () => {
			populateFoldersStore();
			const destinationFolder = FOLDERS.INBOX;

			createSoapAPIInterceptor<MsgActionRequest, ErrorSoapBodyResponse>(
				'MsgAction',
				buildSoapErrorResponseBody()
			);

			const component = (
				<MoveMessage
					folderId={sourceFolder}
					selectedIDs={msgIds}
					onClose={vi.fn()}
					isRestore={false}
				/>
			);

			const { user } = setupTest(component);

			const inboxFolderListItem = await screen.findByTestId(
				`folder-accordion-item-${destinationFolder}`,
				{}
			);

			await act(async () => {
				await user.click(inboxFolderListItem);
			});

			const button = screen.getByRole('button', {
				name: /Move/
			});

			await act(async () => {
				await user.click(button);
			});

			expect(screen.getByText('Something went wrong, please try again')).toBeVisible();
		});

		it('should call the onMoveComplete callback when the move is successful', async () => {
			const onMoveComplete = vi.fn();
			populateFoldersStore();
			const destinationFolder = FOLDERS.INBOX;
			createSoapAPIInterceptor<MsgActionRequest, MsgActionResponse>('MsgAction', {
				action: {
					id: msgIds.join(','),
					op: 'move'
				}
			});

			const component = (
				<MoveMessage
					folderId={sourceFolder}
					selectedIDs={msgIds}
					onClose={vi.fn()}
					isRestore={false}
					onMoveComplete={onMoveComplete}
				/>
			);

			const { user } = setupTest(component);

			const inboxFolderListItem = await screen.findByTestId(
				`folder-accordion-item-${destinationFolder}`,
				{}
			);

			await act(async () => {
				await user.click(inboxFolderListItem);
			});

			const button = screen.getByRole('button', {
				name: /Move/
			});

			await act(async () => {
				await user.click(button);
			});

			expect(onMoveComplete).toHaveBeenCalledWith(msgIds);
		});
	});
});
