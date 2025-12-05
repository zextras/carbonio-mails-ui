/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { act } from 'react';

import { faker } from '@faker-js/faker';
import { screen } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';
import { FOLDERS, ParticipantRole } from '@zextras/carbonio-ui-commons';
import { find } from 'lodash';

import { getFolders } from '../../../../../../hooks/use-folders';
import { setupTest } from '@test-setup';
import { populateFoldersStore } from '@test-utils/store/folders';
import { generateMessage } from '__test__/generators/generateMessage';
import MessageContactList from 'views/app/detail-panel/preview/parts/message-contact-list';

describe('MessageContactList', () => {
	const toParticipant = { type: ParticipantRole.TO, address: faker.internet.email() };
	const ccParticipant = { type: ParticipantRole.CARBON_COPY, address: faker.internet.email() };
	it('should render the "To" field with contacts', () => {
		const message = generateMessage({
			to: [toParticipant],
			cc: [ccParticipant]
		});

		setupTest(<MessageContactList message={message} contactListExpandCB={jest.fn()} />);

		const toRow = screen.getByTestId('ContactNamesToRow');
		expect(toRow).toBeInTheDocument();
		expect(toRow).toHaveTextContent(`label.to: ${toParticipant.address}`);
	});

	it(`should render the [Empty 'To' Field] field with contacts`, () => {
		const message = generateMessage({
			to: [],
			cc: [ccParticipant]
		});

		setupTest(<MessageContactList message={message} contactListExpandCB={jest.fn()} />);

		const toRow = screen.getByTestId('ContactNamesToRow');
		expect(toRow).toBeInTheDocument();
		expect(toRow).toHaveTextContent(`label.to: recipient.toField.missing`);
	});

	it(`should render the To and Cc fields with contacts`, async () => {
		const message = generateMessage({
			to: [toParticipant],
			cc: [ccParticipant]
		});

		setupTest(<MessageContactList message={message} contactListExpandCB={jest.fn()} />);

		const toRow = screen.getByTestId('ContactNamesToRow');
		expect(toRow).toBeInTheDocument();
		expect(toRow).toHaveTextContent(`label.to: ${toParticipant.address}`);

		const ccRow = screen.getByTestId('ContactNamesCcRow');
		expect(ccRow).toBeInTheDocument();
		expect(ccRow).toHaveTextContent(`label.cc: ${ccParticipant.address}`);
	});

	it(`should collapse and remove Cc field`, async () => {
		const message = generateMessage({
			to: [toParticipant],
			cc: [ccParticipant]
		});

		const { user } = setupTest(
			<MessageContactList message={message} contactListExpandCB={jest.fn()} />
		);

		const contactsListToggleIcon = screen.getByTestId('contacs-list-toggle-icon');
		await act(async () => {
			await user.click(contactsListToggleIcon);
		});

		expect(screen.queryByTestId(`ContactNamesCcRow`)).not.toBeInTheDocument();
	});

	it(`should display contact list toggle icon with collapse`, async () => {
		const message = generateMessage({
			cc: [ccParticipant]
		});
		const { user } = setupTest(
			<MessageContactList message={message} contactListExpandCB={jest.fn()} />
		);
		const toggleDownIcon = await screen.findByTestId('icon: ChevronDown');
		expect(toggleDownIcon).toBeInTheDocument();
		await act(async () => {
			await user.click(toggleDownIcon);
		});
		const toggleIcon = await screen.findByTestId('icon: ChevronUp');
		expect(toggleIcon).toBeInTheDocument();
	});
	describe('badge', () => {
		it(`should not show badge if this message is displayed in the same folder`, async () => {
			const message = generateMessage({
				folderId: FOLDERS.INBOX
			});
			populateFoldersStore();
			setupTest(
				<MessageContactList
					message={message}
					contactListExpandCB={jest.fn()}
					folderId={FOLDERS.INBOX}
				/>
			);

			const badge = screen.queryByTestId('FolderBadge');
			expect(badge).not.toBeInTheDocument();
		});
		it(`should not show badge if this message is displayed in the same shared folder`, async () => {
			populateFoldersStore();
			jest.mocked(shell).IS_FOCUS_MODE = false;
			const folders = getFolders();
			// eslint-disable-next-line testing-library/no-node-access
			const linkFolderId = find(folders[0].children, (folder) => folder.isLink)?.id;
			const message = generateMessage({
				folderId: linkFolderId
			});
			setupTest(
				<MessageContactList
					message={message}
					contactListExpandCB={jest.fn()}
					folderId={linkFolderId}
				/>,
				{
					initialEntries: [`/folder/${linkFolderId}/message/${message.id}`],
					path: '/folder/:folderId/message/:messageId'
				}
			);

			const badge = screen.queryByTestId('FolderBadge');
			expect(badge).not.toBeInTheDocument();
		});
		it(`should not show badge if this message is displayed in the same shared account folder`, async () => {
			populateFoldersStore();
			jest.mocked(shell).IS_FOCUS_MODE = false;
			const folders = getFolders();
			// eslint-disable-next-line testing-library/no-node-access
			const accountFolderId = folders[1].children[1].id;
			const message = generateMessage({
				folderId: accountFolderId
			});
			setupTest(
				<MessageContactList
					message={message}
					contactListExpandCB={jest.fn()}
					folderId={accountFolderId}
				/>,
				{
					initialEntries: [`/folder/${accountFolderId}/message/${message.id}`],
					path: '/folder/:folderId/message/:messageId'
				}
			);

			const badge = screen.queryByTestId('FolderBadge');
			expect(badge).not.toBeInTheDocument();
		});
		it(`should show badge if this message is displayed in a different shared folder`, async () => {
			populateFoldersStore();
			jest.mocked(shell).IS_FOCUS_MODE = false;
			const folders = getFolders();
			// eslint-disable-next-line testing-library/no-node-access
			const linkFolderId = find(folders[0].children, (folder) => folder.isLink)?.id;
			const message = generateMessage({
				folderId: linkFolderId
			});
			setupTest(
				<MessageContactList
					message={message}
					contactListExpandCB={jest.fn()}
					folderId={FOLDERS.INBOX}
				/>,
				{
					initialEntries: [`/folder/${FOLDERS.INBOX}/message/${message.id}`],
					path: '/folder/:folderId/message/:messageId'
				}
			);

			const badge = await screen.findByTestId('FolderBadge');
			expect(badge).toBeVisible();
		});
		it(`should show badge if this message is displayed in a different shared account folder`, async () => {
			populateFoldersStore();
			jest.mocked(shell).IS_FOCUS_MODE = false;
			const folders = getFolders();
			// eslint-disable-next-line testing-library/no-node-access
			const accountFolders = folders[1].children;
			const message = generateMessage({
				folderId: accountFolders[0].id
			});
			setupTest(
				<MessageContactList
					message={message}
					contactListExpandCB={jest.fn()}
					folderId={accountFolders[1].id}
				/>,
				{
					initialEntries: [`/folder/${accountFolders[1].id}/message/${message.id}`],
					path: '/folder/:folderId/message/:messageId'
				}
			);

			const badge = await screen.findByTestId('FolderBadge');
			expect(badge).toBeVisible();
		});
		it(`should not show badge if this message in not displayed inside a folder (eml)`, async () => {
			const message = { ...generateMessage(), parent: undefined };
			populateFoldersStore();

			setupTest(
				<MessageContactList
					// MailMessage type is wrong, parent can actually be undefined, this test cover this possibility
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					message={message}
					contactListExpandCB={jest.fn()}
					folderId={FOLDERS.INBOX}
				/>
			);

			const badge = screen.queryByTestId('FolderBadge');
			expect(badge).not.toBeInTheDocument();
		});
		it(`should show badge if this message is displayed in a different folder`, async () => {
			const message = generateMessage({
				folderId: FOLDERS.SENT
			});
			populateFoldersStore();
			setupTest(
				<MessageContactList
					message={message}
					contactListExpandCB={jest.fn()}
					folderId={FOLDERS.INBOX}
				/>
			);

			const badge = await screen.findByTestId('FolderBadge');
			expect(badge).toBeVisible();
		});
		it(`should show badge if this message is displayed in focus mode`, async () => {
			jest.mocked(shell).IS_FOCUS_MODE = true;
			const message = generateMessage({
				folderId: FOLDERS.INBOX
			});
			populateFoldersStore();
			setupTest(
				<MessageContactList
					message={message}
					contactListExpandCB={jest.fn()}
					folderId={FOLDERS.INBOX}
				/>,
				{
					initialEntries: [`/folder/${message.parent}/message/${message.id}`],
					path: '/folder/:folderId/message/:messageId'
				}
			);

			const badge = await screen.findByTestId('FolderBadge');
			expect(badge).toBeVisible();
		});
	});
});
