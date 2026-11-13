/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { fireEvent, screen, within } from '@testing-library/react';
import { FOLDERS, ROOT_NAME } from '@zextras/carbonio-ui-commons';
import assert from 'node:assert';

import { setupTest } from '@test-setup';
import { createFakeIdentity } from '@test-utils/accounts/fakeAccounts';
import { generateFolder, generateFolderLink } from '@test-utils/folders/folders-generator';
import { createSoapAPIInterceptor } from '@test-utils/network/msw/create-api-interceptor';
import { getMocksContext } from '@test-utils/utils/mocks-context';
import { generateConversation } from '__test__/generators/generateConversation';
import { ConvActionRequest, ConvActionResponse } from 'types/soap/conv-action';
import { DragItemWrapper } from 'views/app/folder-panel/parts/drag-item-wrapper';
import { AccordionCustomComponent } from 'views/sidebar/accordion-custom-component';

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

		setupTest(<AccordionCustomComponent item={inboxFolder} />);
		const inboxItem = screen.getByTestId(`accordion-folder-item-${FOLDERS.INBOX}`);

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

	it('should render accordion item with identity fullName when folder is USER_ROOT', () => {
		const userRootFolder = generateFolder({
			id: FOLDERS.USER_ROOT,
			isLink: false,
			view: 'message',
			name: ROOT_NAME,
			absFolderPath: '/'
		});

		const { identities } = getMocksContext();
		const { fullName } = identities.primary.identity;
		setupTest(<AccordionCustomComponent item={userRootFolder} />);
		const userRootItem = screen.getByTestId(`accordion-folder-item-${FOLDERS.USER_ROOT}`);

		expect(within(userRootItem).getByText(fullName)).toBeInTheDocument();
	});

	it('should display Drafts folder counter on shared Account', () => {
		const identity = createFakeIdentity();
		const sharedDraft = {
			...generateFolderLink('100', '101', identity),
			absFolderPath: '/Drafts',
			id: FOLDERS.DRAFTS,
			n: 87
		};

		setupTest(<AccordionCustomComponent item={sharedDraft} />);

		expect(screen.getByText(87)).toBeInTheDocument();
	});

	describe('dropping a conversation on the folder', () => {
		const destinationFolder = generateFolder({
			id: '7001',
			name: 'Projects',
			absFolderPath: '/Projects',
			parent: FOLDERS.USER_ROOT,
			isLink: false
		});

		const setupDraggedConversationAndFolder = (openFolderId: string): string => {
			const conversation = {
				...generateConversation({ folderId: openFolderId, messageGenerationCount: 2 }),
				parent: openFolderId
			};
			setupTest(
				<>
					<DragItemWrapper
						item={conversation}
						selectedIds={[]}
						selectedItems={{}}
						deselectAll={vi.fn()}
						setDraggedIds={vi.fn()}
						dragImageRef={undefined}
						dragAndDropIsDisabled={false}
					>
						<div data-testid="dragged-conversation">{conversation.subject}</div>
					</DragItemWrapper>
					<AccordionCustomComponent item={destinationFolder} />
				</>,
				{ initialEntries: [`/folder/${openFolderId}`], path: '/folder/:folderId/*' }
			);
			return conversation.id;
		};

		// The design system Drag and Drop listen to the native drag events, which user-event cannot fire
		const dragConversationOntoFolder = (): void => {
			const dataTransfer = { dropEffect: 'move', setDragImage: vi.fn() };
			const dropZone = screen.getByTestId('drop');
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.dragStart(screen.getByTestId('dragged-conversation'), { dataTransfer });
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.dragEnter(dropZone, { dataTransfer });
			// eslint-disable-next-line testing-library/prefer-user-event
			fireEvent.drop(dropZone, { dataTransfer });
		};

		it.each`
			openFolder | openFolderId     | tcon
			${'Inbox'} | ${FOLDERS.INBOX} | ${'o'}
			${'Sent'}  | ${FOLDERS.SENT}  | ${'s'}
			${'Junk'}  | ${FOLDERS.SPAM}  | ${'j'}
		`(
			'should move only the messages in the group of the open folder ($openFolder, tcon $tcon)',
			async ({ openFolderId, tcon }) => {
				const interceptor = createSoapAPIInterceptor<ConvActionRequest, ConvActionResponse>(
					'ConvAction',
					{ action: { id: '1', op: 'move' } }
				);
				const conversationId = setupDraggedConversationAndFolder(openFolderId);

				dragConversationOntoFolder();

				const request = await interceptor;
				expect(request.action).toEqual({
					id: conversationId,
					op: 'move',
					l: destinationFolder.id,
					tcon
				});
			}
		);
	});
});
