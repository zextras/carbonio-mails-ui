/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { screen, within } from '@testing-library/react';
import assert from 'node:assert';

import { FOLDERS } from '../../../carbonio-ui-commons/constants/folders';
import { createFakeIdentity } from '../../../carbonio-ui-commons/test/mocks/accounts/fakeAccounts';
import {
	generateFolder,
	generateFolderLink
} from '../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { getMocksContext } from '../../../carbonio-ui-commons/test/mocks/utils/mocks-context';
import { setupTest } from '../../../carbonio-ui-commons/test/test-setup';
import AccordionCustomComponent from '../accordion-custom-component';

describe('accordion-custom-component', () => {
	it('should render without crashing', () => {
		const inboxFolder = generateFolder({ id: FOLDERS.INBOX, isLink: false });
		assert(inboxFolder, 'Inbox folder should be defined');

		setupTest(<AccordionCustomComponent item={inboxFolder} />);
		const inboxItem = screen.getByTestId(`accordion-folder-item-${FOLDERS.INBOX}`);
		expect(inboxItem).toBeInTheDocument();
	});

	it('should show the InboxOutline icon for the inbox folder when there are no subfolders', () => {
		const inboxFolder = generateFolder({ id: FOLDERS.INBOX, isLink: false, children: [] });
		assert(inboxFolder, 'Inbox folder should be defined');

		setupTest(<AccordionCustomComponent item={inboxFolder} />);
		const inboxItem = screen.getByTestId(`accordion-folder-item-${FOLDERS.INBOX}`);
		expect(inboxItem).toBeInTheDocument();
		// eslint-disable-next-line testing-library/no-node-access
		expect(inboxItem.querySelector('svg')).toHaveAttribute('data-testid', 'icon: InboxOutline');
	});

	it('should show unread message count when there are unread messages in folder', () => {
		const inboxFolder = generateFolder({
			id: FOLDERS.INBOX,
			isLink: false,
			view: 'message',
			name: 'Inbox',
			u: 998,
			absFolderPath: '/inbox',
			n: 999
		});

		setupTest(<AccordionCustomComponent item={inboxFolder} />);
		const inboxItem = screen.getByTestId(`accordion-folder-item-${FOLDERS.INBOX}`);
		expect(inboxItem).toBeInTheDocument();
		expect(within(inboxItem).getByText(String(inboxFolder?.u ?? ''))).toBeInTheDocument();
	});

	it('should show max unread message count (999+) when there are unread messages in folder', () => {
		const inboxFolder = generateFolder({
			id: FOLDERS.INBOX,
			isLink: false,
			view: 'message',
			name: 'Inbox',
			u: 1000, // max counter trigger at 999
			absFolderPath: '/inbox',
			n: 999
		});

		setupTest(<AccordionCustomComponent item={inboxFolder} />);
		const inboxItem = screen.getByTestId(`accordion-folder-item-${FOLDERS.INBOX}`);
		expect(inboxItem).toBeInTheDocument();
		expect(within(inboxItem).getByText('999+')).toBeInTheDocument();
	});

	it('should show the icon with dot when subfolder has unread message ', () => {
		const inboxFolder = generateFolder({
			id: FOLDERS.INBOX,
			isLink: false,
			view: 'message',
			name: 'Inbox',
			u: 0,
			absFolderPath: '/inbox',
			n: 0,
			children: [
				generateFolder({
					id: '20',
					isLink: false,
					view: 'message',
					name: 'test',
					u: 1,
					absFolderPath: '/inbox/test'
				})
			]
		});

		setupTest(<AccordionCustomComponent item={inboxFolder} />);
		const inboxItem = screen.getByTestId(`accordion-folder-item-${FOLDERS.INBOX}`);
		expect(inboxItem).toBeInTheDocument();
		expect(within(inboxItem).getByTestId('icon: InboxOutlineWithDot')).toBeInTheDocument();
	});

	it('should not render broken shared folder', () => {
		const identity = createFakeIdentity();
		const folderLink = generateFolderLink('100', '101', identity);
		const brokenLinkFolder = { ...folderLink, isLink: true, broken: true };

		setupTest(<AccordionCustomComponent item={brokenLinkFolder} />);
		const folderAccordionItem = screen.queryByTestId(`accordion-folder-item-${folderLink.id}`);
		expect(folderAccordionItem).not.toBeInTheDocument();
	});

	it('should render accordion item with identity fullName when folder is ROOT', () => {
		const userRootFolder = generateFolder({
			id: FOLDERS.USER_ROOT,
			isLink: false,
			view: 'message',
			name: 'USER_ROOT',
			absFolderPath: '/'
		});

		const { identities } = getMocksContext();
		const { fullName } = identities.primary.identity;
		setupTest(<AccordionCustomComponent item={userRootFolder} />);
		const userRootItem = screen.getByTestId(`accordion-folder-item-${FOLDERS.USER_ROOT}`);
		expect(userRootItem).toBeInTheDocument();
		expect(within(userRootItem).getByText(fullName)).toBeInTheDocument();
	});
});
