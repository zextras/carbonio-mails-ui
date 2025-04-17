/*
 * SPDX-FileCopyrightText: 2023 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React from 'react';

import { faker } from '@faker-js/faker';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { noop } from 'lodash';

import { FOLDERS } from '../../../../../carbonio-ui-commons/constants/folders';
import { ParticipantRole } from '../../../../../carbonio-ui-commons/constants/participants';
import { useTagStore } from '../../../../../carbonio-ui-commons/store/zustand/tags';
import { generateFolders } from '../../../../../carbonio-ui-commons/test/mocks/folders/folders-generator';
import { tags as mockTags } from '../../../../../carbonio-ui-commons/test/mocks/tags/tags';
import { setupTest } from '../../../../../carbonio-ui-commons/test/test-setup';
import type { Folder } from '../../../../../carbonio-ui-commons/types/folder';
import { FOLDERS_DESCRIPTORS } from '../../../../../constants';
import { setMessagesInEmailStore } from '../../../../../store/emails/store';
import { ASSERTIONS } from '../../../../../tests/constants';
import { generateMessage } from '../../../../../tests/generators/generateMessage';
import type { MessageListItemProps } from '../../../../../types';
import { MessageListItem } from '../message-list-item';

describe.each`
	type                     | isSearchModule
	${'message list'}        | ${false}
	${'search message list'} | ${true}
`('$type list item component', ({ isSearchModule }) => {
	// Workaround
	// FIXME extend the implementation in commons for the folders mocks
	const userFolder: Folder = {
		isLink: false,
		id: FOLDERS_DESCRIPTORS.USER_DEFINED.id,
		uuid: faker.string.uuid(),
		name: FOLDERS_DESCRIPTORS.USER_DEFINED.desc,
		activesyncdisabled: false,
		recursive: false,
		deletable: true,
		depth: 1,
		children: []
	};

	const folders = {
		...generateFolders(),
		[FOLDERS_DESCRIPTORS.USER_DEFINED.id]: userFolder
	};
	const mockedFolders = generateFolders();
	const useFolder = jest.fn((id: string) => mockedFolders[id]);
	useFolder.mockImplementation((folderId) => folders[folderId]);

	describe('in any folders', () => {
		test.each`
			case | folder                              | assertion
			${1} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.IS_VISIBLE}
			${1} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.IS_VISIBLE}
		`(
			`(case #$case) the avatar $assertion.desc for a message in $folder.desc folder`,
			async ({ folder, assertion }) => {
				useTagStore.setState({ tags: mockTags });
				const message = generateMessage({ folderId: folder.id });

				setMessagesInEmailStore([message], false);
				const props: MessageListItemProps = {
					message,
					selected: false,
					selecting: false,
					isConvChildren: false,
					visible: true,
					active: true,
					toggle: noop,
					deselectAll: noop,
					isSearchModule,
					currentFolderId: folder.id
				};

				setupTest(<MessageListItem {...props} />);

				const avatar = screen.queryByTestId('AvatarContainer');
				assertion.value ? expect(avatar).toBeVisible() : expect(avatar).not.toBeInTheDocument();
			}
		);

		test.each`
			case | folder                              | assertion
			${2} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.IS_VISIBLE}
			${2} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.IS_VISIBLE}
		`(
			`(case #$case) the date $assertion.desc for a message in $folder.desc folder`,
			async ({ folder, assertion }) => {
				useTagStore.setState({ tags: mockTags });
				const receiveDate = Date.parse('2023-04-07T12:59:06');
				const message = generateMessage({ receiveDate, folderId: folder.id });
				setMessagesInEmailStore([message], false);

				const props: MessageListItemProps = {
					message,
					selected: false,
					selecting: false,
					isConvChildren: false,
					visible: true,
					active: true,
					toggle: noop,
					deselectAll: noop,
					isSearchModule,
					currentFolderId: folder.id
				};

				setupTest(<MessageListItem {...props} />);

				const dateLabel = screen.queryByTestId('DateLabel');
				if (assertion.value) {
					expect(dateLabel).toBeVisible();
				} else {
					expect(dateLabel).not.toBeInTheDocument();
				}
			}
		);

		test.each`
			case | folder                              | assertion
			${3} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.IS_VISIBLE}
			${3} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.IS_VISIBLE}
		`(
			`(case #$case) if set, the subject $assertion.desc for a message in $folder.desc folder`,
			async ({ folder, assertion }) => {
				useTagStore.setState({ tags: mockTags });
				const subject = 'This is an interesting subject';
				const message = generateMessage({ subject, folderId: folder.id });
				setMessagesInEmailStore([message], false);

				const props: MessageListItemProps = {
					message,
					selected: false,
					selecting: false,
					isConvChildren: false,
					visible: true,
					active: true,
					toggle: noop,
					deselectAll: noop,
					isSearchModule,
					currentFolderId: folder.id
				};

				setupTest(<MessageListItem {...props} />);

				const subjectLabel = screen.queryByTestId('Subject');
				if (assertion.value) {
					expect(subjectLabel).toBeVisible();
					expect(subjectLabel).toHaveTextContent(subject);
				} else {
					expect(subjectLabel).not.toBeInTheDocument();
				}
			}
		);

		test.each`
			case | folder                              | assertion
			${4} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.IS_VISIBLE}
			${4} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.IS_VISIBLE}
		`(
			`(case #$case) if set, the subject $assertion.desc for a message in $folder.desc folder`,
			async ({ folder, assertion }) => {
				useTagStore.setState({ tags: mockTags });
				const subject = '';
				const message = generateMessage({ subject, folderId: folder.id });
				setMessagesInEmailStore([message], false);

				const props: MessageListItemProps = {
					message,
					selected: false,
					selecting: false,
					isConvChildren: false,
					visible: true,
					active: true,
					toggle: noop,
					deselectAll: noop,
					isSearchModule,
					currentFolderId: folder.id
				};

				setupTest(<MessageListItem {...props} />);

				const subjectLabel = screen.queryByTestId('Subject');
				if (assertion.value) {
					expect(subjectLabel).toBeVisible();
					expect(subjectLabel).toHaveTextContent('label.no_subject_with_tags');
				} else {
					expect(subjectLabel).not.toBeInTheDocument();
				}
			}
		);

		test.each`
			case | folder                              | assertion
			${5} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${ASSERTIONS.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.SENT}         | ${ASSERTIONS.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${ASSERTIONS.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${ASSERTIONS.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${ASSERTIONS.IS_VISIBLE}
			${5} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${ASSERTIONS.IS_VISIBLE}
		`(
			`(case #$case) the sender label $assertion.desc for a message in $folder.desc folder`,
			async ({ folder, assertion }) => {
				useTagStore.setState({ tags: mockTags });
				const message = generateMessage({ folderId: folder.id });
				setMessagesInEmailStore([message], false);

				const props: MessageListItemProps = {
					message,
					selected: false,
					selecting: false,
					isConvChildren: false,
					visible: true,
					active: true,
					toggle: noop,
					deselectAll: noop,
					isSearchModule,
					currentFolderId: folder.id
				};

				setupTest(<MessageListItem {...props} />);

				const senderLabel = screen.queryByTestId('participants-name-label');
				if (assertion.value) {
					expect(senderLabel).toBeVisible();
				} else {
					expect(senderLabel).not.toBeInTheDocument();
				}
			}
		);

		test.each`
			case | folder                              | senderAddress      | labelContent
			${6} | ${FOLDERS_DESCRIPTORS.INBOX}        | ${'luigi@foo.bar'} | ${'luigi'}
			${6} | ${FOLDERS_DESCRIPTORS.DRAFTS}       | ${'luigi@foo.bar'} | ${'luigi'}
			${6} | ${FOLDERS_DESCRIPTORS.TRASH}        | ${'luigi@foo.bar'} | ${'luigi'}
			${6} | ${FOLDERS_DESCRIPTORS.SPAM}         | ${'luigi@foo.bar'} | ${'luigi'}
			${6} | ${FOLDERS_DESCRIPTORS.USER_DEFINED} | ${'luigi@foo.bar'} | ${'luigi'}
		`(
			`(case #$case) the sender name must contain the sender name for a message in $folder.desc folder`,
			async ({ folder, senderAddress, labelContent }) => {
				useTagStore.setState({ tags: mockTags });
				const from = { type: ParticipantRole.FROM, address: senderAddress };
				const message = generateMessage({ from, folderId: folder.id });
				setMessagesInEmailStore([message], false);

				const props: MessageListItemProps = {
					message,
					selected: false,
					selecting: false,
					isConvChildren: false,
					visible: true,
					active: true,
					toggle: noop,
					deselectAll: noop,
					isSearchModule,
					currentFolderId: folder.id
				};

				setupTest(<MessageListItem {...props} />);

				const senderLabel = screen.queryByTestId('participants-name-label');
				expect(senderLabel).toHaveTextContent(labelContent);
			}
		);

		test.todo('(case #7) hovering on the message the primary actions container must be visible');
		// test('(case #7) hovering on the message the primary actions container must be visible', async () => {
		// 	const folderId = FOLDERS.INBOX;
		// 	const msg = generateMessage({ folderId });
		// 	const msgId = msg.id;
		//
		// 	const props: MessageListItemProps = {
		// 		item: msg,
		// 		selected: false,
		// 		selecting: false,
		// 		isConvChildren: false,
		// 		visible: true,
		// 		active: true,
		// 		toggle: noop,
		// 		deselectAll: noop,
		// 		currentFolderId: folderId
		// 	};
		//
		// 	const store = generateStore({
		// 		messages: {
		// 			searchedInFolder: {},
		// 			messages: [msg],
		// 			searchRequestStatus: null
		// 		}
		// 	});
		//
		// 	const { user } = setupTest(<MessageListItem {...props} />, );
		//
		// 	const actionsBar = await screen.findByTestId(`primary-actions-bar-${msgId}`);
		// 	const container = await screen.findByTestId(`hover-container-${msgId}`);
		// 	const aRandomChild = await screen.findByTestId('message-list-item-avatar');
		//
		// 	expect(actionsBar).not.toBeVisible();
		// 	// act(() => {
		// 	// 	user.pointer({ target: container });
		// 	// });
		// 	user.hover(aRandomChild);
		//
		// 	// act(() => {
		// 	// 	user.hover(container);
		// 	// });
		// 	expect(actionsBar).toBeVisible();
		// });

		test('(case #8) when right-click the message the secondary actions contextual menu must be visible', async () => {
			const folderId = FOLDERS.INBOX;
			const message = generateMessage({ folderId });
			const messageId = message.id;
			setMessagesInEmailStore([message], false);

			const props: MessageListItemProps = {
				message,
				selected: false,
				selecting: false,
				isConvChildren: false,
				visible: true,
				active: true,
				toggle: noop,
				deselectAll: noop,
				isSearchModule,
				currentFolderId: folderId
			};

			const { user } = setupTest(<MessageListItem {...props} />);
			const actionWrapper = await screen.findByTestId(`MessageListItem-${props.message.id}`);

			user.hover(actionWrapper);

			const aRandomChild = await screen.findByTestId(`hover-container-${messageId}`);

			// Initally the context menu is not created
			expect(screen.queryByTestId('dropdown-popper-list')).not.toBeInTheDocument();

			// Trigger a right-click
			fireEvent.contextMenu(aRandomChild);

			const menu = await screen.findByTestId('dropdown-popper-list');
			expect(menu).toBeVisible();
		});
	});
});

describe('in the drafts folder', () => {
	const folderId = FOLDERS.DRAFTS;
	it('should make the draft label visible', async () => {
		const message = generateMessage({ folderId, isDraft: true });
		setMessagesInEmailStore([message], false);

		const props: MessageListItemProps = {
			message,
			selected: false,
			selecting: false,
			isConvChildren: false,
			visible: true,
			active: true,
			toggle: noop,
			deselectAll: noop,
			isSearchModule: false,
			currentFolderId: folderId
		};

		await waitFor(() => {
			setupTest(<MessageListItem {...props} />);
		});

		expect(await screen.findByText('label.draft_folder')).toBeVisible();
	});
	it('should not make the draft label visible', async () => {
		const message = generateMessage({ folderId });
		setMessagesInEmailStore([message], false);

		const props: MessageListItemProps = {
			message,
			selected: false,
			selecting: false,
			isConvChildren: false,
			visible: true,
			active: true,
			toggle: noop,
			deselectAll: noop,
			isSearchModule: true,
			currentFolderId: folderId
		};

		setupTest(<MessageListItem {...props} />);
		expect(screen.queryByText('label.draft_folder')).not.toBeInTheDocument();
	});

	// TODO add the following test parameters:
	// ${0} | ${'search message list'} | ${true}        | ${ASSERTIONS.IS_VISIBLE}
	test.each`
		case | listType          | isSearchModule | assertion
		${2} | ${'message list'} | ${false}       | ${ASSERTIONS.IS_VISIBLE}
	`(
		"(case #$case) in a $listType item the recipients' names, if set, $assertion.desc",
		async ({ isSearchModule, assertion }) => {
			const to = [
				{ type: ParticipantRole.TO, address: 'mario@foo.bar' },
				{ type: ParticipantRole.TO, address: 'luigi@foo.bar' }
			];
			const message = generateMessage({ to, folderId });
			setMessagesInEmailStore([message], false);

			const props: MessageListItemProps = {
				message,
				selected: false,
				selecting: false,
				isConvChildren: false,
				visible: true,
				active: true,
				toggle: noop,
				deselectAll: noop,
				isSearchModule,
				currentFolderId: folderId
			};

			setupTest(<MessageListItem {...props} />);
			if (assertion.value) {
				const participantsLabel = screen.getByTestId('participants-name-label');
				expect(participantsLabel).toHaveTextContent('mario');
				expect(participantsLabel).toHaveTextContent('luigi');
			} else {
				expect(screen.queryByTestId('participants-name-label')).not.toBeInTheDocument();
			}
		}
	);

	test.each`
		case | listType                 | isSearchModule | assertion
		${3} | ${'message list'}        | ${false}       | ${ASSERTIONS.IS_VISIBLE}
		${0} | ${'search message list'} | ${true}        | ${ASSERTIONS.IS_VISIBLE}
	`(
		'(case #$case) in a $listType item, if the body content is set, the fragment $assertion.desc',
		async ({ isSearchModule, assertion }) => {
			const body = 'Message body content';
			const message = generateMessage({ body, folderId });
			setMessagesInEmailStore([message], false);

			const props: MessageListItemProps = {
				message,
				selected: false,
				selecting: false,
				isConvChildren: false,
				visible: true,
				active: true,
				toggle: noop,
				deselectAll: noop,
				isSearchModule,
				currentFolderId: folderId
			};

			setupTest(<MessageListItem {...props} />);
			if (assertion.value) {
				const fragment = screen.getByTestId('Fragment');
				expect(fragment).toHaveTextContent(body);
			} else {
				expect(screen.queryByTestId('Fragment')).not.toBeInTheDocument();
			}
		}
	);
});

describe('in the trash folder', () => {
	const folderId = FOLDERS.TRASH;

	test("(case #2) in a message item the senders' name, if set, is visible", async () => {
		const to = [{ type: ParticipantRole.FROM, address: 'mario@foo.bar' }];
		const message = generateMessage({ to, folderId });

		const props: MessageListItemProps = {
			message,
			selected: false,
			selecting: false,
			isConvChildren: false,
			visible: true,
			active: true,
			toggle: noop,
			deselectAll: noop,
			currentFolderId: folderId
		};
		useTagStore.setState({ tags: mockTags });
		setMessagesInEmailStore([message], false);
		setupTest(<MessageListItem {...props} />);
		const participantsLabel = screen.getByTestId('participants-name-label');
		expect(participantsLabel).toHaveTextContent('mario');
	});

	test.each`
		case | listType                 | isSearchModule | assertion
		${3} | ${'message list'}        | ${false}       | ${ASSERTIONS.IS_VISIBLE}
		${0} | ${'search message list'} | ${true}        | ${ASSERTIONS.IS_VISIBLE}
	`(
		'(case #$case) in a $listType item, if the body content is set, the fragment $assertion.desc',
		async ({ isSearchModule, assertion }) => {
			const body = 'Message body content';
			const message = generateMessage({ body, folderId });

			setMessagesInEmailStore([message], false);
			const props: MessageListItemProps = {
				message,
				selected: false,
				selecting: false,
				isConvChildren: false,
				visible: true,
				active: true,
				toggle: noop,
				deselectAll: noop,
				isSearchModule,
				currentFolderId: folderId
			};

			setupTest(<MessageListItem {...props} />);
			if (assertion.value) {
				const fragment = screen.getByTestId('Fragment');
				expect(fragment).toHaveTextContent(body);
			} else {
				expect(screen.queryByTestId('Fragment')).not.toBeInTheDocument();
			}
		}
	);
});
