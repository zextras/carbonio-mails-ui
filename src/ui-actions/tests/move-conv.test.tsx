/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, waitFor } from '@testing-library/react';
import { FOLDERS, getFolder } from '@zextras/carbonio-ui-commons';
import { times } from 'lodash';
import * as reactRouterDom from 'react-router-dom';
import type { Mock } from 'vitest';

import { makeListItemsVisible, setupTest } from '@test-setup';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { populateFoldersStore } from '@test-utils/store/folders';
import { buildSoapErrorResponseBody } from '@test-utils/utils/soap';
import { generateConversation } from '__test__/generators/generateConversation';
import { NormalizedConversation } from 'types/conversations';
import { ConvActionRequest, ConvActionResponse } from 'types/soap/conv-action';
import { MoveConversation } from 'ui-actions/move-conv';

vi.mock('react-router-dom', async () => ({
	...(await vi.importActual('react-router-dom')),
	useNavigate: vi.fn()
}));

describe('MoveConversation', () => {
	const { children: inboxChildren } = getFolder(FOLDERS.INBOX) ?? {};
	const sourceFolder = inboxChildren?.[0].id ?? '';
	const conversations: Array<NormalizedConversation> = times(10, () =>
		generateConversation({ folderId: sourceFolder })
	);
	const convIds = conversations.map<string>((msg) => msg.id);

	it('renders expected title when in restore Mode', () => {
		setupTest(
			<MoveConversation folderId={sourceFolder} selectedIDs={convIds} onClose={vi.fn()} isRestore />
		);
		expect(screen.getByText('Restore')).toBeVisible();
	});

	it('renders expected title when NOT in restore Mode', () => {
		setupTest(
			<MoveConversation
				folderId={sourceFolder}
				selectedIDs={convIds}
				onClose={vi.fn()}
				isRestore={false}
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
					onClose={vi.fn()}
					isRestore={false}
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
					onClose={vi.fn()}
					isRestore={false}
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
					onClose={vi.fn()}
					isRestore={false}
				/>
			);
			makeListItemsVisible();
			const inboxFolderListItem = await screen.findByTestId(
				`folder-accordion-item-${destinationFolder}`
			);

			await user.click(inboxFolderListItem);

			await waitFor(() => {
				const moveButton = screen.getByRole('button', {
					name: /Move/
				});
				expect(moveButton).toBeEnabled();
			});
		});
	});

	it('calls onClose when "Cancel" button is clicked', async () => {
		const onCloseFn = vi.fn();
		const { user } = setupTest(
			<MoveConversation
				folderId={sourceFolder}
				selectedIDs={convIds}
				onClose={onCloseFn}
				isRestore={false}
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
				onClose={vi.fn()}
				isRestore={false}
			/>
		);
		makeListItemsVisible();
		const inboxFolderListItem = await screen.findByTestId(
			`folder-accordion-item-${destinationFolder}`
		);

		await user.click(inboxFolderListItem);

		const button = await screen.findByRole('button', {
			name: /Move/
		});

		await user.click(button);

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
				onClose={vi.fn()}
				isRestore={false}
			/>
		);
		makeListItemsVisible();
		const inboxFolderListItem = await screen.findByTestId(`folder-accordion-item-${FOLDERS.INBOX}`);

		await user.click(inboxFolderListItem);

		const button = await screen.findByRole('button', {
			name: /Move/
		});

		await user.click(button);

		await interceptor;

		expect(await screen.findByText('Something went wrong, please try again')).toBeInTheDocument();
	});

	it('navigates to folder on success', async () => {
		const navigate = vi.fn();
		(reactRouterDom.useNavigate as Mock).mockReturnValue(navigate);
		populateFoldersStore();

		createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>('ConvAction', {
			action: {
				id: convIds.join(','),
				op: 'move'
			}
		});

		const { user } = setupTest(
			<MoveConversation
				folderId={sourceFolder}
				selectedIDs={convIds}
				onClose={vi.fn()}
				isRestore={false}
			/>
		);

		makeListItemsVisible();

		const inboxFolderListItem = await screen.findByTestId(`folder-accordion-item-${FOLDERS.INBOX}`);

		await user.click(inboxFolderListItem);

		const moveButton = await screen.findByRole('button', { name: /Move/ });
		await waitFor(() => expect(moveButton).toBeEnabled());
		await user.click(moveButton);

		const successMessage = await screen.findByText('Conversation successfully moved');
		expect(successMessage).toBeInTheDocument();

		const goToFolderButton = await screen.findByRole('button', { name: /GO TO FOLDER/ });
		await user.click(goToFolderButton);
		expect(navigate).toHaveBeenCalledWith('/mails/folder/2', { replace: true });
	});

	it('should call onMoveComplete on success', async () => {
		const onMoveComplete = vi.fn();
		populateFoldersStore();

		createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>('ConvAction', {
			action: {
				id: convIds.join(','),
				op: 'move'
			}
		});

		const { user } = setupTest(
			<MoveConversation
				folderId={sourceFolder}
				selectedIDs={convIds}
				onClose={vi.fn()}
				isRestore={false}
				onMoveComplete={onMoveComplete}
			/>
		);

		const inboxFolderListItem = await screen.findByTestId(`folder-accordion-item-${FOLDERS.INBOX}`);

		await user.click(inboxFolderListItem);
		await user.click(await screen.findByRole('button', { name: /Move/ }));

		await expect(screen.findByText('Conversation successfully moved')).resolves.toBeInTheDocument();

		expect(onMoveComplete).toHaveBeenCalledWith(convIds);
	});
});
