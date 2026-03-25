/*
 * SPDX-FileCopyrightText: 2026 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import React from 'react';

import { act, screen, waitFor, within } from '@testing-library/react';
import { FOLDERS, useTagStore } from '@zextras/carbonio-ui-commons';
import { forEach, map, noop, reduce } from 'lodash';

import { setupTest } from '@test-setup';
import { tags } from '@test-utils/tags/tags';
import { ASSERTIONS, MSG_CONV_STATUS_DESCRIPTORS } from '__test__/constants';
import { generateConversation } from '__test__/generators/generateConversation';
import { generateMessage } from '__test__/generators/generateMessage';
import { FOLDERS_DESCRIPTORS, MessageActionsDescriptors } from 'constants/index';
import { updateConversations } from 'store/emails/store';
import { MailMessage } from 'types/messages';
import { MultipleSelectionActions } from 'views/app/folder-panel/parts/multiple-selection-actions';
import { MultipleSelectionActionsPanel } from 'views/app/folder-panel/parts/multiple-selection-actions-panel';

const generalFolders = {
	desc: 'general folders',
	value: [
		FOLDERS_DESCRIPTORS.INBOX.id,
		FOLDERS_DESCRIPTORS.SENT.id,
		FOLDERS_DESCRIPTORS.USER_DEFINED.id
	]
};
const foldersExcludedMarkReadUnread = {
	desc: 'folders excluded mark read unread',
	value: [FOLDERS_DESCRIPTORS.DRAFTS.id, FOLDERS_DESCRIPTORS.SPAM.id, FOLDERS_DESCRIPTORS.TRASH.id]
};
const foldersExcludedTrash = [FOLDERS_DESCRIPTORS.TRASH];
const foldersIncludedDeletePermanently = [FOLDERS_DESCRIPTORS.TRASH];
const foldersExcludedMoveToFolder = [FOLDERS_DESCRIPTORS.DRAFTS, FOLDERS_DESCRIPTORS.TRASH];

function getSelectedIds(messages: MailMessage[]): Array<string> {
	return messages.map((message) => message.id);
}

function getFoldersExcluded(
	_generalFolders: { desc: string; value: Array<string> },
	excludedFolder: string
): { desc: string; value: Array<string> } {
	return {
		...generalFolders,
		value: [...generalFolders.value, excludedFolder]
	};
}

function getFoldersAllowed(
	_generalFolders: { desc: string; value: Array<string> },
	excludedFolder: string
): { desc: string; value: Array<string> } {
	const filteredFolderValues = reduce(
		generalFolders.value,
		(acc, folder) => {
			if (!excludedFolder.includes(folder)) acc.push(folder);
			return acc;
		},
		[] as Array<string>
	);
	return {
		...generalFolders,
		value: filteredFolderValues
	};
}

const props = {
	items: [],
	selectAllModeOff: noop,
	setIsSelectModeOn: noop,
	folderId: '',
	isAllSelected: false,
	selectedIds: [],
	deselectAll: vi.fn(),
	selectAll: vi.fn()
};

describe('MultipleSelectionActions - conversations', () => {
	describe('Mark as read action', () => {
		it('should display "mark as unread" action if all selected items are read', async () => {
			await waitFor(() => {
				updateConversations([
					generateConversation({ id: '1', isRead: true }),
					generateConversation({ id: '2', isRead: true }),
					generateConversation({ id: '3', isRead: true })
				]);
			});
			setupTest(
				<MultipleSelectionActions type="conversation" ids={['1', '2']} folderId={'folder-1'} />
			);
			expect(screen.getByTestId('icon: EmailOutline')).toBeVisible();
		});

		it('should display "mark as read" action if any selected items is unread', async () => {
			await act(async () => {
				updateConversations([
					generateConversation({ id: '1', isRead: true }),
					generateConversation({ id: '2', isRead: false }),
					generateConversation({ id: '3', isRead: true })
				]);
			});
			setupTest(
				<MultipleSelectionActions type="conversation" ids={['1', '2']} folderId={'folder-1'} />
			);
			expect(screen.getByTestId('icon: EmailReadOutline')).toBeVisible();
		});
	});

	describe('Delete action', () => {
		it('should display "delete" action', async () => {
			await act(async () => {
				updateConversations([
					generateConversation({ id: '1' }),
					generateConversation({ id: '2' }),
					generateConversation({ id: '3' })
				]);
			});
			setupTest(
				<MultipleSelectionActions type="conversation" ids={['1', '2']} folderId={'folder-1'} />
			);
			expect(screen.getByTestId('icon: Trash2Outline')).toBeVisible();
		});
	});

	describe('More actions', () => {
		it('should contain "add flag" action if at least one conversation is not flagged', async () => {
			await act(async () => {
				updateConversations([
					generateConversation({ id: '1', isFlagged: true }),
					generateConversation({ id: '2', isFlagged: false }),
					generateConversation({ id: '3', isFlagged: true })
				]);
			});
			const { user } = setupTest(
				<MultipleSelectionActions type="conversation" ids={['1', '2']} folderId={'folder-1'} />
			);
			await user.click(screen.getByTestId('icon: MoreVertical'));
			expect(
				within(screen.getByTestId('dropdown-popper-list')).getByTestId('icon: FlagOutline')
			).toBeVisible();
		});

		it('should contain "remove flag" action if all conversations are flagged', async () => {
			updateConversations([
				generateConversation({ id: '1', isFlagged: true }),
				generateConversation({ id: '2', isFlagged: true }),
				generateConversation({ id: '3', isFlagged: true })
			]);
			const { user } = setupTest(
				<MultipleSelectionActions type="conversation" ids={['1', '2']} folderId={'folder-1'} />
			);
			await user.click(screen.getByTestId('icon: MoreVertical'));
			expect(
				within(screen.getByTestId('dropdown-popper-list')).getByTestId('icon: Flag')
			).toBeVisible();
		});

		it('should contain "move" action', async () => {
			updateConversations([
				generateConversation({ id: '1' }),
				generateConversation({ id: '2' }),
				generateConversation({ id: '3' })
			]);
			const { user } = setupTest(
				<MultipleSelectionActions type="conversation" ids={['1', '2']} folderId={'folder-1'} />
			);
			await user.click(screen.getByTestId('icon: MoreVertical'));
			expect(
				within(screen.getByTestId('dropdown-popper-list')).getByTestId('icon: MoveOutline')
			).toBeVisible();
		});

		it('should contain "delete permanently" action when in trash folder', async () => {
			await act(async () => {
				updateConversations([
					generateConversation({ id: '1' }),
					generateConversation({ id: '2' }),
					generateConversation({ id: '3' })
				]);
			});
			setupTest(
				<MultipleSelectionActions type="conversation" ids={['1', '2']} folderId={FOLDERS.TRASH} />
			);
			expect(screen.getByTestId('icon: DeletePermanentlyOutline')).toBeVisible();
		});

		it('should contain "mark as spam" action', async () => {
			updateConversations([
				generateConversation({ id: '1' }),
				generateConversation({ id: '2' }),
				generateConversation({ id: '3' })
			]);
			const { user } = setupTest(
				<MultipleSelectionActions type="conversation" ids={['1', '2']} folderId={'folder-1'} />
			);
			await user.click(screen.getByTestId('icon: MoreVertical'));
			expect(
				await within(screen.getByTestId('dropdown-popper-list')).findByText('Mark as spam')
			).toBeVisible();
		});

		it('should contain "mark as not spam" action when in spam folder', async () => {
			updateConversations([
				generateConversation({ id: '1' }),
				generateConversation({ id: '2' }),
				generateConversation({ id: '3' })
			]);
			const { user } = setupTest(
				<MultipleSelectionActions type="conversation" ids={['1', '2']} folderId={FOLDERS.SPAM} />
			);
			await user.click(screen.getByTestId('icon: MoreVertical'));
			expect(
				await within(screen.getByTestId('dropdown-popper-list')).findByText('Not spam')
			).toBeVisible();
		});

		it('should contain "tag" submenu item', async () => {
			const tagItems = map(tags, (tag) => tag.name);
			updateConversations([
				generateConversation({ id: '1', tags: tagItems }),
				generateConversation({ id: '2', tags: tagItems }),
				generateConversation({ id: '3' })
			]);
			useTagStore.setState({ tags });
			const { user } = setupTest(
				<MultipleSelectionActions type="conversation" ids={['1', '2']} folderId={FOLDERS.INBOX} />
			);
			await user.click(screen.getByTestId('icon: MoreVertical'));
			expect(
				within(screen.getByTestId('dropdown-popper-list')).getByTestId('icon: TagsMoreOutline')
			).toBeVisible();
		});
	});
});

describe('MultipleSelectionActions - messages - primary actions', () => {
	test.each`
		case | read                                    | excludedFolders                  | assertion                  | action
		${1} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${foldersExcludedMarkReadUnread} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${foldersExcludedMarkReadUnread} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${foldersExcludedMarkReadUnread} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${foldersExcludedMarkReadUnread} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
	`(
		`(case #$case) primary actions for a message in $folders.desc $assertion.desc the $action.desc action`,
		async ({ excludedFolders, action, read, assertion }) => {
			forEach(excludedFolders.value, (excludedFolder: string) => {
				const folders = getFoldersExcluded(generalFolders, excludedFolder);
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder, isRead: read.value })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					itemsIds: messages.map((m) => m.id),
					folderId: excludedFolder,
					selectedIds
				};

				setupTest(
					<MultipleSelectionActionsPanel {...testProps}>
						<MultipleSelectionActions type="message" ids={selectedIds} folderId={excludedFolder} />
					</MultipleSelectionActionsPanel>
				);
				expect(
					screen.queryByTestId(`primary-multi-action-button-${action.id}`)
				).not.toBeInTheDocument();
			});

			forEach(excludedFolders.value, (excludedFolder) => {
				const folders = getFoldersAllowed(generalFolders, excludedFolder);
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder, isRead: read.value })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					itemsIds: messages.map((m) => m.id),
					folderId: folders.value[0],
					selectedIds
				};

				setupTest(
					<MultipleSelectionActionsPanel {...testProps}>
						<MultipleSelectionActions type="message" ids={selectedIds} folderId={excludedFolder} />
					</MultipleSelectionActionsPanel>
				);
				if (assertion === true)
					expect(
						screen.getByTestId(`primary-multi-action-button-${action.id}`)
					).toBeInTheDocument();
				if (assertion === false)
					expect(
						screen.queryByTestId(`primary-multi-action-button-${action.id}`)
					).not.toBeInTheDocument();
			});
		}
	);

	test.each`
		case | excludedFolders         | assertion              | action
		${1} | ${foldersExcludedTrash} | ${ASSERTIONS.CONTAINS} | ${MessageActionsDescriptors.MOVE_TO_TRASH}
	`(
		`(case #$case) primary actions for a message in $folders.desc $assertion.desc the $action.desc action`,
		async ({ excludedFolders, action, assertion }) => {
			forEach(excludedFolders.value, (excludedFolder: string) => {
				const folders = getFoldersExcluded(generalFolders, excludedFolder);
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					itemsIds: messages.map((m) => m.id),
					folderId: excludedFolder,
					selectedIds
				};

				setupTest(
					<MultipleSelectionActionsPanel {...testProps}>
						<MultipleSelectionActions type="message" ids={selectedIds} folderId={excludedFolder} />
					</MultipleSelectionActionsPanel>
				);
				expect(
					screen.queryByTestId(`primary-multi-action-button-${action.id}`)
				).not.toBeInTheDocument();
			});

			forEach(excludedFolders.value, (excludedFolder) => {
				const folders = getFoldersAllowed(generalFolders, excludedFolder);
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					itemsIds: messages.map((m) => m.id),
					folderId: folders.value[0],
					selectedIds
				};

				setupTest(
					<MultipleSelectionActionsPanel {...testProps}>
						<MultipleSelectionActions type="message" ids={selectedIds} folderId={excludedFolder} />
					</MultipleSelectionActionsPanel>
				);
				if (assertion === true)
					expect(
						screen.getByTestId(`primary-multi-action-button-${action.id}`)
					).toBeInTheDocument();
				if (assertion === false)
					expect(
						screen.queryByTestId(`primary-multi-action-button-${action.id}`)
					).not.toBeInTheDocument();
			});
		}
	);

	test.each`
		case | excludedFolders                     | assertion              | action
		${1} | ${foldersIncludedDeletePermanently} | ${ASSERTIONS.CONTAINS} | ${MessageActionsDescriptors.DELETE_PERMANENTLY}
	`(
		`(case #$case) primary actions for a message in $folders.desc $assertion.desc the $action.desc action`,
		async ({ excludedFolders, action, assertion }) => {
			forEach(excludedFolders.value, (excludedFolder: string) => {
				const folders = getFoldersExcluded(generalFolders, excludedFolder);
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					itemsIds: messages.map((m) => m.id),
					folderId: excludedFolder,
					selectedIds
				};

				setupTest(
					<MultipleSelectionActionsPanel {...testProps}>
						<MultipleSelectionActions type="message" ids={selectedIds} folderId={excludedFolder} />
					</MultipleSelectionActionsPanel>
				);
				expect(
					screen.queryByTestId(`primary-multi-action-button-${action.id}`)
				).not.toBeInTheDocument();
			});

			forEach(excludedFolders.value, (excludedFolder) => {
				const folders = excludedFolder;
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					itemsIds: messages.map((m: MailMessage) => m.id),
					folderId: folders.value[0],
					selectedIds
				};

				setupTest(
					<MultipleSelectionActionsPanel {...testProps}>
						<MultipleSelectionActions type="message" ids={selectedIds} folderId={excludedFolder} />
					</MultipleSelectionActionsPanel>
				);
				if (assertion.value === true)
					expect(
						screen.getByTestId(`primary-multi-action-button-${action.id}`)
					).toBeInTheDocument();
				if (assertion.value === false)
					expect(
						screen.queryByTestId(`primary-multi-action-button-${action.id}`)
					).not.toBeInTheDocument();
			});
		}
	);
});

describe('MultipleSelectionActions - messages - secondary actions', () => {
	test.each`
		case | read                                    | excludedFolders                  | assertion                  | action
		${1} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${foldersExcludedMarkReadUnread} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_UNREAD}
		${2} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${foldersExcludedMarkReadUnread} | ${ASSERTIONS.CONTAINS}     | ${MessageActionsDescriptors.MARK_AS_READ}
		${3} | ${MSG_CONV_STATUS_DESCRIPTORS.READ}     | ${foldersExcludedMarkReadUnread} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_READ}
		${4} | ${MSG_CONV_STATUS_DESCRIPTORS.NOT_READ} | ${foldersExcludedMarkReadUnread} | ${ASSERTIONS.NOT_CONTAINS} | ${MessageActionsDescriptors.MARK_AS_UNREAD}
	`(
		`(case #$case) secondary actions for a message in $folders.desc $assertion.desc the $action.desc action`,
		async ({ excludedFolders, action, read, assertion }) => {
			forEach(excludedFolders.value, (excludedFolder: string) => {
				const folders = getFoldersExcluded(generalFolders, excludedFolder);
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder, isRead: read.value })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					itemsIds: messages.map((m) => m.id),
					folderId: excludedFolder,
					selectedIds
				};

				setupTest(
					<MultipleSelectionActionsPanel {...testProps}>
						<MultipleSelectionActions type="message" ids={selectedIds} folderId={excludedFolder} />
					</MultipleSelectionActionsPanel>
				);
				expect(
					screen.queryByTestId(`primary-multi-action-button-${action.id}`)
				).not.toBeInTheDocument();
			});

			forEach(excludedFolders.value, (excludedFolder) => {
				const folders = getFoldersAllowed(generalFolders, excludedFolder);
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder, isRead: read.value })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					itemsIds: messages.map((m) => m.id),
					folderId: folders.value[0],
					selectedIds
				};

				setupTest(
					<MultipleSelectionActionsPanel {...testProps}>
						<MultipleSelectionActions type="message" ids={selectedIds} folderId={excludedFolder} />
					</MultipleSelectionActionsPanel>
				);
				if (assertion === true)
					expect(
						screen.getByTestId(`primary-multi-action-button-${action.id}`)
					).toBeInTheDocument();
				if (assertion === false)
					expect(
						screen.queryByTestId(`primary-multi-action-button-${action.id}`)
					).not.toBeInTheDocument();
			});
		}
	);

	test.each`
		case | excludedFolders                | action
		${1} | ${foldersExcludedMoveToFolder} | ${MessageActionsDescriptors.MOVE}
	`(
		`(case #$case) primary actions for a message in $folders.desc $assertion.desc the $action.desc action`,
		async ({ excludedFolders, action }) => {
			forEach(excludedFolders.value, (excludedFolder: string) => {
				const folders = getFoldersExcluded(generalFolders, excludedFolder);
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					itemsIds: messages.map((m) => m.id),
					folderId: excludedFolder,
					selectedIds
				};

				setupTest(
					<MultipleSelectionActionsPanel {...testProps}>
						<MultipleSelectionActions type="message" ids={selectedIds} folderId={excludedFolder} />
					</MultipleSelectionActionsPanel>
				);
				expect(
					screen.queryByTestId(`primary-multi-action-button-${action.id}`)
				).not.toBeInTheDocument();
			});

			forEach(excludedFolders.value, (excludedFolder) => {
				const folders = getFoldersAllowed(generalFolders, excludedFolder);
				const messages = folders.value.map((folder: string) =>
					generateMessage({ folderId: folder })
				);
				const selectedIds = getSelectedIds(messages);
				const testProps = {
					...props,
					itemsIds: messages.map((m) => m.id),
					folderId: folders.value[0],
					selectedIds
				};

				setupTest(
					<MultipleSelectionActionsPanel {...testProps}>
						<MultipleSelectionActions type="message" ids={selectedIds} folderId={excludedFolder} />
					</MultipleSelectionActionsPanel>
				);
				expect(screen.getByTestId(`primary-multi-action-button-${action.id}`)).toBeInTheDocument();
			});
		}
	);
});
