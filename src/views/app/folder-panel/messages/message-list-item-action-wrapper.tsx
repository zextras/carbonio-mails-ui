/*
 * SPDX-FileCopyrightText: 2024 Zextras <https://www.zextras.com>
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import React, { ReactNode, useMemo } from 'react';

import { ContainerProps } from '@zextras/carbonio-design-system';
import { useTranslation } from 'react-i18next';

import { normalizeDropdownActionItem } from 'helpers/actions';
import { isDraft } from 'helpers/folders';
import { useMsgActions } from 'hooks/actions/use-msg-actions';
import { useTagDropdownItem } from 'hooks/use-tag-dropdown-item';
import { MailMessage } from 'types/messages';
import { HoverBarContainer } from 'views/app/folder-panel/parts/hover-bar-container';
import { HoverContainer } from 'views/app/folder-panel/parts/hover-container';
import { ListItemDropdownAction } from 'views/app/folder-panel/parts/list-item-dropdown-action';
import { ListItemHoverActions } from 'views/app/folder-panel/parts/list-item-hover-actions';

type MessageListItemActionWrapperProps = {
	children?: ReactNode;
	onClick?: ContainerProps['onClick'];
	onDoubleClick?: ContainerProps['onDoubleClick'];
	shouldReplaceHistory?: boolean;
	active?: boolean;
	item: MailMessage;
};

export const MessageListItemActionWrapper = ({
	item,
	active,
	onClick,
	onDoubleClick,
	shouldReplaceHistory,
	children
}: MessageListItemActionWrapperProps): React.JSX.Element => {
	const {
		replyDescriptor,
		replyAllDescriptor,
		forwardDescriptor,
		forwardAsAttachmentDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		messageReadDescriptor,
		messageUnreadDescriptor,
		flagDescriptor,
		unflagDescriptor,
		markAsSpamDescriptor,
		markAsNotSpamDescriptor,
		applyTagDescriptor,
		moveToFolderDescriptor,
		restoreFolderDescriptor,
		createAppointmentDescriptor,
		printDescriptor,
		previewOnSeparatedWindowDescriptor,
		redirectDescriptor,
		editDraftDescriptor,
		editAsNewDescriptor,
		showOriginalDescriptor,
		downloadEmlDescriptor,
		archiveDescriptor
	} = useMsgActions({ message: item, shouldReplaceHistory });

	const tagItem = useTagDropdownItem(applyTagDescriptor, item.tags);
	const draftItem = isDraft(item.parent);
	const [t] = useTranslation();

	const dropdownItems = useMemo(
		() =>
			[
				normalizeDropdownActionItem(replyDescriptor),
				normalizeDropdownActionItem(replyAllDescriptor),
				{
					id: 'ForwardMenu',
					icon: 'Forward',
					label: t('action.forward', 'Forward'),
					items: [
						normalizeDropdownActionItem(forwardDescriptor),
						normalizeDropdownActionItem(forwardAsAttachmentDescriptor)
					]
				},
				normalizeDropdownActionItem(archiveDescriptor),
				normalizeDropdownActionItem(moveToTrashDescriptor),
				normalizeDropdownActionItem(deletePermanentlyDescriptor),
				normalizeDropdownActionItem(messageReadDescriptor),
				normalizeDropdownActionItem(messageUnreadDescriptor),
				normalizeDropdownActionItem(flagDescriptor),
				normalizeDropdownActionItem(unflagDescriptor),
				normalizeDropdownActionItem(markAsSpamDescriptor),
				normalizeDropdownActionItem(markAsNotSpamDescriptor),
				tagItem,
				normalizeDropdownActionItem(moveToFolderDescriptor),
				normalizeDropdownActionItem(restoreFolderDescriptor),
				normalizeDropdownActionItem(createAppointmentDescriptor),
				normalizeDropdownActionItem(printDescriptor),
				normalizeDropdownActionItem(previewOnSeparatedWindowDescriptor),
				normalizeDropdownActionItem(redirectDescriptor),
				normalizeDropdownActionItem(editDraftDescriptor),
				normalizeDropdownActionItem(editAsNewDescriptor),
				normalizeDropdownActionItem(showOriginalDescriptor),
				normalizeDropdownActionItem(downloadEmlDescriptor)
			].filter((action) => !action.disabled && !(draftItem && action.id === 'ForwardMenu')),
		[
			replyDescriptor,
			replyAllDescriptor,
			t,
			forwardDescriptor,
			forwardAsAttachmentDescriptor,
			moveToTrashDescriptor,
			deletePermanentlyDescriptor,
			messageReadDescriptor,
			messageUnreadDescriptor,
			flagDescriptor,
			unflagDescriptor,
			markAsSpamDescriptor,
			markAsNotSpamDescriptor,
			tagItem,
			moveToFolderDescriptor,
			restoreFolderDescriptor,
			createAppointmentDescriptor,
			printDescriptor,
			previewOnSeparatedWindowDescriptor,
			redirectDescriptor,
			editDraftDescriptor,
			editAsNewDescriptor,
			showOriginalDescriptor,
			downloadEmlDescriptor,
			archiveDescriptor,
			draftItem
		]
	);

	const hoverActions = [
		archiveDescriptor,
		moveToTrashDescriptor,
		deletePermanentlyDescriptor,
		messageReadDescriptor,
		messageUnreadDescriptor,
		flagDescriptor,
		unflagDescriptor
	];

	return (
		<ListItemDropdownAction dropdownActions={dropdownItems}>
			<HoverContainer
				data-testid={`hover-container-${item.id}`}
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
					data-testid={`primary-actions-bar-${item.id}`}
					gap={'0.25rem'}
				>
					<ListItemHoverActions actions={hoverActions} />
				</HoverBarContainer>
			</HoverContainer>
		</ListItemDropdownAction>
	);
};
