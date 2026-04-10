/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React, { act } from 'react';

import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import { screen } from '@testing-library/react';
import * as shell from '@zextras/carbonio-shell-ui';
import { FOLDERS, ParticipantRole } from '@zextras/carbonio-ui-commons';

import { setupTest } from '@test-setup';
import { createFakeIdentity } from '@test-utils/accounts/fakeAccounts';
import {
	generateFolder,
	generateFolderLink,
	generateSharedAccountFolder,
	generateSharedAccountsRoot
} from '@test-utils/folders/folders-generator';
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

		setupTest(<MessageContactList message={message} contactListExpandCB={vi.fn()} isWide={true} />);

		const toRow = screen.getByTestId('ContactNamesToRow');
		expect(toRow).toBeInTheDocument();
		expect(toRow).toHaveTextContent(`label.to: ${toParticipant.address}`);
	});

	it(`should render the [Empty 'To' Field] field with contacts`, () => {
		const message = generateMessage({
			to: [],
			cc: [ccParticipant]
		});

		setupTest(<MessageContactList message={message} contactListExpandCB={vi.fn()} isWide={true} />);

		const toRow = screen.getByTestId('ContactNamesToRow');
		expect(toRow).toBeInTheDocument();
		expect(toRow).toHaveTextContent(`label.to: recipient.toField.missing`);
	});

	it(`should render the To and Cc fields with contacts`, async () => {
		const message = generateMessage({
			to: [toParticipant],
			cc: [ccParticipant]
		});

		setupTest(<MessageContactList message={message} contactListExpandCB={vi.fn()} isWide={true} />);

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
			<MessageContactList message={message} contactListExpandCB={vi.fn()} isWide={true} />
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
			<MessageContactList message={message} contactListExpandCB={vi.fn()} isWide={true} />
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
					contactListExpandCB={vi.fn()}
					folderId={FOLDERS.INBOX}
					isWide={true}
				/>
			);

			const badge = screen.queryByTestId('FolderBadge');
			expect(badge).not.toBeInTheDocument();
		});
		it(`should not show badge if this message is displayed in the same shared folder`, async () => {
			vi.mocked(shell).IS_FOCUS_MODE = false;

			const identity = createFakeIdentity();
			const customFolder = generateFolder();
			const linkFolder = generateFolderLink(customFolder.id, uuidv4.toString(), identity);

			populateFoldersStore({ customFolders: [{ ...customFolder, children: [linkFolder] }] });

			const message = generateMessage({
				folderId: linkFolder.id
			});
			setupTest(
				<MessageContactList
					message={message}
					contactListExpandCB={vi.fn()}
					folderId={linkFolder.id}
					isWide={true}
				/>,
				{
					initialEntries: [`/folder/${linkFolder.id}/message/${message.id}`],
					path: '/folder/:folderId/message/:messageId'
				}
			);

			const badge = screen.queryByTestId('FolderBadge');
			expect(badge).not.toBeInTheDocument();
		});
		it(`should not show badge if this message is displayed in the same shared account folder`, async () => {
			const identity = createFakeIdentity();

			const accountFolder = generateSharedAccountFolder({
				identity,
				folderId: FOLDERS.INBOX
			});

			const root = generateSharedAccountsRoot([{ identity }], [accountFolder]);

			populateFoldersStore({ additionalFolders: root });
			vi.mocked(shell).IS_FOCUS_MODE = false;

			const message = generateMessage({
				folderId: accountFolder.id
			});
			setupTest(
				<MessageContactList
					message={message}
					contactListExpandCB={vi.fn()}
					folderId={message.parent}
					isWide={true}
				/>,
				{
					initialEntries: [`/folder/${message.parent}/message/${message.id}`],
					path: '/folder/:folderId/message/:messageId'
				}
			);

			const badge = screen.queryByTestId('FolderBadge');
			expect(badge).not.toBeInTheDocument();
		});
		it(`should show badge if this message is displayed in a different shared folder`, async () => {
			populateFoldersStore();
			vi.mocked(shell).IS_FOCUS_MODE = false;
			const identity = createFakeIdentity();
			const customFolder = generateFolder();
			const linkFolder = generateFolderLink(customFolder.id, uuidv4.toString(), identity);

			populateFoldersStore({ customFolders: [{ ...customFolder, children: [linkFolder] }] });
			const message = generateMessage({
				folderId: linkFolder.id
			});
			setupTest(
				<MessageContactList
					message={message}
					contactListExpandCB={vi.fn()}
					folderId={FOLDERS.INBOX}
					isWide={true}
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
			const identity = createFakeIdentity();

			const inboxFolder = generateSharedAccountFolder({
				identity,
				folderId: FOLDERS.INBOX
			});

			const sentFolder = generateSharedAccountFolder({
				identity,
				folderId: FOLDERS.SENT
			});

			const root = generateSharedAccountsRoot([{ identity }], [inboxFolder, sentFolder]);

			populateFoldersStore({ additionalFolders: root });
			vi.mocked(shell).IS_FOCUS_MODE = false;

			const message = generateMessage({
				folderId: sentFolder.id
			});

			setupTest(
				<MessageContactList
					message={message}
					contactListExpandCB={vi.fn()}
					folderId={inboxFolder.id}
					isWide={true}
				/>,
				{
					initialEntries: [`/folder/${inboxFolder.id}/message/${message.id}`],
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
					contactListExpandCB={vi.fn()}
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
					contactListExpandCB={vi.fn()}
					folderId={FOLDERS.INBOX}
					isWide={true}
				/>
			);

			const badge = await screen.findByTestId('FolderBadge');
			expect(badge).toBeVisible();
		});
		it(`should show badge if this message is displayed in focus mode`, async () => {
			vi.mocked(shell).IS_FOCUS_MODE = true;
			const message = generateMessage({
				folderId: FOLDERS.INBOX
			});
			populateFoldersStore();
			setupTest(
				<MessageContactList
					message={message}
					contactListExpandCB={vi.fn()}
					folderId={FOLDERS.INBOX}
					isWide={true}
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
