/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen } from '@testing-library/react';
import { times } from 'lodash';

import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { getFolder } from '../../carbonio-ui-commons/store/zustand/folder';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../carbonio-ui-commons/test/mocks/store/folders';
import { makeListItemsVisible, setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { generateConversation } from '../../tests/generators/generateConversation';
import { ConvActionRequest, ConvActionResponse, NormalizedConversation } from '../../types';
import { MoveConversation } from '../move-conv';

describe('MoveConv', () => {
	const { children: inboxChildren } = getFolder(FOLDERS.INBOX) ?? {};
	const sourceFolder = inboxChildren?.[0].id ?? '';
	const conversations: Array<NormalizedConversation> = times(10, () =>
		generateConversation({ folderId: sourceFolder })
	);
	const convIds = conversations.map<string>((msg) => msg.id);

	describe('Modal title', () => {
		it('move mode should display the modal title', async () => {
			const component = (
				<MoveConversation
					folderId={sourceFolder}
					selectedIDs={convIds}
					onClose={jest.fn()}
					isRestore={false}
					deselectAll={jest.fn()}
				/>
			);

			setupTest(component);

			expect(screen.getByText('Move')).toBeVisible();
		});

		it('restore mode should be visible', async () => {
			const component = (
				<MoveConversation
					folderId={sourceFolder}
					selectedIDs={convIds}
					onClose={jest.fn()}
					isRestore
					deselectAll={jest.fn()}
				/>
			);

			setupTest(component);

			expect(screen.getByText('Restore')).toBeVisible();
		});
	});

	describe('Confirm button', () => {
		it('should be visible', async () => {
			const component = (
				<MoveConversation
					folderId={sourceFolder}
					selectedIDs={convIds}
					onClose={jest.fn()}
					isRestore={false}
					deselectAll={jest.fn()}
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
				<MoveConversation
					folderId={sourceFolder}
					selectedIDs={convIds}
					onClose={jest.fn()}
					isRestore={false}
					deselectAll={jest.fn()}
				/>
			);

			const { user } = setupTest(component);
			makeListItemsVisible();
			const inboxFolderListItem = await screen.findByTestId(
				`folder-accordion-item-${destinationFolder}`,
				{},
				{ timeout: 10000 }
			);

			act(() => {
				jest.advanceTimersByTime(1000);
			});

			await act(async () => {
				await user.click(inboxFolderListItem);
			});

			const button = screen.getByRole('button', {
				name: /Move/
			});
			expect(button).toBeEnabled();
		});

		it('When a destination folder is selected and the user clicks on the confirm the API is called and the success snackbar is displayed', async () => {
			populateFoldersStore();

			const destinationFolder = FOLDERS.INBOX;

			const interceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
				'ConvAction',
				{
					action: {
						id: convIds.join(','),
						op: 'move'
					}
				}
			);

			const component = (
				<MoveConversation
					folderId={sourceFolder}
					selectedIDs={convIds}
					onClose={jest.fn()}
					isRestore={false}
					deselectAll={jest.fn()}
				/>
			);

			const { user } = setupTest(component);
			makeListItemsVisible();

			const inboxFolderListItem = await screen.findByTestId(
				`folder-accordion-item-${destinationFolder}`,
				{},
				{ timeout: 10000 }
			);

			act(() => {
				jest.advanceTimersByTime(1000);
			});

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
			expect(requestParameter.action.id).toBe(convIds.join(','));
			expect(requestParameter.action.op).toBe('move');
			expect(requestParameter.action.l).toBe(destinationFolder);
			expect(requestParameter.action.tn).toBeUndefined();
		});
	});
});
