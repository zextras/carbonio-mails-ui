/*
 * SPDX-FileCopyrightText: 2025 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactNode, useMemo } from 'react';

import { ContainerProps, Dropdown } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { normalizeDropdownActionItem } from 'helpers/actions';
import { useConvActions } from 'hooks/actions/use-conv-actions';
import { useTagDropdownItem } from 'hooks/use-tag-dropdown-item';
import { NormalizedConversation } from 'types/conversations';
import { HoverBarContainer } from 'views/app/folder-panel/parts/hover-bar-container';
import { HoverContainer } from 'views/app/folder-panel/parts/hover-container';
import { ListItemHoverActions } from 'views/app/folder-panel/parts/list-item-hover-actions';

export const ConversationListItemActionWrapper = ({
	conversation,
	active,
	onClick,
	onDoubleClick,
	children
}: {
	children?: ReactNode;
	onClick?: ContainerProps['onClick'];
	onDoubleClick?: ContainerProps['onDoubleClick'];
	active?: boolean;
	conversation: NormalizedConversation;
}): React.JSX.Element => {
	const [t] = useTranslation();
	const {
		replyDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		forwardAsAttachmentDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		setAsReadDescriptor,
		setAsUnreadDescriptor,
		setFlagDescriptor,
		unflagDescriptor,
		markAsSpamDescriptor,
		markAsNotSpamDescriptor,
		applyTagDescriptor,
		moveToFolderDescriptor,
		restoreFolderDescriptor,
		printDescriptor,
		previewOnSeparatedWindowDescriptor,
		showOriginalDescriptor,
		archiveDescriptor
	} = useConvActions({
		conversation
	});

	const hoverActions = useMemo(
		() => [
			archiveDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			setAsReadDescriptor,
			setAsUnreadDescriptor,
			setFlagDescriptor,
			unflagDescriptor,
			restoreFolderDescriptor
		],
		[
			archiveDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			setAsReadDescriptor,
			setAsUnreadDescriptor,
			setFlagDescriptor,
			unflagDescriptor,
			restoreFolderDescriptor
		]
	);

	const tagItem = useTagDropdownItem(applyTagDescriptor, conversation.tags);

	const dropdownItems = useMemo(
		() =>
			[
				normalizeDropdownActionItem(replyDescriptor),
				normalizeDropdownActionItem(replyAllDescriptor),
				{
					id: 'ForwardMenu',
					icon: 'Forward',
					label: t('action.forward', 'Forward'),
					disabled: !forwardDescriptor.canExecute() && !forwardAsAttachmentDescriptor.canExecute(),
					items: [
						normalizeDropdownActionItem(forwardDescriptor),
						normalizeDropdownActionItem(forwardAsAttachmentDescriptor)
					]
				},
				normalizeDropdownActionItem(archiveDescriptor),
				normalizeDropdownActionItem(moveToTrashDescriptor),
				normalizeDropdownActionItem(deletePermanentlyDescriptor),
				normalizeDropdownActionItem(setAsReadDescriptor),
				normalizeDropdownActionItem(setAsUnreadDescriptor),
				normalizeDropdownActionItem(setFlagDescriptor),
				normalizeDropdownActionItem(unflagDescriptor),
				normalizeDropdownActionItem(markAsSpamDescriptor),
				normalizeDropdownActionItem(markAsNotSpamDescriptor),
				tagItem,
				normalizeDropdownActionItem(moveToFolderDescriptor),
				normalizeDropdownActionItem(restoreFolderDescriptor),
				normalizeDropdownActionItem(printDescriptor),
				normalizeDropdownActionItem(previewOnSeparatedWindowDescriptor),
				normalizeDropdownActionItem(showOriginalDescriptor)
			].filter((action) => !action.disabled),
		[
			replyDescriptor,
			replyAllDescriptor,
			forwardDescriptor,
			forwardAsAttachmentDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			setAsReadDescriptor,
			setAsUnreadDescriptor,
			setFlagDescriptor,
			unflagDescriptor,
			markAsSpamDescriptor,
			markAsNotSpamDescriptor,
			tagItem,
			moveToFolderDescriptor,
			restoreFolderDescriptor,
			printDescriptor,
			previewOnSeparatedWindowDescriptor,
			showOriginalDescriptor,
			archiveDescriptor,
			t
		]
	);

	return (
		<Dropdown
			contextMenu
			items={dropdownItems}
			display="block"
			style={{ width: '100%', height: '4rem' }}
			data-testid={`secondary-actions-menu-${conversation.id}`}
		>
			<HoverContainer
				data-testid={`hover-container-${conversation.id}`}
				orientation="horizontal"
				mainAlignment="flex-start"
				crossAlignment="unset"
				onClick={onClick}
				onDoubleClick={onDoubleClick}
				$hoverBackground={active ? 'highlight' : 'gray6'}
			>
				{children}
				<HoverBarContainer
					orientation="horizontal"
					mainAlignment="flex-end"
					crossAlignment="center"
					$hoverBackground={active ? 'highlight' : 'gray6'}
					data-testid={`primary-actions-bar-${conversation.id}`}
					gap={'0.25rem'}
				>
					<ListItemHoverActions actions={hoverActions} />
				</HoverBarContainer>
			</HoverContainer>
		</Dropdown>
	);
};
