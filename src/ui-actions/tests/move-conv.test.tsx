/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { act, screen, waitFor } from '@testing-library/react';
import * as hooks from '@zextras/carbonio-shell-ui';
import { times } from 'lodash';

import { FOLDERS } from '../../carbonio-ui-commons/constants/folders';
import { getFolder } from '../../carbonio-ui-commons/store/zustand/folder';
import { createSoapAPIInterceptor } from '../../carbonio-ui-commons/test/mocks/network/msw/create-api-interceptor';
import { populateFoldersStore } from '../../carbonio-ui-commons/test/mocks/store/folders';
import { buildSoapErrorResponseBody } from '../../carbonio-ui-commons/test/mocks/utils/soap';
import { makeListItemsVisible, setupTest } from '../../carbonio-ui-commons/test/test-setup';
import { generateConversation } from '../../tests/generators/generateConversation';
import { ConvActionRequest, ConvActionResponse, NormalizedConversation } from '../../types';
import { MoveConversation } from '../move-conv';

describe('MoveConversation', () => {
	const { children: inboxChildren } = getFolder(FOLDERS.INBOX) ?? {};
	const sourceFolder = inboxChildren?.[0].id ?? '';
	const conversations: Array<NormalizedConversation> = times(10, () =>
		generateConversation({ folderId: sourceFolder })
	);
	const convIds = conversations.map<string>((msg) => msg.id);

	it('renders expected title when in restore Mode', () => {
		setupTest(
			<MoveConversation
				folderId={sourceFolder}
				selectedIDs={convIds}
				onClose={jest.fn()}
				isRestore
				deselectAll={jest.fn()}
			/>
		);
		expect(screen.getByText('Restore')).toBeVisible();
	});

	it('renders expected title when NOT in restore Mode', () => {
		setupTest(
			<MoveConversation
				folderId={sourceFolder}
				selectedIDs={convIds}
				onClose={jest.fn()}
				isRestore={false}
				deselectAll={jest.fn()}
			/>
		);
		expect(screen.getByText('Move Conversation')).toBeVisible();
	});

	describe('Confirm button', () => {
		it('should be visible', async () => {
			setupTest(
				<MoveConversation
					folderId={sourceFolder}
					selectedIDs={convIds}
					onClose={jest.fn()}
					isRestore={false}
					deselectAll={jest.fn()}
				/>
			);
			const moveButton = screen.getByRole('button', {
				name: /Move/
			});
			expect(moveButton).toBeVisible();
		});

		it('should be disabled if no destination folder is selected', async () => {
			populateFoldersStore();
			setupTest(
				<MoveConversation
					folderId={sourceFolder}
					selectedIDs={convIds}
					onClose={jest.fn()}
					isRestore={false}
					deselectAll={jest.fn()}
				/>
			);

			makeListItemsVisible();
			const moveButton = screen.getByRole('button', {
				name: /Move/
			});
			expect(moveButton).toBeDisabled();
		});

		it('should be enabled if the user select a destination folder', async () => {
			populateFoldersStore();
			const destinationFolder = FOLDERS.INBOX;
			const { user } = setupTest(
				<MoveConversation
					folderId={sourceFolder}
					selectedIDs={convIds}
					onClose={jest.fn()}
					isRestore={false}
					deselectAll={jest.fn()}
				/>
			);
			makeListItemsVisible();
			const inboxFolderListItem = await screen.findByTestId(
				`folder-accordion-item-${destinationFolder}`
			);
			act(() => {
				jest.advanceTimersByTime(1000);
			});
			await act(async () => {
				await user.click(inboxFolderListItem);
			});
			const moveButton = screen.getByRole('button', {
				name: /Move/
			});
			expect(moveButton).toBeEnabled();
		});
	});

	it('calls onClose when "Cancel" button is clicked', async () => {
		const onCloseFn = jest.fn();
		const { user } = setupTest(
			<MoveConversation
				folderId={sourceFolder}
				selectedIDs={convIds}
				onClose={onCloseFn}
				isRestore={false}
				deselectAll={jest.fn()}
			/>
		);
		await user.click(screen.getByText('Cancel'));
		expect(onCloseFn).toHaveBeenCalled();
	});

	it('should calls API when confirming move', async () => {
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
		const { user } = setupTest(
			<MoveConversation
				folderId={sourceFolder}
				selectedIDs={convIds}
				onClose={jest.fn()}
				isRestore={false}
				deselectAll={jest.fn()}
			/>
		);
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
		const request = await interceptor;
		expect(request.action.id).toBe(convIds.join(','));
		expect(request.action.op).toBe('move');
		expect(request.action.l).toBe(destinationFolder);
		expect(request.action.tn).toBeUndefined();
	});
	it('should show an error message if API call returns a Fault case', async () => {
		populateFoldersStore();

		const interceptor = createSoapAPIInterceptor('ConvAction', buildSoapErrorResponseBody());
		const { user } = setupTest(
			<MoveConversation
				folderId={sourceFolder}
				selectedIDs={convIds}
				onClose={jest.fn()}
				isRestore={false}
				deselectAll={jest.fn()}
			/>
		);
		makeListItemsVisible();
		const inboxFolderListItem = await screen.findByTestId(
			`folder-accordion-item-${FOLDERS.INBOX}`,
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
		await interceptor;

		expect(await screen.findByText('Something went wrong, please try again')).toBeInTheDocument();
	});

	it('navigates to folder on success', async () => {
		populateFoldersStore();
		const spyReplaceHistory = jest.spyOn(hooks, 'replaceHistory');
		const interceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
			'ConvAction',
			{
				action: {
					id: convIds.join(','),
					op: 'move'
				}
			}
		);
		const { user } = setupTest(
			<MoveConversation
				folderId={sourceFolder}
				selectedIDs={convIds}
				onClose={jest.fn()}
				isRestore={false}
				deselectAll={jest.fn()}
			/>
		);

		makeListItemsVisible();
		const inboxFolderListItem = await screen.findByTestId(
			`folder-accordion-item-${FOLDERS.INBOX}`,
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
		await interceptor;
		expect(await screen.findByText('Conversation successfully moved')).toBeInTheDocument();
		const snackbarBtn = screen.getByRole('button', {
			name: /GO TO FOLDER/
		});
		await act(async () => {
			await user.click(snackbarBtn);
		});
		await waitFor(() => {
			expect(spyReplaceHistory).toHaveBeenCalledWith('/folder/2');
		});
	});
});
